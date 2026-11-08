import type { Metadata } from "next";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { RequestActions } from "@/components/admin/request-actions";
import { firstValue } from "@/lib/search";
import type { OrderRequest } from "@/lib/types";

export const metadata: Metadata = { title: "Requests" };

type Row = OrderRequest & {
  orders: {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    status: string;
    payment_status: string;
  } | null;
};

const STATUS_FILTERS = ["pending", "approved", "rejected", "completed", "all"] as const;
const TYPE_FILTERS = ["all", "return", "replace", "cancel"] as const;

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string | string[];
    type?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const requestedStatus = firstValue(params.status) ?? "pending";
  const requestedType = firstValue(params.type) ?? "all";
  const status = STATUS_FILTERS.includes(
    requestedStatus as (typeof STATUS_FILTERS)[number]
  )
    ? requestedStatus
    : "pending";
  const type = TYPE_FILTERS.includes(requestedType as (typeof TYPE_FILTERS)[number])
    ? requestedType
    : "all";

  const supabase = await createClient();

  let query = supabase
    .from("order_requests")
    .select(
      "*, orders(id, order_number, customer_name, customer_phone, status, payment_status)"
    )
    .order("created_at", { ascending: false });

  if (status !== "all") query = query.eq("status", status);
  if (type !== "all") query = query.eq("type", type);

  const { data } = await query;
  const requests = (data ?? []) as unknown as Row[];

  function filterHref(updates: { status?: string; type?: string }) {
    const sp = new URLSearchParams();
    const nextStatus = updates.status ?? status;
    const nextType = updates.type ?? type;
    if (nextStatus !== "pending") sp.set("status", nextStatus);
    if (nextType !== "all") sp.set("type", nextType);
    const suffix = sp.toString();
    return suffix ? `/admin/requests?${suffix}` : "/admin/requests";
  }

  return (
    <div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deep-rose">
          Customer care
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Requests
        </h1>
        <p className="mt-1 text-sm text-ink">
          Review cancellation, return and replacement requests from customers.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-line bg-white p-3 shadow-sm">
        <div className="hide-scrollbar flex gap-1.5 overflow-x-auto">
          {STATUS_FILTERS.map((option) => (
            <Link
              key={option}
              href={filterHref({ status: option })}
              className={buttonClass({
                variant: status === option ? "secondary" : "ghost",
                size: "sm",
                className: "shrink-0 capitalize",
              })}
            >
              {option}
            </Link>
          ))}
        </div>
        <div className="hide-scrollbar flex gap-1.5 overflow-x-auto border-t border-line pt-2">
          {TYPE_FILTERS.map((option) => (
            <Link
              key={option}
              href={filterHref({ type: option })}
              className={buttonClass({
                variant: type === option ? "pink" : "ghost",
                size: "sm",
                className: "shrink-0 capitalize",
              })}
            >
              {option === "all" ? "All types" : option}
            </Link>
          ))}
        </div>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          className="mt-6 bg-white"
          title="Nothing here"
          description={`No ${status === "all" ? "" : status} ${
            type === "all" ? "" : `${type} `
          }requests found.`}
        />
      ) : (
        <div className="mt-5 grid gap-3">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
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
                  {request.orders?.status && (
                    <span className="text-[10px] text-ink">
                      Order status:{" "}
                      <span className="capitalize">{request.orders.status}</span>
                    </span>
                  )}
                  {request.orders?.payment_status && (
                    <StatusBadge
                      status={request.orders.payment_status}
                      label={`Payment ${request.orders.payment_status}`}
                    />
                  )}
                </div>
                <span className="text-[10px] text-ink">
                  {formatDate(request.created_at, true)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                {request.orders ? (
                  <>
                    <Link
                      href={`/admin/orders/${request.orders.id}`}
                      className="font-semibold text-blue hover:text-blue-dark"
                    >
                      {request.orders.order_number}
                    </Link>
                    <span className="text-ink">
                      {request.orders.customer_name}
                    </span>
                    <span className="text-ink">
                      {request.orders.customer_phone}
                    </span>
                  </>
                ) : (
                  <span className="text-ink">Order unavailable</span>
                )}
              </div>

              <p className="mt-3 text-sm font-medium text-navy/75">
                {request.reason}
              </p>
              {request.description && (
                <p className="mt-1 text-xs leading-relaxed text-ink">
                  {request.description}
                </p>
              )}

              {request.status === "pending" && request.type === "cancel" && (
                <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
                  <RotateCcw className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {request.orders?.status === "delivered"
                    ? "This order has already been delivered, so it can only be rejected with a reason."
                    : request.orders?.status === "cancelled"
                      ? "This order is already cancelled."
                      : request.orders?.payment_status === "paid"
                        ? "Approving cancels the order. The payment is marked paid, so refund it separately afterwards."
                        : "Approving this request cancels the order automatically."}
                </p>
              )}

              {request.admin_note && (
                <p className="mt-2 rounded-lg bg-blush px-3 py-2 text-[11px] text-ink">
                  <span className="font-medium">Note: </span>
                  {request.admin_note}
                </p>
              )}

              <RequestActions requestId={request.id} status={request.status} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
