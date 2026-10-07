"use client";

import { format, parseISO, startOfToday } from "date-fns";
import { useEffect, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { toIsoDate } from "@/lib/format";

export interface DisabledRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  checkIn?: string;
  checkOut?: string;
  onChange: (checkIn?: string, checkOut?: string) => void;
  disabledRanges?: DisabledRange[];
  onCheckInSelected?: () => void;
  /** `search` = home When panel (no footer row); `default` = listing / checkout. */
  layout?: "default" | "search" | "listing-inline" | "listing-popover";
  monthCount?: number;
  onClose?: () => void;
}

function toRange(checkIn?: string, checkOut?: string): DateRange | undefined {
  const from = checkIn ? parseISO(checkIn) : undefined;
  const to = checkOut ? parseISO(checkOut) : undefined;
  if (!from || Number.isNaN(from.getTime())) return undefined;
  if (!to || Number.isNaN(to.getTime())) return { from };
  return { from, to };
}

export function DateRangePicker({
  checkIn,
  checkOut,
  onChange,
  disabledRanges = [],
  onCheckInSelected,
  layout = "default",
  monthCount,
  onClose,
}: DateRangePickerProps) {
  const [months, setMonths] = useState(2);

  useEffect(() => {
    if (monthCount != null) {
      setMonths(monthCount);
      return;
    }
    const media = window.matchMedia("(max-width: 743px)");
    const apply = () => setMonths(media.matches ? 1 : 2);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [monthCount]);

  const selected = toRange(checkIn, checkOut);

  return (
    <div className="airbnb-calendar">
      <DayPicker
        mode="range"
        navLayout="around"
        numberOfMonths={months}
        selected={selected}
        onSelect={(range) => {
          onChange(range?.from ? toIsoDate(range.from) : undefined, range?.to ? toIsoDate(range.to) : undefined);
          if (range?.from && !range.to) onCheckInSelected?.();
        }}
        disabled={[{ before: startOfToday() }, ...disabledRanges]}
        modifiers={{ booked: disabledRanges }}
        modifiersClassNames={{ booked: "is-booked" }}
        excludeDisabled
        showOutsideDays
      />
      {layout === "default" ? (
        <div className="mt-2 flex items-center justify-between px-2">
          <button type="button" className="t-link" onClick={() => onChange(undefined, undefined)}>
            Clear dates
          </button>
          <p className="text-meta text-muted">
            {checkIn ? format(parseISO(checkIn), "MMM d") : "Start"} – {checkOut ? format(parseISO(checkOut), "MMM d") : "End"}
          </p>
        </div>
      ) : null}
      {layout === "listing-inline" ? (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="text-sm font-semibold leading-[18px] text-ink underline decoration-1 underline-offset-2"
            onClick={() => onChange(undefined, undefined)}
          >
            Clear dates
          </button>
        </div>
      ) : null}
      {layout === "listing-popover" ? (
        <div className="mt-4 flex items-center justify-between gap-4">
          <button
            type="button"
            className="text-sm font-semibold leading-[18px] text-ink underline decoration-1 underline-offset-2"
            onClick={() => onChange(undefined, undefined)}
          >
            Clear dates
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold leading-[18px] text-white"
            >
              Close
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
