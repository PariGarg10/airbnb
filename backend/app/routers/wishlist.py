from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas.listing import ListingCard
from app.schemas.wishlist import SavedIds, WishlistCreate, WishlistSummary, WishlistWrite
from app.services import wishlist_service

router = APIRouter(prefix="/api/wishlists", tags=["wishlists"])


@router.get("", response_model=list[WishlistSummary])
def list_wishlists(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[WishlistSummary]:
    return wishlist_service.list_wishlists(db, user)


@router.post("", response_model=WishlistSummary, status_code=201)
def create_wishlist(
    body: WishlistCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> WishlistSummary:
    return wishlist_service.create_wishlist(db, user, body.name, body.listing_id)


@router.get("/saved-ids", response_model=SavedIds)
def saved_ids(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SavedIds:
    return wishlist_service.saved_ids(db, user)


@router.get("/{wishlist_id}", response_model=list[ListingCard])
def wishlist_items(
    wishlist_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[ListingCard]:
    return wishlist_service.get_wishlist(db, user, wishlist_id)


@router.patch("/{wishlist_id}", response_model=WishlistSummary)
def rename_wishlist(
    wishlist_id: int,
    body: WishlistWrite,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> WishlistSummary:
    return wishlist_service.rename_wishlist(db, user, wishlist_id, body.name)


@router.delete("/{wishlist_id}", status_code=204)
def delete_wishlist(
    wishlist_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    wishlist_service.delete_wishlist(db, user, wishlist_id)
    return Response(status_code=204)


@router.post("/{wishlist_id}/items/{listing_id}", status_code=204)
def add_item(
    wishlist_id: int,
    listing_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    wishlist_service.add_item(db, user, wishlist_id, listing_id)
    return Response(status_code=204)


@router.delete("/{wishlist_id}/items/{listing_id}", status_code=204)
def remove_item(
    wishlist_id: int,
    listing_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    wishlist_service.remove_item(db, user, wishlist_id, listing_id)
    return Response(status_code=204)
