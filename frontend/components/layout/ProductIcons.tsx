function Mark({ src, className = "h-8 w-8" }: { src: string; className?: string }) {
  return <img src={src} alt="" className={`object-contain ${className}`} />;
}

export function GlobeMark({ className }: { className?: string }) {
  return <Mark src="/icons/tab-all.png" className={className} />;
}

export function HouseMark({ className }: { className?: string }) {
  return <Mark src="/icons/tab-homes.png" className={className} />;
}

export function BalloonMark({ className }: { className?: string }) {
  return <Mark src="/icons/tab-experiences.png" className={className} />;
}

export function BellMark({ className }: { className?: string }) {
  return <Mark src="/icons/tab-services.png" className={className} />;
}

export function PillHouse({ className = "h-6 w-6" }: { className?: string }) {
  return <Mark src="/icons/pill-house.png" className={className} />;
}
