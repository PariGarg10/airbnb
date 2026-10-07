from datetime import date



from app.models.amenity import Amenity

from app.models.booking import Booking

from app.models.enums import BookingStatus, PropertyType, RoomType

from app.models.host_profile import HostProfile

from app.models.listing import Listing, ListingImage

from app.models.user import User





def add_user(db, email: str, *, host: bool = False, name: str | None = None) -> User:

    user = User(name=name or email.split("@")[0], email=email, is_host=host, is_superhost=host)

    db.add(user)

    db.flush()

    return user





def add_host_profile(db, host: User, **overrides) -> HostProfile:

    profile = HostProfile(

        user_id=host.id,

        country=overrides.pop("country", "India"),

        flat=overrides.pop("flat", None),

        street=overrides.pop("street", "1 Host Street"),

        landmark=overrides.pop("landmark", None),

        district=overrides.pop("district", None),

        city=overrides.pop("city", "Chennai"),

        state=overrides.pop("state", "Tamil Nadu"),

        pin_code=overrides.pop("pin_code", "600001"),

        is_business=overrides.pop("is_business", False),

        **overrides,

    )

    db.add(profile)

    db.flush()

    return profile





def add_listing(db, host: User, **overrides) -> Listing:

    private = overrides.pop("private_bathrooms", 1.0)

    dedicated = overrides.pop("dedicated_bathrooms", 0.0)

    shared = overrides.pop("shared_bathrooms", 0.0)

    listing = Listing(

        host_id=host.id,

        title=overrides.pop("title", "Beach house"),

        description="A house by the water with room to sit outside.",

        property_type=PropertyType.house,

        room_type=RoomType.entire_place,

        category="Beachfront",

        city=overrides.pop("city", "Goa"),

        country="India",

        lat=15.5,

        lng=73.8,

        price_per_night=overrides.pop("price_per_night", 5000),

        cleaning_fee=overrides.pop("cleaning_fee", 500),

        max_guests=overrides.pop("max_guests", 4),

        bedrooms=2,

        beds=2,

        bathrooms=private + dedicated + shared,

        private_bathrooms=private,

        dedicated_bathrooms=dedicated,

        shared_bathrooms=shared,

        discount_new_listing_pct=overrides.pop("discount_new_listing_pct", 0),

        **overrides,

    )

    listing.images.append(ListingImage(url="https://example.com/cover.jpg", position=0))

    db.add(listing)

    db.flush()

    return listing





def add_amenity(db, name: str = "Wifi") -> Amenity:

    amenity = Amenity(name=name, icon="wifi", group_name="Essentials")

    db.add(amenity)

    db.flush()

    return amenity





def add_booking(

    db,

    listing: Listing,

    guest: User,

    check_in: date,

    check_out: date,

    *,

    status: BookingStatus = BookingStatus.confirmed,

    total_price: int = 1000,

    original_total: int | None = None,

    num_guests: int = 2,

) -> Booking:

    booking = Booking(

        listing_id=listing.id,

        guest_id=guest.id,

        check_in=check_in,

        check_out=check_out,

        num_guests=num_guests,

        nights=(check_out - check_in).days,

        nightly_rate=listing.price_per_night,

        cleaning_fee=listing.cleaning_fee,

        service_fee=0,

        discount_amount=0,

        original_total=original_total if original_total is not None else total_price,

        total_price=total_price,

        status=status,

    )

    db.add(booking)

    db.flush()

    return booking





def listing_body(**overrides) -> dict:

    body = {

        "title": "Beach house stay",

        "description": "A bright house with a quiet lane and a small garden.",

        "property_type": "house",

        "room_type": "entire_place",

        "category": "Beachfront",

        "address": "12 Coast Road",

        "city": "Goa",

        "state": "Goa",

        "country": "India",

        "lat": 15.5,

        "lng": 73.8,

        "price_per_night": 5000,

        "cleaning_fee": 500,

        "max_guests": 4,

        "bedrooms": 2,

        "beds": 2,

        "private_bathrooms": 1,

        "dedicated_bathrooms": 0,

        "shared_bathrooms": 0,

        "images": [

            {"url": "https://example.com/a.jpg", "caption": "Front view"},

            {"url": "https://example.com/b.jpg"},

        ],

        "amenity_ids": [],

        "occupants": ["me"],

    }

    body.update(overrides)

    return body


