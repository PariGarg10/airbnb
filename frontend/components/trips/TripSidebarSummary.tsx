"use client";

import Image from "next/image";
import { Divider } from "@/components/ui/Divider";
import { formatCheckoutGuestSummary, formatDateRange, formatInr } from "@/lib/format";
import type { BookingDetail } from "@/types";

export function TripSidebarSummary({
  booking,
  statusPill,
  approximateAddressNote,
}: {
  booking: BookingDetail;
  statusPill?: string;
  approximateAddressNote?: boolean;
}) {
  const guests = formatCheckoutGuestSummary(
    booking.adults ?? booking.num_guests,
    booking.children ?? 0,
    booking.infants ?? 0,
    booking.pets ?? 0,
  );

  return (
    <aside className="sticky top-24 rounded-2xl border border-hairline p-6">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-soft">
        {booking.listing.cover_image ? (
          <Image src={booking.listing.cover_image} alt="" fill className="object-cover" sizes="400px" />
        ) : null}
      </div>
      <div className="mt-4 flex items-start justify-between gap-2">
        <p className="text-[16px] font-semibold leading-5 text-ink">{booking.listing.title}</p>
        {statusPill ? (
          <span className="shrink-0 rounded-full bg-soft px-2.5 py-1 text-label font-semibold text-ink">{statusPill}</span>
        ) : null}
      </div>
      <p className="mt-2 text-body text-muted">
        {formatDateRange(booking.check_in, booking.check_out)} · {guests}
      </p>
      {approximateAddressNote ? (
        <p className="mt-3 text-meta text-muted">
          We&apos;ll send you the exact address in 3 days and add it to your itinerary.
        </p>
      ) : null}
      <Divider className="my-4" />
      <div className="flex justify-between text-body font-semibold text-ink">
        <span>Total</span>
        <span>{formatInr(booking.total_price)}</span>
      </div>
      <Divider className="my-4" />
      <div className="flex justify-between gap-4 text-body text-ink">
        <span className="text-muted">Reservation code</span>
        <span className="font-semibold tracking-wide">{booking.confirmation_code}</span>
      </div>
    </aside>
  );
}
