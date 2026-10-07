"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError, reviewsApi } from "@/lib/api";

interface ReviewModalProps {
  open: boolean;
  bookingId: number;
  listingId: number;
  onClose: () => void;
  onSaved?: () => void;
}

export function ReviewModal({ open, bookingId, listingId, onClose, onSaved }: ReviewModalProps) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const shown = hover || rating;
  const length = comment.trim().length;
  const ready = rating >= 1 && length >= 10 && comment.length <= 1000;

  const review = useMutation({
    mutationFn: () => reviewsApi.create(bookingId, { rating, comment: comment.trim() }),
    onSuccess: async () => {
      toast.success("Thanks for your review!");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trips"] }),
        queryClient.invalidateQueries({ queryKey: ["booking", bookingId] }),
        queryClient.invalidateQueries({ queryKey: ["listing", listingId] }),
        queryClient.invalidateQueries({ queryKey: ["reviews", listingId] }),
      ]);
      setRating(0);
      setComment("");
      onSaved?.();
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.detail : "Could not post review");
    },
  });

  return (
    <Modal open={open} title="Write a review" onClose={onClose}>
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${value} star${value === 1 ? "" : "s"}`}
            className={`text-2xl ${value <= shown ? "text-ink" : "text-hairline"}`}
            onMouseEnter={() => setHover(value)}
            onClick={() => setRating(value)}
          >
            ★
          </button>
        ))}
      </div>
      <label className="mt-4 block text-body font-semibold text-ink">
        How was your stay?
        <textarea
          value={comment}
          maxLength={1000}
          onChange={(event) => setComment(event.target.value)}
          className="mt-2 min-h-32 w-full rounded-xl border border-hairline p-3 text-body font-normal outline-none focus:border-ink"
        />
      </label>
      <div className="mt-1 flex justify-between text-label text-muted">
        <span>{length < 10 ? "At least 10 characters" : ""}</span>
        <span>
          {comment.length}/1000
        </span>
      </div>
      <Button className="mt-4 w-full" disabled={!ready || review.isPending} onClick={() => review.mutate()}>
        {review.isPending ? "Submitting" : "Submit review"}
      </Button>
    </Modal>
  );
}
