"""
Listing, ListingImage, Amenity models and listing_amenities association table.

Design decisions:
- ListingImage is its own table because listings have many ordered photos;
  position=0 is the cover image shown on cards.
- Amenities are many-to-many via a fixed catalogue table (not free text) —
  this is what makes them filterable in search.
"""

from sqlalchemy import (
    Column,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# ---------- Many-to-many association table ----------
listing_amenities = Table(
    "listing_amenities",
    Base.metadata,
    Column("listing_id", Integer, ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True),
    Column("amenity_id", Integer, ForeignKey("amenities.id", ondelete="CASCADE"), primary_key=True),
)


# ---------- Amenity catalogue ----------
class Amenity(Base):
    __tablename__ = "amenities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)

    listings = relationship(
        "Listing", secondary=listing_amenities, back_populates="amenities"
    )


# ---------- Listing ----------
class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    host_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    property_type: Mapped[str] = mapped_column(String(50), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    country: Mapped[str] = mapped_column(String(120), nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    lng: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    price_per_night: Mapped[float] = mapped_column(Float, nullable=False)
    cleaning_fee: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    max_guests: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    bedrooms: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    beds: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    bathrooms: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Relationships
    host = relationship("User", back_populates="listings")
    images = relationship(
        "ListingImage",
        back_populates="listing",
        cascade="all, delete-orphan",
        order_by="ListingImage.position",
    )
    amenities = relationship(
        "Amenity", secondary=listing_amenities, back_populates="listings"
    )
    bookings = relationship("Booking", back_populates="listing", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="listing", cascade="all, delete-orphan")


# ---------- Listing images ----------
class ListingImage(Base):
    """
    Ordered photos for a listing.  position=0 is the cover photo
    that appears on listing cards.
    """

    __tablename__ = "listing_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    listing_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    listing = relationship("Listing", back_populates="images")
