from datetime import date, datetime, time, timedelta, timezone
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from app.models import Booking, BookingCompanion, Listing, User
from app.models.booking import generate_confirmation_code
from app.models.enums import BookingMode, BookingStatus, CancelReason, CancelledBy, PaymentMethodType
from app.schemas.booking import (
    BookingCreate,
    BookingDetail,
    BookingHostOut,
    BookingListingOut,
    BookingSummary,
    CancellationPreview,
    CompanionIn,
    CompanionOut,
    MyBookings,
    PriceSnapshot,
)
from app.schemas.listing import CouponOut, DiscountOut
from app.services.booking_expiry import expire_stale_pending
from app.services.coupon_service import claim_coupon, require_coupon
from app.services.listing_pricing import confirmed_booking_count, quote_listing_stay
from app.services.listing_service import has_date_conflict, validate_stay
from app.services.pricing_service import (
    POLICY_TEXT,
    booking_price_fields,
    compute_refund,
    discount_reason,
    snapshot_nights_total,
)

CHECK_IN_TIME = time(15, 0)
CHECK_IN_LABEL = "15:00"
CHECK_OUT_LABEL = "11:00"
_OPEN_STATUSES = (BookingStatus.pending, BookingStatus.confirmed)
_CLOSED_STATUSES = (BookingStatus.cancelled, BookingStatus.declined, BookingStatus.expired)


def create_booking(db: Session, guest: User, body: BookingCreate) -> BookingDetail:
    listing = _active_listing(db, body.listing_id)
    if listing.host_id == guest.id:
        raise ForbiddenError("You cannot book your own listing")
    adults = body.adults if body.adults is not None else body.num_guests or 1
    _validate_party(listing, adults, body.children, body.infants, body.pets)
    guests = adults + body.children
    validate_stay(listing, body.check_in, body.check_out, guests)
    coupon = require_coupon(db, body.coupon_code) if body.coupon_code and body.coupon_code.strip() else None

    _begin_immediate(db)
    try:
        db.refresh(listing)
        if not listing.is_active:
            raise NotFoundError("Listing not found")
        _validate_party(listing, adults, body.children, body.infants, body.pets)
        validate_stay(listing, body.check_in, body.check_out, guests)
        expire_stale_pending(db, listing_id=listing.id, commit=False)
        if has_date_conflict(db, listing.id, body.check_in, body.check_out):
            raise ConflictError("These dates are already booked")
        if coupon is not None:
            claim_coupon(db, coupon)
        status = _initial_status(listing, confirmed_booking_count(db, listing.id))
        message = _clean_message(body.message_to_host)
        if status == BookingStatus.pending and message is None:
            raise BadRequestError("A message to the host is required when the host must approve this request")
        priced = quote_listing_stay(
            db,
            listing,
            body.check_in,
            body.check_out,
            coupon_code=coupon.code if coupon else None,
            coupon_percent=coupon.percent_off if coupon else None,
        )
        method, brand, last4, paid_at = _payment(body)
        booking = Booking(
            listing_id=listing.id,
            guest_id=guest.id,
            check_in=body.check_in,
            check_out=body.check_out,
            num_guests=guests,
            adults=adults,
            children=body.children,
            infants=body.infants,
            pets=body.pets,
            message_to_host=message,
            confirmation_code=_unique_code(db),
            payment_method_type=method,
            card_brand=brand,
            card_last4=last4,
            paid_at=paid_at,
            status=status,
            **booking_price_fields(priced),
        )
        db.add(booking)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return get_booking(db, booking.id, guest)


def list_my_bookings(db: Session, guest: User) -> MyBookings:
    expire_stale_pending(db, commit=True)
    today = date.today()
    rows = list(
        db.scalars(
            select(Booking).where(Booking.guest_id == guest.id).options(*_booking_options())
        )
    )
    upcoming = [row for row in rows if row.status == BookingStatus.confirmed and row.check_out > today]
    pending = [row for row in rows if row.status == BookingStatus.pending]
    past = [row for row in rows if row.status == BookingStatus.confirmed and row.check_out <= today]
    cancelled = [row for row in rows if row.status in _CLOSED_STATUSES]
    return MyBookings(
        upcoming=[_summary(row, guest) for row in sorted(upcoming, key=lambda row: (row.check_in, row.id))],
        pending=[_summary(row, guest) for row in sorted(pending, key=lambda row: (row.check_in, row.id))],
        past=[_summary(row, guest) for row in sorted(past, key=lambda row: (row.check_out, row.id), reverse=True)],
        cancelled=[_summary(row, guest) for row in sorted(cancelled, key=_closed_sort, reverse=True)],
    )


