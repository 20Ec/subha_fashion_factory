"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";
import { useCart } from "@/components/cart/cart-context";
import { Button, buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FlowerMark } from "@/components/ui/logo";

export function CartView() {
  const {
    lines,
    loading,
    subtotal,
    user,
    updateQuantity,
    removeLine,
    count,
  } = useCart();

  if (loading) {
    return (
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl border border-navy/5 bg-white"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl border border-navy/5 bg-white" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        className="mt-8"
        title="Your cart is empty"
        description="Add a few blooms to your cart and they'll be waiting here for you."
      >
        <Link href="/shop" className={buttonClass()}>
          Browse flowers
          <ArrowRight className="h-4 w-4" />
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="space-y-3">
        {lines.map((line) => (
          <div
            key={line.id}
            className="flex gap-3 rounded-2xl border border-navy/5 bg-white p-3 sm:gap-4 sm:p-4"
          >
            <Link
              href={`/product/${line.slug}`}
              className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-blush sm:h-28 sm:w-24"
            >
              {line.image ? (
                <Image
                  src={line.image}
                  alt={line.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <span className="grid h-full place-items-center text-pink">
                  <FlowerMark className="h-7 w-7" />
                </span>
              )}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/product/${line.slug}`}
                    className="line-clamp-2 text-sm font-medium text-navy hover:text-blue"
                  >
                    {line.name}
                  </Link>
                  <p className="mt-1 text-[11px] capitalize text-navy/45">
                    {line.pricingType}: {line.label}
                  </p>
                  <p className="mt-1 text-[11px] text-navy/40">
                    {formatINR(line.price)} each
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const result = await removeLine(line.id);
                    if (result.error) toast.error(result.error);
                    else toast.success("Item removed");
                  }}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-navy/35 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Remove ${line.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                <div className="flex items-center rounded-full border border-navy/10">
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await updateQuantity(
                        line.id,
                        Math.max(1, line.quantity - 1)
                      );
                      if (result.error) toast.error(result.error);
                    }}
                    disabled={line.quantity <= 1}
                    className="grid h-8 w-8 place-items-center rounded-full text-navy/60 transition hover:bg-blush disabled:opacity-30"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-7 text-center text-xs font-semibold">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await updateQuantity(
                        line.id,
                        Math.min(99, line.quantity + 1)
                      );
                      if (result.error) toast.error(result.error);
                    }}
                    disabled={line.quantity >= 99}
                    className="grid h-8 w-8 place-items-center rounded-full text-navy/60 transition hover:bg-blush disabled:opacity-30"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <p className="text-sm font-semibold">
                  {formatINR(line.price * line.quantity)}
                </p>
              </div>
            </div>
          </div>
        ))}

        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 px-1 text-sm font-medium text-blue hover:text-blue-dark"
        >
          Continue shopping
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <aside className="rounded-2xl border border-navy/5 bg-white p-5 shadow-card lg:sticky lg:top-28">
        <h2 className="text-base font-semibold">Order summary</h2>

        <div className="mt-4 space-y-2.5 border-b border-navy/5 pb-4 text-sm">
          <div className="flex items-center justify-between text-navy/55">
            <span>Items ({count})</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-navy/55">
            <span>Delivery</span>
            <span className="text-[11px] text-navy/40">Confirmed on call</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-medium">Total</span>
          <span className="text-xl font-semibold">{formatINR(subtotal)}</span>
        </div>

        <p className="mt-3 rounded-xl bg-blush p-3 text-[11px] leading-relaxed text-navy/50">
          Our team will call you after checkout to confirm your order and the
          final pricing, including delivery.
        </p>

        {user ? (
          <Link
            href="/checkout"
            className={buttonClass({ size: "lg", className: "mt-4 w-full" })}
          >
            Proceed to checkout
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href="/login?next=/checkout"
            className={buttonClass({ size: "lg", className: "mt-4 w-full" })}
          >
            Sign in to checkout
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}

        {!user && (
          <p className="mt-2 text-center text-[11px] text-navy/40">
            Your cart will be saved when you sign in.
          </p>
        )}

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-navy/35">
          <ShieldCheck className="h-3.5 w-3.5" />
          Secure account &amp; order history
        </div>
      </aside>
    </div>
  );
}
