"use client";

import { X } from "lucide-react";
import { StayPriceBreakdown } from "@/components/pricing/StayPriceBreakdown";
import type { Quote } from "@/types";

export function PriceDetailsPopover({ quote, onClose }: { quote: Quote; onClose: () => void }) {
  return (
    <div className="absolute left-0 right-0 top-full z-40 mt-3 rounded-[var(--r-16)] border border-hairline bg-white p-6 shadow-[var(--shadow-primary)]">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold leading-5 text-ink">Price details</h3>
        <button type="button" aria-label="Close price details" onClick={onClose} className="rounded-full p-1 hover:bg-soft">
          <X size={16} />
        </button>
      </div>
      <StayPriceBreakdown quote={quote} totalLabel="Total" variant="popover" className="mt-4" />
    </div>
  );
}
