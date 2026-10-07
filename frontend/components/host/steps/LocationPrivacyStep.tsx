"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { useMemo } from "react";
import { StepShell } from "@/components/host/wizard/StepShell";
import { useWizard } from "@/components/host/wizard/WizardContext";
import { INDIA_CENTER, lookupCity } from "@/lib/cities";

const LocationMap = dynamic(() => import("@/components/host/wizard/LocationMap"), {
  ssr: false,
  loading: () => <div className="aspect-[4/3] w-full skeleton rounded-2xl min-[1128px]:aspect-[16/10]" />,
});

export function LocationPrivacyStep() {
  const { draft, patch } = useWizard();
  const center = useMemo(() => {
    if (draft.lat !== 0 || draft.lng !== 0) return { lat: draft.lat, lng: draft.lng };
    return lookupCity(draft.city) ?? lookupCity(draft.address) ?? INDIA_CENTER;
  }, [draft.address, draft.city, draft.lat, draft.lng]);

  const addressLine = draft.address || `${draft.city}, ${draft.country}`;

  return (
    <StepShell
      title="Choose how guests see your location on a map"
      subtitle="We only share your address after guests book. Until then, they'll see an approximate location."
    >
      <div className="overflow-hidden rounded-2xl border border-hairline">
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-4 top-4 z-[500] flex items-center gap-2 truncate rounded-full bg-white px-4 py-2.5 text-body shadow-sm min-[1128px]:inset-x-6 min-[1128px]:top-5">
            <MapPin size={16} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{addressLine}</span>
          </div>
          <LocationMap lat={center.lat} lng={center.lng} interactive={false} className="min-[1128px]:h-[420px]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-1/2">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white shadow-lg">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path fill="currentColor" d="M12 3 3 11h2v9h6v-6h2v6h6v-9h2L12 3z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="flex items-start justify-between gap-4 border-t border-hairline px-5 py-5 min-[1128px]:px-6 min-[1128px]:py-6">
          <div>
            <p className="font-semibold text-ink">Show precise location</p>
            <p className="mt-1 text-meta text-muted">
              Let guests see your home&apos;s exact location on the map before they book.{" "}
              <button type="button" className="t-link underline decoration-1 underline-offset-2">
                Learn more
              </button>
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={draft.show_precise_location}
            aria-label="Show precise location"
            onClick={() => patch({ show_precise_location: !draft.show_precise_location })}
            className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors ${draft.show_precise_location ? "bg-ink" : "bg-hairline"}`}
          >
            <span
              className={`absolute top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow transition-[left] ${draft.show_precise_location ? "left-[24px]" : "left-1"}`}
            >
              {draft.show_precise_location ? (
                <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                  <path d="M10 3 4.5 8.5 2 6" stroke="#222" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </span>
          </button>
        </div>
      </div>
    </StepShell>
  );
}
