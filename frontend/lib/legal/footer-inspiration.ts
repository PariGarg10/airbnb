export type InspirationTab = {
  id: string;
  label: string;
};

export type InspirationPlace = {
  city: string;
  subtitle: string;
  href: string;
};

export const INSPIRATION_TABS: InspirationTab[] = [
  { id: "popular", label: "Popular" },
  { id: "arts", label: "Arts & culture" },
  { id: "beach", label: "Beach" },
  { id: "mountains", label: "Mountains" },
  { id: "outdoors", label: "Outdoors" },
  { id: "things", label: "Things to do" },
];

export const INSPIRATION_BY_TAB: Record<string, InspirationPlace[]> = {
  popular: [
    { city: "Goa", subtitle: "Beach rentals", href: "/s?location=Goa" },
    { city: "Jaipur", subtitle: "Heritage stays", href: "/s?location=Jaipur" },
    { city: "Manali", subtitle: "Mountain cabins", href: "/s?location=Manali" },
    { city: "Mumbai", subtitle: "Apartment rentals", href: "/s?location=Mumbai" },
    { city: "Udaipur", subtitle: "Lakefront homes", href: "/s?location=Udaipur" },
    { city: "Bali", subtitle: "Villa rentals", href: "/s?location=Bali" },
    { city: "Coorg", subtitle: "Homestays", href: "/s?location=Coorg" },
    { city: "Rishikesh", subtitle: "Retreat stays", href: "/s?location=Rishikesh" },
    { city: "Lisbon", subtitle: "City apartments", href: "/s?location=Lisbon" },
    { city: "Tokyo", subtitle: "Monthly rentals", href: "/s?location=Tokyo" },
    { city: "Munnar", subtitle: "Tea estate stays", href: "/s?location=Munnar" },
    { city: "Santorini", subtitle: "House rentals", href: "/s?location=Santorini" },
  ],
  arts: [
    { city: "Jaipur", subtitle: "Craft & culture", href: "/s?location=Jaipur" },
    { city: "Udaipur", subtitle: "Palace district", href: "/s?location=Udaipur" },
    { city: "Puducherry", subtitle: "French quarter", href: "/s?location=Puducherry" },
    { city: "Kochi", subtitle: "Art walks", href: "/s?location=Kochi" },
    { city: "Varanasi", subtitle: "Old city stays", href: "/s?location=Varanasi" },
    { city: "Lisbon", subtitle: "Gallery district", href: "/s?location=Lisbon" },
  ],
  beach: [
    { city: "Goa", subtitle: "Beachfront", href: "/s?location=Goa&category=Beachfront" },
    { city: "Bali", subtitle: "Coastal villas", href: "/s?location=Bali" },
    { city: "Chennai", subtitle: "East coast", href: "/s?location=Chennai" },
    { city: "Puducherry", subtitle: "Seaside", href: "/s?location=Puducherry" },
    { city: "Gokarna", subtitle: "Quiet beaches", href: "/s?location=Gokarna" },
    { city: "Andaman", subtitle: "Island stays", href: "/s?location=Andaman" },
  ],
  mountains: [
    { city: "Manali", subtitle: "Hill stations", href: "/s?location=Manali" },
    { city: "Munnar", subtitle: "Highland tea country", href: "/s?location=Munnar" },
    { city: "Coorg", subtitle: "Western Ghats", href: "/s?location=Coorg" },
    { city: "Shimla", subtitle: "Colonial hills", href: "/s?location=Shimla" },
    { city: "Darjeeling", subtitle: "Tea hills", href: "/s?location=Darjeeling" },
    { city: "Leh", subtitle: "High altitude", href: "/s?location=Leh" },
  ],
  outdoors: [
    { city: "Rishikesh", subtitle: "River & trails", href: "/s?location=Rishikesh" },
    { city: "Coorg", subtitle: "Plantation walks", href: "/s?location=Coorg" },
    { city: "Wayanad", subtitle: "Wildlife nearby", href: "/s?location=Wayanad" },
    { city: "Spiti", subtitle: "Desert mountains", href: "/s?location=Spiti" },
    { city: "Kodaikanal", subtitle: "Lake trails", href: "/s?location=Kodaikanal" },
    { city: "Ooty", subtitle: "Nilgiri escapes", href: "/s?location=Ooty" },
  ],
  things: [
    { city: "Goa", subtitle: "Food & nightlife", href: "/s?location=Goa" },
    { city: "Mumbai", subtitle: "City experiences", href: "/experiences" },
    { city: "Jaipur", subtitle: "Markets & forts", href: "/s?location=Jaipur" },
    { city: "Bengaluru", subtitle: "Weekend getaways", href: "/s?location=Bengaluru" },
    { city: "Puducherry", subtitle: "Cafés & coast", href: "/s?location=Puducherry" },
    { city: "Delhi", subtitle: "Heritage walks", href: "/s?location=Delhi" },
  ],
};
