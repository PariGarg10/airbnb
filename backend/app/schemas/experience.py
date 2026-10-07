from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ExperienceBookingStatus, ExperienceCategory, PaymentMethodType


class ExperienceCard(BaseModel):
    id: int
    title: str
    city: str
    avg_rating: float
    review_count: int
    price_per_guest: int
    cover_image: str | None
    category: ExperienceCategory


class ExperienceHostOut(BaseModel):
    name: str
    avatar_url: str | None
    bio: str | None
    joined_year: int


class ExperienceImageOut(BaseModel):
    url: str
    position: int


class ExperienceItineraryOut(BaseModel):
    position: int
    title: str
    description: str
    image_url: str | None


class ExperienceReviewAuthor(BaseModel):
    name: str
    avatar_url: str | None


class ExperienceReviewOut(BaseModel):
    id: int
    rating: int
    comment: str
    created_at: datetime
    author: ExperienceReviewAuthor


class ExperienceDetail(BaseModel):
    id: int
    title: str
    city: str
    region: str
    category: ExperienceCategory
    description: str
    duration_minutes: int
    language: str
    max_guests_per_slot: int
    price_per_guest: int
    private_price: int | None
    whats_included: str | None
    guest_requirements: int
    activity_level: str | None
    accessibility_note: str | None
    meeting_point_name: str
    meeting_point_address: str
    lat: float
    lng: float
    cancellation_hours: int
    avg_rating: float
    review_count: int
    images: list[ExperienceImageOut]
    host: ExperienceHostOut
    itinerary: list[ExperienceItineraryOut]
    reviews: list[ExperienceReviewOut]
    review_total: int


class ExperienceSlotOut(BaseModel):
    id: int
    start_at: datetime
    end_at: datetime
    spots_left: int
    price_per_guest: int
    private_available: bool


class ExperienceSlotsByDate(BaseModel):
    date: date
    slots: list[ExperienceSlotOut]


class ExperienceQuoteLineOut(BaseModel):
    label: str
    amount: int


class ExperienceQuoteOut(BaseModel):
    lines: list[ExperienceQuoteLineOut]
    total: int
    cancellation_text: str


class ExperienceQuoteRequest(BaseModel):
    slot_id: int
    adults: int = Field(ge=1)


class ExperienceBookingCreate(BaseModel):
    slot_id: int
    adults: int = Field(ge=1)
    payment_method_type: PaymentMethodType | None = None
    card_brand: str | None = Field(default=None, max_length=20)
    card_last4: str | None = Field(default=None, pattern=r"^\d{4}$")


class ExperienceBookingExperienceOut(BaseModel):
    id: int
    title: str
    city: str
    cover_image: str | None
    host_name: str
    host_avatar: str | None
    meeting_point_name: str
    meeting_point_address: str


class ExperienceBookingSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    adults: int
    status: ExperienceBookingStatus
    price_per_guest_snapshot: int
    total_snapshot: int
    confirmation_code: str
    start_at: datetime
    end_at: datetime
    experience: ExperienceBookingExperienceOut
    created_at: datetime
    refund_amount: int | None = None
    can_cancel: bool = False


class ExperienceBookingDetail(ExperienceBookingSummary):
    payment_method_type: PaymentMethodType | None = None
    card_brand: str | None = None
    card_last4: str | None = None
    cancelled_at: datetime | None = None
    cancellation_text: str


class ExperienceMyBookings(BaseModel):
    upcoming: list[ExperienceBookingSummary]
    past: list[ExperienceBookingSummary]
    cancelled: list[ExperienceBookingSummary]
