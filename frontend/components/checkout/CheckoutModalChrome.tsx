"use client";

import { X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface CheckoutModalChromeProps {
  open: boolean;
  title: string;
  onClose: () => void;
  titleCentered?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}

export function CheckoutModalChrome({
  open,
  title,
  onClose,
  titleCentered = false,
  children,
  footer,
  wide = false,
}: CheckoutModalChromeProps) {
  return (
    <Modal open={open} title={title} onClose={onClose} hideHeader size={wide ? "lg" : "md"}>
      <div className={titleCentered ? "relative pb-2 pt-2 text-center" : "relative flex items-start justify-between pb-4 pt-2"}>
        {!titleCentered ? (
          <h2 className="text-[22px] font-semibold leading-[26px] tracking-[-0.0275rem] text-ink">{title}</h2>
        ) : (
          <h2 className="text-[22px] font-semibold leading-[26px] tracking-[-0.0275rem] text-ink">{title}</h2>
        )}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className={
            titleCentered
              ? "absolute right-0 top-2 flex h-8 w-8 items-center justify-center rounded-full hover:bg-soft"
              : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-soft"
          }
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>
      {children}
      {footer}
    </Modal>
  );
}
