import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckoutView } from "@/components/booking/CheckoutView";

interface BookPageProps {
  params: { id: string };
}

export default function BookPage({ params }: BookPageProps) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) notFound();
  return (
    <Suspense fallback={<div className="container-airbnb py-16 text-meta text-muted">Loading checkout</div>}>
      <CheckoutView listingId={id} />
    </Suspense>
  );
}
