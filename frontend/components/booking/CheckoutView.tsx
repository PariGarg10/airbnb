"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, parseISO, startOfToday } from "date-fns";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SwitchUserModal } from "@/components/auth/SwitchUserModal";
import { DateRangePicker, type DisabledRange } from "@/components/search/DateRangePicker";
import { GuestPicker, type GuestCounts } from "@/components/search/GuestPicker";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { Modal } from "@/components/ui/Modal";
import { useStayParams } from "@/hooks/useStayParams";
import { ApiError, bookingsApi, listingsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { StayPriceBreakdown } from "@/components/pricing/StayPriceBreakdown";
import { formatDateRange, formatGuests, formatRating, formatShortDate, roomTypeLabel } from "@/lib/format";
import type { BookedRange } from "@/types";

const COUNTRIES = ["India", "United States", "United Kingdom", "Canada", "Australia", "Singapore", "United Arab Emirates"];

interface CheckoutViewProps {
  listingId: number;
}

function blockedRanges(booked: BookedRange[]): DisabledRange[] {
  return booked.flatMap((range) => {
    const from = parseISO(range.check_in);
    const to = addDays(parseISO(range.check_out), -1);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return [];
    return [{ from, to }];
  });
}

function overlapsBooked(checkIn: string, checkOut: string, booked: BookedRange[]): boolean {
  const start = parseISO(checkIn).getTime();
  const end = parseISO(checkOut).getTime();
  return booked.some((range) => start < parseISO(range.check_out).getTime() && parseISO(range.check_in).getTime() < end);
}

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

function cardValid(number: string, expiry: string, cvv: string, zip: string, country: string): boolean {
  if (digits(number).length !== 16) return false;
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!match) return false;
  const month = Number(match[1]);
  if (month < 1 || month > 12) return false;
  const end = new Date(2000 + Number(match[2]), month, 0);
  if (end < startOfToday()) return false;
  if (!/^\d{3,4}$/.test(cvv)) return false;
  if (!/^[A-Za-z0-9 -]{3,10}$/.test(zip)) return false;
  if (!country) return false;
  return true;
}

