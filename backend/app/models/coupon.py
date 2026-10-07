"""A coupon is a percent off the nightly total after the listing discount.

percent_off is 1..50. uses never exceeds max_uses. The booking stores the
code and the rupee amount it actually took off; it does not foreign-key the
coupon, so later edits do not change a stay that already booked.
"""

from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Coupon(Base):
    __tablename__ = "coupons"
    __table_args__ = (
        CheckConstraint("percent_off >= 1 AND percent_off <= 50", name="ck_coupons_percent"),
        CheckConstraint("max_uses >= 1", name="ck_coupons_max_uses"),
        CheckConstraint("uses >= 0 AND uses <= max_uses", name="ck_coupons_uses"),
        CheckConstraint("length(code) >= 1", name="ck_coupons_code"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    percent_off: Mapped[int] = mapped_column(Integer, nullable=False)
    max_uses: Mapped[int] = mapped_column(Integer, nullable=False)
    uses: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=text("0"))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=text("1"))
