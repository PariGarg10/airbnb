"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { ApiError, hostApi } from "@/lib/api";
import { formatInr, formatRating } from "@/lib/format";
import type { HostListing } from "@/types";

function Cover({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return <div className="h-14 w-14 rounded-lg bg-soft" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="h-14 w-14 rounded-lg object-cover" />
  );
}

function ListingMenu({
  listing,
  onDelete,
}: {
  listing: HostListing;
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const status = useMutation({
    mutationFn: () => hostApi.setStatus(listing.id, { is_active: !listing.is_active }),
    onSuccess: () => {
      toast.success(listing.is_active ? "Listing deactivated" : "Listing activated");
      queryClient.invalidateQueries({ queryKey: ["host-listings"] });
      queryClient.invalidateQueries({ queryKey: ["host-stats"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      setOpen(false);
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.detail : "Could not update listing"),
  });

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Listing actions"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-soft"
      >
        <MoreHorizontal size={18} />
      </button>
      {open ? (
        <div className="dropdown-pop absolute right-0 z-20 w-44 overflow-hidden rounded-xl border border-hairline bg-white py-1 text-body shadow-popover" onClick={(event) => event.stopPropagation()}>
          <Link href={`/host/listings/${listing.id}/edit`} className="block px-3 py-2 hover:bg-soft">Edit</Link>
          <Link href={`/listings/${listing.id}`} className="block px-3 py-2 hover:bg-soft">View</Link>
          <button type="button" className="block w-full px-3 py-2 text-left hover:bg-soft" disabled={status.isPending} onClick={() => status.mutate()}>
            {listing.is_active ? "Deactivate" : "Activate"}
          </button>
          <button type="button" className="block w-full px-3 py-2 text-left hover:bg-soft" onClick={() => { setOpen(false); onDelete(); }}>
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function HostListingsPanel({ filter = "" }: { filter?: string }) {
  const queryClient = useQueryClient();
  const listings = useQuery({ queryKey: ["host-listings"], queryFn: hostApi.listings });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const remove = useMutation({
    mutationFn: (id: number) => hostApi.deleteListing(id),
    onSuccess: (result) => {
      toast.success(result.deleted === "hard" ? "Listing deleted" : "Listing deactivated (it has bookings)");
      queryClient.invalidateQueries({ queryKey: ["host-listings"] });
      queryClient.invalidateQueries({ queryKey: ["host-stats"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      setDeleteId(null);
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.detail : "Could not delete listing"),
  });

  if (listings.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-20 rounded-xl" />)}
      </div>
    );
  }
  if (listings.isError) return <p className="text-body text-rausch">Could not load listings</p>;
  const query = filter.trim().toLowerCase();
  const rows = (listings.data ?? []).filter((listing) => {
    if (!query) return true;
    return listing.title.toLowerCase().includes(query) || listing.city.toLowerCase().includes(query);
  });

  if (!listings.data?.length) {
    return (
      <div className="rounded-xl border border-dashed border-hairline px-6 py-16 text-center">
        <p className="text-lg font-semibold">No listings yet</p>
        <p className="mt-2 text-meta text-muted">Create a listing to start welcoming guests.</p>
        <Link href="/host/listings/new" className="mt-6 inline-flex rounded-lg bg-ink px-5 py-3 t-button text-white">
          Create listing
        </Link>
      </div>
    );
  }

  if (!rows.length) {
    return <p className="py-16 text-center text-meta text-muted">No listings match your search</p>;
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-left text-body">
          <thead className="text-meta text-muted">
            <tr>
              <th className="pb-3 font-medium">Listing</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Price</th>
              <th className="pb-3 font-medium">Rating</th>
              <th className="pb-3 font-medium">Bookings</th>
              <th className="pb-3 font-medium">Upcoming</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((listing) => (
              <tr key={listing.id} className="border-t border-hairline">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <Cover src={listing.cover_image} alt="" />
                    <div>
                      <p className="font-semibold">{listing.title}</p>
                      <p className="text-meta text-muted">{listing.city}, {listing.country}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`rounded-full px-2 py-1 text-label font-semibold ${listing.is_active ? "bg-green-100 text-green-800" : "bg-soft text-muted"}`}>
                    {listing.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{formatInr(listing.price)} night</td>
                <td>{listing.avg_rating > 0 ? `★ ${formatRating(listing.avg_rating)}` : "New"}</td>
                <td>{listing.total_bookings}</td>
                <td>{listing.upcoming_bookings}</td>
                <td className="text-right"><ListingMenu listing={listing} onDelete={() => setDeleteId(listing.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {rows.map((listing) => (
          <article key={listing.id} className="rounded-xl border border-hairline p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <Cover src={listing.cover_image} alt="" />
                <div>
                  <p className="font-semibold">{listing.title}</p>
                  <p className="text-meta text-muted">{listing.city}, {listing.country}</p>
                  <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-label font-semibold ${listing.is_active ? "bg-green-100 text-green-800" : "bg-soft text-muted"}`}>
                    {listing.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <ListingMenu listing={listing} onDelete={() => setDeleteId(listing.id)} />
            </div>
            <p className="mt-3 text-body">
              {formatInr(listing.price)} night · {listing.avg_rating > 0 ? `★ ${formatRating(listing.avg_rating)}` : "New"} · {listing.total_bookings} bookings · {listing.upcoming_bookings} upcoming
            </p>
          </article>
        ))}
      </div>
      <Modal open={deleteId !== null} title="Delete listing" onClose={() => setDeleteId(null)}>
        <p className="text-meta text-muted">If this listing has bookings it will be deactivated instead of deleted, so guests keep their trip history.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="rounded-lg px-4 py-2 text-body font-semibold" onClick={() => setDeleteId(null)}>Cancel</button>
          <button
            type="button"
            disabled={remove.isPending || deleteId === null}
            className="rounded-lg bg-ink px-4 py-2 t-button text-white disabled:opacity-40"
            onClick={() => deleteId !== null && remove.mutate(deleteId)}
          >
            Delete
          </button>
        </div>
      </Modal>
    </>
  );
}
