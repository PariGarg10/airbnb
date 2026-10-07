"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { SwitchUserModal } from "@/components/auth/SwitchUserModal";
import { HostHeader } from "@/components/layout/HostHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/auth";

function SwitchCard() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="max-w-md rounded-2xl border border-hairline p-8 text-center">
        <h1 className="t-page-title">Switch to a host account</h1>
        <p className="mt-2 text-meta text-muted">{user ? `You're signed in as ${user.name}.` : "Choose a host to continue."}</p>
        <button type="button" className="mt-6 rounded-lg bg-ink px-5 py-3 t-button text-white" onClick={() => setOpen(true)}>
          Switch user
        </button>
      </div>
      <SwitchUserModal open={open} onClose={() => setOpen(false)} />
    </main>
  );
}

export function HostShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isHost, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="container-airbnb py-10">
        <Skeleton className="h-10 w-72" />
      </main>
    );
  }
  if (!isHost) return <SwitchCard />;
  if (pathname.startsWith("/host/listings/new")) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <HostHeader />
      <div className="flex-1">{children}</div>
    </div>
  );
}
