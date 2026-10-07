from datetime import date
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from app.models import Booking, Listing, Review, User
from app.models.enums import BookingStatus
from app.schemas.review import ReviewAuthor, ReviewOut, ReviewPage


def list_reviews(db: Session, listing_id: int, page: int, page_size: int) -> ReviewPage:
    listing = db.scalar(select(Listing.id).where(Listing.id == listing_id, Listing.is_active.is_(True)))
    if listing is None:
        raise NotFoundError("Listing not found")
    total = db.scalar(
        select(func.count()).select_from(Review).where(Review.listing_id == listing_id)
    ) or 0
    rows = list(
        db.scalars(
            select(Review)
            .where(Review.listing_id == listing_id)
            .options(selectinload(Review.author))
            .order_by(Review.created_at.desc(), Review.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    )
    return ReviewPage(
        items=[_review_out(row) for row in rows],
        total=total,
        page=page,
        page_size=page_size,
        has_more=page * page_size < total,
        rating_distribution=_distribution(db, listing_id),
    )


def create_review(db: Session, user: User, booking_id: int, rating: int, comment: str) -> ReviewOut:
    booking = db.scalar(
        select(Booking)
        .where(Booking.id == booking_id)
        .options(selectinload(Booking.review), selectinload(Booking.listing))
    )
    if booking is None:
        raise NotFoundError("Booking not found")
    if booking.guest_id != user.id:
        raise ForbiddenError("Only the guest can review this stay")
    if booking.status != BookingStatus.confirmed or booking.check_out > date.today():
        raise BadRequestError("This stay cannot be reviewed yet")
    if booking.review is not None:
        raise ConflictError("This stay has already been reviewed")

    review = Review(
        booking_id=booking.id,
        listing_id=booking.listing_id,
        author_id=user.id,
        rating=rating,
        comment=comment,
    )
    db.add(review)
    db.flush()
    _refresh_listing_rating(db, booking.listing)
    db.commit()
    db.refresh(review)
    review.author = user
    return _review_out(review)


def _refresh_listing_rating(db: Session, listing: Listing) -> None:
    total, count = db.execute(
        select(func.coalesce(func.sum(Review.rating), 0), func.count(Review.id)).where(
            Review.listing_id == listing.id
        )
    ).one()
    listing.review_count = int(count)
    if count:
        listing.avg_rating = float(
            (Decimal(int(total)) / Decimal(int(count))).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)
        )
    else:
        listing.avg_rating = 0.0


def _distribution(db: Session, listing_id: int) -> dict[str, int]:
    counts = {str(star): 0 for star in range(5, 0, -1)}
    rows = db.execute(
        select(Review.rating, func.count(Review.id))
        .where(Review.listing_id == listing_id)
        .group_by(Review.rating)
    )
    for rating, count in rows:
        counts[str(rating)] = int(count)
    return counts


def _review_out(review: Review) -> ReviewOut:
    return ReviewOut(
        id=review.id,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
        author=ReviewAuthor(
            name=review.author.name,
            avatar_url=review.author.avatar_url,
            created_at=review.author.created_at,
        ),
    )
