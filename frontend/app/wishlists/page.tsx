import { Suspense } from "react";
import { WishlistsView } from "@/components/wishlists/WishlistsView";

export default function WishlistsPage() {
  return (
    <Suspense fallback={<div className="container-airbnb py-16 text-meta text-muted">Loading wishlists</div>}>
      <WishlistsView />
    </Suspense>
  );
}
