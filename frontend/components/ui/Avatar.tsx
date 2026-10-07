import Image from "next/image";
import { clsx } from "clsx";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
  initialClassName?: string;
}

export function Avatar({ name, src, size = 32, className, initialClassName }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className={clsx("inline-flex shrink-0 overflow-hidden rounded-full bg-peach text-peach-ink", className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt="" width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        <span className={clsx("t-avatar-initial flex h-full w-full items-center justify-center", initialClassName)}>{initial}</span>
      )}
    </span>
  );
}
