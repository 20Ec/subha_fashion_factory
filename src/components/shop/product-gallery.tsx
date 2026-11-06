"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { FlowerMark } from "@/components/ui/logo";

export function ProductGallery({
  images,
  name,
}: {
  images: { id: string; image_url: string }[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.75rem] border border-navy/5 bg-gradient-to-br from-pink-soft to-blush">
        {current ? (
          <Image
            src={current.image_url}
            alt={name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-pink">
            <FlowerMark className="h-16 w-16" />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="hide-scrollbar mt-3 flex gap-2.5 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-24 sm:w-20",
                index === active
                  ? "border-blue"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={image.image_url}
                alt={`${name} view ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
