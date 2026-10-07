import type { ListingDetail } from "@/types";

function bathPhrase(count: number, label: string): string | null {
  if (count <= 0) return null;
  const n = Number.isInteger(count) ? String(count) : String(count);
  return `${n} ${label}`;
}

export function formatBathroomFacts(listing: Pick<ListingDetail, "private_bathrooms" | "dedicated_bathrooms" | "shared_bathrooms" | "bathrooms">): string {
  const parts = [
    bathPhrase(listing.private_bathrooms ?? 0, listing.private_bathrooms === 1 ? "private bathroom" : "private bathrooms"),
    bathPhrase(listing.dedicated_bathrooms ?? 0, listing.dedicated_bathrooms === 1 ? "dedicated bathroom" : "dedicated bathrooms"),
    bathPhrase(listing.shared_bathrooms ?? 0, listing.shared_bathrooms === 1 ? "shared bathroom" : "shared bathrooms"),
  ].filter(Boolean);
  if (parts.length > 0) return parts.join(" · ");
  const fallback = listing.bathrooms;
  if (fallback <= 0) return "";
  return `${Number.isInteger(fallback) ? fallback : fallback} ${fallback === 1 ? "bath" : "baths"}`;
}

const OCCUPANT_LABELS: Record<string, string> = {
  me: "the host",
  family: "the host's family",
  other_guests: "other guests",
  flatmates: "flatmates/housemates",
};

export function formatOccupantsNote(occupants: string[]): string | null {
  if (!occupants.length) return null;
  const labels = occupants.map((item) => OCCUPANT_LABELS[item] ?? item);
  if (labels.length === 1) return `During your stay, you may share the space with ${labels[0]}.`;
  const last = labels.pop();
  return `During your stay, you may share the space with ${labels.join(", ")} and ${last}.`;
}

export function bookingModeLabel(mode: ListingDetail["booking_mode"]): string {
  return mode === "instant" ? "Instant Book" : "Your host will review your request";
}
