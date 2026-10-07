export function LaurelLeft({ className }: { className?: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden className={className}>
      <path
        d="M20 6c-3 4-7 5-11 5 1.5 4 4 6.5 8 7.5-4 1.5-6.5 4-7.5 8 4 0 8-1.5 10.5-5 2.5 3.5 6.5 5 10.5 5-1.5-4-4-6.5-8-7.5 4-1.5 6.5-4 7.5-8-4 0-8 1.5-10.5 5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LaurelRight({ className }: { className?: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden className={`scale-x-[-1] ${className ?? ""}`}>
      <path
        d="M20 6c-3 4-7 5-11 5 1.5 4 4 6.5 8 7.5-4 1.5-6.5 4-7.5 8 4 0 8-1.5 10.5-5 2.5 3.5 6.5 5 10.5 5-1.5-4-4-6.5-8-7.5 4-1.5 6.5-4 7.5-8-4 0-8 1.5-10.5 5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
