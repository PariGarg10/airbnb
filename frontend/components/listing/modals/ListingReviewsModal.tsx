"use client";

import {
  BadgeCheck,
  ChevronDown,
  KeyRound,
  MapPin,
  MessageCircle,
  Search,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { LaurelLeft, LaurelRight } from "@/components/listing/ListingLaurels";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { APP_NAME } from "@/lib/brand";
import { authorTenureLabel } from "@/lib/authorTenure";
import { formatRating } from "@/lib/format";
import { isGuestFavourite } from "@/lib/isGuestFavourite";
import { format, parseISO } from "date-fns";
import type { Review } from "@/types";

const CATEGORIES = [
  { label: "Cleanliness", Icon: Sparkles, offset: 0 },
  { label: "Accuracy", Icon: BadgeCheck, offset: -0.04 },
  { label: "Check-in", Icon: KeyRound, offset: 0.02 },
  { label: "Communication", Icon: MessageCircle, offset: 0 },
  { label: "Location", Icon: MapPin, offset: -0.03 },
  { label: "Value", Icon: Tag, offset: 0.01 },
] as const;

function categoryScore(avg: number, offset: number): number {
  return Math.round(Math.min(5, Math.max(4.5, avg + offset)) * 10) / 10;
}

function reviewWhen(createdAt: string): string {
  const parsed = parseISO(createdAt);
  if (Number.isNaN(parsed.getTime())) return createdAt;
  return format(parsed, "MMMM yyyy");
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

function ModalReviewItem({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const long = review.comment.length > 320;
  const when = reviewWhen(review.created_at);
  const stars = "★".repeat(Math.max(1, Math.min(5, review.rating)));

  return (
    <article className="border-b border-divider py-8 last:border-0">
      <div className="flex items-center gap-3">
        <Avatar name={review.author.name} src={review.author.avatar_url} size={48} />
        <div>
          <p className="text-base font-semibold leading-5 text-ink">{review.author.name}</p>
          <p className="text-sm leading-[18px] text-muted">{authorTenureLabel(review.author.created_at)}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-[18px] text-ink">
        <span aria-hidden>{stars}</span> · {when}
      </p>
      <p className={`mt-3 whitespace-pre-wrap text-base leading-6 text-ink ${expanded || !long ? "" : "line-clamp-6"}`}>{review.comment}</p>
      {long ? (
        <button
          type="button"
          className="mt-2 text-sm font-semibold leading-[18px] text-ink underline decoration-1 underline-offset-2"
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </article>
  );
}

export function ListingReviewsModal({
  open,
  onClose,
  avgRating,
  reviewCount,
  distribution,
  reviews,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  open: boolean;
  onClose: () => void;
  avgRating: number;
  reviewCount: number;
  distribution?: Record<"1" | "2" | "3" | "4" | "5", number>;
  reviews: Review[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"relevant" | "recent">("relevant");
  const guestFav = isGuestFavourite({ avg_rating: avgRating, review_count: reviewCount });

  const filtered = useMemo(() => {
    let list = [...reviews];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((r) => r.comment.toLowerCase().includes(q) || r.author.name.toLowerCase().includes(q));
    }
    if (sort === "recent") {
      list.sort((a, b) => parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime());
    }
    return list;
  }, [reviews, query, sort]);

  return (
    <Modal open={open} title="Reviews" onClose={onClose} variant="listing" titleInBody size="lg">
      <div className="min-[1128px]:-mt-4">
        <div className="mb-4 hidden justify-end min-[1128px]:flex">
          <button type="button" aria-label="Close" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-soft">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="max-[1127px]:space-y-8 min-[1128px]:grid min-[1128px]:max-h-[min(780px,calc(100vh-160px))] min-[1128px]:grid-cols-[minmax(0,340px)_1fr] min-[1128px]:gap-0">
          <aside className="hidden min-h-0 min-[1128px]:block min-[1128px]:overflow-y-auto min-[1128px]:border-r min-[1128px]:border-divider min-[1128px]:pr-8">
            {guestFav ? (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <LaurelLeft className="text-ink" />
                  <p className="text-[40px] font-semibold leading-none tracking-tight text-ink">{formatRating(avgRating)}</p>
                  <LaurelRight className="text-ink" />
                </div>
                <p className="mt-2 text-lg font-semibold leading-6 text-ink">Guest favourite</p>
                <p className="mt-2 text-sm leading-[18px] text-muted">{`Based on ratings, reviews, and reliability on ${APP_NAME}`}</p>
                <Link href="/coming-soon" className="mt-2 inline-block text-sm font-semibold underline decoration-1 underline-offset-2">
                  How reviews work
                </Link>
              </div>
            ) : (
              <p className="text-[22px] font-semibold leading-[26px] text-ink">
                ★ {formatRating(avgRating)} · {reviewCount} reviews
              </p>
            )}

            {distribution ? (
              <div className="mt-8 border-t border-divider pt-8">
                <div className="flex flex-wrap items-stretch gap-0">
                  <div className="min-w-[120px] shrink-0 pr-4">
                    <RatingDistribution distribution={distribution} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-wrap">
                    {CATEGORIES.map(({ label, Icon, offset }, index) => (
                      <div
                        key={label}
                        className={`flex min-w-[72px] flex-1 flex-col items-center px-2 py-2 text-center ${index > 0 ? "border-l border-divider" : ""}`}
                      >
                        <p className="text-[10px] font-semibold leading-3 text-ink">{label}</p>
                        <p className="mt-4 text-xs leading-4 text-ink">{formatRating(categoryScore(avgRating, offset))}</p>
                        <Icon size={18} strokeWidth={1.5} className="mt-4 text-ink" aria-hidden />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </aside>

          <div className="flex min-h-0 min-w-0 flex-col min-[1128px]:pl-8">
            <div className="hidden shrink-0 items-center justify-between gap-4 min-[1128px]:flex">
              <h3 className="text-[22px] font-semibold leading-[26px] text-ink">{reviewCount} reviews</h3>
              <div className="flex items-center gap-2">
                <label className="relative">
                  <span className="sr-only">Sort reviews</span>
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as "relevant" | "recent")}
                    className="appearance-none rounded-full border border-hairline bg-white py-2 pl-4 pr-9 text-sm font-semibold leading-[18px] text-ink"
                  >
                    <option value="relevant">Most relevant</option>
                    <option value="recent">Most recent</option>
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink" />
                </label>
                <div className="relative">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search reviews"
                    className="w-[200px] rounded-full border border-hairline py-2 pl-9 pr-3 text-sm leading-[18px] text-ink placeholder:text-muted"
                  />
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 min-[1128px]:mt-6 min-[1128px]:overflow-y-auto">
              {filtered.map((review) => (
                <ModalReviewItem key={review.id} review={review} />
              ))}
              {hasNextPage ? (
                <Button variant="outline" className="mt-4" onClick={onLoadMore} disabled={isFetchingNextPage}>
                  {isFetchingNextPage ? "Loading" : "Load more"}
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-8 min-[1128px]:hidden">
          {filtered.map((review) => (
            <ModalReviewItem key={review.id} review={review} />
          ))}
          {hasNextPage ? (
            <Button variant="outline" onClick={onLoadMore} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? "Loading" : "Load more"}
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
