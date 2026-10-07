"use client";

import { LayoutGrid, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ListingPhotoLightbox } from "@/components/listing/modals/ListingPhotoLightbox";
import { ListingPhotoTour } from "@/components/listing/modals/ListingPhotoTour";
import { listingPhotoUrl } from "@/lib/listingPhotoUrl";
import type { ListingImage } from "@/types";

interface GalleryProps {
  images: ListingImage[];
  title: string;
  onShare: () => void;
  onSave: () => void;
  wishlisted: boolean;
}

const DESKTOP_CORNERS = [
  "min-[1128px]:rounded-tl-[var(--r-12)] min-[1128px]:rounded-bl-[var(--r-12)]",
  "",
  "min-[1128px]:rounded-tr-[var(--r-12)]",
  "",
  "min-[1128px]:rounded-br-[var(--r-12)]",
] as const;

export function Gallery({ images, title, onShare, onSave, wishlisted }: GalleryProps) {
  const [listOpen, setListOpen] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);
  const photos = useMemo(() => images.map((image) => listingPhotoUrl(image.url, 1200)), [images]);

  const openLightbox = (index: number) => setLightbox(index);
  const closeLightbox = () => setLightbox(null);
  const stepLightbox = (delta: -1 | 1) => {
    setLightbox((current) => {
      if (current == null) return current;
      return Math.min(photos.length - 1, Math.max(0, current + delta));
    });
  };

  return (
    <div id="photos">
      <div className="relative max-[1127px]:block min-[1128px]:hidden">
        <div
          className="flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(event) => {
            const width = event.currentTarget.clientWidth || 1;
            setMobileIndex(Math.round(event.currentTarget.scrollLeft / width));
          }}
        >
          {photos.map((url, index) => (
            <button key={`${url}-${index}`} type="button" className="relative aspect-[4/3] w-full shrink-0 snap-center bg-soft" onClick={() => openLightbox(index)}>
              <Image
                src={url}
                alt=""
                fill
                className="object-cover"
                sizes="100vw"
                priority={index === 0}
                loading={index === 0 ? undefined : "lazy"}
              />
            </button>
          ))}
        </div>
        {photos.length > 0 ? (
          <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-1 text-label text-white">
            {mobileIndex + 1} / {photos.length}
          </span>
        ) : null}
      </div>

      <div className="relative hidden h-[480px] grid-cols-4 grid-rows-2 gap-2 min-[1128px]:grid">
        {photos.slice(0, 5).map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            onClick={() => openLightbox(index)}
            className={`relative overflow-hidden bg-[var(--image-placeholder)] ${index === 0 ? "col-span-2 row-span-2" : ""} ${DESKTOP_CORNERS[index] ?? ""}`}
          >
            <Image
              src={url}
              alt={index === 0 ? title : ""}
              fill
              className="object-cover transition duration-200 ease-standard hover:brightness-[0.85]"
              sizes={index === 0 ? "50vw" : "25vw"}
              priority={index === 0}
              loading={index === 0 ? undefined : "lazy"}
            />
          </button>
        ))}
        {photos.length > 1 ? (
          <button
            type="button"
            onClick={() => setListOpen(true)}
            className="absolute bottom-6 right-6 flex items-center gap-2 rounded-lg border border-ink bg-white px-4 py-2.5 text-sm font-semibold leading-[18px] text-ink shadow-[var(--shadow-tertiary)] transition hover:bg-soft"
          >
            <LayoutGrid size={16} strokeWidth={2} />
            Show all photos
          </button>
        ) : null}
      </div>

      {listOpen ? (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-white min-[1128px]:hidden">
          <div className="sticky top-0 z-10 flex items-center border-b border-hairline bg-white px-4 py-3">
            <button type="button" aria-label="Close photos" onClick={() => setListOpen(false)} className="rounded-full p-2 hover:bg-soft">
              <X size={18} />
            </button>
            <p className="t-modal-title flex-1 text-center">Photo tour</p>
            <span className="w-8" />
          </div>
          <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
            {photos.map((url, index) => (
              <button key={`${url}-list-${index}`} type="button" className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-soft" onClick={() => openLightbox(index)}>
                <Image src={url} alt="" fill className="object-cover" sizes="768px" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <ListingPhotoTour
        open={listOpen}
        onClose={() => setListOpen(false)}
        images={images}
        onPickPhoto={(index) => {
          setListOpen(false);
          openLightbox(index);
        }}
        onShare={onShare}
        onSave={onSave}
        wishlisted={wishlisted}
      />

      {lightbox != null && photos[lightbox] ? (
        <ListingPhotoLightbox
          open
          index={lightbox}
          total={photos.length}
          url={photos[lightbox]!}
          caption={images[lightbox]?.caption ?? null}
          onClose={closeLightbox}
          onPrev={() => stepLightbox(-1)}
          onNext={() => stepLightbox(1)}
          onShare={onShare}
          onSave={onSave}
          wishlisted={wishlisted}
        />
      ) : null}
    </div>
  );
}
