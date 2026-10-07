"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listingsApi } from "@/lib/api";
import type { CheckoutQuoteParams } from "@/types/booking";

export function useCheckoutQuote({ listingId, checkIn, checkOut, guests, coupon }: CheckoutQuoteParams) {
  return useQuery({
    queryKey: ["quote", listingId, checkIn, checkOut, guests, coupon ?? ""],
    queryFn: () =>
      listingsApi.quote(listingId, {
        check_in: checkIn,
        check_out: checkOut,
        guests,
        coupon,
      }),
    enabled: Boolean(checkIn && checkOut && guests >= 1),
    retry: false,
    placeholderData: keepPreviousData,
  });
}
