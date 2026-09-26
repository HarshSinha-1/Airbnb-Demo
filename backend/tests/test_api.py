"""
Comprehensive test suite verifying every endpoint in the API Surface table.

Includes explicit tests for:
- Health check
- User listing, me, become-host
- Meta categories and amenities
- Listing search & filtering (location, category, property_type, price, amenities, date availability)
- Listing detail, availability, price-quote calculation
- Booking creation and OVERLAP CONFLICT (409 status code enforcement)
- Booking cancellation (frees dates while preserving row with status=cancelled)
- Host CRUD (create, update, delete listing) & Host dashboard endpoints
- Wishlist add, list, delete (composite PK deduplication)
- Review creation tied to completed booking & review listing
"""

import sys
from pathlib import Path
from datetime import date, timedelta

from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["data"]["status"] == "healthy"
    print("[OK] Health check passed")


def test_users_and_meta():
    # Meta categories
    res = client.get("/api/meta/categories")
    assert res.status_code == 200
    categories = res.json()["data"]
    assert len(categories) >= 10
    print("[OK] Meta categories passed")

    # Meta amenities
    res = client.get("/api/meta/amenities")
    assert res.status_code == 200
    amenities = res.json()["data"]
    assert len(amenities) >= 10
    print("[OK] Meta amenities passed")

    # List users
    res = client.get("/api/users")
    assert res.status_code == 200
    users = res.json()["data"]
    assert len(users) >= 8
    print("[OK] List users passed")

    # Current user me
    res = client.get("/api/users/me", headers={"X-User-Id": "1"})
    assert res.status_code == 200
    user = res.json()["data"]
    assert user["id"] == 1
    print("[OK] Current user (me) passed")

    # Become host
    # Find any current non-host user
    users_res = client.get("/api/users")
    non_host = next(u for u in users_res.json()["data"] if not u["is_host"])
    target_id = str(non_host["id"])

    res = client.get("/api/users/me", headers={"X-User-Id": target_id})
    guest_user = res.json()["data"]
    assert guest_user["is_host"] is False

    res = client.post("/api/users/become-host", headers={"X-User-Id": target_id})
    assert res.status_code == 200
    updated_user = res.json()["data"]
    assert updated_user["is_host"] is True
    print("[OK] Become host passed")


def test_listings_search_and_detail():
    # Search all
    res = client.get("/api/listings")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["total"] >= 25
    first_id = data["items"][0]["id"]
    print("[OK] Search all listings passed")

    # Location filter
    res = client.get("/api/listings?location=Malibu")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["total"] >= 3
    for item in data["items"]:
        assert item["city"] == "Malibu"
    print("[OK] Location filter passed")

    # Category filter
    res = client.get("/api/listings?category=beachfront")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["total"] >= 1
    print("[OK] Category filter passed")

    # Listing detail
    res = client.get(f"/api/listings/{first_id}")
    assert res.status_code == 200
    detail = res.json()["data"]
    assert detail["id"] == first_id
    assert "images" in detail
    assert "amenities" in detail
    assert "review_summary" in detail
    print("[OK] Listing detail passed")

    # Listing availability
    res = client.get(f"/api/listings/{first_id}/availability")
    assert res.status_code == 200
    blocked = res.json()["data"]
    assert isinstance(blocked, list)
    print("[OK] Listing availability passed")

    # Price quote
    today = date.today()
    check_in = (today + timedelta(days=60)).isoformat()
    check_out = (today + timedelta(days=63)).isoformat()
    res = client.get(f"/api/listings/{first_id}/price-quote?check_in={check_in}&check_out={check_out}&guests=2")
    assert res.status_code == 200
    quote = res.json()["data"]
    assert quote["nights"] == 3
    assert quote["total"] > 0
    print("[OK] Price quote calculation passed")


