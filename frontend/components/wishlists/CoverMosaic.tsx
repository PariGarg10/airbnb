import Image from "next/image";

export function CoverMosaic({ images }: { images: string[] }) {
  return (
    <div className="grid aspect-square grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-2xl bg-[#ebebeb]">
      {Array.from({ length: 4 }, (_, index) => {
        const url = images[index];
        if (!url) return <div key={`empty-${index}`} className="bg-[#ebebeb]" />;
        return (
          <div key={`${url}-${index}`} className="relative bg-[#ebebeb]">
            <Image src={url} alt="" fill className="object-cover" sizes="180px" />
          </div>
        );
      })}
    </div>
  );
}
