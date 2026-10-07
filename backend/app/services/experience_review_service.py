from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Experience, ExperienceReview


def refresh_experience_rating(db: Session, experience_id: int) -> None:
    experience = db.get(Experience, experience_id)
    if experience is None:
        return
    total, count = db.execute(
        select(func.coalesce(func.sum(ExperienceReview.rating), 0), func.count(ExperienceReview.id)).where(
            ExperienceReview.experience_id == experience_id
        )
    ).one()
    experience.review_count = int(count)
    if count:
        experience.avg_rating = float(
            (Decimal(int(total)) / Decimal(int(count))).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)
        )
    else:
        experience.avg_rating = 0.0
