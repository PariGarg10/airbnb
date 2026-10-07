"use client";

import { CheckoutModalChrome } from "@/components/checkout/CheckoutModalChrome";
import { PriceLines } from "@/components/checkout/PriceLines";
import { formatBreakdownStayRange, formatInr } from "@/lib/format";
import type { CheckoutQuote } from "@/types/booking";

interface PriceBreakdownModalProps {
  open: boolean;
  onClose: () => void;
  quote: CheckoutQuote;
  checkIn: string;
  checkOut: string;
}

export function PriceBreakdownModal({ open, onClose, quote, checkIn, checkOut }: PriceBreakdownModalProps) {
  const range = formatBreakdownStayRange(checkIn, checkOut);
  const showTotalStrike = quote.total_original > quote.total;

  return (
    <CheckoutModalChrome open={open} title="Price breakdown" onClose={onClose} titleCentered wide>
      <div className="flex items-start justify-between gap-4 text-body text-ink">
        <span>
          {quote.nights} {quote.nights === 1 ? "night" : "nights"} · {range}
        </span>
        <span className="flex items-center gap-2">
          {quote.nights_total_original > quote.nights_total ? (
            <span className="text-muted line-through">{formatInr(quote.nights_total_original)}</span>
          ) : null}
          <span className="font-semibold">{formatInr(quote.nights_total)}</span>
        </span>
      </div>
      {quote.discount?.reason_text ? <p className="mt-2 text-meta text-muted">{quote.discount.reason_text}</p> : null}
      <div className="mt-6">
        <PriceLines quote={quote} variant="breakdown" />
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-divider pt-4 text-body font-semibold text-ink">
        <span>
          Total <span className="underline decoration-1 underline-offset-2">INR</span>
        </span>
        <span className="flex items-center gap-2">
          {showTotalStrike ? <span className="font-normal text-muted line-through">{formatInr(quote.total_original)}</span> : null}
          <span>{formatInr(quote.total)}</span>
        </span>
      </div>
    </CheckoutModalChrome>
  );
}
