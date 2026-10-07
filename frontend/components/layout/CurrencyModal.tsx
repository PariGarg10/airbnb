"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { CURRENCIES, formatCurrencyLabel, type CurrencyOption } from "@/lib/legal/currencies";

export function CurrencyModal({
  open,
  selectedCode,
  onClose,
  onSelect,
}: {
  open: boolean;
  selectedCode: string;
  onClose: () => void;
  onSelect: (currency: CurrencyOption) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10 md:py-16">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="currency-modal-title"
        className="modal-panel w-full max-w-[780px] rounded-2xl bg-white p-6 shadow-primary md:p-8"
      >
        <div className="mb-6 flex items-start gap-4">
          <button
            ref={closeRef}
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-quaternary"
          >
            <X size={16} />
          </button>
          <h2 id="currency-modal-title" className="text-[22px] font-semibold leading-7 text-ink">
            Choose a currency
          </h2>
        </div>
        <ul className="currency-grid max-h-[min(520px,60vh)] overflow-y-auto pr-1">
          {CURRENCIES.map((currency) => {
            const selected = currency.code === selectedCode;
            return (
              <li key={currency.code}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(currency);
                    onClose();
                  }}
                  className={`currency-option w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                    selected ? "border-ink bg-white" : "border-transparent hover:bg-quaternary"
                  }`}
                >
                  <span className="block text-sm font-normal text-ink">{currency.name}</span>
                  <span className="mt-0.5 block text-sm text-muted">{formatCurrencyLabel(currency)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
