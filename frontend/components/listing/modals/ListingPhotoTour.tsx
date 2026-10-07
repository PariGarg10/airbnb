"use client";

import { ChevronLeft, Heart, Share2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { buildPhotoTour, photoTourRows } from "@/lib/listingPhotos";

export function ListingPhotoTour({
  open,
  onClose,
  images,
  onPickPhoto,
  onShare,
  onSave,
  wishlisted,
}: {
  open: boolean;
  onClose: () => void;
  images: Parameters<typeof buildPhotoTour>[0];
  onPickPhoto: (index: number) => void;
  onShare: () => void;
  onSave: () => void;
  wishlisted: boolean;
}) {
  const { sections } = useMemo(() => buildPhotoTour(images), [images]);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1128px)");
    const apply = () => setDesktop(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  if (!desktop) return null;

  return (
      <Modal open={open} title="Photo tour" onClose={onClose} variant="fullscreen" hideHeader zIndex={70}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-10 flex h-[72px] shrink-0 items-center justify-between border-b border-divider bg-white px-6">
            <button type="button" aria-label="Back" onClick={onClose} className="flex items-center gap-1 rounded-lg p-2 hover:bg-soft">
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <div className="flex items-center gap-1">
              <button type="button" onClick={onShare} className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold underline decoration-1 underline-offset-2 hover:bg-soft">
                <Share2 size={16} />
                Share
              </button>
              <button type="button" onClick={onSave} className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold underline decoration-1 underline-offset-2 hover:bg-soft">
                <Heart size={16} className={wishlisted ? "fill-rausch text-rausch" : ""} />
                Save
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1120px] px-6 pb-16 pt-8">
              <h1 className="text-[32px] font-semibold leading-9 tracking-[-0.04rem] text-ink">Photo tour</h1>
              <div className="no-scrollbar mt-6 flex gap-3 overflow-x-auto pb-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => sectionRefs.current[section.id]?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className="w-[132px] shrink-0 text-left"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-placeholder">
                      {section.urls[0] ? <Image src={section.urls[0]} alt="" fill className="object-cover" sizes="132px" /> : null}
                    </div>
                    <p className="mt-2 text-xs font-semibold leading-4 text-ink">{section.label}</p>
                  </button>
                ))}
              </div>

              <div className="mt-10 space-y-12">
                {sections.map((section) => (
                  <section
                    key={section.id}
                    ref={(node) => {
                      sectionRefs.current[section.id] = node;
                    }}
                    className="scroll-mt-24"
                  >
                    <h2 className="text-[22px] font-semibold leading-[26px] tracking-[-0.0275rem] text-ink">{section.label}</h2>
                    <div className="mt-4 space-y-2">
                      {photoTourRows(section.urls).map((row) => {
                        const baseIndex = section.startIndex + row.index;
                        if (row.kind === "single") {
                          return (
                            <button
                              key={`${section.id}-s-${row.index}`}
                              type="button"
                              onClick={() => onPickPhoto(baseIndex)}
                              className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-placeholder"
                            >
                              <Image src={row.url} alt="" fill className="object-cover" sizes="1120px" />
                            </button>
                          );
                        }
                        return (
                          <div key={`${section.id}-p-${row.index}`} className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => onPickPhoto(baseIndex)}
                              className="relative aspect-[4/3] overflow-hidden rounded-xl bg-placeholder"
                            >
                              <Image src={row.left} alt="" fill className="object-cover" sizes="560px" />
                            </button>
                            {row.right ? (
                              <button
                                type="button"
                                onClick={() => onPickPhoto(baseIndex + 1)}
                                className="relative aspect-[4/3] overflow-hidden rounded-xl bg-placeholder"
                              >
                                <Image src={row.right} alt="" fill className="object-cover" sizes="560px" />
                              </button>
                            ) : (
                              <div />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Modal>
  );
}
