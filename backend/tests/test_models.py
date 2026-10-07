from datetime import date

import pytest
from sqlalchemy import create_engine, event, func, inspect, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.db import Base
from app.models.amenity import Amenity, listing_amenities
from app.models.booking import Booking, overlap_condition
from app.models.enums import BookingStatus, PropertyType, RoomType
from app.models.listing import Listing, ListingImage
from app.models.review import Review
from app.models.user import User
from app.models.wishlist import Wishlist, WishlistItem

EXPECTED_TABLES = {
    "users",
    "host_profiles",
    "listings",
    "listing_images",
    "listing_occupants",
    "amenities",
    "listing_amenities",
    "bookings",
    "booking_companions",
    "coupons",
    "reviews",
    "wishlists",
    "wishlist_items",
}


@pytest.fixture
def session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _enable_foreign_keys(dbapi_connection, _connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)()
    try:
        yield db
    finally:
        db.close()
        engine.dispose()


def _user(session, email: str, name: str = "Ada") -> User:
    user = User(name=name, email=email)
    session.add(user)
    session.flush()
    return user


def _listing(session, host: User) -> Listing:
    listing = Listing(
        host_id=host.id,
        title="Beach house",
        description="A house by the water",
        property_type=PropertyType.house,
        room_type=RoomType.entire_place,
        category="Beachfront",
        city="Goa",
        country="India",
        lat=15.5,
        lng=73.8,
        price_per_night=5000,
        max_guests=4,
        bedrooms=2,
        beds=2,
        bathrooms=1.5,
        private_bathrooms=1.0,
        dedicated_bathrooms=0.5,
        shared_bathrooms=0.0,
    )
    session.add(listing)
    session.flush()
    return listing


def _booking(
    session,
    listing: Listing,
    guest: User,
    check_in: date,
    check_out: date,
    status: BookingStatus = BookingStatus.confirmed,
) -> Booking:
    nights = (check_out - check_in).days
    booking = Booking(
        listing_id=listing.id,
        guest_id=guest.id,
        check_in=check_in,
        check_out=check_out,
        num_guests=2,
        nights=nights,
        nightly_rate=listing.price_per_night,
        cleaning_fee=listing.cleaning_fee,
        service_fee=0,
        original_total=listing.price_per_night * nights + listing.cleaning_fee,
        total_price=listing.price_per_night * nights + listing.cleaning_fee,
        status=status,
    )
    session.add(booking)
    session.flush()
    return booking


def test_all_tables_created(session):
    names = set(Base.metadata.tables)
    assert names == EXPECTED_TABLES
    assert set(inspect(session.get_bind()).get_table_names()) == EXPECTED_TABLES


@pytest.mark.parametrize(
    ("check_in", "check_out"),
    [
        (date(2026, 10, 10), date(2026, 10, 10)),
        (date(2026, 10, 12), date(2026, 10, 10)),
    ],
)
def test_checkout_must_be_after_checkin(session, check_in, check_out):
    host = _user(session, "host@example.com", "Host")
    guest = _user(session, "guest@example.com", "Guest")
    listing = _listing(session, host)
    session.add(
        Booking(
            listing_id=listing.id,
            guest_id=guest.id,
            check_in=check_in,
            check_out=check_out,
            num_guests=2,
            nights=1,
            nightly_rate=listing.price_per_night,
            cleaning_fee=0,
            service_fee=0,
            original_total=listing.price_per_night,
            total_price=listing.price_per_night,
        )
    )
    with pytest.raises(IntegrityError):
        session.flush()
    session.rollback()


def test_rating_above_five_rejected(session):
    host = _user(session, "host@example.com", "Host")
    guest = _user(session, "guest@example.com", "Guest")
    listing = _listing(session, host)
    booking = _booking(session, listing, guest, date(2026, 10, 10), date(2026, 10, 12))
    session.add(
        Review(
            booking_id=booking.id,
            listing_id=listing.id,
            author_id=guest.id,
            rating=6,
            comment="Too high",
        )
    )
    with pytest.raises(IntegrityError):
        session.flush()
    session.rollback()


def test_one_review_per_booking(session):
    host = _user(session, "host@example.com", "Host")
    guest = _user(session, "guest@example.com", "Guest")
    listing = _listing(session, host)
    booking = _booking(session, listing, guest, date(2026, 10, 10), date(2026, 10, 12))
    session.add(
        Review(
            booking_id=booking.id,
            listing_id=listing.id,
            author_id=guest.id,
            rating=5,
            comment="Lovely stay",
        )
    )
    session.flush()
    session.add(
        Review(
            booking_id=booking.id,
            listing_id=listing.id,
            author_id=guest.id,
            rating=4,
            comment="Second thoughts",
        )
    )
    with pytest.raises(IntegrityError):
        session.flush()
    session.rollback()


def _wishlist(session, guest: User, name: str = "Favourites") -> Wishlist:
    wishlist = Wishlist(user_id=guest.id, name=name)
    session.add(wishlist)
    session.flush()
    return wishlist


def test_duplicate_wishlist_item_rejected(session):
    host = _user(session, "host@example.com", "Host")
    guest = _user(session, "guest@example.com", "Guest")
    listing = _listing(session, host)
    wishlist = _wishlist(session, guest)
    session.add(WishlistItem(wishlist_id=wishlist.id, listing_id=listing.id))
    session.flush()
    session.add(WishlistItem(wishlist_id=wishlist.id, listing_id=listing.id))
    with pytest.raises(IntegrityError):
        session.flush()
    session.rollback()


