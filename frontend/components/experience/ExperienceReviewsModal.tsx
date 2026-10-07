"use client";

import { Modal } from "@/components/ui/Modal";
import { ExperienceReviewCard } from "@/components/experience/ExperienceReviewCard";
import { formatRating } from "@/lib/format";
import { useState } from "react";
import type { ExperienceReview } from "@/types/experience";

export function ExperienceReviewsModal({
  open,
  onClose,
  avgRating,
  reviewTotal,
  reviews,
}: {
  open: boolean;
  onClose: () => void;
  avgRating: number;
  reviewTotal: number;
  reviews: ExperienceReview[];
}) {
  const [expanded, setExpanded] = useState<number[]>([]);
  const toggle = (id: number) => {
    setExpanded((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  };

  return (
    <Modal open={open} title={`★ ${formatRating(avgRating)} · ${reviewTotal} ratings`} onClose={onClose} size="lg" variant="listing" titleInBody>
      <div className="space-y-8 px-6 pb-8 min-[1128px]:px-8">
        {reviews.map((review) => (
          <ExperienceReviewCard
            key={review.id}
            review={review}
            expanded={expanded.includes(review.id)}
            onToggle={() => toggle(review.id)}
          />
        ))}
      </div>
    </Modal>
  );
}
