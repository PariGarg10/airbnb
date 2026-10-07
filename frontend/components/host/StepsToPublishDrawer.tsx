"use client";

import { Check, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export function StepsToPublishDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close steps" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-xl">
        <div className="flex h-16 items-center px-4">
          <span className="w-8" />
          <h2 className="t-modal-title flex-1 text-center">Steps to publish</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-soft">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3 px-6 pb-8">
          <div className="rounded-2xl border border-hairline p-4">
            <p className="font-semibold">Identity verification</p>
            <p className="text-meta text-muted">Not started</p>
            <div className="mt-4 rounded-xl bg-soft px-6 py-8 text-center">
              <ShieldCheck className="mx-auto text-rausch" size={36} />
              <p className="mt-4 t-subheading">Verify your identity</p>
              <p className="mt-2 text-meta text-muted">We&apos;ll gather some information to help confirm you&apos;re you.</p>
              <Link href="/verify-identity" onClick={onClose} className="mt-5 inline-flex rounded-lg bg-ink px-5 py-2.5 t-button text-white">
                Get started
              </Link>
            </div>
          </div>
          {[
            "Phone number confirmation",
            "Date of birth confirmation",
          ].map((label) => (
            <div key={label} className="flex items-center justify-between rounded-2xl border border-hairline p-4">
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-meta text-muted">Completed</p>
              </div>
              <Check className="text-green-600" size={20} />
            </div>
          ))}
        </div>
      </aside>
    </div>,
    document.body,
  );
}
