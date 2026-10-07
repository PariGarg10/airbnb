"""Stay price snapshot shared by quotes, bookings, and seed data.

Weekend nights (Friday and Saturday) use base × (1 + weekend_adjustment_pct/100).
One listing discount applies to nights_total — the largest pct among eligible promos.
A coupon, when present, is a percent of that discounted nights_total.
service_fee is round(SERVICE_FEE_RATE * (nights_total + cleaning_fee)), half-up,
and does not change when a coupon is applied.
taxes are round(TAX_RATE * (nights_total after coupon + cleaning_fee)), half-up.
nightly_rate is the average pre-discount nightly rate, half-up.
"""

from dataclasses import dataclass
from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal

from app.core.config import settings
from app.models.enums import DiscountType

_DISCOUNT_REASONS = {
    DiscountType.new_listing: "This host offers a new listing discount",
    DiscountType.last_minute: "The host recently lowered the price for these dates",
    DiscountType.weekly: "The host offers a weekly discount",
    DiscountType.monthly: "The host offers a monthly discount",
}

POLICY_TEXT = (
    "Cancel at least 24 hours before check-in (15:00) for a full refund, including taxes and the service fee. "
    "Closer to check-in, the refund is 50% of the nightly total plus tax on that amount, and the cleaning fee "
    "is refunded when you cancel before check-in. The service fee is not refunded in that case. "
    "A pending request is refunded in full."
)


@dataclass(frozen=True)
class NightlyBreakdown:
    weekday_nights: int
    weekend_nights: int
    weekday_rate: int
    weekend_rate: int
    weekday_subtotal: int
    weekend_subtotal: int


@dataclass(frozen=True)
class DiscountLine:
    type: DiscountType
    pct: int
    amount: int
    reason_text: str


@dataclass(frozen=True)
class CouponLine:
    code: str
    amount: int


@dataclass(frozen=True)
class PriceBreakdown:
    nights: int
    nightly_rate: int
    nightly_breakdown: NightlyBreakdown
    nights_total_original: int
    nights_total: int
    discount: DiscountLine | None
    coupon: CouponLine | None
    cleaning_fee: int
    service_fee: int
    taxes: int
    total: int
    original_total: int

    @property
    def total_original(self) -> int:
        return self.original_total


@dataclass(frozen=True)
class RefundLine:
    label: str
    amount: int


@dataclass(frozen=True)
class RefundBreakdown:
    refund_amount: int
    non_refundable_amount: int
    lines: tuple[RefundLine, ...]
    policy_text: str


def discount_reason(discount_type: DiscountType) -> str:
    return _DISCOUNT_REASONS[discount_type]


