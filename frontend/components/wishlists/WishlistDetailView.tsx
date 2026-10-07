"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Map, MoreHorizontal } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SwitchUserModal } from "@/components/auth/SwitchUserModal";
import { ListingCard } from "@/components/listings/ListingCard";
import { WishlistDialog, WishlistNameModal } from "@/components/wishlists/WishlistDialog";
import { WishlistLogin } from "@/components/wishlists/WishlistsView";
import { Skeleton } from "@/components/ui/Skeleton";
import { ApiError, wishlistApi } from "@/lib/api";
import { useMinWidth } from "@/hooks/useMinWidth";
import { useAuth } from "@/lib/auth";
import { applyListingSaved } from "@/lib/wishlistCache";
import type { WishlistSummary } from "@/types";

const ListingsMap = dynamic(() => import("@/components/listings/ListingsMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-2xl bg-[#ebebeb]" />,
});

export function WishlistDetailView({ wishlistId }: { wishlistId: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renamePending, setRenamePending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [mobileMap, setMobileMap] = useState(false);
  const desktopMap = useMinWidth(1128);

  const lists = useQuery({
    queryKey: ["wishlists", user?.id],
    queryFn: wishlistApi.list,
    enabled: Boolean(user),
  });
  const cards = useQuery({
    queryKey: ["wishlist-items", wishlistId, user?.id],
    queryFn: () => wishlistApi.items(wishlistId),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuOpen]);

  if (isLoading) {
    return (
      <main className="px-6 py-10 min-[1128px]:px-12">
        <Skeleton className="h-9 w-56" />
      </main>
    );
  }

  if (!user) return <WishlistLogin title="Wishlists" />;

  const wishlist = lists.data?.find((item) => item.id === wishlistId);
  const missing = cards.error instanceof ApiError && (cards.error.status === 404 || cards.error.status === 403);
  const items = cards.data ?? [];
  const showMap = mapExpanded || mobileMap;
  const mountMap = items.length > 0 && (desktopMap || mobileMap || mapExpanded);
  const name = wishlist?.name ?? "Wishlist";

  const rename = async (nextName: string) => {
    setRenamePending(true);
    setRenameError(null);
    try {
      const updated = await wishlistApi.rename(wishlistId, nextName);
      queryClient.setQueryData<WishlistSummary[]>(["wishlists", user.id], (current) =>
        current?.map((item) => (item.id === updated.id ? updated : item)),
      );
      setRenaming(false);
    } catch (error) {
      setRenameError(error instanceof ApiError ? error.detail : "Could not rename wishlist");
    } finally {
      setRenamePending(false);
    }
  };

  const remove = async () => {
    setDeletePending(true);
    try {
      const current = queryClient.getQueryData<WishlistSummary[]>(["wishlists", user.id]) ?? [];
      const removed = current.find((item) => item.id === wishlistId);
      await wishlistApi.remove(wishlistId);
      const rest = current.filter((item) => item.id !== wishlistId);
      if (removed) {
        for (const listingId of removed.listing_ids) {
          const stillSaved = rest.some((item) => item.listing_ids.includes(listingId));
          if (!stillSaved) applyListingSaved(queryClient, listingId, false);
        }
      }
      queryClient.setQueryData(["wishlists", user.id], rest);
      queryClient.removeQueries({ queryKey: ["wishlist-items", wishlistId] });
      router.push("/wishlists");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not delete wishlist");
      setDeletePending(false);
    }
  };

  return (
    <div>
      <div className="px-6 pb-2 pt-6 min-[1128px]:px-12">
        {missing ? (
          <div className="py-16">
            <h1 className="t-page-title">Wishlist not found</h1>
            <Link href="/wishlists" className="mt-4 inline-block t-link">
              Back to wishlists
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/wishlists"
                aria-label="Back to wishlists"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-soft"
              >
                <ChevronLeft size={18} />
              </Link>
              <h1 className="t-page-title truncate">{lists.isLoading ? "Wishlist" : name}</h1>
            </div>
            <div className="relative">
              <button
                type="button"
                aria-label="Wishlist options"
                aria-expanded={menuOpen}
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen((open) => !open);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-soft"
              >
                <MoreHorizontal size={18} />
              </button>
              {menuOpen ? (
                <div className="dropdown-pop absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl bg-white py-2 shadow-popover">
                  <button
                    type="button"
                    className="block w-full px-4 py-3 text-left text-body hover:bg-soft"
                    onClick={() => {
                      setRenameError(null);
                      setRenaming(true);
                      setMenuOpen(false);
                    }}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className="block w-full px-4 py-3 text-left text-body hover:bg-soft"
                    onClick={() => {
                      setConfirming(true);
                      setMenuOpen(false);
                    }}
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {missing ? null : (
        <div className="min-[1128px]:flex min-[1128px]:items-start">
          <div
            className={`min-w-0 px-6 pb-24 pt-4 min-[1128px]:w-[60%] min-[1128px]:px-12 ${showMap ? "max-[1127px]:hidden" : ""} ${mapExpanded ? "min-[1128px]:hidden" : ""}`}
          >
            {cards.isLoading ? (
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="aspect-[20/19] rounded-2xl" />
                ))}
              </div>
            ) : cards.error instanceof ApiError ? (
              <p className="py-16 text-body text-rausch">{cards.error.detail}</p>
            ) : items.length === 0 ? (
              <div className="py-16">
                <h2 className="t-subheading">Nothing saved yet</h2>
                <p className="mt-2 max-w-md text-body text-muted">Tap the heart on a stay to add it to this wishlist.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2">
                {items.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    href={`/listings/${listing.id}`}
                    active={hoveredId === listing.id || selectedId === listing.id}
                    onHover={setHoveredId}
                    onNeedAuth={() => setAuthOpen(true)}
                    variant="row"
                  />
                ))}
              </div>
            )}
          </div>
          {items.length > 0 ? (
            <div
              className={`${mobileMap ? "fixed inset-0 z-40 bg-white p-3" : "hidden"} min-[1128px]:block min-[1128px]:w-[40%] min-[1128px]:bg-transparent min-[1128px]:p-0 ${
                mapExpanded ? "min-[1128px]:w-full" : ""
              } ${mobileMap ? "min-[1128px]:static" : ""}`}
            >
              <div
                className={`h-[calc(100vh-24px)] min-[1128px]:sticky min-[1128px]:top-[88px] min-[1128px]:h-[calc(100vh-112px)] min-[1128px]:pr-6 ${mapExpanded ? "min-[1128px]:px-6" : ""}`}
              >
                {mountMap ? (
                  <ListingsMap
                    key={mobileMap ? "wishlist-map-mobile" : "wishlist-map-desktop"}
                    listings={items}
                    filters={{}}
                    boundsKey={items.map((item) => item.id).join(",")}
                    hoveredId={hoveredId}
                    selectedId={selectedId}
                    expanded={mapExpanded || mobileMap}
                    onHover={setHoveredId}
                    onSelect={setSelectedId}
                    onExpand={() => {
                      if (window.matchMedia("(max-width: 1127px)").matches) setMobileMap(false);
                      else setMapExpanded((open) => !open);
                    }}
                    onNeedAuth={() => setAuthOpen(true)}
                  />
                ) : (
                  <div className="search-map h-full w-full rounded-2xl bg-[#ebebeb]" />
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {items.length > 0 ? (
        <button
          type="button"
          onClick={() => setMobileMap((open) => !open)}
          className="fixed bottom-8 left-1/2 z-[45] flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3.5 t-button text-white shadow-pill min-[1128px]:hidden"
        >
          <Map size={16} />
          {mobileMap ? "List" : "Map"}
        </button>
      ) : null}

      {renaming ? (
        <WishlistNameModal
          title="Rename wishlist"
          submitLabel="Save"
          initialName={name}
          pending={renamePending}
          error={renameError}
          onClose={() => {
            if (renamePending) return;
            setRenaming(false);
          }}
          onSubmit={(nextName) => void rename(nextName)}
        />
      ) : null}
      {confirming ? (
        <WishlistDialog
          title="Delete wishlist"
          onClose={() => {
            if (deletePending) return;
            setConfirming(false);
          }}
        >
          <div className="px-6 py-6">
            <p className="text-base text-ink">{name} and the homes saved to it will be removed.</p>
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-hairline px-6 py-4">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="t-link underline-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deletePending}
              onClick={() => void remove()}
              className="rounded-lg bg-ink px-6 py-3.5 t-button text-white disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        </WishlistDialog>
      ) : null}
      <SwitchUserModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
