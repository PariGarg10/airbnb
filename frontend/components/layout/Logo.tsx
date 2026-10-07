import { APP_NAME } from "@/lib/brand";

export function Belo({ className = "h-8 w-8" }: { className?: string }) {
  return <img src="/icons/belo.png" alt="" className={`object-contain ${className}`} />;
}

export function Logo({ wordmark = true, wordmarkClassName }: { wordmark?: boolean; wordmarkClassName?: string }) {
  return (
    <span className="flex items-center gap-1 text-rausch">
      <Belo className="h-8 w-8" />
      {wordmark ? (
        <span className={wordmarkClassName ?? "t-wordmark hidden sm:inline"}>{APP_NAME.toLowerCase()}</span>
      ) : null}
    </span>
  );
}
