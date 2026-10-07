"""Coupon lookup. Uses increase only when a booking is claimed inside its write transaction."""

from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestError, NotFoundError
from app.models import Listing
from app.models.coupon import Coupon

INVALID_COUPON = "This coupon isn't valid"


def normalize_code(code: str) -> str:
    return code.strip().upper()


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def rejection_reason(coupon: Coupon | None, now: datetime | None = None) -> str | None:
    clock = now or datetime.now(timezone.utc)
    if coupon is None or not coupon.active:
        return INVALID_COUPON
    if coupon.expires_at is not None and _as_utc(coupon.expires_at) <= clock:
        return INVALID_COUPON
    if coupon.uses >= coupon.max_uses:
        return INVALID_COUPON
    return None


def find_coupon(db: Session, code: str) -> Coupon | None:
    if not code or not code.strip():
        return None
    return db.scalar(select(Coupon).where(Coupon.code == normalize_code(code)))


def require_coupon(db: Session, code: str) -> Coupon:
    coupon = find_coupon(db, code)
    reason = rejection_reason(coupon)
    if reason is not None or coupon is None:
        raise BadRequestError(reason or INVALID_COUPON)
    return coupon


def claim_coupon(db: Session, coupon: Coupon) -> None:
    db.refresh(coupon)
    reason = rejection_reason(coupon)
    if reason is not None:
        raise BadRequestError(reason)
    coupon.uses += 1


def validate_coupon(
    db: Session,
    code: str,
    listing_id: int,
    check_in: date,
    check_out: date,
) -> tuple[bool, int, str]:
    from app.services.listing_pricing import quote_listing_stay
    from app.services.listing_service import validate_stay

    listing = db.scalar(select(Listing).where(Listing.id == listing_id, Listing.is_active.is_(True)))
    if listing is None:
        raise NotFoundError("Listing not found")
    validate_stay(listing, check_in, check_out, 1)
    coupon = find_coupon(db, code)
    reason = rejection_reason(coupon)
    if reason is not None or coupon is None:
        return False, 0, reason or INVALID_COUPON
    priced = quote_listing_stay(
        db,
        listing,
        check_in,
        check_out,
        coupon_code=coupon.code,
        coupon_percent=coupon.percent_off,
    )
    amount = priced.coupon.amount if priced.coupon else 0
    return True, amount, "Coupon applied"