def get_booking(db: Session, booking_id: int, user: User) -> BookingDetail:
    expire_stale_pending(db, commit=True)
    booking = _get_booking(db, booking_id)
    db.refresh(booking)
    _require_participant(booking, user)
    return _detail(booking, user)


def cancellation_preview(db: Session, user: User, booking_id: int) -> CancellationPreview:
    booking = _load_for_guest_change(db, user, booking_id)
    _require_cancellable(booking)
    return _preview_out(booking)


def cancel_booking(db: Session, user: User, booking_id: int, reason: CancelReason) -> BookingDetail:
    booking = _load_for_guest_change(db, user, booking_id)
    _require_cancellable(booking)
    preview = _preview_for(booking)
    booking.status = BookingStatus.cancelled
    booking.cancel_reason = reason
    booking.cancelled_at = datetime.now(timezone.utc)
    booking.cancelled_by = CancelledBy.guest
    booking.refund_amount = preview.refund_amount
    db.commit()
    return _detail(booking, user)


def accept_booking(db: Session, host: User, booking_id: int) -> BookingDetail:
    booking = _pending_for_host(db, host, booking_id)
    booking.status = BookingStatus.confirmed
    db.commit()
    return _detail(booking, host)


def decline_booking(db: Session, host: User, booking_id: int) -> BookingDetail:
    booking = _pending_for_host(db, host, booking_id)
    booking.status = BookingStatus.declined
    booking.refund_amount = booking.total_price
    booking.cancelled_by = CancelledBy.host
    booking.cancelled_at = datetime.now(timezone.utc)
    db.commit()
    return _detail(booking, host)


def add_companions(db: Session, user: User, booking_id: int, companions: list[CompanionIn]) -> list[CompanionOut]:
    booking = _get_booking(db, booking_id)
    if booking.guest_id != user.id:
        raise ForbiddenError("Only the guest can share this trip")
    if booking.status not in _OPEN_STATUSES:
        raise BadRequestError("This booking cannot be updated")
    limit = booking.adults + booking.children - 1
    if len(booking.companions) + len(companions) > limit:
        raise BadRequestError(f"You can share this trip with at most {limit} other guests")
    for companion in companions:
        name = companion.name.strip()
        email = companion.email.strip()
        if not name or not email:
            raise BadRequestError("Each companion needs a name and an email")
        db.add(BookingCompanion(booking_id=booking.id, name=name, email=email))
    db.commit()
    db.refresh(booking)
    return [_companion_out(row) for row in sorted(booking.companions, key=lambda row: row.id)]


def _pending_for_host(db: Session, host: User, booking_id: int) -> Booking:
    booking = _get_booking(db, booking_id)
    if booking.listing.host_id != host.id:
        raise ForbiddenError("You do not own this listing")
    expire_stale_pending(db, commit=True)
    db.refresh(booking)
    if booking.status == BookingStatus.expired:
        raise BadRequestError("This request has expired")
    if booking.status != BookingStatus.pending:
        raise ConflictError("This request is no longer pending")
    return booking


def _load_for_guest_change(db: Session, user: User, booking_id: int) -> Booking:
    booking = _get_booking(db, booking_id)
    if booking.guest_id != user.id:
        raise ForbiddenError("Only the guest can cancel this booking")
    expire_stale_pending(db, commit=True)
    db.refresh(booking)
    return booking


def _require_cancellable(booking: Booking) -> None:
    if booking.status not in _OPEN_STATUSES:
        raise BadRequestError("Only a pending or confirmed booking can be cancelled")
    if booking.check_in <= date.today():
        raise BadRequestError("A booking can only be cancelled before check-in")


