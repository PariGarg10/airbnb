import type { CancelReason } from "@/types";

export const CANCEL_REASONS: { value: CancelReason; label: string }[] = [
  { value: "plans_changed", label: "My travel plans changed" },
  { value: "found_another_place", label: "I found another place to stay" },
  { value: "travel_restrictions", label: "Travel restrictions" },
  { value: "host_asked", label: "The host asked me to cancel" },
  { value: "personal_emergency", label: "Personal emergency" },
  { value: "other", label: "Other" },
];
