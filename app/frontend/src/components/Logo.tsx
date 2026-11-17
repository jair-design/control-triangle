export function Logo({ className = 'size-9' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
    >
      <rect width="36" height="36" rx="9" className="fill-brand-500" />
      <path
        d="M10 18.5l5.5 5.5L26 12"
        className="stroke-ink-950"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
