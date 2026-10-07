import { amenityIcon } from "@/lib/amenityIcons";

export function ListingAmenityRow({
  name,
  icon,
  unavailable,
  note,
}: {
  name: string;
  icon: string;
  unavailable?: boolean;
  note?: string;
}) {
  const Icon = amenityIcon(icon);
  return (
    <div className={`flex gap-4 border-b border-divider py-5 ${unavailable ? "text-muted" : "text-ink"}`}>
      <div className={`relative shrink-0 ${unavailable ? "opacity-45" : ""}`}>
        <Icon size={24} strokeWidth={1.5} aria-hidden />
        {unavailable ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
            <span className="block h-px w-7 rotate-45 bg-muted" />
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-base leading-5 ${unavailable ? "line-through decoration-1" : "font-normal"}`}>{name}</p>
        {note ? <p className={`mt-1 text-sm leading-[18px] text-muted ${unavailable ? "line-through decoration-1" : ""}`}>{note}</p> : null}
      </div>
    </div>
  );
}
