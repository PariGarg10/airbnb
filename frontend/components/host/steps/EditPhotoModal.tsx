"use client";

import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

export function EditPhotoModal({
  open,
  url,
  caption,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  url: string;
  caption: string | null;
  onClose: () => void;
  onSave: (caption: string | null) => void;
  onDelete: () => void;
}) {
  const titleId = useId();
  const [text, setText] = useState(caption ?? "");

  useEffect(() => {
    if (open) setText(caption ?? "");
  }, [open, caption]);

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

  const trimmed = text.trim();
  const dirty = trimmed !== (caption ?? "").trim();

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 min-[1128px]:p-8">
      <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-high min-[1128px]:max-w-5xl"
      >
        <div className="relative border-b border-hairline px-6 py-4">
          <h2 id={titleId} className="text-center text-lg font-semibold">
            Edit photo
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full hover:bg-soft"
          >
            <X size={18} />
          </button>
        </div>
        <div className="grid flex-1 gap-6 overflow-y-auto px-6 py-6 min-[1128px]:grid-cols-2 min-[1128px]:gap-8 min-[1128px]:px-8 min-[1128px]:py-8">
          <div className="overflow-hidden rounded-2xl bg-soft min-[1128px]:min-h-[320px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="font-semibold text-ink">Caption</p>
            <p className="mt-2 text-meta text-muted">
              Mention what&apos;s special about this space like comfortable furniture or favourite details.
            </p>
            <textarea
              value={text}
              maxLength={250}
              rows={8}
              onChange={(event) => setText(event.target.value)}
              className="mt-4 w-full resize-none rounded-xl border border-ink p-4 text-body outline-none min-[1128px]:min-h-[200px]"
            />
            <p className="mt-2 text-label text-muted">{text.length}/250</p>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-hairline px-6 py-4 min-[1128px]:px-8">
          <button type="button" onClick={onDelete} className="t-link underline decoration-1 underline-offset-2">
            Delete photo
          </button>
          <button
            type="button"
            disabled={!dirty}
            onClick={() => onSave(trimmed ? trimmed : null)}
            className="rounded-lg bg-ink px-8 py-3 text-base font-semibold text-white disabled:bg-soft disabled:text-faint min-[1128px]:min-w-[120px]"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
