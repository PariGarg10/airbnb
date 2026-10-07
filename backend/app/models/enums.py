"""String-backed enums stored in VARCHAR columns.

native_enum=False keeps the schema portable on SQLite, which has no ENUM type.
The member values are the strings the API will send and receive.
"""

import enum

from sqlalchemy import Enum


class PropertyType(str, enum.Enum):
    house = "house"
    apartment = "apartment"
    villa = "villa"
    cabin = "cabin"
    guesthouse = "guesthouse"
    hotel = "hotel"
    cottage = "cottage"
    tiny_home = "tiny_home"
    treehouse = "treehouse"
    castle = "castle"


class RoomType(str, enum.Enum):
    entire_place = "entire_place"
    private_room = "private_room"
    shared_room = "shared_room"


class BookingStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    declined = "declined"
    expired = "expired"
    cancelled = "cancelled"


class PaymentMethodType(str, enum.Enum):
    card = "card"
    upi = "upi"
    netbanking = "netbanking"


class CancelReason(str, enum.Enum):
    plans_changed = "plans_changed"
    found_another_place = "found_another_place"
    travel_restrictions = "travel_restrictions"
    host_asked = "host_asked"
    personal_emergency = "personal_emergency"
    other = "other"


class CancelledBy(str, enum.Enum):
    guest = "guest"
    host = "host"
    system = "system"


class BookingMode(str, enum.Enum):
    approve_first_5 = "approve_first_5"
    instant = "instant"


class OccupantType(str, enum.Enum):
    me = "me"
    family = "family"
    other_guests = "other_guests"
    flatmates = "flatmates"


class DiscountType(str, enum.Enum):
    new_listing = "new_listing"
    last_minute = "last_minute"
    weekly = "weekly"
    monthly = "monthly"


def str_enum(enum_cls: type[enum.Enum], length: int = 32) -> Enum:
    return Enum(
        enum_cls,
        native_enum=False,
        length=length,
        values_callable=lambda members: [member.value for member in members],
    )
