"use client";

import { formatInr } from "@/lib/format";
import { formatExperienceTimeRange } from "@/lib/experienceDatetime";
import type { ExperienceSlot } from "@/types/experience";

export function SlotCard({
  slot,
  selected,
  onSelect,
}: {
  slot: ExperienceSlot;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
        selected ? "border-2 border-ink" : "border border-[#DDDDDD] hover:border-ink/40"
      }`}
    >
      <p className="text-base font-semibold leading-5 text-ink">{formatExperienceTimeRange(slot.start_at, slot.end_at)}</p>
      <p className="mt-1 text-base leading-5 text-ink">
        {formatInr(slot.price_per_guest)} <span className="font-normal text-muted">/ guest</span>
      </p>
      {slot.private_available ? (
        <p className="mt-1 text-sm leading-[18px] text-muted">Private pricing available</p>
      ) : null}
    </button>
  );
}
