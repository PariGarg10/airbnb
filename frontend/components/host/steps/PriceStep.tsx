"use client";

import { useEffect, useState } from "react";
import { StepShell } from "@/components/host/wizard/StepShell";
import { useWizard } from "@/components/host/wizard/WizardContext";
import { formatInr } from "@/lib/format";

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState(value ? String(value) : "");

  useEffect(() => {
    if (!focused) setRaw(value ? String(value) : "");
  }, [focused, value]);

  const formatted = (digits: string) => (digits ? `₹${new Intl.NumberFormat("en-IN").format(Number(digits))}` : "");
  const shown = focused ? formatted(raw) : value ? formatInr(value) : "₹0";

  return (
    <label className="block rounded-xl border border-hairline px-5 py-4">
      <span className="text-meta text-muted">{label}</span>
      <input
        inputMode="numeric"
        value={shown}
        onFocus={() => {
          setFocused(true);
          setRaw(value ? String(value) : "");
        }}
        onBlur={() => setFocused(false)}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "").slice(0, 7);
          setRaw(digits);
          onChange(digits ? Number(digits) : 0);
        }}
        className="mt-1 w-full bg-transparent text-3xl font-semibold outline-none"
      />
    </label>
  );
}

export function PriceStep() {
  const { draft, patch } = useWizard();
  const guestPrice = draft.price_per_night + Math.round(draft.price_per_night * 0.14);

  return (
    <StepShell title="Now, set your price" subtitle="These suggestions are based on guest demand for similar listings.">
      <div className="space-y-4">
        <MoneyField label="Base price" value={draft.price_per_night} onChange={(price_per_night) => patch({ price_per_night })} />
        <MoneyField label="Cleaning fee" value={draft.cleaning_fee} onChange={(cleaning_fee) => patch({ cleaning_fee })} />
      </div>
      {draft.price_per_night > 0 ? (
        <p className="mt-4 text-meta text-muted">Guest price before taxes {formatInr(guestPrice)}</p>
      ) : null}
      {draft.price_per_night > 0 && draft.price_per_night < 100 ? (
        <p className="mt-2 text-body text-rausch">Base price must be at least ₹100</p>
      ) : null}
    </StepShell>
  );
}
