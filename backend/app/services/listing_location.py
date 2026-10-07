"""Public map coordinates: approximate when the host hides the pin."""

import math

from app.models.listing import Listing


def public_coordinates(listing: Listing) -> tuple[float, float, bool]:
    if listing.show_precise_location:
        return listing.lat, listing.lng, False
    seed = (listing.id or 1) * 2654435761
    angle = (seed % 360) * math.pi / 180.0
    # ~500 m at mid-latitudes
    delta = 0.0045
    return listing.lat + math.sin(angle) * delta, listing.lng + math.cos(angle) * delta, True

