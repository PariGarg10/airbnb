import { clsx } from "clsx";
import Image from "next/image";

interface ListingImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  sizes?: string;
}

export function ListingImage({ src, alt = "", className, sizes = "(min-width: 1128px) 40vw, 0px" }: ListingImageProps) {
  return (
    <div
      className={clsx(
        "relative aspect-[4/3] overflow-hidden rounded-[var(--r-12)] bg-[var(--image-placeholder)]",
        className,
      )}
    >
      {src ? <Image src={src} alt={alt} fill className="object-cover" sizes={sizes} /> : null}
    </div>
  );
}
