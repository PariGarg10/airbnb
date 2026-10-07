"use client";

import { Heart, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BookingFloatCard } from "@/components/experience/BookingFloatCard";
import { CategoryPromo } from "@/components/experience/CategoryPromo";
import { ExperienceGallery } from "@/components/experience/ExperienceGallery";
import { ExperienceHighlights } from "@/components/experience/ExperienceHighlights";
import { ExperienceReviews } from "@/components/experience/ExperienceReviews";
import { HostAbout } from "@/components/experience/HostAbout";
import { ItineraryList } from "@/components/experience/ItineraryList";
import { MeetingPointMap } from "@/components/experience/MeetingPointMap";
import { SelectTimeModal } from "@/components/experience/SelectTimeModal";
import { StickyExperienceBar } from "@/components/experience/StickyExperienceBar";
import { ThingsToKnow } from "@/components/experience/ThingsToKnow";
import { experiencesApi } from "@/lib/api";
import { experienceCategoryLabel } from "@/lib/experienceLabels";
import type { ExperienceDetail, ExperienceSlot } from "@/types/experience";

export function ExperienceView({ initialExperience }: { initialExperience: ExperienceDetail }) {
  const router = useRouter();
  const experience = initialExperience;
  const [wishlisted, setWishlisted] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [nextSlot, setNextSlot] = useState<ExperienceSlot | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const coverUrl = useMemo(
    () => [...experience.images].sort((a, b) => a.position - b.position)[0]?.url ?? null,
    [experience.images],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setStickyVisible(!entry?.isIntersecting), { threshold: 0, rootMargin: "-80px 0px 0px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const { from, to } = (() => {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 45);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      return { from: fmt(start), to: fmt(end) };
    })();
    experiencesApi.slots(experience.id, { from, to, guests: 1 }).then((groups) => {
      const first = groups[0]?.slots[0] ?? null;
      setNextSlot(first);
    });
  }, [experience.id]);

  const share = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: experience.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* dismissed */
    }
  }, [experience.title]);

  const onNextTime = (slotId: number, adults: number) => {
    setTimeOpen(false);
    router.push(`/experiences/${experience.id}/book?slot=${slotId}&adults=${adults}`);
  };

  const breadcrumb = `${experience.city} · ${experienceCategoryLabel(experience.category)}`;

  return (
    <>
      <div className="max-[1127px]:px-6 max-[1127px]:py-8">
        <h1 className="text-page font-semibold">{experience.title}</h1>
        <p className="mt-2 text-muted">{breadcrumb}</p>
      </div>

      <div className="hidden min-[1128px]:block">
        <StickyExperienceBar
          visible={stickyVisible}
          title={experience.title}
          coverUrl={coverUrl}
          avgRating={experience.avg_rating}
          reviewCount={experience.review_count}
          pricePerGuest={experience.price_per_guest}
          onShowDates={() => setTimeOpen(true)}
        />

        <main className="mx-auto max-w-[1120px] px-6 pb-24 pt-6">
          <div className="grid grid-cols-[712px_1fr] gap-x-16 gap-y-0">
            <ExperienceGallery
              images={experience.images}
              title={experience.title}
              onShare={share}
              onSave={() => setWishlisted((v) => !v)}
              wishlisted={wishlisted}
              sentinelRef={sentinelRef}
            />
            <div className="pt-2">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-[32px] font-semibold leading-9 tracking-[-0.02em] text-ink">{experience.title}</h1>
                  <p className="mt-2 text-sm leading-[18px] text-muted">{breadcrumb}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2 pt-1">
                  <button type="button" onClick={share} aria-label="Share" className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold underline hover:bg-soft">
                    <Share2 size={16} /> Share
                  </button>
                  <button
                    type="button"
                    onClick={() => setWishlisted((v) => !v)}
                    aria-label="Save"
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold underline hover:bg-soft"
                  >
                    <Heart size={16} fill={wishlisted ? "currentColor" : "none"} /> Save
                  </button>
                </div>
              </div>
              <div className="mt-8">
                <ExperienceHighlights experience={experience} />
              </div>
            </div>
          </div>

          <div className="relative mt-12 grid grid-cols-[712px_1fr] gap-x-16">
            <div className="rounded-b-[var(--r-12)] bg-white pb-12">
              <ItineraryList items={experience.itinerary} />
              <ExperienceReviews
                avgRating={experience.avg_rating}
                reviewCount={experience.review_count}
                reviews={experience.reviews}
                reviewTotal={experience.review_total}
              />
              <MeetingPointMap
                name={experience.meeting_point_name}
                address={experience.meeting_point_address}
                lat={experience.lat}
                lng={experience.lng}
              />
              <HostAbout host={experience.host} city={experience.city} />
              <ThingsToKnow experience={experience} />
            </div>
            <aside className="relative">
              <div className="sticky top-28">
                <BookingFloatCard pricePerGuest={experience.price_per_guest} nextSlot={nextSlot} onShowDates={() => setTimeOpen(true)} />
              </div>
            </aside>
          </div>

          <CategoryPromo category={experience.category} />
        </main>
      </div>

      <SelectTimeModal
        open={timeOpen}
        onClose={() => setTimeOpen(false)}
        experienceId={experience.id}
        maxGuests={experience.max_guests_per_slot}
        minGuestAge={experience.guest_requirements}
        onNext={onNextTime}
      />
    </>
  );
}
