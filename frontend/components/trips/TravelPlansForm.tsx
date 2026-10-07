"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { APP_NAME } from "@/lib/brand";
import { ApiError, bookingsApi } from "@/lib/api";

interface TravelPlansFormProps {
  bookingId: number;
  maxCompanions: number;
}

export function TravelPlansForm({ bookingId, maxCompanions }: TravelPlansFormProps) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState(() => Array.from({ length: Math.min(1, maxCompanions) }, () => ({ name: "", email: "" })));
  const [itineraryEmail, setItineraryEmail] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      const companions = rows
        .map((row) => ({ name: row.name.trim(), email: row.email.trim() }))
        .filter((row) => row.name && row.email);
      const extra = itineraryEmail.trim();
      if (extra && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(extra)) {
        companions.push({ name: "Guest", email: extra });
      }
      if (companions.length === 0) throw new ApiError(400, "Add at least one guest or email");
      return bookingsApi.addCompanions(bookingId, companions.slice(0, maxCompanions));
    },
    onSuccess: async () => {
      toast.success("Travel plans shared");
      await queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.detail : "Could not share travel plans");
    },
  });

  if (maxCompanions < 1) return null;

  return (
    <section className="mt-10">
      <h2 className="text-section font-semibold text-ink">Last step: share your travel plans</h2>
      <p className="mt-2 max-w-xl text-body text-muted">
        Let your host know who&apos;s travelling with you. If they&apos;re new to {APP_NAME}, we&apos;ll send them trip details
        by email.
      </p>
      <div className="mt-6 space-y-3">
        {rows.slice(0, maxCompanions).map((row, index) => (
          <div key={index} className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder={`Guest ${index + 2}: Full name`}
              value={row.name}
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...next[index], name: e.target.value };
                setRows(next);
              }}
              className="rounded-xl border border-hairline px-4 py-3 text-body outline-none focus:border-ink focus:ring-2 focus:ring-ink"
            />
            <input
              type="email"
              placeholder="Email address"
              value={row.email}
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...next[index], email: e.target.value };
                setRows(next);
              }}
              className="rounded-xl border border-hairline px-4 py-3 text-body outline-none focus:border-ink focus:ring-2 focus:ring-ink"
            />
          </div>
        ))}
      </div>
      {rows.length < maxCompanions ? (
        <button
          type="button"
          className="mt-3 text-body font-semibold underline underline-offset-4"
          onClick={() => setRows((prev) => [...prev, { name: "", email: "" }].slice(0, maxCompanions))}
        >
          Add another guest
        </button>
      ) : null}
      <p className="mt-6 text-body font-medium text-ink">Share your itinerary with anyone.</p>
      <input
        type="email"
        placeholder="Add email address"
        value={itineraryEmail}
        onChange={(e) => setItineraryEmail(e.target.value)}
        className="mt-2 w-full max-w-md rounded-xl border border-hairline px-4 py-3 text-body outline-none focus:border-ink focus:ring-2 focus:ring-ink"
      />
      <Button className="search-fill mt-6 px-8 py-3 text-white" disabled={submit.isPending} onClick={() => submit.mutate()}>
        {submit.isPending ? "Submitting…" : "Submit"}
      </Button>
    </section>
  );
}
