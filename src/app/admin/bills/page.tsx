import type { Metadata } from "next";
import Link from "next/link";
import { Download, Eye, Plus, Receipt, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { AutoFilterForm } from "@/components/admin/auto-filter-form";
import { cleanQuery, firstValue } from "@/lib/search";
import type { Bill } from "@/lib/types";

export const metadata: Metadata = { title: "Bills" };

const PER_PAGE = 20;

/** PostgREST/SQL codes returned when the bills migration has not been run. */
function errored(error: { code?: string }) {
  return (
    error.code === "PGRST205" ||
    error.code === "PGRST202" ||
    error.code === "42P01"
  );
}

type Row = Pick<
  Bill,
  "id" | "bill_number" | "customer_name" | "bill_date" | "total" | "pdf_path"
>;

export default async function AdminBillsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawQuery = (firstValue(params.q) ?? "").trim();
  const q = cleanQuery(params.q);
  const page = Math.max(1, Number(firstValue(params.page) ?? "1") || 1);

  const supabase = await createClient();
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  let query = supabase
    .from("bills")
    .select(
      "id, bill_number, customer_name, bill_date, total, pdf_path",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.or(
      `bill_number.ilike.%${q}%,customer_name.ilike.%${q}%`
    );
  }

  const { data, count, error } = await query;
  const bills = (data ?? []) as Row[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  function href(targetPage: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (targetPage > 1) sp.set("page", String(targetPage));
    const suffix = sp.toString();
    return suffix ? `/admin/bills?${suffix}` : "/admin/bills";
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deep-rose">
            Billing
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Bill history
          </h1>
          <p className="mt-1 text-sm text-ink">
            {total} {total === 1 ? "bill" : "bills"} generated so far.
          </p>
        </div>
        <Link href="/admin/bills/new" className={buttonClass({ size: "sm" })}>
          <Plus className="h-3.5 w-3.5" />
          New bill
        </Link>
      </div>

      <AutoFilterForm className="mt-5 flex flex-col gap-2 rounded-2xl border border-line bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/30" />
          <Input
            name="q"
            defaultValue={rawQuery}
            placeholder="Search bill number or customer name"
            aria-label="Search bills"
            className="h-10 border-transparent bg-blush pl-10 focus:bg-white"
          />
        </div>
        <button
          type="submit"
          className={buttonClass({
            variant: "secondary",
            size: "sm",
            className: "h-10",
          })}
        >
          Apply
        </button>
        {rawQuery && (
          <Link
            href="/admin/bills"
            className={buttonClass({
              variant: "ghost",
              size: "sm",
              className: "h-10",
            })}
          >
            Clear
          </Link>
        )}
      </AutoFilterForm>

      {error && (
        errored(error) ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <p className="text-sm font-semibold">Bill tables are not set up yet</p>
            <p className="mt-1 text-xs leading-relaxed">
              Apply the migration once, then reload this page:
            </p>
            <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 font-mono text-[11px]">
              npm run db:bills
            </p>
            <p className="mt-2 text-xs leading-relaxed">
              No access token? Paste the contents of{" "}
              <span className="font-mono text-[11px]">supabase/bills.sql</span>{" "}
              into the Supabase SQL Editor and run it.
            </p>
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
            {error.message}
          </p>
        )
      )}

      {bills.length === 0 ? (
        <EmptyState
          className="mt-6 bg-white"
          title={q ? "No matching bills" : "No bills yet"}
          description={
            q
              ? "Try a different bill number or customer name."
              : "Create your first bill and its PDF will be saved here."
          }
        />
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-blush/60 text-[10px] uppercase tracking-wider text-ink">
                <tr>
                  <th className="px-4 py-3 font-semibold">Bill</th>
                  <th className="px-3 py-3 font-semibold">Customer</th>
                  <th className="px-3 py-3 font-semibold">Bill date</th>
                  <th className="px-3 py-3 font-semibold">Final amount</th>
                  <th className="px-4 py-3 text-right font-semibold">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-blush/20">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-navy">
                        <Receipt className="h-3.5 w-3.5 text-deep-rose" />
                        {bill.bill_number}
                      </span>
                      {!bill.pdf_path && (
                        <p className="mt-0.5 text-[10px] text-ink/60">
                          PDF generated on first download
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <p className="max-w-[220px] truncate text-xs">
                        {bill.customer_name}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-xs text-ink">
                      {formatDate(`${bill.bill_date}T00:00:00`)}
                    </td>
                    <td className="px-3 py-3 text-xs font-medium">
                      {formatINR(bill.total)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/api/admin/bills/${bill.id}/pdf?view=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={buttonClass({
                            variant: "ghost",
                            size: "sm",
                            className: "gap-1.5",
                          })}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </a>
                        <a
                          href={`/api/admin/bills/${bill.id}/pdf`}
                          className={buttonClass({
                            variant: "outline",
                            size: "sm",
                            className: "gap-1.5",
                          })}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
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
