"""
Wishlist router — add, remove, list saved listings for current user.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.listing import Listing, ListingImage
from app.models.wishlist import Wishlist
from app.models.review import Review
from sqlalchemy import func

router = APIRouter(prefix="/api/wishlist", tags=["Wishlist"])


# ── GET /api/wishlist — current user's saved listings ───────────────
@router.get("", response_model=dict)
def get_wishlist(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = db.query(Wishlist).filter(Wishlist.user_id == user.id).all()
    result = []
    for item in items:
        listing = db.query(Listing).filter(Listing.id == item.listing_id).first()
        if listing is None:
            continue
        cover = (
            db.query(ListingImage.url)
            .filter(ListingImage.listing_id == listing.id)
            .order_by(ListingImage.position)
            .first()
        )
        rating_row = (
            db.query(
                func.avg(Review.rating).label("avg"),
                func.count(Review.id).label("cnt"),
            )
            .filter(Review.listing_id == listing.id)
            .first()
        )
        result.append({
            "listing_id": listing.id,
            "created_at": item.created_at,
            "listing": {
                "id": listing.id,
                "title": listing.title,
                "property_type": listing.property_type,
                "category": listing.category,
                "city": listing.city,
                "country": listing.country,
                "price_per_night": listing.price_per_night,
                "cover_image": cover[0] if cover else None,
                "average_rating": round(rating_row.avg, 2) if rating_row and rating_row.avg else None,
                "review_count": rating_row.cnt if rating_row else 0,
            },
        })
    return {"data": result, "error": None}


# ── POST /api/wishlist/{listing_id} — add to wishlist ───────────────
@router.post("/{listing_id}", response_model=dict, status_code=status.HTTP_201_CREATED)
def add_to_wishlist(
    listing_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify listing exists
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Check if already in wishlist (composite PK prevents duplicates)
    existing = (
        db.query(Wishlist)
        .filter(Wishlist.user_id == user.id, Wishlist.listing_id == listing_id)
        .first()
    )
    if existing:
        return {"data": {"message": "Already in wishlist"}, "error": None}

    item = Wishlist(user_id=user.id, listing_id=listing_id)
    db.add(item)
    db.commit()
    return {"data": {"message": "Added to wishlist"}, "error": None}


# ── DELETE /api/wishlist/{listing_id} — remove from wishlist ────────
@router.delete("/{listing_id}", response_model=dict)
def remove_from_wishlist(
    listing_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(Wishlist)
        .filter(Wishlist.user_id == user.id, Wishlist.listing_id == listing_id)
        .first()
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Not in wishlist")
    db.delete(item)
    db.commit()
    return {"data": {"message": "Removed from wishlist"}, "error": None}
