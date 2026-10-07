import type { NightlyBreakdown } from "@/types";

export type PaymentMethodType = "card" | "upi" | "netbanking";

export interface QuoteCoupon {
  code: string;
  amount: number;
}

export interface QuoteDiscount {
  type: string;
  pct: number;
  amount: number;
  reason_text: string;
}

export interface CheckoutQuote {
  nights: number;
  nightly_rate: number;
  nightly_breakdown: NightlyBreakdown;
  nights_total_original: number;
  nights_total: number;
  discount: QuoteDiscount | null;
  coupon: QuoteCoupon | null;
  cleaning_fee: number;
  service_fee: number;
  taxes: number;
  total: number;
  original_total: number;
  total_original: number;
  is_rare_find: boolean;
}

export interface CheckoutGuestParams {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

export interface CheckoutUrlParams extends CheckoutGuestParams {
  checkIn?: string;
  checkOut?: string;
  coupon?: string;
}

export interface CheckoutQuoteParams {
  listingId: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  coupon?: string;
}

export interface CouponValidation {
  valid: boolean;
  amount: number;
  message: string;
}

export interface BookingPaymentPayload {
  payment_method_type: PaymentMethodType;
  card_brand?: string;
  card_last4?: string;
}
