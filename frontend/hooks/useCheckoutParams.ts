"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { CheckoutGuestParams, CheckoutUrlParams } from "@/types/booking";

export type CheckoutPatch = Partial<
  Omit<CheckoutUrlParams, "coupon"> & {
    check_in: string | null;
    check_out: string | null;
    coupon: string | null;
  }
>;

function readCount(raw: string | null, fallback: number, min: number, max: number): number {
  const n = Number(raw);
  if (!Number.isInteger(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function useCheckoutParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const checkIn = searchParams.get("check_in") || undefined;
  const checkOut = searchParams.get("check_out") || undefined;
  const coupon = searchParams.get("coupon") || undefined;

  const guestsRaw = searchParams.get("guests");
  const adultsRaw = searchParams.get("adults");
  const adults = useMemo(() => {
    if (adultsRaw != null) return readCount(adultsRaw, 1, 1, 16);
    const legacy = readCount(guestsRaw, 1, 1, 16);
    return legacy;
  }, [adultsRaw, guestsRaw]);

  const children = readCount(searchParams.get("children"), 0, 0, 16);
  const infants = readCount(searchParams.get("infants"), 0, 0, 5);
  const pets = readCount(searchParams.get("pets"), 0, 0, 5);

  const guestCount = adults + children;

  const setCheckout = useCallback(
    (patch: CheckoutPatch) => {
      const params = new URLSearchParams(searchParams.toString());
      const write = (key: string, value: string | number | null | undefined) => {
        if (value == null || value === "") params.delete(key);
        else params.set(key, String(value));
      };

      if ("check_in" in patch) write("check_in", patch.check_in);
      if ("check_out" in patch) write("check_out", patch.check_out);
      if ("checkIn" in patch) write("check_in", patch.checkIn);
      if ("checkOut" in patch) write("check_out", patch.checkOut);
      if ("adults" in patch) write("adults", patch.adults);
      if ("children" in patch) write("children", patch.children);
      if ("infants" in patch) write("infants", patch.infants);
      if ("pets" in patch) write("pets", patch.pets);
      if ("coupon" in patch) write("coupon", patch.coupon);

      if ("adults" in patch || "children" in patch) {
        params.delete("guests");
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const listingBackQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (checkIn) params.set("check_in", checkIn);
    if (checkOut) params.set("check_out", checkOut);
    params.set("adults", String(adults));
    if (children) params.set("children", String(children));
    if (infants) params.set("infants", String(infants));
    if (pets) params.set("pets", String(pets));
    return params.toString();
  }, [adults, checkIn, checkOut, children, infants, pets]);

  const guests: CheckoutGuestParams = { adults, children, infants, pets };

  return {
    checkIn,
    checkOut,
    coupon,
    guests,
    guestCount,
    setCheckout,
    listingBackQuery,
  };
}
