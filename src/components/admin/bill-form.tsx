"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  Download,
  Plus,
  Receipt,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { createBillAction } from "@/lib/actions/bills";
import { billLineTotal, billTotals, roundMoney } from "@/lib/bill-calc";
import { formatINR } from "@/lib/utils";
import { Button, buttonClass } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type Row = {
  key: string;
  product_name: string;
  inch: string;
  pieces: string;
  size: string;
  nos: string;
  price: string;
};

let rowCounter = 0;

function newRow(): Row {
  rowCounter += 1;
  return {
    key: `bill-row-${Date.now()}-${rowCounter}`,
    product_name: "",
    inch: "",
    pieces: "",
    size: "",
    nos: "",
    price: "",
  };
}

function emptyRows() {
  return [newRow(), newRow(), newRow()];
}

function toNumber(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

const cellInput =
  "h-9 w-full rounded-lg border border-line bg-white px-2.5 text-xs text-navy outline-none transition placeholder:text-ink/35 focus:border-pink focus:ring-2 focus:ring-pink/15";

export function BillForm({ defaultDate }: { defaultDate: string }) {
  const [customerName, setCustomerName] = useState("");
  const [billDate, setBillDate] = useState(defaultDate);
  const [shipping, setShipping] = useState("");
  const [rows, setRows] = useState<Row[]>(emptyRows);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<{
    id: string;
    billNumber: string;
  } | null>(null);

  const totals = useMemo(
    () =>
      billTotals(
        rows.map((row) => ({
          nos: roundMoney(toNumber(row.nos)),
          price: roundMoney(toNumber(row.price)),
        })),
        shipping
      ),
    [rows, shipping]
  );

  const itemCount = rows.filter(
    (row) =>
      row.product_name.trim() ||
      row.inch.trim() ||
      row.pieces.trim() ||
      row.size.trim() ||
      row.nos.trim() ||
      row.price.trim()
  ).length;

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((previous) =>
      previous.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  }

  function removeRow(key: string) {
    setRows((previous) =>
      previous.length <= 1
        ? previous
        : previous.filter((row) => row.key !== key)
    );
  }

  function resetForm() {
    setCustomerName("");
    setShipping("");
    setRows(emptyRows());
    setError(null);
    setCreated(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const name = customerName.trim();

    if (name.length < 2) {
      setError("Enter the customer's name.");
      return;
    }

    const parsedDate = new Date(`${billDate}T00:00:00Z`);

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(billDate) ||
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== billDate
    ) {
      setError("Choose a valid bill date.");
      return;
    }

    const collected = rows
      .map((row) => ({
        product_name: row.product_name.trim(),
        inch: row.inch.trim(),
        pieces: row.pieces.trim(),
        size: row.size.trim(),
        nos: row.nos.trim(),
        price: row.price.trim(),
      }))
      .filter(
        (row) =>
          row.product_name ||
          row.inch ||
          row.pieces ||
          row.size ||
          row.nos ||
          row.price
      );

    if (collected.length === 0) {
      setError("Add at least one item with a product name.");
      return;
    }

    if (collected.length > 100) {
      setError("A bill can contain at most 100 items.");
      return;
    }

    for (const [index, row] of collected.entries()) {
      if (!row.product_name) {
        setError(`Row ${index + 1}: enter a product name.`);
        return;
      }

      if (toNumber(row.nos) <= 0) {
        setError(`Row ${index + 1}: Nos must be greater than zero.`);
        return;
      }

      if (toNumber(row.price) < 0) {
        setError(`Row ${index + 1}: price cannot be negative.`);
        return;
      }
    }

    const shippingValue = toNumber(shipping);

    if (shippingValue < 0) {
      setError("Shipping charges cannot be negative.");
      return;
    }

    setPending(true);
    const result = await createBillAction({
      customer_name: name,
      bill_date: billDate,
      shipping: shippingValue,
      items: collected.map((row) => ({
        product_name: row.product_name,
        inch: row.inch,
        pieces: row.pieces,
        size: row.size,
        nos: roundMoney(toNumber(row.nos)),
        price: roundMoney(toNumber(row.price)),
      })),
    });
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.id && result.billNumber) {
      setCreated({ id: result.id, billNumber: result.billNumber });
      toast.success(result.success ?? "Bill created");

      // The PDF has already been generated and stored server-side; this just
      // saves the admin a click. The success card keeps a link as fallback.
      const link = document.createElement("a");
      link.href = `/api/admin/bills/${result.id}/pdf`;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();

      setCustomerName("");
      setShipping("");
      setRows(emptyRows());
    }
  }

  return (
    <div>
      <Link
        href="/admin/bills"
        className="inline-flex items-center gap-1 text-xs font-medium text-ink transition hover:text-navy"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Bill history
      </Link>

      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deep-rose">
          Billing
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          New bill
        </h1>
        <p className="mt-1 text-sm text-ink">
          Add the customer and item rows. The bill number, totals and branded
          PDF are generated when you save.
        </p>
      </div>

      {created && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Bill {created.billNumber} created
                </p>
                <p className="text-xs text-emerald-900/70">
                  All item rows were saved and the PDF is stored in Bill
                  History.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={`/api/admin/bills/${created.id}/pdf`}
                className={buttonClass({ size: "sm" })}
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </a>
              <Link
                href="/admin/bills"
                className={buttonClass({ variant: "outline", size: "sm" })}
              >
                View history
              </Link>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={submit}
        className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px] lg:items-start"
      >
        <div className="space-y-5">
          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-pink-soft text-deep-rose">
                <Receipt className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-navy">
                  Bill details
                </h2>
                <p className="text-xs text-ink">
                  The bill number is generated automatically on save.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="bill-customer">Customer name</Label>
                <Input
                  id="bill-customer"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="e.g. Priya Sharma"
                  maxLength={120}
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="bill-date">Bill date</Label>
                <Input
                  id="bill-date"
                  type="date"
                  value={billDate}
                  onChange={(event) => setBillDate(event.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-navy">Items</h2>
                <p className="text-xs text-ink">
                  Enter measurements and pricing manually for each row.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRows((previous) => [...previous, newRow()])}
                className={buttonClass({ variant: "outline", size: "sm" })}
              >
                <Plus className="h-3.5 w-3.5" />
                Add row
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-ink/70">
                    <th className="w-10 px-2 pb-2 font-semibold">S.No</th>
                    <th className="px-2 pb-2 font-semibold">Product name</th>
                    <th className="w-20 px-2 pb-2 font-semibold">Inch</th>
                    <th className="w-20 px-2 pb-2 font-semibold">Pieces</th>
                    <th className="w-20 px-2 pb-2 font-semibold">Size</th>
                    <th className="w-20 px-2 pb-2 font-semibold">Nos</th>
                    <th className="w-24 px-2 pb-2 font-semibold">Price</th>
                    <th className="w-24 px-2 pb-2 text-right font-semibold">
                      Total
                    </th>
                    <th className="w-9 px-1 pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const lineTotal = billLineTotal(
                      roundMoney(toNumber(row.nos)),
                      roundMoney(toNumber(row.price))
                    );

                    return (
                      <tr
                        key={row.key}
                        className="border-t border-line/70 align-top"
                      >
                        <td className="px-2 py-2 text-center text-xs text-ink/70">
                          {index + 1}
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={row.product_name}
                            onChange={(event) =>
                              updateRow(row.key, {
                                product_name: event.target.value,
                              })
                            }
                            className={cellInput}
                            placeholder="Product name"
                            aria-label={`Row ${index + 1} product name`}
                            maxLength={200}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={row.inch}
                            onChange={(event) =>
                              updateRow(row.key, { inch: event.target.value })
                            }
                            className={cellInput}
                            placeholder="—"
                            aria-label={`Row ${index + 1} inch`}
                            maxLength={40}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={row.pieces}
                            onChange={(event) =>
                              updateRow(row.key, { pieces: event.target.value })
                            }
                            className={cellInput}
                            placeholder="—"
                            aria-label={`Row ${index + 1} pieces`}
                            maxLength={40}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={row.size}
                            onChange={(event) =>
                              updateRow(row.key, { size: event.target.value })
                            }
                            className={cellInput}
                            placeholder="—"
                            aria-label={`Row ${index + 1} size`}
                            maxLength={40}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={row.nos}
                            onChange={(event) =>
                              updateRow(row.key, { nos: event.target.value })
                            }
                            className={`${cellInput} text-right`}
                            placeholder="0"
                            inputMode="decimal"
                            aria-label={`Row ${index + 1} nos`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={row.price}
                            onChange={(event) =>
                              updateRow(row.key, { price: event.target.value })
                            }
                            className={`${cellInput} text-right`}
                            placeholder="0"
                            inputMode="decimal"
                            aria-label={`Row ${index + 1} price`}
                          />
                        </td>
                        <td className="whitespace-nowrap px-2 py-4 text-right text-xs font-semibold text-navy">
                          {formatINR(lineTotal)}
                        </td>
                        <td className="px-1 py-2">
                          <button
                            type="button"
                            onClick={() => removeRow(row.key)}
                            disabled={rows.length <= 1}
                            aria-label={`Remove row ${index + 1}`}
                            title="Remove row"
                            className="inline-flex h-9 w-8 items-center justify-center rounded-lg text-ink/50 transition hover:bg-rose-50 hover:text-rose-600 disabled:pointer-events-none disabled:opacity-30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-semibold text-navy">Bill summary</h2>
            <p className="mt-0.5 text-xs text-ink">
              {itemCount === 0
                ? "No items added yet"
                : `${itemCount} ${itemCount === 1 ? "row" : "rows"} with details`}
            </p>

            <dl className="mt-4 space-y-2.5 border-b border-line pb-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink">Subtotal</dt>
                <dd className="font-medium text-navy">
                  {formatINR(totals.subtotal)}
                </dd>
              </div>
            </dl>

            <div className="mt-4">
              <Label htmlFor="bill-shipping">Shipping charges</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink/60">
                  ₹
                </span>
                <Input
                  id="bill-shipping"
                  value={shipping}
                  onChange={(event) => setShipping(event.target.value)}
                  className="h-10 pl-7 text-right"
                  placeholder="0"
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-blush px-3.5 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-deep-rose">
                Final total
              </span>
              <span className="text-lg font-semibold text-navy">
                {formatINR(totals.total)}
              </span>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              loading={pending}
              disabled={pending}
              className="mt-4 w-full"
            >
              {pending ? "Creating bill…" : "Create bill & generate PDF"}
            </Button>

            <button
              type="button"
              onClick={resetForm}
              className={buttonClass({
                variant: "ghost",
                size: "sm",
                className: "mt-2 w-full",
              })}
            >
              Clear form
            </button>

            <p className="mt-3 text-[11px] leading-relaxed text-ink/70">
              The PDF is generated in A4 with Subha Fashion Factory branding
              and saved to Bill History for re-download.
            </p>
          </section>
        </aside>
      </form>
    </div>
  );
}
