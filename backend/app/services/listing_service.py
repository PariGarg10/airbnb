from datetime import date, timedelta

from sqlalchemy import exists, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import BadRequestError, ConflictError, NotFoundError
from app.models import Amenity, Booking, Listing, User, Wishlist, WishlistItem
from app.models.amenity import listing_amenities
from app.models.booking import BLOCKING_STATUSES, overlap_condition
from app.models.enums import BookingStatus, PropertyType, RoomType
from app.schemas.common import Paginated
from app.schemas.listing import (
    AmenityOut,
    BookedRange,
    CategoryCount,
    CouponOut,
    DiscountOut,
    HostOut,
    ListingCard,
    ListingDetail,
    ListingImageOut,
    NightlyBreakdownOut,
    StayQuote,
)
from app.services.booking_expiry import expire_stale_pending
from app.services.coupon_service import require_coupon
from app.services.listing_location import public_coordinates
from app.services.listing_pricing import quote_listing_stay
MAX_NIGHTS = 30
CATALOG_CATEGORIES = frozenset({"Experiences", "Services"})


class ListingSearch:
    def __init__(
        self,
        *,
        location: str | None = None,
        check_in: date | None = None,
        check_out: date | None = None,
        guests: int | None = None,
        min_price: int | None = None,
        max_price: int | None = None,
        property_types: list[PropertyType] | None = None,
        room_type: RoomType | None = None,
        amenity_ids: list[int] | None = None,
        category: str | None = None,
        min_bedrooms: int | None = None,
        min_beds: int | None = None,
        min_bathrooms: float | None = None,
        min_rating: float | None = None,
        instant_book: bool | None = None,
        allows_pets: bool | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> None:
        self.location = location
        self.check_in = check_in
        self.check_out = check_out
        self.guests = guests
        self.min_price = min_price
        self.max_price = max_price
        self.property_types = property_types
        self.room_type = room_type
        self.amenity_ids = amenity_ids
        self.category = category
        self.min_bedrooms = min_bedrooms
        self.min_beds = min_beds
        self.min_bathrooms = min_bathrooms
        self.min_rating = min_rating
        self.instant_book = instant_book
        self.allows_pets = allows_pets
        self.page = page
        self.page_size = page_size


def search_listings(db: Session, filters: ListingSearch, user: User | None) -> Paginated[ListingCard]:
    if filters.check_in is not None and filters.check_out is not None:
        expire_stale_pending(db, commit=True)
    stmt = select(Listing).where(Listing.is_active.is_(True))
    stmt = _apply_filters(stmt, filters)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = list(
        db.scalars(
            stmt.options(selectinload(Listing.images), selectinload(Listing.host))
            .order_by(Listing.created_at.desc(), Listing.id.desc())
            .offset((filters.page - 1) * filters.page_size)
            .limit(filters.page_size)
        )
    )
    wishlisted = _wishlisted_ids(db, user, [row.id for row in rows])
    return Paginated(
        items=[
            _to_card(row, wishlisted, db=db, check_in=filters.check_in, check_out=filters.check_out) for row in rows
        ],
        total=total,
        page=filters.page,
        page_size=filters.page_size,
        has_more=filters.page * filters.page_size < total,
    )


def get_listing(db: Session, listing_id: int, user: User | None) -> ListingDetail:
    listing = db.scalar(
        select(Listing)
        .where(Listing.id == listing_id)
        .options(
            selectinload(Listing.images),
            selectinload(Listing.amenities),
            selectinload(Listing.host),
            selectinload(Listing.occupants),
        )
    )
    if listing is None or (not listing.is_active and (user is None or user.id != listing.host_id)):
        raise NotFoundError("Listing not found")
    return listing_detail(db, listing, user)


def listing_detail(db: Session, listing: Listing, user: User | None) -> ListingDetail:
    listing_count = db.scalar(
        select(func.count())
        .select_from(Listing)
        .where(Listing.host_id == listing.host_id, Listing.is_active.is_(True))
    ) or 0
    wishlisted = _wishlisted_ids(db, user, [listing.id])
    images = sorted(listing.images, key=lambda image: image.position)
    amenities = sorted(listing.amenities, key=lambda amenity: (amenity.group_name, amenity.name))
    lat, lng, approximate = public_coordinates(listing)
    occupants = sorted((row.occupant_type for row in listing.occupants), key=lambda value: value.value)
    return ListingDetail(
        id=listing.id,
        title=listing.title,
        description=listing.description,
        property_type=listing.property_type,
        room_type=listing.room_type,
        category=listing.category,
        address=listing.address,
        city=listing.city,
        state=listing.state,
        country=listing.country,
        lat=lat,
        lng=lng,
        location_is_approximate=approximate,
        price_per_night=listing.price_per_night,
        cleaning_fee=listing.cleaning_fee,
        max_guests=listing.max_guests,
        bedrooms=listing.bedrooms,
        beds=listing.beds,
        bathrooms=listing.bathrooms,
        private_bathrooms=listing.private_bathrooms,
        dedicated_bathrooms=listing.dedicated_bathrooms,
        shared_bathrooms=listing.shared_bathrooms,
        avg_rating=listing.avg_rating,
        review_count=listing.review_count,
        booking_mode=listing.booking_mode,
        instant_book=listing.instant_book,
        show_precise_location=listing.show_precise_location,
        bedrooms_have_locks=listing.bedrooms_have_locks,
        weekend_adjustment_pct=listing.weekend_adjustment_pct,
        discount_new_listing_pct=listing.discount_new_listing_pct,
        discount_last_minute_pct=listing.discount_last_minute_pct,
        discount_weekly_pct=listing.discount_weekly_pct,
        discount_monthly_pct=listing.discount_monthly_pct,
        has_exterior_camera=listing.has_exterior_camera,
        has_noise_monitor=listing.has_noise_monitor,
        has_weapons=listing.has_weapons,
        allows_pets=listing.allows_pets,
        occupants=occupants,
        images=[ListingImageOut.model_validate(image) for image in images],
        amenities=[AmenityOut.model_validate(amenity) for amenity in amenities],
        host=HostOut(
            id=listing.host.id,
            name=listing.host.name,
            avatar_url=listing.host.avatar_url,
            is_superhost=listing.host.is_superhost,
            bio=listing.host.bio,
            joined_year=listing.host.created_at.year,
            listing_count=listing_count,
        ),
        is_wishlisted=listing.id in wishlisted,
    )


def booked_dates(db: Session, listing_id: int) -> list[BookedRange]:
    _require_active(db, listing_id)
    expire_stale_pending(db, listing_id=listing_id, commit=True)
    rows = db.scalars(
        select(Booking)
        .where(
            Booking.listing_id == listing_id,
            Booking.status.in_(BLOCKING_STATUSES),
            Booking.check_out >= date.today(),
        )
        .order_by(Booking.check_in)
    )
    return [BookedRange(check_in=row.check_in, check_out=row.check_out) for row in rows]


def validate_stay(listing: Listing, check_in: date, check_out: date, guests: int) -> int:
    if check_in < date.today():
        raise BadRequestError("check_in must be today or later")
    if check_out <= check_in:
        raise BadRequestError("check_out must be after check_in")
    nights = (check_out - check_in).days
    if nights > MAX_NIGHTS:
        raise BadRequestError("A stay cannot be longer than 30 nights")
    if guests < 1 or guests > listing.max_guests:
        raise BadRequestError("Guest count is not valid for this listing")
    return nights


def has_date_conflict(db: Session, listing_id: int, check_in: date, check_out: date) -> bool:
    conflict = db.scalar(
        select(func.count()).select_from(Booking).where(overlap_condition(listing_id, check_in, check_out))
    )
    return bool(conflict)


def quote_stay(
    db: Session,
    listing_id: int,
    check_in: date,
    check_out: date,
    guests: int,
    coupon: str | None = None,
) -> StayQuote:
    listing = _require_active(db, listing_id)
    validate_stay(listing, check_in, check_out, guests)
    expire_stale_pending(db, listing_id=listing.id, commit=True)
    if has_date_conflict(db, listing.id, check_in, check_out):
        raise ConflictError("These dates are already booked")
    coupon_code, coupon_percent = _coupon_args(db, coupon)
    priced = quote_listing_stay(
        db,
        listing,
        check_in,
        check_out,
        coupon_code=coupon_code,
        coupon_percent=coupon_percent,
    )
    rare = _is_rare_find(db, listing.id, date.today())
    return _stay_quote(priced, is_rare_find=rare)


def _is_rare_find(db: Session, listing_id: int, today: date) -> bool:
    window_end = today + timedelta(days=30)
    count = int(
        db.scalar(
            select(func.count())
            .select_from(Booking)
            .where(
                Booking.listing_id == listing_id,
                Booking.status == BookingStatus.confirmed,
                Booking.check_in >= today,
                Booking.check_in < window_end,
            )
        )
        or 0
    )
    return count >= 3


def _coupon_args(db: Session, coupon: str | None) -> tuple[str | None, int | None]:
    if coupon is None or not coupon.strip():
        return None, None
    row = require_coupon(db, coupon)
    return row.code, row.percent_off


def _stay_quote(priced, *, is_rare_find: bool = False) -> StayQuote:
    discount = None
    if priced.discount is not None:
        discount = DiscountOut(
            type=priced.discount.type.value,
            pct=priced.discount.pct,
            amount=priced.discount.amount,
            reason_text=priced.discount.reason_text,
        )
    coupon = None
    if priced.coupon is not None:
        coupon = CouponOut(code=priced.coupon.code, amount=priced.coupon.amount)
    return StayQuote(
        nights=priced.nights,
        nightly_rate=priced.nightly_rate,
        nightly_breakdown=NightlyBreakdownOut(
            weekday_nights=priced.nightly_breakdown.weekday_nights,
            weekend_nights=priced.nightly_breakdown.weekend_nights,
            weekday_rate=priced.nightly_breakdown.weekday_rate,
            weekend_rate=priced.nightly_breakdown.weekend_rate,
            weekday_subtotal=priced.nightly_breakdown.weekday_subtotal,
            weekend_subtotal=priced.nightly_breakdown.weekend_subtotal,
        ),
        nights_total_original=priced.nights_total_original,
        nights_total=priced.nights_total,
        discount=discount,
        coupon=coupon,
        cleaning_fee=priced.cleaning_fee,
        service_fee=priced.service_fee,
        taxes=priced.taxes,
        total=priced.total,
        original_total=priced.original_total,
        total_original=priced.original_total,
        is_rare_find=is_rare_find,
    )


def list_amenities(db: Session) -> list[Amenity]:
    return list(db.scalars(select(Amenity).order_by(Amenity.group_name, Amenity.name, Amenity.id)))


def list_categories(db: Session) -> list[CategoryCount]:
    rows = db.execute(
        select(Listing.category, func.count(Listing.id))
        .where(Listing.is_active.is_(True))
        .group_by(Listing.category)
        .order_by(Listing.category)
    ).all()
    return [CategoryCount(category=category, listing_count=count) for category, count in rows]


def _apply_filters(stmt, filters: ListingSearch):
    if filters.guests is not None:
        if filters.guests < 1:
            raise BadRequestError("guests must be at least 1")
        stmt = stmt.where(Listing.max_guests >= filters.guests)
    if filters.min_price is not None:
        stmt = stmt.where(Listing.price_per_night >= filters.min_price)
    if filters.max_price is not None:
        stmt = stmt.where(Listing.price_per_night <= filters.max_price)
    if (
        filters.min_price is not None
        and filters.max_price is not None
        and filters.min_price > filters.max_price
    ):
        raise BadRequestError("min_price cannot be greater than max_price")
    if filters.property_types:
        stmt = stmt.where(Listing.property_type.in_(filters.property_types))
    if filters.room_type is not None:
        stmt = stmt.where(Listing.room_type == filters.room_type)
    if filters.category:
        stmt = stmt.where(Listing.category == filters.category)
    else:
        stmt = stmt.where(Listing.category.not_in(CATALOG_CATEGORIES))
    if filters.min_bedrooms is not None:
        stmt = stmt.where(Listing.bedrooms >= filters.min_bedrooms)
    if filters.min_beds is not None:
        stmt = stmt.where(Listing.beds >= filters.min_beds)
    if filters.min_bathrooms is not None:
        stmt = stmt.where(Listing.bathrooms >= filters.min_bathrooms)
    if filters.instant_book is True:
        stmt = stmt.where(Listing.instant_book.is_(True))
    if filters.allows_pets is True:
        stmt = stmt.where(Listing.allows_pets.is_(True))
    if filters.min_rating is not None:
        stmt = stmt.where(Listing.avg_rating >= filters.min_rating, Listing.review_count >= 3)
    if filters.location and filters.location.strip():
        term = f"%{filters.location.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Listing.city).like(term),
                func.lower(Listing.state).like(term),
                func.lower(Listing.country).like(term),
                func.lower(Listing.title).like(term),
            )
        )
    if filters.amenity_ids:
        wanted = list(dict.fromkeys(filters.amenity_ids))
        match_ids = (
            select(listing_amenities.c.listing_id)
            .where(listing_amenities.c.amenity_id.in_(wanted))
            .group_by(listing_amenities.c.listing_id)
            .having(func.count(listing_amenities.c.amenity_id) == len(wanted))
        )
        stmt = stmt.where(Listing.id.in_(match_ids))
    if filters.check_in is not None and filters.check_out is not None:
        if filters.check_out <= filters.check_in:
            raise BadRequestError("check_out must be after check_in")
        booked = exists(
            select(Booking.id).where(overlap_condition(Listing.id, filters.check_in, filters.check_out))
        )
        stmt = stmt.where(~booked)
    return stmt


