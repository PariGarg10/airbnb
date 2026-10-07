"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { PropertyType, RoomType } from "@/types";

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

export interface SearchFilters {
  location?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  category?: string;
  min_price?: number;
  max_price?: number;
  property_types?: PropertyType[];
  room_type?: RoomType;
  amenities?: number[];
  min_bedrooms?: number;
  min_beds?: number;
  min_bathrooms?: number;
  min_rating?: number;
  instant_book?: boolean;
  allows_pets?: boolean;
}

function readNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readFlag(value: string | null): boolean | undefined {
  return value === "true" ? true : undefined;
}

function readFilters(params: URLSearchParams): SearchFilters {
  const propertyTypes = params
    .get("property_types")
    ?.split(",")
    .filter((value): value is PropertyType => PROPERTY_TYPES.includes(value as PropertyType));
  const roomType = params.get("room_type");
  const amenities = params
    .get("amenities")
    ?.split(",")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
  const guests = readNumber(params.get("guests"));

  return {
    location: params.get("location") || undefined,
    check_in: params.get("check_in") || undefined,
    check_out: params.get("check_out") || undefined,
    guests: guests && guests >= 1 ? guests : undefined,
    category: params.get("category") || undefined,
    min_price: readNumber(params.get("min_price")),
    max_price: readNumber(params.get("max_price")),
    property_types: propertyTypes && propertyTypes.length > 0 ? propertyTypes : undefined,
    room_type: ROOM_TYPES.includes(roomType as RoomType) ? (roomType as RoomType) : undefined,
    amenities: amenities && amenities.length > 0 ? amenities : undefined,
    min_bedrooms: readNumber(params.get("min_bedrooms")),
    min_beds: readNumber(params.get("min_beds")),
    min_bathrooms: readNumber(params.get("min_bathrooms")),
    min_rating: readNumber(params.get("min_rating")),
    instant_book: readFlag(params.get("instant_book")),
    allows_pets: readFlag(params.get("allows_pets")),
  };
}

function writeValue(params: URLSearchParams, key: string, value: string | number | string[] | number[] | boolean | undefined) {
  if (value == null || value === "" || value === false || (Array.isArray(value) && value.length === 0)) {
    params.delete(key);
    return;
  }
  if (typeof value === "boolean") {
    params.set(key, "true");
    return;
  }
  params.set(key, Array.isArray(value) ? value.join(",") : String(value));
}

export function hasActiveSearch(params: URLSearchParams): boolean {
  const filters = readFilters(params);
  return Boolean(
    filters.location ||
      filters.check_in ||
      filters.check_out ||
      filters.guests ||
      filters.category ||
      filters.min_price != null ||
      filters.max_price != null ||
      (filters.property_types && filters.property_types.length > 0) ||
      filters.room_type ||
      (filters.amenities && filters.amenities.length > 0) ||
      filters.min_bedrooms != null ||
      filters.min_beds != null ||
      filters.min_bathrooms != null ||
      filters.min_rating != null ||
      filters.instant_book ||
      filters.allows_pets,
  );
}

export function countActiveFilters(filters: SearchFilters): number {
  let count = 0;
  if (filters.category) count += 1;
  if (filters.min_price != null || filters.max_price != null) count += 1;
  if (filters.property_types && filters.property_types.length > 0) count += 1;
  if (filters.room_type) count += 1;
  if (filters.amenities && filters.amenities.length > 0) count += 1;
  if (filters.min_bedrooms != null || filters.min_beds != null || filters.min_bathrooms != null) count += 1;
  if (filters.min_rating != null) count += 1;
  if (filters.instant_book) count += 1;
  if (filters.allows_pets) count += 1;
  return count;
}

export function useSearchFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<SearchFilters>) => {
      const next = { ...filters, ...patch };
      const params = new URLSearchParams(searchParams.toString());
      writeValue(params, "location", next.location);
      writeValue(params, "check_in", next.check_in);
      writeValue(params, "check_out", next.check_out);
      writeValue(params, "guests", next.guests);
      writeValue(params, "category", next.category);
      writeValue(params, "min_price", next.min_price);
      writeValue(params, "max_price", next.max_price);
      writeValue(params, "property_types", next.property_types);
      writeValue(params, "room_type", next.room_type);
      writeValue(params, "amenities", next.amenities);
      writeValue(params, "min_bedrooms", next.min_bedrooms);
      writeValue(params, "min_beds", next.min_beds);
      writeValue(params, "min_bathrooms", next.min_bathrooms);
      writeValue(params, "min_rating", next.min_rating);
      writeValue(params, "instant_book", next.instant_book);
      writeValue(params, "allows_pets", next.allows_pets);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [filters, pathname, router, searchParams],
  );

  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return {
    filters,
    setFilters,
    clearFilters,
    activeFilterCount: countActiveFilters(filters),
  };
}
