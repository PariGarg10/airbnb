"use client";

import { useEffect, useReducer, useState } from "react";
import { sanitizeDraftImages, type DraftImage } from "@/lib/draftImages";
import type { BookingMode, OccupantType, PropertyType, RoomType } from "@/types";

export type { DraftImage };

export const LISTING_DRAFT_KEY = "listing_draft";

const PROPERTY_TYPES: PropertyType[] = [
  "house",
  "apartment",
  "villa",
  "cabin",
  "guesthouse",
  "hotel",
  "cottage",
  "tiny_home",
  "treehouse",
  "castle",
];

const ROOM_TYPES: RoomType[] = ["entire_place", "private_room", "shared_room"];
const OCCUPANT_TYPES: OccupantType[] = ["me", "family", "other_guests", "flatmates"];

function halfStep(value: unknown, fallback: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.round(n * 2) / 2;
}

export interface ListingDraft {
  title: string;
  description: string;
  property_type: PropertyType | "";
  room_type: RoomType | "";
  category: string;
  address: string;
  city: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  price_per_night: number;
  cleaning_fee: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  private_bathrooms: number;
  dedicated_bathrooms: number;
  shared_bathrooms: number;
  show_precise_location: boolean;
  bedrooms_have_locks: boolean | null;
  occupants: OccupantType[];
  booking_mode: BookingMode;
  weekend_adjustment_pct: number;
  discount_new_listing_pct: number;
  discount_last_minute_pct: number;
  discount_weekly_pct: number;
  discount_monthly_pct: number;
  has_exterior_camera: boolean;
  has_noise_monitor: boolean;
  has_weapons: boolean;
  allows_pets: boolean;
  images: DraftImage[];
  image_urls: string[];
  amenity_ids: number[];
  currentStep: number;
  highlights: string;
}

export const emptyListingDraft = (): ListingDraft => ({
  title: "",
  description: "",
  property_type: "",
  room_type: "",
  category: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  lat: 0,
  lng: 0,
  price_per_night: 0,
  cleaning_fee: 0,
  max_guests: 2,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  private_bathrooms: 1,
  dedicated_bathrooms: 0,
  shared_bathrooms: 0,
  show_precise_location: true,
  bedrooms_have_locks: null,
  occupants: [],
  booking_mode: "instant",
  weekend_adjustment_pct: 0,
  discount_new_listing_pct: 20,
  discount_last_minute_pct: 0,
  discount_weekly_pct: 0,
  discount_monthly_pct: 0,
  has_exterior_camera: false,
  has_noise_monitor: false,
  has_weapons: false,
  allows_pets: false,
  images: [],
  image_urls: [],
  amenity_ids: [],
  currentStep: 0,
  highlights: "",
});

type DraftAction =
  | { type: "hydrate"; draft: Partial<ListingDraft> }
  | { type: "patch"; patch: Partial<ListingDraft> }
  | { type: "step"; step: number }
  | { type: "clear" };

