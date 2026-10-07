import type { Quote } from "@/types";
import type { CheckoutQuote } from "@/types/booking";

export function toCheckoutQuote(quote: Quote): CheckoutQuote {
  return {
    nights: quote.nights,
    nightly_rate: quote.nightly_rate,
    nightly_breakdown: quote.nightly_breakdown,
    nights_total_original: quote.nights_total_original ?? quote.nights_total,
    nights_total: quote.nights_total,
    discount: quote.discount
      ? {
          type: quote.discount.type,
          pct: quote.discount.pct,
          amount: quote.discount.amount,
          reason_text: quote.discount.reason_text ?? "",
        }
      : null,
    coupon: quote.coupon ?? null,
    cleaning_fee: quote.cleaning_fee,
    service_fee: quote.service_fee,
    taxes: quote.taxes ?? 0,
    total: quote.total,
    original_total: quote.original_total,
    total_original: quote.total_original ?? quote.original_total,
    is_rare_find: quote.is_rare_find ?? false,
  };
}
