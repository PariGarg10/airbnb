import { Skeleton } from "@/components/ui/Skeleton";

export default function HomeLoading() {
  return (
    <div className="container-home space-y-6 pb-12 md:space-y-10 md:pt-[54px]">
      <section>
        <Skeleton className="h-7 w-56" />
        <div className="dest-row no-scrollbar mt-4 flex gap-3 overflow-hidden">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="aspect-square w-[clamp(92px,11vw,124px)] shrink-0 rounded-xl" />
          ))}
        </div>
      </section>
      <section>
        <Skeleton className="h-6 w-72" />
        <div className="home-row no-scrollbar mt-4">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="home-row-card">
              <Skeleton className="aspect-[20/19] w-full rounded-[var(--card-radius)]" />
              <Skeleton className="mt-1.5 h-[19px] w-3/4" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
