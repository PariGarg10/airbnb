"use client";

import Link from "next/link";
import { useState } from "react";
import { ExperienceReviewCard } from "@/components/experience/ExperienceReviewCard";
import { ExperienceReviewsModal } from "@/components/experience/ExperienceReviewsModal";
import { formatRating } from "@/lib/format";
import type { ExperienceReview } from "@/types/experience";

export function ExperienceReviews({
  avgRating,
  reviewCount,
  reviews,
  reviewTotal,
}: {
  avgRating: number;
  reviewCount: number;
  reviews: ExperienceReview[];
  reviewTotal: number;
}) {
  const [expanded, setExpanded] = useState<number[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const toggle = (id: number) => {
    setExpanded((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  };

  return (
    <section className="mt-12 border-t border-hairline pt-12">
      <h2 className="text-2xl font-semibold leading-7 text-ink">
        ★ {formatRating(avgRating)} · {reviewCount} ratings
      </h2>
      <div className="mt-8 grid grid-cols-2 gap-x-10 gap-y-10">
        {reviews.slice(0, 4).map((review) => (
          <ExperienceReviewCard
            key={review.id}
            review={review}
            expanded={expanded.includes(review.id)}
            onToggle={() => toggle(review.id)}
          />
        ))}
      </div>
      {reviewTotal > 0 ? (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="mt-8 rounded-lg border border-ink px-6 py-3 text-sm font-semibold text-ink hover:bg-soft"
        >
          Show all {reviewTotal} ratings
        </button>
      ) : null}
      <p className="mt-4 text-sm text-muted">
        <Link href="/help/article/reviews" className="underline">
          Learn how reviews work
        </Link>
      </p>
      <ExperienceReviewsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        avgRating={avgRating}
        reviewTotal={reviewTotal}
        reviews={reviews}
      />
    </section>
  );
}
