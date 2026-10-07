"use client";

import Image from "next/image";
import { formatInrDecimal, formatRating } from "@/lib/format";
import { adultsLabel, formatExperienceDateLong, formatExperienceTimeRange } from "@/lib/experienceDatetime";
import { listingPhotoUrl } from "@/lib/listingPhotoUrl";
import type { ExperienceDetail, ExperienceQuote, ExperienceSlot } from "@/types/experience";

export function ExperienceSummaryCard({
  experience,
  slot,
  adults,
  quote,
  quoteLoading,
  onChangeGuests,
}: {
  experience: ExperienceDetail;
  slot: ExperienceSlot;
  adults: number;
  quote: ExperienceQuote | undefined;
  quoteLoading: boolean;
  onChangeGuests: () => void;
}) {
  const cover = [...experience.images].sort((a, b) => a.position - b.position)[0]?.url;

  return (
    <div className="rounded-[var(--r-12)] border border-[#DDDDDD] p-6">
      <div className="flex gap-4">
        <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-xl bg-soft">
          {cover ? <Image src={listingPhotoUrl(cover, 208)} alt="" fill className="object-cover" sizes="104px" /> : null}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-semibold leading-6 text-ink">{experience.title}</p>
          <p className="mt-1 text-sm text-muted">
            ★ {formatRating(experience.avg_rating)} ({experience.review_count})
          </p>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold text-ink">Free cancellation</p>
        <p className="mt-1 text-sm leading-[18px] text-muted">{quote?.cancellation_text ?? "…"}</p>
      </div>

      <div className="my-6 h-px bg-hairline" />

      <div>
        <p className="text-sm font-semibold text-ink">Date</p>
        <p className="mt-1 text-sm text-ink">{formatExperienceDateLong(slot.start_at)}</p>
        <p className="text-sm text-muted">{formatExperienceTimeRange(slot.start_at, slot.end_at)}</p>
      </div>

      <div className="my-6 h-px bg-hairline" />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Guests</p>
          <p className="mt-1 text-sm text-ink">{adultsLabel(adults)}</p>
        </div>
        <button type="button" onClick={onChangeGuests} className="rounded-full border border-hairline px-3 py-1.5 text-sm font-semibold text-muted hover:border-ink">
          Change
        </button>
      </div>

      <div className="my-6 h-px bg-hairline" />

      <div>
        <p className="text-sm font-semibold text-ink">Price details</p>
        {quoteLoading || !quote ? (
          <p className="mt-2 text-sm text-muted">Updating…</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {quote.lines.map((line) => (
              <li key={line.label} className="flex justify-between text-sm text-ink">
                <span>{line.label}</span>
                <span>{formatInrDecimal(line.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="my-6 h-px bg-hairline" />

      <div className="flex justify-between text-base font-semibold text-ink">
        <span>Total INR</span>
        <span>{quote ? formatInrDecimal(quote.total) : "—"}</span>
      </div>
    </div>
  );
}
