"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ApiError, bookingsApi } from "@/lib/api";

export function WithdrawRequestModal({
  open,
  onClose,
  bookingId,
}: {
  open: boolean;
  onClose: () => void;
  bookingId: number;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const withdraw = useMutation({
    mutationFn: () => bookingsApi.cancel(bookingId, "plans_changed"),
    onSuccess: async () => {
      toast.success("Request withdrawn");
      onClose();
      await queryClient.invalidateQueries({ queryKey: ["trips"] });
      router.push("/trips");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.detail : "Could not withdraw request");
    },
  });

  return (
    <Modal open={open} title="Withdraw request?" onClose={onClose}>
      <p className="text-body text-muted">You&apos;ll receive a full refund. This can&apos;t be undone.</p>
      <div className="mt-6 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Keep request
        </Button>
        <Button className="flex-1 bg-ink text-white" disabled={withdraw.isPending} onClick={() => withdraw.mutate()}>
          Withdraw
        </Button>
      </div>
    </Modal>
  );
}
