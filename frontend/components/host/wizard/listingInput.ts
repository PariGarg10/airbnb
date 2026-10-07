import { emptyListingDraft, type ListingDraft } from "@/hooks/useListingDraft";
import { draftImagesFromDraft } from "@/lib/draftImages";

import type { ListingDetail, ListingInput, OccupantType, PropertyType, RoomType } from "@/types";



export function draftFromListing(listing: ListingDetail): ListingDraft {

  const images = [...listing.images].sort((a, b) => a.position - b.position);

  const privateB = listing.private_bathrooms ?? listing.bathrooms;

  const dedicatedB = listing.dedicated_bathrooms ?? 0;

  const sharedB = listing.shared_bathrooms ?? 0;

  return {

    ...emptyListingDraft(),

    title: listing.title,

    description: listing.description,

    property_type: listing.property_type,

    room_type: listing.room_type,

    category: listing.category,

    address: listing.address ?? "",

    city: listing.city,

    state: listing.state ?? "",

    country: listing.country,

    lat: listing.lat,

    lng: listing.lng,

    price_per_night: listing.price_per_night,

    cleaning_fee: listing.cleaning_fee,

    max_guests: listing.max_guests,

    bedrooms: listing.bedrooms,

    beds: listing.beds,

    bathrooms: listing.bathrooms,

    private_bathrooms: privateB,

    dedicated_bathrooms: dedicatedB,

    shared_bathrooms: sharedB,

    show_precise_location: listing.show_precise_location ?? false,

    bedrooms_have_locks: listing.bedrooms_have_locks ?? null,

    occupants: (listing.occupants ?? []) as OccupantType[],

    images: images.map((image) => ({ url: image.url, caption: image.caption ?? null })),

    image_urls: images.map((image) => image.url),

    amenity_ids: listing.amenities.map((amenity) => amenity.id),
    booking_mode: listing.booking_mode,
    weekend_adjustment_pct: listing.weekend_adjustment_pct,
    discount_new_listing_pct: listing.discount_new_listing_pct,
    discount_last_minute_pct: listing.discount_last_minute_pct,
    discount_weekly_pct: listing.discount_weekly_pct,
    discount_monthly_pct: listing.discount_monthly_pct,
    has_exterior_camera: listing.has_exterior_camera,
    has_noise_monitor: listing.has_noise_monitor,
    has_weapons: listing.has_weapons,
    allows_pets: listing.allows_pets,
  };

}



export function toListingInput(draft: ListingDraft): ListingInput {

  const images = draftImagesFromDraft(draft).map((item) => ({
    url: item.url,
    caption: item.caption?.trim() ? item.caption.trim() : undefined,
  }));

  const occupants = draft.room_type === "entire_place" ? [] : draft.occupants;

  return {

    title: draft.title.trim(),

    description: draft.description.trim(),

    property_type: draft.property_type as PropertyType,

    room_type: draft.room_type as RoomType,

    category: draft.category.trim(),

    address: draft.address.trim(),

    city: draft.city.trim(),

    state: draft.state.trim() || null,

    country: draft.country.trim(),

    lat: draft.lat,

    lng: draft.lng,

    price_per_night: draft.price_per_night,

    cleaning_fee: draft.cleaning_fee,

    max_guests: draft.max_guests,

    bedrooms: draft.bedrooms,

    beds: draft.beds,

    private_bathrooms: draft.private_bathrooms,

    dedicated_bathrooms: draft.dedicated_bathrooms,

    shared_bathrooms: draft.shared_bathrooms,

    images,

    amenity_ids: draft.amenity_ids,

    booking_mode: draft.booking_mode,
    show_precise_location: draft.show_precise_location,
    bedrooms_have_locks: draft.room_type === "private_room" ? draft.bedrooms_have_locks : null,
    weekend_adjustment_pct: draft.weekend_adjustment_pct,
    discount_new_listing_pct: draft.discount_new_listing_pct,
    discount_last_minute_pct: draft.discount_last_minute_pct,
    discount_weekly_pct: draft.discount_weekly_pct,
    discount_monthly_pct: draft.discount_monthly_pct,
    has_exterior_camera: draft.has_exterior_camera,
    has_noise_monitor: draft.has_noise_monitor,
    has_weapons: draft.has_weapons,
    allows_pets: draft.allows_pets,
    occupants,

  };

}

