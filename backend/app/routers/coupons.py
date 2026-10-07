from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.coupon import CouponValidation
from app.services.coupon_service import validate_coupon

router = APIRouter(prefix="/api/coupons", tags=["coupons"])


@router.get("/validate", response_model=CouponValidation)
def coupon_validate(
    code: str,
    listing_id: int,
    check_in: date,
    check_out: date,
    db: Session = Depends(get_db),
) -> CouponValidation:
    valid, amount, message = validate_coupon(db, code, listing_id, check_in, check_out)
    return CouponValidation(valid=valid, amount=amount, message=message)
