from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas.experience import ExperienceBookingCreate, ExperienceBookingDetail, ExperienceMyBookings
from app.services import experience_booking_service

router = APIRouter(prefix="/api/experience-bookings", tags=["experience-bookings"])


@router.post("", response_model=ExperienceBookingDetail, status_code=201)
def create_experience_booking(
    body: ExperienceBookingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ExperienceBookingDetail:
    return experience_booking_service.create_booking(db, user, body)


@router.get("/me", response_model=ExperienceMyBookings)
def my_experience_bookings(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ExperienceMyBookings:
    return experience_booking_service.list_my_bookings(db, user)


@router.get("/{booking_id}", response_model=ExperienceBookingDetail)
def experience_booking_detail(
    booking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ExperienceBookingDetail:
    return experience_booking_service.get_booking(db, booking_id, user)


@router.post("/{booking_id}/cancel", response_model=ExperienceBookingDetail)
def cancel_experience_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ExperienceBookingDetail:
    return experience_booking_service.cancel_booking(db, user, booking_id)
