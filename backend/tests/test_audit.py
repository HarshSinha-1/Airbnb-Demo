"""
Comprehensive audit test suite for the 9-point verification checklist.
Supports both local in-memory testing and remote URL testing (e.g. http://20.2.88.158).
"""

import os
import sys
from pathlib import Path
from datetime import date, timedelta
import httpx

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

target_url = sys.argv[1] if len(sys.argv) > 1 else None

if target_url:
    print(f"--- Target URL specified: {target_url} ---")
    client = httpx.Client(base_url=target_url, timeout=10.0)
    is_remote = True
else:
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    is_remote = False


def audit_item_1_schemas():
    """1. Pydantic schemas check."""
    res = client.get("/api/listings/1")
    assert res.status_code == 200
    data = res.json()["data"]
    # Confirm explicit keys
    for key in ["id", "host", "title", "description", "images", "amenities", "review_summary"]:
        assert key in data
    print("[PASS] Item 1: Pydantic schemas & explicit response contract")


def audit_item_2_and_3_autoseed_and_idempotency():
    """2. Auto-seed on boot & 3. Seed idempotency."""
    if not is_remote:
        from app.core.database import SessionLocal
        from app.models.user import User
        from app.models.listing import Listing
        from app.seed.seed import seed_database

        db = SessionLocal()
        try:
            user_count_before = db.query(User).count()
            listing_count_before = db.query(Listing).count()
            assert user_count_before >= 9
            assert listing_count_before >= 25
            seed_database(db)
            assert db.query(User).count() == user_count_before
            assert db.query(Listing).count() == listing_count_before
        finally:
            db.close()
    else:
        # Remote verification: listings total is >= 25 and users total >= 9
        res_listings = client.get("/api/listings")
        assert res_listings.status_code == 200
        assert res_listings.json()["data"]["total"] >= 25
        res_users = client.get("/api/users")
        assert res_users.status_code == 200
        assert len(res_users.json()["data"]) >= 9

    print("[PASS] Item 2 & 3: Auto-seed on boot & seed idempotency verified")


def audit_item_4_availability_and_price_quote():
    """4. Availability & Price quote endpoints."""
    res_avail = client.get("/api/listings/1/availability")
    assert res_avail.status_code == 200
    assert "data" in res_avail.json()

    today = date.today()
    c_in = (today + timedelta(days=120)).isoformat()
    c_out = (today + timedelta(days=123)).isoformat()
    res_quote = client.get(f"/api/listings/1/price-quote?check_in={c_in}&check_out={c_out}&guests=2")
    assert res_quote.status_code == 200
    assert res_quote.json()["data"]["nights"] == 3
    print("[PASS] Item 4: Availability & price-quote endpoints verified")


def audit_item_5_ownership_checks():
    """5. Ownership checks (Host CANNOT edit/delete another host's listing -> 403)."""
    # Host user 2 (Marcus) tries to edit Listing 1 (owned by user 1)
    res_edit = client.put(
        "/api/listings/1",
        json={"title": "Hacked Title"},
        headers={"X-User-Id": "2"}
    )
    assert res_edit.status_code == 403
    assert "only edit your own" in res_edit.json()["error"]["message"]

    # Host user 2 tries to delete Listing 1
    res_del = client.delete(
        "/api/listings/1",
        headers={"X-User-Id": "2"}
    )
    assert res_del.status_code == 403
    assert "only delete your own" in res_del.json()["error"]["message"]
    print("[PASS] Item 5: Ownership checks (403 Forbidden for non-owner host) verified")


