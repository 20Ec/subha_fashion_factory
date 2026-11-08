import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Shared floral artwork used across the storefront.
 *
 * Photo: "Pink and yellow flower vase" by NordWood Themes (Unsplash),
 * released under CC0 and sourced via Wikimedia Commons.
 */
const SRC = "/brand/hero-flowers.jpg";

type FloralPhotoProps = {
  className?: string;
  priority?: boolean;
  sizes?: string;
};

export function FloralPhoto({
  className,
  priority = false,
  sizes = "(max-width: 640px) 92vw, (max-width: 1024px) 50vw, 520px",
}: FloralPhotoProps) {
  return (
    <div
      className={cn(
        "relative aspect-[5/6] w-full overflow-hidden rounded-[2rem] border border-line bg-pink-soft sm:rounded-[2.5rem]",
        className
      )}
    >
      <Image
        src={SRC}
        alt="Pink and yellow flowers arranged in a vase"
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
      />
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/40" />
    </div>
  );
}
