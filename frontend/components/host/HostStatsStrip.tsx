"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/Skeleton";
import { hostApi } from "@/lib/api";
import { formatInr } from "@/lib/format";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-hairline p-4">
      <p className="text-meta text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export function HostStatsStrip() {
  const stats = useQuery({ queryKey: ["host-stats"], queryFn: hostApi.stats });
  if (stats.isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total listings" value={String(stats.data?.total_listings ?? 0)} />
        <StatCard label="Active listings" value={String(stats.data?.active_listings ?? 0)} />
        <StatCard label="Upcoming reservations" value={String(stats.data?.upcoming_bookings ?? 0)} />
        <StatCard label="Earnings this month" value={formatInr(stats.data?.earnings_this_month ?? 0)} />
      </div>
      {stats.isError ? <p className="mt-3 text-body text-rausch">Could not load stats</p> : null}
    </div>
  );
}
