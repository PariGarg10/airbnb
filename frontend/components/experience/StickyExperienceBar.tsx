"use client";

import Image from "next/image";
import { formatInr, formatRating } from "@/lib/format";
import { listingPhotoUrl } from "@/lib/listingPhotoUrl";

export function StickyExperienceBar({
  visible,
  title,
  coverUrl,
  avgRating,
  reviewCount,
  pricePerGuest,
  onShowDates,
}: {
  visible: boolean;
  title: string;
  coverUrl: string | null;
  avgRating: number;
  reviewCount: number;
  pricePerGuest: number;
  onShowDates: () => void;
}) {
  return (
    <div
      className={`fixed left-0 right-0 top-[var(--header-h)] z-40 border-b border-hairline bg-white transition-transform duration-300 ease-standard ${
        visible ? "translate-y-0" : "-translate-y-full pointer-events-none"
      }`}
      aria-hidden={!visible}
    >
      <div className="mx-auto flex h-[72px] max-w-[1120px] items-center justify-between gap-6 px-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-soft">
            {coverUrl ? (
              <Image src={listingPhotoUrl(coverUrl, 96)} alt="" fill className="object-cover" sizes="48px" />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-[18px] text-ink">{title}</p>
            <p className="text-sm leading-[18px] text-muted">
              ★ {formatRating(avgRating)} · {reviewCount} reviews
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="hidden text-right min-[1128px]:block">
            <p className="text-sm leading-[18px] text-ink">
              From <span className="font-semibold underline">{formatInr(pricePerGuest)}</span> / guest
            </p>
            <p className="text-xs font-medium text-[var(--color-rausch,#FF385C)]">Free cancellation</p>
          </div>
          <button type="button" onClick={onShowDates} className="search-fill rounded-full px-5 py-2.5 text-sm font-semibold text-white">
            Show dates
          </button>
        </div>
      </div>
    </div>
  );
}
