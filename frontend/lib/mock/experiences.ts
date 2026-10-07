export interface CatalogItem {
  id: string;
  title: string;
  city: string;
  price: number;
  rating: number;
  image: string;
  badge?: string;
  popular?: boolean;
}

const IMG = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=80`;

export const EXPERIENCE_SECTIONS: { id: string; title: string; subtitle?: string; items: CatalogItem[] }[] = [
  {
    id: "weekend",
    title: "Experiences this weekend",
    subtitle: "Hosted by the world's most interesting people",
    items: [
      { id: "e1", title: "Sunset kayak tour on the backwaters", city: "Goa", price: 2800, rating: 4.98, image: IMG("1506905925346-21bda4d32df4"), badge: "Fri · 5pm" },
      { id: "e2", title: "Old city food walk with a local chef", city: "Jaipur", price: 1900, rating: 5.0, image: IMG("1555939594-58d7cb561ad1"), badge: "Sat · 11am" },
      { id: "e3", title: "Pottery workshop in an artist studio", city: "Bengaluru", price: 2200, rating: 4.92, image: IMG("1513475382585-d06e58bcb0ea"), badge: "Sun · 2pm" },
      { id: "e4", title: "Tea tasting in the Nilgiri hills", city: "Coorg", price: 3500, rating: 4.88, image: IMG("1544787219-7f4ccb20212a"), badge: "Sat · 9am" },
      { id: "e5", title: "Photography walk at golden hour", city: "Udaipur", price: 2400, rating: 4.95, image: IMG("1469859678032-0a1156238916"), badge: "Fri · 6pm" },
      { id: "e6", title: "Cooking class: coastal spices", city: "Kochi", price: 2600, rating: 4.91, image: IMG("1504674900247-0877df9cc836"), badge: "Sun · 4pm" },
    ],
  },
  {
    id: "originals",
    title: "Originals by hosts",
    items: [
      { id: "e7", title: "Private sunrise yoga on the beach", city: "Goa", price: 3200, rating: 5.0, image: IMG("1544367567-0f2fcb009e11"), badge: "Original" },
      { id: "e8", title: "Vintage car tour of pink streets", city: "Jaipur", price: 4500, rating: 4.97, image: IMG("1449965408869-eaa3f722e34d"), badge: "Original" },
      { id: "e9", title: "Sound healing in a forest cabin", city: "Manali", price: 3800, rating: 4.99, image: IMG("1519682337058-a94d519f3370"), badge: "Original" },
      { id: "e10", title: "Block printing with master artisans", city: "Jaipur", price: 2900, rating: 4.94, image: IMG("1452860603808-3f0f4f2b7b7a"), badge: "Original" },
    ],
  },
];
