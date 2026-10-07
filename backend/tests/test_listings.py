from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.db import Base, get_db
from app.main import app
from app.models.amenity import Amenity
from app.models.booking import Booking
from app.models.enums import BookingStatus, PropertyType, RoomType
from app.models.listing import Listing, ListingImage
from app.models.user import User
from app.models.wishlist import Wishlist, WishlistItem


@pytest.fixture
def api():
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
    session_factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    db = session_factory()
    with TestClient(app) as client:
        yield client, db
    db.close()
    app.dependency_overrides.clear()
    engine.dispose()


def _user(db, email: str, *, host: bool = False, superhost: bool = False) -> User:
    user = User(name=email.split("@")[0], email=email, is_host=host, is_superhost=superhost)
    db.add(user)
    db.flush()
    return user


def _listing(db, host: User, **overrides) -> Listing:
    values = {
        "host_id": host.id,
        "title": "Beach house",
        "description": "A house by the water",
        "property_type": PropertyType.house,
        "room_type": RoomType.entire_place,
        "category": "Beachfront",
        "city": "Goa",
        "country": "India",
        "lat": 15.5,
        "lng": 73.8,
        "price_per_night": 5000,
        "cleaning_fee": 500,
        "max_guests": 4,
        "bedrooms": 2,
        "beds": 2,
        "bathrooms": 1,
        "private_bathrooms": 1,
        "dedicated_bathrooms": 0,
        "shared_bathrooms": 0,
        "discount_new_listing_pct": 0,
        "instant_book": True,
        "allows_pets": False,
    }
    values.update(overrides)
    listing = Listing(**values)
    db.add(listing)
    db.flush()
    return listing


