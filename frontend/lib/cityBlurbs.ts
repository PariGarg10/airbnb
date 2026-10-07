const BLURBS: Record<string, string> = {
  Bengaluru:
    "A tech hub with leafy Cubbon Park at its core, the city balances startup energy by day with lively pub hopping after dark.",
  Bangalore:
    "A tech hub with leafy Cubbon Park at its core, the city balances startup energy by day with lively pub hopping after dark.",
  Goa: "Sun-soaked beaches, Portuguese heritage, and a relaxed coastal rhythm make it a favourite for long weekends.",
  Manali: "Snow-capped peaks, pine forests, and adventure trails draw travellers to this Himalayan escape.",
  Jaipur: "Pink-hued palaces, bustling bazaars, and royal history define the capital of Rajasthan.",
  Udaipur: "Lake palaces, winding lanes, and sunset views over the water create a romantic old-city feel.",
  Delhi: "Historic monuments, diverse neighbourhoods, and a fast-paced urban culture span both Old and New Delhi.",
  Mumbai: "A waterfront metropolis where art deco, street food, and the sea meet a non-stop city pulse.",
};

export function cityBlurb(city: string): string | null {
  return BLURBS[city] ?? null;
}
