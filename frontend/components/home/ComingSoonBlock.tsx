import { Skeleton } from "@/components/ui/Skeleton";

export function ComingSoonBlock({ title, icon }: { title: string; icon?: string }) {
  return (
    <main className="container-airbnb py-16">
      {icon ? <img src={icon} alt="" className="mx-auto mb-6 h-24 w-24 object-contain" /> : null}
      <h1 className="t-page-title text-center">{title}</h1>
      <div className="mx-auto mt-10 flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="w-[200px] shrink-0">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <Skeleton className="mt-3 h-4 w-2/3" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </div>
        ))}
      </div>
      <div className="mx-auto mt-8 flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="w-[200px] shrink-0">
            <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
            <Skeleton className="mt-3 h-4 w-1/2" />
          </div>
        ))}
      </div>
    </main>
  );
}
