const PHRASES: Record<string, string> = {
  Peaceful: "peaceful",
  Unique: "unique",
  "Family-friendly": "family-friendly",
  Stylish: "stylish",
  Central: "centrally located",
  Spacious: "spacious",
};

export function descriptionFromHighlights(highlights: string, place = "place"): string {
  const chosen = highlights
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2);
  if (chosen.length === 0) return "";
  if (chosen.length === 1 && chosen[0] === "Peaceful") {
    return "Take a break and unwind at this peaceful oasis.";
  }
  const words = chosen.map((item) => PHRASES[item] ?? item.toLowerCase());
  if (words.length === 1) return `Take a break and unwind in this ${words[0]} ${place}.`;
  return `Take a break and unwind in this ${words[0]}, ${words[1]} ${place}.`;
}