def _rupees(value: Decimal) -> int:
    return int(value.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def _weekend_rate(base: int, weekend_adjustment_pct: int) -> int:
    return _rupees(Decimal(base) * (Decimal(1) + Decimal(weekend_adjustment_pct) / Decimal(100)))


def _count_nights(check_in: date, check_out: date) -> tuple[int, int]:
    weekday = 0
    weekend = 0
    day = check_in
    while day < check_out:
        if day.weekday() in (4, 5):
            weekend += 1
        else:
            weekday += 1
        day += timedelta(days=1)
    return weekday, weekend


def _service_fee(nights_total: int, cleaning_fee: int) -> int:
    return _rupees(Decimal(nights_total + cleaning_fee) * settings.SERVICE_FEE_RATE)


def _taxes(nights_after_coupon: int, cleaning_fee: int) -> int:
    return _rupees(Decimal(nights_after_coupon + cleaning_fee) * settings.TAX_RATE)


def _pick_discount(
    *,
    nights: int,
    check_in: date,
    booking_date: date,
    confirmed_booking_count: int,
    discount_new_listing_pct: int,
    discount_last_minute_pct: int,
    discount_weekly_pct: int,
    discount_monthly_pct: int,
) -> tuple[DiscountType, int] | None:
    candidates: list[tuple[DiscountType, int]] = []
    if confirmed_booking_count < 3 and discount_new_listing_pct > 0:
        candidates.append((DiscountType.new_listing, discount_new_listing_pct))
    days_until_check_in = (check_in - booking_date).days
    if days_until_check_in <= 14 and discount_last_minute_pct > 0:
        candidates.append((DiscountType.last_minute, discount_last_minute_pct))
    if nights >= 28 and discount_monthly_pct > 0:
        candidates.append((DiscountType.monthly, discount_monthly_pct))
    if nights >= 7 and discount_weekly_pct > 0:
        candidates.append((DiscountType.weekly, discount_weekly_pct))
    if not candidates:
        return None
    return max(candidates, key=lambda item: item[1])


def quote_price(
    *,
    base_nightly_rate: int,
    cleaning_fee: int,
    check_in: date,
    check_out: date,
    weekend_adjustment_pct: int = 0,
    discount_new_listing_pct: int = 0,
    discount_last_minute_pct: int = 0,
    discount_weekly_pct: int = 0,
    discount_monthly_pct: int = 0,
    confirmed_booking_count: int = 0,
    booking_date: date | None = None,
    coupon_code: str | None = None,
    coupon_percent: int | None = None,
) -> PriceBreakdown:
    nights = (check_out - check_in).days
    if nights < 1:
        raise ValueError("check_out must be after check_in")

    weekday_nights, weekend_nights = _count_nights(check_in, check_out)
    weekday_rate = base_nightly_rate
    weekend_rate = _weekend_rate(base_nightly_rate, weekend_adjustment_pct)
    nights_total_original = weekday_nights * weekday_rate + weekend_nights * weekend_rate

    when = booking_date or date.today()
    picked = _pick_discount(
        nights=nights,
        check_in=check_in,
        booking_date=when,
        confirmed_booking_count=confirmed_booking_count,
        discount_new_listing_pct=discount_new_listing_pct,
        discount_last_minute_pct=discount_last_minute_pct,
        discount_weekly_pct=discount_weekly_pct,
        discount_monthly_pct=discount_monthly_pct,
    )
    discount: DiscountLine | None = None
    nights_total = nights_total_original
    if picked is not None:
        discount_type, pct = picked
        amount = _rupees(Decimal(nights_total_original) * Decimal(pct) / Decimal(100))
        discount = DiscountLine(
            type=discount_type,
            pct=pct,
            amount=amount,
            reason_text=discount_reason(discount_type),
        )
        nights_total = nights_total_original - amount

    coupon: CouponLine | None = None
    nights_after_coupon = nights_total
    if coupon_percent:
        coupon_amount = _rupees(Decimal(nights_total) * Decimal(coupon_percent) / Decimal(100))
        coupon = CouponLine(code=coupon_code or "", amount=coupon_amount)
        nights_after_coupon = nights_total - coupon_amount

    service_fee = _service_fee(nights_total, cleaning_fee)
    taxes = _taxes(nights_after_coupon, cleaning_fee)
    total = nights_after_coupon + cleaning_fee + service_fee + taxes

    original_service = _service_fee(nights_total_original, cleaning_fee)
    original_taxes = _taxes(nights_total_original, cleaning_fee)
    original_total = nights_total_original + cleaning_fee + original_service + original_taxes
    nightly_rate = _rupees(Decimal(nights_total_original) / Decimal(nights))

    return PriceBreakdown(
        nights=nights,
        nightly_rate=nightly_rate,
        nightly_breakdown=NightlyBreakdown(
            weekday_nights=weekday_nights,
            weekend_nights=weekend_nights,
            weekday_rate=weekday_rate,
            weekend_rate=weekend_rate,
            weekday_subtotal=weekday_nights * weekday_rate,
            weekend_subtotal=weekend_nights * weekend_rate,
        ),
        nights_total_original=nights_total_original,
        nights_total=nights_total,
        discount=discount,
        coupon=coupon,
        cleaning_fee=cleaning_fee,
        service_fee=service_fee,
        taxes=taxes,
        total=total,
        original_total=original_total,
    )


def quote_price_flat(nightly_rate: int, cleaning_fee: int, nights: int) -> PriceBreakdown:
    """Legacy flat-rate quote (no calendar). Used only when dates are unavailable."""
    if nights < 1:
        raise ValueError("nights must be at least 1")
    check_in = date.today()
    check_out = check_in + timedelta(days=nights)
    return quote_price(
        base_nightly_rate=nightly_rate,
        cleaning_fee=cleaning_fee,
        check_in=check_in,
        check_out=check_out,
    )


def booking_price_fields(priced: PriceBreakdown) -> dict:
    return {
        "nights": priced.nights,
        "nightly_rate": priced.nightly_rate,
        "cleaning_fee": priced.cleaning_fee,
        "service_fee": priced.service_fee,
        "discount_type": priced.discount.type if priced.discount else None,
        "discount_amount": priced.discount.amount if priced.discount else 0,
        "taxes": priced.taxes,
        "coupon_code": priced.coupon.code if priced.coupon else None,
        "coupon_amount": priced.coupon.amount if priced.coupon else 0,
        "original_total": priced.original_total,
        "total_price": priced.total,
    }


def snapshot_nights_total(
    *,
    total_price: int,
    cleaning_fee: int,
    service_fee: int,
    taxes: int,
    coupon_amount: int,
) -> int:
    """Nights after the listing discount and before the coupon.

    Inverse of total = (nights_total - coupon) + cleaning + service + taxes.
    """
    return total_price - cleaning_fee - service_fee - taxes + coupon_amount


def compute_refund(
    *,
    nights_total: int,
    coupon_amount: int,
    cleaning_fee: int,
    service_fee: int,
    taxes: int,
    total: int,
    full: bool,
) -> RefundBreakdown:
    if full:
        lines = (
            RefundLine("Nights", nights_total - coupon_amount),
            RefundLine("Cleaning fee", cleaning_fee),
            RefundLine("Service fee", service_fee),
            RefundLine("Taxes", taxes),
        )
        refund_amount = total
    else:
        nights_part = _rupees(Decimal(nights_total) * Decimal(50) / Decimal(100))
        tax_part = _taxes(nights_part, 0)
        lines = (
            RefundLine("Nights", nights_part),
            RefundLine("Taxes", tax_part),
            RefundLine("Cleaning fee", cleaning_fee),
        )
        refund_amount = min(total, nights_part + tax_part + cleaning_fee)
    return RefundBreakdown(
        refund_amount=refund_amount,
        non_refundable_amount=total - refund_amount,
        lines=lines,
        policy_text=POLICY_TEXT,
    )
