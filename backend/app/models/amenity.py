"""Amenities are a shared catalog, not free text on each listing.

A listing links to catalog rows through listing_amenities. Deleting a listing
removes those links (ON DELETE CASCADE) and leaves the catalog row in place.
icon stores a lucide icon name so the client can map it; it is not an image URL.
group_name is the display bucket (Essentials, Features, Location, Safety).
"""

from sqlalchemy import Column, ForeignKey, Integer, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

listing_amenities = Table(
    "listing_amenities",
    Base.metadata,
    Column(
        "listing_id",
        ForeignKey("listings.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "amenity_id",
        ForeignKey("amenities.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Amenity(Base):
    __tablename__ = "amenities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    icon: Mapped[str] = mapped_column(String(50), nullable=False)
    group_name: Mapped[str] = mapped_column(String(50), nullable=False)

    listings: Mapped[list["Listing"]] = relationship(
        secondary=listing_amenities,
        back_populates="amenities",
    )
