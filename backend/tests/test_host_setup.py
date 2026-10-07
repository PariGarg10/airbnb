"""Host setup fields, pricing rules, and publish gates."""

from datetime import date, timedelta

from app.models.enums import BookingStatus, DiscountType, OccupantType
from app.models.listing import ListingOccupant
from app.services.listing_location import public_coordinates
from app.services.pricing_service import quote_price
from tests.helpers import add_amenity, add_booking, add_host_profile, add_listing, add_user, listing_body


def _auth(user_id: int) -> dict[str, str]:
    return {"X-User-Id": str(user_id)}


def test_weekend_pricing(api):
    priced = quote_price(
        base_nightly_rate=1000,
        cleaning_fee=0,
        check_in=date(2026, 10, 2),  # Fri
        check_out=date(2026, 10, 5),  # Mon (Fri, Sat, Sun)
        weekend_adjustment_pct=10,
    )
    assert priced.nightly_breakdown.weekend_nights == 2
    assert priced.nightly_breakdown.weekday_nights == 1
    assert priced.nightly_breakdown.weekend_rate == 1100
    assert priced.nightly_breakdown.weekday_rate == 1000
    assert priced.nights_total == 3200  # 1100 + 1100 + 1000


def test_largest_discount_wins(api):
    priced = quote_price(
        base_nightly_rate=1000,
        cleaning_fee=0,
        check_in=date.today() + timedelta(days=3),
        check_out=date.today() + timedelta(days=10),
        discount_new_listing_pct=20,
        discount_weekly_pct=8,
        confirmed_booking_count=0,
        booking_date=date.today(),
    )
    assert priced.discount is not None
    assert priced.discount.type == DiscountType.new_listing
    assert priced.discount.pct == 20


def test_new_listing_promo_stops_after_three_bookings(api):
    priced = quote_price(
        base_nightly_rate=1000,
        cleaning_fee=0,
        check_in=date.today() + timedelta(days=20),
        check_out=date.today() + timedelta(days=22),
        discount_new_listing_pct=20,
        confirmed_booking_count=3,
    )
    assert priced.discount is None


def test_last_minute_discount(api):
    priced = quote_price(
        base_nightly_rate=1000,
        cleaning_fee=0,
        check_in=date.today() + timedelta(days=5),
        check_out=date.today() + timedelta(days=7),
        discount_new_listing_pct=0,
        discount_last_minute_pct=15,
        confirmed_booking_count=5,
        booking_date=date.today(),
    )
    assert priced.discount is not None
    assert priced.discount.type == DiscountType.last_minute


def test_host_profile_required_before_first_publish(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    amenity = add_amenity(db)
    db.commit()
    response = client.post(
        "/api/host/listings",
        headers=_auth(host.id),
        json=listing_body(amenity_ids=[amenity.id]),
    )
    assert response.status_code == 409
    assert "host profile" in response.json()["detail"].lower()


def test_bathrooms_sum_on_create(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    add_host_profile(db, host)
    db.commit()
    response = client.post(
        "/api/host/listings",
        headers=_auth(host.id),
        json=listing_body(
            private_bathrooms=1,
            dedicated_bathrooms=0.5,
            shared_bathrooms=0.5,
        ),
    )
    assert response.status_code == 201
    body = response.json()
    assert body["bathrooms"] == 2.0


def test_occupants_and_captions(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    add_host_profile(db, host)
    db.commit()
    response = client.post(
        "/api/host/listings",
        headers=_auth(host.id),
        json=listing_body(
            occupants=["me", "family"],
            images=[{"url": "https://example.com/a.jpg", "caption": "Deck"}],
        ),
    )
    assert response.status_code == 201
    body = response.json()
    assert set(body["occupants"]) == {"me", "family"}
    assert body["images"][0]["caption"] == "Deck"


def test_approximate_location(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    listing = add_listing(db, host, lat=12.97, lng=77.59, show_precise_location=False)
    db.commit()
    detail = client.get(f"/api/listings/{listing.id}")
    assert detail.status_code == 200
    body = detail.json()
    assert body["location_is_approximate"] is True
    assert (body["lat"], body["lng"]) != (12.97, 77.59)


def test_booking_snapshots_discount(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    guest = add_user(db, "guest@example.com")
    listing = add_listing(
        db,
        host,
        price_per_night=1000,
        cleaning_fee=0,
        discount_new_listing_pct=20,
    )
    db.commit()
    check_in = date.today() + timedelta(days=14)
    check_out = check_in + timedelta(days=2)
    quote = client.get(
        f"/api/listings/{listing.id}/quote",
        params={"check_in": check_in.isoformat(), "check_out": check_out.isoformat(), "guests": 2},
    )
    assert quote.status_code == 200
    assert quote.json()["discount"]["type"] == "new_listing"
    assert quote.json()["original_total"] > quote.json()["total"]

    booked = client.post(
        "/api/bookings",
        headers=_auth(guest.id),
        json={
            "listing_id": listing.id,
            "check_in": check_in.isoformat(),
            "check_out": check_out.isoformat(),
            "num_guests": 2,
        },
    )
    assert booked.status_code == 201
    booking_id = booked.json()["id"]
    db.expire_all()
    from app.models.booking import Booking

    row = db.get(Booking, booking_id)
    assert row.discount_type == DiscountType.new_listing
    assert row.discount_amount > 0
    assert row.original_total > row.total_price


def test_host_profile_crud(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    db.commit()
    missing = client.get("/api/host/profile", headers=_auth(host.id))
    assert missing.status_code == 404
    saved = client.put(
        "/api/host/profile",
        headers=_auth(host.id),
        json={
            "country": "India",
            "street": "42 Residency Road",
            "city": "Bengaluru",
            "pin_code": "560025",
            "is_business": False,
        },
    )
    assert saved.status_code == 200
    assert saved.json()["city"] == "Bengaluru"
    fetched = client.get("/api/host/profile", headers=_auth(host.id))
    assert fetched.status_code == 200


def test_occupants_replaced_on_update(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    add_host_profile(db, host)
    db.commit()
    created = client.post("/api/host/listings", headers=_auth(host.id), json=listing_body(occupants=["me"]))
    listing_id = created.json()["id"]
    updated = client.put(
        f"/api/host/listings/{listing_id}",
        headers=_auth(host.id),
        json=listing_body(occupants=["flatmates"]),
    )
    assert updated.status_code == 200
    assert updated.json()["occupants"] == ["flatmates"]

