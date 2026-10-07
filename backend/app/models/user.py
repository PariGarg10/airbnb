"""A single account can be a guest, a host, or both.

is_host and is_superhost are flags on the user rather than separate tables.
Hosting is a role on the same account, and superhost is a denormalized badge
maintained later from review history, not computed on every read.
"""

from sqlalchemy import Boolean, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import CreatedAtMixin


class User(CreatedAtMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    bio: Mapped[str | None] = mapped_column(Text)
    is_host: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("0")
    )
    is_superhost: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("0")
    )

    listings: Mapped[list["Listing"]] = relationship(
        back_populates="host",
        passive_deletes="all",
    )
    bookings: Mapped[list["Booking"]] = relationship(
        back_populates="guest",
        passive_deletes="all",
    )
    reviews: Mapped[list["Review"]] = relationship(
        back_populates="author",
        passive_deletes="all",
    )
    wishlists: Mapped[list["Wishlist"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    host_profile: Mapped["HostProfile | None"] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
    )
