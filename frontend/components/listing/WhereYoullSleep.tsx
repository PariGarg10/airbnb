"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListingImage } from "@/components/listing/ListingImage";
import type { ListingImage as ListingImageType } from "@/types";

function splitBeds(totalBeds: number, roomCount: number): number[] {
  if (roomCount <= 0) return [];
  const base = Math.floor(totalBeds / roomCount);
  const extra = totalBeds % roomCount;
  return Array.from({ length: roomCount }, (_, index) => base + (index < extra ? 1 : 0));
}

function bedLine(count: number): string {
  if (count <= 0) return "No beds listed";
  if (count === 1) return "1 double bed";
  return `${count} single beds`;
}

function roomPhotoUrls(images: ListingImageType[]): string[] {
  const ordered = [...images].sort((a, b) => a.position - b.position);
  const withoutCover = ordered.length > 1 ? ordered.slice(1) : [];
  return withoutCover.map((image) => image.url);
}

interface SleepRoom {
  title: string;
  beds: number;
  photoUrl: string | null;
}

function buildRooms(bedrooms: number, beds: number, images: ListingImageType[]): SleepRoom[] {
  const count = bedrooms === 0 ? 1 : bedrooms;
  const titles =
    bedrooms === 0
      ? ["Living area"]
      : Array.from({ length: count }, (_, index) => `Bedroom ${index + 1}`);
  const bedCounts = splitBeds(Math.max(0, beds), count);
  const urls = roomPhotoUrls(images);

  return titles.map((title, index) => ({
    title,
    beds: bedCounts[index] ?? 0,
    photoUrl: urls.length > 0 ? urls[index % urls.length] : null,
  }));
}

function SleepCard({ room }: { room: SleepRoom }) {
  return (
    <article className="min-w-0 shrink-0 snap-start">
      <ListingImage src={room.photoUrl} alt={room.title} />
      <h3 className="mt-3 text-base font-medium leading-5 text-ink">{room.title}</h3>
      <p className="mt-1 text-sm leading-[18px] text-muted">{bedLine(room.beds)}</p>
    </article>
  );
}

export function WhereYoullSleep({
  bedrooms,
  beds,
  images,
}: {
  bedrooms: number;
  beds: number;
  images: ListingImageType[];
}) {
  const rooms = useMemo(() => buildRooms(bedrooms, beds, images), [bedrooms, beds, images]);
  const scrollable = rooms.length > 2;
  const pageCount = Math.ceil(rooms.length / 2);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  const syncPage = useCallback(() => {
    const node = scrollerRef.current;
    if (!node || !scrollable) return;
    const next = Math.round(node.scrollLeft / Math.max(node.clientWidth, 1));
    setPage(Math.min(pageCount - 1, Math.max(0, next)));
  }, [pageCount, scrollable]);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node || !scrollable) return;
    syncPage();
    node.addEventListener("scroll", syncPage, { passive: true });
    return () => node.removeEventListener("scroll", syncPage);
  }, [scrollable, syncPage]);

  const scrollPage = (direction: -1 | 1) => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth, behavior: "smooth" });
  };

  return (
    <section aria-labelledby="where-youll-sleep-heading" className="hidden min-[1128px]:block">
      <div className="flex items-center justify-between gap-4">
        <h2 id="where-youll-sleep-heading" className="t-heading">
          Where you&apos;ll sleep
        </h2>
        {scrollable ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous sleeping spaces"
              disabled={page <= 0}
              onClick={() => scrollPage(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline bg-white text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Next sleeping spaces"
              disabled={page >= pageCount - 1}
              onClick={() => scrollPage(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline bg-white text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
            <span className="min-w-[2.5rem] text-center text-sm leading-[18px] text-muted">
              {page + 1} / {pageCount}
            </span>
          </div>
        ) : null}
      </div>

      {scrollable ? (
        <div
          ref={scrollerRef}
          className="no-scrollbar mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth"
        >
          {rooms.map((room) => (
            <div key={room.title} className="w-[calc(50%-8px)] shrink-0">
              <SleepCard room={room} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4">
          {rooms.map((room) => (
            <SleepCard key={room.title} room={room} />
          ))}
        </div>
      )}
    </section>
  );
}
