"""A booking freezes the price the guest agreed to.

nightly_rate (average), cleaning_fee, service_fee, taxes, coupon, and
total_price are a snapshot. Later edits to the listing price do not change
what this stay cost. Money columns are integers.

check_in is inclusive and check_out is exclusive: a stay occupies
[check_in, check_out). The next guest may check in on the checkout date.
overlap_condition blocks pending and confirmed stays. Declined, expired, and
cancelled stays do not.

Card numbers are never stored. card_brand and card_last4 are the only card
fields, and both are optional.
"""

import secrets
import string
from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint,
    ColumnElement,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    and_,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import CreatedAtMixin
from app.models.enums import (
    BookingStatus,
    CancelReason,
    CancelledBy,
    DiscountType,
    PaymentMethodType,
    str_enum,
)

BLOCKING_STATUSES = (BookingStatus.pending, BookingStatus.confirmed)
_CODE_ALPHABET = string.ascii_uppercase + string.digits


def generate_confirmation_code() -> str:
    suffix = "".join(secrets.choice(_CODE_ALPHABET) for _ in range(8))
    return f"HM{suffix}"


class Booking(CreatedAtMixin, Base):
    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint("check_out > check_in", name="ck_bookings_dates"),
        CheckConstraint("num_guests >= 1", name="ck_bookings_num_guests"),
        CheckConstraint("adults >= 1", name="ck_bookings_adults"),
        CheckConstraint("children >= 0", name="ck_bookings_children"),
        CheckConstraint("infants >= 0 AND infants <= 5", name="ck_bookings_infants"),
        CheckConstraint("pets >= 0 AND pets <= 5", name="ck_bookings_pets"),
        CheckConstraint("nights >= 1", name="ck_bookings_nights"),
        CheckConstraint("total_price >= 0", name="ck_bookings_total_price"),
        CheckConstraint("discount_amount >= 0", name="ck_bookings_discount_amount"),
        CheckConstraint("original_total >= 0", name="ck_bookings_original_total"),
        CheckConstraint("taxes >= 0", name="ck_bookings_taxes"),
        CheckConstraint("coupon_amount >= 0", name="ck_bookings_coupon_amount"),
        CheckConstraint(
            "refund_amount IS NULL OR refund_amount >= 0",
            name="ck_bookings_refund_amount",
        ),
        CheckConstraint(
            "card_last4 IS NULL OR length(card_last4) = 4",
            name="ck_bookings_card_last4",
        ),
        CheckConstraint(
            "length(confirmation_code) = 10 AND confirmation_code GLOB 'HM[A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9]'",
            name="ck_bookings_confirmation_code",
        ),
        CheckConstraint(
            "status IN ('pending', 'confirmed', 'declined', 'expired', 'cancelled')",
            name="ck_bookings_status",
        ),
        CheckConstraint(
            "payment_method_type IS NULL OR payment_method_type IN ('card', 'upi', 'netbanking')",
            name="ck_bookings_payment_method",
        ),
        CheckConstraint(
            "cancelled_by IS NULL OR cancelled_by IN ('guest', 'host', 'system')",
            name="ck_bookings_cancelled_by",
        ),
        CheckConstraint(
            "cancel_reason IS NULL OR cancel_reason IN ("
            "'plans_changed', 'found_another_place', 'travel_restrictions', "
            "'host_asked', 'personal_emergency', 'other')",
            name="ck_bookings_cancel_reason",
        ),
        Index("ix_bookings_listing_dates", "listing_id", "check_in", "check_out"),
        Index("ix_bookings_guest", "guest_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    listing_id: Mapped[int] = mapped_column(
        ForeignKey("listings.id", ondelete="RESTRICT"),
        nullable=False,
    )
    guest_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    check_in: Mapped[date] = mapped_column(Date, nullable=False)
    check_out: Mapped[date] = mapped_column(Date, nullable=False)
    num_guests: Mapped[int] = mapped_column(Integer, nullable=False)
    adults: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default=text("1"))
    children: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=text("0"))
    infants: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=text("0"))
    pets: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=text("0"))
    message_to_host: Mapped[str | None] = mapped_column(Text)
    nights: Mapped[int] = mapped_column(Integer, nullable=False)
    nightly_rate: Mapped[int] = mapped_column(Integer, nullable=False)
    cleaning_fee: Mapped[int] = mapped_column(Integer, nullable=False)
    service_fee: Mapped[int] = mapped_column(Integer, nullable=False)
    discount_type: Mapped[DiscountType | None] = mapped_column(str_enum(DiscountType), nullable=True)
    discount_amount: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    taxes: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=text("0"))
    coupon_code: Mapped[str | None] = mapped_column(String(32))
    coupon_amount: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    original_total: Mapped[int] = mapped_column(Integer, nullable=False)
    total_price: Mapped[int] = mapped_column(Integer, nullable=False)
    confirmation_code: Mapped[str] = mapped_column(
        String(10),
        unique=True,
        nullable=False,
        default=generate_confirmation_code,
    )
    payment_method_type: Mapped[PaymentMethodType | None] = mapped_column(
        str_enum(PaymentMethodType),
        nullable=True,
    )
    card_brand: Mapped[str | None] = mapped_column(String(20))
    card_last4: Mapped[str | None] = mapped_column(String(4))
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancel_reason: Mapped[CancelReason | None] = mapped_column(str_enum(CancelReason), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    refund_amount: Mapped[int | None] = mapped_column(Integer)
    cancelled_by: Mapped[CancelledBy | None] = mapped_column(str_enum(CancelledBy), nullable=True)
    status: Mapped[BookingStatus] = mapped_column(
        str_enum(BookingStatus),
        nullable=False,
        default=BookingStatus.confirmed,
        server_default=text("'confirmed'"),
    )

    listing: Mapped["Listing"] = relationship(back_populates="bookings")
    guest: Mapped["User"] = relationship(back_populates="bookings")
    review: Mapped["Review | None"] = relationship(
        back_populates="booking",
        uselist=False,
        passive_deletes="all",
    )
    companions: Mapped[list["BookingCompanion"]] = relationship(
        back_populates="booking",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class BookingCompanion(Base):
    __tablename__ = "booking_companions"
    __table_args__ = (
        CheckConstraint("length(trim(name)) > 0", name="ck_companions_name"),
        CheckConstraint("length(email) > 0", name="ck_companions_email"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking_id: Mapped[int] = mapped_column(
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)

    booking: Mapped["Booking"] = relationship(back_populates="companions")


def overlap_condition(
    listing_id: int,
    check_in: date,
    check_out: date,
) -> ColumnElement[bool]:
    """Pending and confirmed stays on this listing that overlap [check_in, check_out).

    Back-to-back stays do not overlap: checkout on day D and a check-in on
    day D are both allowed. Declined, expired, and cancelled stays do not block.
    """
    return and_(
        Booking.listing_id == listing_id,
        Booking.status.in_(BLOCKING_STATUSES),
        Booking.check_in < check_out,
        Booking.check_out > check_in,
    )
