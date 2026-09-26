"""
Booking service — validate dates/guests, overlap check, create/cancel
inside a transaction.

The overlap check is the one piece of logic that must be airtight:
    Two ranges [check_in, check_out) overlap if:
        new.check_in < existing.check_out AND new.check_out > existing.check_in
    Run as a single SQL condition against bookings WHERE listing_id = ?
    AND status = 'confirmed', inside the same transaction as the insert.
"""

from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.listing import Listing, ListingImage
from app.services.pricing import compute_price


def get_blocked_dates(db: Session, listing_id: int) -> list[dict]:
    """
    Return all confirmed booking date ranges for a listing.
    Used by the availability calendar endpoint.
    """
    bookings = (
        db.query(Booking.check_in, Booking.check_out)
        .filter(Booking.listing_id == listing_id, Booking.status == "confirmed")
        .order_by(Booking.check_in)
        .all()
    )
    return [
        {"check_in": b.check_in.isoformat(), "check_out": b.check_out.isoformat()}
        for b in bookings
    ]


def check_overlap(
    db: Session, listing_id: int, check_in: date, check_out: date
) -> bool:
    """
    Return True if the requested [check_in, check_out) overlaps any
    confirmed booking for this listing.
    """
    conflict = (
        db.query(Booking.id)
        .filter(
            Booking.listing_id == listing_id,
            Booking.status == "confirmed",
            Booking.check_in < check_out,
            Booking.check_out > check_in,
        )
        .first()
    )
    return conflict is not None


def create_booking(
    db: Session,
    guest_id: int,
    listing_id: int,
    check_in: date,
    check_out: date,
    guests: int,
) -> Booking:
    """
    Validate inputs, run the overlap check, compute price, and insert
    the booking — all inside one transaction.
    """
    # Load the listing
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Listing {listing_id} not found",
        )

    # Validate guest count
    if guests > listing.max_guests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Max guests for this listing is {listing.max_guests}",
        )

    # Validate dates
    if check_out <= check_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="check_out must be after check_in",
        )

    # Overlap check — must be in the same transaction as the insert
    if check_overlap(db, listing_id, check_in, check_out):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="These dates are already booked for this listing",
        )

    # Compute price using the shared pricing function
    price = compute_price(
        price_per_night=listing.price_per_night,
        cleaning_fee=listing.cleaning_fee,
        check_in=check_in,
        check_out=check_out,
    )

    booking = Booking(
        listing_id=listing_id,
        guest_id=guest_id,
        check_in=check_in,
        check_out=check_out,
        guests=guests,
        nightly_price=price["nightly_price"],
        nights=price["nights"],
        cleaning_fee=price["cleaning_fee"],
        service_fee=price["service_fee"],
        total_price=price["total"],
        status="confirmed",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


def cancel_booking(db: Session, booking_id: int, user_id: int) -> Booking:
    """
    Cancel a booking by setting status='cancelled'.
    Never delete the row — preserves history.
    Only the guest who made the booking can cancel it.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking {booking_id} not found",
        )
    if booking.guest_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only cancel your own bookings",
        )
    if booking.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking is already cancelled",
        )

    booking.status = "cancelled"
    db.commit()
    db.refresh(booking)
    return booking


def get_my_bookings(db: Session, guest_id: int) -> list[dict]:
    """
    Return all bookings for a guest with listing info for display.
    """
    bookings = (
        db.query(Booking)
        .filter(Booking.guest_id == guest_id)
        .order_by(Booking.check_in.desc())
        .all()
    )
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
        })
    return result
