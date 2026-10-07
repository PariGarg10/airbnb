"""Turn pending requests into expired stays once they are 24 hours old.

Callers on a read path pass commit=True so the change sticks. Callers already
inside a write transaction pass commit=False and commit with the rest of the work.
"""

from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.time import to_naive_utc, utcnow
from app.models.booking import Booking
from app.models.enums import BookingStatus, CancelledBy

PENDING_HOURS = 24


def expire_stale_pending(db: Session, *, listing_id: int | None = None, commit: bool = False) -> int:
    cutoff = utcnow() - timedelta(hours=PENDING_HOURS)
    stmt = select(Booking).where(Booking.status == BookingStatus.pending)
    if listing_id is not None:
        stmt = stmt.where(Booking.listing_id == listing_id)
    changed = 0
    now = utcnow()
    for booking in db.scalars(stmt):
        if to_naive_utc(booking.created_at) >= cutoff:
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


# Backward-compatible alias
expire_pending = expire_stale_pending
