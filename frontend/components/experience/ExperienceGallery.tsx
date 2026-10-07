"use client";

import { LayoutGrid } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ListingPhotoLightbox } from "@/components/listing/modals/ListingPhotoLightbox";
import { ListingPhotoTour } from "@/components/listing/modals/ListingPhotoTour";
import { listingPhotoUrl } from "@/lib/listingPhotoUrl";
import type { ExperienceImage } from "@/types/experience";

const CORNERS = [
  "rounded-tl-[var(--r-12)] rounded-bl-[var(--r-12)]",
  "rounded-tr-[var(--r-12)]",
  "rounded-bl-[var(--r-12)]",
  "rounded-br-[var(--r-12)]",
] as const;

export function ExperienceGallery({
  images,
  title,
  onShare,
  onSave,
  wishlisted,
  sentinelRef,
}: {
  images: ExperienceImage[];
  title: string;
  onShare: () => void;
  onSave: () => void;
  wishlisted: boolean;
  sentinelRef?: React.RefObject<HTMLDivElement>;
}) {
  const [listOpen, setListOpen] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const sorted = useMemo(() => [...images].sort((a, b) => a.position - b.position), [images]);
  const photos = useMemo(() => sorted.map((img) => listingPhotoUrl(img.url, 800)), [sorted]);
  const gridPhotos = photos.slice(0, 4);

  return (
    <div ref={sentinelRef} className="relative w-full max-w-[712px]">
      <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-[var(--r-12)]">
        {gridPhotos.map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            onClick={() => setLightbox(index)}
            className={`relative aspect-square overflow-hidden bg-[var(--image-placeholder)] ${CORNERS[index] ?? ""}`}
          >
            <Image
              src={url}
              alt={index === 0 ? title : ""}
              fill
              className="object-cover transition duration-200 ease-standard hover:brightness-[0.92]"
              sizes="356px"
              priority={index === 0}
            />
          </button>
        ))}
      </div>
      {photos.length > 1 ? (
        <button
          type="button"
          onClick={() => setListOpen(true)}
          className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-ink bg-white shadow-[var(--shadow-tertiary)] hover:bg-soft min-[1128px]:bottom-6 min-[1128px]:right-6 min-[1128px]:h-auto min-[1128px]:w-auto min-[1128px]:gap-2 min-[1128px]:rounded-lg min-[1128px]:px-4 min-[1128px]:py-2.5"
          aria-label="Show all photos"
        >
          <LayoutGrid size={16} strokeWidth={2} />
          <span className="hidden text-sm font-semibold leading-[18px] min-[1128px]:inline">Show all photos</span>
        </button>
      ) : null}

      <ListingPhotoTour
        open={listOpen}
        onClose={() => setListOpen(false)}
        images={sorted.map((img, index) => ({ id: index, url: img.url, caption: null, position: img.position }))}
        onPickPhoto={(index) => {
          setListOpen(false);
          setLightbox(index);
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
          url={photos[lightbox]}
          onClose={() => setLightbox(null)}
          onPrev={() => setLightbox((i) => (i == null ? i : Math.max(0, i - 1)))}
          onNext={() => setLightbox((i) => (i == null ? i : Math.min(photos.length - 1, i + 1)))}
          onShare={onShare}
          onSave={onSave}
          wishlisted={wishlisted}
        />
      ) : null}
    </div>
  );
}
