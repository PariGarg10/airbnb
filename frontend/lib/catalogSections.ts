import { APP_NAME } from "@/lib/brand";

export type CatalogSectionMeta = {
  id: string;
  title: string;
  subtitle?: string;
  featured?: boolean;
  /** Slice start index when using the main category fetch */
  start?: number;
  take?: number;
  /** Client-side filter by city (Services rows) */
  city?: string;
};

export const EXPERIENCE_SECTIONS: CatalogSectionMeta[] = [
  {
    id: "weekend",
    title: "Experiences this weekend",
    subtitle: "Hosted by the world's most interesting people",
    start: 0,
    take: 6,
  },
  {
    id: "originals",
    title: "Originals by hosts",
    start: 6,
    take: 6,
  },
  {
    id: "food",
    title: "Food & drink experiences",
    start: 12,
    take: 6,
  },
];

export const SERVICE_SECTIONS: CatalogSectionMeta[] = [
  {
    id: "nearby",
    title: "More services in Sholinganallur",
    city: "Chennai",
    take: 6,
  },
  {
    id: "discover",
    title: `Discover services on ${APP_NAME}`,
    featured: true,
  },
  {
    id: "puducherry",
    title: "Services in Puducherry",
    city: "Puducherry",
    take: 5,
  },
  {
    id: "goa",
    title: "Services in Goa",
    city: "Goa",
    take: 4,
  },
];
