"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, useState } from "react";
import { SwitchUserModal } from "@/components/auth/SwitchUserModal";
import { EditorLayout } from "@/components/host/editor/EditorLayout";
import { draftFromListing } from "@/components/host/wizard/listingInput";
import { WizardProvider } from "@/components/host/wizard/WizardContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { ApiError, listingsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function EditorSkeleton() {
  return (
    <div className="flex h-[calc(100dvh-5rem)]">
      <div className="w-full space-y-3 border-r border-hairline p-6 md:w-[420px]">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-full rounded-full" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
      <div className="hidden flex-1 p-10 md:block">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-6 h-48 w-full max-w-[680px]" />
      </div>
    </div>
  );
}

function NotOwner() {
  const [open, setOpen] = useState(false);
  return (
    <main className="container-airbnb flex min-h-[60vh] items-center justify-center py-16">
      <div className="max-w-md rounded-2xl border border-hairline p-8 text-center">
        <h1 className="t-page-title">You don&apos;t own this listing</h1>
        <div className="mt-6 flex flex-col items-center gap-3">
          <Link href="/host/listings" className="rounded-lg bg-ink px-5 py-3 t-button text-white">
            Back to listings
          </Link>
          <button type="button" className="t-link" onClick={() => setOpen(true)}>
            Switch user
          </button>
        </div>
      </div>
      <SwitchUserModal open={open} onClose={() => setOpen(false)} />
    </main>
  );
}

export default function EditListingPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const { user, isLoading } = useAuth();
  const listing = useQuery({
    queryKey: ["listing", id, user?.id],
    queryFn: () => listingsApi.get(id),
    enabled: Number.isInteger(id) && id > 0 && !isLoading,
    retry: false,
  });

  if (!Number.isInteger(id) || id < 1) notFound();
  if (isLoading || listing.isLoading || (listing.isFetching && !listing.data)) return <EditorSkeleton />;
  if (listing.error instanceof ApiError && listing.error.status === 404) notFound();
  if (listing.error instanceof ApiError && listing.error.status === 403) return <NotOwner />;
  if (!listing.data) {
    return (
      <main className="container-airbnb py-16">
        <p className="text-meta text-muted">Could not load this listing</p>
      </main>
    );
  }
  if (!user || listing.data.host.id !== user.id) return <NotOwner />;

  return (
    <WizardProvider storageKey={null} initial={draftFromListing(listing.data)}>
      <Suspense fallback={<EditorSkeleton />}>
        <EditorLayout
          listingId={id}
          hostName={listing.data.host.name}
          joinedYear={listing.data.host.joined_year}
          avatarUrl={listing.data.host.avatar_url}
        />
      </Suspense>
    </WizardProvider>
  );
}
