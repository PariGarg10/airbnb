import { SERVICE_FEE_LABEL } from "@/lib/brand";
import { discountLineLabel } from "@/lib/discountLabels";
import { formatInr } from "@/lib/format";
import type { Quote } from "@/types";

export function StayPriceBreakdown({
  quote,
  totalLabel = "Total (INR)",
  totalOverride,
  originalTotalOverride,
  className = "",
  variant = "default",
}: {
  quote: Quote;
  totalLabel?: string;
  totalOverride?: number;
  originalTotalOverride?: number;
  className?: string;
  variant?: "default" | "popover";
}) {
  const total = totalOverride ?? quote.total;
  const original = originalTotalOverride ?? quote.original_total;
  const showStrike = original > total;
  const breakdown = quote.nightly_breakdown;

  const rows = (
    <>
      {breakdown.weekday_nights > 0 ? (
        <div className="flex justify-between gap-4">
          <span className="underline decoration-1 underline-offset-2">
            {formatInr(breakdown.weekday_rate)} x {breakdown.weekday_nights}{" "}
            {breakdown.weekday_nights === 1 ? "night" : "nights"}
          </span>
          <span>{formatInr(breakdown.weekday_subtotal)}</span>
        </div>
      ) : null}
      {breakdown.weekend_nights > 0 ? (
        <div className="flex justify-between gap-4">
          <span className="underline decoration-1 underline-offset-2">
            {formatInr(breakdown.weekend_rate)} x {breakdown.weekend_nights}{" "}
            {breakdown.weekend_nights === 1 ? "night" : "nights"}
          </span>
          <span>{formatInr(breakdown.weekend_subtotal)}</span>
        </div>
      ) : null}
      {!breakdown.weekday_nights && !breakdown.weekend_nights ? (
        <div className="flex justify-between gap-4">
          <span className="underline decoration-1 underline-offset-2">
            {formatInr(quote.nightly_rate)} x {quote.nights} {quote.nights === 1 ? "night" : "nights"}
          </span>
          <span>{formatInr(quote.nights_total)}</span>
        </div>
      ) : null}
      {quote.discount && quote.discount.amount > 0 ? (
        <div className="flex justify-between gap-4">
          <span>{discountLineLabel(quote.discount.type)}</span>
          <span>−{formatInr(quote.discount.amount)}</span>
        </div>
      ) : null}
      <div className="flex justify-between gap-4">
        <span>Cleaning fee</span>
        <span>{formatInr(quote.cleaning_fee)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="underline decoration-1 underline-offset-2">{SERVICE_FEE_LABEL}</span>
        <span>{formatInr(quote.service_fee)}</span>
      </div>
    </>
  );

  if (variant === "popover") {
    return (
      <div className={`space-y-3 text-base leading-5 text-ink ${className}`}>
        {rows}
        <div className="mt-4 flex justify-between gap-4 border-t border-divider bg-[#fff5f7] px-4 py-3 font-semibold">
          <span>{totalLabel}</span>
          <span className="flex items-center gap-2">
            {showStrike ? <span className="font-normal text-muted line-through">{formatInr(original)}</span> : null}
            <span>{formatInr(total)}</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 text-base leading-5 text-ink ${className}`}>
      {rows}
      <div className="flex justify-between gap-4 border-t border-hairline pt-3 font-semibold">
        <span>{totalLabel}</span>
        <span className="flex items-center gap-2">
          {showStrike ? <span className="font-normal text-muted line-through">{formatInr(original)}</span> : null}
          <span>{formatInr(total)}</span>
        </span>
      </div>
    </div>
  );
}
