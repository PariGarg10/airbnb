from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from app.services.booking_expiry import expire_stale_pending
from app.models import Amenity, Booking, HostProfile, Listing, ListingImage, ListingOccupant, User
from app.models.enums import BookingMode, BookingStatus
from app.schemas.host import (
    HostBookingOut,
    HostBookingGuest,
    HostBookingListing,
    HostBookingStatus,
    HostListingOut,
    HostProfileOut,
    HostProfileUpdate,
    HostStats,
    ListingCreate,
)
from app.schemas.listing import ListingDetail
from app.services.listing_service import listing_detail


def list_listings(db: Session, host: User) -> list[HostListingOut]:
    listings = list(
        db.scalars(
            select(Listing)
            .where(Listing.host_id == host.id)
            .options(selectinload(Listing.images))
            .order_by(Listing.created_at.desc(), Listing.id.desc())
        )
    )
    totals, upcoming = _booking_counts(db, [row.id for row in listings])
    return [
        HostListingOut(
            id=listing.id,
            title=listing.title,
            city=listing.city,
            country=listing.country,
            cover_image=_cover(listing),
            price=listing.price_per_night,
            avg_rating=listing.avg_rating,
            is_active=listing.is_active,
            total_bookings=totals.get(listing.id, 0),
            upcoming_bookings=upcoming.get(listing.id, 0),
        )
        for listing in listings
    ]


def get_profile(db: Session, host: User) -> HostProfileOut:
    profile = db.scalar(select(HostProfile).where(HostProfile.user_id == host.id))
    if profile is None:
        raise NotFoundError("Host profile not found")
    return HostProfileOut.model_validate(profile)


def upsert_profile(db: Session, host: User, body: HostProfileUpdate) -> HostProfileOut:
    profile = db.scalar(select(HostProfile).where(HostProfile.user_id == host.id))
    if profile is None:
        profile = HostProfile(user_id=host.id)
        db.add(profile)
    profile.country = body.country
    profile.flat = body.flat
    profile.street = body.street
    profile.landmark = body.landmark
    profile.district = body.district
    profile.city = body.city
    profile.state = body.state
    profile.pin_code = body.pin_code
    profile.is_business = body.is_business
    db.commit()
    db.refresh(profile)
    return HostProfileOut.model_validate(profile)


def create_listing(db: Session, host: User, body: ListingCreate) -> ListingDetail:
    _require_profile_to_publish(db, host)
    listing = Listing(host_id=host.id, is_active=True, avg_rating=0, review_count=0)
    _apply_fields(db, listing, body)
    db.add(listing)
    db.commit()
    return listing_detail(db, _reload(db, listing.id), host)


def update_listing(db: Session, host: User, listing_id: int, body: ListingCreate) -> ListingDetail:
    listing = _owned(db, host, listing_id)
    _apply_fields(db, listing, body)
    db.commit()
    return listing_detail(db, _reload(db, listing.id), host)


def delete_listing(db: Session, host: User, listing_id: int) -> str:
    listing = _owned(db, host, listing_id)
    booking_count = db.scalar(
        select(func.count()).select_from(Booking).where(Booking.listing_id == listing.id)
    ) or 0
    if booking_count:
        listing.is_active = False
        db.commit()
        return "soft"
    db.delete(listing)
    db.commit()
    return "hard"


def set_status(db: Session, host: User, listing_id: int, is_active: bool) -> HostListingOut:
    listing = _owned(db, host, listing_id)
    if is_active and not listing.is_active:
        _require_profile_to_publish(db, host)
    listing.is_active = is_active
    db.commit()
    totals, upcoming = _booking_counts(db, [listing.id])
    return HostListingOut(
        id=listing.id,
        title=listing.title,
        city=listing.city,
        country=listing.country,
        cover_image=_cover(listing),
        price=listing.price_per_night,
        avg_rating=listing.avg_rating,
        is_active=listing.is_active,
        total_bookings=totals.get(listing.id, 0),
        upcoming_bookings=upcoming.get(listing.id, 0),
    )


