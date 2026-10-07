import type { CatalogItem } from "@/lib/mock/experiences";

const IMG = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=400&q=60`;

export const SERVICE_TYPES = [
  "Photography",
  "Chefs",
  "Massage",
  "Prepared meals",
  "Training",
  "Make-up",
  "Hair",
  "Spa treatments",
  "Catering",
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_SECTIONS: { id: string; title: string; featured?: boolean; items: CatalogItem[] }[] = [
  {
    id: "nearby",
    title: "More services in Sholinganallur",
    items: [
      { id: "s1", title: "Editorial fashion portraits by Irfan", city: "Chennai", price: 2000, rating: 5.0, image: IMG("1524504388940-b1c1722653fc"), popular: true },
      { id: "s2", title: "Home chef: South Indian tasting menu", city: "Chennai", price: 3500, rating: 4.96, image: IMG("1556910103-1c02745aae4d"), popular: true },
      { id: "s3", title: "Deep tissue massage at your stay", city: "Chennai", price: 1800, rating: 4.92, image: IMG("1544161515-4ab6ce687db5") },
      { id: "s4", title: "Personal training — strength & mobility", city: "Chennai", price: 1500, rating: 4.88, image: IMG("1571019614242-2b5a68c1e8c2") },
      { id: "s5", title: "Bridal makeup & hair styling", city: "Chennai", price: 4200, rating: 4.99, image: IMG("1522337360788-8a0d3a2b4a0e") },
      { id: "s6", title: "Event catering for small gatherings", city: "Chennai", price: 5000, rating: 4.9, image: IMG("1414235077428-338989a2714b") },
    ],
  },
  {
    id: "discover",
    title: "Discover services on <app name>",
    featured: true,
    items: [],
  },
  {
    id: "puducherry",
    title: "Services in Puducherry",
    items: [
      { id: "s7", title: "Beachside portrait session", city: "Puducherry", price: 2200, rating: 4.95, image: IMG("1492691527719-9d1e07e534b4") },
      { id: "s8", title: "French-Indian fusion chef", city: "Puducherry", price: 3200, rating: 4.91, image: IMG("1504674900247-0877df9cc836") },
      { id: "s9", title: "Ayurvedic spa treatment", city: "Puducherry", price: 2800, rating: 4.97, image: IMG("1540555700478-4be289fbecef") },
      { id: "s10", title: "Yoga & breathwork coaching", city: "Puducherry", price: 1600, rating: 4.89, image: IMG("1506126613408-07c3529c3750") },
      { id: "s11", title: "Family portrait session in the city", city: "Puducherry", price: 1900, rating: 4.86, image: IMG("1524504388940-b1c1722653fc") },
    ],
  },
  {
    id: "goa",
    title: "Services in Goa",
    items: [
      { id: "s12", title: "Sunset photography on the beach", city: "Goa", price: 2400, rating: 4.94, image: IMG("1502672260266-1c1ef2d93688"), popular: true },
      { id: "s13", title: "Private chef: Goan seafood feast", city: "Goa", price: 3800, rating: 4.92, image: IMG("1556910103-1c02745aae4d") },
      { id: "s14", title: "In-villa massage & wellness", city: "Goa", price: 2000, rating: 4.88, image: IMG("1544161515-4ab6ce687db5") },
      { id: "s15", title: "Personal trainer — beach workouts", city: "Goa", price: 1400, rating: 4.85, image: IMG("1571019614242-2b5a68c1e8c2") },
    ],
  },
];
