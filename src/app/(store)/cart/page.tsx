import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-deep-rose">
        Your selection
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Shopping cart
      </h1>
      <CartView />
    </div>
  );
}