export function CheckoutView({ listingId }: CheckoutViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading } = useAuth();
  const { checkIn, checkOut, guests, setStay } = useStayParams();
  const [authOpen, setAuthOpen] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [draftIn, setDraftIn] = useState<string | undefined>(checkIn);
  const [draftOut, setDraftOut] = useState<string | undefined>(checkOut);
  const [draftGuests, setDraftGuests] = useState<GuestCounts>({ adults: guests ?? 1, children: 0, infants: 0, pets: 0 });
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", zip: "", country: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const listingQuery = useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => listingsApi.get(listingId),
  });
  const booked = useQuery({
    queryKey: ["booked-dates", listingId],
    queryFn: () => listingsApi.bookedDates(listingId),
  });
  const guestCount = guests ?? 0;
  const quote = useQuery({
    queryKey: ["quote", listingId, checkIn, checkOut, guestCount],
    queryFn: () => listingsApi.quote(listingId, { check_in: checkIn ?? "", check_out: checkOut ?? "", guests: guestCount }),
    enabled: Boolean(checkIn && checkOut && guestCount >= 1),
    retry: false,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!isLoading && !user) setAuthOpen(true);
  }, [isLoading, user]);

  const book = useMutation({
    mutationFn: () =>
      bookingsApi.create({
        listing_id: listingId,
        check_in: checkIn ?? "",
        check_out: checkOut ?? "",
        num_guests: guestCount,
      }),
    onSuccess: async (booking) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["booked-dates", listingId] }),
        queryClient.invalidateQueries({ queryKey: ["quote"] }),
        queryClient.invalidateQueries({ queryKey: ["trips"] }),
      ]);
      router.push(`/trips/${booking.id}?confirmed=1`);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error("Those dates were just booked");
        const params = new URLSearchParams();
        if (checkIn) params.set("check_in", checkIn);
        if (checkOut) params.set("check_out", checkOut);
        if (guestCount) params.set("guests", String(guestCount));
        const query = params.toString();
        router.push(`/listings/${listingId}${query ? `?${query}` : ""}`);
        return;
      }
      toast.error(error instanceof ApiError ? error.detail : "Could not complete booking");
    },
  });

  const listing = listingQuery.data;
  if (listingQuery.error instanceof ApiError && listingQuery.error.status === 404) notFound();

  const quoteError = quote.error instanceof ApiError ? quote.error.detail : null;
  const ownListing = Boolean(user && listing && user.id === listing.host.id);
  const formOk = cardValid(card.number, card.expiry, card.cvv, card.zip, card.country);
  const priced = quote.data;

  const backParams = new URLSearchParams();
  if (checkIn) backParams.set("check_in", checkIn);
  if (checkOut) backParams.set("check_out", checkOut);
  if (guestCount) backParams.set("guests", String(guestCount));
  const backHref = `/listings/${listingId}${backParams.toString() ? `?${backParams}` : ""}`;
  const canPay = Boolean(user && !ownListing && priced && !quoteError && formOk && !book.isPending);

  const fieldError = (key: string, message: string) => (touched[key] ? <p className="mt-1 text-label text-rausch">{message}</p> : null);

  const saveDates = () => {
    if (draftIn && draftOut && overlapsBooked(draftIn, draftOut, booked.data ?? [])) {
      toast.error("These dates are already booked");
      return;
    }
    setStay({ check_in: draftIn ?? null, check_out: draftOut ?? null });
    setDatesOpen(false);
  };

  return (
    <div className="container-airbnb py-8">
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[minmax(0,1.15fr)_380px]">
        <div>
          <div className="flex items-center gap-4">
            <Link href={backHref} aria-label="Back to listing" className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline hover:bg-soft">
              <ChevronLeft size={18} />
            </Link>
            <h1 className="t-page-title">Confirm and pay</h1>
          </div>

          <section className="mt-8">
            <h2 className="t-subheading">Your trip</h2>
            <div className="mt-4 flex items-start justify-between gap-4 py-3">
              <div>
                <p className="t-row-label">Dates</p>
                <p className="t-row-value">{checkIn && checkOut ? formatDateRange(checkIn, checkOut) : "Add dates"}</p>
              </div>
              <button
                type="button"
                className="t-link"
                onClick={() => {
                  setDraftIn(checkIn);
                  setDraftOut(checkOut);
                  setDatesOpen(true);
                }}
              >
                Edit
              </button>
            </div>
            <div className="flex items-start justify-between gap-4 border-t border-hairline py-3">
              <div>
                <p className="t-row-label">Guests</p>
                <p className="t-row-value">{guestCount >= 1 ? formatGuests(guestCount) : "Add guests"}</p>
              </div>
              <button
                type="button"
                className="t-link"
                onClick={() => {
                  setDraftGuests({ adults: Math.max(1, guestCount), children: 0, infants: 0, pets: 0 });
                  setGuestsOpen(true);
                }}
              >
                Edit
              </button>
            </div>
          </section>

          <Divider className="my-6" />
          <section>
            <h2 className="t-subheading">Pay with</h2>
            <div className="mt-4 grid gap-3">
              <label className="text-label font-semibold text-muted">
                Card number
                <input
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={card.number}
                  onBlur={() => setTouched((current) => ({ ...current, number: true }))}
                  onChange={(event) => {
                    const next = digits(event.target.value).slice(0, 16);
                    setCard({ ...card, number: next.replace(/(\d{4})(?=\d)/g, "$1 ").trim() });
                  }}
                  className="mt-1 w-full rounded-xl border border-hairline px-3 py-3 text-body font-normal text-ink outline-none focus:border-ink"
                />
                {digits(card.number).length !== 16 ? fieldError("number", "Enter a 16-digit card number") : null}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-label font-semibold text-muted">
                  Expiry
                  <input
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/YY"
                    value={card.expiry}
                    onBlur={() => setTouched((current) => ({ ...current, expiry: true }))}
                    onChange={(event) => {
                      const next = digits(event.target.value).slice(0, 4);
                      setCard({ ...card, expiry: next.length <= 2 ? next : `${next.slice(0, 2)}/${next.slice(2)}` });
                    }}
                    className="mt-1 w-full rounded-xl border border-hairline px-3 py-3 text-body font-normal text-ink outline-none focus:border-ink"
                  />
                  {!/^(\d{2})\/(\d{2})$/.test(card.expiry) ? fieldError("expiry", "Use MM/YY") : null}
                </label>
                <label className="text-label font-semibold text-muted">
                  CVV
                  <input
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={card.cvv}
                    onBlur={() => setTouched((current) => ({ ...current, cvv: true }))}
                    onChange={(event) => setCard({ ...card, cvv: digits(event.target.value).slice(0, 4) })}
                    className="mt-1 w-full rounded-xl border border-hairline px-3 py-3 text-body font-normal text-ink outline-none focus:border-ink"
                  />
                  {!/^\d{3,4}$/.test(card.cvv) ? fieldError("cvv", "3 or 4 digits") : null}
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-label font-semibold text-muted">
                  ZIP
                  <input
                    value={card.zip}
                    onBlur={() => setTouched((current) => ({ ...current, zip: true }))}
                    onChange={(event) => setCard({ ...card, zip: event.target.value.slice(0, 10) })}
                    className="mt-1 w-full rounded-xl border border-hairline px-3 py-3 text-body font-normal text-ink outline-none focus:border-ink"
                  />
                  {!/^[A-Za-z0-9 -]{3,10}$/.test(card.zip) ? fieldError("zip", "Enter a ZIP code") : null}
                </label>
                <label className="text-label font-semibold text-muted">
                  Country
                  <select
                    value={card.country}
                    onBlur={() => setTouched((current) => ({ ...current, country: true }))}
                    onChange={(event) => setCard({ ...card, country: event.target.value })}
                    className="mt-1 w-full rounded-xl border border-hairline px-3 py-3 text-body font-normal text-ink outline-none focus:border-ink"
                  >
                    <option value="">Select</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                  {!card.country ? fieldError("country", "Choose a country") : null}
                </label>
              </div>
            </div>
            <p className="mt-3 text-meta text-muted">Payments are simulated — you won&apos;t be charged</p>
          </section>

          <Divider className="my-6" />
          <section>
            <h2 className="t-subheading">Cancellation policy</h2>
            <p className="t-body mt-2">
              Free cancellation before {checkIn ? formatShortDate(checkIn) : "check-in"}.
            </p>
          </section>
          <Divider className="my-6" />
          <section>
            <h2 className="t-subheading">Ground rules</h2>
            <ul className="t-body mt-2 list-disc space-y-1 pl-5">
              <li>Follow the house rules</li>
              <li>Treat the home with care</li>
              <li>Keep noise down for the neighbours</li>
            </ul>
          </section>

          {ownListing ? <p className="mt-6 text-body font-semibold text-ink">You can&apos;t book your own listing</p> : null}
          {!user && !isLoading ? (
            <button type="button" className="t-link mt-4" onClick={() => setAuthOpen(true)}>
              Log in to book
            </button>
          ) : null}
          {quoteError ? <p className="mt-4 text-body text-rausch">{quoteError}</p> : null}

          <Button className="mt-6 w-full py-3" disabled={!canPay} onClick={() => book.mutate()}>
            {book.isPending ? "Confirming" : "Confirm and pay"}
          </Button>
        </div>

        <aside className="h-fit rounded-3xl border border-hairline p-6 shadow-popover lg:sticky lg:top-28">
          {listing ? (
            <div className="flex gap-4">
              <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-2xl bg-soft">
                {listing.images[0] ? <Image src={listing.images[0].url} alt="" fill className="object-cover" sizes="112px" /> : null}
              </div>
              <div>
                <p className="font-semibold text-ink">{listing.title}</p>
                <p className="text-meta text-muted">{roomTypeLabel(listing.room_type)}</p>
                {listing.review_count > 0 ? (
                  <p className="mt-1 text-body">★ {formatRating(listing.avg_rating)} ({listing.review_count})</p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-meta text-muted">Loading stay</p>
          )}
          <Divider className="my-4" />
          <h2 className="font-semibold">Price details</h2>
          {priced && !quoteError ? (
            <StayPriceBreakdown quote={priced} className="t-price-row mt-3" />
          ) : (
            <p className="mt-3 text-meta text-muted">{quote.isFetching ? "Calculating price" : "Add dates and guests to see the total"}</p>
          )}
        </aside>
      </div>

      <Modal
        open={datesOpen}
        title="Dates"
        onClose={() => setDatesOpen(false)}
        size="lg"
      >
        <DateRangePicker
          checkIn={draftIn}
          checkOut={draftOut}
          disabledRanges={blockedRanges(booked.data ?? [])}
          onChange={(nextIn, nextOut) => {
            setDraftIn(nextIn);
            setDraftOut(nextOut);
          }}
        />
        <Button className="mt-4" disabled={!draftIn || !draftOut} onClick={saveDates}>
          Save
        </Button>
      </Modal>
      <Modal open={guestsOpen} title="Guests" onClose={() => setGuestsOpen(false)}>
        <GuestPicker
          value={draftGuests}
          maxGuests={listing?.max_guests}
          onChange={setDraftGuests}
        />
        <Button
          className="mt-4"
          onClick={() => {
            const total = draftGuests.adults + draftGuests.children;
            if (total < 1) return;
            setStay({ guests: total });
            setGuestsOpen(false);
          }}
        >
          Save
        </Button>
      </Modal>
      <SwitchUserModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
