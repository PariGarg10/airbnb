import { WIZARD_STEPS, type WizardStep } from "@/components/host/steps";
import type { ListingDraft } from "@/hooks/useListingDraft";

export function stepShouldSkip(draft: ListingDraft, step: WizardStep): boolean {
  if (step.id === "who-else") return draft.room_type === "entire_place";
  return false;
}

export function resolveStepIndex(from: number, delta: number, draft: ListingDraft): number {
  let i = from + delta;
  while (i >= 0 && i < WIZARD_STEPS.length && stepShouldSkip(draft, WIZARD_STEPS[i])) {
    i += delta;
  }
  return Math.max(0, Math.min(WIZARD_STEPS.length - 1, i));
}

export function clampStepIndex(index: number, draft: ListingDraft): number {
  const safe = Math.max(0, Math.min(WIZARD_STEPS.length - 1, index));
  if (!stepShouldSkip(draft, WIZARD_STEPS[safe])) return safe;
  return resolveStepIndex(safe, 1, draft);
}
