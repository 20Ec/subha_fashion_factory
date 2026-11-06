import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Info } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import { RETURN_WINDOW_DAYS } from "@/lib/config";
import {
  canRequestCancellation,
  isWithinReturnWindow,
} from "@/lib/orders";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FlowerMark } from "@/components/ui/logo";
import { RequestForm } from "@/components/orders/request-form";
import type { Order, OrderRequest, RequestType } from "@/lib/types";

export const metadata: Metadata = { title: "Request an action" };

export default async function OrderRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = await params;
  const { type: rawType } = await searchParams;
  const type: RequestType =
    rawType === "cancel" ? "cancel" : rawType === "replace" ? "replace" : "return";

  const user = await requireUser(`/orders/${id}`);
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*), order_requests(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) notFound();

  const order = data as unknown as Order;
  const items = [...(order.order_items ?? [])].sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  const requests = (order.order_requests ?? []) as OrderRequest[];

  const canReturn = isWithinReturnWindow(order);
  const canCancel = canRequestCancellation(order);

  const existingReturnReplace = requests.find(
    (request) =>
      ["return", "replace"].includes(request.type) &&
      ["pending", "approved", "completed"].includes(request.status)
  );
  const pendingSameType = requests.some(
    (request) => request.type === type && request.status === "pending"
  );

  const allowed =
    type === "cancel"
      ? canCancel
      : canReturn && !existingReturnReplace;

  const title =
    type === "cancel"
      ? "Request cancellation"
      : type === "return"
        ? "Request a return"
        : "Request a replacement";

  return (
    <div className="container-page py-8 sm:py-12">
      <Link
        href={`/orders/${order.id}`}
        className="inline-flex items-center gap-1 text-xs font-medium text-navy/45 transition hover:text-navy"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to order
      </Link>

      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pink">
          Order {order.order_number}
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
      </div>

      {type !== "cancel" && existingReturnReplace ? (
        <EmptyState
          className="mt-6"
          title={
            existingReturnReplace.status === "completed"
              ? "This order already has a completed request"
              : "You already have an open request for this order"
          }
          description={`Return and replacement are limited to one request per order. Your ${existingReturnReplace.type} request is ${existingReturnReplace.status}.`}
        >
          <Link
            href={`/orders/${order.id}`}
            className={buttonClass({ variant: "outline", size: "sm" })}
          >
            View order
          </Link>
        </EmptyState>
      ) : !allowed ? (
        <EmptyState
          className="mt-6"
          title={
            type === "cancel"
              ? "Cancellation isn't available for this order"
              : "Return or replacement isn't available yet"
          }
          description={
            type === "cancel"
              ? order.status === "pending"
                ? "This order is still pending, so you can cancel it directly from the order page."
                : order.status === "cancelled"
                  ? "This order has already been cancelled."
                  : "Cancellation can be requested after the order is confirmed and before it is delivered."
              : order.status === "cancelled"
                ? "This order was cancelled, so it is no longer eligible for return or replacement."
                : order.status === "delivered"
                  ? `The ${RETURN_WINDOW_DAYS}-day return and replacement window for this order has closed.`
                  : "Return and replacement requests can be made once your order has been delivered."
          }
        >
          <Link
            href={`/orders/${order.id}`}
            className={buttonClass({ variant: "outline", size: "sm" })}
          >
            Back to order
          </Link>
        </EmptyState>
      ) : pendingSameType ? (
        <EmptyState
          className="mt-6"
          title="You already have a pending request"
          description="Our team is reviewing it. You'll see the update on your order page."
        >
          <Link
            href={`/orders/${order.id}`}
            className={buttonClass({ variant: "outline", size: "sm" })}
          >
            View order
          </Link>
        </EmptyState>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px] lg:items-start">
          <section className="rounded-2xl border border-navy/5 bg-white p-5 shadow-card sm:p-6">
            {canReturn && (
              <div className="mb-5 flex gap-2 rounded-xl bg-blush p-1">
                <Link
                  href={`/orders/${order.id}/request?type=return`}
                  className={`flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium transition ${
                    type === "return"
                      ? "bg-white text-navy shadow-sm"
                      : "text-navy/45 hover:text-navy"
                  }`}
                >
                  Return
                </Link>
                <Link
                  href={`/orders/${order.id}/request?type=replace`}
                  className={`flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium transition ${
                    type === "replace"
                      ? "bg-white text-navy shadow-sm"
                      : "text-navy/45 hover:text-navy"
                  }`}
                >
                  Replacement
                </Link>
              </div>
            )}

            <RequestForm orderId={order.id} type={type} items={items} />

            <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-blush p-3.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue" />
              <p className="text-[11px] leading-relaxed text-navy/50">
                Our team will review your request and contact you on the phone
                number linked to this order. Approved returns and replacements
                are arranged personally.
              </p>
            </div>
          </section>

          <aside className="rounded-2xl border border-navy/5 bg-white p-5 shadow-card">
            <h2 className="text-base font-semibold">Order summary</h2>
            <div className="mt-3 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-blush">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.product_name}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="grid h-full place-items-center text-pink">
                        <FlowerMark className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {item.product_name}
                    </p>
                    <p className="truncate text-[10px] text-navy/45">
                      {item.option_label} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-xs font-medium">
                    {formatINR(item.line_total)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-navy/5 pt-3">
              <span className="text-sm font-medium">Total</span>
              <span className="text-base font-semibold">
                {formatINR(order.confirmed_total ?? order.total)}
              </span>
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-navy/40">
              Return and replacement eligibility applies for {RETURN_WINDOW_DAYS}{" "}
              days after delivery.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
