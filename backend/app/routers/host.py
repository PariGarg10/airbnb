from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_host
from app.models import User
from app.schemas.host import (
    HostBookingOut,
    HostBookingStatus,
    HostListingOut,
    HostProfileOut,
    HostProfileUpdate,
    HostStats,
    ListingCreate,
    ListingDeleteResult,
    ListingStatusUpdate,
)
from app.schemas.booking import BookingDetail
from app.schemas.listing import ListingDetail
from app.services import booking_service, host_service

router = APIRouter(prefix="/api/host", tags=["host"])


@router.get("/profile", response_model=HostProfileOut)
def get_host_profile(
    db: Session = Depends(get_db),
    host: User = Depends(require_host),
) -> HostProfileOut:
    return host_service.get_profile(db, host)


@router.put("/profile", response_model=HostProfileOut)
def update_host_profile(
    body: HostProfileUpdate,
    db: Session = Depends(get_db),
    host: User = Depends(require_host),
) -> HostProfileOut:
    return host_service.upsert_profile(db, host, body)


@router.get("/listings", response_model=list[HostListingOut])
def host_listings(
    db: Session = Depends(get_db),
    host: User = Depends(require_host),
) -> list[HostListingOut]:
    return host_service.list_listings(db, host)


@router.post("/listings", response_model=ListingDetail, status_code=201)
def create_listing(
    body: ListingCreate,
    db: Session = Depends(get_db),
    host: User = Depends(require_host),
) -> ListingDetail:
    return host_service.create_listing(db, host, body)


@router.put("/listings/{listing_id}", response_model=ListingDetail)
def update_listing(
    listing_id: int,
    body: ListingCreate,
    db: Session = Depends(get_db),
    host: User = Depends(require_host),
) -> ListingDetail:
    return host_service.update_listing(db, host, listing_id, body)


@router.delete("/listings/{listing_id}", response_model=ListingDeleteResult)
def delete_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    host: User = Depends(require_host),
) -> ListingDeleteResult:
    kind = host_service.delete_listing(db, host, listing_id)
    return ListingDeleteResult(deleted=kind)


@router.patch("/listings/{listing_id}/status", response_model=HostListingOut)
def update_listing_status(
    listing_id: int,
    body: ListingStatusUpdate,
    db: Session = Depends(get_db),
    host: User = Depends(require_host),
) -> HostListingOut:
    return host_service.set_status(db, host, listing_id, body.is_active)


@router.get("/bookings", response_model=list[HostBookingOut])
def host_bookings(
    status: HostBookingStatus,
    db: Session = Depends(get_db),
    host: User = Depends(require_host),
) -> list[HostBookingOut]:
    return host_service.list_bookings(db, host, status)


@router.post("/bookings/{booking_id}/accept", response_model=BookingDetail)
def accept_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    host: User = Depends(require_host),
) -> BookingDetail:
    return booking_service.accept_booking(db, host, booking_id)


@router.post("/bookings/{booking_id}/decline", response_model=BookingDetail)
def decline_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    host: User = Depends(require_host),
) -> BookingDetail:
    return booking_service.decline_booking(db, host, booking_id)


@router.get("/stats", response_model=HostStats)
def host_stats(
    db: Session = Depends(get_db),
    host: User = Depends(require_host),
) -> HostStats:
    return host_service.stats(db, host)