def list_bookings(db: Session, host: User, status: HostBookingStatus) -> list[HostBookingOut]:
    expire_stale_pending(db, commit=True)
    today = date.today()
    stmt = (
        select(Booking)
        .join(Listing, Booking.listing_id == Listing.id)
        .where(Listing.host_id == host.id)
        .options(
            selectinload(Booking.guest),
            selectinload(Booking.listing).selectinload(Listing.images),
        )
    )
    if status is HostBookingStatus.upcoming:
        stmt = stmt.where(Booking.status == BookingStatus.confirmed, Booking.check_in > today)
        stmt = stmt.order_by(Booking.check_in)
    elif status is HostBookingStatus.current:
        stmt = stmt.where(
            Booking.status == BookingStatus.confirmed,
            Booking.check_in <= today,
            Booking.check_out > today,
        )
        stmt = stmt.order_by(Booking.check_in)
    elif status is HostBookingStatus.completed:
        stmt = stmt.where(Booking.status == BookingStatus.confirmed, Booking.check_out <= today)
        stmt = stmt.order_by(Booking.check_out.desc())
    elif status is HostBookingStatus.pending:
        stmt = stmt.where(Booking.status == BookingStatus.pending)
        stmt = stmt.order_by(Booking.check_in, Booking.id)
    else:
        stmt = stmt.where(
            Booking.status.in_(
                (BookingStatus.cancelled, BookingStatus.declined, BookingStatus.expired)
            )
        )
        stmt = stmt.order_by(Booking.check_in.desc())
    return [_booking_out(row) for row in db.scalars(stmt)]


def stats(db: Session, host: User) -> HostStats:
    today = date.today()
    month_start, month_end = _month_bounds(today)
    total_listings = db.scalar(
        select(func.count()).select_from(Listing).where(Listing.host_id == host.id)
    ) or 0
    active_listings = db.scalar(
        select(func.count())
        .select_from(Listing)
        .where(Listing.host_id == host.id, Listing.is_active.is_(True))
    ) or 0
    upcoming_bookings = db.scalar(
        select(func.count())
        .select_from(Booking)
        .join(Listing, Booking.listing_id == Listing.id)
        .where(
            Listing.host_id == host.id,
            Booking.status == BookingStatus.confirmed,
            Booking.check_in > today,
        )
    ) or 0
    earnings = db.scalar(
        select(func.coalesce(func.sum(Booking.total_price), 0))
        .join(Listing, Booking.listing_id == Listing.id)
        .where(
            Listing.host_id == host.id,
            Booking.status == BookingStatus.confirmed,
            Booking.check_in >= month_start,
            Booking.check_in < month_end,
        )
    )
    return HostStats(
        total_listings=total_listings,
        active_listings=active_listings,
        upcoming_bookings=upcoming_bookings,
        earnings_this_month=int(earnings or 0),
    )


def _require_profile_to_publish(db: Session, host: User) -> None:
    active_count = db.scalar(
        select(func.count())
        .select_from(Listing)
        .where(Listing.host_id == host.id, Listing.is_active.is_(True))
    ) or 0
    if active_count > 0:
        return
    has_profile = db.scalar(select(func.count()).select_from(HostProfile).where(HostProfile.user_id == host.id))
    if not has_profile:
        raise ConflictError(
            "Complete your host profile (residential address) before publishing your first listing"
        )


def _apply_fields(db: Session, listing: Listing, body: ListingCreate) -> None:
    listing.title = body.title
    listing.description = body.description
    listing.property_type = body.property_type
    listing.room_type = body.room_type
    listing.category = body.category
    listing.address = body.address
    listing.city = body.city
    listing.state = body.state
    listing.country = body.country
    listing.lat = body.lat
    listing.lng = body.lng
    listing.price_per_night = body.price_per_night
    listing.cleaning_fee = body.cleaning_fee
    listing.max_guests = body.max_guests
    listing.bedrooms = body.bedrooms
    listing.beds = body.beds
    listing.private_bathrooms = body.private_bathrooms
    listing.dedicated_bathrooms = body.dedicated_bathrooms
    listing.shared_bathrooms = body.shared_bathrooms
    listing.bathrooms = body.private_bathrooms + body.dedicated_bathrooms + body.shared_bathrooms
    listing.booking_mode = body.booking_mode
    listing.instant_book = body.booking_mode == BookingMode.instant
    listing.show_precise_location = body.show_precise_location
    listing.bedrooms_have_locks = body.bedrooms_have_locks
    listing.weekend_adjustment_pct = body.weekend_adjustment_pct
    listing.discount_new_listing_pct = body.discount_new_listing_pct
    listing.discount_last_minute_pct = body.discount_last_minute_pct
    listing.discount_weekly_pct = body.discount_weekly_pct
    listing.discount_monthly_pct = body.discount_monthly_pct
    listing.has_exterior_camera = body.has_exterior_camera
    listing.has_noise_monitor = body.has_noise_monitor
    listing.has_weapons = body.has_weapons
    listing.allows_pets = body.allows_pets
    _replace_amenities(db, listing, body.amenity_ids)
    _replace_images(db, listing, body.images)
    _replace_occupants(db, listing, body.occupants)


