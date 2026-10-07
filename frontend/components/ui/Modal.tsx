"use client";

import { clsx } from "clsx";
import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg";
  variant?: "default" | "filters" | "listing" | "fullscreen" | "lightbox";
  /** Listing desktop: title rendered in scroll body, not header bar */
  titleInBody?: boolean;
  /** Hide built-in header (fullscreen / lightbox custom chrome) */
  hideHeader?: boolean;
  zIndex?: number;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  size = "md",
  variant = "default",
  titleInBody = false,
  hideHeader = false,
  zIndex = 60,
}: ModalProps) {
  const isFilters = variant === "filters";
  const isListing = variant === "listing";
  const isFullscreen = variant === "fullscreen";
  const isLightbox = variant === "lightbox";
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    focusable()[0]?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
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
  }, [open, onClose]);

  if (!open) return null;

  const overlayClass = clsx(
    "absolute inset-0",
    isLightbox ? "bg-black listing-lightbox-overlay" : "bg-black/50",
    isFilters && "min-[1128px]:filters-modal-overlay",
    isListing && "min-[1128px]:listing-modal-overlay",
    isFullscreen && "bg-white listing-fullscreen-overlay",
    !isFullscreen && !isLightbox && "save-overlay",
  );

  const panelClass = clsx(
    "relative flex flex-col bg-white",
    isLightbox && "h-full w-full bg-transparent shadow-none",
    isFullscreen && "listing-fullscreen-panel flex h-full w-full max-h-none flex-col rounded-none shadow-none",
    !isFullscreen &&
      !isLightbox &&
      clsx(
        "modal-panel max-h-[90vh] w-full rounded-t-3xl shadow-high sm:rounded-3xl",
        size === "lg" ? "sm:max-w-[720px]" : "sm:max-w-[480px]",
        isFilters &&
          "min-[1128px]:max-h-[min(900px,calc(100vh-80px))] min-[1128px]:max-w-[var(--filters-modal-w)] min-[1128px]:rounded-[var(--r-32)] min-[1128px]:shadow-[var(--shadow-secondary)] min-[1128px]:filters-modal-panel",
        isListing &&
          "max-[1127px]:sm:max-w-[720px] min-[1128px]:max-h-[min(900px,calc(100vh-80px))] min-[1128px]:max-w-[780px] min-[1128px]:rounded-[var(--r-32)] min-[1128px]:shadow-[var(--shadow-secondary)] min-[1128px]:listing-modal-panel",
      ),
  );

  const listingTitleInBody = isListing && titleInBody;
  const showHeader = !hideHeader && !isLightbox;

  return createPortal(
    <div
      className={clsx(
        "fixed inset-0 flex justify-center",
        isFullscreen || isLightbox ? "items-stretch" : "items-end sm:items-center sm:p-6",
        isFilters && "min-[1128px]:p-10",
        isListing && "min-[1128px]:p-10",
      )}
      style={{ zIndex }}
    >
      <button type="button" aria-label="Close dialog" className={overlayClass} onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={panelClass}
        onClick={(event) => event.stopPropagation()}
      >
        {showHeader ? (
          <div
            className={clsx(
              "relative flex h-16 shrink-0 items-center border-b border-hairline px-4",
              isFilters && "min-[1128px]:justify-center min-[1128px]:px-6",
              isListing && "min-[1128px]:h-14 min-[1128px]:border-0 min-[1128px]:px-6",
              listingTitleInBody && "min-[1128px]:hidden",
            )}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className={clsx(
                "flex h-8 w-8 items-center justify-center rounded-full hover:bg-soft",
                (isFilters || isListing) &&
                  "min-[1128px]:absolute min-[1128px]:left-5 min-[1128px]:top-1/2 min-[1128px]:-translate-y-1/2",
              )}
            >
              <X size={16} strokeWidth={2.5} />
            </button>
            <h2
              id={titleId}
              className={clsx(
                "t-modal-title pointer-events-none text-center",
                isFilters || isListing
                  ? "min-[1128px]:static min-[1128px]:flex-1 max-[1127px]:absolute max-[1127px]:inset-x-12"
                  : "absolute inset-x-12",
                isListing && "min-[1128px]:hidden",
              )}
            >
              {title}
            </h2>
          </div>
        ) : null}

        {listingTitleInBody ? (
          <div className="hidden shrink-0 min-[1128px]:block min-[1128px]:px-8 min-[1128px]:pt-6">
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-soft"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        ) : null}

        {footer ? (
          <>
            <div
              className={clsx(
                "t-modal-body min-h-0 flex-1 overflow-y-auto px-6 py-4",
                isListing && "min-[1128px]:px-8 min-[1128px]:pb-8 min-[1128px]:pt-2",
                isFullscreen && "px-0 py-0",
              )}
            >
              {listingTitleInBody ? (
                <h2 id={titleId} className="mb-6 hidden text-[22px] font-semibold leading-[26px] tracking-[-0.0275rem] text-ink min-[1128px]:block">
                  {title}
                </h2>
              ) : null}
              {children}
            </div>
            {footer}
          </>
        ) : (
          <div
            className={clsx(
              "t-modal-body min-h-0 flex-1 overflow-y-auto px-6 py-4",
              isListing && "min-[1128px]:px-8 min-[1128px]:pb-8 min-[1128px]:pt-2",
              isFullscreen && "flex min-h-0 flex-col overflow-hidden px-0 py-0",
              isLightbox && "flex min-h-0 flex-col overflow-hidden px-0 py-0",
            )}
          >
            {listingTitleInBody ? (
              <h2 id={titleId} className="mb-6 hidden text-[22px] font-semibold leading-[26px] tracking-[-0.0275rem] text-ink min-[1128px]:block">
                {title}
              </h2>
            ) : null}
            {children}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
