import type { ListingDraft } from "@/hooks/useListingDraft";

export function cloneDraft(draft: ListingDraft): ListingDraft {
  return {
    ...draft,
    images: draft.images.map((item) => ({ ...item })),
    image_urls: [...draft.image_urls],
    amenity_ids: [...draft.amenity_ids],
    occupants: [...draft.occupants],
  };
}

function sameValue(left: unknown, right: unknown): boolean {
  if (typeof left === "number" && typeof right === "number") return Math.abs(left - right) < 1e-5;
  return JSON.stringify(left) === JSON.stringify(right);
}

export function sectionIsDirty(draft: ListingDraft, saved: ListingDraft, fields: (keyof ListingDraft)[] | undefined): boolean {
  if (!fields) return false;
  return fields.some((key) => !sameValue(draft[key], saved[key]));
}

export function sectionSnapshot(saved: ListingDraft, fields: (keyof ListingDraft)[]): Partial<ListingDraft> {
  const next: Partial<ListingDraft> = {};
  for (const key of fields) {
    const value = saved[key];
    next[key] = (Array.isArray(value) ? [...value] : value) as never;
  }
  return next;
}
