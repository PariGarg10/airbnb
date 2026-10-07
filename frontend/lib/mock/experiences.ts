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
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=400&q=60`;

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
      { id: "e10", title: "Block printing with master artisans", city: "Jaipur", price: 2900, rating: 4.94, image: IMG("1567157577867-05ccb1388e66"), badge: "Original" },
      { id: "e11", title: "River rafting with certified guides", city: "Rishikesh", price: 3400, rating: 4.93, image: IMG("1501785888041-af3ef285b470"), badge: "Original" },
      { id: "e12", title: "Coffee estate walk at sunrise", city: "Coorg", price: 2100, rating: 4.9, image: IMG("1518780664697-55e3ad937233"), badge: "Original" },
    ],
  },
  {
    id: "food",
    title: "Food & drink experiences",
    items: [
      { id: "e13", title: "Street food crawl after dark", city: "Mumbai", price: 1700, rating: 4.87, image: IMG("1566552881560-0be862a7c445") },
      { id: "e14", title: "Wine pairing in a heritage haveli", city: "Udaipur", price: 4200, rating: 4.96, image: IMG("1533154683836-84ea7a0bc310") },
      { id: "e15", title: "Farm-to-table lunch in the hills", city: "Manali", price: 2300, rating: 4.91, image: IMG("1469474968028-56623f02e42e") },
      { id: "e16", title: "Seafood cooking on the beach", city: "Goa", price: 2500, rating: 4.89, image: IMG("1502672260266-1c1ef2d93688") },
    ],
  },
];
