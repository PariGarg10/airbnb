"""Load fictional seed data and generate bookings.

Run from the backend directory:

    python -m app.seed
    python -m app.seed --reset

SQLite `create_all` does not alter tables that already exist. `--reset` drops
every table, creates the current schema, and loads seed data. Use it after a
schema change (for example the wishlists tables).

A booking stores the price the guest agreed to. Amounts come from
pricing_service.quote_price, the same function live quotes use.

Dates are half-open. overlap_condition rejects a pending or confirmed stay
that would collide, and it ignores declined, expired, and cancelled rows.
Three generated bookings are cancelled after they have been placed. A few
approve-first listings also get pending requests (one close to the 24 hour
expiry), one declined request, and the cancelled rows record a refund.
"""

import argparse
import json
import random
from datetime import date, datetime, timedelta, timezone
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.db import Base, SessionLocal, engine, init_db
from app.models import (
    Amenity,
    Booking,
    BookingCompanion,
    Coupon,
    HostProfile,
    Listing,
    ListingImage,
    ListingOccupant,
    Review,
    User,
)
from app.models.enums import BookingMode, CancelReason, CancelledBy, OccupantType, PaymentMethodType
from app.services.listing_pricing import quote_listing_stay
from app.services.pricing_service import booking_price_fields
from app.models.amenity import listing_amenities
from app.models.booking import overlap_condition
from app.models.enums import BookingStatus, PropertyType, RoomType
from app.models.wishlist import Wishlist, WishlistItem

RANDOM_SEED = 42
PAST_BOOKINGS = 30
UPCOMING_BOOKINGS = 20
CANCELLED_PAST = 2
CANCELLED_UPCOMING = 1
REVIEW_SHARE = Decimal("0.85")
DATA_DIR = Path(__file__).resolve().parent / "seed_data"


def rating_one_decimal(total: int, count: int) -> float:
    quantized = (Decimal(total) / Decimal(count)).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)
    return float(quantized)


def _load_json(name: str) -> list[dict]:
    return json.loads((DATA_DIR / name).read_text(encoding="utf-8"))


def _clear(db: Session) -> None:
    db.execute(delete(Review))
    db.execute(delete(BookingCompanion))
    db.execute(delete(Booking))
    db.execute(delete(Coupon))
    db.execute(delete(WishlistItem))
    db.execute(delete(Wishlist))
    db.execute(delete(listing_amenities))
    db.execute(delete(ListingOccupant))
    db.execute(delete(ListingImage))
    db.execute(delete(Listing))
    db.execute(delete(HostProfile))
    db.execute(delete(Amenity))
    db.execute(delete(User))
    db.flush()


def _create_users(db: Session, rows: list[dict]) -> dict[str, User]:
    users: dict[str, User] = {}
    for row in rows:
        user = User(
            name=row["name"],
            email=row["email"],
            avatar_url=row["avatar_url"],
            bio=row["bio"],
            is_host=row["is_host"],
            is_superhost=row["is_superhost"],
        )
        db.add(user)
        users[user.email] = user
    db.flush()
    return users


def _create_amenities(db: Session, rows: list[dict]) -> dict[str, Amenity]:
    amenities: dict[str, Amenity] = {}
    for row in rows:
        amenity = Amenity(name=row["name"], icon=row["icon"], group_name=row["group_name"])
        db.add(amenity)
        amenities[amenity.name] = amenity
    db.flush()
    return amenities


def _create_host_profiles(db: Session, users: dict[str, User]) -> int:
    created = 0
    for user in users.values():
        if not user.is_host:
            continue
        db.add(
            HostProfile(
                user_id=user.id,
                country="India",
                flat="12B",
                street="Host Lane",
                landmark="Near city centre",
                district=None,
                city="Chennai",
                state="Tamil Nadu",
                pin_code="600001",
                is_business=False,
            )
        )
        created += 1
    db.flush()
    return created


