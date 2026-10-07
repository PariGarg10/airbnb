from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestError
from app.db import get_db
from app.deps import get_optional_user
from app.models import User
from app.models.enums import PropertyType, RoomType
from app.schemas.common import Paginated
from app.schemas.listing import AmenityOut, BookedRange, CategoryCount, ListingCard, ListingDetail, StayQuote
from app.schemas.review import ReviewPage
from app.services import review_service
from app.services.listing_service import ListingSearch, booked_dates, get_listing, list_amenities, list_categories, quote_stay, search_listings

router = APIRouter(prefix="/api", tags=["listings"])


@router.get("/listings", response_model=Paginated[ListingCard])
def search(
    location: str | None = None,
    check_in: date | None = None,
    check_out: date | None = None,
    guests: int | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    property_types: str | None = None,
    room_type: RoomType | None = None,
    amenities: str | None = None,
    category: str | None = None,
    min_bedrooms: int | None = None,
    min_beds: int | None = Query(default=None, ge=1),
    min_bathrooms: float | None = Query(default=None, ge=0),
    instant_book: bool | None = None,
    allows_pets: bool | None = None,
    min_rating: float | None = Query(default=None, ge=0, le=5),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> Paginated[ListingCard]:
    filters = ListingSearch(
        location=location,
        check_in=check_in,
        check_out=check_out,
        guests=guests,
        min_price=min_price,
        max_price=max_price,
        property_types=_property_types(property_types),
        room_type=room_type,
        amenity_ids=_amenity_ids(amenities),
        category=category,
        min_bedrooms=min_bedrooms,
        min_beds=min_beds,
        min_bathrooms=min_bathrooms,
        instant_book=instant_book,
        allows_pets=allows_pets,
        min_rating=min_rating,
        page=page,
        page_size=page_size,
    )
    return search_listings(db, filters, user)


@router.get("/listings/{listing_id}", response_model=ListingDetail)
def listing_detail(
    listing_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> ListingDetail:
    return get_listing(db, listing_id, user)


@router.get("/listings/{listing_id}/booked-dates", response_model=list[BookedRange])
def listing_booked_dates(listing_id: int, db: Session = Depends(get_db)) -> list[BookedRange]:
    return booked_dates(db, listing_id)


@router.get("/listings/{listing_id}/reviews", response_model=ReviewPage)
def listing_reviews(
    listing_id: int,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=6, ge=1, le=50),
    db: Session = Depends(get_db),
) -> ReviewPage:
    return review_service.list_reviews(db, listing_id, page, page_size)


@router.get("/listings/{listing_id}/quote", response_model=StayQuote)
def listing_quote(
    listing_id: int,
    check_in: date,
    check_out: date,
    guests: int,
    coupon: str | None = None,
    db: Session = Depends(get_db),
) -> StayQuote:
    return quote_stay(db, listing_id, check_in, check_out, guests, coupon)


@router.get("/amenities", response_model=list[AmenityOut])
def amenities(db: Session = Depends(get_db)) -> list[AmenityOut]:
    return [AmenityOut.model_validate(row) for row in list_amenities(db)]


@router.get("/categories", response_model=list[CategoryCount])
def categories(db: Session = Depends(get_db)) -> list[CategoryCount]:
    return list_categories(db)


def _amenity_ids(raw: str | None) -> list[int] | None:
    if raw is None or not raw.strip():
        return None
    ids: list[int] = []
    for part in raw.split(","):
        piece = part.strip()
        if not piece:
            continue
        try:
            value = int(piece)
        except ValueError as exc:
            raise BadRequestError("amenities must be comma-separated ids") from exc
        if value < 1:
            raise BadRequestError("amenities must be comma-separated ids")
        ids.append(value)
    return ids or None


def _property_types(raw: str | None) -> list[PropertyType] | None:
    if raw is None or not raw.strip():
        return None
    parsed: list[PropertyType] = []
    for part in raw.split(","):
        piece = part.strip()
        if not piece:
            continue
        try:
            parsed.append(PropertyType(piece))
        except ValueError as exc:
            raise BadRequestError(f"Unknown property type: {piece}") from exc
    return parsed or None