def _require_active(db: Session, listing_id: int) -> Listing:
    listing = db.scalar(select(Listing).where(Listing.id == listing_id, Listing.is_active.is_(True)))
    if listing is None:
        raise NotFoundError("Listing not found")
    return listing


def cards_for(db: Session, listings: list[Listing], user: User | None) -> list[ListingCard]:
    wishlisted = _wishlisted_ids(db, user, [row.id for row in listings])
    return [_to_card(row, wishlisted) for row in listings]


def _wishlisted_ids(db: Session, user: User | None, listing_ids: list[int]) -> set[int]:
    if user is None or not listing_ids:
        return set()
    rows = db.scalars(
        select(WishlistItem.listing_id)
        .join(Wishlist, Wishlist.id == WishlistItem.wishlist_id)
        .where(
            Wishlist.user_id == user.id,
            WishlistItem.listing_id.in_(listing_ids),
        )
        .distinct()
    )
    return set(rows)


def _to_card(
    listing: Listing,
    wishlisted: set[int],
    *,
    db: Session | None = None,
    check_in: date | None = None,
    check_out: date | None = None,
) -> ListingCard:
    images = sorted(listing.images, key=lambda image: image.position)
    cover = images[0].url if images else None
    nights = None
    stay_total = None
    stay_original_total = None
    if (
        db is not None
        and check_in is not None
        and check_out is not None
        and check_out > check_in
    ):
        priced = quote_listing_stay(db, listing, check_in, check_out)
        nights = priced.nights
        stay_total = priced.total
        if priced.original_total > priced.total:
            stay_original_total = priced.original_total
    return ListingCard(
        id=listing.id,
        title=listing.title,
        city=listing.city,
        country=listing.country,
        property_type=listing.property_type,
        room_type=listing.room_type,
        price_per_night=listing.price_per_night,
        avg_rating=listing.avg_rating,
        review_count=listing.review_count,
        images=[cover] if cover else [],
        lat=listing.lat,
        lng=listing.lng,
        host_is_superhost=listing.host.is_superhost,
        is_wishlisted=listing.id in wishlisted,
        bedrooms=listing.bedrooms,
        beds=listing.beds,
        nights=nights,
        stay_total=stay_total,
        stay_original_total=stay_original_total,
    )
