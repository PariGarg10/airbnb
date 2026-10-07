import type { Amenity } from "@/types";

export function groupAmenities(amenities: Amenity[]): [string, Amenity[]][] {
  const buckets = new Map<string, Amenity[]>();
  amenities.forEach((amenity) => {
    const list = buckets.get(amenity.group_name) ?? [];
    list.push(amenity);
    buckets.set(amenity.group_name, list);
  });
  return Array.from(buckets.entries());
}

export const NOT_INCLUDED_AMENITIES: { name: string; icon: string; note?: string }[] = [
  { name: "Tumble dryer", icon: "circle" },
  { name: "Air conditioning", icon: "air-vent" },
  { name: "Essentials", icon: "circle" },
  {
    name: "Smoke alarm",
    icon: "alarm-smoke",
    note: "This place may not have a smoke detector. Contact the host with any questions.",
  },
  {
    name: "Carbon monoxide alarm",
    icon: "circle",
    note: "This place may not have a carbon monoxide detector. Contact the host with any questions.",
  },
  { name: "Heating", icon: "flame" },
  { name: "Hot water", icon: "droplet" },
];

export function missingAmenities(present: Amenity[]) {
  const names = new Set(present.map((a) => a.name.toLowerCase()));
  return NOT_INCLUDED_AMENITIES.filter((item) => !names.has(item.name.toLowerCase()));
}