function sanitize(raw: Partial<ListingDraft>): ListingDraft {
  const base = emptyListingDraft();
  const property = PROPERTY_TYPES.includes(raw.property_type as PropertyType) ? (raw.property_type as PropertyType) : "";
  const room = ROOM_TYPES.includes(raw.room_type as RoomType) ? (raw.room_type as RoomType) : "";
  const privateB = halfStep(raw.private_bathrooms, halfStep(raw.bathrooms, base.private_bathrooms));
  const dedicatedB = halfStep(raw.dedicated_bathrooms, base.dedicated_bathrooms);
  const sharedB = halfStep(raw.shared_bathrooms, base.shared_bathrooms);
  const bathroomTotal = privateB + dedicatedB + sharedB;
  return {
    ...base,
    ...raw,
    property_type: property,
    room_type: room,
    private_bathrooms: privateB,
    dedicated_bathrooms: dedicatedB,
    shared_bathrooms: sharedB,
    bathrooms: bathroomTotal > 0 ? bathroomTotal : typeof raw.bathrooms === "number" ? raw.bathrooms : base.bathrooms,
    show_precise_location: typeof raw.show_precise_location === "boolean" ? raw.show_precise_location : base.show_precise_location,
    bedrooms_have_locks:
      typeof raw.bedrooms_have_locks === "boolean" ? raw.bedrooms_have_locks : raw.bedrooms_have_locks === null ? null : base.bedrooms_have_locks,
    occupants: Array.isArray(raw.occupants)
      ? raw.occupants.filter((item): item is OccupantType => OCCUPANT_TYPES.includes(item as OccupantType))
      : [],
    booking_mode: raw.booking_mode === "approve_first_5" ? "approve_first_5" : raw.booking_mode === "instant" ? "instant" : base.booking_mode,
    weekend_adjustment_pct: typeof raw.weekend_adjustment_pct === "number" ? raw.weekend_adjustment_pct : base.weekend_adjustment_pct,
    discount_new_listing_pct: typeof raw.discount_new_listing_pct === "number" ? raw.discount_new_listing_pct : base.discount_new_listing_pct,
    discount_last_minute_pct: typeof raw.discount_last_minute_pct === "number" ? raw.discount_last_minute_pct : base.discount_last_minute_pct,
    discount_weekly_pct: typeof raw.discount_weekly_pct === "number" ? raw.discount_weekly_pct : base.discount_weekly_pct,
    discount_monthly_pct: typeof raw.discount_monthly_pct === "number" ? raw.discount_monthly_pct : base.discount_monthly_pct,
    has_exterior_camera: typeof raw.has_exterior_camera === "boolean" ? raw.has_exterior_camera : base.has_exterior_camera,
    has_noise_monitor: typeof raw.has_noise_monitor === "boolean" ? raw.has_noise_monitor : base.has_noise_monitor,
    has_weapons: typeof raw.has_weapons === "boolean" ? raw.has_weapons : base.has_weapons,
    allows_pets: typeof raw.allows_pets === "boolean" ? raw.allows_pets : base.allows_pets,
    images: sanitizeDraftImages(raw),
    image_urls: sanitizeDraftImages(raw).map((item) => item.url),
    amenity_ids: Array.isArray(raw.amenity_ids) ? raw.amenity_ids.filter((item) => typeof item === "number") : [],
    currentStep: typeof raw.currentStep === "number" && raw.currentStep >= 0 ? Math.floor(raw.currentStep) : 0,
    highlights: typeof raw.highlights === "string" ? raw.highlights : "",
  };
}

function reducer(state: ListingDraft, action: DraftAction): ListingDraft {
  if (action.type === "hydrate") return sanitize(action.draft);
  if (action.type === "patch") return { ...state, ...action.patch };
  if (action.type === "step") return { ...state, currentStep: Math.max(0, action.step) };
  return emptyListingDraft();
}

export function useListingDraft(options?: { storageKey?: string | null; initial?: Partial<ListingDraft> }) {
  const storageKey = options?.storageKey === undefined ? LISTING_DRAFT_KEY : options.storageKey;
  const [draft, dispatch] = useReducer(reducer, options?.initial, (initial) =>
    initial ? sanitize(initial) : emptyListingDraft(),
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!storageKey) {
      setHydrated(true);
      return;
    }
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      try {
        dispatch({ type: "hydrate", draft: JSON.parse(raw) as Partial<ListingDraft> });
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated || !storageKey) return;
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [draft, hydrated, storageKey]);

  const patch = (next: Partial<ListingDraft>) => dispatch({ type: "patch", patch: next });
  const setStep = (step: number) => dispatch({ type: "step", step });
  const clear = () => {
    if (storageKey) window.localStorage.removeItem(storageKey);
    dispatch({ type: "clear" });
  };

  return { draft, patch, setStep, clear };
}
