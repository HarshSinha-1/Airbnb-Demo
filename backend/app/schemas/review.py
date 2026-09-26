"""Pydantic schemas for Review endpoints."""

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.user import UserBrief


class ReviewCreate(BaseModel):
    booking_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=1)


class ReviewOut(BaseModel):
    id: int
    listing_id: int
    author: UserBrief
    booking_id: int
    rating: int
    comment: str
    created_at: datetime

    model_config = {"from_attributes": True}
