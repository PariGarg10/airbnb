import { Tag } from "lucide-react";

export function ReserveFeesBanner() {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-hairline bg-white px-4 py-3 shadow-[var(--shadow-tertiary)]">
      <Tag size={16} className="shrink-0 text-rausch" strokeWidth={2} />
      <span className="text-sm leading-[18px] text-ink">Prices include all fees</span>
    </div>
  );
}
