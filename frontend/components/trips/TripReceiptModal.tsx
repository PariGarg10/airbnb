"use client";

import { format, parseISO } from "date-fns";
import { Modal } from "@/components/ui/Modal";
import { SERVICE_FEE_LABEL } from "@/lib/brand";
import { discountLineLabel } from "@/lib/discountLabels";
import { formatInr } from "@/lib/format";
import type { BookingDetail } from "@/types";

export function TripReceiptModal({
  open,
  onClose,
  booking,
}: {
  open: boolean;
  onClose: () => void;
  booking: BookingDetail;
}) {
  const price = booking.price;
  const paid = booking.paid_at ? format(parseISO(booking.paid_at), "d MMM yyyy") : "—";

  return (
    <Modal open={open} title="Receipt" onClose={onClose} size="lg">
      <div id="trip-receipt-print" className="space-y-3 text-body text-ink">
        <p className="font-semibold">{booking.listing.title}</p>
        <p className="text-meta text-muted">Paid {paid} · {booking.confirmation_code}</p>
        <div className="flex justify-between">
          <span>
            {price.nights} {price.nights === 1 ? "night" : "nights"} × {formatInr(price.nightly_rate)}
          </span>
          <span>{formatInr(price.nights_total)}</span>
        </div>
        {price.discount && price.discount.amount > 0 ? (
          <div className="flex justify-between text-discount">
            <span>{discountLineLabel(price.discount.type)}</span>
            <span>−{formatInr(price.discount.amount)}</span>
          </div>
        ) : null}
        {price.coupon && price.coupon.amount > 0 ? (
          <div className="flex justify-between text-discount">
            <span>Coupon {price.coupon.code}</span>
            <span>−{formatInr(price.coupon.amount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span>Cleaning fee</span>
          <span>{formatInr(price.cleaning_fee)}</span>
        </div>
        <div className="flex justify-between">
          <span>{SERVICE_FEE_LABEL}</span>
          <span>{formatInr(price.service_fee)}</span>
        </div>
        <div className="flex justify-between">
          <span>Taxes</span>
          <span>{formatInr(price.taxes)}</span>
        </div>
        <div className="flex justify-between border-t border-divider pt-3 font-semibold">
          <span>Total</span>
          <span>{formatInr(price.total)}</span>
        </div>
      </div>
      <button
        type="button"
        className="mt-6 w-full rounded-lg bg-ink py-3 text-body font-semibold text-white"
        onClick={() => window.print()}
      >
        Print
      </button>
    </Modal>
  );
}