def _booking(db, listing: Listing, guest: User, check_in: date, check_out: date, status=BookingStatus.confirmed):
    nights = (check_out - check_in).days
    subtotal = listing.price_per_night * nights + listing.cleaning_fee
    service_fee = int((Decimal(subtotal) * Decimal("0.14")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    booking = Booking(
        listing_id=listing.id,
        guest_id=guest.id,
        check_in=check_in,
        check_out=check_out,
        num_guests=1,
        nights=nights,
        nightly_rate=listing.price_per_night,
        cleaning_fee=listing.cleaning_fee,
        service_fee=service_fee,
        original_total=subtotal + service_fee,
        total_price=subtotal + service_fee,
        status=status,
    )
    db.add(booking)
    db.flush()
    return booking


def test_search_by_location_is_case_insensitive(api):
    client, db = api
    host = _user(db, "host@example.com", host=True, superhost=True)
    guest = _user(db, "guest@example.com")
    goa = _listing(db, host, title="Salt porch", city="Goa")
    for position in range(6):
        goa.images.append(ListingImage(url=f"https://example.com/{position}.jpg", position=position))
    _listing(db, host, title="Cedar cabin", city="Manali", category="Cabins", property_type=PropertyType.cabin)
    favourites = Wishlist(user_id=guest.id, name="Favourites")
    db.add(favourites)
    db.flush()
    db.add(WishlistItem(wishlist_id=favourites.id, listing_id=goa.id))
    db.commit()

    response = client.get("/api/listings", params={"location": "goa"})
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    card = body["items"][0]
    assert card["id"] == goa.id
    assert card["city"] == "Goa"
    assert card["images"] == ["https://example.com/0.jpg"]
    assert card["host_is_superhost"] is True
    assert card["is_wishlisted"] is False

    saved = client.get("/api/listings", params={"location": "GOA"}, headers={"X-User-Id": str(guest.id)})
    assert saved.json()["items"][0]["is_wishlisted"] is True


def test_price_filter(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    _listing(db, host, title="Budget room", price_per_night=2000)
    match = _listing(db, host, title="Mid house", price_per_night=8000)
    _listing(db, host, title="Splash villa", price_per_night=20000)
    db.commit()

    response = client.get("/api/listings", params={"min_price": 5000, "max_price": 10000})
    assert response.status_code == 200
    body = response.json()
    assert [item["id"] for item in body["items"]] == [match.id]
    assert body["total"] == 1


def test_amenities_require_all_matches(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    wifi = Amenity(name="Wifi", icon="wifi", group_name="Essentials")
    pool = Amenity(name="Pool", icon="waves", group_name="Features")
    db.add_all([wifi, pool])
    db.flush()
    both = _listing(db, host, title="Pool villa")
    wifi_only = _listing(db, host, title="City flat", city="Mumbai")
    both.amenities.extend([wifi, pool])
    wifi_only.amenities.append(wifi)
    db.commit()

    response = client.get("/api/listings", params={"amenities": f"{wifi.id},{pool.id}"})
    assert response.status_code == 200
    body = response.json()
    assert [item["id"] for item in body["items"]] == [both.id]


def test_dates_exclude_overlapping_confirmed_bookings(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    guest = _user(db, "guest@example.com")
    booked = _listing(db, host, title="Booked house")
    open_listing = _listing(db, host, title="Open house", city="Jaipur")
    check_in = date.today() + timedelta(days=10)
    check_out = check_in + timedelta(days=5)
    _booking(db, booked, guest, check_in, check_out)
    _booking(db, open_listing, guest, check_in, check_out, status=BookingStatus.cancelled)
    db.commit()

    response = client.get(
        "/api/listings",
        params={
            "check_in": (check_in + timedelta(days=1)).isoformat(),
            "check_out": (check_in + timedelta(days=3)).isoformat(),
        },
    )
    assert response.status_code == 200
    assert [item["id"] for item in response.json()["items"]] == [open_listing.id]


def test_min_rating_requires_enough_reviews(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    loved = _listing(db, host, title="Loved house", avg_rating=4.9, review_count=4)
    _listing(db, host, title="Few reviews", city="Jaipur", avg_rating=5.0, review_count=2)
    _listing(db, host, title="Lower rated", city="Mumbai", avg_rating=4.2, review_count=8)
    db.commit()

    response = client.get("/api/listings", params={"min_rating": 4.8})
    assert response.status_code == 200
    body = response.json()
    assert [item["id"] for item in body["items"]] == [loved.id]
    assert body["total"] == 1


def test_dated_search_adds_stay_total(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    listing = _listing(db, host, price_per_night=5000, cleaning_fee=500)
    db.commit()
    check_in = date.today() + timedelta(days=10)
    check_out = check_in + timedelta(days=2)

    bare = client.get("/api/listings", params={"location": "Goa"})
    assert bare.status_code == 200
    assert bare.json()["items"][0]["nights"] is None
    assert bare.json()["items"][0]["stay_total"] is None

    dated = client.get(
        "/api/listings",
        params={"location": "Goa", "check_in": check_in.isoformat(), "check_out": check_out.isoformat()},
    )
    assert dated.status_code == 200
    card = dated.json()["items"][0]
    assert card["id"] == listing.id
    assert card["nights"] == 2
    assert card["stay_total"] == 12495
    assert card["bedrooms"] == 2
    assert card["beds"] == 2


def test_pagination_has_more(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    for index in range(3):
        _listing(db, host, title=f"House {index}", city=f"City {index}")
    db.commit()

    first = client.get("/api/listings", params={"page": 1, "page_size": 2})
    second = client.get("/api/listings", params={"page": 2, "page_size": 2})
    assert first.status_code == 200
    assert first.json()["total"] == 3
    assert first.json()["has_more"] is True
    assert len(first.json()["items"]) == 2
    assert second.json()["has_more"] is False
    assert len(second.json()["items"]) == 1
    assert second.json()["page"] == 2


def test_quote_math(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    listing = _listing(
        db, host, price_per_night=1000, cleaning_fee=1, max_guests=4, discount_new_listing_pct=0
    )
    db.commit()
    check_in = date.today() + timedelta(days=2)
    check_out = check_in + timedelta(days=1)

    response = client.get(
        f"/api/listings/{listing.id}/quote",
        params={"check_in": check_in.isoformat(), "check_out": check_out.isoformat(), "guests": 2},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["nights"] == 1
    assert body["nightly_rate"] == 1000
    assert body["nights_total"] == 1000
    assert body["discount"] is None
    assert body["cleaning_fee"] == 1
    assert body["service_fee"] == 140
    assert body["taxes"] == 50
    assert body["coupon"] is None
    assert body["nights_total_original"] == 1000
    assert body["total"] == 1191
    assert body["original_total"] == 1191
    assert body["total_original"] == 1191
    assert body["nightly_breakdown"]["weekday_nights"] + body["nightly_breakdown"]["weekend_nights"] == 1


def test_quote_overlap_is_conflict(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    guest = _user(db, "guest@example.com")
    listing = _listing(db, host)
    check_in = date.today() + timedelta(days=4)
    check_out = check_in + timedelta(days=3)
    _booking(db, listing, guest, check_in, check_out)
    db.commit()

    response = client.get(
        f"/api/listings/{listing.id}/quote",
        params={
            "check_in": (check_in + timedelta(days=1)).isoformat(),
            "check_out": (check_out + timedelta(days=1)).isoformat(),
            "guests": 1,
        },
    )
    assert response.status_code == 409
    assert "detail" in response.json()


def test_quote_rejects_too_many_guests(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    listing = _listing(db, host, max_guests=2)
    db.commit()
    check_in = date.today() + timedelta(days=1)
    response = client.get(
        f"/api/listings/{listing.id}/quote",
        params={
            "check_in": check_in.isoformat(),
            "check_out": (check_in + timedelta(days=2)).isoformat(),
            "guests": 3,
        },
    )
    assert response.status_code == 400
    assert "detail" in response.json()


def test_inactive_listing_is_not_found(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    hidden = _listing(db, host, title="Hidden", is_active=False)
    visible = _listing(db, host, title="Visible", city="Udaipur")
    db.commit()

    detail = client.get(f"/api/listings/{hidden.id}")
    assert detail.status_code == 404
    assert detail.json()["detail"]

    owned = client.get(f"/api/listings/{hidden.id}", headers={"X-User-Id": str(host.id)})
    assert owned.status_code == 200
    assert owned.json()["id"] == hidden.id

    listed = client.get("/api/listings")
    assert [item["id"] for item in listed.json()["items"]] == [visible.id]


def test_search_filters_by_min_beds_and_bathrooms(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    spacious = _listing(db, host, title="Spacious", beds=4, bathrooms=2.5)
    _listing(db, host, title="Compact", beds=1, bathrooms=1)
    db.commit()

    by_beds = client.get("/api/listings", params={"min_beds": 3})
    assert by_beds.status_code == 200
    assert [item["id"] for item in by_beds.json()["items"]] == [spacious.id]

    by_baths = client.get("/api/listings", params={"min_bathrooms": 2})
    assert by_baths.status_code == 200
    assert [item["id"] for item in by_baths.json()["items"]] == [spacious.id]


def test_search_filters_instant_book_and_allows_pets(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    instant_pets = _listing(db, host, title="Instant pets", instant_book=True, allows_pets=True)
    _listing(db, host, title="Request only", instant_book=False, allows_pets=False)
    _listing(db, host, title="No pets", instant_book=True, allows_pets=False)
    db.commit()

    instant = client.get("/api/listings", params={"instant_book": True})
    assert instant.status_code == 200
    ids = {item["id"] for item in instant.json()["items"]}
    assert instant_pets.id in ids
    assert len(ids) == 2

    pets = client.get("/api/listings", params={"allows_pets": True})
    assert pets.status_code == 200
    assert [item["id"] for item in pets.json()["items"]] == [instant_pets.id]


def test_missing_user_header_is_unauthorized(api):
    client, _db = api
    response = client.get("/api/users/me")
    assert response.status_code == 401
