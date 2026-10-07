"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { TripSidebarSummary } from "@/components/trips/TripSidebarSummary";
import { Button } from "@/components/ui/Button";
import { ApiError, bookingsApi } from "@/lib/api";
import { CANCEL_REASONS } from "@/lib/trips/cancelReasons";
import { formatInr } from "@/lib/format";
import type { CancelReason } from "@/types";

type Step = 1 | 2 | 3;

export function CancelReservationFlow({ bookingId }: { bookingId: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>(1);
  const [reason, setReason] = useState<CancelReason | null>(null);
  const [otherText, setOtherText] = useState("");

  const bookingQuery = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingsApi.get(bookingId),
  });
  const previewQuery = useQuery({
    queryKey: ["cancellation-preview", bookingId],
    queryFn: () => bookingsApi.cancellationPreview(bookingId),
    enabled: step >= 2,
  });

  const cancel = useMutation({
    mutationFn: () => bookingsApi.cancel(bookingId, reason!),
    onSuccess: async (updated) => {
      setStep(3);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trips"] }),
        queryClient.invalidateQueries({ queryKey: ["booked-dates", updated.listing_id] }),
        queryClient.invalidateQueries({ queryKey: ["quote"] }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.detail : "Could not cancel");
    },
  });

  const booking = bookingQuery.data;
  const preview = previewQuery.data;

  if (!booking) {
    return <main className="mx-auto max-w-lg px-6 py-16 text-muted">Loading…</main>;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-divider px-6 py-4">
        <Link href={`/trips/${bookingId}`} className="inline-flex items-center gap-2 text-body font-medium text-ink">
          <ChevronLeft size={20} /> Back
        </Link>
      </header>

      <main className="mx-auto max-w-[720px] px-6 py-10">
        {step === 1 ? (
          <>
            <h1 className="text-page font-semibold text-ink">Why do you need to cancel?</h1>
            <fieldset className="mt-8 space-y-4">
              {CANCEL_REASONS.map((item) => (
                <label key={item.value} className="flex cursor-pointer items-start gap-3 text-body text-ink">
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === item.value}
                    onChange={() => setReason(item.value)}
                    className="mt-1"
                  />
                  {item.label}
                </label>
              ))}
            </fieldset>
            {reason === "other" ? (
              <textarea
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="Tell us more (optional)"
                className="mt-4 min-h-24 w-full rounded-xl border border-hairline p-3 text-body outline-none focus:border-ink"
              />
            ) : null}
            <Button
              className="mt-8 w-full bg-ink py-3.5 text-white disabled:opacity-40"
              disabled={!reason}
              onClick={() => setStep(2)}
            >
              Next
            </Button>
          </>
        ) : null}

        {step === 2 && previewQuery.isLoading ? (
          <p className="mt-8 text-muted">Loading refund details…</p>
        ) : null}

        {step === 2 && previewQuery.isError ? (
          <p className="mt-8 text-error">Could not load cancellation preview.</p>
        ) : null}

        {step === 2 && preview ? (
          <>
            <h1 className="text-page font-semibold text-ink">Confirm cancellation</h1>
            <div className="mt-8">
              <TripSidebarSummary booking={booking} />
            </div>
            <div className="mt-8 space-y-2 text-body text-ink">
              {preview.lines.map((line) => (
                <div key={line.label} className="flex justify-between">
                  <span>{line.label}</span>
                  <span>{formatInr(line.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-divider pt-3 font-semibold">
                <span>Your total refund</span>
                <span>{formatInr(preview.refund_amount)}</span>
              </div>
            </div>
            <p className="mt-4 text-meta text-muted">{preview.policy_text}</p>
            <p className="mt-2 text-body font-medium text-ink">This can&apos;t be undone.</p>
            <Button
              className="search-fill mt-8 w-full py-3.5 text-white"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              Cancel reservation
            </Button>
            <button type="button" className="mt-4 w-full underline underline-offset-4" onClick={() => router.push(`/trips/${bookingId}`)}>
              Keep reservation
            </button>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h1 className="text-page font-semibold text-ink">Your reservation has been cancelled</h1>
            <p className="mt-4 text-body text-ink">
              Refund: {formatInr(preview?.refund_amount ?? booking.refund_amount ?? booking.total_price)}
            </p>
            <p className="mt-2 text-meta text-muted">Refunds usually arrive in 5–7 business days (simulated).</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/trips" className="rounded-lg bg-ink px-5 py-3 text-white">
                View trips
              </Link>
              <Link href="/" className="underline underline-offset-4">
                Explore homes
              </Link>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
