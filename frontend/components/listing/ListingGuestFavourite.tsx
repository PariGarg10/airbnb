import { GUEST_FAVOURITE_BLURB } from "@/lib/brand";
import { formatRating } from "@/lib/format";

export function ListingGuestFavourite({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  return (
    <div className="mt-8 hidden min-[1128px]:flex min-[1128px]:items-stretch min-[1128px]:overflow-hidden min-[1128px]:rounded-xl min-[1128px]:border min-[1128px]:border-hairline">
      <div className="flex w-[140px] shrink-0 flex-col items-center justify-center border-r border-divider px-4 py-6 text-center">
        <LaurelBadge />
        <p className="mt-2 text-xs font-semibold leading-4 text-ink">Guest favourite</p>
      </div>
      <div className="flex flex-1 items-center border-r border-divider px-6 py-6">
        <p className="max-w-[240px] text-sm leading-[18px] text-ink">
          {GUEST_FAVOURITE_BLURB}
        </p>
      </div>
      <div className="flex w-[120px] shrink-0 flex-col items-center justify-center border-r border-divider px-4 py-6 text-center">
        <p className="text-[22px] font-semibold leading-6 tracking-tight text-ink">{formatRating(rating)}</p>
        <p className="mt-1 text-xs leading-4 text-ink" aria-hidden>
          ★★★★★
        </p>
      </div>
      <a href="#reviews" className="flex w-[120px] shrink-0 flex-col items-center justify-center px-4 py-6 text-center">
        <p className="text-[22px] font-semibold leading-6 text-ink">{reviewCount}</p>
        <p className="mt-1 text-xs font-semibold leading-4 text-ink underline decoration-1 underline-offset-2">Reviews</p>
      </a>
    </div>
  );
}

function LaurelBadge() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden className="text-ink">
      <path
        d="M16 4c-2 3-5 4-8 4 1 3 3 5 6 6-3 1-5 3-6 6 3 0 6-1 8-4 2 3 5 4 8 4-1-3-3-5-6-6 3-1 5-3 6-6-3 0-6 1-8-4Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
