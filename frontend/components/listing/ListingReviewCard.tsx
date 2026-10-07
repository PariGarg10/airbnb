"use client";

import { format, parseISO } from "date-fns";
import { Avatar } from "@/components/ui/Avatar";
import { authorTenureLabel } from "@/lib/authorTenure";
import type { Review } from "@/types";

function reviewWhen(createdAt: string): string {
  const parsed = parseISO(createdAt);
  if (Number.isNaN(parsed.getTime())) return createdAt;
  return format(parsed, "MMMM yyyy");
}

export function ListingReviewCard({
  review,
  expanded,
  onToggle,
}: {
  review: Review;
  expanded: boolean;
  onToggle: () => void;
}) {
  const long = review.comment.length > 180;
  const when = reviewWhen(review.created_at);
  const stars = "★".repeat(Math.max(1, Math.min(5, review.rating)));

  return (
    <article>
      <div className="flex items-center gap-3">
        <Avatar name={review.author.name} src={review.author.avatar_url} size={40} className="min-[1128px]:!h-12 min-[1128px]:!w-12" />
        <div>
          <p className="t-review-name">{review.author.name}</p>
          <p className="t-review-meta max-[1127px]:block min-[1128px]:hidden">{when}</p>
          <p className="t-review-meta hidden min-[1128px]:block">{authorTenureLabel(review.author.created_at)}</p>
        </div>
      </div>
      <p className="mt-3 hidden text-[15px] leading-5 text-ink min-[1128px]:block">
        <span aria-hidden>{stars}</span> · {when}
      </p>
      <p className="mt-3 text-body min-[1128px]:hidden">{stars}</p>
      <p className={`t-review-text mt-2 whitespace-pre-wrap min-[1128px]:mt-3 ${expanded || !long ? "" : "line-clamp-3 min-[1128px]:line-clamp-6"}`}>
        {review.comment}
      </p>
      {long ? (
        <button type="button" className="t-link mt-2 min-[1128px]:font-semibold min-[1128px]:decoration-1" onClick={onToggle}>
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </article>
  );
}
