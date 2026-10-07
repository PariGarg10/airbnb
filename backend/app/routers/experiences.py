from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.enums import ExperienceCategory
from app.schemas.experience import (
    ExperienceCard,
    ExperienceDetail,
    ExperienceQuoteOut,
    ExperienceQuoteRequest,
    ExperienceSlotsByDate,
)
from app.services import experience_booking_service, experience_service

router = APIRouter(prefix="/api/experiences", tags=["experiences"])


@router.get("", response_model=list[ExperienceCard])
def search_experiences(
    city: str | None = None,
    category: ExperienceCategory | None = None,
    db: Session = Depends(get_db),
) -> list[ExperienceCard]:
    return experience_service.search_experiences(db, city=city, category=category)


@router.post("/quote", response_model=ExperienceQuoteOut)
def quote_experience(body: ExperienceQuoteRequest, db: Session = Depends(get_db)) -> ExperienceQuoteOut:
    return experience_booking_service.quote_slot(db, body)


@router.get("/{experience_id}", response_model=ExperienceDetail)
def experience_detail(experience_id: int, db: Session = Depends(get_db)) -> ExperienceDetail:
    return experience_service.get_experience(db, experience_id)


@router.get("/{experience_id}/slots", response_model=list[ExperienceSlotsByDate])
def experience_slots(
    experience_id: int,
    from_date: date | None = Query(default=None, alias="from"),
    to_date: date | None = Query(default=None, alias="to"),
    guests: int = Query(default=1, ge=1),
    db: Session = Depends(get_db),
) -> list[ExperienceSlotsByDate]:
    return experience_service.list_slots(
        db,
        experience_id,
        from_date=from_date,
        to_date=to_date,
        guests=guests,
    )
