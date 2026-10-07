import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingView } from "@/components/listing/ListingView";
import { ApiError, listingsApi } from "@/lib/api";

interface ListingPageProps {
  params: { id: string };
}

export default async function ListingPage({ params }: ListingPageProps) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) notFound();

  let listing;
  try {
    listing = await listingsApi.get(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) listing = null;
    else throw error;
  }
  if (!listing) notFound();

  return (
    <Suspense fallback={null}>
      <ListingView initialListing={listing} />
    </Suspense>
  );
}
