"use client";

import { Counter } from "@/components/ui/Counter";
import { SelectTile } from "@/components/host/wizard/SelectTile";
import { useWizard } from "@/components/host/wizard/WizardContext";
import { formatInr } from "@/lib/format";
import type { BookingMode, OccupantType } from "@/types";
import { Home, User, UserRound, Users } from "lucide-react";

const OCCUPANT_OPTIONS: { value: OccupantType; label: string; icon: typeof User }[] = [
  { value: "me", label: "Me", icon: User },
  { value: "family", label: "My family", icon: Users },
  { value: "other_guests", label: "Other guests", icon: UserRound },
  { value: "flatmates", label: "Flatmates/housemates", icon: Home },
];

export function BookingSettingsSection() {
  const { draft, patch } = useWizard();
  const options: { value: BookingMode; title: string; description: string }[] = [
    {
      value: "approve_first_5",
      title: "Approve your first 5 bookings",
      description: "Start by reviewing reservation requests, then switch to Instant Book so guests can book automatically.",
    },
    { value: "instant", title: "Use Instant Book", description: "Let guests book automatically without waiting for your approval." },
  ];
  return (
    <div className="space-y-3">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => patch({ booking_mode: option.value })}
          className={`w-full rounded-xl border px-5 py-4 text-left ${draft.booking_mode === option.value ? "border-2 border-ink bg-soft" : "border-hairline"}`}
        >
          <p className="font-semibold">{option.title}</p>
          <p className="mt-1 text-meta text-muted">{option.description}</p>
        </button>
      ))}
    </div>
  );
}

export function DiscountsSection() {
  const { draft, patch } = useWizard();
  const rows = [
    { key: "discount_new_listing_pct" as const, title: "New listing promotion", hint: "20% off first 3 bookings" },
    { key: "discount_last_minute_pct" as const, title: "Last-minute discount", hint: "For stays booked 14 days or less before arrival" },
    { key: "discount_weekly_pct" as const, title: "Weekly discount", hint: "For stays of 7 nights or more" },
    { key: "discount_monthly_pct" as const, title: "Monthly discount", hint: "For stays of 28 nights or more" },
  ];
  return (
    <div className="divide-y divide-hairline">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-4 py-5">
          <div>
            <p className="font-medium">{row.title}</p>
            <p className="text-meta text-muted">{row.hint}</p>
          </div>
          <input
            type="number"
            min={0}
            max={99}
            value={draft[row.key]}
            onChange={(event) => patch({ [row.key]: Math.max(0, Math.min(99, Number(event.target.value) || 0)) })}
            className="w-16 rounded-lg border border-hairline px-2 py-1 text-center"
          />
        </div>
      ))}
    </div>
  );
}

export function SafetyDetailsSection() {
  const { draft, patch } = useWizard();
  const rows = [
    { key: "has_exterior_camera" as const, label: "Exterior security camera present" },
    { key: "has_noise_monitor" as const, label: "Noise decibel monitor present" },
    { key: "has_weapons" as const, label: "Weapon(s) on the property" },
  ];
  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <label key={row.key} className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={draft[row.key]}
            onChange={(event) => patch({ [row.key]: event.target.checked })}
            className="mt-1 h-4 w-4 accent-ink"
          />
          <span>{row.label}</span>
        </label>
      ))}
    </div>
  );
}

export function LocationPrivacySection() {
  const { draft, patch } = useWizard();
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-hairline px-5 py-4">
      <div>
        <p className="font-semibold">Show precise location</p>
        <p className="mt-1 text-meta text-muted">Let guests see your home&apos;s exact location on the map before they book.</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={draft.show_precise_location}
        onClick={() => patch({ show_precise_location: !draft.show_precise_location })}
        className={`relative h-8 w-[52px] shrink-0 rounded-full ${draft.show_precise_location ? "bg-ink" : "bg-hairline"}`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[left] ${draft.show_precise_location ? "left-[24px]" : "left-1"}`}
        />
      </button>
    </div>
  );
}

export function BathroomsEditorSection() {
  const { draft, patch } = useWizard();
  const sync = (key: "private_bathrooms" | "dedicated_bathrooms" | "shared_bathrooms", value: number) => {
    const next = { ...draft, [key]: value };
    patch({
      [key]: value,
      bathrooms: next.private_bathrooms + next.dedicated_bathrooms + next.shared_bathrooms,
    });
  };
  const rows = [
    { key: "private_bathrooms" as const, title: "Private and attached" },
    { key: "dedicated_bathrooms" as const, title: "Dedicated" },
    { key: "shared_bathrooms" as const, title: "Shared" },
  ];
  return (
    <div className="divide-y divide-hairline">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between py-5">
          <p className="font-medium">{row.title}</p>
          <Counter variant="stepper" value={draft[row.key]} min={0} max={20} step={0.5} onChange={(v) => sync(row.key, v)} />
        </div>
      ))}
    </div>
  );
}

export function WhoElseEditorSection() {
  const { draft, patch } = useWizard();
  const toggle = (value: OccupantType) => {
    const selected = draft.occupants.includes(value);
    patch({
      occupants: selected ? draft.occupants.filter((item) => item !== value) : [...draft.occupants, value],
    });
  };
  return (
    <div>
      <p className="text-meta text-muted">Guests need to know whether they&apos;ll encounter other people during their stay.</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {OCCUPANT_OPTIONS.map((option) => (
          <SelectTile
            key={option.value}
            icon={option.icon}
            label={option.label}
            selected={draft.occupants.includes(option.value)}
            onClick={() => toggle(option.value)}
          />
        ))}
      </div>
    </div>
  );
}

export function WeekendPricingRow() {
  const { draft, patch } = useWizard();
  const weekendRate = Math.round((draft.price_per_night * (100 + draft.weekend_adjustment_pct)) / 100);
  return (
    <div className="mt-6 rounded-xl border border-hairline px-5 py-4">
      <p className="font-semibold">Weekend adjustment</p>
      <div className="mt-3 flex items-center gap-2">
        <span>+</span>
        <input
          type="number"
          min={0}
          max={99}
          value={draft.weekend_adjustment_pct}
          onChange={(event) => patch({ weekend_adjustment_pct: Math.max(0, Math.min(99, Number(event.target.value) || 0)) })}
          className="w-16 rounded-lg border border-hairline px-2 py-1 text-center"
        />
        <span>%</span>
      </div>
      <p className="mt-2 text-meta text-muted">{formatInr(weekendRate)} for Fri and Sat</p>
    </div>
  );
}
