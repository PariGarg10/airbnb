from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Booking, Listing
from app.models.enums import BookingStatus
from app.services.pricing_service import PriceBreakdown, quote_price


def confirmed_booking_count(db: Session, listing_id: int) -> int:
    return int(
        db.scalar(
            select(func.count())
            .select_from(Booking)
            .where(
                Booking.listing_id == listing_id,
                Booking.status == BookingStatus.confirmed,
            )
        )
        or 0
    )


def quote_listing_stay(
    db: Session,
    listing: Listing,
    check_in: date,
    check_out: date,
    *,
    booking_date: date | None = None,
    coupon_code: str | None = None,
    coupon_percent: int | None = None,
) -> PriceBreakdown:
    return quote_price(
        base_nightly_rate=listing.price_per_night,
        cleaning_fee=listing.cleaning_fee,
        check_in=check_in,
        check_out=check_out,
        weekend_adjustment_pct=listing.weekend_adjustment_pct,
        discount_new_listing_pct=listing.discount_new_listing_pct,
        discount_last_minute_pct=listing.discount_last_minute_pct,
        discount_weekly_pct=listing.discount_weekly_pct,
        discount_monthly_pct=listing.discount_monthly_pct,
        confirmed_booking_count=confirmed_booking_count(db, listing.id),
        booking_date=booking_date,
        coupon_code=coupon_code,
        coupon_percent=coupon_percent,
    )

