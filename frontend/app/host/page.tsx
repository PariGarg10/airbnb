import { Suspense } from "react";
import { TodayPage } from "@/components/host/TodayPage";
import { Skeleton } from "@/components/ui/Skeleton";

export default function HostPage() {
  return (
    <Suspense
      fallback={
        <main className="container-airbnb py-10">
          <Skeleton className="h-10 w-72" />
        </main>
      }
    >
      <TodayPage />
    </Suspense>
  );
}
