"use client";

import { addDays, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { CheckoutModalChrome } from "@/components/checkout/CheckoutModalChrome";
import { DateRangePicker, type DisabledRange } from "@/components/search/DateRangePicker";
import { Button } from "@/components/ui/Button";
import type { BookedRange } from "@/types";

function blockedRanges(booked: BookedRange[]): DisabledRange[] {
  return booked.flatMap((range) => {
    const from = parseISO(range.check_in);
    const to = addDays(parseISO(range.check_out), -1);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return [];
    return [{ from, to }];
  });
}

interface ChangeDatesModalProps {
  open: boolean;
  onClose: () => void;
  checkIn?: string;
  checkOut?: string;
  booked: BookedRange[];
  onSave: (checkIn: string, checkOut: string) => void;
}

export function ChangeDatesModal({ open, onClose, checkIn, checkOut, booked, onSave }: ChangeDatesModalProps) {
  const [draftIn, setDraftIn] = useState(checkIn);
  const [draftOut, setDraftOut] = useState(checkOut);

  useEffect(() => {
    if (open) {
      setDraftIn(checkIn);
      setDraftOut(checkOut);
    }
  }, [open, checkIn, checkOut]);

  const valid = Boolean(draftIn && draftOut && draftOut > draftIn);

  return (
    <CheckoutModalChrome
      open={open}
      title="Change dates"
      onClose={onClose}
      wide
      footer={
        <div className="mt-6 flex items-center justify-between border-t border-divider pt-4">
          <button
            type="button"
            className="text-body font-medium text-ink underline underline-offset-4"
            onClick={() => {
              setDraftIn(undefined);
              setDraftOut(undefined);
            }}
          >
            Clear dates
          </button>
          <Button
            className="rounded-lg bg-ink px-6 py-3 text-white hover:bg-inverse-hover disabled:opacity-40"
            disabled={!valid}
            onClick={() => {
              if (!draftIn || !draftOut) return;
              onSave(draftIn, draftOut);
              onClose();
            }}
          >
            Save
          </Button>
        </div>
      }
    >
      <DateRangePicker
        checkIn={draftIn}
        checkOut={draftOut}
        disabledRanges={blockedRanges(booked)}
        monthCount={2}
        layout="search"
        onChange={(nextIn, nextOut) => {
          setDraftIn(nextIn);
          setDraftOut(nextOut);
        }}
      />
    </CheckoutModalChrome>
  );
}
