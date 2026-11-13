import { cn } from "@/lib/cn";

type Props = {
  fit?: string | null;
  className?: string;
  size?: "sm" | "md";
};

function MarsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="10" cy="14" r="5.25" stroke="currentColor" strokeWidth="2" />
      <path
        d="M14.5 9.5 20 4M15.5 4H20v4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VenusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="9" r="5.25" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 14.25V21M9.5 18H14.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UnisexIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="6.4" cy="13.1" r="2.7" stroke="currentColor" strokeWidth="1.65" />
      <path
        d="M8.4 11.1 10.55 8.95M9.05 8.95H10.55v1.5"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="17.2" cy="10.2" r="2.7" stroke="currentColor" strokeWidth="1.65" />
      <path
        d="M17.2 12.9V16.85M15.75 15.15h2.9"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GenderFitMark({ fit = "unisex", className, size = "sm" }: Props) {
  const normalized = String(fit || "unisex").toLowerCase();
  const icon = size === "sm" ? "size-3" : "size-3.5";
  const box = size === "sm" ? "size-5" : "size-6";
  const label =
    normalized === "men"
      ? "Men"
      : normalized === "women"
        ? "Women"
        : "Unisex";

  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--ink)]/15 bg-[var(--soft)] text-[var(--ink)]",
        box,
        className
      )}
    >
      {normalized === "men" ? (
        <MarsIcon className={icon} />
      ) : normalized === "women" ? (
        <VenusIcon className={icon} />
      ) : (
        <UnisexIcon className={icon} />
      )}
    </span>
  );
}
