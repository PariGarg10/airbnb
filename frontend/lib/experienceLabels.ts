import type { ExperienceCategory } from "@/types/experience";

const CATEGORY_LABELS: Record<ExperienceCategory, string> = {
  shopping_fashion: "Shopping & fashion",
  food: "Food & drink",
  art: "Art & culture",
  nature: "Nature & outdoors",
  history: "History",
  wellness: "Wellness",
};

const CATEGORY_PROMO: Record<ExperienceCategory, string> = {
  shopping_fashion:
    "Shopping & fashion experiences are led by stylists, fashion editors and other hosts who showcase what makes the city unique.",
  food: "Food experiences are led by chefs, home cooks and local guides who share the flavours of the region.",
  art: "Art and culture experiences are led by artists, curators and storytellers who reveal the city’s creative side.",
  nature: "Nature experiences are led by guides who know the trails, wildlife and landscapes around them.",
  history: "History experiences are led by historians and locals who bring the past to life in the streets.",
  wellness: "Wellness experiences are led by practitioners who focus on balance, movement and mindful time together.",
};

const CATEGORY_ICON: Record<ExperienceCategory, string> = {
  shopping_fashion: "/icons/promo-guest-favourites.png",
  food: "/icons/promo-first-stay.png",
  art: "/icons/promo-beachfront.png",
  nature: "/icons/tab-experiences.png",
  history: "/icons/alt-destinations.png",
  wellness: "/icons/tab-experiences.png",
};

export function experienceCategoryLabel(category: ExperienceCategory): string {
  return CATEGORY_LABELS[category];
}

export function experienceCategoryPromo(category: ExperienceCategory): string {
  return CATEGORY_PROMO[category];
}

export function experienceCategoryIcon(category: ExperienceCategory): string {
  return CATEGORY_ICON[category];
}

export function experienceDurationLabel(minutes: number): string {
  const hours = minutes / 60;
  if (hours >= 1 && Number.isInteger(hours)) return `Around ${hours} hrs experience`;
  if (hours >= 1) return `Around ${hours.toFixed(1)} hrs experience`;
  return `Around ${minutes} min experience`;
}

export function hostTagline(bio: string | null, city: string): string {
  if (!bio?.trim()) return `${city} host`;
  const first = bio.split(/[.!?]\s/)[0]?.trim();
  return first && first.length <= 80 ? first : `${city} native and host`;
}

export function guestRequirementsText(minAge: number): string {
  if (minAge <= 0) return "All ages can attend.";
  return `Guests aged ${minAge} and up can attend.`;
}

export function cancellationPolicyText(cancellationHours: number): string {
  const days = Math.max(1, Math.round(cancellationHours / 24));
  return `Cancel at least ${days} day${days === 1 ? "" : "s"} before the start time for a full refund.`;
}
