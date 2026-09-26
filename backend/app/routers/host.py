"""
Host router — host's own listings with booking counts, host's bookings.

Requires host role via require_host dependency.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_host
from app.models.user import User
from app.models.listing import Listing, ListingImage
from app.models.booking import Booking
from app.schemas.booking import BookingOut
from app.services import listing_service

router = APIRouter(prefix="/api/host", tags=["Host"])


# ── GET /api/host/listings — host's own listings + booking counts ───
@router.get("/listings", response_model=dict)
def get_host_listings(
    host: User = Depends(require_host),
    db: Session = Depends(get_db),
):
    listings = listing_service.get_host_listings(db, host.id)
    return {"data": listings, "error": None}


# ── GET /api/host/bookings — all bookings across host's listings ────
@router.get("/bookings", response_model=dict)
def get_host_bookings(
    host: User = Depends(require_host),
    db: Session = Depends(get_db),
):
    bookings = listing_service.get_host_bookings(db, host.id)
    result = []
    for b in bookings:
        listing = db.query(Listing).filter(Listing.id == b.listing_id).first()
        cover = (
            db.query(ListingImage.url)
            .filter(ListingImage.listing_id == b.listing_id)
            .order_by(ListingImage.position)
            .first()
        )
        result.append({
            "id": b.id,
            "listing_id": b.listing_id,
            "guest_id": b.guest_id,
            "check_in": b.check_in,
            "check_out": b.check_out,
            "guests": b.guests,
            "nightly_price": b.nightly_price,
            "nights": b.nights,
            "cleaning_fee": b.cleaning_fee,
            "service_fee": b.service_fee,
            "total_price": b.total_price,
            "status": b.status,
            "created_at": b.created_at,
            "listing_title": listing.title if listing else None,
            "listing_city": listing.city if listing else None,
            "listing_country": listing.country if listing else None,
            "listing_cover_image": cover[0] if cover else None,
            "guest_name": (
                db.query(User).filter(User.id == b.guest_id).first().name
                if b.guest_id else None
            ),
        })
    return {"data": result, "error": None}
