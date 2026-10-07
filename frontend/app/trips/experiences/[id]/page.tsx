import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExperienceTripView } from "@/components/experience/ExperienceTripView";

interface ExperienceTripPageProps {
  params: { id: string };
}

export default function ExperienceTripPage({ params }: ExperienceTripPageProps) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) notFound();

  return (
    <Suspense fallback={null}>
      <ExperienceTripView bookingId={id} />
    </Suspense>
  );
}