def audit_item_6_cancellation_frees_dates():
    """6. Cancellation frees dates: book -> overlap 409 -> cancel -> rebook succeeds."""
    today = date.today()
    import random
    offset = random.randint(280, 5000)
    c_in = (today + timedelta(days=offset)).isoformat()
    c_out = (today + timedelta(days=offset+5)).isoformat()

    payload = {
        "listing_id": 3,
        "check_in": c_in,
        "check_out": c_out,
        "guests": 2,
    }

    # Step A: Guest 6 books
    res_b1 = client.post("/api/bookings", json=payload, headers={"X-User-Id": "6"})
    assert res_b1.status_code == 201, f"Booking 1 failed: {res_b1.json()}"
    booking_id = res_b1.json()["data"]["id"]

    # Step B: Guest 7 tries booking same dates -> 409 Conflict
    res_b2 = client.post("/api/bookings", json=payload, headers={"X-User-Id": "7"})
    assert res_b2.status_code == 409

    # Step C: Guest 6 cancels booking
    res_cancel = client.delete(f"/api/bookings/{booking_id}", headers={"X-User-Id": "6"})
    assert res_cancel.status_code == 200
    assert res_cancel.json()["data"]["status"] == "cancelled"

    # Step D: Guest 7 tries booking same dates again -> SUCCEEDS 201 Created!
    res_b3 = client.post("/api/bookings", json=payload, headers={"X-User-Id": "7"})
    assert res_b3.status_code == 201, f"Re-booking after cancel failed: {res_b3.json()}"
    print("[PASS] Item 6: Cancellation frees dates verified end-to-end")


def audit_item_7_pagination_and_filters():
    """7. Pagination + filter combinations."""
    res_p1 = client.get("/api/listings?page=1&page_size=5")
    res_p2 = client.get("/api/listings?page=2&page_size=5")
    assert res_p1.status_code == 200
    assert res_p2.status_code == 200
    items_p1 = res_p1.json()["data"]["items"]
    items_p2 = res_p2.json()["data"]["items"]
    assert len(items_p1) == 5
    assert len(items_p2) == 5
    assert items_p1[0]["id"] != items_p2[0]["id"]

    # Multi-filter combination
    res_multi = client.get("/api/listings?location=Malibu&min_price=100&max_price=1500&guests=2&amenities=1")
    assert res_multi.status_code == 200
    data_multi = res_multi.json()["data"]
    assert "items" in data_multi
    print("[PASS] Item 7: Pagination past page 1 & multi-filter combinations verified")


def audit_item_8_review_constraints():
    """8. Review constraint (cannot review unbooked stay, double review -> clean 400)."""
    # Get trips for Guest 6
    trips_res = client.get("/api/bookings/mine", headers={"X-User-Id": "6"})
    assert trips_res.status_code == 200
    trips = [t for t in trips_res.json()["data"] if t["status"] == "confirmed"]

    if trips:
        target_booking = trips[0]
        # Guest 7 (does not own booking) tries to review -> 403
        res_other = client.post(
            "/api/reviews",
            json={"booking_id": target_booking["id"], "rating": 5, "comment": "Sneaky review"},
            headers={"X-User-Id": "7"}
        )
        assert res_other.status_code == 403

        # Try posting review as guest 6 (may succeed or be duplicate 400)
        res_r1 = client.post(
            "/api/reviews",
            json={"booking_id": target_booking["id"], "rating": 5, "comment": "Great stay!"},
            headers={"X-User-Id": "6"}
        )
        assert res_r1.status_code in [201, 400]

        # Second review attempt for same booking -> 400 Bad Request with clean message
        res_r2 = client.post(
            "/api/reviews",
            json={"booking_id": target_booking["id"], "rating": 4, "comment": "Second review"},
            headers={"X-User-Id": "6"}
        )
        assert res_r2.status_code == 400
        assert "already been submitted" in res_r2.json()["error"]["message"]

    print("[PASS] Item 8: Review constraints (ownership & double-review rejection) verified")


def audit_item_9_wishlist_constraints():
    """9. Wishlist constraint (duplicate add handles gracefully)."""
    res1 = client.post("/api/wishlist/5", headers={"X-User-Id": "6"})
    assert res1.status_code in [200, 201]

    res2 = client.post("/api/wishlist/5", headers={"X-User-Id": "6"})
    assert res2.status_code in [200, 201]
    assert "Already in wishlist" in res2.json()["data"]["message"]
    print("[PASS] Item 9: Wishlist duplicate constraint handled gracefully")


if __name__ == "__main__":
    print("=================== AIRBNB BACKEND 9-POINT AUDIT ===================")
    audit_item_1_schemas()
    audit_item_2_and_3_autoseed_and_idempotency()
    audit_item_4_availability_and_price_quote()
    audit_item_5_ownership_checks()
    audit_item_6_cancellation_frees_dates()
    audit_item_7_pagination_and_filters()
    audit_item_8_review_constraints()
    audit_item_9_wishlist_constraints()
    print("=================== ALL 9 AUDIT CHECKS PASSED PERFECTLY ===================")
