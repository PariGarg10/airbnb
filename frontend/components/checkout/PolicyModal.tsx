"use client";

import { CheckoutModalChrome } from "@/components/checkout/CheckoutModalChrome";
import { APP_NAME } from "@/lib/brand";

interface PolicyModalProps {
  open: boolean;
  onClose: () => void;
}

export function PolicyModal({ open, onClose }: PolicyModalProps) {
  return (
    <CheckoutModalChrome open={open} title="Cancellation policy" onClose={onClose}>
      <div className="space-y-4 text-body text-ink">
        <p>
          Free cancellation before check-in for a full refund, minus the service fee. After that, cancel before check-in
          and get a partial refund.
        </p>
        <p className="text-muted">
          Pending requests can be cancelled anytime for a full refund. {APP_NAME} may also refund under major disruptive
          events when eligible.
        </p>
      </div>
    </CheckoutModalChrome>
  );
}
