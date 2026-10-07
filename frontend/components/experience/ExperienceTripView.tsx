"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ApiError, experienceBookingsApi, experiencesApi } from "@/lib/api";
import { formatExperienceDateLong, formatExperienceTimeRange } from "@/lib/experienceDatetime";

const ExperienceMapInner = dynamic(() => import("@/components/experience/ExperienceMapInner"), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-2xl bg-soft" />,
});

export function ExperienceTripView({ bookingId }: { bookingId: number }) {
  const searchParams = useSearchParams();
  const confirmed = searchParams.get("confirmed") === "1";
  const queryClient = useQueryClient();

  const bookingQuery = useQuery({
    queryKey: ["experience-booking", bookingId],
    queryFn: () => experienceBookingsApi.get(bookingId),
  });

  const experienceQuery = useQuery({
    queryKey: ["experience", bookingQuery.data?.experience.id],
    queryFn: () => experiencesApi.get(bookingQuery.data!.experience.id),
    enabled: Boolean(bookingQuery.data?.experience.id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => experienceBookingsApi.cancel(bookingId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Booking cancelled");
    },
    onError: (error) => {
      if (error instanceof ApiError) toast.error(error.detail);
    },
  });

  const booking = bookingQuery.data;
  if (bookingQuery.isLoading) return <main className="container-airbnb py-16">Loading…</main>;
  if (bookingQuery.error instanceof ApiError) {
    return <main className="container-airbnb py-16 text-error">{bookingQuery.error.detail}</main>;
  }
  if (!booking) return null;

  const exp = booking.experience;
  const detail = experienceQuery.data;

  return (
    <main className="mx-auto max-w-[720px] px-6 py-12 min-[1128px]:py-16">
      {confirmed ? (
        <h1 className="text-[32px] font-semibold leading-9 text-ink">You&apos;re going to {exp.title}!</h1>
      ) : (
        <h1 className="text-page font-semibold text-ink">{exp.title}</h1>
      )}

      <p className="mt-4 text-base text-ink">{formatExperienceDateLong(booking.start_at)}</p>
      <p className="text-sm text-muted">{formatExperienceTimeRange(booking.start_at, booking.end_at)}</p>

      <div className="mt-8">
        <p className="font-semibold text-ink">{exp.meeting_point_name}</p>
        <p className="text-sm text-muted">{exp.meeting_point_address}</p>
        {detail ? (
          <div className="relative mt-4 h-64 overflow-hidden rounded-[var(--r-12)]">
            <ExperienceMapInner lat={detail.lat} lng={detail.lng} label={exp.meeting_point_name} />
          </div>
        ) : null}
      </div>

      <p className="mt-8 text-sm text-muted">
        Confirmation code: <span className="font-semibold text-ink">{booking.confirmation_code}</span>
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(exp.meeting_point_address)}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-ink px-5 py-2.5 text-sm font-semibold"
        >
          Get directions
        </a>
        <Link href="/trips" className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white">
          View trips
        </Link>
      </div>

      {booking.can_cancel ? (
        <button
          type="button"
          onClick={() => cancelMutation.mutate()}
          disabled={cancelMutation.isPending}
          className="mt-10 text-sm font-semibold underline text-muted"
        >
          Cancel reservation
        </button>
      ) : null}
    </main>
  );
}
