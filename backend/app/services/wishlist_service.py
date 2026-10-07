"""Wishlists and the listings saved on them.

`is_wishlisted` on a card means the listing is on any of the caller's lists.
Cover images are the primary photo of up to four active listings, newest save
first.
"""

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.models import Listing, User, Wishlist, WishlistItem
from app.schemas.listing import ListingCard
from app.schemas.wishlist import SavedIds, WishlistSummary
from app.services.listing_service import cards_for

_COVERS = 4


def list_wishlists(db: Session, user: User) -> list[WishlistSummary]:
    return _summaries(db, user)


def saved_ids(db: Session, user: User) -> SavedIds:
    rows = db.scalars(
        select(WishlistItem.listing_id)
        .join(Wishlist, Wishlist.id == WishlistItem.wishlist_id)
        .where(Wishlist.user_id == user.id)
        .distinct()
        .order_by(WishlistItem.listing_id)
    )
    return SavedIds(listing_ids=list(rows))


def create_wishlist(db: Session, user: User, name: str, listing_id: int | None) -> WishlistSummary:
    if listing_id is not None:
        _require_active_listing(db, listing_id)
    wishlist = Wishlist(user_id=user.id, name=name)
    db.add(wishlist)
    try:
        db.flush()
    except IntegrityError as exc:
        db.rollback()
        _raise_name_conflict(exc)
    if listing_id is not None:
        db.add(WishlistItem(wishlist_id=wishlist.id, listing_id=listing_id))
    db.commit()
    return _summaries(db, user, [wishlist.id])[0]


def get_wishlist(db: Session, user: User, wishlist_id: int) -> list[ListingCard]:
    wishlist = _require_owned(db, user, wishlist_id)
    listings = list(
        db.scalars(
            select(Listing)
            .join(WishlistItem, WishlistItem.listing_id == Listing.id)
            .where(WishlistItem.wishlist_id == wishlist.id, Listing.is_active.is_(True))
            .options(selectinload(Listing.images), selectinload(Listing.host))
            .order_by(WishlistItem.created_at.desc(), Listing.id.desc())
        )
    )
    return cards_for(db, listings, user)


def rename_wishlist(db: Session, user: User, wishlist_id: int, name: str) -> WishlistSummary:
    wishlist = _require_owned(db, user, wishlist_id)
    wishlist.name = name
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        _raise_name_conflict(exc)
    return _summaries(db, user, [wishlist_id])[0]


def delete_wishlist(db: Session, user: User, wishlist_id: int) -> None:
    wishlist = _require_owned(db, user, wishlist_id)
    db.delete(wishlist)
    db.commit()


def add_item(db: Session, user: User, wishlist_id: int, listing_id: int) -> None:
    wishlist = _require_owned(db, user, wishlist_id)
    _require_active_listing(db, listing_id)
    if db.get(WishlistItem, (wishlist.id, listing_id)) is not None:
        return
    db.add(WishlistItem(wishlist_id=wishlist.id, listing_id=listing_id))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()


def remove_item(db: Session, user: User, wishlist_id: int, listing_id: int) -> None:
    wishlist = _require_owned(db, user, wishlist_id)
    if db.get(Listing, listing_id) is None:
        raise NotFoundError("Listing not found")
    existing = db.get(WishlistItem, (wishlist.id, listing_id))
    if existing is None:
        return
    db.delete(existing)
    db.commit()


def _summaries(db: Session, user: User, wishlist_ids: list[int] | None = None) -> list[WishlistSummary]:
    stmt = select(Wishlist).where(Wishlist.user_id == user.id)
    if wishlist_ids is not None:
        stmt = stmt.where(Wishlist.id.in_(wishlist_ids))
    wishlists = list(db.scalars(stmt.order_by(Wishlist.created_at.desc(), Wishlist.id.desc())))
    if not wishlists:
        return []
    ids = [wishlist.id for wishlist in wishlists]
    items = list(
        db.scalars(
            select(WishlistItem)
            .where(WishlistItem.wishlist_id.in_(ids))
            .options(selectinload(WishlistItem.listing).selectinload(Listing.images))
            .order_by(WishlistItem.created_at.desc(), WishlistItem.listing_id.desc())
        )
    )
    grouped: dict[int, list[WishlistItem]] = {wishlist_id: [] for wishlist_id in ids}
    for item in items:
        grouped[item.wishlist_id].append(item)
    return [_to_summary(wishlist, grouped[wishlist.id]) for wishlist in wishlists]


def _to_summary(wishlist: Wishlist, items: list[WishlistItem]) -> WishlistSummary:
    active = [item for item in items if item.listing is not None and item.listing.is_active]
    covers: list[str] = []
    for item in active:
        if len(covers) >= _COVERS:
            break
        images = sorted(item.listing.images, key=lambda image: image.position)
        if images:
            covers.append(images[0].url)
    return WishlistSummary(
        id=wishlist.id,
        name=wishlist.name,
        count=len(active),
        cover_images=covers,
        listing_ids=[item.listing_id for item in active],
    )


def _require_owned(db: Session, user: User, wishlist_id: int) -> Wishlist:
    wishlist = db.get(Wishlist, wishlist_id)
    if wishlist is None:
        raise NotFoundError("Wishlist not found")
    if wishlist.user_id != user.id:
        raise ForbiddenError("You do not own this wishlist")
    return wishlist


def _require_active_listing(db: Session, listing_id: int) -> Listing:
    listing = db.get(Listing, listing_id)
    if listing is None or not listing.is_active:
        raise NotFoundError("Listing not found")
    return listing


def _raise_name_conflict(exc: IntegrityError) -> None:
    if "unique" in str(exc.orig).lower():
        raise ConflictError("You already have a wishlist with that name") from exc
    raise exc
