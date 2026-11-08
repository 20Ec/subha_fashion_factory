import Link from "next/link";
import {
  ArrowRight,
  IndianRupee,
  Package,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Tags,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FlowerMark } from "@/components/ui/logo";

const statusOrder = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

const statusColors: Record<string, string> = {
  pending: "bg-amber-400",
  confirmed: "bg-blue-500",
  packed: "bg-violet-500",
  shipped: "bg-cyan-500",
  delivered: "bg-emerald-500",
  cancelled: "bg-rose-400",
};

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const [
    { data: statusRows },
    { count: productCount },
    { count: categoryCount },
    { count: pendingRequestCount },
    { data: paidOrders },
    { data: recentOrders },
    { data: pendingRequests },
  ] = await Promise.all([
    supabase.from("orders").select("status"),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("categories")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("order_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("orders")
      .select("total, confirmed_total")
      .eq("payment_status", "paid")
      .neq("status", "cancelled"),
    supabase
      .from("orders")
      .select("*, order_items(id, image_url, product_name)")
      .order("placed_at", { ascending: false })
      .limit(6),
    supabase
      .from("order_requests")
      .select("id, type, created_at, orders(order_number, customer_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const row of statusRows ?? []) {
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
  }
  const totalOrders = statusRows?.length ?? 0;

  const revenue = (paidOrders ?? []).reduce(
    (sum, order) =>
      sum + Number(order.confirmed_total ?? order.total ?? 0),
    0
  );

  const stats = [
    {
      label: "Total orders",
      value: String(totalOrders),
      icon: Package,
      tone: "bg-blue/10 text-blue",
    },
    {
      label: "Awaiting confirmation",
      value: String(statusCounts.pending ?? 0),
      icon: Sparkles,
      tone: "bg-amber-100 text-amber-700",
    },
    {
      label: "Delivered",
      value: String(statusCounts.delivered ?? 0),
      icon: ShoppingBag,
      tone: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Revenue marked paid",
      value: formatINR(revenue),
      icon: IndianRupee,
      tone: "bg-pink-soft text-navy",
    },
    {
      label: "Products",
      value: String(productCount ?? 0),
      icon: ShoppingBag,
      tone: "bg-violet-100 text-violet-700",
    },
    {
      label: "Categories",
      value: String(categoryCount ?? 0),
      icon: Tags,
      tone: "bg-cyan-100 text-cyan-700",
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deep-rose">
            Overview
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome back, {admin.fullName.split(" ")[0] || "Admin"}
          </h1>
          <p className="mt-1 text-sm text-ink">
            Here&apos;s what&apos;s happening at the studio today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/products/new"
            className={buttonClass({ size: "sm" })}
          >
            <ShoppingBag className="h-4 w-4" />
            Add product
          </Link>
          <Link
            href="/admin/orders"
            className={buttonClass({ variant: "outline", size: "sm" })}
          >
            View orders
          </Link>
        </div>
      </div>

      {(pendingRequestCount ?? 0) > 0 && (
        <Link
          href="/admin/requests"
          className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 transition hover:border-amber-300"
        >
          <span className="flex items-center gap-2.5 text-sm text-amber-800">
            <RotateCcw className="h-4 w-4" />
            <strong className="font-semibold">{pendingRequestCount}</strong>
            {pendingRequestCount === 1 ? "request needs" : "requests need"} your
            attention
          </span>
          <ArrowRight className="h-4 w-4 text-amber-700" />
        </Link>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-line bg-white p-4 shadow-sm"
          >
            <span
              className={`grid h-9 w-9 place-items-center rounded-xl ${stat.tone}`}
            >
              <stat.icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
              {stat.value}
            </p>
            <p className="mt-0.5 text-[11px] text-ink">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <section className="rounded-2xl border border-line bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-line px-4 py-3.5 sm:px-5">
            <h2 className="text-sm font-semibold">Recent orders</h2>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue hover:text-blue-dark"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {(recentOrders ?? []).length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No orders yet"
                description="Orders placed on the storefront will appear here."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead className="bg-blush/60 text-[10px] uppercase tracking-wider text-ink">
                  <tr>
                    <th className="px-5 py-2.5 font-semibold">Order</th>
                    <th className="px-3 py-2.5 font-semibold">Customer</th>
                    <th className="px-3 py-2.5 font-semibold">Total</th>
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {(recentOrders ?? []).map((order) => (
                    <tr key={order.id} className="hover:bg-blush/30">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-xs font-semibold text-blue hover:text-blue-dark"
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <p className="max-w-[150px] truncate text-xs">
                          {order.customer_name}
                        </p>
                        <p className="text-[10px] text-ink">
                          {order.customer_phone}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-xs font-medium">
                        {formatINR(order.confirmed_total ?? order.total)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-3 text-right text-[10px] text-ink">
                        {formatDate(order.placed_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Orders by status</h2>
            {totalOrders === 0 ? (
              <p className="mt-3 text-xs text-ink">
                Status breakdown will appear once orders come in.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {statusOrder.map((status) => {
                  const count = statusCounts[status] ?? 0;
                  const percent = totalOrders
                    ? Math.round((count / totalOrders) * 100)
                    : 0;
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="capitalize text-ink">{status}</span>
                        <span className="font-medium text-navy/70">{count}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-blush">
                        <div
                          className={`h-full rounded-full ${statusColors[status]}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Pending requests</h2>
              <Link
                href="/admin/requests"
                className="text-[11px] font-medium text-blue hover:text-blue-dark"
              >
                Manage
              </Link>
            </div>

            {(pendingRequests ?? []).length === 0 ? (
              <p className="mt-3 text-xs text-ink">
                Nothing waiting — you&apos;re all caught up.
              </p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {(pendingRequests ?? []).map((request) => {
                  const order = request.orders as unknown as
                    | { order_number: string; customer_name: string }
                    | null;
                  return (
                    <Link
                      key={request.id}
                      href="/admin/requests"
                      className="block rounded-xl border border-line p-3 transition hover:border-line"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium capitalize">
                          {request.type} request
                        </span>
                        <span className="text-[10px] text-ink">
                          {formatDate(request.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-ink">
                        {order?.order_number ?? "Order"} ·{" "}
                        {order?.customer_name ?? "Customer"}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <div className="flex items-center justify-center gap-2 rounded-2xl bg-white p-4 text-[10px] text-navy/30">
            <FlowerMark className="h-3.5 w-3.5 text-deep-rose" />
            Subha Fashion Factory admin
          </div>
        </div>
      </div>
    </div>
  );
}
