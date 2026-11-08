import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FlowerMark } from "@/components/ui/logo";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "My orders" };

export default async function OrdersPage() {
  const user = await requireUser("/orders");
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", user.id)
    .order("placed_at", { ascending: false });

  const orders = (data ?? []) as unknown as Order[];

  return (
    <div className="container-page py-8 sm:py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-deep-rose">
        From our studio to you
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        My orders
      </h1>
      <p className="mt-2 max-w-xl text-sm text-ink">
        Track every arrangement, revisit past orders and manage returns or
        replacements.
      </p>

      {orders.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="No orders yet"
          description="When you place your first order, it will appear here with its latest status."
        >
          <Link href="/shop" className={buttonClass()}>
            Start shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
        </EmptyState>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => {
            const items = [...(order.order_items ?? [])].sort((a, b) =>
              a.id.localeCompare(b.id)
            );
            const itemCount = items.reduce(
              (sum, item) => sum + item.quantity,
              0
            );

            return (
              <article
                key={order.id}
                className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <Package className="h-4 w-4 text-blue" />
                      {order.order_number}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink">
                      Placed on {formatDate(order.placed_at, true)}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="mt-4 flex gap-3 overflow-hidden">
                  <div className="flex shrink-0 gap-2">
                    {items.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="relative h-16 w-14 overflow-hidden rounded-lg bg-blush"
                      >
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.product_name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="grid h-full place-items-center text-deep-rose">
                            <FlowerMark className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div className="grid h-16 w-14 place-items-center rounded-lg bg-blush text-xs font-medium text-ink">
                        +{items.length - 3}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">
                      {items[0]?.product_name ?? "Order"}
                      {items.length > 1 ? ` + ${items.length - 1} more` : ""}
                    </p>
                    <p className="mt-1 text-[11px] text-ink">
                      {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
                      {formatINR(order.confirmed_total ?? order.total)}
                    </p>
                    <p className="mt-1 text-[11px] text-ink">
                      Payment:{" "}
                      <span className="capitalize">{order.payment_status}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end border-t border-line pt-3">
                  <Link
                    href={`/orders/${order.id}`}
                    className={buttonClass({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    View order
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
