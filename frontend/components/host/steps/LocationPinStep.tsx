"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { StepShell } from "@/components/host/wizard/StepShell";
import { useWizard } from "@/components/host/wizard/WizardContext";
import { INDIA_CENTER, lookupCity } from "@/lib/cities";

const LocationMap = dynamic(() => import("@/components/host/wizard/LocationMap"), {
  ssr: false,
  loading: () => <div className="h-[360px] w-full skeleton rounded-2xl" />,
});

export function LocationPinStep() {
  const { draft, patch } = useWizard();
  const center = useMemo(() => {
    if (draft.lat !== 0 || draft.lng !== 0) return { lat: draft.lat, lng: draft.lng };
    return lookupCity(draft.city) ?? lookupCity(draft.address) ?? INDIA_CENTER;
  }, [draft.address, draft.city, draft.lat, draft.lng]);

  const addressLine = draft.address || `${draft.city}, ${draft.country}`;

  return (
    <StepShell title="Is the pin in the right spot?" subtitle="Your address is only shared with guests after they book.">
      <div className="relative overflow-hidden rounded-2xl min-[1128px]:rounded-3xl">
        <div className="pointer-events-none absolute inset-x-4 top-4 z-[500] truncate rounded-full bg-white px-4 py-2.5 text-body shadow-sm min-[1128px]:inset-x-6 min-[1128px]:top-5">
          {addressLine}
        </div>
        <LocationMap lat={center.lat} lng={center.lng} onMove={(lat, lng) => patch({ lat, lng })} />
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white shadow-lg">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path fill="currentColor" d="M12 3 3 11h2v9h6v-6h2v6h6v-9h2L12 3z" />
            </svg>
          </div>
        </div>
        <p className="pointer-events-none absolute left-1/2 top-[calc(50%+28px)] z-[500] -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-label text-white">
          Drag the map to reposition the pin
        </p>
      </div>
    </StepShell>
  );
}
