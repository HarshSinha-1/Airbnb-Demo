"""Pydantic schemas for Wishlist endpoints."""

from datetime import datetime

from pydantic import BaseModel

from app.schemas.listing import ListingCard


class WishlistItemOut(BaseModel):
    listing_id: int
    listing: ListingCard
    created_at: datetime

    model_config = {"from_attributes": True}
