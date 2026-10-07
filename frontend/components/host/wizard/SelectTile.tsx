import type { LucideIcon } from "lucide-react";

interface SelectTileProps {
  icon: LucideIcon;
  label: string;
  hint?: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
}

export function SelectTile({ icon: Icon, label, hint, selected, onClick, className = "" }: SelectTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-24 flex-col items-start justify-between rounded-xl border px-4 py-3 text-left text-body transition-colors min-[1128px]:min-h-[112px] min-[1128px]:rounded-2xl min-[1128px]:px-5 min-[1128px]:py-4 ${
        selected ? "border-2 border-[#222222] bg-[#F7F7F7]" : "border-hairline hover:border-[#222222]"
      } ${className}`}
    >
      <Icon size={26} strokeWidth={1.5} className="shrink-0" />
      <span className="mt-auto w-full">
        <span className="line-clamp-2 block leading-tight">{label}</span>
        {hint ? <span className="mt-1 block line-clamp-2 text-meta text-muted">{hint}</span> : null}
      </span>
    </button>
  );
}
