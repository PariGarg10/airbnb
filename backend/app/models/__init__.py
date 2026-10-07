"""Import every model so Base.metadata knows the full schema.

String relationship targets (for example "Booking") only resolve if that
class has been imported before the mapper is first used.
"""

from app.models.amenity import Amenity, listing_amenities
from app.models.booking import Booking, BookingCompanion
from app.models.coupon import Coupon
from app.models.experience import (
    Experience,
    ExperienceBooking,
    ExperienceImage,
    ExperienceItineraryItem,
    ExperienceReview,
    ExperienceSlot,
)
from app.models.host_profile import HostProfile
from app.models.listing import Listing, ListingImage, ListingOccupant
from app.models.review import Review
from app.models.user import User
from app.models.wishlist import Wishlist, WishlistItem

__all__ = [
    "Amenity",
    "Booking",
    "BookingCompanion",
    "Coupon",
    "Experience",
    "ExperienceBooking",
    "ExperienceImage",
    "ExperienceItineraryItem",
    "ExperienceReview",
    "ExperienceSlot",
    "HostProfile",
    "Listing",
    "ListingImage",
    "ListingOccupant",
    "Review",
    "User",
    "Wishlist",
    "WishlistItem",
    "listing_amenities",
]
