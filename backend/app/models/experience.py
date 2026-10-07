"""Time-slot experiences with per-guest pricing."""

import secrets
import string
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import CreatedAtMixin, TimestampMixin
from app.models.enums import ExperienceBookingStatus, ExperienceCategory, PaymentMethodType, str_enum

_CODE_ALPHABET = string.ascii_uppercase + string.digits


def generate_experience_confirmation_code() -> str:
    suffix = "".join(secrets.choice(_CODE_ALPHABET) for _ in range(8))
    return f"EX{suffix}"


class Experience(TimestampMixin, Base):
    __tablename__ = "experiences"
    __table_args__ = (
        CheckConstraint("duration_minutes >= 15", name="ck_experiences_duration"),
        CheckConstraint("max_guests_per_slot >= 1", name="ck_experiences_max_guests"),
        CheckConstraint("price_per_guest > 0", name="ck_experiences_price"),
        CheckConstraint(
            "private_price IS NULL OR private_price > 0",
            name="ck_experiences_private_price",
        ),
        CheckConstraint("guest_requirements >= 0", name="ck_experiences_min_age"),
        CheckConstraint("cancellation_hours >= 0", name="ck_experiences_cancel_hours"),
        CheckConstraint("avg_rating >= 0 AND avg_rating <= 5", name="ck_experiences_avg_rating"),
        CheckConstraint("review_count >= 0", name="ck_experiences_review_count"),
        CheckConstraint("lat >= -90 AND lat <= 90", name="ck_experiences_lat"),
        CheckConstraint("lng >= -180 AND lng <= 180", name="ck_experiences_lng"),
        Index("ix_experiences_city", "city"),
        Index("ix_experiences_active_category", "is_active", "category"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    city: Mapped[str] = mapped_column(String(80), nullable=False)
    region: Mapped[str] = mapped_column(String(80), nullable=False)
    category: Mapped[ExperienceCategory] = mapped_column(str_enum(ExperienceCategory, 32), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    language: Mapped[str] = mapped_column(String(40), nullable=False, default="English", server_default=text("'English'"))
    max_guests_per_slot: Mapped[int] = mapped_column(Integer, nullable=False)
    price_per_guest: Mapped[int] = mapped_column(Integer, nullable=False)
    private_price: Mapped[int | None] = mapped_column(Integer)
    whats_included: Mapped[str | None] = mapped_column(Text)
    guest_requirements: Mapped[int] = mapped_column(Integer, nullable=False, default=13, server_default=text("13"))
    activity_level: Mapped[str | None] = mapped_column(String(40))
    accessibility_note: Mapped[str | None] = mapped_column(Text)
    meeting_point_name: Mapped[str] = mapped_column(String(120), nullable=False)
    meeting_point_address: Mapped[str] = mapped_column(String(255), nullable=False)
    lat: Mapped[float] = mapped_column(nullable=False)
    lng: Mapped[float] = mapped_column(nullable=False)
    cancellation_hours: Mapped[int] = mapped_column(Integer, nullable=False, default=24, server_default=text("24"))
    avg_rating: Mapped[float] = mapped_column(nullable=False, default=0.0, server_default=text("0"))
    review_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=text("0"))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=text("1"))

    host = relationship("User", back_populates="experiences")
    images: Mapped[list["ExperienceImage"]] = relationship(
        back_populates="experience",
        cascade="all, delete-orphan",
        order_by="ExperienceImage.position",
    )
    itinerary: Mapped[list["ExperienceItineraryItem"]] = relationship(
        back_populates="experience",
        cascade="all, delete-orphan",
        order_by="ExperienceItineraryItem.position",
    )
    slots: Mapped[list["ExperienceSlot"]] = relationship(back_populates="experience", cascade="all, delete-orphan")
    reviews: Mapped[list["ExperienceReview"]] = relationship(back_populates="experience")


class ExperienceImage(Base):
    __tablename__ = "experience_images"
    __table_args__ = (UniqueConstraint("experience_id", "position", name="uq_experience_images_position"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    experience_id: Mapped[int] = mapped_column(
        ForeignKey("experiences.id", ondelete="CASCADE"),
        nullable=False,
    )
    url: Mapped[str] = mapped_column(String(512), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)

    experience: Mapped[Experience] = relationship(back_populates="images")


class ExperienceItineraryItem(Base):
    __tablename__ = "experience_itinerary_items"
    __table_args__ = (UniqueConstraint("experience_id", "position", name="uq_experience_itinerary_position"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    experience_id: Mapped[int] = mapped_column(
        ForeignKey("experiences.id", ondelete="CASCADE"),
        nullable=False,
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(512))

    experience: Mapped[Experience] = relationship(back_populates="itinerary")


class ExperienceSlot(Base):
    __tablename__ = "experience_slots"
    __table_args__ = (
        CheckConstraint("capacity >= 1", name="ck_experience_slots_capacity"),
        CheckConstraint("booked_count >= 0", name="ck_experience_slots_booked_nonneg"),
        CheckConstraint("booked_count <= capacity", name="ck_experience_slots_booked_capacity"),
        UniqueConstraint("experience_id", "start_at", name="uq_experience_slots_start"),
        Index("ix_experience_slots_start", "start_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    experience_id: Mapped[int] = mapped_column(
        ForeignKey("experiences.id", ondelete="CASCADE"),
        nullable=False,
    )
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    booked_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=text("0"))
    is_cancelled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("0"))

    experience: Mapped[Experience] = relationship(back_populates="slots")
    bookings: Mapped[list["ExperienceBooking"]] = relationship(back_populates="slot")


class ExperienceBooking(CreatedAtMixin, Base):
    __tablename__ = "experience_bookings"
    __table_args__ = (
        CheckConstraint("adults >= 1", name="ck_experience_bookings_adults"),
        CheckConstraint("price_per_guest_snapshot > 0", name="ck_experience_bookings_price"),
        CheckConstraint("total_snapshot >= 0", name="ck_experience_bookings_total"),
        CheckConstraint(
            "refund_amount IS NULL OR refund_amount >= 0",
            name="ck_experience_bookings_refund",
        ),
        CheckConstraint(
            "card_last4 IS NULL OR length(card_last4) = 4",
            name="ck_experience_bookings_card_last4",
        ),
        CheckConstraint(
            "length(confirmation_code) = 10 AND confirmation_code GLOB 'EX[A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9]'",
            name="ck_experience_bookings_confirmation_code",
        ),
        CheckConstraint(
            "status IN ('confirmed', 'cancelled')",
            name="ck_experience_bookings_status",
        ),
        CheckConstraint(
            "payment_method_type IS NULL OR payment_method_type IN ('card', 'upi', 'netbanking')",
            name="ck_experience_bookings_payment_method",
        ),
        Index("ix_experience_bookings_guest", "guest_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slot_id: Mapped[int] = mapped_column(ForeignKey("experience_slots.id", ondelete="RESTRICT"), nullable=False)
    guest_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    adults: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[ExperienceBookingStatus] = mapped_column(
        str_enum(ExperienceBookingStatus, 16),
        nullable=False,
    )
    price_per_guest_snapshot: Mapped[int] = mapped_column(Integer, nullable=False)
    total_snapshot: Mapped[int] = mapped_column(Integer, nullable=False)
    confirmation_code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    payment_method_type: Mapped[PaymentMethodType | None] = mapped_column(str_enum(PaymentMethodType, 16))
    card_brand: Mapped[str | None] = mapped_column(String(20))
    card_last4: Mapped[str | None] = mapped_column(String(4))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    refund_amount: Mapped[int | None] = mapped_column(Integer)

    slot: Mapped[ExperienceSlot] = relationship(back_populates="bookings")
    guest: Mapped["User"] = relationship(back_populates="experience_bookings")
    review: Mapped["ExperienceReview | None"] = relationship(back_populates="booking", uselist=False)


class ExperienceReview(CreatedAtMixin, Base):
    __tablename__ = "experience_reviews"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_experience_reviews_rating"),
        UniqueConstraint("booking_id", name="uq_experience_reviews_booking"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking_id: Mapped[int] = mapped_column(
        ForeignKey("experience_bookings.id", ondelete="CASCADE"),
        nullable=False,
    )
    experience_id: Mapped[int] = mapped_column(
        ForeignKey("experiences.id", ondelete="CASCADE"),
        nullable=False,
    )
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str] = mapped_column(Text, nullable=False)

    booking: Mapped[ExperienceBooking] = relationship(back_populates="review")
    experience: Mapped[Experience] = relationship(back_populates="reviews")
    author: Mapped["User"] = relationship(back_populates="experience_reviews")
