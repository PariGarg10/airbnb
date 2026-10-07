import { notFound } from "next/navigation";
import { CancelReservationFlow } from "@/components/cancel/CancelReservationFlow";

interface CancelPageProps {
  params: { id: string };
}

export default function CancelTripPage({ params }: CancelPageProps) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) notFound();
  return <CancelReservationFlow bookingId={id} />;
}
