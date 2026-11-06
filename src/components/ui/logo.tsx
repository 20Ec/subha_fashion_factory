import Link from "next/link";
import { cn } from "@/lib/utils";

export function FlowerMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("h-6 w-6", className)}
      aria-hidden="true"
    >
      <g transform="translate(24 23)">
        <g fill="currentColor" opacity="0.85">
          <ellipse cx="0" cy="-10" rx="5" ry="8" />
          <ellipse cx="0" cy="10" rx="5" ry="8" />
          <ellipse cx="-10" cy="0" rx="8" ry="5" />
          <ellipse cx="10" cy="0" rx="8" ry="5" />
          <ellipse cx="-7" cy="-7" rx="5" ry="7.5" transform="rotate(-45)" />
          <ellipse cx="7" cy="7" rx="5" ry="7.5" transform="rotate(-45)" />
          <ellipse cx="7" cy="-7" rx="5" ry="7.5" transform="rotate(45)" />
          <ellipse cx="-7" cy="7" rx="5" ry="7.5" transform="rotate(45)" />
        </g>
        <circle r="4.5" className="text-blue" fill="currentColor" />
      </g>
    </svg>
  );
}

export function Logo({
  light = false,
  compact = false,
  className,
}: {
  light?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="Subha Fashion Factory home"
    >
      <span
        className={cn(
          "grid h-11 w-11 place-items-center rounded-2xl transition group-hover:scale-105",
          light ? "bg-white/10 text-pink" : "bg-pink-soft text-pink"
        )}
      >
        <FlowerMark className="h-6 w-6" />
      </span>
      <span className="leading-none">
        <span
          className={cn(
            "block text-[1.35rem] font-semibold tracking-tight",
            light ? "text-white" : "text-navy"
          )}
        >
          Subha
        </span>
        {!compact && (
          <span
            className={cn(
              "mt-1 block text-[0.58rem] font-medium uppercase tracking-[0.28em]",
              light ? "text-white/60" : "text-navy/50"
            )}
          >
            Fashion Factory
          </span>
        )}
      </span>
    </Link>
  );
}
