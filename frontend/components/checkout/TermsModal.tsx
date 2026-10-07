"use client";

import { CheckoutModalChrome } from "@/components/checkout/CheckoutModalChrome";
import { APP_NAME } from "@/lib/brand";
import { TERMS_EUROPEAN_SECTIONS } from "@/lib/legal/terms-sections";

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

export function TermsModal({ open, onClose }: TermsModalProps) {
  const booking = TERMS_EUROPEAN_SECTIONS.find((section) => section.id === "guest-1") ?? TERMS_EUROPEAN_SECTIONS[0];

  return (
    <CheckoutModalChrome open={open} title="Booking terms" onClose={onClose}>
      <p className="mb-4 text-meta text-muted">
        By selecting the button below, you agree to {APP_NAME}&apos;s booking terms.
      </p>
      <h3 className="text-body font-semibold text-ink">{booking.title}</h3>
      <div className="mt-3 space-y-3 text-body text-ink">
        {booking.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>
    </CheckoutModalChrome>
  );
}
