from datetime import date, timedelta

from tests.helpers import add_booking, add_listing, add_user


def _auth(user_id: int) -> dict[str, str]:
    return {"X-User-Id": str(user_id)}


def _review_body(rating: int) -> dict:
    return {"rating": rating, "comment": "A calm stay with a lovely morning view."}


def test_review_eligibility_and_rating_recompute(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    guest = add_user(db, "guest@example.com", name="Sofia")
    stranger = add_user(db, "stranger@example.com")
    listing = add_listing(db, host)
    today = date.today()
    first = add_booking(db, listing, guest, today - timedelta(days=6), today - timedelta(days=3))
    second = add_booking(db, listing, guest, today - timedelta(days=12), today - timedelta(days=9))
    db.commit()

    future_in = today + timedelta(days=4)
    future = client.post(
        "/api/bookings",
        headers=_auth(guest.id),
        json={
            "listing_id": listing.id,
            "check_in": future_in.isoformat(),
            "check_out": (future_in + timedelta(days=2)).isoformat(),
            "num_guests": 2,
        },
    )
    assert future.status_code == 201
    too_soon = client.post(
        f"/api/bookings/{future.json()['id']}/review",
        headers=_auth(guest.id),
        json=_review_body(5),
    )
    assert too_soon.status_code == 400

    other = client.post(
        f"/api/bookings/{first.id}/review",
        headers=_auth(stranger.id),
        json=_review_body(4),
    )
    assert other.status_code == 403

    created = client.post(
        f"/api/bookings/{first.id}/review",
        headers=_auth(guest.id),
        json=_review_body(5),
    )
    assert created.status_code == 201
    assert created.json()["rating"] == 5
    assert created.json()["author"]["name"] == "Sofia"

    duplicate = client.post(
        f"/api/bookings/{first.id}/review",
        headers=_auth(guest.id),
        json=_review_body(5),
    )
    assert duplicate.status_code == 409

    second_review = client.post(
        f"/api/bookings/{second.id}/review",
        headers=_auth(guest.id),
        json=_review_body(4),
    )
    assert second_review.status_code == 201

    detail = client.get(f"/api/listings/{listing.id}")
    assert detail.status_code == 200
    assert detail.json()["review_count"] == 2
    assert detail.json()["avg_rating"] == 4.5

    reviews = client.get(f"/api/listings/{listing.id}/reviews")
    assert reviews.status_code == 200
    body = reviews.json()
    assert body["total"] == 2
    assert body["page_size"] == 6
    assert {item["rating"] for item in body["items"]} == {5, 4}
    assert all("created_at" in item["author"] for item in body["items"])
    assert body["rating_distribution"] == {"5": 1, "4": 1, "3": 0, "2": 0, "1": 0}
