export type DestinationTint = "blue" | "rose" | "peach" | "green";
export type DestinationIcon = "nearby" | "palm" | "building";

export interface Destination {
  id: string;
  title: string;
  subtitle: string;
  query: string;
  tint: DestinationTint;
  icon: DestinationIcon;
}

export const DESTINATIONS: Destination[] = [
  { id: "nearby", title: "Nearby", subtitle: "Find what's around you", query: "", tint: "blue", icon: "nearby" },
  { id: "goa", title: "Goa", subtitle: "For its bustling nightlife", query: "Goa", tint: "peach", icon: "palm" },
  { id: "manali", title: "Manali", subtitle: "Mountain retreat", query: "Manali", tint: "green", icon: "building" },
  { id: "jaipur", title: "Jaipur", subtitle: "Palaces and colour", query: "Jaipur", tint: "rose", icon: "building" },
  { id: "udaipur", title: "Udaipur", subtitle: "Lakeside stays", query: "Udaipur", tint: "peach", icon: "building" },
  { id: "rishikesh", title: "Rishikesh", subtitle: "Riverside escape", query: "Rishikesh", tint: "green", icon: "palm" },
  { id: "coorg", title: "Coorg", subtitle: "Coffee country", query: "Coorg", tint: "green", icon: "palm" },
  { id: "munnar", title: "Munnar", subtitle: "Tea gardens", query: "Munnar", tint: "peach", icon: "palm" },
  { id: "mumbai", title: "Mumbai", subtitle: "City energy", query: "Mumbai", tint: "rose", icon: "building" },
  { id: "bali", title: "Bali", subtitle: "Island living", query: "Bali", tint: "peach", icon: "palm" },
  { id: "lisbon", title: "Lisbon", subtitle: "For a trip abroad", query: "Lisbon", tint: "rose", icon: "building" },
  { id: "tokyo", title: "Tokyo", subtitle: "World-class dining", query: "Tokyo", tint: "green", icon: "building" },
  { id: "santorini", title: "Santorini", subtitle: "Cliffside views", query: "Santorini", tint: "peach", icon: "palm" },
];

export function filterDestinations(query: string): Destination[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return DESTINATIONS;
  return DESTINATIONS.filter((item) => {
    if (item.id === "nearby") return "nearby".includes(needle) || item.subtitle.toLowerCase().includes(needle);
    return (
      item.title.toLowerCase().includes(needle) ||
      item.subtitle.toLowerCase().includes(needle) ||
      item.query.toLowerCase().includes(needle)
    );
  });
}
