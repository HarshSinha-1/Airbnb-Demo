"""
Booking model.

Design decisions:
- Price is snapshotted onto the booking row (nightly_price, cleaning_fee,
  service_fee, total_price) so a confirmed receipt never changes even if
  the host edits the listing's price later.
- check_out is exclusive and stored as DATE (not datetime) — a guest
  leaving on the 10th frees the 10th for the next guest; DATE avoids
  timezone bugs.
- Cancel by setting status='cancelled', never delete the row — this frees
  dates while preserving history for "My Trips" and the host dashboard.
- Index on (listing_id, check_in, check_out) makes the overlap check and
  availability filtering fast.
"""

from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Float, Index, Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    listing_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False
    )
    guest_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    check_in: Mapped[date] = mapped_column(Date, nullable=False)
    check_out: Mapped[date] = mapped_column(Date, nullable=False)
    guests: Mapped[int] = mapped_column(Integer, nullable=False)
    nightly_price: Mapped[float] = mapped_column(Float, nullable=False)
    nights: Mapped[int] = mapped_column(Integer, nullable=False)
    cleaning_fee: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    service_fee: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_price: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="confirmed"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    listing = relationship("Listing", back_populates="bookings")
    guest = relationship("User", back_populates="bookings")
    review = relationship("Review", back_populates="booking", uselist=False)

    __table_args__ = (
        Index("ix_bookings_overlap", "listing_id", "check_in", "check_out"),
    )
