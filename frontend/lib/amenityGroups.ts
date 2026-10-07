import type { Amenity } from "@/types";

const GROUP_LABELS: Record<string, string> = {
  Essentials: "Basics",
  Popular: "Popular",
  Features: "Features",
  Location: "Location",
  Safety: "Safety",
};

const GROUP_ORDER = ["Essentials", "Popular", "Features", "Location", "Safety"];

const AMENITY_HINTS: Record<string, string> = {
  Essentials: "Towels, bed sheets, soap and toilet paper",
  "Cooking basics": "Pots and pans, oil, salt and pepper",
};

export function amenityGroupLabel(groupName: string): string {
  return GROUP_LABELS[groupName] ?? groupName;
}

export function amenityHint(name: string): string | undefined {
  return AMENITY_HINTS[name];
}

export function groupAmenitiesOrdered(amenities: Amenity[]): [string, Amenity[]][] {
  const groups = new Map<string, Amenity[]>();
  amenities.forEach((amenity) => {
    const list = groups.get(amenity.group_name) ?? [];
    list.push(amenity);
    groups.set(amenity.group_name, list);
  });
  const ordered: [string, Amenity[]][] = [];
  GROUP_ORDER.forEach((key) => {
    const items = groups.get(key);
    if (items?.length) ordered.push([key, items]);
  });
  groups.forEach((items, key) => {
    if (!GROUP_ORDER.includes(key) && items.length) ordered.push([key, items]);
  });
  return ordered;
}
