"use client";

import { formatInr } from "@/lib/format";
import { formatExperienceDateShort, formatExperienceTimeRange } from "@/lib/experienceDatetime";
import type { ExperienceSlot } from "@/types/experience";

export function BookingFloatCard({
  pricePerGuest,
  nextSlot,
  onShowDates,
  compact,
}: {
  pricePerGuest: number;
  nextSlot: ExperienceSlot | null;
  onShowDates: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--r-12)] border border-hairline bg-white shadow-[var(--shadow-secondary)] ${
        compact ? "p-4" : "p-6"
      }`}
    >
      <div className={`flex items-start justify-between gap-4 ${compact ? "flex-wrap" : ""}`}>
        <div>
          <p className="text-base leading-5 text-ink">
            From{" "}
            <span className="font-semibold underline decoration-1 underline-offset-2">{formatInr(pricePerGuest)}</span>{" "}
            <span className="text-muted">/ guest</span>
          </p>
          <p className="mt-0.5 text-sm font-medium leading-[18px] text-[var(--color-rausch,#FF385C)]">Free cancellation</p>
        </div>
        <button type="button" onClick={onShowDates} className="search-fill shrink-0 rounded-full px-6 py-3.5 text-base font-semibold text-white">
          Show dates
        </button>
      </div>
      {nextSlot && !compact ? (
        <>
          <div className="my-4 h-px bg-hairline" />
          <button
            type="button"
            onClick={onShowDates}
            className="w-full rounded-2xl border border-[#DDDDDD] px-4 py-3 text-left hover:border-ink/30"
          >
            <p className="text-base font-semibold leading-5 text-ink">{formatExperienceDateShort(nextSlot.start_at)}</p>
            <p className="mt-0.5 text-sm leading-[18px] text-muted">
              {formatExperienceTimeRange(nextSlot.start_at, nextSlot.end_at)}
            </p>
          </button>
          <button type="button" onClick={onShowDates} className="mt-3 w-full text-center text-sm font-semibold underline text-ink">
            Show all dates
          </button>
        </>
      ) : null}
    </div>
  );
}