def _preview_for(booking: Booking, now: datetime | None = None):
    clock = now or datetime.now()
    if clock.tzinfo is not None:
        clock = clock.astimezone().replace(tzinfo=None)
    check_in_at = datetime.combine(booking.check_in, CHECK_IN_TIME)
    full = booking.status == BookingStatus.pending or clock <= check_in_at - timedelta(hours=24)
    nights_total = snapshot_nights_total(
        total_price=booking.total_price,
        cleaning_fee=booking.cleaning_fee,
        service_fee=booking.service_fee,
        taxes=booking.taxes,
        coupon_amount=booking.coupon_amount,
    )
    return compute_refund(
        nights_total=nights_total,
        coupon_amount=booking.coupon_amount,
        cleaning_fee=booking.cleaning_fee,
        service_fee=booking.service_fee,
        taxes=booking.taxes,
        total=booking.total_price,
        full=full,
    )


def _preview_out(booking: Booking, now: datetime | None = None) -> CancellationPreview:
    priced = _preview_for(booking, now)
    return CancellationPreview(
        refund_amount=priced.refund_amount,
        non_refundable_amount=priced.non_refundable_amount,
        lines=[{"label": line.label, "amount": line.amount} for line in priced.lines],
        policy_text=priced.policy_text,
    )


def _initial_status(listing: Listing, confirmed_count: int) -> BookingStatus:
    if listing.booking_mode == BookingMode.instant or confirmed_count >= 5:
        return BookingStatus.confirmed
    return BookingStatus.pending


def _validate_party(listing: Listing, adults: int, children: int, infants: int, pets: int) -> None:
    if adults < 1:
        raise BadRequestError("At least one adult is required")
    if infants > 5:
        raise BadRequestError("Infants cannot be more than 5")
    if pets > 5:
        raise BadRequestError("You can bring at most 5 pets")
    if pets > 0 and not listing.allows_pets:
        raise BadRequestError("This place does not allow pets")


def _payment(body: BookingCreate) -> tuple[PaymentMethodType | None, str | None, str | None, datetime | None]:
    if body.payment_method_type is None:
        return None, None, None, None
    paid_at = datetime.now(timezone.utc)
    if body.payment_method_type == PaymentMethodType.card:
        brand = body.card_brand.strip() if body.card_brand else None
        return body.payment_method_type, brand or None, body.card_last4, paid_at
    return body.payment_method_type, None, None, paid_at


def _clean_message(value: str | None) -> str | None:
    if value is None:
        return None
    text = value.strip()
    return text or None


def _unique_code(db: Session) -> str:
    for _ in range(5):
        code = generate_confirmation_code()
        taken = db.scalar(select(Booking.id).where(Booking.confirmation_code == code))
        if taken is None:
            return code
    raise RuntimeError("Could not allocate a confirmation code")


def _begin_immediate(db: Session) -> None:
    if db.get_bind().dialect.name == "sqlite":
        db.connection().exec_driver_sql("BEGIN IMMEDIATE")


def _active_listing(db: Session, listing_id: int) -> Listing:
    listing = db.scalar(select(Listing).where(Listing.id == listing_id, Listing.is_active.is_(True)))
    if listing is None:
        raise NotFoundError("Listing not found")
    return listing


def _get_booking(db: Session, booking_id: int) -> Booking:
    booking = db.scalar(select(Booking).where(Booking.id == booking_id).options(*_booking_options()))
    if booking is None:
        raise NotFoundError("Booking not found")
    return booking


def _require_participant(booking: Booking, user: User) -> None:
    if user.id != booking.guest_id and user.id != booking.listing.host_id:
        raise ForbiddenError("You cannot view this booking")


def _can_review(booking: Booking, user: User) -> bool:
    return (
        user.id == booking.guest_id
        and booking.status == BookingStatus.confirmed
        and booking.check_out <= date.today()
        and booking.review is None
    )


def _can_cancel(booking: Booking, user: User) -> bool:
    return (
        user.id == booking.guest_id
        and booking.status in _OPEN_STATUSES
        and booking.check_in > date.today()
    )


def _closed_sort(booking: Booking) -> tuple:
    stamp = booking.cancelled_at or datetime.combine(booking.check_in, time.min)
    if stamp.tzinfo is not None:
        stamp = stamp.astimezone(timezone.utc).replace(tzinfo=None)
    return (stamp, booking.id)


def _booking_options():
    return (
        selectinload(Booking.review),
        selectinload(Booking.companions),
        selectinload(Booking.listing).selectinload(Listing.images),
        selectinload(Booking.listing).selectinload(Listing.host),
    )


