"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SwitchUserModal } from "@/components/auth/SwitchUserModal";
import { CoverMosaic } from "@/components/wishlists/CoverMosaic";
import { Skeleton } from "@/components/ui/Skeleton";
import { ApiError, wishlistApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { savedCountLabel } from "@/lib/wishlistCache";

export function WishlistLogin({ title }: { title: string }) {
  const [authOpen, setAuthOpen] = useState(false);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) setAuthOpen(true);
  }, [isLoading, user]);

  return (
    <main className="container-airbnb py-16">
      <h1 className="t-page-title">{title}</h1>
      <p className="mt-3 text-body text-muted">Log in to see your saved places.</p>
      <button type="button" className="mt-4 t-link" onClick={() => setAuthOpen(true)}>
        Switch user
      </button>
      <SwitchUserModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </main>
  );
}

export function WishlistsView() {
  const { user, isLoading } = useAuth();
  const saved = useQuery({
    queryKey: ["wishlists", user?.id],
    queryFn: wishlistApi.list,
    enabled: Boolean(user),
  });

  if (isLoading) {
    return (
      <main className="container-airbnb py-10">
        <h1 className="t-page-title">Wishlists</h1>
      </main>
    );
  }

  if (!user) return <WishlistLogin title="Wishlists" />;

  const lists = saved.data ?? [];

  return (
    <main className="container-airbnb py-10">
      <h1 className="t-page-title">Wishlists</h1>
      {saved.isLoading ? (
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index}>
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <Skeleton className="mt-3 h-4 w-2/3" />
              <Skeleton className="mt-2 h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : null}
      {saved.error instanceof ApiError ? <p className="mt-8 text-body text-rausch">{saved.error.detail}</p> : null}
      {!saved.isLoading && lists.length === 0 ? (
        <div className="py-16">
          <h2 className="t-subheading">Create your first wishlist</h2>
          <p className="mt-2 max-w-md text-body text-muted">
            As you search, tap the heart icon to save your favourite places and sort them into lists.
          </p>
        </div>
      ) : null}
      {lists.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {lists.map((wishlist) => (
            <Link key={wishlist.id} href={`/wishlists/${wishlist.id}`} className="block min-w-0">
              <CoverMosaic images={wishlist.cover_images} />
              <p className="t-editor-title mt-3 truncate">{wishlist.name}</p>
              <p className="text-body text-muted">{savedCountLabel(wishlist.count)}</p>
            </Link>
          ))}
        </div>
      ) : null}
    </main>
  );
}