def _create_listings(
    db: Session,
    rows: list[dict],
    users: dict[str, User],
    amenities: dict[str, Amenity],
) -> list[Listing]:
    listings: list[Listing] = []
    for index, row in enumerate(rows):
        host = users.get(row["host_email"])
        if host is None or not host.is_host:
            raise ValueError(f"Listing {row['title']!r} has no host for {row['host_email']}")
        unknown = [name for name in row["amenities"] if name not in amenities]
        if unknown:
            raise ValueError(f"Listing {row['title']!r} has unknown amenities: {unknown}")
        baths = float(row["bathrooms"])
        private_b = baths if index % 4 != 2 else max(0.5, baths - 0.5)
        dedicated_b = 0.5 if index % 7 == 3 else 0.0
        shared_b = max(0.0, baths - private_b - dedicated_b)
        instant = row.get("instant_book", index % 2 == 0 or index % 5 == 1)
        booking_mode = BookingMode.instant if instant else BookingMode.approve_first_5
        listing = Listing(
            host_id=host.id,
            title=row["title"],
            description=row["description"],
            property_type=PropertyType(row["property_type"]),
            room_type=RoomType(row["room_type"]),
            category=row["category"],
            address=row["address"],
            city=row["city"],
            state=row["state"],
            country=row["country"],
            lat=row["lat"],
            lng=row["lng"],
            price_per_night=row["price_per_night"],
            cleaning_fee=row["cleaning_fee"],
            max_guests=row["max_guests"],
            bedrooms=row["bedrooms"],
            beds=row["beds"],
            bathrooms=private_b + dedicated_b + shared_b,
            private_bathrooms=private_b,
            dedicated_bathrooms=dedicated_b,
            shared_bathrooms=shared_b,
            booking_mode=booking_mode,
            instant_book=booking_mode == BookingMode.instant,
            show_precise_location=index % 5 == 0,
            bedrooms_have_locks=True if index % 2 == 0 else None,
            weekend_adjustment_pct=[0, 0, 10, 15, 0][index % 5],
            discount_new_listing_pct=20 if index % 3 != 1 else 0,
            discount_last_minute_pct=12 if index % 11 == 4 else 0,
            discount_weekly_pct=8 if index % 9 == 2 else 0,
            discount_monthly_pct=15 if index % 13 == 6 else 0,
            has_exterior_camera=index % 17 == 1,
            has_noise_monitor=index % 19 == 2,
            has_weapons=False,
            allows_pets=row.get("allows_pets", index % 3 == 0),
        )
        if index % 4 == 1:
            listing.occupants.append(ListingOccupant(occupant_type=OccupantType.me))
        if index % 6 == 2:
            listing.occupants.append(ListingOccupant(occupant_type=OccupantType.family))
        captions = ["Living area", "Bedroom", "View from the deck"]
        for position, url in enumerate(row["images"]):
            caption = captions[position] if index % 8 == 0 and position < len(captions) else None
            listing.images.append(ListingImage(url=url, caption=caption, position=position))
        listing.amenities = [amenities[name] for name in row["amenities"]]
        db.add(listing)
        listings.append(listing)
    db.flush()
    return listings


def _guest_is_busy(bookings: list[Booking], guest_id: int, check_in: date, check_out: date) -> bool:
    return any(
        booking.guest_id == guest_id
        and booking.check_in < check_out
        and booking.check_out > check_in
        for booking in bookings
    )


def _place_booking(
    db: Session,
    rng: random.Random,
    listings: list[Listing],
    guests: list[User],
    kind: str,
    today: date,
    created: list[Booking],
    listing: Listing | None = None,
) -> None:
    for _ in range(400):
        chosen = listing or rng.choice(listings)
        available_guests = [guest for guest in guests if guest.id != chosen.host_id]
        if not available_guests:
            continue
        guest = rng.choice(available_guests)
        nights = rng.randint(1, 7)
        if kind == "past":
            check_out = today - timedelta(days=rng.randint(1, 160))
            check_in = check_out - timedelta(days=nights)
        else:
            check_in = today + timedelta(days=rng.randint(1, 100))
            check_out = check_in + timedelta(days=nights)
        if _guest_is_busy(created, guest.id, check_in, check_out):
            continue
        conflict = db.scalar(
            select(func.count())
            .select_from(Booking)
            .where(overlap_condition(chosen.id, check_in, check_out))
        )
        if conflict:
            continue
        adults = rng.randint(1, chosen.max_guests)
        children = rng.randint(0, chosen.max_guests - adults)
        infants = rng.randint(0, 2)
        pets = 1 if chosen.allows_pets and rng.random() < 0.3 else 0
        priced = quote_listing_stay(db, chosen, check_in, check_out, booking_date=today)
        booking = Booking(
            listing_id=chosen.id,
            guest_id=guest.id,
            check_in=check_in,
            check_out=check_out,
            num_guests=adults + children,
            adults=adults,
            children=children,
            infants=infants,
            pets=pets,
            payment_method_type=PaymentMethodType.card,
            card_brand="Visa",
            card_last4="4242",
            paid_at=datetime.now(timezone.utc),
            **booking_price_fields(priced),
        )
        db.add(booking)
        db.flush()
        created.append(booking)
        return
    raise RuntimeError(f"Could not place a {kind} booking without an overlap")


