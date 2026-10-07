"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const OPTIONS = [
  {
    id: "aadhaar",
    title: "Confirm your Aadhaar details",
    body: "You'll confirm your legal information with DigiLocker",
    badge: "Recommended",
  },
  {
    id: "id",
    title: "Use your ID",
    body: "You'll use an official document like a PAN card, passport, or driver's license.",
  },
] as const;

export default function VerifyIdentityPage() {
  const router = useRouter();
  const [choice, setChoice] = useState<(typeof OPTIONS)[number]["id"] | null>(null);
  const [done, setDone] = useState(false);

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-16">
      <h1 className="t-wizard-title">How do you want to verify your identity?</h1>
      {done ? (
        <p className="mt-8 rounded-xl border border-hairline p-4 text-body">Identity verification is simulated in this demo.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setChoice(option.id)}
              className={`block w-full rounded-xl border p-4 text-left ${choice === option.id ? "border-2 border-ink" : "border-hairline"}`}
            >
              <p className="font-semibold">{option.title}</p>
              <p className="mt-1 text-meta text-muted">{option.body}</p>
              {"badge" in option ? <span className="mt-2 inline-flex rounded-md bg-soft px-2 py-0.5 text-label">{option.badge}</span> : null}
            </button>
          ))}
        </div>
      )}
      <p className="mt-4 text-label text-muted">
        Your information is handled according to our{" "}
        <Link href="/coming-soon" className="underline">
          Privacy Policy
        </Link>{" "}
        and isn&apos;t shared with hosts or guests. Learn more about{" "}
        <Link href="/coming-soon" className="underline">
          identity verification
        </Link>
        .
      </p>
      <div className="mt-8 flex items-center justify-between border-t border-hairline pt-4">
        <button type="button" className="t-link" onClick={() => router.push("/host")}>
          Finish Later
        </button>
        <button
          type="button"
          disabled={!choice || done}
          onClick={() => setDone(true)}
          className="rounded-lg bg-ink px-5 py-2.5 t-button text-white disabled:bg-soft disabled:text-faint"
        >
          Continue
        </button>
      </div>
    </main>
  );
}
