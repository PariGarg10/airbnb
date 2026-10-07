"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addHours, differenceInHours, parseISO } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError, hostApi } from "@/lib/api";
import { formatDateRange, formatGuests } from "@/lib/format";
import type { HostBooking } from "@/types";

function expiresLabel(createdAt: string, status: string): string | null {
  if (status === "expired") return "Expired";
  if (status !== "pending") return null;
  const expires = addHours(parseISO(createdAt), 24);
  const hours = Math.max(0, differenceInHours(expires, new Date()));
  if (hours === 0) return "Expires soon";
  return hours === 1 ? "Expires in 1h" : `Expires in ${hours}h`;
}

export function HostPendingRequests() {
  const queryClient = useQueryClient();
  const pendingQuery = useQuery({ queryKey: ["host-bookings", "pending"], queryFn: () => hostApi.bookings("pending") });
  const cancelledQuery = useQuery({
    queryKey: ["host-bookings", "cancelled"],
    queryFn: () => hostApi.bookings("cancelled"),
  });
  const [confirm, setConfirm] = useState<{ booking: HostBooking; action: "accept" | "decline" } | null>(null);

  const expired = (cancelledQuery.data ?? []).filter((b) => b.status === "expired");
  const rows = [...(pendingQuery.data ?? []), ...expired];

  const mutate = useMutation({
    mutationFn: async () => {
      if (!confirm) throw new Error("missing");
      if (confirm.action === "accept") return hostApi.acceptBooking(confirm.booking.id);
      return hostApi.declineBooking(confirm.booking.id);
    },
    onSuccess: async () => {
      toast.success(confirm?.action === "accept" ? "Request accepted" : "Request declined");
      setConfirm(null);
      await queryClient.invalidateQueries({ queryKey: ["host-bookings"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.detail : "Something went wrong");
    },
  });

  if (rows.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="text-section font-semibold text-ink">Pending requests</h2>
      <div className="mt-4 space-y-3">
        {rows.map((booking) => {
          const expiredRow = booking.status === "expired";
          const expiry = booking.created_at ? expiresLabel(booking.created_at, booking.status) : null;
          return (
            <article key={booking.id} className="rounded-xl border border-hairline p-4">
              <div className="flex gap-4">
                <Avatar name={booking.guest.name} src={booking.guest.avatar_url} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{booking.guest.name}</p>
                    {expiry ? (
                      <span className={`text-label ${expiredRow ? "text-muted" : "text-rausch"}`}>{expiry}</span>
                    ) : null}
                  </div>
                  <p className="truncate text-meta text-muted">{booking.listing.title}</p>
                  <p className="mt-1 text-body text-ink">
                    {formatDateRange(booking.check_in, booking.check_out)} · {formatGuests(booking.guests)}
                  </p>
                  {booking.message_to_host ? (
                    <p className="mt-2 line-clamp-2 text-meta text-muted">&ldquo;{booking.message_to_host}&rdquo;</p>
                  ) : null}
                </div>
              </div>
              {!expiredRow ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setConfirm({ booking, action: "decline" })}>
                    Decline
                  </Button>
                  <Button className="flex-1 bg-ink text-white sm:flex-none" onClick={() => setConfirm({ booking, action: "accept" })}>
                    Accept
                  </Button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <Modal
        open={confirm != null}
        title={confirm?.action === "accept" ? "Accept request?" : "Decline request?"}
        onClose={() => setConfirm(null)}
      >
        <p className="text-body text-muted">
          {confirm?.action === "accept"
            ? "The guest will be notified and the dates will be confirmed."
            : "The guest will receive a full refund."}
        </p>
        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setConfirm(null)}>
            Cancel
          </Button>
          <Button className="flex-1 bg-ink text-white" disabled={mutate.isPending} onClick={() => mutate.mutate()}>
            {confirm?.action === "accept" ? "Accept" : "Decline"}
          </Button>
        </div>
      </Modal>
    </section>
  );
}
