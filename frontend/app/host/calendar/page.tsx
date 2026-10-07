import { Suspense } from "react";
import { HostCalendar } from "@/components/host/HostCalendar";
import { Skeleton } from "@/components/ui/Skeleton";

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <main className="container-airbnb py-10">
          <Skeleton className="h-10 w-48" />
        </main>
      }
    >
      <HostCalendar />
    </Suspense>
  );
}
