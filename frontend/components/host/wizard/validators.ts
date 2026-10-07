import type { ListingDraft } from "@/hooks/useListingDraft";

export function addressValid(draft: ListingDraft): boolean {
  return draft.address.trim().length > 0 && draft.city.trim().length > 0 && draft.country.trim().length > 0;
}

export function introValid(draft: ListingDraft): boolean {
  return Boolean(draft);
}

export function propertyTypeValid(draft: ListingDraft): boolean {
  return draft.property_type !== "" && draft.category.trim().length > 0;
}

export function placeTypeValid(draft: ListingDraft): boolean {
  return draft.room_type !== "";
}

export function locationValid(draft: ListingDraft): boolean {
  return Number.isFinite(draft.lat) && Number.isFinite(draft.lng) && (draft.lat !== 0 || draft.lng !== 0);
}

export function basicsValid(draft: ListingDraft): boolean {
  const locksOk =
    draft.room_type !== "private_room" || typeof draft.bedrooms_have_locks === "boolean";
  return (
    locksOk &&
    draft.max_guests >= 1 &&
    draft.max_guests <= 16 &&
    draft.bedrooms >= 0 &&
    draft.bedrooms <= 20 &&
    draft.beds >= 1 &&
    draft.beds <= 30
  );
}

export function bathroomsValid(draft: ListingDraft): boolean {
  const total = draft.private_bathrooms + draft.dedicated_bathrooms + draft.shared_bathrooms;
  return total >= 0.5 && total <= 20;
}

export function locationPrivacyValid(draft: ListingDraft): boolean {
  return typeof draft.show_precise_location === "boolean";
}

export function whoElseValid(draft: ListingDraft): boolean {
  if (draft.room_type === "entire_place") return true;
  return Array.isArray(draft.occupants);
}

export function amenitiesValid(draft: ListingDraft): boolean {
  return Array.isArray(draft.amenity_ids);
}

export function photosValid(draft: ListingDraft): boolean {
  const count = draft.images.length > 0 ? draft.images.length : draft.image_urls.length;
  return count >= 5 && count <= 20;
}

export function titleValid(draft: ListingDraft): boolean {
  const title = draft.title.trim();
  return title.length >= 5 && title.length <= 50;
}

export function highlightsValid(draft: ListingDraft): boolean {
  const chosen = draft.highlights.split(",").map((item) => item.trim()).filter(Boolean);
  return chosen.length <= 2;
}

export function descriptionValid(draft: ListingDraft): boolean {
  const text = draft.description.trim();
  return text.length >= 20 && text.length <= 500;
}

export function priceValid(draft: ListingDraft): boolean {
  return (
    Number.isInteger(draft.price_per_night) &&
    draft.price_per_night >= 100 &&
    Number.isInteger(draft.cleaning_fee) &&
    draft.cleaning_fee >= 0
  );
}

export function reviewValid(draft: ListingDraft): boolean {
  return (
    addressValid(draft) &&
    propertyTypeValid(draft) &&
    placeTypeValid(draft) &&
    locationValid(draft) &&
    basicsValid(draft) &&
    bathroomsValid(draft) &&
    photosValid(draft) &&
    titleValid(draft) &&
    descriptionValid(draft) &&
    priceValid(draft)
  );
}
