"use client";

import { useEffect, useState } from "react";

export function MapClientGate({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) {
    return <div className={className ?? "h-full w-full bg-[#ebebeb]"} aria-hidden />;
  }
  return <>{children}</>;
}
