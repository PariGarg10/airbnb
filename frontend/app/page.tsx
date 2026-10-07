import { Suspense } from "react";
import { HomePage } from "@/components/home/HomePage";
import { Skeleton } from "@/components/ui/Skeleton";

function HomeFallback() {
  return (
    <div className="container-airbnb space-y-8 py-5">
      <Skeleton className="h-7 w-56" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="aspect-square w-[clamp(92px,11vw,124px)] shrink-0 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomePage />
    </Suspense>
  );
}
