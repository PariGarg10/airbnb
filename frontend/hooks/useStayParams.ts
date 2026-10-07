"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export interface StayPatch {
  check_in?: string | null;
  check_out?: string | null;
  guests?: number | null;
}

export function useStayParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const checkIn = searchParams.get("check_in") || undefined;
  const checkOut = searchParams.get("check_out") || undefined;
  const guestsRaw = Number(searchParams.get("guests"));
  const guests = Number.isInteger(guestsRaw) && guestsRaw >= 1 ? guestsRaw : undefined;

  const setStay = useCallback(
    (patch: StayPatch) => {
      const params = new URLSearchParams(searchParams.toString());
      const write = (key: string, value: string | number | null | undefined) => {
        if (value == null || value === "") params.delete(key);
        else params.set(key, String(value));
      };
      if ("check_in" in patch) write("check_in", patch.check_in);
      if ("check_out" in patch) write("check_out", patch.check_out);
      if ("guests" in patch) write("guests", patch.guests);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { checkIn, checkOut, guests, setStay };
}
