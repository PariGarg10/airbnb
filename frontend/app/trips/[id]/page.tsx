import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TripExperience } from "@/components/trips/TripExperience";

interface TripPageProps {
  params: { id: string };
}

export default function TripPage({ params }: TripPageProps) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) notFound();
  return (
    <Suspense fallback={<div className="container-airbnb py-16 text-meta text-muted">Loading reservation</div>}>
      <TripExperience bookingId={id} />
    </Suspense>
  );
}
