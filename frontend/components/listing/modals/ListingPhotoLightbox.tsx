"use client";

import { ChevronLeft, ChevronRight, Heart, Share2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";

export function ListingPhotoLightbox({
  open,
  index,
  total,
  url,
  caption,
  onClose,
  onPrev,
  onNext,
  onShare,
  onSave,
  wishlisted,
}: {
  open: boolean;
  index: number;
  total: number;
  url: string;
  caption?: string | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onShare: () => void;
  onSave: () => void;
  wishlisted: boolean;
}) {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1128px)");
    const apply = () => setDesktop(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") onNext();
      if (event.key === "ArrowLeft") onPrev();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onNext, onPrev]);

  return (
    <>
      {open && !desktop ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black">
          <button type="button" aria-label="Close" onClick={onClose} className="absolute left-4 top-4 rounded-full p-2 text-white hover:bg-white/10">
            <X size={22} />
          </button>
          <p className="absolute top-5 text-body text-white">
            {index + 1} / {total}
          </p>
          {index > 0 ? (
            <button type="button" aria-label="Previous photo" onClick={onPrev} className="absolute left-4 rounded-full bg-white p-2 text-ink">
              <ChevronLeft size={20} />
            </button>
          ) : null}
          <div className="relative h-[80vh] w-[min(1100px,92vw)]">
            <Image src={url} alt="" fill className="object-contain" sizes="92vw" />
          </div>
          {index < total - 1 ? (
            <button type="button" aria-label="Next photo" onClick={onNext} className="absolute right-4 rounded-full bg-white p-2 text-ink">
              <ChevronRight size={20} />
            </button>
          ) : null}
        </div>
      ) : null}

      {desktop ? (
        <Modal open={open} title="" onClose={onClose} variant="lightbox" hideHeader zIndex={80}>
          <header className="relative z-10 flex shrink-0 items-center justify-between px-6 py-5 text-white">
            <button type="button" onClick={onClose} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold hover:bg-white/10">
              <X size={18} />
              Close
            </button>
            <p className="text-sm font-medium">
              {index + 1} / {total}
            </p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={onShare} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10">
                <Share2 size={16} />
                Share
              </button>
              <button type="button" onClick={onSave} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10">
                <Heart size={16} className={wishlisted ? "fill-rausch text-rausch" : ""} />
                Save
              </button>
            </div>
          </header>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-16 pb-10">
            {index > 0 ? (
              <button
                type="button"
                aria-label="Previous photo"
                onClick={onPrev}
                className="absolute left-6 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-[var(--shadow-tertiary)] hover:scale-105"
              >
                <ChevronLeft size={20} />
              </button>
            ) : null}
            <div className="relative w-full max-w-[1100px]">
              <div className="relative h-[min(72vh,720px)] w-full">
                <Image src={url} alt="" fill className="object-contain" sizes="1100px" priority />
              </div>
              {caption ? (
                <p className="mt-4 max-w-[720px] text-center text-sm leading-[18px] text-white/90">{caption}</p>
              ) : null}
            </div>
            {index < total - 1 ? (
              <button
                type="button"
                aria-label="Next photo"
                onClick={onNext}
                className="absolute right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-[var(--shadow-tertiary)] hover:scale-105"
              >
                <ChevronRight size={20} />
              </button>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </>
  );
}
