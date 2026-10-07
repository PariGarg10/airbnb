"use client";

import { MessageSquare, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/auth";
import { APP_NAME } from "@/lib/brand";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [view, setView] = useState<"about" | "connections">("about");

  if (isLoading || !user) {
    return (
      <main className="container-airbnb py-10">
        <Skeleton className="h-10 w-40" />
      </main>
    );
  }

  return (
    <main className="container-airbnb grid gap-10 py-10 md:grid-cols-[240px_minmax(0,1fr)]">
      <aside>
        <h1 className="t-page-title">Profile</h1>
        <nav className="mt-6 space-y-1">
          <button
            type="button"
            onClick={() => setView("about")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-body ${view === "about" ? "bg-soft font-semibold" : ""}`}
          >
            About me
          </button>
          <button
            type="button"
            onClick={() => setView("connections")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-body ${view === "connections" ? "bg-soft font-semibold" : ""}`}
          >
            <Users size={16} />
            Connections
          </button>
        </nav>
      </aside>
      {view === "about" ? (
        <section>
          <div className="flex items-center gap-3">
            <h2 className="t-subheading">About me</h2>
            <button type="button" onClick={() => toast("Coming soon")} className="rounded-lg border border-hairline px-3 py-1 text-body">
              Edit
            </button>
          </div>
          <div className="mt-6 flex flex-col items-start gap-6 rounded-2xl border border-hairline p-6 md:flex-row md:items-center">
            {user.avatar_url ? (
              <Avatar name={user.name} src={user.avatar_url} size={96} />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-peach text-3xl font-semibold text-peach-ink">
                {user.name.trim().charAt(0).toUpperCase() || "?"}
              </span>
            )}
            <div>
              <p className="t-host-name">{user.name}</p>
              <p className="text-meta text-muted">{user.is_host ? "Host" : "Guest"}</p>
            </div>
            <div className="md:ml-auto md:max-w-xs">
              <p className="font-semibold">Complete your profile</p>
              <p className="mt-1 text-meta text-muted">{`Your ${APP_NAME} profile is an important part of every reservation. Create yours to help other hosts and guests get to know you.`}</p>
              <button type="button" onClick={() => toast("Coming soon")} className="mt-3 rounded-lg search-fill px-4 py-2 t-button text-white">
                Get started
              </button>
            </div>
          </div>
          <button type="button" onClick={() => toast("Coming soon")} className="mt-8 flex items-center gap-3 text-body font-semibold">
            <MessageSquare size={16} />
            Show reviews I&apos;ve written
          </button>
        </section>
      ) : (
        <section className="text-center">
          <h2 className="t-subheading">Connections</h2>
          <div className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-soft">
            <Users size={28} />
          </div>
          <p className="mx-auto mt-6 max-w-md text-meta text-muted">
            When you join an experience or invite someone on a trip, you&apos;ll find the profiles of other guests here.{" "}
            <Link href="/coming-soon" className="font-semibold text-ink underline">
              Learn more
            </Link>
          </p>
          <Link href="/" className="mt-6 inline-flex rounded-lg search-fill px-5 py-2.5 t-button text-white">
            Book a trip
          </Link>
        </section>
      )}
    </main>
  );
}
