"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/auth";
import { ApiError, usersApi } from "@/lib/api";
import type { User } from "@/types";

interface SwitchUserModalProps {
  open: boolean;
  onClose: () => void;
}

function roleLabel(account: User): "Guest" | "Host" | "Superhost" {
  if (account.is_superhost) return "Superhost";
  if (account.is_host) return "Host";
  return "Guest";
}

export function SwitchUserModal({ open, onClose }: SwitchUserModalProps) {
  const { user, switchUser } = useAuth();
  const queryClient = useQueryClient();
  const accounts = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.list,
    enabled: open,
  });

  const select = async (account: User) => {
    try {
      await switchUser(account.id);
      await queryClient.invalidateQueries();
      toast.success(`Logged in as ${account.name}`);
      onClose();
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "Could not switch user";
      toast.error(message);
    }
  };

  return (
    <Modal open={open} title="Switch user" onClose={onClose}>
      {accounts.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : null}
      {accounts.isError ? (
        <p className="text-meta text-muted">
          {accounts.error instanceof ApiError ? accounts.error.detail : "Could not load users"}
        </p>
      ) : null}
      {accounts.data && accounts.data.length === 0 ? <p className="text-meta text-muted">No users yet</p> : null}
      <ul className="flex flex-col">
        {accounts.data?.map((account) => {
          const role = roleLabel(account);
          const current = user?.id === account.id;
          return (
            <li key={account.id}>
              <button
                type="button"
                onClick={() => select(account)}
                className={`flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-soft ${current ? "bg-soft" : ""}`}
              >
                <Avatar name={account.name} src={account.avatar_url} size={40} />
                <span className="min-w-0 flex-1 truncate text-body font-medium text-ink">{account.name}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-label ${
                    role === "Guest" ? "border-hairline text-muted" : "border-ink text-ink"
                  }`}
                >
                  {role}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
