"use client";

import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, parseISO } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SwitchUserModal } from "@/components/auth/SwitchUserModal";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import dynamic from "next/dynamic";

const TripsMap = dynamic(() => import("@/components/trips/TripsMap").then((m) => m.TripsMap), {
  ssr: false,
  loading: () => <div className="h-full min-h-[400px] w-full animate-pulse rounded-2xl bg-soft" />,
});
import { WithdrawRequestModal } from "@/components/trips/WithdrawRequestModal";
import { ApiError, bookingsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDateRange, formatInr } from "@/lib/format";
import { pendingExpiresLabel } from "@/lib/trips/pendingExpiry";
import type { Booking } from "@/types";

function nights(checkIn: string, checkOut: string): number {
  return differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
}

function statusPill(status: string): string {
  if (status === "confirmed") return "Confirmed";
  if (status === "pending") return "Awaiting host";
  if (status === "declined") return "Declined";
  if (status === "expired") return "Expired";
  return "Cancelled";
}

export function TripsView() {
  const { user, isLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [review, setReview] = useState<Booking | null>(null);
  const [withdrawId, setWithdrawId] = useState<number | null>(null);

  const trips = useQuery({
    queryKey: ["trips", user?.id],
    queryFn: bookingsApi.mine,
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!isLoading && !user) setAuthOpen(true);
  }, [isLoading, user]);

  const data = trips.data;
  const allTrips = useMemo(
    () => [...(data?.pending ?? []), ...(data?.upcoming ?? []), ...(data?.past ?? []), ...(data?.cancelled ?? [])],
    [data],
  );
  const empty = data && data.pending.length + data.upcoming.length + data.past.length + data.cancelled.length === 0;

  if (!user) {
    return (
      <main className="container-airbnb py-16">
        <h1 className="text-page font-semibold">Trips</h1>
        <button type="button" className="mt-4 underline" onClick={() => setAuthOpen(true)}>
          Log in
        </button>
        <SwitchUserModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </main>
    );
  }

  const listPanel = (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8 min-[1128px]:px-10">
      <h1 className="text-center text-page font-semibold text-ink min-[1128px]:text-left">Trips</h1>
      {trips.isLoading ? <p className="mt-8 text-muted">Loading trips…</p> : null}
      {trips.error instanceof ApiError ? <p className="mt-8 text-error">{trips.error.detail}</p> : null}

      {empty ? (
        <div className="flex flex-col items-center py-16 text-center min-[1128px]:items-start min-[1128px]:text-left">
          <div className="relative flex h-40 w-56 items-end justify-center">
            <img src="/icons/promo-beachfront.png" alt="" className="absolute left-0 h-24 w-24 object-contain" />
            <img src="/icons/promo-guest-favourites.png" alt="" className="relative z-10 h-32 w-32 object-contain" />
            <img src="/icons/promo-first-stay.png" alt="" className="absolute right-0 h-20 w-20 object-contain" />
          </div>
          <h2 className="mt-8 text-section font-semibold text-ink">Map out your next trip</h2>
          <p className="mt-2 max-w-md text-body text-muted">
            After you book a trip, experience or service, come back here to see details, explore the map and save places
            to visit.
          </p>
          <Link href="/" className="search-fill mt-8 rounded-lg px-6 py-3.5 text-body font-semibold text-white">
            Get started
          </Link>
        </div>
      ) : null}

      {data && !empty ? (
        <div className="mt-8 space-y-10">
          {data.pending.length > 0 ? (
            <section>
              <h2 className="text-body font-semibold text-ink">Pending requests</h2>
              <div className="mt-4 space-y-4">
                {data.pending.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    large
                    highlightId={highlightId}
                    onHover={setHighlightId}
                    extra={
                      <>
                        <span className="rounded-full bg-soft px-2 py-0.5 text-label font-semibold">
                          {pendingExpiresLabel(trip.created_at)}
                        </span>
                        <button type="button" className="text-body underline" onClick={() => setWithdrawId(trip.id)}>
                          Withdraw request
                        </button>
                      </>
                    }
                  />
                ))}
              </div>
            </section>
          ) : null}

          {data.upcoming.length > 0 ? (
            <section>
              <h2 className="text-body font-semibold text-ink">Upcoming reservations</h2>
              <div className="mt-4 space-y-4">
                {data.upcoming.map((trip) => (
                  <TripCard key={trip.id} trip={trip} large highlightId={highlightId} onHover={setHighlightId} />
                ))}
              </div>
            </section>
          ) : null}

          {data.past.length > 0 ? (
            <section>
              <h2 className="text-body font-semibold text-ink">Where you&apos;ve been</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {data.past.map((trip) => (
                  <div key={trip.id} className="space-y-2">
                    <TripCard trip={trip} highlightId={highlightId} onHover={setHighlightId} compact />
                    {trip.can_review ? (
                      <button type="button" className="text-body underline" onClick={() => setReview(trip)}>
                        Write a review
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {data.cancelled.length > 0 ? (
            <section>
              <h2 className="text-body font-semibold text-muted">Cancelled</h2>
              <div className="mt-4 grid gap-4 opacity-75 sm:grid-cols-2">
                {data.cancelled.map((trip) => (
                  <TripCard key={trip.id} trip={trip} highlightId={highlightId} onHover={setHighlightId} compact greyed />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <div className="hidden min-[1128px]:flex" style={{ height: "calc(100vh - var(--header-h) - 1px)" }}>
        <div className="flex w-[58%] min-w-0 flex-col border-r border-divider">{listPanel}</div>
        <div className="sticky top-[calc(var(--header-h)+1px)] w-[42%] p-6">
          <TripsMap trips={allTrips} empty={Boolean(empty)} highlightId={highlightId} onHover={setHighlightId} />
        </div>
      </div>
      <div className="min-[1128px]:hidden">{listPanel}</div>

      {review ? (
        <ReviewModal
          open
          bookingId={review.id}
          listingId={review.listing_id}
          onClose={() => setReview(null)}
        />
      ) : null}
      {withdrawId ? (
        <WithdrawRequestModal open onClose={() => setWithdrawId(null)} bookingId={withdrawId} />
      ) : null}
      <SwitchUserModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

function TripCard({
  trip,
  large,
  compact,
  greyed,
  highlightId,
  onHover,
  extra,
}: {
  trip: Booking;
  large?: boolean;
  compact?: boolean;
  greyed?: boolean;
  highlightId: number | null;
  onHover: (id: number | null) => void;
  extra?: ReactNode;
}) {
  const active = highlightId === trip.id;
  return (
    <Link
      href={`/trips/${trip.id}`}
      onMouseEnter={() => onHover(trip.id)}
      onMouseLeave={() => onHover(null)}
      className={`block overflow-hidden rounded-2xl border border-hairline transition-shadow ${active ? "shadow-primary ring-2 ring-ink/10" : ""} ${greyed ? "opacity-80" : ""}`}
    >
      <div className={large ? "relative aspect-[16/10] bg-soft" : "relative aspect-[4/3] bg-soft"}>
        {trip.listing.cover_image ? (
          <Image src={trip.listing.cover_image} alt="" fill className="object-cover" sizes={large ? "400px" : "200px"} />
        ) : null}
        <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-label font-semibold">
          {statusPill(trip.status)}
        </span>
      </div>
      <div className="p-4">
        <p className="font-semibold text-ink">{trip.listing.city}</p>
        <p className="text-meta text-muted">Hosted by {trip.listing.host_name}</p>
        <p className="mt-1 text-body text-ink">
          {formatDateRange(trip.check_in, trip.check_out)}
          {!compact ? ` · ${nights(trip.check_in, trip.check_out)} nights` : null}
        </p>
        {!compact ? (
          <p className="mt-1 text-body font-medium">
            {greyed && trip.refund_amount != null ? `Refund ${formatInr(trip.refund_amount)}` : formatInr(trip.total_price)}
          </p>
        ) : null}
        {extra ? <div className="mt-3 flex flex-wrap items-center gap-3">{extra}</div> : null}
      </div>
    </Link>
  );
}
