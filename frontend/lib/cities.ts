export interface CityPoint {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export const CITIES: CityPoint[] = [
  { name: "Goa", country: "India", lat: 15.2993, lng: 74.124 },
  { name: "Manali", country: "India", lat: 32.2396, lng: 77.1887 },
  { name: "Jaipur", country: "India", lat: 26.9124, lng: 75.7873 },
  { name: "Udaipur", country: "India", lat: 24.5854, lng: 73.7125 },
  { name: "Rishikesh", country: "India", lat: 30.0869, lng: 78.2676 },
  { name: "Coorg", country: "India", lat: 12.3375, lng: 75.8069 },
  { name: "Munnar", country: "India", lat: 10.0889, lng: 77.0595 },
  { name: "Mumbai", country: "India", lat: 19.076, lng: 72.8777 },
  { name: "Delhi", country: "India", lat: 28.6139, lng: 77.209 },
  { name: "Bengaluru", country: "India", lat: 12.9716, lng: 77.5946 },
  { name: "Vellore", country: "India", lat: 12.9165, lng: 79.1325 },
  { name: "Bali", country: "Indonesia", lat: -8.4095, lng: 115.1889 },
  { name: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393 },
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { name: "Santorini", country: "Greece", lat: 36.3932, lng: 25.4615 },
];

export const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };

export const SEED_COUNTRIES = ["India", "Indonesia", "Portugal", "Japan", "Greece"];

export function lookupCity(query: string): CityPoint | undefined {
  const needle = query.trim().toLowerCase();
  if (!needle) return undefined;
  return CITIES.find((city) => needle.includes(city.name.toLowerCase()) || city.name.toLowerCase().includes(needle));
}

export function searchCities(query: string, limit = 6): CityPoint[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];
  const matches = CITIES.filter(
    (city) =>
      city.name.toLowerCase().includes(needle) ||
      city.country.toLowerCase().includes(needle) ||
      `${city.name}, ${city.country}`.toLowerCase().includes(needle),
  );
  return matches.slice(0, limit);
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function nearestCity(lat: number, lng: number): CityPoint {
  let best = CITIES[0];
  let bestDist = Infinity;
  for (const city of CITIES) {
    const dist = distanceKm(lat, lng, city.lat, city.lng);
    if (dist < bestDist) {
      bestDist = dist;
      best = city;
    }
  }
  return best;
}

/** Common state / UT codes for seeded Indian cities (confirm-address autofill). */
export const IN_STATE_CODE: Record<string, string> = {
  Goa: "GA",
  Manali: "HP",
  Jaipur: "RJ",
  Udaipur: "RJ",
  Rishikesh: "UK",
  Coorg: "KA",
  Munnar: "KL",
  Mumbai: "MH",
  Delhi: "DL",
  Bengaluru: "KA",
  Vellore: "TN",
};
