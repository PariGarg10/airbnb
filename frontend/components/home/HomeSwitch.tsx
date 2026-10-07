"use client";

import { useSearchParams } from "next/navigation";
import { ExplorePage } from "@/components/home/ExplorePage";
import { HomePage } from "@/components/home/HomePage";

export function HomeSwitch() {
  const view = useSearchParams().get("view");
  if (view === "homes") return <ExplorePage />;
  return <HomePage />;
}
