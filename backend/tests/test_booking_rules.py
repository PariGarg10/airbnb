"""Taxes, coupons, guest limits, request-to-book, cancellation, and companions."""

from datetime import date, datetime, timedelta

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.booking import Booking, BookingCompanion
from app.models.coupon import Coupon
from app.models.enums import BookingMode, BookingStatus, DiscountType
from app.services.booking_service import _preview_for
from app.services.pricing_service import compute_refund, quote_price
from tests.helpers import add_booking, add_listing, add_user


def _auth(user_id: int) -> dict[str, str]:
    return {"X-User-Id": str(user_id)}


def _stay(client, user_id: int, listing_id: int, check_in: date, nights: int = 2, **extra):
    body = {
        "listing_id": listing_id,
        "check_in": check_in.isoformat(),
        "check_out": (check_in + timedelta(days=nights)).isoformat(),
        "adults": extra.pop("adults", 1),
        "children": extra.pop("children", 0),
        "infants": extra.pop("infants", 0),
        "pets": extra.pop("pets", 0),
    }
    body.update(extra)
    return client.post("/api/bookings", headers=_auth(user_id), json=body)


def test_taxes_round_half_up():
    priced = quote_price(
        base_nightly_rate=10,
        cleaning_fee=0,
        check_in=date(2026, 10, 7),
        check_out=date(2026, 10, 8),
    )
    assert priced.nights_total == 10
    assert priced.taxes == 1
    assert priced.total == priced.nights_total + priced.service_fee + priced.taxes


def test_coupon_applies_after_listing_discount_and_before_taxes():
    shared = dict(
        base_nightly_rate=1000,
        cleaning_fee=100,
        check_in=date(2026, 11, 4),
        check_out=date(2026, 11, 6),
        discount_new_listing_pct=20,
        confirmed_booking_count=0,
        booking_date=date(2026, 10, 1),
    )
    plain = quote_price(**shared)
    discounted = quote_price(**shared, coupon_code="WELCOME10", coupon_percent=10)
    assert plain.discount is not None
    assert plain.discount.type == DiscountType.new_listing
    assert plain.nights_total_original == 2000
    assert plain.nights_total == 1600
    assert discounted.nights_total == 1600
    assert discounted.coupon is not None
    assert discounted.coupon.amount == 160
    assert discounted.service_fee == plain.service_fee
    assert discounted.taxes == 77
    assert discounted.taxes < plain.taxes
    assert discounted.total == 1600 - 160 + 100 + discounted.service_fee + 77


