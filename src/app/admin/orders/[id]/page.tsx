import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/utils";
import { orderAddressLines } from "@/lib/orders";
import { StatusBadge } from "@/components/ui/status-badge";
import { FlowerMark } from "@/components/ui/logo";
import { OrderUpdateForm } from "@/components/admin/order-update-form";
import { RequestActions } from "@/components/admin/request-actions";
import type { Order, OrderItem, OrderRequest } from "@/lib/types";

export const metadata: Metadata = { title: "Order details" };

type OrderWithRelations = Order & {
  order_items: OrderItem[];
  order_status_history: {
    id: string;
    status: string;
    note: string | null;
    created_at: string;
  }[];
  order_requests: OrderRequest[];
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*), order_status_history(*), order_requests(*)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  const order = data as unknown as OrderWithRelations;
  const items = [...(order.order_items ?? [])].sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  const history = [...(order.order_status_history ?? [])].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const requests = [...(order.order_requests ?? [])].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const address = orderAddressLines(order);

  return (
    <div>
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-xs font-medium text-navy/45 transition hover:text-navy"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        All orders
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-pink">
            Order
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {order.order_number}
          </h1>
          <p className="mt-1 text-xs text-navy/45">
            Placed {formatDate(order.placed_at, true)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.payment_status} label={`Payment ${order.payment_status}`} />
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-5">
          <section className="rounded-2xl border border-navy/5 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <UserRound className="h-4 w-4 text-blue" />
              Customer
            </h2>
            <div className="mt-3 grid gap-2 text-xs text-navy/60 sm:grid-cols-2">
              <p className="flex items-center gap-2">
                <UserRound className="h-3.5 w-3.5 text-navy/35" />
                {order.customer_name || "—"}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-navy/35" />
                {order.customer_phone || "—"}
              </p>
              <p className="flex items-center gap-2 sm:col-span-2">
                <Mail className="h-3.5 w-3.5 text-navy/35" />
                {order.customer_email || "—"}
              </p>
            </div>

            <div className="mt-4 rounded-xl bg-blush/70 p-3.5">
              <h3 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-navy/40">
                <MapPin className="h-3 w-3" />
                Delivery address
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-navy/60">
                <span className="font-medium text-navy">{address.name}</span>
                <br />
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
                <br />
                {address.phone}
              </p>
            </div>

            {order.customer_note && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                  Customer note
                </p>
                <p className="mt-1 text-xs leading-relaxed text-amber-800">
                  {order.customer_note}
                </p>
              </div>
            )}

            {order.cancellation_reason && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-700">
                  Cancellation reason
                </p>
                <p className="mt-1 text-xs leading-relaxed text-rose-800">
                  {order.cancellation_reason}
                </p>
                {order.status === "cancelled" &&
                  order.payment_status === "paid" && (
                    <p className="mt-1.5 text-[11px] leading-relaxed text-rose-700">
                      Payment is still marked paid. Mark it as refunded from the
                      update panel once the refund is complete.
                    </p>
                  )}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-navy/5 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Items</h2>
              <span className="text-[10px] text-navy/35">
                {items.reduce((sum, item) => sum + item.quantity, 0)} total
              </span>
            </div>
            <div className="mt-3 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-blush">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.product_name}
                        fill
                        sizes="48px"
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
                    <p className="truncate text-[10px] capitalize text-navy/45">
                      {item.pricing_type ? `${item.pricing_type}: ` : ""}
                      {item.option_label} · {formatINR(item.unit_price)} ×{" "}
                      {item.quantity}
                    </p>
                  </div>
                  <p className="text-xs font-semibold">
                    {formatINR(item.line_total)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-navy/5 pt-3 text-xs">
              <div className="flex justify-between text-navy/55">
                <span>Items subtotal</span>
                <span>{formatINR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-navy/55">
                <span>Delivery</span>
                <span className="text-[10px] text-navy/35">Confirmed on call</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Order total</span>
                <span>{formatINR(order.total)}</span>
              </div>
              {order.confirmed_total !== null && (
                <div className="flex justify-between rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
                  <span>Confirmed total</span>
                  <span className="font-semibold">
                    {formatINR(order.confirmed_total)}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-navy/5 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <RotateCcw className="h-4 w-4 text-blue" />
              Requests
            </h2>
            {requests.length === 0 ? (
              <p className="mt-2 text-xs text-navy/40">
                No return, replacement or cancellation requests for this order.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-xl border border-navy/5 bg-blush/40 p-3.5"
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
                        {formatDate(request.created_at, true)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-navy/75">
                      {request.reason}
                    </p>
                    {request.description && (
                      <p className="mt-1 text-[11px] leading-relaxed text-navy/50">
                        {request.description}
                      </p>
                    )}
                    {request.admin_note && (
                      <p className="mt-2 rounded-lg bg-white px-3 py-2 text-[11px] text-navy/55">
                        <span className="font-medium">Admin note: </span>
                        {request.admin_note}
                      </p>
                    )}
                    <RequestActions requestId={request.id} status={request.status} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-navy/5 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Update order</h2>
            <p className="mt-0.5 text-[11px] text-navy/45">
              Confirm the final price after speaking with the customer, then move
              the order forward.
            </p>
            <div className="mt-4">
              <OrderUpdateForm order={order} />
            </div>
          </section>

          <section className="rounded-2xl border border-navy/5 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Status history</h2>
            <div className="mt-4">
              {history.length === 0 ? (
                <p className="text-xs text-navy/40">No history yet.</p>
              ) : (
                history.map((entry, index) => (
                  <div key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {index < history.length - 1 && (
                      <span className="absolute left-[4px] top-3 h-full w-px bg-navy/10" />
                    )}
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        index === history.length - 1
                          ? "bg-blue ring-4 ring-blue/10"
                          : "bg-navy/20"
                      }`}
                    />
                    <div>
                      <p className="text-xs font-medium capitalize text-navy/75">
                        {entry.status}
                      </p>
                      <p className="mt-0.5 text-[10px] text-navy/35">
                        {formatDate(entry.created_at, true)}
                      </p>
                      {entry.note && (
                        <p className="mt-0.5 text-[11px] text-navy/45">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
