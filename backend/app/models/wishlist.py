"""Named lists of saved listings.

A user can keep several wishlists, and a listing can sit on more than one of
them. Wishlist names are unique per user. A saved row is identified by
(wishlist_id, listing_id), so the same home cannot be added to one list twice.

Deleting a user removes that user's wishlists. Deleting a wishlist or a
listing removes the saved rows (ON DELETE CASCADE).
"""

from sqlalchemy import ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import CreatedAtMixin


class Wishlist(CreatedAtMixin, Base):
    __tablename__ = "wishlists"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_wishlists_user_name"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)

    user: Mapped["User"] = relationship(back_populates="wishlists")
    items: Mapped[list["WishlistItem"]] = relationship(
        back_populates="wishlist",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class WishlistItem(CreatedAtMixin, Base):
    __tablename__ = "wishlist_items"
    __table_args__ = (Index("ix_wishlist_items_listing_id", "listing_id"),)

    wishlist_id: Mapped[int] = mapped_column(
        ForeignKey("wishlists.id", ondelete="CASCADE"),
        primary_key=True,
    )
    listing_id: Mapped[int] = mapped_column(
        ForeignKey("listings.id", ondelete="CASCADE"),
        primary_key=True,
    )

    wishlist: Mapped["Wishlist"] = relationship(back_populates="items")
    listing: Mapped["Listing"] = relationship(passive_deletes=True)
