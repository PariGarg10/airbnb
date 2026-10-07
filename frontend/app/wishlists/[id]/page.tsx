import { notFound } from "next/navigation";
import { Suspense } from "react";
import { WishlistDetailView } from "@/components/wishlists/WishlistDetailView";

interface WishlistPageProps {
  params: { id: string };
}

export default function WishlistPage({ params }: WishlistPageProps) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) notFound();
  return (
    <Suspense fallback={<div className="px-6 py-16 text-body text-muted min-[1128px]:px-12">Loading wishlist</div>}>
      <WishlistDetailView wishlistId={id} />
    </Suspense>
  );
}
