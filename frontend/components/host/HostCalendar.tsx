"use client";

import { useQuery } from "@tanstack/react-query";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isBefore,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfToday,
} from "date-fns";
import { ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/Skeleton";
import { hostApi, listingsApi } from "@/lib/api";
import { formatCompactInr, formatInr } from "@/lib/format";
import type { BookedRange, HostBooking, HostListing } from "@/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function nightBooked(day: Date, ranges: BookedRange[]): boolean {
  return ranges.some((range) => {
    const start = parseISO(range.check_in);
    const end = parseISO(range.check_out);
    return day >= start && day < end;
  });
}

function guestName(day: Date, bookings: HostBooking[], listingId: number): string | null {
  const match = bookings.find((booking) => {
    if (booking.listing.id !== listingId || booking.status !== "confirmed") return false;
    const start = parseISO(booking.check_in);
    const end = parseISO(booking.check_out);
    return day >= start && day < end;
  });
  return match?.guest.name ?? null;
}

export function HostCalendar() {
  const params = useSearchParams();
  const router = useRouter();
  const listings = useQuery({ queryKey: ["host-listings"], queryFn: hostApi.listings });
  const requested = Number(params.get("listing"));
  const selected = listings.data?.find((item) => item.id === requested) ?? listings.data?.[0];
  const months = useMemo(() => Array.from({ length: 12 }, (_, index) => addMonths(startOfMonth(new Date()), index)), []);
  const [visible, setVisible] = useState(months[0]);
  const [monthOpen, setMonthOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [promo, setPromo] = useState(true);

  useEffect(() => {
    if (!listings.data?.length || !selected) return;
    if (selected.id !== requested) router.replace(`/host/calendar?listing=${selected.id}`);
  }, [listings.data, requested, router, selected]);

  const booked = useQuery({
    queryKey: ["booked-dates", selected?.id],
    queryFn: () => listingsApi.bookedDates(selected!.id),
    enabled: Boolean(selected),
    retry: false,
  });
  const upcoming = useQuery({ queryKey: ["host-bookings", "upcoming"], queryFn: () => hostApi.bookings("upcoming") });
  const current = useQuery({ queryKey: ["host-bookings", "current"], queryFn: () => hostApi.bookings("current") });
  const completed = useQuery({ queryKey: ["host-bookings", "completed"], queryFn: () => hostApi.bookings("completed") });
  const bookings = [...(upcoming.data ?? []), ...(current.data ?? []), ...(completed.data ?? [])];

  useEffect(() => {
    const nodes = months
      .map((month) => document.getElementById(`month-${format(month, "yyyy-MM")}`))
      .filter((node): node is HTMLElement => node !== null);
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const match = months.find((month) => `month-${format(month, "yyyy-MM")}` === visibleEntry?.target.id);
        if (match) setVisible(match);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.2, 0.6] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [months, listings.data]);

  if (listings.isLoading) {
    return (
      <main className="container-airbnb py-10">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-6 h-96 w-full rounded-xl" />
      </main>
    );
  }
  if (!selected) {
    return (
      <main className="container-airbnb py-16 text-center">
        <h1 className="t-page-title">No listings yet</h1>
        <Link href="/host/listings/new" className="mt-4 inline-flex rounded-lg bg-ink px-5 py-3 t-button text-white">
          Create a listing
        </Link>
      </main>
    );
  }

  return (
    <main className="container-airbnb grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <button type="button" className="flex items-center gap-2 t-page-title" onClick={() => setMonthOpen((open) => !open)}>
              {format(visible, "MMMM")}
              <ChevronDown size={22} />
            </button>
            {monthOpen ? (
              <div className="dropdown-pop absolute left-0 z-20 mt-2 max-h-64 w-44 overflow-y-auto rounded-xl border border-hairline bg-white py-1 shadow-popover">
                {months.map((month) => (
                  <button
                    key={month.toISOString()}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-body hover:bg-soft"
                    onClick={() => {
                      document.getElementById(`month-${format(month, "yyyy-MM")}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                      setMonthOpen(false);
                    }}
                  >
                    {format(month, "MMMM yyyy")}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="calendar-listing">Listing</label>
            <select
              id="calendar-listing"
              value={selected.id}
              onChange={(event) => router.replace(`/host/calendar?listing=${event.target.value}`)}
              className="max-w-[220px] rounded-full border border-hairline bg-white px-3 py-2 text-body"
            >
              {listings.data?.map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.title}
                </option>
              ))}
            </select>
            <div className="relative">
              <button type="button" className="flex items-center gap-1 rounded-full border border-hairline px-4 py-2 text-body" onClick={() => setViewOpen((open) => !open)}>
                Month
                <ChevronDown size={14} />
              </button>
              {viewOpen ? (
                <div className="dropdown-pop absolute right-0 z-20 mt-2 w-32 rounded-xl border border-hairline bg-white py-1 text-body shadow-popover">
                  {["List", "Month", "Year"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="block w-full px-3 py-2 text-left hover:bg-soft"
                      onClick={() => {
                        setViewOpen(false);
                        if (item !== "Month") toast("Coming soon");
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-7 gap-2 text-center text-label text-muted">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="mt-3 space-y-8">
          {months.map((month) => (
            <MonthGrid
              key={month.toISOString()}
              month={month}
              listing={selected}
              ranges={booked.data ?? []}
              bookings={bookings}
            />
          ))}
        </div>
        <div className="sticky bottom-4 mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => document.getElementById(`day-${format(new Date(), "yyyy-MM-dd")}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
            className="rounded-full border border-hairline bg-white px-4 py-2 text-body font-semibold shadow-sm"
          >
            ↑ Today
          </button>
          <button type="button" onClick={() => toast("Coming soon")} className="rounded-full border border-hairline bg-white px-4 py-2 text-body font-semibold shadow-sm">
            INR
          </button>
        </div>
      </section>
      <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
        {promo ? (
          <div className="rounded-2xl border border-hairline p-4">
            <div className="flex justify-end">
              <button type="button" aria-label="Dismiss" onClick={() => setPromo(false)} className="rounded-full p-1 hover:bg-soft">
                <X size={16} />
              </button>
            </div>
            <p className="font-semibold">Attract more top-rated guests</p>
            <p className="mt-1 text-meta text-muted">Give a discount exclusively to guests rated 4.8+ with at least 3 reviews.</p>
            <button type="button" onClick={() => toast("Coming soon")} className="mt-4 w-full rounded-lg bg-ink py-2.5 t-button text-white">
              Get started
            </button>
          </div>
        ) : null}
        <Link href={`/host/listings/${selected.id}/edit?section=pricing`} className="block rounded-xl border border-hairline p-4 hover:bg-soft">
          <p className="font-semibold">Pricing</p>
          <p className="mt-1 text-meta text-muted">{formatInr(selected.price)} per night</p>
        </Link>
        <button type="button" onClick={() => toast("Coming soon")} className="block w-full rounded-xl border border-hairline p-4 text-left hover:bg-soft">
          <p className="font-semibold">Discounts</p>
          <p className="mt-1 text-meta text-muted">10% weekly discount</p>
          <p className="text-meta text-muted">25% monthly discount</p>
        </button>
        <div className="rounded-xl border border-hairline p-4">
          <p className="font-semibold">Availability</p>
          <p className="mt-1 text-meta text-muted">1–365 night stays</p>
          <p className="text-meta text-muted">Same-day advance notice</p>
        </div>
      </aside>
    </main>
  );
}

function MonthGrid({
  month,
  listing,
  ranges,
  bookings,
}: {
  month: Date;
  listing: HostListing;
  ranges: BookedRange[];
  bookings: HostBooking[];
}) {
  const days = eachDayOfInterval({ start: month, end: endOfMonth(month) });
  const lead = getDay(month);
  const today = startOfToday();
  return (
    <section id={`month-${format(month, "yyyy-MM")}`}>
      <h2 className="mb-3 t-subheading">{format(month, "MMMM")}</h2>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: lead }, (_, index) => (
          <div key={`lead-${index}`} />
        ))}
        {days.map((day) => {
          const booked = nightBooked(day, ranges);
          const past = isBefore(day, today);
          const guest = guestName(day, bookings, listing.id);
          const isToday = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              id={`day-${format(day, "yyyy-MM-dd")}`}
              className={`flex min-h-[76px] flex-col justify-between rounded-2xl border p-2 text-left ${booked ? "border-ink bg-ink text-white" : past ? "border-hairline bg-soft text-muted" : "border-hairline"}`}
            >
              <span className={`flex h-7 w-7 items-center justify-center text-body ${isToday ? "rounded-full bg-rausch font-semibold text-white" : ""}`}>
                {format(day, "d")}
              </span>
              <span className="truncate text-[11px]">{booked ? guest || "Booked" : formatCompactInr(listing.price)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
