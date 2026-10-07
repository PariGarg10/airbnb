from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from app.models import Experience, ExperienceBooking, ExperienceSlot, User
from app.models.enums import ExperienceBookingStatus, PaymentMethodType
from app.models.experience import generate_experience_confirmation_code
from app.schemas.experience import (
    ExperienceBookingCreate,
    ExperienceBookingDetail,
    ExperienceBookingExperienceOut,
    ExperienceBookingSummary,
    ExperienceMyBookings,
    ExperienceQuoteOut,
    ExperienceQuoteRequest,
)
from app.services.experience_service import format_cancellation_deadline
from app.services.pricing_service import experience_refund_total, quote_experience


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def quote_slot(db: Session, body: ExperienceQuoteRequest) -> ExperienceQuoteOut:
    slot, experience = _load_slot(db, body.slot_id)
    _validate_adults(experience, body.adults)
    _ensure_available(slot, body.adults)
    cancel_text = (
        f"Cancel before {format_cancellation_deadline(slot.start_at, experience.cancellation_hours)} "
        "for a full refund."
    )
    priced = quote_experience(
        price_per_guest=experience.price_per_guest,
        adults=body.adults,
        cancellation_text=cancel_text,
    )
    from app.schemas.experience import ExperienceQuoteLineOut

    return ExperienceQuoteOut(
        lines=[ExperienceQuoteLineOut(label=line.label, amount=line.amount) for line in priced.lines],
        total=priced.total,
        cancellation_text=priced.cancellation_text,
    )


def create_booking(db: Session, guest: User, body: ExperienceBookingCreate) -> ExperienceBookingDetail:
    slot, experience = _load_slot(db, body.slot_id)
    if experience.host_id == guest.id:
        raise ForbiddenError("You cannot book your own experience")
    _validate_adults(experience, body.adults)
    _begin_immediate(db)
    try:
        db.refresh(slot)
        if slot.is_cancelled or not experience.is_active:
            raise NotFoundError("Experience not found")
        _ensure_available(slot, body.adults)
        method, brand, last4 = _payment(body)
        total = experience.price_per_guest * body.adults
        booking = ExperienceBooking(
            slot_id=slot.id,
            guest_id=guest.id,
            adults=body.adults,
            status=ExperienceBookingStatus.confirmed,
            price_per_guest_snapshot=experience.price_per_guest,
            total_snapshot=total,
            confirmation_code=_unique_code(db),
            payment_method_type=method,
            card_brand=brand,
            card_last4=last4,
        )
        slot.booked_count += body.adults
        db.add(booking)
        db.flush()
        booking_id = booking.id
        db.commit()
    except Exception:
        db.rollback()
        raise
    return get_booking(db, booking_id, guest)


def list_my_bookings(db: Session, guest: User) -> ExperienceMyBookings:
    now = _utc_now()
    rows = list(
        db.scalars(
            select(ExperienceBooking)
            .where(ExperienceBooking.guest_id == guest.id)
            .options(*_booking_options())
        )
    )
    upcoming = [
        row
        for row in rows
        if row.status == ExperienceBookingStatus.confirmed and _as_utc(row.slot.start_at) > now
    ]
    past = [
        row
        for row in rows
        if row.status == ExperienceBookingStatus.confirmed and _as_utc(row.slot.start_at) <= now
    ]
    cancelled = [row for row in rows if row.status == ExperienceBookingStatus.cancelled]
    return ExperienceMyBookings(
        upcoming=[_summary(row) for row in sorted(upcoming, key=lambda r: (r.slot.start_at, r.id))],
        past=[_summary(row) for row in sorted(past, key=lambda r: (r.slot.start_at, r.id), reverse=True)],
        cancelled=[_summary(row) for row in sorted(cancelled, key=lambda r: (r.cancelled_at or r.created_at, r.id), reverse=True)],
    )


def get_booking(db: Session, booking_id: int, user: User) -> ExperienceBookingDetail:
    booking = _get_booking(db, booking_id)
    if booking.guest_id != user.id:
        raise ForbiddenError("You cannot view this booking")
    return _detail(booking)


def cancel_booking(db: Session, user: User, booking_id: int) -> ExperienceBookingDetail:
    booking = _get_booking(db, booking_id)
    if booking.guest_id != user.id:
        raise ForbiddenError("Only the guest can cancel this booking")
    if booking.status != ExperienceBookingStatus.confirmed:
        raise BadRequestError("Only a confirmed booking can be cancelled")
    now = _utc_now()
    start = _as_utc(booking.slot.start_at)
    if start <= now:
        raise BadRequestError("This experience has already started")
    experience = booking.slot.experience
    deadline = start - _cancel_delta(experience.cancellation_hours)
    full = now <= deadline
    refund = experience_refund_total(total=booking.total_snapshot, full=full)
    booking.status = ExperienceBookingStatus.cancelled
    booking.cancelled_at = now
    booking.refund_amount = refund
    booking.slot.booked_count = max(0, booking.slot.booked_count - booking.adults)
    db.commit()
    db.refresh(booking)
    return _detail(booking)


