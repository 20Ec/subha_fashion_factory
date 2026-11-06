import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  MapPin,
  Phone,
  RotateCcw,
  Truck,
  XCircle,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/utils";
import { RETURN_WINDOW_DAYS } from "@/lib/config";
import {
  canRequestCancellation,
  isWithinReturnWindow,
  orderAddressLines,
  returnWindowEnds,
} from "@/lib/orders";
import { REQUEST_TYPE_LABEL } from "@/lib/order-rules";
import { buttonClass } from "@/components/ui/button";
import { FlowerMark } from "@/components/ui/logo";
import { StatusBadge } from "@/components/ui/status-badge";
import { CancelOrderButton } from "@/components/orders/cancel-order-button";
import { OrderJourney } from "@/components/orders/order-journey";
import type { Order, OrderRequest } from "@/lib/types";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const { id } = await params;
  const { placed } = await searchParams;
  const user = await requireUser(`/orders/${id}`);
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*), order_status_history(*), order_requests(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) notFound();

  const order = data as unknown as Order;
  const items = [...(order.order_items ?? [])].sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  const requests = [...(order.order_requests ?? [])].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const address = orderAddressLines(order);

  const pendingCancel = requests.some(
    (request) => request.type === "cancel" && request.status === "pending"
  );
  const returnReplaceRequest = requests.find(
    (request) =>
      ["return", "replace"].includes(request.type) &&
      ["pending", "approved", "completed"].includes(request.status)
  );
  const pendingReturnReplace =
    returnReplaceRequest?.status === "pending" ||
    returnReplaceRequest?.status === "approved";
  const completedReturnReplace = returnReplaceRequest?.status === "completed";
  const withinReturnWindow = isWithinReturnWindow(order);
  const windowEnd = returnWindowEnds(order);

  return (
    <div className="container-page py-8 sm:py-12">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1 text-xs font-medium text-navy/45 transition hover:text-navy"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        All orders
      </Link>

      {placed === "1" && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Your order has been placed
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-emerald-700">
              Our team will call you on the number provided to confirm the
              details and final pricing. No online payment is needed right now.
            </p>
          </div>
        </div>
      )}

      {order.status === "cancelled" && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-800">This order was cancelled</p>
          <p className="mt-1 text-xs leading-relaxed text-rose-700">
            {order.cancellation_reason
              ? `Reason: ${order.cancellation_reason}`
              : "No further action will be taken on this order."}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-rose-700">
            {order.payment_status === "paid"
              ? "Your payment was marked as paid. Our team will process the refund; the order will show Refunded once it is complete."
              : order.payment_status === "refunded"
                ? "Your payment has been refunded."
                : "No payment was collected for this order."}
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pink">
            Order {order.order_number}
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">
            {items[0]?.product_name ?? "Your order"}
            {items.length > 1 ? ` + ${items.length - 1} more` : ""}
          </h1>
          <p className="mt-1 text-xs text-navy/45">
            Placed {formatDate(order.placed_at, true)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={order.status} />
          <StatusBadge
            status={order.payment_status}
            label={`Payment ${order.payment_status}`}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {order.status === "pending" && (
          <CancelOrderButton orderId={order.id} />
        )}

        {canRequestCancellation(order) &&
          (pendingCancel ? (
            <span className="inline-flex h-11 items-center gap-2 rounded-full bg-amber-50 px-4 text-xs font-medium text-amber-700">
              <XCircle className="h-4 w-4" />
              Cancellation request pending
            </span>
          ) : (
            <Link
              href={`/orders/${order.id}/request?type=cancel`}
              className={buttonClass({ variant: "outline" })}
            >
              <XCircle className="h-4 w-4" />
              Request cancellation
            </Link>
          ))}

        {withinReturnWindow &&
          (completedReturnReplace ? (
            <span className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-50 px-4 text-xs font-medium text-emerald-700">
              <RotateCcw className="h-4 w-4" />
              {returnReplaceRequest
                ? `${REQUEST_TYPE_LABEL[returnReplaceRequest.type]} completed`
                : "Return / replacement completed"}
            </span>
          ) : pendingReturnReplace ? (
            <span className="inline-flex h-11 items-center gap-2 rounded-full bg-amber-50 px-4 text-xs font-medium text-amber-700">
              <RotateCcw className="h-4 w-4" />
              {returnReplaceRequest
                ? `${REQUEST_TYPE_LABEL[returnReplaceRequest.type]} request ${returnReplaceRequest.status}`
                : "Return / replacement request pending"}
            </span>
          ) : (
            <Link
              href={`/orders/${order.id}/request?type=return`}
              className={buttonClass({ variant: "outline" })}
            >
              <RotateCcw className="h-4 w-4" />
              Return or replace
            </Link>
          ))}

        {order.status === "delivered" &&
          !withinReturnWindow &&
          !completedReturnReplace && (
            <span className="inline-flex h-11 items-center rounded-full bg-blush px-4 text-xs text-navy/45">
              Return window closed
            </span>
          )}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-5">
          <section className="rounded-2xl border border-navy/5 bg-white p-5 shadow-card">
            <h2 className="text-base font-semibold">Items</h2>
            <div className="mt-4 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-blush">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.product_name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="grid h-full place-items-center text-pink">
                        <FlowerMark className="h-5 w-5" />
                      </span>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {item.product_slug ? (
                          <Link
                            href={`/product/${item.product_slug}`}
                            className="line-clamp-2 text-sm font-medium hover:text-blue"
                          >
                            {item.product_name}
                          </Link>
                        ) : (
                          <p className="line-clamp-2 text-sm font-medium">
                            {item.product_name}
                          </p>
                        )}
                        <p className="mt-1 text-[11px] capitalize text-navy/45">
                          {item.pricing_type ? `${item.pricing_type}: ` : ""}
                          {item.option_label}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold">
                        {formatINR(item.line_total)}
                      </p>
                    </div>
                    <p className="mt-auto pt-2 text-[11px] text-navy/40">
                      {formatINR(item.unit_price)} × {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {order.customer_note && (
              <div className="mt-4 rounded-xl bg-blush p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-navy/40">
                  Your note
                </p>
                <p className="mt-1 text-xs leading-relaxed text-navy/60">
                  {order.customer_note}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-navy/5 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <MapPin className="h-4 w-4 text-blue" />
              Delivery address
            </h2>
            <div className="mt-3 text-sm leading-relaxed text-navy/60">
              <p className="font-medium text-navy">{address.name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-navy/45">
                <Phone className="h-3 w-3" />
                {address.phone}
              </p>
              <p className="mt-2">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.city}, {address.state} — {address.pincode}
                {address.landmark ? (
                  <>
                    <br />
                    Landmark: {address.landmark}
                  </>
                ) : null}
              </p>
            </div>
          </section>

          {requests.length > 0 && (
            <section className="rounded-2xl border border-navy/5 bg-white p-5 shadow-card">
              <h2 className="text-base font-semibold">Requests</h2>
              <div className="mt-3 space-y-3">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-xl border border-navy/5 bg-blush/60 p-3.5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        status={request.type}
                        label={
                          request.type === "replace"
                            ? "Replacement"
                            : request.type === "return"
                              ? "Return"
                              : "Cancellation"
                        }
                      />
                      <StatusBadge status={request.status} />
                      <span className="ml-auto text-[10px] text-navy/35">
                        {formatDate(request.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-navy/70">
                      {request.reason}
                    </p>
                    {request.description && (
                      <p className="mt-1 text-xs leading-relaxed text-navy/50">
                        {request.description}
                      </p>
                    )}
                    {request.admin_note && (
                      <p className="mt-2 rounded-lg bg-white px-3 py-2 text-[11px] leading-relaxed text-navy/55">
                        <span className="font-medium">Our note: </span>
                        {request.admin_note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-navy/5 bg-white p-5 shadow-card">
            <h2 className="text-base font-semibold">Order summary</h2>
            <div className="mt-3 space-y-2.5 text-sm">
              <div className="flex justify-between text-navy/55">
                <span>Subtotal</span>
                <span>{formatINR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-navy/55">
                <span>Delivery</span>
                <span className="text-[11px] text-navy/40">Confirmed on call</span>
              </div>
              <div className="flex justify-between border-t border-navy/5 pt-2.5 font-medium">
                <span>Total</span>
                <span>{formatINR(order.total)}</span>
              </div>
              {order.confirmed_total !== null && (
                <div className="flex justify-between rounded-xl bg-emerald-50 px-3 py-2 text-emerald-800">
                  <span className="text-xs font-medium">Confirmed amount</span>
                  <span className="text-sm font-semibold">
                    {formatINR(order.confirmed_total)}
                  </span>
                </div>
              )}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-navy/40">
              The amount above is for the items selected. Our team confirms final
              pricing, including delivery, over a call.
            </p>
          </section>

          <section className="rounded-2xl border border-navy/5 bg-white p-5 shadow-card">
            <h2 className="text-base font-semibold">Order journey</h2>
            <OrderJourney order={order} />
          </section>

          {(order.courier || order.tracking_number || order.tracking_url) && (
            <section className="rounded-2xl border border-navy/5 bg-white p-5 shadow-card">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Truck className="h-4 w-4 text-blue" />
                Tracking
              </h2>
              <div className="mt-3 space-y-1.5 text-xs text-navy/55">
                {order.courier && (
                  <p>
                    <span className="text-navy/35">Courier: </span>
                    {order.courier}
                  </p>
                )}
                {order.tracking_number && (
                  <p>
                    <span className="text-navy/35">Number: </span>
                    {order.tracking_number}
                  </p>
                )}
                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-blue hover:text-blue-dark"
                  >
                    Track your parcel
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </section>
          )}

          <section className="rounded-2xl bg-blush p-5">
            <p className="text-xs leading-relaxed text-navy/50">
              {order.status === "cancelled"
                ? "This order is closed. If you have a question about your cancellation or refund, please contact our team."
                : order.status === "delivered"
                  ? `You can request a return or replacement within ${RETURN_WINDOW_DAYS} days of delivery${
                      windowEnd
                        ? ` (until ${formatDate(windowEnd.toISOString())})`
                        : ""
                    }.`
                  : "Our team will call you to confirm your order. Need a change? We're happy to help."}
            </p>
            <Link
              href="/account"
              className="mt-2 inline-block text-xs font-medium text-blue hover:text-blue-dark"
            >
              View saved addresses
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
