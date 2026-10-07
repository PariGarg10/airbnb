import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckoutView } from "@/components/booking/CheckoutView";
import { CheckoutDesktop } from "@/components/checkout/CheckoutDesktop";

interface BookPageProps {
  params: { listingId: string };
}

export default function BookPage({ params }: BookPageProps) {
  const id = Number(params.listingId);
  if (!Number.isInteger(id) || id < 1) notFound();

  return (
    <Suspense fallback={<div className="container-airbnb py-16 text-meta text-muted">Loading checkout</div>}>
      <div className="hidden min-[1128px]:block">
        <CheckoutDesktop listingId={id} />
      </div>
      <div className="min-[1128px]:hidden">
        <CheckoutView listingId={id} />
      </div>
    </Suspense>
  );
}
