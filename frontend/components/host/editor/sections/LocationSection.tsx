"use client";

import dynamic from "next/dynamic";
import { Home } from "lucide-react";
import { LocationPinStep } from "@/components/host/steps/LocationPinStep";
import { stepEmbed } from "@/components/host/editor/stepEmbed";
import { useWizard } from "@/components/host/wizard/WizardContext";

const MiniMap = dynamic(() => import("@/components/host/editor/MiniMap"), {
  ssr: false,
  loading: () => <div className="h-32 rounded-xl bg-soft" />,
});

export function LocationSummary({ lat, lng, address }: { lat: number; lng: number; address: string }) {
  const placed = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
  return (
    <div>
      <div className="relative overflow-hidden rounded-xl">
        {placed ? <MiniMap lat={lat} lng={lng} /> : <div className="h-32 bg-soft" />}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/20">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white">
              <Home size={16} />
            </span>
          </div>
        </div>
      </div>
      {address ? <p className="mt-3 text-meta text-muted">{address}</p> : null}
    </div>
  );
}

export function LocationSection() {
  const { draft, patch } = useWizard();
  const fields: { key: "address" | "city" | "state" | "country"; label: string }[] = [
    { key: "address", label: "Street address" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "country", label: "Country" },
  ];

  return (
    <div>
      <div className="grid gap-3">
        {fields.map((field) => (
          <label key={field.key} className="block">
            <span className="text-body font-medium">{field.label}</span>
            <input
              value={draft[field.key]}
              onChange={(event) => patch({ [field.key]: event.target.value })}
              className="mt-1 w-full rounded-xl border border-hairline px-4 py-3 outline-none focus:border-ink"
            />
          </label>
        ))}
      </div>
      <div className={stepEmbed}>
        <LocationPinStep />
      </div>
    </div>
  );
}
