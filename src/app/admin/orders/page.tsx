import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/config";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { AutoFilterForm } from "@/components/admin/auto-filter-form";
import { cleanQuery, firstValue } from "@/lib/search";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "Orders" };

const PER_PAGE = 20;

type Row = Pick<
  Order,
  | "id"
  | "order_number"
  | "customer_name"
  | "customer_phone"
  | "total"
  | "confirmed_total"
  | "status"
  | "payment_status"
  | "placed_at"
> & {
  order_items: { id: string; product_name: string; quantity: number }[];
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    page?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const rawQuery = (firstValue(params.q) ?? "").trim();
  const q = cleanQuery(params.q);
  const status = firstValue(params.status) ?? "all";
  const page = Math.max(1, Number(firstValue(params.page) ?? "1") || 1);

  const supabase = await createClient();
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  let query = supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_phone, total, confirmed_total, status, payment_status, placed_at, order_items(id, product_name, quantity)",
      { count: "exact" }
    )
    .order("placed_at", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.or(
      `order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`
    );
  }
  if (ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
    query = query.eq("status", status);
  }

  const { data, count, error } = await query;
  const orders = (data ?? []) as unknown as Row[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  function href(targetPage: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status !== "all") sp.set("status", status);
    if (targetPage > 1) sp.set("page", String(targetPage));
    const suffix = sp.toString();
    return suffix ? `/admin/orders?${suffix}` : "/admin/orders";
  }

  return (
    <div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deep-rose">
          Orders
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Orders
        </h1>
        <p className="mt-1 text-sm text-ink">
          {total} {total === 1 ? "order" : "orders"} placed so far.
        </p>
      </div>

      <AutoFilterForm className="mt-5 flex flex-col gap-2 rounded-2xl border border-line bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/30" />
          <Input
            name="q"
            defaultValue={rawQuery}
            placeholder="Search order number, name or phone"
            aria-label="Search orders"
            className="h-10 border-transparent bg-blush pl-10 focus:bg-white"
          />
        </div>
        <Select
          name="status"
          defaultValue={status}
          aria-label="Filter by status"
          className="h-10 border-transparent bg-blush text-xs capitalize sm:w-44 focus:bg-white"
        >
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((option) => (
            <option key={option} value={option} className="capitalize">
              {option}
            </option>
          ))}
        </Select>
        <button
          type="submit"
          className={buttonClass({ variant: "secondary", size: "sm", className: "h-10" })}
        >
          Apply
        </button>
        {(rawQuery || status !== "all") && (
          <Link
            href="/admin/orders"
            className={buttonClass({ variant: "ghost", size: "sm", className: "h-10" })}
          >
            Clear
          </Link>
        )}
      </AutoFilterForm>

      {error && (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
          {error.message}
        </p>
      )}

      {orders.length === 0 ? (
        <EmptyState
          className="mt-6 bg-white"
          title={q || status !== "all" ? "No matching orders" : "No orders yet"}
          description={
            q || status !== "all"
              ? "Try a different search term or status."
              : "New orders from the storefront will appear here."
          }
        />
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-blush/60 text-[10px] uppercase tracking-wider text-ink">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-3 py-3 font-semibold">Customer</th>
                  <th className="px-3 py-3 font-semibold">Items</th>
                  <th className="px-3 py-3 font-semibold">Total</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 text-right font-semibold">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {orders.map((order) => {
                  const itemCount = (order.order_items ?? []).reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  );
                  return (
                    <tr key={order.id} className="hover:bg-blush/20">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-xs font-semibold text-blue hover:text-blue-dark"
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <p className="max-w-[180px] truncate text-xs">
                          {order.customer_name || "—"}
                        </p>
                        <p className="text-[10px] text-ink">
                          {order.customer_phone}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-xs text-ink">
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-xs font-medium">
                          {formatINR(order.confirmed_total ?? order.total)}
                        </p>
                        {order.confirmed_total !== null && (
                          <p className="text-[10px] text-emerald-600">Confirmed</p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={order.payment_status} />
                      </td>
                      <td className="px-4 py-3 text-right text-[10px] text-ink">
                        {formatDate(order.placed_at, true)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-ink">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={href(page - 1)}
                className={buttonClass({ variant: "outline", size: "sm" })}
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={href(page + 1)}
                className={buttonClass({ variant: "outline", size: "sm" })}
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
