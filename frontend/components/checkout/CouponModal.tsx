"use client";

import { useState } from "react";
import { CheckoutModalChrome } from "@/components/checkout/CheckoutModalChrome";
import { Button } from "@/components/ui/Button";
import { ApiError, couponsApi } from "@/lib/api";

interface CouponModalProps {
  open: boolean;
  onClose: () => void;
  listingId: number;
  checkIn: string;
  checkOut: string;
  appliedCode?: string;
  onApply: (code: string) => void;
  onRemove: () => void;
}

export function CouponModal({
  open,
  onClose,
  listingId,
  checkIn,
  checkOut,
  appliedCode,
  onApply,
  onRemove,
}: CouponModalProps) {
  const [input, setInput] = useState(appliedCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const apply = async () => {
    const code = input.trim();
    if (!code) return;
    setPending(true);
    setError(null);
    try {
      const result = await couponsApi.validate({
        code,
        listing_id: listingId,
        check_in: checkIn,
        check_out: checkOut,
      });
      if (!result.valid) {
        setError(result.message || "This coupon isn't valid");
        return;
      }
      onApply(code);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not validate coupon");
    } finally {
      setPending(false);
    }
  };

  return (
    <CheckoutModalChrome open={open} title="Manage coupons" onClose={onClose}>
      {appliedCode ? (
        <div className="flex items-center justify-between rounded-xl border border-hairline px-4 py-3">
          <span className="text-body font-medium text-ink">{appliedCode}</span>
          <button type="button" className="text-body underline underline-offset-4" onClick={onRemove}>
            Remove
          </button>
        </div>
      ) : (
        <>
          <label className="block">
            <span className="sr-only">Coupon code</span>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Enter coupon code"
              className="w-full rounded-xl border border-faint px-4 py-3 text-body text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink"
            />
          </label>
          {error ? <p className="mt-2 text-label text-error">{error}</p> : null}
          <Button className="mt-4 w-full bg-ink text-white hover:bg-inverse-hover" disabled={pending || !input.trim()} onClick={apply}>
            {pending ? "Applying…" : "Apply"}
          </Button>
        </>
      )}
    </CheckoutModalChrome>
  );
}
