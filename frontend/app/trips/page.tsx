import { Suspense } from "react";
import { TripsView } from "@/components/trips/TripsView";

export default function TripsPage() {
  return (
    <Suspense fallback={<div className="container-airbnb py-16 text-meta text-muted">Loading trips</div>}>
      <TripsView />
    </Suspense>
  );
}
