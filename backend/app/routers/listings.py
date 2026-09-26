"""
Listings router — public search, detail, availability, price quote,
and host CRUD (create/update/delete) with ownership checks.

No business logic here — all logic is in services/listing_service.py
and services/pricing.py.
"""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user, require_host
from app.models.listing import Listing
from app.models.user import User
from app.schemas.listing import (
    ListingCard,
    ListingCreate,
    ListingDetail,
    ListingSearchResponse,
    ListingUpdate,
)
from app.schemas.booking import PriceBreakdown, DateRange
from app.services import listing_service
from app.services.booking_service import get_blocked_dates
from app.services.pricing import compute_price

router = APIRouter(prefix="/api/listings", tags=["Listings"])


# ── GET /api/listings — search/list with filters ────────────────────
@router.get("", response_model=dict)
def search_listings(
    location: Optional[str] = Query(None),
    check_in: Optional[date] = Query(None),
    check_out: Optional[date] = Query(None),
    guests: Optional[int] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    property_type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    amenities: Optional[list[int]] = Query(None),
    page: int = Query(1, ge=1),
    page_size: Optional[int] = Query(None, ge=1, le=100),
    db: Session = Depends(get_db),
):
    result = listing_service.search_listings(
        db,
        location=location,
        check_in=check_in,
        check_out=check_out,
        guests=guests,
        min_price=min_price,
        max_price=max_price,
        property_type=property_type,
        category=category,
        amenities=amenities,
        page=page,
        page_size=page_size,
    )
    return {"data": result, "error": None}


# ── GET /api/listings/{id} — full detail ────────────────────────────
@router.get("/{listing_id}", response_model=dict)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    detail = listing_service.get_listing_detail(db, listing_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    return {"data": detail, "error": None}


# ── GET /api/listings/{id}/availability — blocked dates ─────────────
@router.get("/{listing_id}/availability", response_model=dict)
def get_availability(listing_id: int, db: Session = Depends(get_db)):
    # Verify listing exists
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    blocked = get_blocked_dates(db, listing_id)
    return {"data": blocked, "error": None}


# ── GET /api/listings/{id}/price-quote — price breakdown ────────────
@router.get("/{listing_id}/price-quote", response_model=dict)
def get_price_quote(
    listing_id: int,
    check_in: date = Query(...),
    check_out: date = Query(...),
    guests: int = Query(1, ge=1),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    if check_out <= check_in:
        raise HTTPException(status_code=400, detail="check_out must be after check_in")
    if guests > listing.max_guests:
        raise HTTPException(
            status_code=400,
            detail=f"Max guests for this listing is {listing.max_guests}",
        )

    price = compute_price(
        price_per_night=listing.price_per_night,
        cleaning_fee=listing.cleaning_fee,
        check_in=check_in,
        check_out=check_out,
    )
    return {"data": price, "error": None}


# ── POST /api/listings — create (host only) ─────────────────────────
@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_listing(
    body: ListingCreate,
    host: User = Depends(require_host),
    db: Session = Depends(get_db),
):
    listing = listing_service.create_listing(db, host.id, body.model_dump())
    detail = listing_service.get_listing_detail(db, listing.id)
    return {"data": detail, "error": None}


# ── PUT /api/listings/{id} — update (owner only) ────────────────────
@router.put("/{listing_id}", response_model=dict)
def update_listing(
    listing_id: int,
    body: ListingUpdate,
    host: User = Depends(require_host),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.host_id != host.id:
        raise HTTPException(status_code=403, detail="You can only edit your own listings")
    # Only send non-None fields
    update_data = body.model_dump(exclude_unset=True)
    listing_service.update_listing(db, listing, update_data)
    detail = listing_service.get_listing_detail(db, listing.id)
    return {"data": detail, "error": None}


# ── DELETE /api/listings/{id} — delete (owner only) ─────────────────
@router.delete("/{listing_id}", response_model=dict)
def delete_listing(
    listing_id: int,
    host: User = Depends(require_host),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.host_id != host.id:
        raise HTTPException(status_code=403, detail="You can only delete your own listings")
    listing_service.delete_listing(db, listing)
    return {"data": {"deleted": True, "id": listing_id}, "error": None}