def _assert_no_confirmed_overlap(db: Session) -> None:
    confirmed = list(
        db.scalars(
            select(Booking).where(
                Booking.status.in_((BookingStatus.confirmed, BookingStatus.pending))
            )
        )
    )
    for booking in confirmed:
        others = db.scalar(
            select(func.count())
            .select_from(Booking)
            .where(
                overlap_condition(booking.listing_id, booking.check_in, booking.check_out),
                Booking.id != booking.id,
            )
        )
        if others:
            raise RuntimeError(f"Confirmed booking {booking.id} overlaps another stay")


def _create_bookings(
    db: Session,
    rng: random.Random,
    listings: list[Listing],
    guests: list[User],
    today: date,
) -> list[Booking]:
    created: list[Booking] = []
    for _ in range(PAST_BOOKINGS):
        _place_booking(db, rng, listings, guests, "past", today, created)
    for _ in range(UPCOMING_BOOKINGS):
        _place_booking(db, rng, listings, guests, "upcoming", today, created)

    past = [booking for booking in created if booking.check_out <= today]
    upcoming = [booking for booking in created if booking.check_in >= today]
    if len(past) != PAST_BOOKINGS or len(upcoming) != UPCOMING_BOOKINGS:
        raise RuntimeError(f"Expected {PAST_BOOKINGS} past and {UPCOMING_BOOKINGS} upcoming bookings")
    for booking in rng.sample(past, CANCELLED_PAST) + rng.sample(upcoming, CANCELLED_UPCOMING):
        booking.status = BookingStatus.cancelled
    db.flush()
    _assert_no_confirmed_overlap(db)
    _seed_outcomes(db, rng, listings, guests, created, today)
    return created


def _create_coupons(db: Session) -> None:
    expires = datetime(2027, 12, 31, 23, 59, tzinfo=timezone.utc)
    for code, percent in (("WELCOME10", 10), ("FESTIVE15", 15)):
        db.add(
            Coupon(
                code=code,
                percent_off=percent,
                max_uses=10000,
                uses=0,
                expires_at=expires,
                active=True,
            )
        )
    db.flush()


def _seed_outcomes(
    db: Session,
    rng: random.Random,
    listings: list[Listing],
    guests: list[User],
    created: list[Booking],
    today: date,
) -> None:
    now = datetime.now(timezone.utc)
    for booking in created:
        if booking.status != BookingStatus.cancelled:
            continue
        booking.refund_amount = booking.total_price
        booking.cancelled_by = CancelledBy.guest
        booking.cancel_reason = CancelReason.plans_changed
        booking.cancelled_at = now

    request_listings = [listing for listing in listings if listing.booking_mode == BookingMode.approve_first_5]
    if not request_listings:
        raise RuntimeError("Seed needs an approve_first_5 listing for pending requests")
    upcoming = [
        booking
        for booking in created
        if booking.status == BookingStatus.confirmed
        and booking.check_in > today
        and booking.listing_id in {listing.id for listing in request_listings}
    ]
    while len(upcoming) < 4:
        _place_booking(
            db,
            rng,
            request_listings,
            guests,
            "upcoming",
            today,
            created,
            listing=rng.choice(request_listings),
        )
        upcoming.append(created[-1])

    messages = (
        "We are coming for a wedding and your place is close to the venue.",
        "Two of us on a quiet trip. We will arrive after 3.",
        "Celebrating a birthday with family. We will keep the place tidy.",
    )
    for booking, message in zip(upcoming[:3], messages):
        booking.status = BookingStatus.pending
        booking.message_to_host = message
    upcoming[0].created_at = now - timedelta(hours=23, minutes=50)

    declined = upcoming[3]
    declined.status = BookingStatus.declined
    declined.refund_amount = declined.total_price
    declined.cancelled_by = CancelledBy.host
    declined.cancelled_at = now
    db.flush()
    _assert_no_confirmed_overlap(db)


