"""
Reviews router — list reviews for a listing, post review tied to a booking.

Enforces:
- Review must be tied to a valid booking made by the current user.
- One review per booking (booking_id is UNIQUE).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.booking import Booking
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewOut

router = APIRouter(prefix="/api", tags=["Reviews"])


# ── GET /api/listings/{listing_id}/reviews — List reviews for a listing ──
@router.get("/listings/{listing_id}/reviews", response_model=dict)
def get_listing_reviews(listing_id: int, db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .options(joinedload(Review.author))
        .filter(Review.listing_id == listing_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    result = [
        {
            "id": r.id,
            "listing_id": r.listing_id,
            "author": {
                "id": r.author.id,
                "name": r.author.name,
                "avatar_url": r.author.avatar_url,
                "is_superhost": r.author.is_superhost,
            },
            "booking_id": r.booking_id,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at,
        }
        for r in reviews
    ]
    return {"data": result, "error": None}


# ── POST /api/reviews — Create review for a stay ────────────────────────
@router.post("/reviews", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_review(
    body: ReviewCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify booking exists and belongs to current user
    booking = db.query(Booking).filter(Booking.id == body.booking_id).first()
    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking {body.booking_id} not found",
        )
    if booking.guest_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only review your own bookings",
        )

    if booking.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot review a cancelled booking",
        )

    # Check if a review already exists for this booking
    existing = db.query(Review).filter(Review.booking_id == body.booking_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A review has already been submitted for this booking",
        )

    review = Review(
        listing_id=booking.listing_id,
        author_id=user.id,
        booking_id=body.booking_id,
        rating=body.rating,
        comment=body.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    # Reload with author
    review = (
        db.query(Review)
        .options(joinedload(Review.author))
        .filter(Review.id == review.id)
        .first()
    )

    out = {
        "id": review.id,
        "listing_id": review.listing_id,
        "author": {
            "id": review.author.id,
            "name": review.author.name,
            "avatar_url": review.author.avatar_url,
            "is_superhost": review.author.is_superhost,
        },
        "booking_id": review.booking_id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at,
    }
    return {"data": out, "error": None}