def _listing_out(listing: Listing, *, exact_address: bool) -> BookingListingOut:
    images = sorted(listing.images, key=lambda image: image.position)
    return BookingListingOut(
        id=listing.id,
        title=listing.title,
        city=listing.city,
        country=listing.country,
        address=listing.address if exact_address else None,
        cover_image=images[0].url if images else None,
        host_name=listing.host.name,
        host_avatar=listing.host.avatar_url,
        lat=listing.lat,
        lng=listing.lng,
    )


def _summary(booking: Booking, user: User) -> BookingSummary:
    return BookingSummary(
        id=booking.id,
        listing_id=booking.listing_id,
        check_in=booking.check_in,
        check_out=booking.check_out,
        num_guests=booking.num_guests,
        adults=booking.adults,
        children=booking.children,
        infants=booking.infants,
        pets=booking.pets,
        nights=booking.nights,
        nightly_rate=booking.nightly_rate,
        cleaning_fee=booking.cleaning_fee,
        service_fee=booking.service_fee,
        taxes=booking.taxes,
        discount_type=booking.discount_type.value if booking.discount_type else None,
        discount_amount=booking.discount_amount,
        coupon_code=booking.coupon_code,
        coupon_amount=booking.coupon_amount,
        original_total=booking.original_total,
        total_price=booking.total_price,
        refund_amount=booking.refund_amount,
        status=booking.status,
        listing=_listing_out(booking.listing, exact_address=False),
        created_at=booking.created_at,
        can_review=_can_review(booking, user),
    )


def _price_snapshot(booking: Booking) -> PriceSnapshot:
    nights_total = snapshot_nights_total(
        total_price=booking.total_price,
        cleaning_fee=booking.cleaning_fee,
        service_fee=booking.service_fee,
        taxes=booking.taxes,
        coupon_amount=booking.coupon_amount,
    )
    nights_total_original = nights_total + booking.discount_amount
    discount = None
    if booking.discount_type is not None:
        pct = 0
        if nights_total_original:
            pct = int(
                (Decimal(booking.discount_amount) * 100 / Decimal(nights_total_original)).quantize(
                    Decimal("1"), rounding=ROUND_HALF_UP
                )
            )
        discount = DiscountOut(
            type=booking.discount_type.value,
            pct=pct,
            amount=booking.discount_amount,
            reason_text=discount_reason(booking.discount_type),
        )
    coupon = None
    if booking.coupon_code:
        coupon = CouponOut(code=booking.coupon_code, amount=booking.coupon_amount)
    return PriceSnapshot(
        nights=booking.nights,
        nightly_rate=booking.nightly_rate,
        nights_total_original=nights_total_original,
        nights_total=nights_total,
        discount=discount,
        coupon=coupon,
        cleaning_fee=booking.cleaning_fee,
        service_fee=booking.service_fee,
        taxes=booking.taxes,
        total=booking.total_price,
        total_original=booking.original_total,
    )


def _detail(booking: Booking, user: User) -> BookingDetail:
    summary = _summary(booking, user)
    exact = booking.status == BookingStatus.confirmed
    host = booking.listing.host
    payload = summary.model_dump()
    payload["listing"] = _listing_out(booking.listing, exact_address=exact)
    return BookingDetail(
        **payload,
        guest_id=booking.guest_id,
        message_to_host=booking.message_to_host,
        confirmation_code=booking.confirmation_code,
        payment_method_type=booking.payment_method_type,
        card_brand=booking.card_brand,
        card_last4=booking.card_last4,
        paid_at=booking.paid_at,
        cancel_reason=booking.cancel_reason,
        cancelled_at=booking.cancelled_at,
        cancelled_by=booking.cancelled_by,
        can_cancel=_can_cancel(booking, user),
        check_in_time=CHECK_IN_LABEL,
        check_out_time=CHECK_OUT_LABEL,
        host=BookingHostOut(name=host.name, avatar=host.avatar_url, joined_year=host.created_at.year),
        price=_price_snapshot(booking),
        cancellation_policy_text=POLICY_TEXT,
        companions=[_companion_out(row) for row in sorted(booking.companions, key=lambda row: row.id)],
    )


def _companion_out(row: BookingCompanion) -> CompanionOut:
    return CompanionOut(id=row.id, name=row.name, email=row.email)
