import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PRICING_TYPE_LABEL } from "@/lib/config";
import { formatINR } from "@/lib/utils";
import { FlowerMark } from "@/components/ui/logo";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const types = Array.from(
    new Set((product.options ?? []).map((option) => option.pricing_type))
  ).slice(0, 3);
  const image = product.cover_image ?? product.images?.[0]?.image_url ?? null;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-navy/5 bg-white shadow-[0_10px_30px_-24px_rgba(11,27,58,0.4)] transition duration-300 hover:-translate-y-1 hover:shadow-soft"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-pink-soft to-blush">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full place-items-center text-pink">
            <FlowerMark className="h-10 w-10" />
          </div>
        )}
        <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-navy opacity-0 shadow-sm transition duration-300 group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {product.category?.name && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-navy/40">
            {product.category.name}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-navy sm:text-[15px]">
          {product.name}
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-navy/40">
              From
            </p>
            <p className="text-sm font-semibold text-navy sm:text-base">
              {formatINR(product.min_price)}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {types.map((type) => (
              <span
                key={type}
                className="rounded-full bg-blush px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-navy/50"
              >
                {PRICING_TYPE_LABEL[type]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
