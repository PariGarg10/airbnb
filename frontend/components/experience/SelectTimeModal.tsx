"use client";

import { Calendar, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { SlotCard } from "@/components/experience/SlotCard";
import { Counter } from "@/components/ui/Counter";
import { experiencesApi } from "@/lib/api";
import { formatInr } from "@/lib/format";
import {
  adultsLabel,
  formatExperienceDayHeader,
  formatExperienceMonthYear,
  monthRange,
} from "@/lib/experienceDatetime";
import type { ExperienceSlot, ExperienceSlotsByDate } from "@/types/experience";

function LoadingDots() {
  return (
    <div className="flex justify-center gap-2 py-16" aria-label="Loading">
      <span className="h-2 w-2 animate-pulse rounded-full bg-muted" />
      <span className="h-2 w-2 animate-pulse rounded-full bg-muted [animation-delay:150ms]" />
    </div>
  );
}

export function SelectTimeModal({
  open,
  onClose,
  experienceId,
  maxGuests,
  minGuestAge = 13,
  defaultAdults = 1,
  onNext,
}: {
  open: boolean;
  onClose: () => void;
  experienceId: number;
  maxGuests: number;
  minGuestAge?: number;
  defaultAdults?: number;
  onNext: (slotId: number, adults: number, slot: ExperienceSlot) => void;
}) {
  const now = new Date();
  const [month, setMonth] = useState(() => ({ year: now.getFullYear(), index: now.getMonth() }));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [adults, setAdults] = useState(defaultAdults);
  const [groups, setGroups] = useState<ExperienceSlotsByDate[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [quotedTotal, setQuotedTotal] = useState<number | null>(null);

  const range = useMemo(() => monthRange(month.year, month.index), [month]);

  useEffect(() => {
    if (!open) return;
    setAdults(defaultAdults);
    setSelectedId(null);
  }, [open, defaultAdults]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setGroups(null);
    experiencesApi
      .slots(experienceId, { from: range.from, to: range.to, guests: adults })
      .then((data) => {
        if (!cancelled) setGroups(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, experienceId, range.from, range.to, adults]);

  useEffect(() => {
    if (!selectedId) {
      setQuotedTotal(null);
      return;
    }
    let cancelled = false;
    experiencesApi.quote({ slot_id: selectedId, adults }).then((q) => {
      if (!cancelled) setQuotedTotal(q.total);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId, adults]);

  const selectedSlot = useMemo(() => {
    if (selectedId == null || !groups) return null;
    for (const g of groups) {
      const hit = g.slots.find((s) => s.id === selectedId);
      if (hit) return hit;
    }
    return null;
  }, [groups, selectedId]);

  const monthLabel = formatExperienceMonthYear(new Date(Date.UTC(month.year, month.index, 15)));

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="select-time-title"
        className="relative flex max-h-[min(900px,calc(100vh-48px))] w-full max-w-[568px] flex-col overflow-hidden rounded-[32px] bg-white shadow-high"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-6 pt-6">
          <h2 id="select-time-title" className="text-[26px] font-semibold leading-8 text-ink">
            Select a time
          </h2>
          <button type="button" aria-label="Close dialog" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-soft">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
          <div className="flex items-center justify-between border-b border-hairline py-5">
            <div>
              <p className="text-base font-semibold text-ink">{adultsLabel(adults)}</p>
              <p className="text-sm text-muted">Age {minGuestAge}+</p>
            </div>
            <Counter value={adults} min={1} max={maxGuests} onChange={setAdults} variant="line" />
          </div>

          <div className="relative flex items-center justify-between border-b border-hairline py-5">
            <p className="text-base font-medium text-ink">{monthLabel}</p>
            <button
              type="button"
              aria-label="Choose month"
              onClick={() => setPickerOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-soft"
            >
              <Calendar size={18} />
            </button>
            {pickerOpen ? (
              <div className="absolute right-0 top-full z-10 mt-2 rounded-xl border border-hairline bg-white p-3 shadow-md">
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg px-3 py-2 text-sm hover:bg-soft"
                    onClick={() => {
                      setMonth((m) => {
                        const d = new Date(m.year, m.index - 1, 1);
                        return { year: d.getFullYear(), index: d.getMonth() };
                      });
                      setPickerOpen(false);
                    }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="rounded-lg px-3 py-2 text-sm hover:bg-soft"
                    onClick={() => {
                      setMonth((m) => {
                        const d = new Date(m.year, m.index + 1, 1);
                        return { year: d.getFullYear(), index: d.getMonth() };
                      });
                      setPickerOpen(false);
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {loading ? <LoadingDots /> : null}
          {!loading && groups && groups.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">No dates available this month</p>
          ) : null}
          {!loading && groups
            ? groups.map((group) => (
                <div key={group.date} className="py-4">
                  <p className="mb-3 text-lg font-semibold leading-6 text-ink">{formatExperienceDayHeader(group.slots[0]?.start_at ?? group.date)}</p>
                  <div className="space-y-3">
                    {group.slots.map((slot) => (
                      <SlotCard
                        key={slot.id}
                        slot={slot}
                        selected={selectedId === slot.id}
                        onSelect={() => setSelectedId(slot.id)}
                      />
                    ))}
                  </div>
                </div>
              ))
            : null}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-hairline px-6 py-4">
          <p className="text-base text-ink">
            {selectedSlot && quotedTotal != null ? (
              <>
                <span className="font-semibold underline">{formatInr(quotedTotal)}</span> for {adults}{" "}
                {adults === 1 ? "guest" : "guests"}
              </>
            ) : selectedSlot ? (
              <span className="text-muted">Updating price…</span>
            ) : (
              <span className="text-muted">Select a time</span>
            )}
          </p>
          <button
            type="button"
            disabled={!selectedSlot}
            onClick={() => selectedSlot && onNext(selectedSlot.id, adults, selectedSlot)}
            className="rounded-full bg-ink px-8 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
