from datetime import date, timedelta

from app.models.enums import BookingStatus
from app.models.listing import Listing
from app.models.wishlist import Wishlist, WishlistItem
from tests.helpers import add_amenity, add_booking, add_host_profile, add_listing, add_user, listing_body


def _auth(user_id: int) -> dict[str, str]:
    return {"X-User-Id": str(user_id)}


def test_non_host_is_forbidden(api):
    client, db = api
    guest = add_user(db, "guest@example.com")
    db.commit()
    response = client.get("/api/host/listings", headers=_auth(guest.id))
    assert response.status_code == 403


def test_invalid_amenity_returns_400(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    add_host_profile(db, host)
    db.commit()
    response = client.post(
        "/api/host/listings",
        headers=_auth(host.id),
        json=listing_body(amenity_ids=[999]),
    )
    assert response.status_code == 400


def test_editing_another_hosts_listing_is_forbidden(api):
    client, db = api
    owner = add_user(db, "owner@example.com", host=True)
    other = add_user(db, "other@example.com", host=True)
    add_host_profile(db, owner)
    add_host_profile(db, other)
    amenity = add_amenity(db)
    db.commit()
    created = client.post(
        "/api/host/listings",
        headers=_auth(owner.id),
        json=listing_body(amenity_ids=[amenity.id]),
    )
    assert created.status_code == 201
    response = client.put(
        f"/api/host/listings/{created.json()['id']}",
        headers=_auth(other.id),
        json=listing_body(title="Taken over house"),
    )
    assert response.status_code == 403


def test_update_replaces_image_order(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    add_host_profile(db, host)
    db.commit()
    created = client.post(
        "/api/host/listings",
        headers=_auth(host.id),
        json=listing_body(),
    )
    assert created.status_code == 201
    listing_id = created.json()["id"]

    updated = client.put(
        f"/api/host/listings/{listing_id}",
        headers=_auth(host.id),
        json=listing_body(
            images=[
                {"url": "https://example.com/b.jpg"},
                {"url": "https://example.com/a.jpg", "caption": "Pool"},
            ]
        ),
    )
    assert updated.status_code == 200
    images = updated.json()["images"]
    assert [image["url"] for image in images] == [
        "https://example.com/b.jpg",
        "https://example.com/a.jpg",
    ]
    assert [image["position"] for image in images] == [0, 1]


def test_soft_delete_hides_listing_but_keeps_guest_trip(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    guest = add_user(db, "guest@example.com")
    listing = add_listing(db, host, city="Softville", title="Softville house")
    db.commit()
    check_in = date.today() + timedelta(days=8)
    booked = client.post(
        "/api/bookings",
        headers=_auth(guest.id),
        json={
            "listing_id": listing.id,
            "check_in": check_in.isoformat(),
            "check_out": (check_in + timedelta(days=2)).isoformat(),
            "num_guests": 2,
        },
    )
    assert booked.status_code == 201

    deleted = client.delete(f"/api/host/listings/{listing.id}", headers=_auth(host.id))
    assert deleted.status_code == 200
    assert deleted.json() == {"deleted": "soft"}

    search = client.get("/api/listings", params={"location": "Softville"})
    assert search.status_code == 200
    assert search.json()["total"] == 0
    assert client.get(f"/api/listings/{listing.id}").status_code == 404

    trips = client.get("/api/bookings/me", headers=_auth(guest.id))
    assert trips.status_code == 200
    upcoming = trips.json()["upcoming"]
    assert [item["listing"]["id"] for item in upcoming] == [listing.id]
    assert upcoming[0]["listing"]["title"] == "Softville house"


def test_hard_delete_removes_listing_without_bookings(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    guest = add_user(db, "guest@example.com")
    listing = add_listing(db, host, city="Hardville")
    listing_id = listing.id
    favourites = Wishlist(user_id=guest.id, name="Favourites")
    db.add(favourites)
    db.flush()
    db.add(WishlistItem(wishlist_id=favourites.id, listing_id=listing_id))
    db.commit()

    deleted = client.delete(f"/api/host/listings/{listing_id}", headers=_auth(host.id))
    assert deleted.status_code == 200
    assert deleted.json() == {"deleted": "hard"}
    assert client.get(f"/api/listings/{listing_id}").status_code == 404
    db.expire_all()
    assert db.get(Listing, listing_id) is None


def test_host_booking_status_filters_and_stats(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True, name="Ananya")
    other_host = add_user(db, "other-host@example.com", host=True)
    guest = add_user(db, "guest@example.com", name="Sofia")
    listing = add_listing(db, host, title="Host cabin")
    other_listing = add_listing(db, other_host, title="Other cabin", city="Jaipur")
    today = date.today()
    upcoming = add_booking(
        db, listing, guest, today + timedelta(days=10), today + timedelta(days=12), total_price=1000
    )
    current = add_booking(db, listing, guest, today, today + timedelta(days=2), total_price=2000)
    completed = add_booking(
        db, listing, guest, today - timedelta(days=40), today - timedelta(days=37), total_price=3000
    )
    cancelled = add_booking(
        db,
        listing,
        guest,
        today + timedelta(days=3),
        today + timedelta(days=5),
        status=BookingStatus.cancelled,
        total_price=4000,
    )
    add_booking(
        db, other_listing, guest, today + timedelta(days=6), today + timedelta(days=8), total_price=9000
    )
    db.commit()

    def ids_for(status: str) -> list[int]:
        response = client.get("/api/host/bookings", params={"status": status}, headers=_auth(host.id))
        assert response.status_code == 200
        return [item["id"] for item in response.json()]

    assert ids_for("upcoming") == [upcoming.id]
    assert ids_for("current") == [current.id]
    assert ids_for("completed") == [completed.id]
    assert ids_for("cancelled") == [cancelled.id]

    sample = client.get("/api/host/bookings", params={"status": "upcoming"}, headers=_auth(host.id)).json()[0]
    assert sample["guest"] == {"name": "Sofia", "avatar_url": None}
    assert sample["listing"]["id"] == listing.id
    assert sample["listing"]["title"] == "Host cabin"
    assert sample["guests"] == 2
    assert sample["total_price"] == 1000

    stats = client.get("/api/host/stats", headers=_auth(host.id))
    assert stats.status_code == 200
    assert stats.json()["total_listings"] == 1
    assert stats.json()["active_listings"] == 1
    assert stats.json()["upcoming_bookings"] == 1
    earnings = 2000
    upcoming_in = today + timedelta(days=10)
    if upcoming_in.year == today.year and upcoming_in.month == today.month:
        earnings += 1000
    assert stats.json()["earnings_this_month"] == earnings
