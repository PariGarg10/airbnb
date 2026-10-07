from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError
from app.db import get_db
from app.models import User


def _load_user(db: Session, raw_user_id: str | None) -> User | None:
    if raw_user_id is None or not raw_user_id.strip():
        return None
    try:
        user_id = int(raw_user_id)
    except ValueError:
        return None
    if user_id < 1:
        return None
    return db.scalar(select(User).where(User.id == user_id))


def get_optional_user(
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
) -> User | None:
    return _load_user(db, x_user_id)


def get_current_user(
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
) -> User:
    if x_user_id is None or not x_user_id.strip():
        raise HTTPException(status_code=401, detail="Authentication required")
    user = _load_user(db, x_user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid user")
    return user


def require_host(user: User = Depends(get_current_user)) -> User:
    if not user.is_host:
        raise ForbiddenError("Host access required")
    return user
