from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.db import Base, get_db
from app.main import app
from app.models.booking import Booking
from app.models.enums import BookingStatus, PropertyType, RoomType
from app.models.listing import Listing, ListingImage
from app.models.review import Review
from app.models.user import User


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


def _user(db, email: str, *, host: bool = False, name: str | None = None) -> User:
    user = User(name=name or email.split("@")[0], email=email, is_host=host, is_superhost=host)
    db.add(user)
    db.flush()
    return user


def _listing(db, host: User, **overrides) -> Listing:
    listing = Listing(
        host_id=host.id,
        title=overrides.pop("title", "Beach house"),
        description="A house by the water",
        property_type=PropertyType.house,
        room_type=RoomType.entire_place,
        category="Beachfront",
        city="Goa",
        country="India",
        lat=15.5,
        lng=73.8,
        price_per_night=overrides.pop("price_per_night", 5000),
        cleaning_fee=overrides.pop("cleaning_fee", 500),
        max_guests=overrides.pop("max_guests", 4),
        bedrooms=2,
        beds=2,
        bathrooms=1,
        private_bathrooms=1,
        dedicated_bathrooms=0,
        shared_bathrooms=0,
        discount_new_listing_pct=0,
        **overrides,
    )
    listing.images.append(ListingImage(url="https://example.com/cover.jpg", position=0))
    db.add(listing)
    db.flush()
    return listing


def _post(client, user_id: int, listing_id: int, check_in: date, check_out: date, guests: int = 2):
    return client.post(
        "/api/bookings",
        headers={"X-User-Id": str(user_id)},
        json={
            "listing_id": listing_id,
            "check_in": check_in.isoformat(),
            "check_out": check_out.isoformat(),
            "num_guests": guests,
        },
    )


def test_successful_booking(api):
    client, db = api
    host = _user(db, "host@example.com", host=True, name="Ananya")
    guest = _user(db, "guest@example.com", name="Sofia")
    listing = _listing(db, host)
    db.commit()
    check_in = date.today() + timedelta(days=10)
    check_out = check_in + timedelta(days=2)

    response = _post(client, guest.id, listing.id, check_in, check_out)
    assert response.status_code == 201
    body = response.json()
    assert body["listing_id"] == listing.id
    assert body["guest_id"] == guest.id
    assert body["nights"] == 2
    assert body["nightly_rate"] == 5000
    assert body["cleaning_fee"] == 500
    assert body["service_fee"] == 1470
    assert body["taxes"] == 525
    assert body["total_price"] == 12495
    assert body["status"] == "confirmed"
    assert body["can_review"] is False
    assert body["listing"]["title"] == "Beach house"
    assert body["listing"]["cover_image"] == "https://example.com/cover.jpg"
    assert body["listing"]["host_name"] == "Ananya"

    mine = client.get("/api/bookings/me", headers={"X-User-Id": str(guest.id)})
    assert mine.status_code == 200
    grouped = mine.json()
    assert [item["id"] for item in grouped["upcoming"]] == [body["id"]]
    assert grouped["past"] == []
    assert grouped["cancelled"] == []


@pytest.mark.parametrize(
    ("check_in_offset", "check_out_offset"),
    [
        pytest.param(0, 5, id="exact"),
        pytest.param(-2, 2, id="partial_left"),
        pytest.param(3, 7, id="partial_right"),
        pytest.param(-2, 7, id="containing"),
        pytest.param(1, 4, id="contained"),
    ],
)
def test_overlaps_rejected(api, check_in_offset, check_out_offset):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    guest = _user(db, "guest@example.com")
    other = _user(db, "other@example.com")
    listing = _listing(db, host)
    db.commit()
    start = date.today() + timedelta(days=10)
    end = start + timedelta(days=5)
    held = _post(client, guest.id, listing.id, start, end)
    assert held.status_code == 201

    response = _post(
        client,
        other.id,
        listing.id,
        start + timedelta(days=check_in_offset),
        start + timedelta(days=check_out_offset),
    )
    assert response.status_code == 409


