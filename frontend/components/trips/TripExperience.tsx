"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SwitchUserModal } from "@/components/auth/SwitchUserModal";
import { TripConfirmationView } from "@/components/trips/TripConfirmationView";
import { TripReservationView } from "@/components/trips/TripReservationView";
import { ApiError, bookingsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function TripExperience({ bookingId }: { bookingId: number }) {
  const searchParams = useSearchParams();
  const confirmed = searchParams.get("confirmed") === "1";
  const requested = searchParams.get("requested") === "1";
  const { user, isLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const bookingQuery = useQuery({
    queryKey: ["booking", bookingId, user?.id],
    queryFn: () => bookingsApi.get(bookingId),
    enabled: Boolean(user),
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !user) setAuthOpen(true);
  }, [isLoading, user]);

  if (!user) {
    return (
      <main className="container-airbnb py-16">
        <p className="text-meta text-muted">Log in to see this trip.</p>
        <SwitchUserModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </main>
    );
  }

  const error = bookingQuery.error;
  if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
    return (
      <main className="container-airbnb py-16">
        <h1 className="text-page font-semibold">{error.status === 404 ? "We can't find that reservation" : "You can't view this reservation"}</h1>
        <Link href="/trips" className="mt-4 inline-block underline">
          Back to trips
        </Link>
      </main>
    );
  }

  const booking = bookingQuery.data;
  if (!booking) {
    return <main className="container-airbnb py-16 text-muted">{bookingQuery.isError ? "Could not load" : "Loading…"}</main>;
  }

  if (confirmed && booking.status === "confirmed") {
    return <TripConfirmationView booking={booking} mode="confirmed" />;
  }
  if (requested && booking.status === "pending") {
    return <TripConfirmationView booking={booking} mode="requested" />;
  }

  return <TripReservationView booking={booking} />;
}