def _cancel_delta(hours: int):
    from datetime import timedelta

    return timedelta(hours=hours)


def _load_slot(db: Session, slot_id: int) -> tuple[ExperienceSlot, Experience]:
    slot = db.scalar(
        select(ExperienceSlot)
        .where(ExperienceSlot.id == slot_id)
        .options(selectinload(ExperienceSlot.experience).selectinload(Experience.images))
    )
    if slot is None or slot.is_cancelled:
        raise NotFoundError("Slot not found")
    experience = slot.experience
    if not experience.is_active:
        raise NotFoundError("Experience not found")
    if _as_utc(slot.start_at) <= _utc_now():
        raise BadRequestError("This time has passed")
    return slot, experience


def _validate_adults(experience: Experience, adults: int) -> None:
    if adults > experience.max_guests_per_slot:
        raise BadRequestError(f"This experience allows at most {experience.max_guests_per_slot} guests per slot")


def _ensure_available(slot: ExperienceSlot, adults: int) -> None:
    if slot.capacity - slot.booked_count < adults:
        raise ConflictError("This time is no longer available")


def _payment(body: ExperienceBookingCreate) -> tuple[PaymentMethodType | None, str | None, str | None]:
    if body.payment_method_type is None:
        return None, None, None
    if body.payment_method_type == PaymentMethodType.card:
        brand = body.card_brand.strip() if body.card_brand else None
        return body.payment_method_type, brand or None, body.card_last4
    return body.payment_method_type, None, None


def _unique_code(db: Session) -> str:
    for _ in range(5):
        code = generate_experience_confirmation_code()
        taken = db.scalar(select(ExperienceBooking.id).where(ExperienceBooking.confirmation_code == code))
        if taken is None:
            return code
    raise RuntimeError("Could not allocate a confirmation code")


def _begin_immediate(db: Session) -> None:
    if db.get_bind().dialect.name == "sqlite":
        db.connection().exec_driver_sql("BEGIN IMMEDIATE")


def _booking_options():
    return (
        selectinload(ExperienceBooking.slot).selectinload(ExperienceSlot.experience).selectinload(Experience.images),
        selectinload(ExperienceBooking.slot).selectinload(ExperienceSlot.experience).selectinload(Experience.host),
    )


def _get_booking(db: Session, booking_id: int) -> ExperienceBooking:
    booking = db.scalar(select(ExperienceBooking).where(ExperienceBooking.id == booking_id).options(*_booking_options()))
    if booking is None:
        raise NotFoundError("Booking not found")
    return booking


def _experience_out(booking: ExperienceBooking) -> ExperienceBookingExperienceOut:
    exp = booking.slot.experience
    cover = exp.images[0].url if exp.images else None
    return ExperienceBookingExperienceOut(
        id=exp.id,
        title=exp.title,
        city=exp.city,
        cover_image=cover,
        host_name=exp.host.name,
        host_avatar=exp.host.avatar_url,
        meeting_point_name=exp.meeting_point_name,
        meeting_point_address=exp.meeting_point_address,
    )


def _can_cancel(booking: ExperienceBooking) -> bool:
    if booking.status != ExperienceBookingStatus.confirmed:
        return False
    return _as_utc(booking.slot.start_at) > _utc_now()


def _summary(booking: ExperienceBooking) -> ExperienceBookingSummary:
    return ExperienceBookingSummary(
        id=booking.id,
        adults=booking.adults,
        status=booking.status,
        price_per_guest_snapshot=booking.price_per_guest_snapshot,
        total_snapshot=booking.total_snapshot,
        confirmation_code=booking.confirmation_code,
        start_at=booking.slot.start_at,
        end_at=booking.slot.end_at,
        experience=_experience_out(booking),
        created_at=booking.created_at,
        refund_amount=booking.refund_amount,
        can_cancel=_can_cancel(booking),
    )


def _detail(booking: ExperienceBooking) -> ExperienceBookingDetail:
    exp = booking.slot.experience
    cancel_text = (
        f"Cancel before {format_cancellation_deadline(booking.slot.start_at, exp.cancellation_hours)} "
        "for a full refund."
    )
    return ExperienceBookingDetail(
        id=booking.id,
        adults=booking.adults,
        status=booking.status,
        price_per_guest_snapshot=booking.price_per_guest_snapshot,
        total_snapshot=booking.total_snapshot,
        confirmation_code=booking.confirmation_code,
        start_at=booking.slot.start_at,
        end_at=booking.slot.end_at,
        experience=_experience_out(booking),
        created_at=booking.created_at,
        refund_amount=booking.refund_amount,
        can_cancel=_can_cancel(booking),
        payment_method_type=booking.payment_method_type,
        card_brand=booking.card_brand,
        card_last4=booking.card_last4,
        cancelled_at=booking.cancelled_at,
        cancellation_text=cancel_text,
    )
