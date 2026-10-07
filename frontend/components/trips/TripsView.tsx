"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SwitchUserModal } from "@/components/auth/SwitchUserModal";
import { GlideUnderline } from "@/components/ui/Glide";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import { ApiError, bookingsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDateRange } from "@/lib/format";
import type { Booking } from "@/types";

type TripTab = "upcoming" | "past" | "cancelled";

const TABS: { id: TripTab; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "cancelled", label: "Cancelled" },
];

export function TripsView() {
  const { user, isLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [tab, setTab] = useState<TripTab>("upcoming");
  const [review, setReview] = useState<Booking | null>(null);
  const [reviewed, setReviewed] = useState<number[]>([]);
  const trips = useQuery({
    queryKey: ["trips", user?.id],
    queryFn: bookingsApi.mine,
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!isLoading && !user) setAuthOpen(true);
  }, [isLoading, user]);

  if (!user) {
    return (
      <main className="container-airbnb py-16">
        <h1 className="t-page-title">Trips</h1>
        <p className="mt-3 text-meta text-muted">Log in to see your trips.</p>
        <button type="button" className="mt-4 t-link" onClick={() => setAuthOpen(true)}>
          Switch user
        </button>
        <SwitchUserModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </main>
    );
  }

  const data = trips.data;
  const items = data?.[tab] ?? [];
  const empty = data && data.upcoming.length + data.past.length + data.cancelled.length === 0;

  return (
    <main className="container-airbnb py-10">
      <h1 className="t-page-title">Trips</h1>
      {trips.isLoading ? <p className="mt-8 text-meta text-muted">Loading trips</p> : null}
      {trips.error instanceof ApiError ? <p className="mt-8 text-body text-rausch">{trips.error.detail}</p> : null}
      {empty ? (
        <div className="py-20">
          <h2 className="t-subheading">No trips booked...yet!</h2>
          <p className="mt-2 max-w-md text-meta text-muted">Time to dust off your bags and start planning your next adventure.</p>
          <Link href="/" className="mt-6 inline-flex rounded-lg bg-ink px-5 py-3 t-button text-white">
            Start searching
          </Link>
        </div>
      ) : data ? (
        <>
          <GlideUnderline active={tab} className="mt-6 flex gap-6 border-b border-hairline">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                data-glide={item.id}
                onClick={() => setTab(item.id)}
                className={`relative z-10 pb-3 text-body font-semibold transition-colors duration-200 ${tab === item.id ? "text-ink" : "text-muted"}`}
              >
                {item.label}
              </button>
            ))}
          </GlideUnderline>
          {items.length === 0 ? <p className="py-16 text-meta text-muted">Nothing in {tab} yet.</p> : null}
          <div className="mt-6 flex flex-col gap-4">
            {items.map((trip) => (
              <div key={trip.id} className="flex flex-wrap items-center gap-4 rounded-xl p-2 hover:bg-soft">
                <Link href={`/trips/${trip.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-soft">
                    {trip.listing.cover_image ? (
                      <Image src={trip.listing.cover_image} alt="" fill className="object-cover" sizes="96px" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{trip.listing.city}</p>
                    <p className="text-meta text-muted">Hosted by {trip.listing.host_name}</p>
                    <p className="text-body text-ink">{formatDateRange(trip.check_in, trip.check_out)}</p>
                    {trip.status === "cancelled" ? (
                      <span className="mt-1 inline-block rounded-full bg-soft px-2 py-0.5 text-label font-semibold">Cancelled</span>
                    ) : null}
                  </div>
                </Link>
                {tab === "past" && !reviewed.includes(trip.id) ? (
                  <button type="button" className="t-link" onClick={() => setReview(trip)}>
                    Write a review
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </>
      ) : null}
      {review ? (
        <ReviewModal
          open
          bookingId={review.id}
          listingId={review.listing_id}
          onClose={() => setReview(null)}
          onSaved={() => setReviewed((current) => [...current, review.id])}
        />
      ) : null}
      <SwitchUserModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </main>
  );
}
