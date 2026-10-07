"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export function QuestionsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
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
      <button type="button" aria-label="Close questions" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex h-16 items-center px-4">
          <button type="button" aria-label="Close" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-soft">
            <X size={16} />
          </button>
          <h2 className="t-modal-title flex-1 text-center">Questions?</h2>
          <span className="w-8" />
        </div>
        <div className="px-6 py-4">
          <h3 className="t-subheading">Get quick tips</h3>
          <Link href="/coming-soon" className="mt-4 flex items-center gap-4 rounded-2xl border border-hairline p-2 pr-4 hover:bg-soft">
            <span className="flex h-16 w-24 items-center justify-center overflow-hidden rounded-xl bg-soft">
              <svg viewBox="0 0 80 56" className="h-12 w-16" aria-hidden="true">
                <rect x="8" y="10" width="64" height="36" rx="6" fill="#FFFFFF" stroke="#222222" />
                <circle cx="28" cy="28" r="6" fill="#FF385C" />
                <rect x="40" y="22" width="22" height="4" rx="2" fill="#222222" opacity="0.2" />
                <rect x="40" y="30" width="16" height="4" rx="2" fill="#222222" opacity="0.12" />
              </svg>
            </span>
            <span className="font-semibold">Completing your listing</span>
          </Link>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
