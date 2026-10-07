from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas.booking import (
    BookingCancel,
    BookingCreate,
    BookingDetail,
    CancellationPreview,
    CompanionOut,
    CompanionsCreate,
    MyBookings,
)
from app.schemas.review import ReviewCreate, ReviewOut
from app.services import booking_service, review_service

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.post("", response_model=BookingDetail, status_code=201)
def create_booking(
    body: BookingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> BookingDetail:
    return booking_service.create_booking(db, user, body)


@router.get("/me", response_model=MyBookings)
def my_bookings(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> MyBookings:
    return booking_service.list_my_bookings(db, user)


@router.get("/{booking_id}", response_model=BookingDetail)
def booking_detail(
    booking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> BookingDetail:
    return booking_service.get_booking(db, booking_id, user)


@router.get("/{booking_id}/cancellation-preview", response_model=CancellationPreview)
def cancellation_preview(
    booking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CancellationPreview:
    return booking_service.cancellation_preview(db, user, booking_id)


@router.post("/{booking_id}/cancel", response_model=BookingDetail)
def cancel_booking(
    booking_id: int,
    body: BookingCancel,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> BookingDetail:
    return booking_service.cancel_booking(db, user, booking_id, body.reason)


@router.post("/{booking_id}/companions", response_model=list[CompanionOut])
def add_companions(
    booking_id: int,
    body: CompanionsCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[CompanionOut]:
    return booking_service.add_companions(db, user, booking_id, body.companions)


@router.post("/{booking_id}/review", response_model=ReviewOut, status_code=201)
def create_review(
    booking_id: int,
    body: ReviewCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ReviewOut:
    return review_service.create_review(db, user, booking_id, body.rating, body.comment)
