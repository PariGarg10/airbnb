"use client";

import { useEffect, useState } from "react";
import { CheckoutModalChrome } from "@/components/checkout/CheckoutModalChrome";
import { Counter } from "@/components/ui/Counter";
import { Button } from "@/components/ui/Button";
import type { CheckoutGuestParams } from "@/types/booking";

interface ChangeGuestsModalProps {
  open: boolean;
  onClose: () => void;
  value: CheckoutGuestParams;
  maxGuests: number;
  allowsPets: boolean;
  onSave: (value: CheckoutGuestParams) => void;
}

export function ChangeGuestsModal({
  open,
  onClose,
  value,
  maxGuests,
  allowsPets,
  onSave,
}: ChangeGuestsModalProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const maxAdultsChildren = (key: "adults" | "children") => {
    const other = key === "adults" ? draft.children : draft.adults;
    return Math.min(16, maxGuests - other + draft[key]);
  };

  return (
    <CheckoutModalChrome
      open={open}
      title="Change guests"
      onClose={onClose}
      footer={
        <div className="mt-6 flex items-center justify-between border-t border-divider pt-4">
          <button type="button" className="text-body font-medium text-ink underline underline-offset-4" onClick={onClose}>
            Cancel
          </button>
          <Button
            className="rounded-lg bg-ink px-6 py-3 text-white hover:bg-inverse-hover"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
          >
            Save
          </Button>
        </div>
      }
    >
      <p className="mb-2 text-meta text-muted">
        This place has a maximum of {maxGuests} guests, not including infants.{" "}
        {allowsPets ? "Pets are allowed." : "Pets aren’t allowed."}
      </p>
      <div className="divide-y divide-divider">
        <GuestRow
          label="Adults"
          hint="Age 13+"
          value={draft.adults}
          min={1}
          max={maxAdultsChildren("adults")}
          onChange={(adults) => setDraft({ ...draft, adults })}
        />
        <GuestRow
          label="Children"
          hint="Ages 2–12"
          value={draft.children}
          min={0}
          max={maxAdultsChildren("children")}
          onChange={(children) => setDraft({ ...draft, children })}
        />
        <GuestRow
          label="Infants"
          hint="Under 2"
          value={draft.infants}
          min={0}
          max={5}
          onChange={(infants) => setDraft({ ...draft, infants })}
        />
        <GuestRow
          label="Pets"
          hint={allowsPets ? "Bringing a service animal?" : "Bringing a service animal?"}
          hintUnderline={!allowsPets}
          value={draft.pets}
          min={0}
          max={allowsPets ? 5 : 0}
          disabled={!allowsPets}
          onChange={(pets) => setDraft({ ...draft, pets })}
        />
      </div>
    </CheckoutModalChrome>
  );
}

function GuestRow({
  label,
  hint,
  hintUnderline,
  value,
  min,
  max,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  hintUnderline?: boolean;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex min-h-[72px] items-center justify-between gap-4 py-5">
      <div>
        <p className="text-[16px] font-medium leading-5 text-ink">{label}</p>
        <p className={`pt-1 text-meta text-muted ${hintUnderline ? "underline" : ""}`}>{hint}</p>
      </div>
      <Counter
        variant="line"
        value={value}
        min={min}
        max={disabled ? 0 : max}
        onChange={onChange}
        decreaseLabel={`Decrease ${label}`}
        increaseLabel={`Increase ${label}`}
      />
    </div>
  );
}
