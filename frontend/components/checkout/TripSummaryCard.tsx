"use client";

import { Gem } from "lucide-react";
import Image from "next/image";
import { Divider } from "@/components/ui/Divider";
import { GUEST_FAVOURITE_BLURB } from "@/lib/brand";
import {
  formatCheckoutCancellationSummary,
  formatCheckoutGuestSummary,
  formatDateRange,
  formatInr,
  formatRating,
} from "@/lib/format";
import { isGuestFavourite } from "@/lib/isGuestFavourite";
import { PriceLines } from "@/components/checkout/PriceLines";
import type { CheckoutQuote } from "@/types/booking";
import type { ListingDetail } from "@/types";

interface TripSummaryCardProps {
  listing: ListingDetail;
  quote: CheckoutQuote | undefined;
  quoteLoading: boolean;
  datesUnavailable: boolean;
  checkIn?: string;
  checkOut?: string;
  guests: { adults: number; children: number; infants: number; pets: number };
  onChangeDates: () => void;
  onChangeGuests: () => void;
  onManageCoupons: () => void;
  onPriceBreakdown: () => void;
  onPolicy: () => void;
}

export function TripSummaryCard({
  listing,
  quote,
  quoteLoading,
  datesUnavailable,
  checkIn,
  checkOut,
  guests,
  onChangeDates,
  onChangeGuests,
  onManageCoupons,
  onPriceBreakdown,
  onPolicy,
}: TripSummaryCardProps) {
  const cover = listing.images[0]?.url;
  const guestFav = isGuestFavourite(listing);
  const showRare = quote?.is_rare_find;

  return (
    <div className="space-y-6">
      {showRare ? (
        <div className="flex items-center gap-3 rounded-2xl bg-rare-find px-4 py-4">
          <Gem size={24} className="shrink-0 text-rausch" aria-hidden />
          <p className="text-body font-medium text-ink">Rare find! This place is usually booked</p>
        </div>
      ) : null}

      <div className="rounded-3xl border border-hairline p-6">
        <div className="flex gap-4">
          <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-xl bg-soft">
            {cover ? <Image src={cover} alt="" fill className="object-cover" sizes="104px" /> : null}
          </div>
          <div className="min-w-0">
            <p className="line-clamp-3 text-[16px] font-semibold leading-5 text-ink">{listing.title}</p>
            {listing.review_count > 0 ? (
              <p className="mt-2 text-body text-ink">
                ★ {formatRating(listing.avg_rating)} ({listing.review_count})
                {guestFav ? (
                  <>
                    {" "}
                    ·{" "}
                    <span className="inline-flex items-center gap-1" title={GUEST_FAVOURITE_BLURB}>
                      <GuestFavouriteDiamond />
                      Guest favourite
                    </span>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
        </div>

        {checkIn ? (
          <p className="mt-4 text-body text-ink">
            {formatCheckoutCancellationSummary(checkIn)}{" "}
            <button type="button" className="underline underline-offset-2" onClick={onPolicy}>
              Full policy
            </button>
          </p>
        ) : null}

        <Divider className="my-4" />

        <SummaryRow label="Dates" value={checkIn && checkOut ? formatDateRange(checkIn, checkOut) : "Add dates"} onChange={onChangeDates} />
        <Divider className="my-4" />
        <SummaryRow
          label="Guests"
          value={formatCheckoutGuestSummary(guests.adults, guests.children, guests.infants, guests.pets)}
          onChange={onChangeGuests}
        />
        <Divider className="my-4" />

        <p className="text-body font-semibold text-ink">Price details</p>
        {datesUnavailable ? (
          <div className="mt-3">
            <p className="text-body text-error">Those dates aren&apos;t available</p>
            <button
              type="button"
              className="mt-3 rounded-lg bg-ink px-4 py-2.5 text-body font-medium text-white hover:bg-inverse-hover"
              onClick={onChangeDates}
            >
              Change dates
            </button>
          </div>
        ) : quoteLoading && !quote ? (
          <div className="mt-3 space-y-2">
            <div className="h-5 animate-pulse rounded bg-soft" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-soft" />
          </div>
        ) : quote ? (
          <div className="mt-3">
            <PriceLines quote={quote} />
          </div>
        ) : (
          <p className="mt-3 text-meta text-muted">Add dates to see pricing</p>
        )}

        <Divider className="my-4" />
        <button type="button" className="text-body underline underline-offset-4" onClick={onManageCoupons}>
          Manage coupons
        </button>
        <Divider className="my-4" />

        <div className="flex items-center justify-between text-body font-semibold text-ink">
          <span>Total INR</span>
          {quote ? (
            <span className="flex items-center gap-2">
              {quote.total_original > quote.total ? (
                <span className="font-normal text-muted line-through">{formatInr(quote.total_original)}</span>
              ) : null}
              <span>{formatInr(quote.total)}</span>
            </span>
          ) : (
            <span className="text-muted">—</span>
          )}
        </div>
        <button type="button" className="mt-3 text-body underline underline-offset-4" onClick={onPriceBreakdown}>
          Price breakdown
        </button>
      </div>
    </div>
  );
}

function GuestFavouriteDiamond() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="shrink-0 text-ink">
      <path d="M6 1 7.4 4.6 11 4.6 8.3 6.8 9.4 10.4 6 8.4 2.6 10.4 3.7 6.8 1 4.6 4.6 4.6Z" fill="currentColor" />
    </svg>
  );
}

function SummaryRow({ label, value, onChange }: { label: string; value: string; onChange: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-body font-semibold text-ink">{label}</p>
        <p className="mt-1 text-body text-ink">{value}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className="shrink-0 rounded-lg bg-quaternary px-3 py-2 text-body font-medium text-ink hover:bg-quaternary-hover"
      >
        Change
      </button>
    </div>
  );
}
