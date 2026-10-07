import { Minus, Plus } from "lucide-react";

interface CounterProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  decreaseLabel?: string;
  increaseLabel?: string;
  variant?: "ink" | "line" | "stepper";
}

export function Counter({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  decreaseLabel = "Decrease",
  increaseLabel = "Increase",
  variant = "ink",
}: CounterProps) {
  const places = step < 1 ? 1 : 0;
  const round = (next: number) => {
    const factor = 10 ** places;
    return Math.round(next * factor) / factor;
  };
  const atMin = value <= min + 1e-9;
  const atMax = max !== undefined && value >= max - step / 2;
  const buttonClass =
    variant === "stepper"
      ? "flex h-8 w-8 min-[1128px]:h-8 min-[1128px]:w-8 items-center justify-center rounded-full bg-quaternary text-ink transition-[background-color,color] duration-200 ease-standard hover:bg-divider disabled:cursor-not-allowed disabled:bg-quaternary disabled:text-disabled disabled:hover:bg-quaternary"
      : variant === "line"
        ? "flex h-8 w-8 items-center justify-center rounded-full border border-faint text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:border-divider disabled:text-divider disabled:hover:border-divider"
        : "flex h-8 w-8 items-center justify-center rounded-full border border-ink text-ink transition hover:bg-soft disabled:cursor-not-allowed disabled:border-hairline disabled:text-hairline disabled:hover:bg-transparent";

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label={decreaseLabel}
        disabled={atMin}
        onClick={() => onChange(round(value - step))}
        className={buttonClass}
      >
        <Minus size={14} />
      </button>
      <span className="min-w-4 text-center text-body text-ink">{value}</span>
      <button
        type="button"
        aria-label={increaseLabel}
        disabled={atMax}
        onClick={() => onChange(round(value + step))}
        className={buttonClass}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
