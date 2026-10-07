from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import BookingStatus, CancelReason, CancelledBy, PaymentMethodType
from app.schemas.listing import CouponOut, DiscountOut


class BookingCreate(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    num_guests: int | None = Field(default=None, ge=1)
    adults: int | None = Field(default=None, ge=1)
    children: int = Field(default=0, ge=0)
    infants: int = Field(default=0, ge=0, le=5)
    pets: int = Field(default=0, ge=0, le=5)
    message_to_host: str | None = Field(default=None, max_length=2000)
    coupon_code: str | None = None
    payment_method_type: PaymentMethodType | None = None
    card_brand: str | None = Field(default=None, max_length=20)
    card_last4: str | None = Field(default=None, pattern=r"^\d{4}$")

    @model_validator(mode="after")
    def fill_adults(self) -> "BookingCreate":
        if self.adults is None:
            if self.num_guests is None:
                raise ValueError("adults or num_guests is required")
            self.adults = self.num_guests
        if self.payment_method_type != PaymentMethodType.card and (self.card_brand or self.card_last4):
            raise ValueError("Card details only apply to card payments")
        return self


class BookingCancel(BaseModel):
    reason: CancelReason


class CompanionIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=255)


class CompanionsCreate(BaseModel):
    companions: list[CompanionIn] = Field(min_length=1, max_length=20)


class CompanionOut(BaseModel):
    id: int
    name: str
    email: str


class BookingListingOut(BaseModel):
    id: int
    title: str
    city: str
    country: str
    address: str | None = None
    cover_image: str | None
    host_name: str
    host_avatar: str | None = None
    lat: float
    lng: float


class BookingHostOut(BaseModel):
    name: str
    avatar: str | None
    joined_year: int


class PriceSnapshot(BaseModel):
    nights: int
    nightly_rate: int
    nights_total_original: int
    nights_total: int
    discount: DiscountOut | None
    coupon: CouponOut | None
    cleaning_fee: int
    service_fee: int
    taxes: int
    total: int
    total_original: int


class RefundLineOut(BaseModel):
    label: str
    amount: int


class CancellationPreview(BaseModel):
    refund_amount: int
    non_refundable_amount: int
    lines: list[RefundLineOut]
    policy_text: str


class BookingSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    listing_id: int
    check_in: date
    check_out: date
    num_guests: int
    adults: int = 1
    children: int = 0
    infants: int = 0
    pets: int = 0
    nights: int
    nightly_rate: int
    cleaning_fee: int
    service_fee: int
    taxes: int = 0
    discount_type: str | None = None
    discount_amount: int = 0
    coupon_code: str | None = None
    coupon_amount: int = 0
    original_total: int
    total_price: int
    refund_amount: int | None = None
    status: BookingStatus
    listing: BookingListingOut
    created_at: datetime | None = None
    can_review: bool = False


class BookingDetail(BookingSummary):
    guest_id: int
    message_to_host: str | None = None
    confirmation_code: str
    payment_method_type: PaymentMethodType | None = None
    card_brand: str | None = None
    card_last4: str | None = None
    paid_at: datetime | None = None
    cancel_reason: CancelReason | None = None
    cancelled_at: datetime | None = None
    cancelled_by: CancelledBy | None = None
    can_cancel: bool
    check_in_time: str
    check_out_time: str
    host: BookingHostOut
    price: PriceSnapshot
    cancellation_policy_text: str
    companions: list[CompanionOut] = []


class MyBookings(BaseModel):
    upcoming: list[BookingSummary]
    pending: list[BookingSummary]
    past: list[BookingSummary]
    cancelled: list[BookingSummary]
