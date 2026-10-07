"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Calendar, Copy, MapPin, MessageSquare, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import { TripReceiptModal } from "@/components/trips/TripReceiptModal";
import { WithdrawRequestModal } from "@/components/trips/WithdrawRequestModal";

const TripsMap = dynamic(() => import("@/components/trips/TripsMap").then((m) => m.TripsMap), {
  ssr: false,
  loading: () => <div className="h-full min-h-[240px] w-full animate-pulse rounded-2xl bg-soft" />,
});
import { listingsApi } from "@/lib/api";
import { formatCheckoutGuestSummary, formatInr } from "@/lib/format";
import type { BookingDetail } from "@/types";

function paymentLabel(booking: BookingDetail): string {
  if (booking.payment_method_type === "card" && booking.card_brand && booking.card_last4) {
    return `${booking.card_brand} •••• ${booking.card_last4}`;
  }
  if (booking.payment_method_type === "upi") return "UPI";
  if (booking.payment_method_type === "netbanking") return "Net banking";
  return "—";
}

function statusPill(status: string): string | null {
  if (status === "confirmed") return "Confirmed";
  if (status === "pending") return "Pending";
  if (status === "declined") return "Declined";
  if (status === "expired") return "Expired";
  if (status === "cancelled") return "Cancelled";
  return null;
}

export function TripReservationView({ booking }: { booking: BookingDetail }) {
  const router = useRouter();
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const listingQuery = useQuery({
    queryKey: ["listing", booking.listing_id],
    queryFn: () => listingsApi.get(booking.listing_id),
  });
  const listing = listingQuery.data;
  const pill = statusPill(booking.status);
  const guests = formatCheckoutGuestSummary(
    booking.adults ?? booking.num_guests,
    booking.children ?? 0,
    booking.infants ?? 0,
    booking.pets ?? 0,
  );
  const address =
    booking.listing.address ??
    (booking.status === "confirmed" ? null : "Exact address shared after the host accepts");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${booking.listing.lat},${booking.listing.lng}`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(booking.confirmation_code);
      toast.success("Copied reservation code");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 min-[1440px]:px-10">
      <div className="grid grid-cols-[minmax(0,560px)_1fr] gap-12">
        <div className="min-w-0">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-soft">
            {booking.listing.cover_image ? (
              <Image src={booking.listing.cover_image} alt="" fill className="object-cover" sizes="560px" />
            ) : null}
            {pill ? (
              <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-label font-semibold shadow-sm">
                {pill}
              </span>
            ) : null}
          </div>
          <h1 className="mt-6 text-section font-semibold text-ink">
            Your stay at {booking.listing.title}
          </h1>
          <p className="text-body text-muted">{booking.listing.city}, {booking.listing.country}</p>

          <div className="mt-8 grid grid-cols-2 gap-6 border-y border-divider py-6">
            <div>
              <p className="text-label font-semibold text-muted">Check-in</p>
              <p className="mt-1 text-body font-medium text-ink">{format(parseISO(booking.check_in), "EEE, d MMM yyyy")}</p>
              <p className="text-meta text-muted">{booking.check_in_time}</p>
            </div>
            <div>
              <p className="text-label font-semibold text-muted">Checkout</p>
              <p className="mt-1 text-body font-medium text-ink">{format(parseISO(booking.check_out), "EEE, d MMM yyyy")}</p>
              <p className="text-meta text-muted">{booking.check_out_time}</p>
            </div>
          </div>

          <section className="border-b border-divider py-6">
            <h2 className="flex items-center gap-2 text-body font-semibold text-ink">
              <Calendar size={18} /> Reservation details
            </h2>
            <p className="mt-3 text-body text-ink">Who&apos;s coming: {guests}</p>
            {booking.companions.length > 0 ? (
              <ul className="mt-2 text-meta text-muted">
                {booking.companions.map((c) => (
                  <li key={c.id}>
                    {c.name} · {c.email}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-4 flex items-center justify-between gap-2">
              <span className="text-body text-muted">Confirmation code</span>
              <button type="button" onClick={copyCode} className="flex items-center gap-2 font-semibold text-ink">
                {booking.confirmation_code}
                <Copy size={16} />
              </button>
            </div>
            {booking.message_to_host ? (
              <p className="mt-4 text-body text-muted">
                <MessageSquare size={16} className="mr-2 inline" />
                {booking.message_to_host}
              </p>
            ) : null}
            <p className="mt-4 text-meta text-muted">{booking.cancellation_policy_text}</p>
          </section>

          <section className="border-b border-divider py-6">
            <h2 className="flex items-center gap-2 text-body font-semibold text-ink">
              <MapPin size={18} /> Getting there
            </h2>
            <p className="mt-3 text-body text-ink">{address ?? `${booking.listing.city}, ${booking.listing.country}`}</p>
            <div className="mt-4 flex flex-wrap gap-4">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                Get directions
              </a>
              <Link href={`/listings/${booking.listing_id}`} className="underline underline-offset-4">
                Show listing
              </Link>
            </div>
          </section>

          <section className="border-b border-divider py-6">
            <h2 className="flex items-center gap-2 text-body font-semibold text-ink">
              <User size={18} /> Your host
            </h2>
            <div className="mt-4 flex items-center gap-3">
              <Avatar name={booking.host.name} src={booking.host.avatar} size={48} />
              <div>
                <p className="font-semibold">{booking.host.name}</p>
                <p className="text-meta text-muted">Hosting since {booking.host.joined_year}</p>
              </div>
            </div>
            <Link href="/coming-soon" className="mt-4 inline-block underline underline-offset-4">
              Message host
            </Link>
          </section>

          <section className="border-b border-divider py-6">
            <h2 className="text-body font-semibold text-ink">Payment info</h2>
            <p className="mt-3 text-body text-ink">{formatInr(booking.total_price)} · {paymentLabel(booking)}</p>
            <button type="button" className="mt-3 underline underline-offset-4" onClick={() => setReceiptOpen(true)}>
              Get receipt
            </button>
          </section>

          <section className="py-6">
            <h2 className="text-body font-semibold text-ink">Manage reservation</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {booking.can_cancel && booking.status === "confirmed" ? (
                <button
                  type="button"
                  className="rounded-lg border border-hairline px-4 py-2 text-body font-medium"
                  onClick={() => router.push(`/trips/${booking.id}/cancel`)}
                >
                  Cancel reservation
                </button>
              ) : null}
              {booking.status === "pending" ? (
                <button type="button" className="underline underline-offset-4" onClick={() => setWithdrawOpen(true)}>
                  Withdraw request
                </button>
              ) : null}
              {booking.can_review ? (
                <button type="button" className="rounded-lg border border-hairline px-4 py-2" onClick={() => setReviewOpen(true)}>
                  Write a review
                </button>
              ) : null}
            </div>
          </section>
        </div>

        <div className="sticky top-24 hidden h-[min(480px,calc(100vh-120px))] min-[1128px]:block">
          <TripsMap trips={[booking]} empty={false} highlightId={booking.id} onHover={() => {}} />
          {listing?.location_is_approximate && booking.status !== "confirmed" ? (
            <p className="mt-3 text-meta text-muted">Approximate location until your stay is confirmed.</p>
          ) : null}
        </div>
      </div>

      <TripReceiptModal open={receiptOpen} onClose={() => setReceiptOpen(false)} booking={booking} />
      <ReviewModal
        open={reviewOpen}
        bookingId={booking.id}
        listingId={booking.listing_id}
        onClose={() => setReviewOpen(false)}
      />
      <WithdrawRequestModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} bookingId={booking.id} />
    </div>
  );
}
