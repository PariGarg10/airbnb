"use client";

import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, isSameDay, parseISO, startOfToday } from "date-fns";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HostStatsStrip } from "@/components/host/HostStatsStrip";
import { Avatar } from "@/components/ui/Avatar";
import { GlidePill } from "@/components/ui/Glide";
import { Skeleton } from "@/components/ui/Skeleton";
import { hostApi } from "@/lib/api";
import { formatDateRange, formatGuests, formatInr } from "@/lib/format";
import type { HostBooking } from "@/types";

function stayLabel(checkIn: string): string {
  const start = parseISO(checkIn);
  const today = startOfToday();
  if (isSameDay(start, today)) return "Checking in today";
  if (start > today) {
    const days = differenceInCalendarDays(start, today);
    return days === 1 ? "Arriving in 1 day" : `Arriving in ${days} days`;
  }
  return "Currently hosting";
}

function isTodayStay(booking: HostBooking): boolean {
  const start = parseISO(booking.check_in);
  const end = parseISO(booking.check_out);
  const today = startOfToday();
  const current = start <= today && end > today;
  return current || isSameDay(start, today) || isSameDay(end, today);
}

export function HostReservationsPanel() {
  const router = useRouter();
  const [pill, setPill] = useState<"today" | "upcoming">("today");
  const current = useQuery({ queryKey: ["host-bookings", "current"], queryFn: () => hostApi.bookings("current") });
  const upcoming = useQuery({ queryKey: ["host-bookings", "upcoming"], queryFn: () => hostApi.bookings("upcoming") });
  const completed = useQuery({ queryKey: ["host-bookings", "completed"], queryFn: () => hostApi.bookings("completed") });
  const loading = current.isLoading || upcoming.isLoading || completed.isLoading;
  const error = current.isError || upcoming.isError || completed.isError;

  const todayRows = [...(current.data ?? []), ...(upcoming.data ?? []), ...(completed.data ?? [])].filter(
    (booking, index, all) => isTodayStay(booking) && all.findIndex((item) => item.id === booking.id) === index,
  );
  const rows = pill === "today" ? todayRows : upcoming.data ?? [];

  return (
    <div>
      <GlidePill active={pill} tone="dark" className="mx-auto flex w-fit gap-2 rounded-full bg-soft p-1">
        {(["today", "upcoming"] as const).map((item) => (
          <button
            key={item}
            type="button"
            data-glide={item}
            onClick={() => setPill(item)}
            className={`relative z-10 rounded-full px-5 py-2 text-body font-semibold transition-colors duration-200 ${pill === item ? "text-white" : "text-ink"}`}
          >
            {item === "today" ? "Today" : "Upcoming"}
          </button>
        ))}
      </GlidePill>
      <div className="mt-8">
        <HostStatsStrip />
      </div>
      <div className="mt-8 space-y-3">
        {loading ? Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-24 rounded-xl" />) : null}
        {error ? <p className="text-body text-rausch">Could not load reservations</p> : null}
        {!loading && !error && rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-soft">
              <BookOpen size={28} strokeWidth={1.5} />
            </div>
            <h2 className="mt-6 t-page-title">You don&apos;t have any reservations</h2>
            <p className="mx-auto mt-2 max-w-sm text-meta text-muted">To get booked, you&apos;ll need to complete and publish your listing.</p>
            <Link href="/host/listings/new" className="mt-6 inline-flex rounded-xl bg-soft px-5 py-3 text-body font-semibold">
              Create a listing
            </Link>
          </div>
        ) : null}
        {rows.map((booking) => (
          <button
            key={booking.id}
            type="button"
            onClick={() => router.push(`/trips/${booking.id}`)}
            className="flex w-full items-center gap-4 rounded-xl border border-hairline p-4 text-left hover:bg-soft"
          >
            <Avatar name={booking.guest.name} src={booking.guest.avatar_url} size={48} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{booking.guest.name}</p>
              <p className="truncate text-meta text-muted">{booking.listing.title}</p>
              <p className="mt-1 text-meta text-muted">
                {formatDateRange(booking.check_in, booking.check_out)} · {formatGuests(booking.guests)}
              </p>
            </div>
            {booking.listing.cover_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={booking.listing.cover_image} alt="" className="hidden h-14 w-14 rounded-lg object-cover sm:block" />
            ) : (
              <div className="hidden h-14 w-14 rounded-lg bg-soft sm:block" />
            )}
            <div className="text-right">
              <p className="font-semibold">{formatInr(booking.total_price)}</p>
              <p className="mt-1 text-label text-muted">{stayLabel(booking.check_in)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
