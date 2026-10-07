from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User


def list_users(db: Session) -> list[User]:
    return list(db.scalars(select(User).order_by(User.id)))
