"use client";

import {
  BadgeCheck,
  KeyRound,
  MapPin,
  MessageCircle,
  Sparkles,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { LaurelLeft, LaurelRight } from "@/components/listing/ListingLaurels";
import { ListingReviewCard } from "@/components/listing/ListingReviewCard";
import { APP_NAME } from "@/lib/brand";
import { formatRating } from "@/lib/format";
import { isGuestFavourite } from "@/lib/isGuestFavourite";
import type { Review } from "@/types";

const MENTION_RULES: { label: string; icon: string; pattern: RegExp }[] = [
  { label: "Comfort", icon: "🛋️", pattern: /comfort|cozy|cosy|relax/i },
  { label: "Cleanliness", icon: "🧹", pattern: /clean|tidy|spotless/i },
  { label: "Value", icon: "💎", pattern: /value|worth|afford/i },
  { label: "Hospitality", icon: "🎁", pattern: /host|welcome|kind|helpful/i },
  { label: "Location", icon: "📍", pattern: /location|walk|near|central/i },
];

const CATEGORIES: { key: string; label: string; Icon: typeof Sparkles; offset: number }[] = [
  { key: "cleanliness", label: "Cleanliness", Icon: Sparkles, offset: 0 },
  { key: "accuracy", label: "Accuracy", Icon: BadgeCheck, offset: -0.04 },
  { key: "checkin", label: "Check-in", Icon: KeyRound, offset: 0.02 },
  { key: "communication", label: "Communication", Icon: MessageCircle, offset: 0 },
  { key: "location", label: "Location", Icon: MapPin, offset: -0.03 },
  { key: "value", label: "Value", Icon: Tag, offset: 0.01 },
];

function categoryScore(avg: number, offset: number): number {
  const value = Math.min(5, Math.max(4.5, avg + offset));
  return Math.round(value * 10) / 10;
}

function RatingDistribution({ distribution }: { distribution: Record<"1" | "2" | "3" | "4" | "5", number> }) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0) || 1;
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold leading-4 text-ink">Overall rating</p>
      {([5, 4, 3, 2, 1] as const).map((star) => (
        <div key={star} className="flex items-center gap-2">
          <span className="w-2 text-xs leading-4 text-ink">{star}</span>
          <div className="h-1 flex-1 rounded-full bg-divider">
            <div className="h-1 rounded-full bg-ink" style={{ width: `${(distribution[String(star) as "1"] / total) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MobileRatingBars({ distribution }: { distribution: Record<"1" | "2" | "3" | "4" | "5", number> }) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0) || 1;
  return (
    <div className="mt-6 max-w-sm space-y-2 min-[1128px]:hidden">
      {([5, 4, 3, 2, 1] as const).map((star) => (
        <div key={star} className="flex items-center gap-3 text-body">
          <span className="w-3">{star}</span>
          <div className="h-1 flex-1 rounded-full bg-hairline">
            <div className="h-1 rounded-full bg-ink" style={{ width: `${(distribution[String(star) as "1"] / total) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListingReviewsSection({
  avgRating,
  reviewCount,
  distribution,
  reviews,
  expandedReviews,
  onToggleReview,
  onShowAll,
}: {
  avgRating: number;
  reviewCount: number;
  distribution?: Record<"1" | "2" | "3" | "4" | "5", number>;
  reviews: Review[];
  expandedReviews: number[];
  onToggleReview: (id: number) => void;
  onShowAll: () => void;
}) {
  const guestFav = isGuestFavourite({ avg_rating: avgRating, review_count: reviewCount });

  const mentions = useMemo(() => {
    return MENTION_RULES.map((rule) => ({
      ...rule,
      count: reviews.filter((r) => rule.pattern.test(r.comment)).length,
    })).filter((item) => item.count > 0);
  }, [reviews]);

  if (reviewCount === 0) {
    return (
      <section id="reviews">
        <h2 className="t-heading">No reviews yet</h2>
      </section>
    );
  }

  return (
    <section id="reviews">
      <h2 className="t-heading min-[1128px]:hidden">
        ★ {formatRating(avgRating)} · {reviewCount} reviews
      </h2>

      <div className="hidden min-[1128px]:block">
        {guestFav ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-3">
              <LaurelLeft className="text-ink" />
              <p className="text-[48px] font-semibold leading-none tracking-tight text-ink">{formatRating(avgRating)}</p>
              <LaurelRight className="text-ink" />
            </div>
            <p className="mt-3 text-[22px] font-semibold leading-[26px] tracking-[-0.0275rem] text-ink">Guest favourite</p>
            <p className="mx-auto mt-2 max-w-[520px] text-sm leading-[18px] text-muted">
              {`This home is a guest favourite based on ratings, reviews, and reliability on ${APP_NAME}`}
            </p>
            <Link href="/coming-soon" className="mt-2 inline-block text-sm font-semibold leading-[18px] text-ink underline decoration-1 underline-offset-2">
              How reviews work
            </Link>
          </div>
        ) : (
          <h2 className="t-heading">
            ★ {formatRating(avgRating)} · {reviewCount} reviews
          </h2>
        )}

        {distribution ? (
          <div className={`flex flex-wrap items-stretch gap-0 border-b border-divider pb-8 ${guestFav ? "mt-10" : "mt-8"}`}>
            <div className="min-w-[140px] shrink-0 pr-8">
              <RatingDistribution distribution={distribution} />
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap">
              {CATEGORIES.map(({ label, Icon, offset }, index) => (
                <div
                  key={label}
                  className={`flex min-w-[88px] flex-1 flex-col items-center justify-between px-4 py-2 text-center ${
                    index > 0 ? "border-l border-divider" : ""
                  }`}
                >
                  <p className="text-xs font-semibold leading-4 text-ink">{label}</p>
                  <p className="mt-6 text-xs leading-4 text-ink">{formatRating(categoryScore(avgRating, offset))}</p>
                  <Icon size={20} strokeWidth={1.5} className="mt-6 text-ink" aria-hidden />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {mentions.length > 0 ? (
          <div className="mt-10">
            <h3 className="text-[22px] font-semibold leading-[26px] tracking-[-0.0275rem] text-ink">Guests mention</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {mentions.map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-white px-4 py-3 text-sm leading-[18px] text-ink shadow-[var(--shadow-tertiary)]"
                >
                  <span aria-hidden>{item.icon}</span>
                  {item.label} {item.count}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {distribution ? <MobileRatingBars distribution={distribution} /> : null}

      <div className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-2 min-[1128px]:mt-10 min-[1128px]:gap-y-10">
        {reviews.map((review) => (
          <ListingReviewCard
            key={review.id}
            review={review}
            expanded={expandedReviews.includes(review.id)}
            onToggle={() => onToggleReview(review.id)}
          />
        ))}
      </div>

      {reviewCount > 6 ? (
        <button
          type="button"
          onClick={onShowAll}
          className="mt-8 rounded-lg bg-quaternary px-6 py-3.5 text-sm font-semibold leading-[18px] text-ink transition hover:bg-divider min-[1128px]:mt-10"
        >
          Show all {reviewCount} reviews
        </button>
      ) : null}
    </section>
  );
}
