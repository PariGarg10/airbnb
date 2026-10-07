"use client";

import { Counter } from "@/components/ui/Counter";

export interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

interface GuestPickerProps {
  value: GuestCounts;
  onChange: (value: GuestCounts) => void;
  maxGuests?: number;
  petsHint?: string;
}

const ROWS: { key: keyof GuestCounts; label: string; hint: string }[] = [
  { key: "adults", label: "Adults", hint: "Ages 13 or above" },
  { key: "children", label: "Children", hint: "Ages 2–12" },
  { key: "infants", label: "Infants", hint: "Under 2" },
  { key: "pets", label: "Pets", hint: "Bringing a service animal?" },
];

export function GuestPicker({ value, onChange, maxGuests, petsHint }: GuestPickerProps) {
  const staying = value.adults + value.children;

  const maxFor = (key: keyof GuestCounts) => {
    if (key === "infants" || key === "pets") return 5;
    if (maxGuests == null) return undefined;
    return value[key] + Math.max(0, maxGuests - staying);
  };

  return (
    <div className="min-w-[280px] px-4">
      {ROWS.map((row, index) => (
        <div
          key={row.key}
          data-guest-row
          className={`flex min-h-[91px] items-center justify-between gap-2.5 py-6 pr-1 ${index < ROWS.length - 1 ? "border-b border-divider" : ""}`}
        >
          <div>
            <p className="t-guest-row-title">{row.label}</p>
            <p className={`t-dropdown-subtitle pt-1 ${row.key === "pets" ? "underline" : ""}`}>
              {row.key === "pets" && petsHint ? petsHint : row.hint}
            </p>
          </div>
          <Counter
            value={value[row.key]}
            min={0}
            max={maxFor(row.key)}
            variant="stepper"
            decreaseLabel={`Decrease ${row.label}`}
            increaseLabel={`Increase ${row.label}`}
            onChange={(next) => onChange({ ...value, [row.key]: next })}
          />
        </div>
      ))}
    </div>
  );
}
