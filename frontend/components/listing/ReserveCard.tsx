"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Flag } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DateRangePicker, type DisabledRange } from "@/components/search/DateRangePicker";
import { GuestPicker, type GuestCounts } from "@/components/search/GuestPicker";
import { Button } from "@/components/ui/Button";
import { PriceDetailsPopover } from "@/components/listing/PriceDetailsPopover";
import { ReserveFeesBanner } from "@/components/listing/ReserveFeesBanner";
import { usePopoverPlacement } from "@/hooks/usePopoverPlacement";
import { useStayParams } from "@/hooks/useStayParams";
import { ApiError, listingsApi } from "@/lib/api";
import { StayPriceBreakdown } from "@/components/pricing/StayPriceBreakdown";
import { bookingModeLabel } from "@/lib/listingFacts";
import { bookHref } from "@/lib/bookUrl";
import { formatInr, formatListingStaySubtitle, formatReserveInputDate, formatShortDate } from "@/lib/format";
import type { ListingDetail } from "@/types";

interface ReserveCardProps {
  listing: ListingDetail;
  disabledRanges: DisabledRange[];
  onDatesChange: (checkIn?: string, checkOut?: string) => void;
}

const EMPTY_GUESTS: GuestCounts = { adults: 1, children: 0, infants: 0, pets: 0 };

function nightsBetween(checkIn?: string, checkOut?: string): number {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return Math.round((end - start) / 86400000);
}

