import type { LucideIcon } from "lucide-react";

interface SelectCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  selected: boolean;
  onClick: () => void;
}

export function SelectCard({ title, description, icon: Icon, selected, onClick }: SelectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-4 rounded-xl border px-6 py-5 text-left transition-colors min-[1128px]:rounded-2xl min-[1128px]:py-6 ${
        selected ? "border-2 border-[#222222] bg-[#F7F7F7]" : "border-hairline hover:border-[#222222]"
      }`}
    >
      <span>
        <span className="block text-lg font-semibold text-ink">{title}</span>
        <span className="mt-1 block text-meta text-muted">{description}</span>
      </span>
      <Icon size={32} strokeWidth={1.25} className="shrink-0" />
    </button>
  );
}
