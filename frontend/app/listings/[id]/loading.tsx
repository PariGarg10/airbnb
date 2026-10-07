import { Skeleton } from "@/components/ui/Skeleton";

export default function ListingLoading() {
  return (
    <div className="container-airbnb py-6">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="mt-4 h-[420px] w-full rounded-2xl" />
      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_380px]">
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="hidden h-80 w-full rounded-3xl lg:block" />
      </div>
    </div>
  );
}