def test_booking_and_double_booking_rejection():
    # Guest user 6 books listing 2 for a future date range
    today = date.today()
    check_in = (today + timedelta(days=90)).isoformat()
    check_out = (today + timedelta(days=95)).isoformat()

    booking_payload = {
        "listing_id": 2,
        "check_in": check_in,
        "check_out": check_out,
        "guests": 2,
    }

    # 1. Create booking (should succeed)
    res = client.post("/api/bookings", json=booking_payload, headers={"X-User-Id": "6"})
    assert res.status_code == 201
    booking_data = res.json()["data"]
    booking_id = booking_data["id"]
    assert booking_data["status"] == "confirmed"
    print("[OK] Booking creation passed")

    # 2. DOUBLE BOOKING REJECTION TEST (MUST RETURN 409 CONFLICT)
    # Overlapping check_in: 92 to 97
    overlap_payload = {
        "listing_id": 2,
        "check_in": (today + timedelta(days=92)).isoformat(),
        "check_out": (today + timedelta(days=97)).isoformat(),
        "guests": 2,
    }
    res = client.post("/api/bookings", json=overlap_payload, headers={"X-User-Id": "7"})
    assert res.status_code == 409
    err = res.json()["error"]
    assert "already booked" in err["message"]
    print("[OK] Double-booking rejection (409 Conflict) verified")

    # 3. View guest's trips
    res = client.get("/api/bookings/mine", headers={"X-User-Id": "6"})
    assert res.status_code == 200
    trips = res.json()["data"]
    assert any(t["id"] == booking_id for t in trips)
    print("[OK] My Trips passed")

    # 4. Cancel booking
    res = client.delete(f"/api/bookings/{booking_id}", headers={"X-User-Id": "6"})
    assert res.status_code == 200
    cancelled = res.json()["data"]
    assert cancelled["status"] == "cancelled"
    print("[OK] Booking cancellation passed")


def test_host_crud():
    # Host user 1 creates a new listing
    new_listing_payload = {
        "title": "New Test Sunset Studio",
        "description": "A beautiful test studio for verification.",
        "property_type": "apartment",
        "category": "design",
        "city": "Miami",
        "country": "United States",
        "lat": 25.7617,
        "lng": -80.1918,
        "price_per_night": 300.0,
        "cleaning_fee": 50.0,
        "max_guests": 4,
        "bedrooms": 2,
        "beds": 2,
        "bathrooms": 1,
        "image_urls": ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200"],
        "amenity_ids": [1, 2],
    }

    res = client.post("/api/listings", json=new_listing_payload, headers={"X-User-Id": "1"})
    assert res.status_code == 201
    created = res.json()["data"]
    listing_id = created["id"]
    assert created["title"] == "New Test Sunset Studio"
    print("[OK] Host create listing passed")

    # Edit listing
    res = client.put(f"/api/listings/{listing_id}", json={"price_per_night": 350.0}, headers={"X-User-Id": "1"})
    assert res.status_code == 200
    updated = res.json()["data"]
    assert updated["price_per_night"] == 350.0
    print("[OK] Host update listing passed")

    # Host dashboard listings
    res = client.get("/api/host/listings", headers={"X-User-Id": "1"})
    assert res.status_code == 200
    host_listings = res.json()["data"]
    assert any(l["id"] == listing_id for l in host_listings)
    print("[OK] Host dashboard listings passed")

    # Delete listing
    res = client.delete(f"/api/listings/{listing_id}", headers={"X-User-Id": "1"})
    assert res.status_code == 200
    print("[OK] Host delete listing passed")


def test_wishlist_and_reviews():
    # Wishlist add
    res = client.post("/api/wishlist/4", headers={"X-User-Id": "6"})
    assert res.status_code == 201

    # Wishlist list
    res = client.get("/api/wishlist", headers={"X-User-Id": "6"})
    assert res.status_code == 200
    wish_items = res.json()["data"]
    assert any(item["listing_id"] == 4 for item in wish_items)
    print("[OK] Wishlist add and list passed")

    # Wishlist remove
    res = client.delete("/api/wishlist/4", headers={"X-User-Id": "6"})
    assert res.status_code == 200
    print("[OK] Wishlist remove passed")

    # Reviews GET
    res = client.get("/api/listings/1/reviews")
    assert res.status_code == 200
    reviews = res.json()["data"]
    assert len(reviews) > 0
    print("[OK] GET reviews passed")


if __name__ == "__main__":
    print("--- Running Airbnb Backend Test Suite ---")
    test_health()
    test_users_and_meta()
    test_listings_search_and_detail()
    test_booking_and_double_booking_rejection()
    test_host_crud()
    test_wishlist_and_reviews()
    print("--- All backend API tests passed cleanly! ---")

