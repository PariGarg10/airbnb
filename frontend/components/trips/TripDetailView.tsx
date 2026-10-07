"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, startOfToday } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StayPriceBreakdown } from "@/components/pricing/StayPriceBreakdown";
import { SwitchUserModal } from "@/components/auth/SwitchUserModal";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { Modal } from "@/components/ui/Modal";
import { ApiError, bookingsApi, listingsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDateRange, formatGuests } from "@/lib/format";

interface TripDetailViewProps {
  bookingId: number;
}

function canCancel(status: string, checkIn: string, guestId: number, userId?: number): boolean {
  if (!userId || guestId !== userId || status !== "confirmed") return false;
  const start = parseISO(checkIn);
  return !Number.isNaN(start.getTime()) && start > startOfToday();
}

export function TripDetailView({ bookingId }: TripDetailViewProps) {
  const searchParams = useSearchParams();
  const confirmed = searchParams.get("confirmed") === "1";
  const queryClient = useQueryClient();
  const { user, isLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const bookingQuery = useQuery({
    queryKey: ["booking", bookingId, user?.id],
    queryFn: () => bookingsApi.get(bookingId),
    enabled: Boolean(user),
    retry: false,
  });
  const booking = bookingQuery.data;
  const listingQuery = useQuery({
    queryKey: ["listing", booking?.listing_id],
    queryFn: () => listingsApi.get(booking!.listing_id),
    enabled: Boolean(booking),
  });
  const quoteQuery = useQuery({
    queryKey: ["quote", booking?.listing_id, booking?.check_in, booking?.check_out, booking?.num_guests],
    queryFn: () =>
      listingsApi.quote(booking!.listing_id, {
        check_in: booking!.check_in,
        check_out: booking!.check_out,
        guests: booking!.num_guests,
      }),
    enabled: Boolean(booking),
  });

  useEffect(() => {
    if (!isLoading && !user) setAuthOpen(true);
  }, [isLoading, user]);

  const cancel = useMutation({
    mutationFn: () => bookingsApi.cancel(bookingId),
    onSuccess: async (updated) => {
      queryClient.setQueryData(["booking", bookingId, user?.id], updated);
      toast.success("Reservation cancelled");
      setCancelOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trips"] }),
        queryClient.invalidateQueries({ queryKey: ["booked-dates", updated.listing_id] }),
        queryClient.invalidateQueries({ queryKey: ["booking", bookingId] }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.detail : "Could not cancel reservation");
    },
  });

  if (!user) {
    return (
      <main className="container-airbnb py-16">
        <h1 className="t-page-title">Your reservation</h1>
        <p className="mt-3 text-meta text-muted">Log in to see this trip.</p>
        <button type="button" className="mt-4 t-link" onClick={() => setAuthOpen(true)}>
          Switch user
        </button>
        <SwitchUserModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </main>
    );
  }

  const error = bookingQuery.error;
  if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
    return (
      <main className="container-airbnb py-16">
        <h1 className="t-page-title">{error.status === 404 ? "We can't find that reservation" : "You can't view this reservation"}</h1>
        <p className="mt-2 text-meta text-muted">{error.detail}</p>
        <Link href="/trips" className="mt-4 inline-block t-link">
          Back to trips
        </Link>
      </main>
    );
  }

  if (!booking) {
    return <main className="container-airbnb py-16 text-meta text-muted">{bookingQuery.isError ? "Could not load this reservation" : "Loading reservation"}</main>;
  }

  const checkIn = parseISO(booking.check_in);
  const checkOut = parseISO(booking.check_out);
  const host = listingQuery.data?.host;
  return (
    <main className="container-airbnb max-w-3xl py-10">
      {confirmed && booking.status === "confirmed" ? (
        <div className="mb-8 flex items-start gap-3 rounded-xl bg-green-50 p-4">
          <CheckCircle2 className="mt-0.5 text-green-600" />
          <div>
            <p className="text-lg font-semibold">You&apos;re going to {booking.listing.city}!</p>
            <p className="text-body text-ink">Reservation confirmed</p>
          </div>
        </div>
      ) : (
        <h1 className="t-page-title mb-8">Your reservation</h1>
      )}

      <Link href={`/listings/${booking.listing_id}`} className="flex items-center gap-4">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-2xl bg-soft">
          {booking.listing.cover_image ? <Image src={booking.listing.cover_image} alt="" fill className="object-cover" sizes="128px" /> : null}
        </div>
        <div>
          <p className="font-semibold">{booking.listing.title}</p>
          <p className="text-meta text-muted">{booking.listing.city}, {booking.listing.country}</p>
        </div>
      </Link>

      <Divider className="my-6" />
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="t-row-label">Check-in</p>
          <p className="t-row-value">{format(checkIn, "EEE, MMM d, yyyy")}</p>
          <p className="text-meta text-muted">2:00 pm</p>
        </div>
        <div>
          <p className="t-row-label">Checkout</p>
          <p className="t-row-value">{format(checkOut, "EEE, MMM d, yyyy")}</p>
          <p className="text-meta text-muted">11:00 am</p>
        </div>
        <div>
          <p className="t-row-label">Guests</p>
          <p className="t-row-value">{formatGuests(booking.num_guests)}</p>
        </div>
        <div>
          <p className="t-row-label">Confirmation code</p>
          <p className="t-row-value">HM{String(booking.id).padStart(8, "0")}</p>
        </div>
      </div>

      <Divider className="my-6" />
      <h2 className="font-semibold">Price details</h2>
      {quoteQuery.data ? (
        <StayPriceBreakdown
          quote={quoteQuery.data}
          className="t-price-row mt-3"
          totalOverride={booking.total_price}
          originalTotalOverride={booking.original_total}
        />
      ) : (
        <p className="mt-3 text-meta text-muted">{quoteQuery.isLoading ? "Loading price breakdown" : "Price breakdown unavailable"}</p>
      )}
      <p className="mt-2 text-meta text-muted">{formatDateRange(booking.check_in, booking.check_out)}</p>

      <Divider className="my-6" />
      <div className="flex items-center gap-4">
        <Avatar name={host?.name ?? booking.listing.host_name} src={host?.avatar_url} size={56} />
        <div>
          <p className="text-meta text-muted">Hosted by</p>
          <p className="font-semibold">{host?.name ?? booking.listing.host_name}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {canCancel(booking.status, booking.check_in, booking.guest_id, user.id) ? (
          <Button variant="outline" onClick={() => setCancelOpen(true)}>
            Cancel reservation
          </Button>
        ) : null}
        {booking.can_review ? (
          <Button variant="outline" onClick={() => setReviewOpen(true)}>
            Write a review
          </Button>
        ) : null}
      </div>

      <Modal open={cancelOpen} title="Cancel reservation" onClose={() => setCancelOpen(false)}>
        <p className="text-body">This will cancel your stay in {booking.listing.city}. This cannot be undone.</p>
        <Button className="mt-4 w-full" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
          {cancel.isPending ? "Cancelling" : "Cancel reservation"}
        </Button>
      </Modal>
      <ReviewModal open={reviewOpen} bookingId={booking.id} listingId={booking.listing_id} onClose={() => setReviewOpen(false)} />
      <SwitchUserModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </main>
  );
}
