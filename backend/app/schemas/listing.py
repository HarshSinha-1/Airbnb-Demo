"""Pydantic schemas for Listing endpoints."""

from pydantic import BaseModel, Field

from app.schemas.user import UserBrief


# ── Amenity ──────────────────────────────────────────────────────────
class AmenityOut(BaseModel):
    id: int
    name: str
    icon: str | None = None

    model_config = {"from_attributes": True}


# ── Image ────────────────────────────────────────────────────────────
class ListingImageOut(BaseModel):
    id: int
    url: str
    position: int

    model_config = {"from_attributes": True}


# ── Review summary (embedded in listing detail) ─────────────────────
class ReviewSummary(BaseModel):
    average_rating: float | None = None
    review_count: int = 0


# ── Listing card (search results) ───────────────────────────────────
class ListingCard(BaseModel):
    id: int
    title: str
    property_type: str
    category: str
    city: str
    country: str
    price_per_night: float
    currency: str = "USD"
    cover_image: str | None = None
    average_rating: float | None = None
    review_count: int = 0

    model_config = {"from_attributes": True}


# ── Listing detail (full) ───────────────────────────────────────────
class ListingDetail(BaseModel):
    id: int
    host: UserBrief
    title: str
    description: str
    property_type: str
    category: str
    city: str
    country: str
    lat: float
    lng: float
    price_per_night: float
    cleaning_fee: float
    currency: str = "USD"
    max_guests: int
    bedrooms: int
    beds: int
    bathrooms: int
    images: list[ListingImageOut] = []
    amenities: list[AmenityOut] = []
    review_summary: ReviewSummary = ReviewSummary()

    model_config = {"from_attributes": True}


# ── Create / Update ─────────────────────────────────────────────────
class ListingCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=250)
    description: str = Field(..., min_length=10)
    property_type: str
    category: str = ""
    city: str
    country: str
    lat: float = 0.0
    lng: float = 0.0
    price_per_night: float = Field(..., gt=0)
    cleaning_fee: float = Field(default=0.0, ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    max_guests: int = Field(default=2, ge=1)
    bedrooms: int = Field(default=1, ge=0)
    beds: int = Field(default=1, ge=1)
    bathrooms: int = Field(default=1, ge=0)
    image_urls: list[str] = []
    amenity_ids: list[int] = []


class ListingUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    property_type: str | None = None
    category: str | None = None
    city: str | None = None
    country: str | None = None
    lat: float | None = None
    lng: float | None = None
    price_per_night: float | None = None
    cleaning_fee: float | None = None
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    max_guests: int | None = None
    bedrooms: int | None = None
    beds: int | None = None
    bathrooms: int | None = None
    image_urls: list[str] | None = None
    amenity_ids: list[int] | None = None


# ── Paginated listing response ──────────────────────────────────────
class ListingSearchResponse(BaseModel):
    items: list[ListingCard]
    total: int
    page: int
    page_size: int
    total_pages: int