def test_back_to_back_allowed(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    guest = _user(db, "guest@example.com")
    other = _user(db, "other@example.com")
    listing = _listing(db, host)
    db.commit()
    start = date.today() + timedelta(days=10)
    end = start + timedelta(days=5)
    held = _post(client, guest.id, listing.id, start, end)
    assert held.status_code == 201

    response = _post(client, other.id, listing.id, end, end + timedelta(days=3))
    assert response.status_code == 201
    assert response.json()["check_in"] == end.isoformat()


def test_guests_exceed_max_returns_400(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    guest = _user(db, "guest@example.com")
    listing = _listing(db, host, max_guests=2)
    db.commit()
    check_in = date.today() + timedelta(days=4)
    response = _post(client, guest.id, listing.id, check_in, check_in + timedelta(days=2), guests=3)
    assert response.status_code == 400


def test_past_check_in_returns_400(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    guest = _user(db, "guest@example.com")
    listing = _listing(db, host)
    db.commit()
    check_in = date.today() - timedelta(days=1)
    response = _post(client, guest.id, listing.id, check_in, date.today() + timedelta(days=1))
    assert response.status_code == 400


def test_check_out_before_check_in_returns_400(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    guest = _user(db, "guest@example.com")
    listing = _listing(db, host)
    db.commit()
    check_in = date.today() + timedelta(days=5)
    response = _post(client, guest.id, listing.id, check_in, check_in - timedelta(days=1))
    assert response.status_code == 400


def test_booking_without_user_header_returns_401(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    listing = _listing(db, host)
    db.commit()
    check_in = date.today() + timedelta(days=3)
    response = client.post(
        "/api/bookings",
        json={
            "listing_id": listing.id,
            "check_in": check_in.isoformat(),
            "check_out": (check_in + timedelta(days=1)).isoformat(),
            "num_guests": 1,
        },
    )
    assert response.status_code == 401


def test_my_bookings_buckets(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    guest = _user(db, "guest@example.com")
    listing = _listing(db, host)
    past = Booking(
        listing_id=listing.id,
        guest_id=guest.id,
        check_in=date.today() - timedelta(days=4),
        check_out=date.today() - timedelta(days=1),
        num_guests=2,
        nights=3,
        nightly_rate=5000,
        cleaning_fee=500,
        service_fee=1470,
        taxes=0,
        original_total=16970,
        total_price=16970,
        status=BookingStatus.confirmed,
    )
    db.add(past)
    db.commit()

    upcoming_in = date.today() + timedelta(days=10)
    upcoming = _post(client, guest.id, listing.id, upcoming_in, upcoming_in + timedelta(days=2))
    assert upcoming.status_code == 201

    cancelled_in = date.today() + timedelta(days=20)
    to_cancel = _post(client, guest.id, listing.id, cancelled_in, cancelled_in + timedelta(days=2))
    assert to_cancel.status_code == 201
    cancelled = client.post(
        f"/api/bookings/{to_cancel.json()['id']}/cancel",
        headers={"X-User-Id": str(guest.id)},
        json={"reason": "plans_changed"},
    )
    assert cancelled.status_code == 200

    grouped = client.get("/api/bookings/me", headers={"X-User-Id": str(guest.id)}).json()
    assert [item["id"] for item in grouped["upcoming"]] == [upcoming.json()["id"]]
    assert [item["id"] for item in grouped["past"]] == [past.id]
    assert [item["id"] for item in grouped["cancelled"]] == [to_cancel.json()["id"]]


def test_cancelled_booking_frees_dates(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    guest = _user(db, "guest@example.com")
    other = _user(db, "other@example.com")
    listing = _listing(db, host)
    db.commit()
    check_in = date.today() + timedelta(days=6)
    check_out = check_in + timedelta(days=3)
    created = _post(client, guest.id, listing.id, check_in, check_out)
    assert created.status_code == 201
    booking_id = created.json()["id"]

    blocked = _post(client, other.id, listing.id, check_in, check_out)
    assert blocked.status_code == 409

    cancelled = client.post(
        f"/api/bookings/{booking_id}/cancel",
        headers={"X-User-Id": str(guest.id)},
        json={"reason": "plans_changed"},
    )
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"

    rebooked = _post(client, other.id, listing.id, check_in, check_out)
    assert rebooked.status_code == 201


def test_host_cannot_book_own_listing(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    listing = _listing(db, host)
    db.commit()
    check_in = date.today() + timedelta(days=4)
    response = _post(client, host.id, listing.id, check_in, check_in + timedelta(days=2))
    assert response.status_code == 403
    assert response.json()["detail"]


def test_cancel_rules(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    guest = _user(db, "guest@example.com")
    stranger = _user(db, "stranger@example.com")
    listing = _listing(db, host)
    db.commit()
    future_in = date.today() + timedelta(days=5)
    future = _post(client, guest.id, listing.id, future_in, future_in + timedelta(days=2))
    assert future.status_code == 201
    future_id = future.json()["id"]

    assert client.post(
        f"/api/bookings/{future_id}/cancel",
        headers={"X-User-Id": str(host.id)},
        json={"reason": "plans_changed"},
    ).status_code == 403
    assert client.post(
        f"/api/bookings/{future_id}/cancel",
        headers={"X-User-Id": str(stranger.id)},
        json={"reason": "plans_changed"},
    ).status_code == 403

    today_stay = _post(client, guest.id, listing.id, date.today(), date.today() + timedelta(days=2))
    assert today_stay.status_code == 201
    too_late = client.post(
        f"/api/bookings/{today_stay.json()['id']}/cancel",
        headers={"X-User-Id": str(guest.id)},
        json={"reason": "plans_changed"},
    )
    assert too_late.status_code == 400

    cancelled = client.post(
        f"/api/bookings/{future_id}/cancel",
        headers={"X-User-Id": str(guest.id)},
        json={"reason": "plans_changed"},
    )
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"
    mine = client.get("/api/bookings/me", headers={"X-User-Id": str(guest.id)}).json()
    assert future_id in [item["id"] for item in mine["cancelled"]]
    assert future_id not in [item["id"] for item in mine["upcoming"]]


def test_price_snapshot_survives_listing_price_change(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    guest = _user(db, "guest@example.com")
    listing = _listing(db, host, price_per_night=5000, cleaning_fee=500)
    db.commit()
    check_in = date.today() + timedelta(days=8)
    created = _post(client, guest.id, listing.id, check_in, check_in + timedelta(days=2))
    assert created.status_code == 201
    booking_id = created.json()["id"]

    stored = db.get(Listing, listing.id)
    stored.price_per_night = 9900
    stored.cleaning_fee = 50
    db.commit()

    detail = client.get(f"/api/bookings/{booking_id}", headers={"X-User-Id": str(guest.id)})
    assert detail.status_code == 200
    body = detail.json()
    assert body["nightly_rate"] == 5000
    assert body["cleaning_fee"] == 500
    assert body["service_fee"] == 1470
    assert body["taxes"] == 525
    assert body["total_price"] == 12495


def test_detail_access_and_can_review(api):
    client, db = api
    host = _user(db, "host@example.com", host=True)
    guest = _user(db, "guest@example.com")
    stranger = _user(db, "stranger@example.com")
    listing = _listing(db, host)
    booking = Booking(
        listing_id=listing.id,
        guest_id=guest.id,
        check_in=date.today() - timedelta(days=3),
        check_out=date.today(),
        num_guests=2,
        nights=3,
        nightly_rate=5000,
        cleaning_fee=500,
        service_fee=1470,
        taxes=0,
        original_total=16470,
        total_price=16470,
        status=BookingStatus.confirmed,
    )
    db.add(booking)
    db.commit()

    guest_view = client.get(f"/api/bookings/{booking.id}", headers={"X-User-Id": str(guest.id)})
    host_view = client.get(f"/api/bookings/{booking.id}", headers={"X-User-Id": str(host.id)})
    stranger_view = client.get(f"/api/bookings/{booking.id}", headers={"X-User-Id": str(stranger.id)})
    assert guest_view.status_code == 200
    assert guest_view.json()["can_review"] is True
    assert host_view.status_code == 200
    assert host_view.json()["can_review"] is False
    assert stranger_view.status_code == 403

    db.add(
        Review(
            booking_id=booking.id,
            listing_id=listing.id,
            author_id=guest.id,
            rating=5,
            comment="Lovely stay",
        )
    )
    db.commit()
    reviewed = client.get(f"/api/bookings/{booking.id}", headers={"X-User-Id": str(guest.id)})
    assert reviewed.json()["can_review"] is False
