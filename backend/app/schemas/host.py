from datetime import date, datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl, field_validator, model_validator

from app.models.enums import BookingMode, BookingStatus, OccupantType, PropertyType, RoomType


def _half_step(value: float) -> bool:
    return abs(value * 2 - round(value * 2)) < 1e-9


class ListingImageIn(BaseModel):
    url: HttpUrl
    caption: str | None = Field(default=None, max_length=250)


class ListingCreate(BaseModel):
    title: str = Field(min_length=5, max_length=50)
    description: str = Field(min_length=20, max_length=2000)
    property_type: PropertyType
    room_type: RoomType
    category: str = Field(min_length=1, max_length=50)
    address: str = Field(min_length=1, max_length=255)
    city: str = Field(min_length=1, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    country: str = Field(min_length=1, max_length=100)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    price_per_night: int = Field(gt=0)
    cleaning_fee: int = Field(ge=0)
    max_guests: int = Field(ge=1)
    bedrooms: int = Field(ge=0)
    beds: int = Field(ge=1)
    private_bathrooms: float = Field(ge=0)
    dedicated_bathrooms: float = Field(ge=0)
    shared_bathrooms: float = Field(ge=0)
    images: list[ListingImageIn] = Field(min_length=1, max_length=20)
    amenity_ids: list[int]
    booking_mode: BookingMode = BookingMode.instant
    show_precise_location: bool = False
    bedrooms_have_locks: bool | None = None
    weekend_adjustment_pct: int = Field(default=0, ge=0, le=99)
    discount_new_listing_pct: int = Field(default=20, ge=0, le=99)
    discount_last_minute_pct: int = Field(default=0, ge=0, le=99)
    discount_weekly_pct: int = Field(default=0, ge=0, le=99)
    discount_monthly_pct: int = Field(default=0, ge=0, le=99)
    has_exterior_camera: bool = False
    has_noise_monitor: bool = False
    has_weapons: bool = False
    allows_pets: bool = False
    occupants: list[OccupantType] = Field(default_factory=list)

    @field_validator("private_bathrooms", "dedicated_bathrooms", "shared_bathrooms")
    @classmethod
    def bathroom_half_steps(cls, value: float) -> float:
        if not _half_step(value):
            raise ValueError("Bathroom counts must be in steps of 0.5")
        return value

    @model_validator(mode="after")
    def bathroom_total_positive(self) -> "ListingCreate":
        total = self.private_bathrooms + self.dedicated_bathrooms + self.shared_bathrooms
        if total <= 0:
            raise ValueError("At least one bathroom is required")
        return self

    @field_validator("occupants")
    @classmethod
    def unique_occupants(cls, value: list[OccupantType]) -> list[OccupantType]:
        if len(value) != len(set(value)):
            raise ValueError("Duplicate occupant types are not allowed")
        return value


class ListingStatusUpdate(BaseModel):
    is_active: bool


class HostListingOut(BaseModel):
    id: int
    title: str
    city: str
    country: str
    cover_image: str | None
    price: int
    avg_rating: float
    is_active: bool
    total_bookings: int
    upcoming_bookings: int


class ListingDeleteResult(BaseModel):
    deleted: Literal["soft", "hard"]


class HostBookingStatus(str, Enum):
    upcoming = "upcoming"
    current = "current"
    completed = "completed"
    cancelled = "cancelled"
    pending = "pending"


class HostBookingGuest(BaseModel):
    name: str
    avatar_url: str | None


class HostBookingListing(BaseModel):
    id: int
    title: str
    cover_image: str | None


class HostBookingOut(BaseModel):
    id: int
    guest: HostBookingGuest
    listing: HostBookingListing
    check_in: date
    check_out: date
    guests: int
    total_price: int
    status: BookingStatus
    message_to_host: str | None = None
    created_at: datetime


class HostStats(BaseModel):
    total_listings: int
    active_listings: int
    upcoming_bookings: int
    earnings_this_month: int


class HostProfileOut(BaseModel):
    model_config = {"from_attributes": True}

    country: str
    flat: str | None
    street: str
    landmark: str | None
    district: str | None
    city: str
    state: str | None
    pin_code: str
    is_business: bool
    updated_at: datetime


class HostProfileUpdate(BaseModel):
    country: str = Field(min_length=1, max_length=100)
    flat: str | None = Field(default=None, max_length=100)
    street: str = Field(min_length=1, max_length=255)
    landmark: str | None = Field(default=None, max_length=255)
    district: str | None = Field(default=None, max_length=100)
    city: str = Field(min_length=1, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    pin_code: str = Field(min_length=1, max_length=20)
    is_business: bool = False

