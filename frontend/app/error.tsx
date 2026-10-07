"use client";

import { Button } from "@/components/ui/Button";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container-airbnb flex flex-col items-start gap-4 py-24">
      <h1 className="t-page-title">Something went wrong</h1>
      <p className="max-w-md text-meta text-muted">{error.message || "Please try that again."}</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
