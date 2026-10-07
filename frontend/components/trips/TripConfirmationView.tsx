"use client";

import { useQuery } from "@tanstack/react-query";
import { listingsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { TravelPlansForm } from "@/components/trips/TravelPlansForm";
import { TripSidebarSummary } from "@/components/trips/TripSidebarSummary";
import { TripThingsToKnow } from "@/components/trips/TripThingsToKnow";
import type { BookingDetail } from "@/types";

export function TripConfirmationView({
  booking,
  mode,
}: {
  booking: BookingDetail;
  mode: "confirmed" | "requested";
}) {
  const { user } = useAuth();
  const listingQuery = useQuery({
    queryKey: ["listing", booking.listing_id],
    queryFn: () => listingsApi.get(booking.listing_id),
  });
  const listing = listingQuery.data;
  const maxCompanions = Math.max(0, (booking.adults ?? booking.num_guests) + (booking.children ?? 0) - 1);
  const approximate = listing?.location_is_approximate ?? true;

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-10 min-[1440px]:px-10">
      <div className="grid grid-cols-[minmax(0,1fr)_400px] gap-16">
        <div>
          {mode === "confirmed" ? (
            <>
              <h1 className="text-page font-semibold text-ink">Your reservation is confirmed!</h1>
              <p className="mt-2 text-body text-muted">
                We emailed the details to {user?.email ?? "your email"}.
              </p>
              {booking.status === "confirmed" ? (
                <TravelPlansForm bookingId={booking.id} maxCompanions={maxCompanions} />
              ) : null}
            </>
          ) : (
            <>
              <h1 className="text-page font-semibold text-ink">Your request has been sent</h1>
              <p className="mt-2 max-w-xl text-body text-muted">
                {booking.host.name} has 24 hours to respond. You won&apos;t be charged if they decline.
              </p>
            </>
          )}
          {listing ? <TripThingsToKnow listing={listing} /> : null}
        </div>
        <TripSidebarSummary
          booking={booking}
          statusPill={mode === "requested" ? "Pending" : undefined}
          approximateAddressNote={approximate && mode === "confirmed"}
        />
      </div>
    </div>
  );
}
