"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SaveWishlistModal, WishlistNameModal } from "@/components/wishlists/WishlistDialog";
import { ApiError, wishlistApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  applyListingSaved,
  applyWishlistMembership,
  captureWishlistCaches,
  restoreWishlistCaches,
} from "@/lib/wishlistCache";
import type { WishlistSummary } from "@/types";

export interface SaveTarget {
  id: number;
  is_wishlisted: boolean;
  image?: string | null;
}

interface WishlistContextValue {
  onHeart: (listing: SaveTarget) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

function removedLabel(names: string[]): string {
  if (names.length === 0) return "wishlists";
  return names.join(", ");
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const lists = useQuery({
    queryKey: ["wishlists", user?.id],
    queryFn: wishlistApi.list,
    enabled: Boolean(user),
  });
  const [mode, setMode] = useState<null | "save" | "create">(null);
  const [target, setTarget] = useState<SaveTarget | null>(null);
  const [returnToSave, setReturnToSave] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    if (!user) setMode(null);
  }, [user]);

  const refresh = useCallback(
    (listingId: number) => {
      void queryClient.invalidateQueries({ queryKey: ["wishlists"] });
      void queryClient.invalidateQueries({ queryKey: ["wishlist-items"] });
      void queryClient.invalidateQueries({ queryKey: ["listing", listingId] });
    },
    [queryClient],
  );

  const showSaved = useCallback((listing: SaveTarget, name: string) => {
    toast.success(
      <span className="t-toast">
        Saved to <span className="t-toast-strong">{name}</span>
      </span>,
      {
        icon: listing.image ? (
          <Image alt="" src={listing.image} width={48} height={48} className="toast-thumb" />
        ) : undefined,
        action: {
          label: "Change",
          onClick: () => {
            setTarget({ ...listing, is_wishlisted: true });
            setReturnToSave(false);
            setError(null);
            setMode("save");
          },
        },
      },
    );
  }, []);

  const loadLists = useCallback(async () => {
    if (!user) return [];
    const cached = queryClient.getQueryData<WishlistSummary[]>(["wishlists", user.id]);
    if (cached) return cached;
    return queryClient.fetchQuery({ queryKey: ["wishlists", user.id], queryFn: wishlistApi.list });
  }, [queryClient, user]);

  const removeFromAll = useCallback(
    async (listing: SaveTarget, current: WishlistSummary[]) => {
      if (!user || busy.current) return;
      busy.current = true;
      const names = current.filter((list) => list.listing_ids.includes(listing.id)).map((list) => list.name);
      const snapshots = captureWishlistCaches(queryClient);
      applyListingSaved(queryClient, listing.id, false);
      applyWishlistMembership(queryClient, user.id, listing.id, false);
      setPending(true);
      try {
        await Promise.all(current.map((list) => wishlistApi.removeItem(list.id, listing.id)));
        toast.success(`Removed from ${removedLabel(names)}`);
        refresh(listing.id);
      } catch (error) {
        restoreWishlistCaches(queryClient, snapshots);
        toast.error(error instanceof ApiError ? error.detail : "Could not update wishlist");
        refresh(listing.id);
      } finally {
        busy.current = false;
        setPending(false);
      }
    },
    [queryClient, refresh, user],
  );

  const onHeart = useCallback(
    (listing: SaveTarget) => {
      if (!user || busy.current) return;
      void (async () => {
        try {
          const current = await loadLists();
          if (listing.is_wishlisted) {
            await removeFromAll(listing, current);
            return;
          }
          setTarget(listing);
          setError(null);
          setReturnToSave(false);
          setMode(current.length === 0 ? "create" : "save");
        } catch (error) {
          toast.error(error instanceof ApiError ? error.detail : "Could not load wishlists");
        }
      })();
    },
    [loadLists, removeFromAll, user],
  );

  const close = useCallback(() => {
    if (pending) return;
    if (mode === "create" && returnToSave) {
      setMode("save");
      setError(null);
      return;
    }
    setMode(null);
    setError(null);
  }, [mode, pending, returnToSave]);

  const pick = useCallback(
    (wishlist: WishlistSummary) => {
      if (!user || !target || busy.current) return;
      busy.current = true;
      const snapshots = captureWishlistCaches(queryClient);
      applyListingSaved(queryClient, target.id, true);
      applyWishlistMembership(queryClient, user.id, target.id, true, wishlist.id);
      setPending(true);
      void (async () => {
        try {
          await wishlistApi.addItem(wishlist.id, target.id);
          setMode(null);
          showSaved(target, wishlist.name);
          refresh(target.id);
        } catch (error) {
          restoreWishlistCaches(queryClient, snapshots);
          toast.error(error instanceof ApiError ? error.detail : "Could not save this place");
        } finally {
          busy.current = false;
          setPending(false);
        }
      })();
    },
    [queryClient, refresh, showSaved, target, user],
  );

  const create = useCallback(
    (name: string) => {
      if (!user || !target || busy.current) return;
      busy.current = true;
      const snapshots = captureWishlistCaches(queryClient);
      applyListingSaved(queryClient, target.id, true);
      setPending(true);
      setError(null);
      void (async () => {
        try {
          const created = await wishlistApi.create({ name, listing_id: target.id });
          queryClient.setQueryData<WishlistSummary[]>(["wishlists", user.id], (current) => {
            const rest = (current ?? []).filter((list) => list.id !== created.id);
            return [created, ...rest];
          });
          setMode(null);
          setReturnToSave(false);
          showSaved(target, created.name);
          refresh(target.id);
        } catch (error) {
          restoreWishlistCaches(queryClient, snapshots);
          setError(error instanceof ApiError ? error.detail : "Could not create wishlist");
        } finally {
          busy.current = false;
          setPending(false);
        }
      })();
    },
    [queryClient, refresh, showSaved, target, user],
  );

  return (
    <WishlistContext.Provider value={{ onHeart }}>
      {children}
      {mode === "save" ? (
        <SaveWishlistModal
          wishlists={lists.data ?? []}
          pending={pending}
          onClose={close}
          onPick={pick}
          onCreate={() => {
            setReturnToSave(true);
            setError(null);
            setMode("create");
          }}
        />
      ) : null}
      {mode === "create" && target ? (
        <WishlistNameModal
          title="Create wishlist"
          submitLabel="Create"
          pending={pending}
          error={error}
          onClose={close}
          onSubmit={create}
        />
      ) : null}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
}
