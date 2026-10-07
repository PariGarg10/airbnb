"use client";

import { SERVICE_FEE_LABEL } from "@/lib/brand";
import { discountLineLabel } from "@/lib/discountLabels";
import { formatInr } from "@/lib/format";
import type { CheckoutQuote } from "@/types/booking";

interface PriceLinesProps {
  quote: CheckoutQuote;
  variant?: "summary" | "breakdown";
  checkIn?: string;
  checkOut?: string;
}

export function PriceLines({ quote, variant = "summary" }: PriceLinesProps) {
  const nightsStrike = quote.nights_total_original > quote.nights_total;
  const breakdown = quote.nightly_breakdown;
  const weekendDiffers =
    breakdown.weekend_nights > 0 &&
    breakdown.weekday_nights > 0 &&
    breakdown.weekend_rate !== breakdown.weekday_rate;

  if (variant === "breakdown") {
    return (
      <div className="space-y-4 text-body text-ink">
        <div className="flex items-start justify-between gap-4">
          <span>
            {quote.nights} {quote.nights === 1 ? "night" : "nights"}
          </span>
          <span className="flex items-center gap-2">
            {nightsStrike ? (
              <span className="text-muted line-through">{formatInr(quote.nights_total_original)}</span>
            ) : null}
            <span className="font-semibold">{formatInr(quote.nights_total)}</span>
          </span>
        </div>
        {quote.discount?.reason_text ? <p className="text-meta text-muted">{quote.discount.reason_text}</p> : null}
        {weekendDiffers ? (
          <>
            {breakdown.weekday_nights > 0 ? (
              <div className="flex justify-between gap-4">
                <span>
                  {formatInr(breakdown.weekday_rate)} × {breakdown.weekday_nights}{" "}
                  {breakdown.weekday_nights === 1 ? "night" : "nights"}
                </span>
                <span>{formatInr(breakdown.weekday_subtotal)}</span>
              </div>
            ) : null}
            {breakdown.weekend_nights > 0 ? (
              <div className="flex justify-between gap-4">
                <span>
                  {formatInr(breakdown.weekend_rate)} × {breakdown.weekend_nights}{" "}
                  {breakdown.weekend_nights === 1 ? "night" : "nights"}
                </span>
                <span>{formatInr(breakdown.weekend_subtotal)}</span>
              </div>
            ) : null}
          </>
        ) : null}
        <div className="flex justify-between gap-4">
          <span>Cleaning fee</span>
          <span>{formatInr(quote.cleaning_fee)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>{SERVICE_FEE_LABEL}</span>
          <span>{formatInr(quote.service_fee)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="underline decoration-1 underline-offset-2" title="GST 5%">
            Taxes
          </span>
          <span>{formatInr(quote.taxes ?? 0)}</span>
        </div>
        {quote.coupon && quote.coupon.amount > 0 ? (
          <div className="flex justify-between gap-4 text-discount">
            <span>Coupon {quote.coupon.code}</span>
            <span>−{formatInr(quote.coupon.amount)}</span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 text-body text-ink">
      <div className="flex justify-between gap-4">
        <span>
          {quote.nights} {quote.nights === 1 ? "night" : "nights"} × {formatInr(quote.nightly_rate)}
        </span>
        <span className="flex items-center gap-2">
          {nightsStrike ? (
            <span className="text-muted line-through">{formatInr(quote.nights_total_original)}</span>
          ) : null}
          <span>{formatInr(quote.nights_total)}</span>
        </span>
      </div>
      {quote.discount && quote.discount.amount > 0 ? (
        <div className="flex justify-between gap-4 text-discount">
          <span>{discountLineLabel(quote.discount.type)}</span>
          <span>−{formatInr(quote.discount.amount)}</span>
        </div>
      ) : null}
      <div className="flex justify-between gap-4">
        <span>Cleaning fee</span>
        <span>{formatInr(quote.cleaning_fee)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span>{SERVICE_FEE_LABEL}</span>
        <span>{formatInr(quote.service_fee)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="underline decoration-1 underline-offset-2" title="GST 5%">
          Taxes
        </span>
        <span>{formatInr(quote.taxes ?? 0)}</span>
      </div>
      {quote.coupon && quote.coupon.amount > 0 ? (
        <div className="flex justify-between gap-4 text-discount">
          <span>Coupon {quote.coupon.code}</span>
          <span>−{formatInr(quote.coupon.amount)}</span>
        </div>
      ) : null}
    </div>
  );
}
