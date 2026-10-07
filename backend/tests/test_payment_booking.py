"""Mocked payment fields on booking create and host accept/decline guards."""

from datetime import date, timedelta

from app.models import Booking
from app.models.enums import BookingMode
from tests.helpers import add_listing, add_user


def _auth(user_id: int) -> dict[str, str]:
    return {"X-User-Id": str(user_id)}


def _create(client, guest_id: int, listing_id: int, check_in: date, **extra):
    body = {
        "listing_id": listing_id,
        "check_in": check_in.isoformat(),
        "check_out": (check_in + timedelta(days=2)).isoformat(),
        "adults": 1,
        "payment_method_type": "card",
        "card_brand": "Visa",
        "card_last4": "4242",
    }
    body.update(extra)
    return client.post("/api/bookings", headers=_auth(guest_id), json=body)


def test_create_booking_stores_only_card_metadata(api):
    client, db = api
    host = add_user(db, "host-pay@example.com", host=True)
    guest = add_user(db, "guest-pay@example.com")
    listing = add_listing(db, host, booking_mode=BookingMode.instant, instant_book=True)
    db.commit()
    check_in = date.today() + timedelta(days=14)
    response = _create(client, guest.id, listing.id, check_in)
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "confirmed"
    row = db.get(Booking, body["id"])
    assert row is not None
    assert row.payment_method_type.value == "card"
    assert row.card_brand == "Visa"
    assert row.card_last4 == "4242"


def test_accept_decline_permissions(api):
    client, db = api
    host = add_user(db, "host-req@example.com", host=True)
    other_host = add_user(db, "other-host@example.com", host=True)
    guest = add_user(db, "guest-req@example.com")
    listing = add_listing(db, host, booking_mode=BookingMode.approve_first_5, instant_book=False)
    db.commit()
    check_in = date.today() + timedelta(days=10)
    created = _create(client, guest.id, listing.id, check_in, message_to_host="Hello")
    assert created.status_code == 201
    booking_id = created.json()["id"]
    assert created.json()["status"] == "pending"

    assert client.post(f"/api/host/bookings/{booking_id}/accept", headers=_auth(other_host.id)).status_code == 403

    accepted = client.post(f"/api/host/bookings/{booking_id}/accept", headers=_auth(host.id))
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "confirmed"

    assert client.post(f"/api/host/bookings/{booking_id}/accept", headers=_auth(host.id)).status_code == 409
