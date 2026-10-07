"""Shared timestamp columns.

created_at is filled by the database on INSERT so rows created outside the ORM
still get a timestamp. updated_at uses the same default on INSERT, and
onupdate so the ORM writes a fresh timestamp when it emits an UPDATE. SQLite
has no portable column-level ON UPDATE clause, so the refresh lives in the ORM.
"""

from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import Mapped, mapped_column


class CreatedAtMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class TimestampMixin(CreatedAtMixin):
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