def _amenities(db: Session, amenity_ids: list[int]) -> list[Amenity]:
    unique_ids = list(dict.fromkeys(amenity_ids))
    if not unique_ids:
        return []
    rows = list(db.scalars(select(Amenity).where(Amenity.id.in_(unique_ids))))
    if len(rows) != len(unique_ids):
        raise BadRequestError("One or more amenities are invalid")
    by_id = {row.id: row for row in rows}
    return [by_id[amenity_id] for amenity_id in unique_ids]


def _replace_amenities(db: Session, listing: Listing, amenity_ids: list[int]) -> None:
    listing.amenities.clear()
    db.flush()
    listing.amenities.extend(_amenities(db, amenity_ids))


def _replace_images(db: Session, listing: Listing, images: list) -> None:
    listing.images.clear()
    db.flush()
    for position, image in enumerate(images):
        listing.images.append(
            ListingImage(url=str(image.url), caption=image.caption, position=position)
        )


def _replace_occupants(db: Session, listing: Listing, occupants: list) -> None:
    listing.occupants.clear()
    db.flush()
    for occupant_type in occupants:
        listing.occupants.append(ListingOccupant(occupant_type=occupant_type))


def _owned(db: Session, host: User, listing_id: int) -> Listing:
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
    if listing is None:
        raise NotFoundError("Listing not found")
    if listing.host_id != host.id:
        raise ForbiddenError("You do not own this listing")
    return listing


def _reload(db: Session, listing_id: int) -> Listing:
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
    if listing is None:
        raise NotFoundError("Listing not found")
    return listing


def _booking_counts(db: Session, listing_ids: list[int]) -> tuple[dict[int, int], dict[int, int]]:
    totals: dict[int, int] = {}
    upcoming: dict[int, int] = {}
    if not listing_ids:
        return totals, upcoming
    today = date.today()
    for listing_id, count in db.execute(
        select(Booking.listing_id, func.count(Booking.id))
        .where(Booking.listing_id.in_(listing_ids))
        .group_by(Booking.listing_id)
    ):
        totals[listing_id] = int(count)
    for listing_id, count in db.execute(
        select(Booking.listing_id, func.count(Booking.id))
        .where(
            Booking.listing_id.in_(listing_ids),
            Booking.status == BookingStatus.confirmed,
            Booking.check_in > today,
        )
        .group_by(Booking.listing_id)
    ):
        upcoming[listing_id] = int(count)
    return totals, upcoming


def _cover(listing: Listing) -> str | None:
    images = sorted(listing.images, key=lambda image: image.position)
    return images[0].url if images else None


def _booking_out(booking: Booking) -> HostBookingOut:
    return HostBookingOut(
        id=booking.id,
        guest=HostBookingGuest(name=booking.guest.name, avatar_url=booking.guest.avatar_url),
        listing=HostBookingListing(
            id=booking.listing.id,
            title=booking.listing.title,
            cover_image=_cover(booking.listing),
        ),
        check_in=booking.check_in,
        check_out=booking.check_out,
        guests=booking.num_guests,
        total_price=booking.total_price,
        status=booking.status,
        message_to_host=booking.message_to_host,
        created_at=booking.created_at,
    )


def _month_bounds(today: date) -> tuple[date, date]:
    start = today.replace(day=1)
    if today.month == 12:
        end = date(today.year + 1, 1, 1)
    else:
        end = date(today.year, today.month + 1, 1)
    return start, end

