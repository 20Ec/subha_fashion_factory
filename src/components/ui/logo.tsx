import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/brand/subha-fashion-factory-logo.png";
const LOGO_WIDTH = 672;
const LOGO_HEIGHT = 760;

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
        <circle r="4.5" className="text-highlight" fill="currentColor" />
      </g>
    </svg>
  );
}

/**
 * Brand logo.
 *
 * - Default (`compact` off): the official logo artwork. Used for the large
 *   placements in the header and footer, where the wordmark stays readable.
 * - `compact`: the original flower mark + "Subha" lockup, kept for small
 *   placements (admin mobile header) where the full logo would be illegible.
 */
export function Logo({
  light = false,
  compact = false,
  priority = false,
  className,
}: {
  light?: boolean;
  compact?: boolean;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="Subha Fashion Factory home"
    >
      {compact ? (
        <>
          <span
            className={cn(
              "grid h-11 w-11 place-items-center rounded-2xl transition group-hover:scale-105",
              light ? "bg-white/10 text-gold" : "bg-pink-soft text-deep-rose"
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
          </span>
        </>
      ) : (
        <span
          className={cn(
            "inline-flex overflow-hidden rounded-xl transition duration-300 group-hover:scale-[1.02]",
            light && "bg-white"
          )}
        >
          <Image
            src={LOGO_SRC}
            alt="Subha Fashion Factory logo"
            width={LOGO_WIDTH}
            height={LOGO_HEIGHT}
            priority={priority}
            sizes="(max-width: 640px) 64px, 88px"
            className={cn(
              "w-auto object-contain",
              light ? "h-16 sm:h-20" : "h-12 sm:h-16"
            )}
          />
        </span>
      )}
    </Link>
  );
}
