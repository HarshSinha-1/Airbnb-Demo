"""Pydantic schemas for Booking endpoints."""

from datetime import date, datetime

from pydantic import BaseModel, Field, model_validator


class BookingCreate(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guests: int = Field(..., ge=1)

    @model_validator(mode="after")
    def check_dates(self):
        if self.check_out <= self.check_in:
            raise ValueError("check_out must be after check_in")
        return self


class PriceBreakdown(BaseModel):
    nightly_price: float
    nights: int
    subtotal: float
    cleaning_fee: float
    service_fee: float
    total: float


class BookingOut(BaseModel):
    id: int
    listing_id: int
    guest_id: int
    check_in: date
    check_out: date
    guests: int
    nightly_price: float
    nights: int
    cleaning_fee: float
    service_fee: float
    total_price: float
    status: str
    created_at: datetime
    # Nested info for display
    listing_title: str | None = None
    listing_city: str | None = None
    listing_country: str | None = None
    listing_cover_image: str | None = None
    guest_name: str | None = None

    model_config = {"from_attributes": True}


class DateRange(BaseModel):
    """A blocked date range (check_in inclusive, check_out exclusive)."""
    check_in: date
    check_out: date


class PriceQuoteRequest(BaseModel):
    check_in: date
    check_out: date
    guests: int = Field(default=1, ge=1)

    @model_validator(mode="after")
    def check_dates(self):
        if self.check_out <= self.check_in:
            raise ValueError("check_out must be after check_in")
        return self
