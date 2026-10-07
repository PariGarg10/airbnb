from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.enums import ExperienceBookingStatus, ExperienceCategory
from app.models.experience import Experience, ExperienceBooking, ExperienceSlot
from app.models.user import User
from tests.helpers import add_user


def _add_experience(db: Session, host: User, **overrides) -> Experience:
    exp = Experience(
        host_id=host.id,
        title=overrides.pop("title", "Test experience"),
        city=overrides.pop("city", "Chennai"),
        region=overrides.pop("region", "Tamil Nadu"),
        category=overrides.pop("category", ExperienceCategory.food),
        description=overrides.pop("description", "A guided walk."),
        duration_minutes=overrides.pop("duration_minutes", 120),
        max_guests_per_slot=overrides.pop("max_guests_per_slot", 5),
        price_per_guest=overrides.pop("price_per_guest", 2899),
        meeting_point_name="Meet point",
        meeting_point_address="123 Main St",
        lat=13.08,
        lng=80.27,
        **overrides,
    )
    db.add(exp)
    db.flush()
    return exp


def _add_slot(db: Session, experience: Experience, **overrides) -> ExperienceSlot:
    start = overrides.pop("start_at", datetime.now(timezone.utc) + timedelta(days=2))
    end = overrides.pop("end_at", start + timedelta(hours=2))
    slot = ExperienceSlot(
        experience_id=experience.id,
        start_at=start,
        end_at=end,
        capacity=overrides.pop("capacity", 5),
        booked_count=overrides.pop("booked_count", 0),
        is_cancelled=overrides.pop("is_cancelled", False),
    )
    db.add(slot)
    db.flush()
    return slot


def test_quote_math(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    guest = add_user(db, "guest@example.com")
    exp = _add_experience(db, host, price_per_guest=2899)
    slot = _add_slot(db, exp)
    db.commit()

    quote = client.post("/api/experiences/quote", json={"slot_id": slot.id, "adults": 2}).json()
    assert quote["total"] == 5798
    assert quote["lines"][0]["amount"] == 5798
    assert "full refund" in quote["cancellation_text"].lower()


def test_capacity_conflict_409(api):
    client, db = api
    host = add_user(db, "host2@example.com", host=True)
    guest = add_user(db, "guest2@example.com")
    other = add_user(db, "other@example.com")
    exp = _add_experience(db, host, max_guests_per_slot=2)
    slot = _add_slot(db, exp, capacity=2, booked_count=1)
    db.commit()

    first = client.post(
        "/api/experience-bookings",
        json={"slot_id": slot.id, "adults": 1},
        headers={"X-User-Id": str(guest.id)},
    )
    assert first.status_code == 201

    conflict = client.post(
        "/api/experience-bookings",
        json={"slot_id": slot.id, "adults": 1},
        headers={"X-User-Id": str(other.id)},
    )
    assert conflict.status_code == 409


def test_past_slots_hidden(api):
    client, db = api
    host = add_user(db, "host3@example.com", host=True)
    exp = _add_experience(db, host)
    future = _add_slot(db, exp, start_at=datetime.now(timezone.utc) + timedelta(days=1))
    _add_slot(db, exp, start_at=datetime.now(timezone.utc) - timedelta(days=1))
    db.commit()

    body = client.get(f"/api/experiences/{exp.id}/slots", params={"guests": 1}).json()
    ids = [slot["id"] for group in body for slot in group["slots"]]
    assert future.id in ids
    assert len(ids) == 1


def test_cancel_refund_and_booked_count(api):
    client, db = api
    host = add_user(db, "host4@example.com", host=True)
    guest = add_user(db, "guest4@example.com")
    exp = _add_experience(db, host, price_per_guest=3000)
    start = datetime.now(timezone.utc) + timedelta(days=5)
    slot = _add_slot(db, exp, start_at=start, capacity=5)
    db.commit()

    created = client.post(
        "/api/experience-bookings",
        json={"slot_id": slot.id, "adults": 2, "payment_method_type": "card", "card_brand": "Visa", "card_last4": "4242"},
        headers={"X-User-Id": str(guest.id)},
    )
    assert created.status_code == 201
    booking_id = created.json()["id"]
    db.refresh(slot)
    assert slot.booked_count == 2

    cancelled = client.post(
        f"/api/experience-bookings/{booking_id}/cancel",
        headers={"X-User-Id": str(guest.id)},
    )
    assert cancelled.status_code == 200
    assert cancelled.json()["refund_amount"] == 6000
    db.refresh(slot)
    assert slot.booked_count == 0


def test_confirmation_codes_unique(api):
    client, db = api
    host = add_user(db, "host5@example.com", host=True)
    g1 = add_user(db, "g1@example.com")
    g2 = add_user(db, "g2@example.com")
    exp = _add_experience(db, host)
    slot1 = _add_slot(db, exp, start_at=datetime.now(timezone.utc) + timedelta(days=3))
    slot2 = _add_slot(db, exp, start_at=datetime.now(timezone.utc) + timedelta(days=4))
    db.commit()

    c1 = client.post(
        "/api/experience-bookings",
        json={"slot_id": slot1.id, "adults": 1},
        headers={"X-User-Id": str(g1.id)},
    ).json()["confirmation_code"]
    c2 = client.post(
        "/api/experience-bookings",
        json={"slot_id": slot2.id, "adults": 1},
        headers={"X-User-Id": str(g2.id)},
    ).json()["confirmation_code"]
    assert c1.startswith("EX") and len(c1) == 10
    assert c1 != c2


def test_only_owner_can_cancel(api):
    client, db = api
    host = add_user(db, "host6@example.com", host=True)
    guest = add_user(db, "guest6@example.com")
    stranger = add_user(db, "stranger@example.com")
    exp = _add_experience(db, host)
    slot = _add_slot(db, exp)
    db.commit()

    booking_id = client.post(
        "/api/experience-bookings",
        json={"slot_id": slot.id, "adults": 1},
        headers={"X-User-Id": str(guest.id)},
    ).json()["id"]

    denied = client.post(
        f"/api/experience-bookings/{booking_id}/cancel",
        headers={"X-User-Id": str(stranger.id)},
    )
    assert denied.status_code == 403


def test_bookings_me_includes_experiences(api):
    client, db = api
    host = add_user(db, "host7@example.com", host=True)
    guest = add_user(db, "guest7@example.com")
    exp = _add_experience(db, host)
    slot = _add_slot(db, exp, start_at=datetime.now(timezone.utc) + timedelta(days=2))
    db.commit()
    client.post(
        "/api/experience-bookings",
        json={"slot_id": slot.id, "adults": 1},
        headers={"X-User-Id": str(guest.id)},
    )

    mine = client.get("/api/bookings/me", headers={"X-User-Id": str(guest.id)}).json()
    assert "experiences" in mine
    assert len(mine["experiences"]["upcoming"]) == 1
    assert mine["experiences"]["upcoming"][0]["status"] == ExperienceBookingStatus.confirmed.value
