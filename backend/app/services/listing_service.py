"""
Listing service — search, filters, availability exclusion, rating aggregation,
CRUD operations.  All listing-related business logic lives here, not in routers.
"""

import math
from typing import Any

from sqlalchemy import func, and_
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.models.listing import Listing, ListingImage, Amenity, listing_amenities
from app.models.booking import Booking
from app.models.review import Review


# ── Search / List ────────────────────────────────────────────────────
def search_listings(
    db: Session,
    *,
    location: str | None = None,
    check_in: Any = None,
    check_out: Any = None,
    guests: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    property_type: str | None = None,
    category: str | None = None,
    amenities: list[int] | None = None,
    page: int = 1,
    page_size: int | None = None,
) -> dict:
    """
    Build a dynamic query with all supported filters, paginate, and
    return listing cards with cover images and aggregated ratings.
    """
    if page_size is None:
        page_size = settings.DEFAULT_PAGE_SIZE

    query = db.query(Listing)

    # ── Location filter (city or country, case-insensitive) ──
    if location:
        location_lower = location.lower()
        query = query.filter(
            func.lower(Listing.city).contains(location_lower)
            | func.lower(Listing.country).contains(location_lower)
        )

    # ── Guest capacity ──
    if guests is not None:
        query = query.filter(Listing.max_guests >= guests)

    # ── Price range ──
    if min_price is not None:
        query = query.filter(Listing.price_per_night >= min_price)
    if max_price is not None:
        query = query.filter(Listing.price_per_night <= max_price)

    # ── Property type ──
    if property_type:
        query = query.filter(func.lower(Listing.property_type) == property_type.lower())

    # ── Category ──
    if category:
        query = query.filter(func.lower(Listing.category) == category.lower())

    # ── Amenity filter (listing must have ALL requested amenities) ──
    if amenities:
        for amenity_id in amenities:
            query = query.filter(
                Listing.id.in_(
                    db.query(listing_amenities.c.listing_id).filter(
                        listing_amenities.c.amenity_id == amenity_id
                    )
                )
            )

    # ── Availability exclusion (exclude listings booked during requested dates) ──
    if check_in and check_out:
        booked_listing_ids = (
            db.query(Booking.listing_id)
            .filter(
                Booking.status == "confirmed",
                Booking.check_in < check_out,
                Booking.check_out > check_in,
            )
            .subquery()
        )
        query = query.filter(~Listing.id.in_(db.query(booked_listing_ids.c.listing_id)))

    # ── Total count before pagination ──
    total = query.count()
    total_pages = max(1, math.ceil(total / page_size))

    # ── Paginate ──
    offset = (page - 1) * page_size
    listings = query.offset(offset).limit(page_size).all()

    # ── Build card responses with cover image and ratings ──
    cards = []
    for listing in listings:
        # Cover image (position 0)
        cover = (
            db.query(ListingImage.url)
            .filter(ListingImage.listing_id == listing.id)
            .order_by(ListingImage.position)
            .first()
        )
        # Rating aggregation at query time
        rating_row = (
            db.query(
                func.avg(Review.rating).label("avg"),
                func.count(Review.id).label("cnt"),
            )
            .filter(Review.listing_id == listing.id)
            .first()
        )

        cards.append({
            "id": listing.id,
            "title": listing.title,
            "property_type": listing.property_type,
            "category": listing.category,
            "city": listing.city,
            "country": listing.country,
            "price_per_night": listing.price_per_night,
            "currency": listing.currency,
            "cover_image": cover[0] if cover else None,
            "average_rating": round(rating_row.avg, 2) if rating_row and rating_row.avg else None,
            "review_count": rating_row.cnt if rating_row else 0,
        })

    return {
        "items": cards,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


# ── Listing detail ──────────────────────────────────────────────────
def get_listing_detail(db: Session, listing_id: int) -> dict | None:
    """
    Load a listing with all relationships (host, images, amenities)
    and compute the review summary.
    """
    listing = (
        db.query(Listing)
        .options(
            joinedload(Listing.host),
            joinedload(Listing.images),
            joinedload(Listing.amenities),
        )
        .filter(Listing.id == listing_id)
        .first()
    )
    if listing is None:
        return None

    # Rating aggregation
    rating_row = (
        db.query(
            func.avg(Review.rating).label("avg"),
            func.count(Review.id).label("cnt"),
        )
        .filter(Review.listing_id == listing_id)
        .first()
    )

    return {
        "id": listing.id,
        "host": {
            "id": listing.host.id,
            "name": listing.host.name,
            "avatar_url": listing.host.avatar_url,
            "is_superhost": listing.host.is_superhost,
        },
        "title": listing.title,
        "description": listing.description,
        "property_type": listing.property_type,
        "category": listing.category,
        "city": listing.city,
        "country": listing.country,
        "lat": listing.lat,
        "lng": listing.lng,
        "price_per_night": listing.price_per_night,
        "cleaning_fee": listing.cleaning_fee,
        "currency": listing.currency,
        "max_guests": listing.max_guests,
        "bedrooms": listing.bedrooms,
        "beds": listing.beds,
        "bathrooms": listing.bathrooms,
        "images": [
            {"id": img.id, "url": img.url, "position": img.position}
            for img in sorted(listing.images, key=lambda i: i.position)
        ],
        "amenities": [
            {"id": a.id, "name": a.name, "icon": a.icon}
            for a in listing.amenities
        ],
        "review_summary": {
            "average_rating": round(rating_row.avg, 2) if rating_row and rating_row.avg else None,
            "review_count": rating_row.cnt if rating_row else 0,
        },
    }


# ── Create listing ──────────────────────────────────────────────────
def create_listing(db: Session, host_id: int, data: dict) -> Listing:
    """Create a listing with images and amenity associations."""
    image_urls = data.pop("image_urls", [])
    amenity_ids = data.pop("amenity_ids", [])

    listing = Listing(host_id=host_id, **data)
    db.add(listing)
    db.flush()  # get listing.id

    # Add images
    for position, url in enumerate(image_urls):
        db.add(ListingImage(listing_id=listing.id, url=url, position=position))

    # Attach amenities
    if amenity_ids:
        amenities = db.query(Amenity).filter(Amenity.id.in_(amenity_ids)).all()
        listing.amenities = amenities

    db.commit()
    db.refresh(listing)
    return listing


# ── Update listing ──────────────────────────────────────────────────
def update_listing(db: Session, listing: Listing, data: dict) -> Listing:
    """Update a listing; if image_urls or amenity_ids provided, replace them."""
    image_urls = data.pop("image_urls", None)
    amenity_ids = data.pop("amenity_ids", None)

    # Update scalar fields
    for key, value in data.items():
        if value is not None:
            setattr(listing, key, value)

    # Replace images if provided
    if image_urls is not None:
        # Delete old images
        db.query(ListingImage).filter(ListingImage.listing_id == listing.id).delete()
        for position, url in enumerate(image_urls):
            db.add(ListingImage(listing_id=listing.id, url=url, position=position))

    # Replace amenities if provided
    if amenity_ids is not None:
        amenities = db.query(Amenity).filter(Amenity.id.in_(amenity_ids)).all()
        listing.amenities = amenities

    db.commit()
    db.refresh(listing)
    return listing


# ── Delete listing ──────────────────────────────────────────────────
def delete_listing(db: Session, listing: Listing) -> None:
    """Delete a listing and all cascaded children."""
    db.delete(listing)
    db.commit()


# ── Host dashboard helpers ──────────────────────────────────────────
def get_host_listings(db: Session, host_id: int) -> list[dict]:
    """Get all listings for a host, with booking counts."""
    listings = db.query(Listing).filter(Listing.host_id == host_id).all()
    result = []
    for listing in listings:
        booking_count = (
            db.query(func.count(Booking.id))
            .filter(Booking.listing_id == listing.id, Booking.status == "confirmed")
            .scalar()
        )
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
            "id": listing.id,
            "title": listing.title,
            "property_type": listing.property_type,
            "category": listing.category,
            "city": listing.city,
            "country": listing.country,
            "price_per_night": listing.price_per_night,
            "currency": listing.currency,
            "cover_image": cover[0] if cover else None,
            "average_rating": round(rating_row.avg, 2) if rating_row and rating_row.avg else None,
            "review_count": rating_row.cnt if rating_row else 0,
            "booking_count": booking_count,
        })
    return result


def get_host_bookings(db: Session, host_id: int) -> list[Booking]:
    """Get all bookings across all listings owned by this host."""
    return (
        db.query(Booking)
        .join(Listing, Booking.listing_id == Listing.id)
        .filter(Listing.host_id == host_id)
        .order_by(Booking.check_in.desc())
        .all()
    )
