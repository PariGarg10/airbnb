"""Turn pending requests into expired stays once they are 24 hours old.

Callers on a read path pass commit=True so the change sticks. Callers already
inside a write transaction pass commit=False and commit with the rest of the work.
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.enums import BookingStatus, CancelledBy

PENDING_HOURS = 24


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def expire_pending(db: Session, *, listing_id: int | None = None, commit: bool = False) -> int:
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=PENDING_HOURS)
    stmt = select(Booking).where(Booking.status == BookingStatus.pending)
    if listing_id is not None:
        stmt = stmt.where(Booking.listing_id == listing_id)
    changed = 0
    for booking in db.scalars(stmt):
        if _as_utc(booking.created_at) > cutoff:
            continue
        booking.status = BookingStatus.expired
        booking.refund_amount = booking.total_price
        booking.cancelled_by = CancelledBy.system
        booking.cancelled_at = now
        changed += 1
    if changed:
        db.flush()
        if commit:
            db.commit()
    return changed
