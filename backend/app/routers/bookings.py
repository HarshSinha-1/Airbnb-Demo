"""
Bookings router — create, list my trips, cancel.

No business logic here — all logic is in services/booking_service.py
and services/pricing.py.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingOut
from app.services import booking_service

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])


# ── POST /api/bookings — create booking ─────────────────────────────
@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_booking(
    body: BookingCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = booking_service.create_booking(
        db,
        guest_id=user.id,
        listing_id=body.listing_id,
        check_in=body.check_in,
        check_out=body.check_out,
        guests=body.guests,
    )
    return {"data": BookingOut.model_validate(booking).model_dump(), "error": None}


# ── GET /api/bookings/mine — current guest's bookings ("My Trips") ──
@router.get("/mine", response_model=dict)
def get_my_bookings(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bookings = booking_service.get_my_bookings(db, user.id)
    return {"data": bookings, "error": None}


# ── DELETE /api/bookings/{id} — cancel booking ──────────────────────
@router.delete("/{booking_id}", response_model=dict)
def cancel_booking(
    booking_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = booking_service.cancel_booking(db, booking_id, user.id)
    return {"data": BookingOut.model_validate(booking).model_dump(), "error": None}