def _add_reviews(
    db: Session,
    rng: random.Random,
    bookings: list[Booking],
    review_rows: list[dict],
    today: date,
) -> int:
    eligible = [
        booking
        for booking in bookings
        if booking.status == BookingStatus.confirmed and booking.check_out <= today
    ]
    rng.shuffle(eligible)
    take = int((Decimal(len(eligible)) * REVIEW_SHARE).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    if len(eligible) > 1:
        take = min(take, len(eligible) - 1)
    pool = list(review_rows)
    rng.shuffle(pool)
    cursor = 0
    for booking in eligible[:take]:
        if cursor >= len(pool):
            cursor = 0
            rng.shuffle(pool)
        row = pool[cursor]
        cursor += 1
        db.add(
            Review(
                booking_id=booking.id,
                listing_id=booking.listing_id,
                author_id=booking.guest_id,
                rating=row["rating"],
                comment=row["comment"],
            )
        )
    db.flush()
    return take


def _refresh_listing_ratings(db: Session) -> None:
    rows = db.execute(
        select(Review.listing_id, func.count(Review.id), func.sum(Review.rating)).group_by(
            Review.listing_id
        )
    ).all()
    totals = {listing_id: (count, int(total)) for listing_id, count, total in rows}
    for listing in db.scalars(select(Listing)):
        count, total = totals.get(listing.id, (0, 0))
        listing.review_count = count
        listing.avg_rating = rating_one_decimal(total, count) if count else 0.0
    db.flush()


def _create_wishlists(db: Session, users: dict[str, User], listings: list[Listing]) -> int:
    guests = sorted((user for user in users.values() if not user.is_host), key=lambda user: user.email)
    ordered = sorted(listings, key=lambda listing: (listing.city, listing.title, listing.id))
    if len(ordered) < 2 or not guests:
        return 0
    created = 0
    for index, guest in enumerate(guests):
        count = 3 if index % 2 else 2
        wishlist = Wishlist(user_id=guest.id, name="Favourites")
        db.add(wishlist)
        db.flush()
        for offset in range(count):
            listing = ordered[(index * 3 + offset) % len(ordered)]
            db.add(WishlistItem(wishlist_id=wishlist.id, listing_id=listing.id))
        created += 1
    db.flush()
    return created


def run_seed(reset: bool = False) -> None:
    if reset:
        Base.metadata.drop_all(bind=engine)
    init_db()
    db = SessionLocal()
    try:
        existing = db.scalar(select(func.count()).select_from(User)) or 0
        if existing and not reset:
            print(f"Seed skipped: {existing} users already present. Pass --reset to rebuild.")
            return
        if existing:
            _clear(db)

        rng = random.Random(RANDOM_SEED)
        users = _create_users(db, _load_json("users.json"))
        amenities = _create_amenities(db, _load_json("amenities.json"))
        profile_count = _create_host_profiles(db, users)
        listings = _create_listings(db, _load_json("listings.json"), users, amenities)
        _create_coupons(db)
        wishlist_count = _create_wishlists(db, users, listings)
        guests = [user for user in users.values() if not user.is_host]
        today = date.today()
        bookings = _create_bookings(db, rng, listings, guests, today)
        review_count = _add_reviews(db, rng, bookings, _load_json("reviews.json"), today)
        _refresh_listing_ratings(db)
        db.commit()

        cancelled = sum(booking.status == BookingStatus.cancelled for booking in bookings)
        pending = sum(booking.status == BookingStatus.pending for booking in bookings)
        declined = sum(booking.status == BookingStatus.declined for booking in bookings)
        print(
            f"Seeded {len(users)} users, {profile_count} host profiles, {len(amenities)} amenities, "
            f"{len(listings)} listings, "
            f"{wishlist_count} wishlists, {len(bookings)} bookings "
            f"({cancelled} cancelled, {pending} pending, {declined} declined), "
            f"{review_count} reviews, 2 coupons."
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the Airbnb database")
    parser.add_argument("--reset", action="store_true", help="Delete existing rows and seed again")
    args = parser.parse_args()
    run_seed(reset=args.reset)


if __name__ == "__main__":
    main()
