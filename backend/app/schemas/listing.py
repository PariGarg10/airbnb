from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import BookingMode, OccupantType, PropertyType, RoomType


class ListingCard(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    city: str
    country: str
    property_type: PropertyType
    room_type: RoomType
    price_per_night: int
    avg_rating: float
    review_count: int
    bedrooms: int
    beds: int
    nights: int | None = None
    stay_total: int | None = None
    stay_original_total: int | None = None
    images: list[str]
    lat: float
    lng: float
    host_is_superhost: bool
    is_wishlisted: bool


class ListingImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    caption: str | None
    position: int


class AmenityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    icon: str
    group_name: str


class HostOut(BaseModel):
    id: int
    name: str
    avatar_url: str | None
    is_superhost: bool
    bio: str | None
    joined_year: int
    listing_count: int


class DiscountOut(BaseModel):
    type: str
    pct: int
    amount: int
    reason_text: str


class CouponOut(BaseModel):
    code: str
    amount: int


class NightlyBreakdownOut(BaseModel):
    weekday_nights: int
    weekend_nights: int
    weekday_rate: int
    weekend_rate: int
    weekday_subtotal: int
    weekend_subtotal: int


class ListingDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    property_type: PropertyType
    room_type: RoomType
    category: str
    address: str | None
    city: str
    state: str | None
    country: str
    lat: float
    lng: float
    location_is_approximate: bool
    price_per_night: int
    cleaning_fee: int
    max_guests: int
    bedrooms: int
    beds: int
    bathrooms: float
    private_bathrooms: float
    dedicated_bathrooms: float
    shared_bathrooms: float
    avg_rating: float
    review_count: int
    booking_mode: BookingMode
    instant_book: bool
    show_precise_location: bool
    bedrooms_have_locks: bool | None
    weekend_adjustment_pct: int
    discount_new_listing_pct: int
    discount_last_minute_pct: int
    discount_weekly_pct: int
    discount_monthly_pct: int
    has_exterior_camera: bool
    has_noise_monitor: bool
    has_weapons: bool
    allows_pets: bool
    occupants: list[OccupantType]
    images: list[ListingImageOut]
    amenities: list[AmenityOut]
    host: HostOut
    is_wishlisted: bool


class BookedRange(BaseModel):
    check_in: date
    check_out: date


class StayQuote(BaseModel):
    nights: int
    nightly_rate: int
    nightly_breakdown: NightlyBreakdownOut
    nights_total_original: int
    nights_total: int
    discount: DiscountOut | None
    coupon: CouponOut | None = None
    cleaning_fee: int
    service_fee: int
    taxes: int
    total: int
    original_total: int
    total_original: int
    is_rare_find: bool = False


class CategoryCount(BaseModel):
    category: str
    listing_count: int

