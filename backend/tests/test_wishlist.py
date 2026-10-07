from tests.helpers import add_listing, add_user


def _auth(user_id: int) -> dict[str, str]:
    return {"X-User-Id": str(user_id)}


def _create(client, user_id: int, name: str, listing_id: int | None = None):
    body: dict[str, object] = {"name": name}
    if listing_id is not None:
        body["listing_id"] = listing_id
    return client.post("/api/wishlists", json=body, headers=_auth(user_id))


def test_create_lists_and_optionally_saves(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    guest = add_user(db, "guest@example.com")
    listing = add_listing(db, host)
    other = add_listing(db, host, title="Second house", city="Jaipur")
    db.commit()

    created = _create(client, guest.id, "  Weekend  ", listing.id)
    assert created.status_code == 201
    body = created.json()
    assert body["name"] == "Weekend"
    assert body["count"] == 1
    assert body["listing_ids"] == [listing.id]
    assert body["cover_images"] == ["https://example.com/cover.jpg"]

    listed = client.get("/api/wishlists", headers=_auth(guest.id))
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [body["id"]]

    cards = client.get(f"/api/wishlists/{body['id']}", headers=_auth(guest.id))
    assert cards.status_code == 200
    assert [card["id"] for card in cards.json()] == [listing.id]
    assert cards.json()[0]["is_wishlisted"] is True

    saved = client.get("/api/wishlists/saved-ids", headers=_auth(guest.id))
    assert saved.status_code == 200
    assert saved.json() == {"listing_ids": [listing.id]}

    search = client.get("/api/listings", params={"location": "Goa"}, headers=_auth(guest.id))
    assert search.json()["items"][0]["is_wishlisted"] is True
    untouched = client.get("/api/listings", params={"location": "Jaipur"}, headers=_auth(guest.id))
    assert untouched.json()["items"][0]["id"] == other.id
    assert untouched.json()["items"][0]["is_wishlisted"] is False


def test_item_add_and_remove_are_idempotent(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    guest = add_user(db, "guest@example.com")
    first = add_listing(db, host, title="First house")
    second = add_listing(db, host, title="Second house", city="Jaipur")
    db.commit()

    weekend = _create(client, guest.id, "Weekend").json()
    favourites = _create(client, guest.id, "Favourites").json()

    added = client.post(
        f"/api/wishlists/{weekend['id']}/items/{first.id}",
        headers=_auth(guest.id),
    )
    again = client.post(
        f"/api/wishlists/{weekend['id']}/items/{first.id}",
        headers=_auth(guest.id),
    )
    also = client.post(
        f"/api/wishlists/{favourites['id']}/items/{first.id}",
        headers=_auth(guest.id),
    )
    assert added.status_code == 204
    assert again.status_code == 204
    assert also.status_code == 204

    saved = client.get("/api/wishlists/saved-ids", headers=_auth(guest.id))
    assert saved.json() == {"listing_ids": [first.id]}
    weekend_cards = client.get(f"/api/wishlists/{weekend['id']}", headers=_auth(guest.id))
    assert [card["id"] for card in weekend_cards.json()] == [first.id]

    removed = client.delete(
        f"/api/wishlists/{weekend['id']}/items/{first.id}",
        headers=_auth(guest.id),
    )
    removed_again = client.delete(
        f"/api/wishlists/{weekend['id']}/items/{first.id}",
        headers=_auth(guest.id),
    )
    assert removed.status_code == 204
    assert removed_again.status_code == 204
    still = client.get("/api/wishlists/saved-ids", headers=_auth(guest.id))
    assert still.json() == {"listing_ids": [first.id]}

    client.delete(f"/api/wishlists/{favourites['id']}/items/{first.id}", headers=_auth(guest.id))
    empty = client.get("/api/wishlists/saved-ids", headers=_auth(guest.id))
    assert empty.json() == {"listing_ids": []}

    missing_list = client.post(f"/api/wishlists/999/items/{second.id}", headers=_auth(guest.id))
    missing_listing = client.post(
        f"/api/wishlists/{weekend['id']}/items/999",
        headers=_auth(guest.id),
    )
    assert missing_list.status_code == 404
    assert missing_listing.status_code == 404
    assert client.delete(f"/api/wishlists/{weekend['id']}/items/999", headers=_auth(guest.id)).status_code == 404


def test_cover_images_stop_at_four(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    guest = add_user(db, "guest@example.com")
    listings = [add_listing(db, host, title=f"House {index}", city=f"City{index}") for index in range(5)]
    db.commit()

    created = _create(client, guest.id, "Favourites")
    wishlist_id = created.json()["id"]
    for listing in listings:
        assert (
            client.post(
                f"/api/wishlists/{wishlist_id}/items/{listing.id}",
                headers=_auth(guest.id),
            ).status_code
            == 204
        )

    summary = client.get("/api/wishlists", headers=_auth(guest.id)).json()[0]
    assert summary["count"] == 5
    assert len(summary["cover_images"]) == 4
    assert summary["listing_ids"] == [listing.id for listing in reversed(listings)]


def test_rename_and_delete(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    guest = add_user(db, "guest@example.com")
    listing = add_listing(db, host)
    db.commit()

    created = _create(client, guest.id, "Weekend", listing.id)
    wishlist_id = created.json()["id"]
    renamed = client.patch(
        f"/api/wishlists/{wishlist_id}",
        json={"name": "  Goa  "},
        headers=_auth(guest.id),
    )
    assert renamed.status_code == 200
    assert renamed.json()["name"] == "Goa"
    assert renamed.json()["listing_ids"] == [listing.id]

    deleted = client.delete(f"/api/wishlists/{wishlist_id}", headers=_auth(guest.id))
    assert deleted.status_code == 204
    assert client.get("/api/wishlists", headers=_auth(guest.id)).json() == []
    assert client.get("/api/wishlists/saved-ids", headers=_auth(guest.id)).json() == {"listing_ids": []}
    assert client.get(f"/api/wishlists/{wishlist_id}", headers=_auth(guest.id)).status_code == 404


def test_duplicate_name_is_conflict(api):
    client, db = api
    guest = add_user(db, "guest@example.com")
    db.commit()

    assert _create(client, guest.id, "Favourites").status_code == 201
    duplicate = _create(client, guest.id, "Favourites")
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"] == "You already have a wishlist with that name"

    wishlist_id = client.get("/api/wishlists", headers=_auth(guest.id)).json()[0]["id"]
    renamed = client.patch(
        f"/api/wishlists/{wishlist_id}",
        json={"name": "Favourites"},
        headers=_auth(guest.id),
    )
    assert renamed.status_code == 200
    clash = _create(client, guest.id, "Weekend")
    assert clash.status_code == 201
    taken = client.patch(
        f"/api/wishlists/{clash.json()['id']}",
        json={"name": "Favourites"},
        headers=_auth(guest.id),
    )
    assert taken.status_code == 409


def test_invalid_name_is_rejected(api):
    client, db = api
    guest = add_user(db, "guest@example.com")
    db.commit()

    assert _create(client, guest.id, "   ").status_code == 422
    assert _create(client, guest.id, "x" * 51).status_code == 422
    assert _create(client, guest.id, "x" * 50).status_code == 201


def test_missing_or_inactive_listing_does_not_create(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    guest = add_user(db, "guest@example.com")
    listing = add_listing(db, host)
    listing.is_active = False
    db.commit()

    missing = _create(client, guest.id, "Missing", 999)
    inactive = _create(client, guest.id, "Hidden", listing.id)
    assert missing.status_code == 404
    assert inactive.status_code == 404
    assert client.get("/api/wishlists", headers=_auth(guest.id)).json() == []

    created = _create(client, guest.id, "Weekend")
    assert (
        client.post(
            f"/api/wishlists/{created.json()['id']}/items/{listing.id}",
            headers=_auth(guest.id),
        ).status_code
        == 404
    )


def test_other_user_is_forbidden(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    owner = add_user(db, "owner@example.com")
    other = add_user(db, "other@example.com")
    listing = add_listing(db, host)
    db.commit()

    wishlist_id = _create(client, owner.id, "Favourites", listing.id).json()["id"]
    headers = _auth(other.id)
    assert client.get(f"/api/wishlists/{wishlist_id}", headers=headers).status_code == 403
    assert client.patch(f"/api/wishlists/{wishlist_id}", json={"name": "Mine"}, headers=headers).status_code == 403
    assert client.delete(f"/api/wishlists/{wishlist_id}", headers=headers).status_code == 403
    assert client.post(f"/api/wishlists/{wishlist_id}/items/{listing.id}", headers=headers).status_code == 403
    assert client.delete(f"/api/wishlists/{wishlist_id}/items/{listing.id}", headers=headers).status_code == 403
    assert client.get("/api/wishlists", headers=_auth(owner.id)).json()[0]["name"] == "Favourites"


def test_missing_wishlist_is_404(api):
    client, db = api
    host = add_user(db, "host@example.com", host=True)
    guest = add_user(db, "guest@example.com")
    listing = add_listing(db, host)
    db.commit()

    headers = _auth(guest.id)
    assert client.get("/api/wishlists/999", headers=headers).status_code == 404
    assert client.patch("/api/wishlists/999", json={"name": "Nope"}, headers=headers).status_code == 404
    assert client.delete("/api/wishlists/999", headers=headers).status_code == 404
    assert client.post(f"/api/wishlists/999/items/{listing.id}", headers=headers).status_code == 404


def test_wishlists_require_auth(api):
    client, _db = api
    assert client.get("/api/wishlists").status_code == 401
    assert client.get("/api/wishlists/saved-ids").status_code == 401
