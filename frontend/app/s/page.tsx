import { Suspense } from "react";
import { ResultsLoadingSkeleton, SearchResults } from "@/components/search/SearchResults";

export default function SearchPage() {
  return (
    <Suspense fallback={<ResultsLoadingSkeleton />}>
      <SearchResults />
    </Suspense>
  );
}
