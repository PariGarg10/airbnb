from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import BadRequestError, NotFoundError
from app.models import Experience, ExperienceReview, ExperienceSlot, User
from app.models.enums import ExperienceCategory
from app.schemas.experience import (
    ExperienceCard,
    ExperienceDetail,
    ExperienceHostOut,
    ExperienceImageOut,
    ExperienceItineraryOut,
    ExperienceReviewAuthor,
    ExperienceReviewOut,
    ExperienceSlotOut,
    ExperienceSlotsByDate,
)

IST = ZoneInfo("Asia/Kolkata")


def search_experiences(
    db: Session,
    *,
    city: str | None,
    category: ExperienceCategory | None,
) -> list[ExperienceCard]:
    stmt = select(Experience).where(Experience.is_active.is_(True))
    if city and city.strip():
        stmt = stmt.where(func.lower(Experience.city).like(f"%{city.strip().lower()}%"))
    if category is not None:
        stmt = stmt.where(Experience.category == category)
    stmt = stmt.options(selectinload(Experience.images)).order_by(Experience.created_at.desc(), Experience.id.desc())
    rows = list(db.scalars(stmt))
    return [_card(row) for row in rows]


def get_experience(db: Session, experience_id: int) -> ExperienceDetail:
    row = db.scalar(
        select(Experience)
        .where(Experience.id == experience_id, Experience.is_active.is_(True))
        .options(
            selectinload(Experience.images),
            selectinload(Experience.itinerary),
            selectinload(Experience.host),
            selectinload(Experience.reviews).selectinload(ExperienceReview.author),
        )
    )
    if row is None:
        raise NotFoundError("Experience not found")
    reviews = sorted(row.reviews, key=lambda item: (item.created_at, item.id), reverse=True)
    first_reviews = reviews[:6]
    return _detail(row, first_reviews)


def _detail(row: Experience, first_reviews: list[ExperienceReview]) -> ExperienceDetail:
    return ExperienceDetail(
        id=row.id,
        title=row.title,
        city=row.city,
        region=row.region,
        category=row.category,
        description=row.description,
        duration_minutes=row.duration_minutes,
        language=row.language,
        max_guests_per_slot=row.max_guests_per_slot,
        price_per_guest=row.price_per_guest,
        private_price=row.private_price,
        whats_included=row.whats_included,
        guest_requirements=row.guest_requirements,
        activity_level=row.activity_level,
        accessibility_note=row.accessibility_note,
        meeting_point_name=row.meeting_point_name,
        meeting_point_address=row.meeting_point_address,
        lat=row.lat,
        lng=row.lng,
        cancellation_hours=row.cancellation_hours,
        avg_rating=row.avg_rating,
        review_count=row.review_count,
        images=[ExperienceImageOut(url=img.url, position=img.position) for img in row.images],
        host=ExperienceHostOut(
            name=row.host.name,
            avatar_url=row.host.avatar_url,
            bio=row.host.bio,
            joined_year=row.host.created_at.year,
        ),
        itinerary=[
            ExperienceItineraryOut(
                position=item.position,
                title=item.title,
                description=item.description,
                image_url=item.image_url,
            )
            for item in row.itinerary
        ],
        reviews=[
            ExperienceReviewOut(
                id=rev.id,
                rating=rev.rating,
                comment=rev.comment,
                created_at=rev.created_at,
                author=ExperienceReviewAuthor(name=rev.author.name, avatar_url=rev.author.avatar_url),
            )
            for rev in first_reviews
        ],
        review_total=row.review_count,
    )


def list_slots(
    db: Session,
    experience_id: int,
    *,
    from_date: date | None,
    to_date: date | None,
    guests: int,
) -> list[ExperienceSlotsByDate]:
    if guests < 1:
        raise BadRequestError("guests must be at least 1")
    experience = db.scalar(
        select(Experience).where(Experience.id == experience_id, Experience.is_active.is_(True))
    )
    if experience is None:
        raise NotFoundError("Experience not found")
    now = datetime.now(timezone.utc)
    stmt = (
        select(ExperienceSlot)
        .where(
            ExperienceSlot.experience_id == experience_id,
            ExperienceSlot.is_cancelled.is_(False),
            ExperienceSlot.start_at >= now,
        )
        .order_by(ExperienceSlot.start_at.asc())
    )
    if from_date is not None:
        start = datetime.combine(from_date, datetime.min.time(), tzinfo=IST).astimezone(timezone.utc)
        stmt = stmt.where(ExperienceSlot.start_at >= start)
    if to_date is not None:
        end = datetime.combine(to_date + timedelta(days=1), datetime.min.time(), tzinfo=IST).astimezone(timezone.utc)
        stmt = stmt.where(ExperienceSlot.start_at < end)
    slots = list(db.scalars(stmt))
    by_date: dict[date, list[ExperienceSlotOut]] = {}
    for slot in slots:
        spots_left = slot.capacity - slot.booked_count
        if spots_left < guests:
            continue
        local_day = slot.start_at.astimezone(IST).date()
        private_available = (
            experience.private_price is not None and spots_left >= experience.max_guests_per_slot
        )
        out = ExperienceSlotOut(
            id=slot.id,
            start_at=slot.start_at,
            end_at=slot.end_at,
            spots_left=spots_left,
            price_per_guest=experience.price_per_guest,
            private_available=private_available,
        )
        by_date.setdefault(local_day, []).append(out)
    return [ExperienceSlotsByDate(date=day, slots=items) for day, items in sorted(by_date.items())]


def _card(row: Experience) -> ExperienceCard:
    cover = row.images[0].url if row.images else None
    return ExperienceCard(
        id=row.id,
        title=row.title,
        city=row.city,
        avg_rating=row.avg_rating,
        review_count=row.review_count,
        price_per_guest=row.price_per_guest,
        cover_image=cover,
        category=row.category,
    )


def format_cancellation_deadline(start_at: datetime, cancellation_hours: int) -> str:
    if start_at.tzinfo is None:
        start_at = start_at.replace(tzinfo=timezone.utc)
    deadline = start_at.astimezone(IST) - timedelta(hours=cancellation_hours)
    hour = deadline.hour % 12 or 12
    ampm = "am" if deadline.hour < 12 else "pm"
    month = deadline.strftime("%b")
    return f"{deadline.day} {month}, {hour}:{deadline.minute:02d} {ampm} (IST)"