def test_listing_can_be_on_several_wishlists(session):
    host = _user(session, "host@example.com", "Host")
    guest = _user(session, "guest@example.com", "Guest")
    listing = _listing(session, host)
    first = _wishlist(session, guest, "Favourites")
    second = _wishlist(session, guest, "Weekend")
    session.add(WishlistItem(wishlist_id=first.id, listing_id=listing.id))
    session.add(WishlistItem(wishlist_id=second.id, listing_id=listing.id))
    session.flush()
    saved = session.scalars(select(WishlistItem).where(WishlistItem.listing_id == listing.id)).all()
    assert len(saved) == 2


def test_wishlist_name_unique_per_user(session):
    guest = _user(session, "guest@example.com", "Guest")
    other = _user(session, "other@example.com", "Other")
    _wishlist(session, guest, "Favourites")
    _wishlist(session, other, "Favourites")
    session.add(Wishlist(user_id=guest.id, name="Favourites"))
    with pytest.raises(IntegrityError):
        session.flush()
    session.rollback()


def test_deleting_wishlist_cascades_items(session):
    host = _user(session, "host@example.com", "Host")
    guest = _user(session, "guest@example.com", "Guest")
    listing = _listing(session, host)
    wishlist = _wishlist(session, guest)
    session.add(WishlistItem(wishlist_id=wishlist.id, listing_id=listing.id))
    session.flush()
    wishlist_id = wishlist.id

    session.delete(wishlist)
    session.flush()
    session.expire_all()

    assert session.get(Wishlist, wishlist_id) is None
    assert session.get(WishlistItem, (wishlist_id, listing.id)) is None
    assert session.get(Listing, listing.id) is not None


def test_deleting_listing_cascades_wishlist_items(session):
    host = _user(session, "host@example.com", "Host")
    guest = _user(session, "guest@example.com", "Guest")
    listing = _listing(session, host)
    wishlist = _wishlist(session, guest)
    session.add(WishlistItem(wishlist_id=wishlist.id, listing_id=listing.id))
    session.flush()
    listing_id = listing.id

    session.delete(listing)
    session.flush()
    session.expire_all()

    assert session.get(Listing, listing_id) is None
    assert session.get(WishlistItem, (wishlist.id, listing_id)) is None
    assert session.get(Wishlist, wishlist.id) is not None


def test_deleting_user_cascades_wishlists(session):
    host = _user(session, "host@example.com", "Host")
    guest = _user(session, "guest@example.com", "Guest")
    listing = _listing(session, host)
    wishlist = _wishlist(session, guest)
    session.add(WishlistItem(wishlist_id=wishlist.id, listing_id=listing.id))
    session.flush()
    wishlist_id = wishlist.id
    guest_id = guest.id

    session.delete(guest)
    session.flush()
    session.expire_all()

    assert session.get(User, guest_id) is None
    assert session.get(Wishlist, wishlist_id) is None
    assert session.get(WishlistItem, (wishlist_id, listing.id)) is None


def test_deleting_listing_cascades_images_and_amenity_links(session):
    host = _user(session, "host@example.com", "Host")
    listing = _listing(session, host)
    amenity = Amenity(name="Wifi", icon="wifi", group_name="Essentials")
    image = ListingImage(url="https://example.com/a.jpg", position=0)
    listing.amenities.append(amenity)
    listing.images.append(image)
    session.flush()
    listing_id = listing.id
    image_id = image.id
    amenity_id = amenity.id

    session.delete(listing)
    session.flush()
    session.expire_all()

    assert session.get(ListingImage, image_id) is None
    link_count = session.scalar(
        select(func.count())
        .select_from(listing_amenities)
        .where(listing_amenities.c.listing_id == listing_id)
    )
    assert link_count == 0
    assert session.get(Amenity, amenity_id) is not None


def test_deleting_listing_with_bookings_is_restricted(session):
    host = _user(session, "host@example.com", "Host")
    guest = _user(session, "guest@example.com", "Guest")
    listing = _listing(session, host)
    _booking(session, listing, guest, date(2026, 10, 10), date(2026, 10, 15))

    session.delete(listing)
    with pytest.raises(IntegrityError):
        session.flush()
    session.rollback()


def test_overlap_condition_half_open_range(session):
    host = _user(session, "host@example.com", "Host")
    guest = _user(session, "guest@example.com", "Guest")
    listing = _listing(session, host)
    confirmed = _booking(session, listing, guest, date(2026, 10, 10), date(2026, 10, 15))
    # A cancelled stay covers the same dates and must never count as a conflict.
    _booking(
        session,
        listing,
        guest,
        date(2026, 10, 10),
        date(2026, 10, 15),
        status=BookingStatus.cancelled,
    )

    def conflicting_ids(check_in: date, check_out: date) -> list[int]:
        rows = session.scalars(
            select(Booking).where(overlap_condition(listing.id, check_in, check_out))
        ).all()
        return [row.id for row in rows]

    assert conflicting_ids(date(2026, 10, 12), date(2026, 10, 14)) == [confirmed.id]
    assert conflicting_ids(date(2026, 10, 8), date(2026, 10, 11)) == [confirmed.id]
    assert conflicting_ids(date(2026, 10, 14), date(2026, 10, 20)) == [confirmed.id]
    assert conflicting_ids(date(2026, 10, 15), date(2026, 10, 18)) == []
    assert conflicting_ids(date(2026, 10, 5), date(2026, 10, 10)) == []


def test_cancelled_booking_never_conflicts(session):
    host = _user(session, "host@example.com", "Host")
    guest = _user(session, "guest@example.com", "Guest")
    listing = _listing(session, host)
    _booking(
        session,
        listing,
        guest,
        date(2026, 10, 10),
        date(2026, 10, 15),
        status=BookingStatus.cancelled,
    )
    count = session.scalar(
        select(func.count())
        .select_from(Booking)
        .where(overlap_condition(listing.id, date(2026, 10, 12), date(2026, 10, 14)))
    )
    assert count == 0