def test_coupon_validity_limits_and_quote(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    guest = add_user(db, "guest@example.com")
    listing = add_listing(db, host, price_per_night=1000, cleaning_fee=0, discount_new_listing_pct=0)
    welcome = Coupon(code="WELCOME10", percent_off=10, max_uses=1, uses=0, active=True)
    db.add(welcome)
    db.add(
        Coupon(
            code="OLD",
            percent_off=10,
            max_uses=5,
            uses=0,
            active=True,
            expires_at=datetime(2020, 1, 1),
        )
    )
    db.commit()
    check_in = date.today() + timedelta(days=10)
    params = {
        "code": "welcome10",
        "listing_id": listing.id,
        "check_in": check_in.isoformat(),
        "check_out": (check_in + timedelta(days=2)).isoformat(),
    }
    ok = client.get("/api/coupons/validate", params=params)
    assert ok.status_code == 200
    assert ok.json()["valid"] is True
    assert ok.json()["amount"] > 0

    for code in ("NOPE", "OLD"):
        bad = client.get("/api/coupons/validate", params={**params, "code": code})
        assert bad.status_code == 200
        assert bad.json() == {"valid": False, "amount": 0, "message": "This coupon isn't valid"}

    plain = client.get(
        f"/api/listings/{listing.id}/quote",
        params={"check_in": params["check_in"], "check_out": params["check_out"], "guests": 1},
    )
    with_coupon = client.get(
        f"/api/listings/{listing.id}/quote",
        params={
            "check_in": params["check_in"],
            "check_out": params["check_out"],
            "guests": 1,
            "coupon": "WELCOME10",
        },
    )
    assert with_coupon.status_code == 200
    body = with_coupon.json()
    assert body["service_fee"] == plain.json()["service_fee"]
    assert body["coupon"]["code"] == "WELCOME10"
    assert body["coupon"]["amount"] == ok.json()["amount"]
    assert body["taxes"] < plain.json()["taxes"]

    booked = _stay(client, guest.id, listing.id, check_in, coupon_code="WELCOME10")
    assert booked.status_code == 201
    assert booked.json()["coupon_code"] == "WELCOME10"
    db.expire_all()
    assert db.get(Coupon, welcome.id).uses == 1
    used = client.get("/api/coupons/validate", params={**params, "check_in": (check_in + timedelta(days=5)).isoformat(), "check_out": (check_in + timedelta(days=7)).isoformat()})
    assert used.json()["message"] == "This coupon isn't valid"


def test_coupon_percent_check(api):
    _client, db = api
    db.add(Coupon(code="TOO", percent_off=51, max_uses=1, uses=0, active=True))
    with pytest.raises(IntegrityError):
        db.flush()
    db.rollback()
    db.add(Coupon(code="ZERO", percent_off=0, max_uses=1, uses=0, active=True))
    with pytest.raises(IntegrityError):
        db.flush()


def test_guest_and_pet_limits(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    guest = add_user(db, "guest@example.com")
    quiet = add_listing(db, host, max_guests=2, allows_pets=False)
    pets_ok = add_listing(db, host, title="Pet house", max_guests=2, allows_pets=True, city="Pune")
    db.commit()
    check_in = date.today() + timedelta(days=4)

    assert _stay(client, guest.id, quiet.id, check_in, adults=2, children=1).status_code == 400
    assert _stay(client, guest.id, quiet.id, check_in, adults=2, infants=5).status_code == 201
    assert _stay(client, guest.id, quiet.id, check_in + timedelta(days=3), infants=6).status_code == 422
    assert _stay(client, guest.id, quiet.id, check_in + timedelta(days=6), pets=1).status_code == 400
    allowed = _stay(client, guest.id, pets_ok.id, check_in, pets=5)
    assert allowed.status_code == 201
    assert allowed.json()["pets"] == 5
    assert _stay(client, guest.id, pets_ok.id, check_in + timedelta(days=4), pets=6).status_code == 422


def test_request_versus_instant_and_pending_blocks(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    other_host = add_user(db, "other-host@example.com", host=True)
    guest = add_user(db, "guest@example.com")
    other = add_user(db, "other@example.com")
    instant = add_listing(db, host, booking_mode=BookingMode.instant, city="Goa")
    request = add_listing(
        db,
        host,
        title="Request house",
        booking_mode=BookingMode.approve_first_5,
        city="Jaipur",
        address="12 Request Road",
    )
    db.commit()
    check_in = date.today() + timedelta(days=12)

    immediate = _stay(client, guest.id, instant.id, check_in)
    assert immediate.status_code == 201
    assert immediate.json()["status"] == "confirmed"
    assert immediate.json()["confirmation_code"].startswith("HM")
    assert len(immediate.json()["confirmation_code"]) == 10

    missing = _stay(client, guest.id, request.id, check_in)
    assert missing.status_code == 400
    pending = _stay(client, guest.id, request.id, check_in, message_to_host="  Hello from us.  ")
    assert pending.status_code == 201
    body = pending.json()
    assert body["status"] == "pending"
    assert body["message_to_host"] == "Hello from us."
    assert body["listing"]["address"] is None
    assert body["listing"]["city"] == "Jaipur"
    assert body["can_cancel"] is True
    blocked = _stay(client, other.id, request.id, check_in + timedelta(days=1), message_to_host="Also us")
    assert blocked.status_code == 409

    stranger = add_user(db, "stranger-host@example.com", host=True)
    db.commit()
    assert client.post(
        f"/api/host/bookings/{body['id']}/accept",
        headers=_auth(stranger.id),
    ).status_code == 403
    assert client.post(
        f"/api/host/bookings/{body['id']}/accept",
        headers=_auth(guest.id),
    ).status_code == 403
    accepted = client.post(f"/api/host/bookings/{body['id']}/accept", headers=_auth(host.id))
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "confirmed"
    assert accepted.json()["listing"]["address"] == "12 Request Road"

    second_in = check_in + timedelta(days=8)
    second = _stay(client, other.id, request.id, second_in, message_to_host="Please")
    assert second.status_code == 201
    assert client.post(
        f"/api/host/bookings/{second.json()['id']}/decline",
        headers=_auth(other_host.id),
    ).status_code == 403
    declined = client.post(f"/api/host/bookings/{second.json()['id']}/decline", headers=_auth(host.id))
    assert declined.status_code == 200
    assert declined.json()["status"] == "declined"
    assert declined.json()["refund_amount"] == declined.json()["total_price"]
    assert declined.json()["cancelled_by"] == "host"
    rebooked = _stay(client, guest.id, request.id, second_in, message_to_host="Trying again")
    assert rebooked.status_code == 201


def test_fifth_confirmed_booking_skips_approval(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    guest = add_user(db, "guest@example.com")
    listing = add_listing(db, host, booking_mode=BookingMode.approve_first_5)
    today = date.today()
    for index in range(4):
        start = today - timedelta(days=40 + index * 4)
        add_booking(db, listing, guest, start, start + timedelta(days=2))
    db.commit()
    check_in = today + timedelta(days=6)
    still_request = _stay(client, guest.id, listing.id, check_in)
    assert still_request.status_code == 400
    add_booking(db, listing, guest, today - timedelta(days=3), today - timedelta(days=1))
    db.commit()
    confirmed = _stay(client, guest.id, listing.id, check_in)
    assert confirmed.status_code == 201
    assert confirmed.json()["status"] == "confirmed"


def test_pending_expires_and_frees_dates(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    guest = add_user(db, "guest@example.com")
    other = add_user(db, "other@example.com")
    listing = add_listing(db, host, booking_mode=BookingMode.approve_first_5)
    db.commit()
    check_in = date.today() + timedelta(days=9)
    created = _stay(client, guest.id, listing.id, check_in, message_to_host="See you")
    assert created.status_code == 201
    booking_id = created.json()["id"]
    row = db.get(Booking, booking_id)
    from app.core.time import utcnow

    row.created_at = utcnow() - timedelta(hours=25)
    db.commit()

    detail = client.get(f"/api/bookings/{booking_id}", headers=_auth(guest.id))
    assert detail.status_code == 200
    assert detail.json()["status"] == "expired"
    assert detail.json()["refund_amount"] == detail.json()["total_price"]
    assert detail.json()["cancelled_by"] == "system"
    assert detail.json()["listing"]["address"] is None
    freed = _stay(client, other.id, listing.id, check_in, message_to_host="Now me")
    assert freed.status_code == 201
    stale = client.post(f"/api/host/bookings/{booking_id}/accept", headers=_auth(host.id))
    assert stale.status_code == 400


def test_cancellation_preview_and_cancel(api):
    full_stay = Booking(
        check_in=date(2026, 12, 1),
        status=BookingStatus.confirmed,
        nights=2,
        nightly_rate=5000,
        cleaning_fee=500,
        service_fee=1470,
        taxes=525,
        coupon_amount=0,
        discount_amount=0,
        total_price=12495,
        original_total=12495,
        num_guests=2,
        adults=2,
    )
    early = _preview_for(full_stay, datetime(2026, 11, 1, 12, 0))
    assert early.refund_amount == 12495
    assert early.non_refundable_amount == 0
    late = _preview_for(full_stay, datetime(2026, 11, 30, 16, 0))
    assert late.refund_amount == 5750
    assert late.non_refundable_amount == 12495 - 5750
    assert "Service fee" not in {line.label for line in late.lines}
    pending_stay = Booking(
        check_in=date(2026, 12, 1),
        status=BookingStatus.pending,
        nights=2,
        nightly_rate=5000,
        cleaning_fee=500,
        service_fee=1470,
        taxes=525,
        coupon_amount=0,
        discount_amount=0,
        total_price=12495,
        original_total=12495,
        num_guests=2,
        adults=2,
    )
    pending_late = _preview_for(pending_stay, datetime(2026, 11, 30, 16, 0))
    assert pending_late.refund_amount == 12495

    refund = compute_refund(
        nights_total=10000,
        coupon_amount=0,
        cleaning_fee=500,
        service_fee=1470,
        taxes=525,
        total=12495,
        full=False,
    )
    assert refund.refund_amount == 5000 + 250 + 500

    client, db = api
    host = add_user(db, "host@example.com", host=True)
    guest = add_user(db, "guest@example.com")
    listing = add_listing(db, host, price_per_night=5000, cleaning_fee=500, discount_new_listing_pct=0)
    db.commit()
    check_in = date.today() + timedelta(days=10)
    created = _stay(client, guest.id, listing.id, check_in, adults=2)
    assert created.status_code == 201
    booking_id = created.json()["id"]
    preview = client.get(f"/api/bookings/{booking_id}/cancellation-preview", headers=_auth(guest.id))
    assert preview.status_code == 200
    assert preview.json()["refund_amount"] == created.json()["total_price"]
    assert preview.json()["non_refundable_amount"] == 0
    assert preview.json()["policy_text"]
    missing = client.post(f"/api/bookings/{booking_id}/cancel", headers=_auth(guest.id))
    assert missing.status_code == 422
    cancelled = client.post(
        f"/api/bookings/{booking_id}/cancel",
        headers=_auth(guest.id),
        json={"reason": "found_another_place"},
    )
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"
    assert cancelled.json()["cancel_reason"] == "found_another_place"
    assert cancelled.json()["refund_amount"] == created.json()["total_price"]
    assert cancelled.json()["can_cancel"] is False
    again = client.post(
        f"/api/bookings/{booking_id}/cancel",
        headers=_auth(guest.id),
        json={"reason": "other"},
    )
    assert again.status_code == 400


def test_companions_limit_and_cascade(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    guest = add_user(db, "guest@example.com")
    listing = add_listing(db, host)
    db.commit()
    check_in = date.today() + timedelta(days=7)
    created = _stay(client, guest.id, listing.id, check_in, adults=2, children=1)
    assert created.status_code == 201
    booking_id = created.json()["id"]
    payload = {
        "companions": [
            {"name": "Asha", "email": "asha@example.com"},
            {"name": "Dev", "email": "dev@example.com"},
        ]
    }
    added = client.post(f"/api/bookings/{booking_id}/companions", headers=_auth(guest.id), json=payload)
    assert added.status_code == 200
    assert len(added.json()) == 2
    extra = client.post(
        f"/api/bookings/{booking_id}/companions",
        headers=_auth(guest.id),
        json={"companions": [{"name": "Riya", "email": "riya@example.com"}]},
    )
    assert extra.status_code == 400
    assert client.post(
        f"/api/bookings/{booking_id}/companions",
        headers=_auth(host.id),
        json={"companions": [{"name": "Host", "email": "host@example.com"}]},
    ).status_code == 403
    assert client.post(
        f"/api/bookings/{booking_id}/companions",
        headers=_auth(guest.id),
        json={"companions": [{"name": "Bad", "email": "not-an-email"}]},
    ).status_code == 422

    row = db.get(Booking, booking_id)
    companion_id = row.companions[0].id
    db.delete(row)
    db.flush()
    db.expire_all()
    assert db.get(BookingCompanion, companion_id) is None


def test_confirmation_code_is_unique(api):
    _client, db = api
    host = add_user(db, "host@example.com", host=True)
    guest = add_user(db, "guest@example.com")
    listing = add_listing(db, host)
    first = add_booking(db, listing, guest, date(2026, 12, 1), date(2026, 12, 3))
    second = add_booking(db, listing, guest, date(2026, 12, 10), date(2026, 12, 12))
    assert first.confirmation_code != second.confirmation_code
    assert first.confirmation_code.startswith("HM")
    second.confirmation_code = first.confirmation_code
    with pytest.raises(IntegrityError):
        db.flush()