export function ReserveCard({ listing, disabledRanges, onDatesChange }: ReserveCardProps) {
  const { checkIn, checkOut, guests, setStay } = useStayParams();
  const [datesOpen, setDatesOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [dateFocus, setDateFocus] = useState<"check-in" | "check-out">("check-in");
  const [counts, setCounts] = useState<GuestCounts>({ ...EMPTY_GUESTS, adults: guests ?? 1 });
  const rootRef = useRef<HTMLDivElement>(null);
  const desktopFieldsRef = useRef<HTMLDivElement>(null);
  const guestCount = Math.min(listing.max_guests, Math.max(1, guests ?? 1));
  const guestPopover = usePopoverPlacement(guestsOpen, desktopFieldsRef, 440);
  const datesPopover = usePopoverPlacement(datesOpen, desktopFieldsRef, 520);
  const datesReady = Boolean(checkIn && checkOut);
  const nights = nightsBetween(checkIn, checkOut);

  const quote = useQuery({
    queryKey: ["quote", listing.id, checkIn, checkOut, guestCount],
    queryFn: () => listingsApi.quote(listing.id, { check_in: checkIn!, check_out: checkOut!, guests: guestCount }),
    enabled: datesReady,
    retry: false,
  });

  useEffect(() => {
    if (!datesOpen && !guestsOpen && !priceOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setDatesOpen(false);
        setGuestsOpen(false);
        setPriceOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [datesOpen, guestsOpen, priceOpen]);

  const quoteError =
    quote.error instanceof ApiError && (quote.error.status === 400 || quote.error.status === 409)
      ? quote.error.detail
      : null;
  const priced = quote.data;
  const reserveHref =
    checkIn && checkOut
      ? bookHref(listing.id, checkIn, checkOut, {
          adults: counts.adults,
          children: counts.children,
          infants: counts.infants,
          pets: counts.pets,
        })
      : "";

  const openDates = (focus: "check-in" | "check-out") => {
    setGuestsOpen(false);
    setPriceOpen(false);
    setDateFocus(focus);
    setDatesOpen(true);
  };

  return (
    <div ref={rootRef} className="relative">
      {/* Mobile — unchanged */}
      <div className="min-[1128px]:hidden rounded-3xl border border-hairline bg-white p-6 shadow-popover">
        <p>
          <span className="t-reserve-price">{formatInr(priced?.nightly_rate ?? listing.price_per_night)}</span>{" "}
          <span className="t-reserve-nights">
            {priced?.nights ? `for ${priced.nights} ${priced.nights === 1 ? "night" : "nights"}` : "night"}
          </span>
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-hairline">
          <div className="grid grid-cols-2">
            <button type="button" onClick={() => openDates("check-in")} className="border-r border-hairline px-3 py-2 text-left">
              <span className="t-field-label block">CHECK-IN</span>
              <span className="t-field-value">{checkIn ? formatShortDate(checkIn) : "Add date"}</span>
            </button>
            <button type="button" onClick={() => openDates("check-out")} className="px-3 py-2 text-left">
              <span className="t-field-label block">CHECKOUT</span>
              <span className="t-field-value">{checkOut ? formatShortDate(checkOut) : "Add date"}</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setDatesOpen(false);
              setGuestsOpen((open) => {
                if (!open) setCounts({ ...EMPTY_GUESTS, adults: guestCount });
                return !open;
              });
            }}
            className="flex w-full items-center justify-between border-t border-hairline px-3 py-2 text-left"
          >
            <span>
              <span className="t-field-label block">GUESTS</span>
              <span className="t-field-value">{guestCount === 1 ? "1 guest" : `${guestCount} guests`}</span>
            </span>
            {guestsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {datesOpen ? (
          <div className="dropdown-pop absolute right-0 z-30 mt-2 w-[min(680px,92vw)] rounded-3xl border border-hairline bg-white p-4 shadow-popover">
            <DateRangePicker checkIn={checkIn} checkOut={checkOut} disabledRanges={disabledRanges} onChange={onDatesChange} />
          </div>
        ) : null}
        {guestsOpen ? (
          <div className="dropdown-pop absolute right-0 z-30 mt-2 max-h-[min(440px,calc(100vh-6rem))] w-[min(360px,92vw)] overflow-y-auto overscroll-contain rounded-3xl border border-hairline bg-white p-4 shadow-popover">
            <GuestPicker
              value={counts}
              maxGuests={listing.max_guests}
              onChange={(next) => {
                const total = next.adults + next.children;
                if (total < 1 || total > listing.max_guests) return;
                setCounts(next);
                setStay({ guests: total });
              }}
            />
            <p className="mt-3 text-label text-muted">This place has a maximum of {listing.max_guests} guests, not including infants.</p>
          </div>
        ) : null}

        {quoteError ? <p className="mt-3 text-body text-rausch">{quoteError}</p> : null}

        {priced ? <StayPriceBreakdown quote={priced} totalLabel="Total before taxes" className="t-price-row mt-4" /> : null}

        {priced && !quoteError ? (
          <Link href={reserveHref} className="search-fill t-reserve-button mt-4 flex w-full items-center justify-center rounded-lg py-3">
            Reserve
          </Link>
        ) : (
          <Button className="mt-4 w-full py-3" onClick={() => openDates("check-in")}>
            {datesReady && quote.isFetching ? "Checking" : "Check availability"}
          </Button>
        )}
        <p className="t-reassure mt-3 text-center">You won&apos;t be charged yet</p>
        <p className="mt-2 text-center text-sm text-muted">{bookingModeLabel(listing.booking_mode)}</p>
      </div>

      {/* Desktop */}
      <div className="hidden min-[1128px]:block">
        <ReserveFeesBanner />
        <div className="relative rounded-[var(--r-12)] border border-hairline bg-white p-6 shadow-[var(--shadow-secondary)]">
          <div className="relative">
            {!datesReady || !priced ? (
              <p className="text-[22px] font-semibold leading-[26px] tracking-[-0.0275rem] text-ink">Add dates for prices</p>
            ) : (
              <button type="button" className="text-left" onClick={() => setPriceOpen((open) => !open)}>
                {priced.original_total > priced.total ? (
                  <span className="mr-2 text-lg text-muted line-through">{formatInr(priced.original_total)}</span>
                ) : null}
                <span className="t-reserve-price">{formatInr(priced.total)}</span>
                <span className="t-reserve-nights">
                  {" "}
                  for {priced.nights} {priced.nights === 1 ? "night" : "nights"}
                </span>
              </button>
            )}
            {priceOpen && priced ? <PriceDetailsPopover quote={priced} onClose={() => setPriceOpen(false)} /> : null}
          </div>

          <div ref={desktopFieldsRef} className="relative mt-5">
          <div className="overflow-hidden rounded-lg border border-hairline">
            <div className="grid grid-cols-2">
              <button
                type="button"
                onClick={() => openDates("check-in")}
                className={`border-r border-hairline px-4 py-3 text-left transition-shadow ${
                  datesOpen && dateFocus === "check-in" ? "shadow-[inset_0_0_0_2px_#222222]" : ""
                }`}
              >
                <span className="t-field-label block">CHECK-IN</span>
                <span className={`t-field-value ${!checkIn ? "text-muted" : ""}`}>{formatReserveInputDate(checkIn)}</span>
              </button>
              <button
                type="button"
                onClick={() => openDates("check-out")}
                className={`px-4 py-3 text-left transition-shadow ${
                  datesOpen && dateFocus === "check-out" ? "shadow-[inset_0_0_0_2px_#222222]" : ""
                }`}
              >
                <span className="t-field-label block">CHECKOUT</span>
                <span className={`t-field-value ${!checkOut ? "text-muted" : ""}`}>{formatReserveInputDate(checkOut)}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setDatesOpen(false);
                setPriceOpen(false);
                setGuestsOpen((open) => {
                  if (!open) setCounts({ ...EMPTY_GUESTS, adults: guestCount });
                  return !open;
                });
              }}
              className="flex w-full items-center justify-between border-t border-hairline px-4 py-3 text-left"
            >
              <span>
                <span className="t-field-label block">GUESTS</span>
                <span className="t-field-value">{guestCount === 1 ? "1 guest" : `${guestCount} guests`}</span>
              </span>
              {guestsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {datesOpen ? (
            <div
              className={`reserve-dates-popover dropdown-pop absolute right-0 z-50 overflow-x-hidden overflow-y-auto overscroll-contain rounded-[var(--r-16)] border border-hairline bg-white p-6 shadow-[var(--shadow-primary)] ${
                datesPopover.placement === "above" ? "bottom-full mb-3" : "top-full mt-3"
              }`}
              style={{ maxHeight: datesPopover.maxHeight }}
            >
              <div className="mb-4">
                <p className="text-lg font-semibold leading-6 text-ink">
                  {nights > 0 ? `${nights} ${nights === 1 ? "night" : "nights"}` : "Select dates"}
                </p>
                {checkIn && checkOut ? (
                  <p className="mt-1 text-sm leading-[18px] text-muted">{formatListingStaySubtitle(checkIn, checkOut)}</p>
                ) : null}
              </div>
              <div className="listing-dates">
                <DateRangePicker
                  checkIn={checkIn}
                  checkOut={checkOut}
                  disabledRanges={disabledRanges}
                  onChange={onDatesChange}
                  layout="listing-popover"
                  monthCount={2}
                  onClose={() => setDatesOpen(false)}
                />
              </div>
            </div>
          ) : null}

          {guestsOpen ? (
            <div
              className={`dropdown-pop absolute left-0 right-0 z-50 overflow-y-auto overscroll-contain rounded-[var(--r-16)] border border-hairline bg-white py-4 shadow-[var(--shadow-primary)] ${
                guestPopover.placement === "above" ? "bottom-full mb-3" : "top-full mt-3"
              }`}
              style={{ maxHeight: guestPopover.maxHeight }}
            >
              <GuestPicker
                value={counts}
                maxGuests={listing.max_guests}
                onChange={(next) => {
                  const total = next.adults + next.children;
                  if (total < 1 || total > listing.max_guests) return;
                  setCounts(next);
                  setStay({ guests: total });
                }}
              />
              <p className="px-6 text-xs leading-4 text-muted">
                This place has a maximum of {listing.max_guests} guests, not including infants. Pets aren&apos;t included in the guest
                count.
              </p>
              <div className="mt-2 flex justify-end px-6">
                <button
                  type="button"
                  className="text-sm font-semibold leading-[18px] text-ink underline decoration-1 underline-offset-2"
                  onClick={() => setGuestsOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          ) : null}
          </div>

          {quoteError ? <p className="mt-3 text-body text-rausch">{quoteError}</p> : null}

          {priced && !quoteError ? (
            <Link
              href={reserveHref}
              className="search-fill t-reserve-button mt-6 flex h-12 w-full items-center justify-center rounded-lg transition hover:opacity-95"
            >
              Reserve
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openDates("check-in")}
              className="search-fill t-reserve-button mt-6 flex h-12 w-full items-center justify-center rounded-lg transition hover:opacity-95"
            >
              {datesReady && quote.isFetching ? "Checking" : "Check availability"}
            </button>
          )}
          <p className="t-reassure mt-3 text-center text-muted">You won&apos;t be charged yet</p>
          <p className="mt-2 text-center text-sm leading-[18px] text-muted">{bookingModeLabel(listing.booking_mode)}</p>
        </div>
        <Link
          href="/coming-soon"
          className="mt-6 flex items-center justify-center gap-2 text-sm leading-[18px] text-muted underline decoration-1 underline-offset-2"
        >
          <Flag size={14} className="shrink-0" strokeWidth={1.75} />
          Report this listing
        </Link>
      </div>
    </div>
  );
}
