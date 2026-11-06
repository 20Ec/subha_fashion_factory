"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Phone, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { PRICING_TYPES } from "@/lib/config";
import { cn, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";
import type { PricingType, ProductOption } from "@/lib/types";

export function ProductPurchase({
  productId,
  productName,
  productSlug,
  image,
  options,
}: {
  productId: string;
  productName: string;
  productSlug: string;
  image: string | null;
  options: ProductOption[];
}) {
  const router = useRouter();
  const { addLine } = useCart();

  const groups = useMemo(() => {
    const map: Record<string, ProductOption[]> = {};
    for (const type of PRICING_TYPES) {
      const list = options.filter(
        (option) => option.pricing_type === type.value
      );
      if (list.length > 0) map[type.value] = list;
    }
    return map;
  }, [options]);

  const types = Object.keys(groups) as PricingType[];
  const [activeType, setActiveType] = useState<PricingType>(types[0] ?? "size");
  const [selectedId, setSelectedId] = useState<string | null>(
    groups[types[0]]?.[0]?.id ?? null
  );
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!groups[activeType]?.length) {
      const nextType = (Object.keys(groups)[0] as PricingType) ?? "size";
      setActiveType(nextType);
      setSelectedId(groups[nextType]?.[0]?.id ?? null);
    }
  }, [activeType, groups]);

  const activeOptions = groups[activeType] ?? [];
  const selected =
    options.find((option) => option.id === selectedId) ?? activeOptions[0];

  async function add(goToCart: boolean) {
    if (!selected) {
      toast.error("Please choose an option first");
      return;
    }

    setPending(true);
    const result = await addLine(
      {
        optionId: selected.id,
        productId,
        name: productName,
        slug: productSlug,
        image,
        pricingType: selected.pricing_type,
        label: selected.label,
        price: Number(selected.price),
      },
      quantity
    );
    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Added to your cart");
    if (goToCart) router.push("/cart");
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        <p className="text-3xl font-semibold tracking-tight text-navy">
          {selected ? formatINR(selected.price) : "Price on request"}
        </p>
        {selected && (
          <p className="pb-1 text-xs text-navy/45">
            for {selected.label} · {selected.pricing_type}
          </p>
        )}
      </div>

      {types.length > 0 && (
        <div className="mt-7">
          {types.length > 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {types.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setActiveType(type);
                    setSelectedId(groups[type]?.[0]?.id ?? null);
                  }}
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-medium capitalize transition",
                    activeType === type
                      ? "border-navy bg-navy text-white"
                      : "border-navy/10 bg-white text-navy/60 hover:border-navy/30"
                  )}
                >
                  By {type}
                </button>
              ))}
            </div>
          )}

          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy/40">
            Choose {activeType}
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {activeOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedId(option.id)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left transition",
                  selectedId === option.id
                    ? "border-blue bg-blue/5 ring-1 ring-blue"
                    : "border-navy/10 bg-white hover:border-navy/25"
                )}
              >
                <span className="block text-xs font-medium text-navy">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-[11px] text-navy/45">
                  {formatINR(option.price)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-4">
        <div className="flex items-center rounded-full border border-navy/10 bg-white">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className="grid h-10 w-10 place-items-center rounded-full text-navy/60 transition hover:bg-blush disabled:opacity-40"
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-8 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(99, value + 1))}
            className="grid h-10 w-10 place-items-center rounded-full text-navy/60 transition hover:bg-blush disabled:opacity-40"
            disabled={quantity >= 99}
            aria-label="Increase quantity"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-xs text-navy/40">Maximum 99 per item</p>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        <Button
          size="lg"
          loading={pending}
          onClick={() => add(false)}
          className="w-full"
        >
          <ShoppingBag className="h-4 w-4" />
          Add to cart
        </Button>
        <Button
          size="lg"
          variant="outline"
          disabled={pending}
          onClick={() => add(true)}
          className="w-full"
        >
          Buy now
        </Button>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-blush p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-blue">
          <Phone className="h-4 w-4" />
        </span>
        <p className="text-xs leading-relaxed text-navy/55">
          Our team will call you after you order to confirm the details and
          final pricing before your flowers are made.
        </p>
      </div>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-navy/5 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] text-navy/45">
              {selected?.label ?? "Choose an option"}
            </p>
            <p className="text-base font-semibold">
              {selected ? formatINR(selected.price) : "—"}
            </p>
          </div>
          <Button
            loading={pending}
            onClick={() => add(false)}
            className="shrink-0"
          >
            <ShoppingBag className="h-4 w-4" />
            Add to cart
          </Button>
        </div>
      </div>
    </div>
  );
}
