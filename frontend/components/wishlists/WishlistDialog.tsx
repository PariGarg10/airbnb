"use client";

import { clsx } from "clsx";
import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CoverMosaic } from "@/components/wishlists/CoverMosaic";
import { savedCountLabel } from "@/lib/wishlistCache";
import type { WishlistSummary } from "@/types";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

interface WishlistDialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function WishlistDialog({ title, onClose, children }: WishlistDialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    const preferred = panel.querySelector<HTMLElement>("[data-autofocus]");
    (preferred ?? focusable()[0])?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <button type="button" aria-label="Close dialog" className="save-overlay absolute inset-0" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="save-panel relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-high sm:w-[568px] sm:rounded-3xl"
      >
        <div className="relative flex h-16 shrink-0 items-center border-b border-hairline px-4">
          <h2 id={titleId} className="t-modal-title pointer-events-none absolute inset-x-14 text-center">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full hover:bg-soft"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

interface WishlistNameModalProps {
  title: string;
  submitLabel: string;
  initialName?: string;
  pending?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export function WishlistNameModal({
  title,
  submitLabel,
  initialName = "",
  pending = false,
  error,
  onClose,
  onSubmit,
}: WishlistNameModalProps) {
  const inputId = useId();
  const helperId = useId();

  return (
    <NameModalForm
      key={initialName}
      title={title}
      submitLabel={submitLabel}
      initialName={initialName}
      pending={pending}
      error={error}
      inputId={inputId}
      helperId={helperId}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function NameModalForm({
  title,
  submitLabel,
  initialName,
  pending,
  error,
  inputId,
  helperId,
  onClose,
  onSubmit,
}: WishlistNameModalProps & { inputId: string; helperId: string }) {
  const [name, setName] = useState(initialName ?? "");
  const ready = name.trim().length > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const cleaned = name.trim();
    if (!cleaned || pending) return;
    onSubmit(cleaned);
  };

  return (
    <WishlistDialog title={title} onClose={onClose}>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="px-6 py-6">
          <div className="relative">
            <input
              id={inputId}
              data-autofocus
              value={name}
              maxLength={50}
              placeholder=" "
              autoComplete="off"
              aria-describedby={helperId}
              onChange={(event) => setName(event.target.value)}
              className={clsx(
                "peer h-14 w-full rounded-xl border border-faint bg-white pb-2 pl-4 pt-5 text-base text-ink outline-none focus:border-ink focus:ring-1 focus:ring-inset focus:ring-ink",
                name.length > 0 ? "pr-12" : "pr-4",
              )}
            />
            <label
              htmlFor={inputId}
              className="pointer-events-none absolute left-4 top-1/2 origin-left -translate-y-1/2 text-base text-muted transition-all duration-200 peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs"
            >
              Name
            </label>
            {name.length > 0 ? (
              <button
                type="button"
                aria-label="Clear name"
                onClick={() => setName("")}
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#ebebeb] text-ink"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            ) : null}
          </div>
          <p id={helperId} className="mt-2 text-label font-semibold text-muted">
            {name.length}/50 characters
          </p>
          {error ? (
            <p role="alert" className="mt-2 text-body text-rausch">
              {error}
            </p>
          ) : null}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-hairline px-6 py-4">
          <button type="button" onClick={onClose} className="t-link underline-offset-2">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!ready || pending}
            className={clsx(
              "t-button rounded-lg px-6 py-3.5 disabled:opacity-100",
              ready ? "bg-ink text-white" : "bg-softer text-faint",
            )}
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </WishlistDialog>
  );
}

interface SaveWishlistModalProps {
  wishlists: WishlistSummary[];
  pending?: boolean;
  onClose: () => void;
  onPick: (wishlist: WishlistSummary) => void;
  onCreate: () => void;
}

export function SaveWishlistModal({ wishlists, pending = false, onClose, onPick, onCreate }: SaveWishlistModalProps) {
  return (
    <WishlistDialog title="Save to wishlist" onClose={onClose}>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {wishlists.map((wishlist) => (
            <button
              key={wishlist.id}
              type="button"
              disabled={pending}
              onClick={() => onPick(wishlist)}
              className="text-left disabled:opacity-60"
            >
              <CoverMosaic images={wishlist.cover_images} />
              <p className="mt-2 truncate text-[15px] font-medium leading-[19px] text-ink">{wishlist.name}</p>
              <p className="text-body text-muted">{savedCountLabel(wishlist.count)}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-hairline px-6 py-4">
        <button
          type="button"
          disabled={pending}
          onClick={onCreate}
          className="w-full rounded-lg bg-ink px-6 py-3.5 t-button text-white disabled:opacity-60"
        >
          Create new wishlist
        </button>
      </div>
    </WishlistDialog>
  );
}
