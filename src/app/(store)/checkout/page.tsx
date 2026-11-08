import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CheckoutView } from "@/components/checkout/checkout-view";
import type { Address } from "@/lib/types";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const supabase = await createClient();

  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  return (
    <div className="container-page py-8 sm:py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-deep-rose">
        Almost there
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Checkout
      </h1>
      <p className="mt-2 max-w-xl text-sm text-ink">
        Confirm your delivery address and place your order. We&apos;ll call you
        to confirm the details.
      </p>

      <CheckoutView addresses={(addresses ?? []) as Address[]} />
    </div>
  );
}
