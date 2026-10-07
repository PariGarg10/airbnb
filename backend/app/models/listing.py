"""A listing is the bookable place. Money is whole currency units (INR), never float.

avg_rating and review_count are denormalized so search cards do not aggregate
reviews on every request. They are a cache, not the source of truth, and are
not used to compute charges.

is_active is a soft delete. Past bookings still point at the listing
(ON DELETE RESTRICT), so a host hides a place instead of removing its history.

Images are ordered by position and removed with the listing. Amenities are a
many-to-many link to the shared catalog.
"""

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Float,
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
from app.models.amenity import listing_amenities
from app.models.base import TimestampMixin
from app.models.enums import BookingMode, OccupantType, PropertyType, RoomType, str_enum


def _half_step(name: str) -> str:
    return f"({name} * 2) = CAST(({name} * 2) AS INTEGER)"


class Listing(TimestampMixin, Base):
    __tablename__ = "listings"
    __table_args__ = (
        CheckConstraint("price_per_night > 0", name="ck_listings_price_positive"),
        CheckConstraint("cleaning_fee >= 0", name="ck_listings_cleaning_fee_non_negative"),
        CheckConstraint("max_guests >= 1", name="ck_listings_max_guests"),
        CheckConstraint("bedrooms >= 0", name="ck_listings_bedrooms"),
        CheckConstraint("beds >= 1", name="ck_listings_beds"),
        CheckConstraint("bathrooms >= 0", name="ck_listings_bathrooms"),
        CheckConstraint(_half_step("private_bathrooms"), name="ck_listings_private_bathrooms_half"),
        CheckConstraint(_half_step("dedicated_bathrooms"), name="ck_listings_dedicated_bathrooms_half"),
        CheckConstraint(_half_step("shared_bathrooms"), name="ck_listings_shared_bathrooms_half"),
        CheckConstraint("private_bathrooms >= 0", name="ck_listings_private_bathrooms"),
        CheckConstraint("dedicated_bathrooms >= 0", name="ck_listings_dedicated_bathrooms"),
        CheckConstraint("shared_bathrooms >= 0", name="ck_listings_shared_bathrooms"),
        CheckConstraint("weekend_adjustment_pct >= 0 AND weekend_adjustment_pct <= 99", name="ck_listings_weekend_adj"),
        CheckConstraint(
            "discount_new_listing_pct >= 0 AND discount_new_listing_pct <= 99",
            name="ck_listings_discount_new",
        ),
        CheckConstraint(
            "discount_last_minute_pct >= 0 AND discount_last_minute_pct <= 99",
            name="ck_listings_discount_last_minute",
        ),
        CheckConstraint(
            "discount_weekly_pct >= 0 AND discount_weekly_pct <= 99",
            name="ck_listings_discount_weekly",
        ),
        CheckConstraint(
            "discount_monthly_pct >= 0 AND discount_monthly_pct <= 99",
            name="ck_listings_discount_monthly",
        ),
        CheckConstraint("avg_rating >= 0 AND avg_rating <= 5", name="ck_listings_avg_rating"),
        CheckConstraint("lat >= -90 AND lat <= 90", name="ck_listings_lat"),
        CheckConstraint("lng >= -180 AND lng <= 180", name="ck_listings_lng"),
        Index("ix_listings_city", "city"),
        Index("ix_listings_price", "price_per_night"),
        Index("ix_listings_host", "host_id"),
        Index("ix_listings_active_category", "is_active", "category"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    host_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    property_type: Mapped[PropertyType] = mapped_column(str_enum(PropertyType), nullable=False)
    room_type: Mapped[RoomType] = mapped_column(str_enum(RoomType), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    address: Mapped[str | None] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str | None] = mapped_column(String(100))
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    price_per_night: Mapped[int] = mapped_column(Integer, nullable=False)
    cleaning_fee: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    max_guests: Mapped[int] = mapped_column(Integer, nullable=False)
    bedrooms: Mapped[int] = mapped_column(Integer, nullable=False)
    beds: Mapped[int] = mapped_column(Integer, nullable=False)
    bathrooms: Mapped[float] = mapped_column(Float, nullable=False)
    private_bathrooms: Mapped[float] = mapped_column(
        Float, nullable=False, default=0, server_default=text("0")
    )
    dedicated_bathrooms: Mapped[float] = mapped_column(
        Float, nullable=False, default=0, server_default=text("0")
    )
    shared_bathrooms: Mapped[float] = mapped_column(
        Float, nullable=False, default=0, server_default=text("0")
    )
    avg_rating: Mapped[float] = mapped_column(
        Float, nullable=False, default=0, server_default=text("0")
    )
    review_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("1")
    )
    booking_mode: Mapped[BookingMode] = mapped_column(
        str_enum(BookingMode),
        nullable=False,
        default=BookingMode.instant,
        server_default=text("'instant'"),
    )
    instant_book: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("1")
    )
    show_precise_location: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("0")
    )
    bedrooms_have_locks: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    weekend_adjustment_pct: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    discount_new_listing_pct: Mapped[int] = mapped_column(
        Integer, nullable=False, default=20, server_default=text("20")
    )
    discount_last_minute_pct: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    discount_weekly_pct: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    discount_monthly_pct: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    has_exterior_camera: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("0")
    )
    has_noise_monitor: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("0")
    )
    has_weapons: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("0")
    )
    allows_pets: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("0")
    )

    host: Mapped["User"] = relationship(back_populates="listings")
    images: Mapped[list["ListingImage"]] = relationship(
        back_populates="listing",
        order_by="ListingImage.position",
        cascade="all, delete-orphan",
    )
    occupants: Mapped[list["ListingOccupant"]] = relationship(
        back_populates="listing",
        cascade="all, delete-orphan",
    )
    amenities: Mapped[list["Amenity"]] = relationship(
        secondary=listing_amenities,
        back_populates="listings",
    )
    bookings: Mapped[list["Booking"]] = relationship(
        back_populates="listing",
        passive_deletes="all",
    )
    reviews: Mapped[list["Review"]] = relationship(
        back_populates="listing",
        passive_deletes="all",
    )


class ListingImage(Base):
    __tablename__ = "listing_images"
    __table_args__ = (
        UniqueConstraint("listing_id", "position", name="uq_listing_images_listing_position"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    listing_id: Mapped[int] = mapped_column(
        ForeignKey("listings.id", ondelete="CASCADE"),
        nullable=False,
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    caption: Mapped[str | None] = mapped_column(String(250))
    position: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )

    listing: Mapped["Listing"] = relationship(back_populates="images")


class ListingOccupant(Base):
    __tablename__ = "listing_occupants"

    listing_id: Mapped[int] = mapped_column(
        ForeignKey("listings.id", ondelete="CASCADE"),
        primary_key=True,
    )
    occupant_type: Mapped[OccupantType] = mapped_column(
        str_enum(OccupantType),
        primary_key=True,
    )

    listing: Mapped["Listing"] = relationship(back_populates="occupants")
