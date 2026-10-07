from pydantic import BaseModel


class CouponValidation(BaseModel):
    valid: bool
    amount: int
    message: str
