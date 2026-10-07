"use client";

import { Avatar } from "@/components/ui/Avatar";
import { formatExperienceReviewMonth } from "@/lib/experienceDatetime";
import type { ExperienceReview } from "@/types/experience";

export function ExperienceReviewCard({
  review,
  expanded,
  onToggle,
}: {
  review: ExperienceReview;
  expanded: boolean;
  onToggle: () => void;
}) {
  const long = review.comment.length > 180;
  const when = formatExperienceReviewMonth(review.created_at);
  const stars = "★".repeat(Math.max(1, Math.min(5, review.rating)));

  return (
    <article>
      <div className="flex items-center gap-3">
        <Avatar name={review.author.name} src={review.author.avatar_url} size={40} />
        <div>
          <p className="text-base font-semibold leading-5 text-ink">{review.author.name}</p>
        </div>
      </div>
      <p className="mt-3 text-[15px] leading-5 text-ink">
        <span aria-hidden>{stars}</span> · {when}
      </p>
      <p className={`mt-2 whitespace-pre-wrap text-sm leading-[18px] text-ink ${expanded || !long ? "" : "line-clamp-6"}`}>
        {review.comment}
      </p>
      {long ? (
        <button type="button" className="mt-2 text-sm font-semibold underline" onClick={onToggle}>
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </article>
  );
}
