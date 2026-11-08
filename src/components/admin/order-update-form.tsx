"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { updateOrderAction } from "@/lib/actions/admin";
import {
  allowedStatusTransitions,
  paymentOptionsFor,
} from "@/lib/order-rules";
import { ORDER_JOURNEY_STAGES, ORDER_STAGE_LABEL } from "@/lib/orders";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";

type Change = {
  label: string;
  from: string;
  to: string;
};

function statusLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function moneyLabel(value: number | null) {
  return value === null ? "Not set" : formatINR(value);
}

function textLabel(value: string | null) {
  return value && value.trim() ? value : "Not set";
}

export function OrderUpdateForm({ order }: { order: Order }) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
  const [confirmedTotal, setConfirmedTotal] = useState(
    order.confirmed_total !== null ? String(order.confirmed_total) : ""
  );
  const [courier, setCourier] = useState(order.courier ?? "");
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number ?? "");
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url ?? "");
  const [adminNote, setAdminNote] = useState(order.admin_note ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Keep the form in sync after router.refresh() following a successful save.
  useEffect(() => {
    setStatus(order.status);
    setPaymentStatus(order.payment_status);
    setConfirmedTotal(
      order.confirmed_total !== null ? String(order.confirmed_total) : ""
    );
    setCourier(order.courier ?? "");
    setTrackingNumber(order.tracking_number ?? "");
    setTrackingUrl(order.tracking_url ?? "");
    setAdminNote(order.admin_note ?? "");
  }, [
    order.status,
    order.payment_status,
    order.confirmed_total,
    order.courier,
    order.tracking_number,
    order.tracking_url,
    order.admin_note,
  ]);

  const cancelled = order.status === "cancelled";
  const locked = cancelled && order.payment_status !== "paid";
  const refundOnly = cancelled && order.payment_status === "paid";
  const allowedNext = allowedStatusTransitions(order.status);
  // Show the full journey so the admin can see every stage, but only the
  // current stage and the next allowed step(s) can be selected.
  const statusChoices: OrderStatus[] = cancelled
    ? ["cancelled"]
    : [
        ...ORDER_JOURNEY_STAGES,
        ...(allowedNext.includes("cancelled")
          ? (["cancelled"] as OrderStatus[])
          : []),
      ];
  const paymentOptions = paymentOptionsFor(order.payment_status);

  const nextConfirmedTotal =
    confirmedTotal.trim() === "" ? null : Number(confirmedTotal);
  const originalConfirmedTotal =
    order.confirmed_total === null ? null : Number(order.confirmed_total);

  const changes: Change[] = [];
  if (status !== order.status) {
    changes.push({
      label: "Status",
      from: statusLabel(order.status),
      to: statusLabel(status),
    });
  }
  if (paymentStatus !== order.payment_status) {
    changes.push({
      label: "Payment",
      from: statusLabel(order.payment_status),
      to: statusLabel(paymentStatus),
    });
  }
  if (nextConfirmedTotal !== originalConfirmedTotal) {
    changes.push({
      label: "Confirmed total",
      from: moneyLabel(originalConfirmedTotal),
      to:
        nextConfirmedTotal === null || Number.isNaN(nextConfirmedTotal)
          ? "Not set"
          : moneyLabel(nextConfirmedTotal),
    });
  }
  if (courier !== (order.courier ?? "")) {
    changes.push({
      label: "Courier",
      from: textLabel(order.courier),
      to: textLabel(courier),
    });
  }
  if (trackingNumber !== (order.tracking_number ?? "")) {
    changes.push({
      label: "Tracking number",
      from: textLabel(order.tracking_number),
      to: textLabel(trackingNumber),
    });
  }
  if (trackingUrl !== (order.tracking_url ?? "")) {
    changes.push({
      label: "Tracking link",
      from: textLabel(order.tracking_url),
      to: textLabel(trackingUrl),
    });
  }
  if (adminNote !== (order.admin_note ?? "")) {
    changes.push({
      label: "Internal note",
      from: textLabel(order.admin_note),
      to: textLabel(adminNote),
    });
  }

  const warnings: string[] = [];
  if (status === "cancelled" && order.status !== "cancelled") {
    warnings.push(
      "This cancels the order immediately. A cancelled order is read-only — if the payment is marked paid, the only remaining action is to refund it."
    );
  }
  if (
    paymentStatus === "refunded" &&
    order.payment_status !== "refunded"
  ) {
    warnings.push(
      "This marks the payment as refunded. A refunded payment cannot be changed back."
    );
  }
  if (status === "delivered" && order.status !== "delivered") {
    warnings.push(
      "Marking the order delivered starts the 7-day return/replacement window and cannot be undone."
    );
  }
  if (
    status === "shipped" &&
    order.status !== "shipped" &&
    paymentStatus === "pending"
  ) {
    warnings.push("The order will be marked shipped while payment is still pending.");
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (locked) {
      setError("This cancelled order can no longer be updated.");
      return;
    }

    if (
      nextConfirmedTotal !== null &&
      (!Number.isFinite(nextConfirmedTotal) || nextConfirmedTotal < 0)
    ) {
      setError("Enter a valid confirmed total.");
      return;
    }

    if (status === "shipped") {
      if (!courier.trim()) {
        setError("Courier is required when the order is shipped.");
        return;
      }
      if (!trackingNumber.trim()) {
        setError("Tracking number is required when the order is shipped.");
        return;
      }
      if (!trackingUrl.trim()) {
        setError("Tracking link is required when the order is shipped.");
        return;
      }
      try {
        const parsed = new URL(trackingUrl.trim());
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          throw new Error("invalid protocol");
        }
      } catch {
        setError("Enter a valid tracking link starting with http:// or https://.");
        return;
      }
    }

    if (changes.length === 0) {
      setError("There are no changes to save.");
      return;
    }

    setConfirmOpen(true);
  }

  async function applyChanges() {
    setPending(true);
    setError(null);

    const result = await updateOrderAction(order.id, {
      status,
      payment_status: paymentStatus,
      confirmed_total: nextConfirmedTotal,
      courier,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
      admin_note: adminNote,
    });

    setPending(false);

    if (result.error) {
      setError(result.error);
      setConfirmOpen(false);
      toast.error(result.error);
      return;
    }

    toast.success("Order updated");
    setConfirmOpen(false);
    router.refresh();
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        {cancelled && (
          <div
            className={`rounded-xl border px-3.5 py-2.5 text-[11px] leading-relaxed ${
              refundOnly
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {refundOnly
              ? "This order is cancelled. Only the payment status can be changed, and only from Paid to Refunded."
              : "This order is cancelled and can no longer be updated."}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="order-status">Order status</Label>
            <Select
              id="order-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as OrderStatus)}
              disabled={cancelled}
            >
              {statusChoices.map((option) => {
                const selectable =
                  option === order.status || allowedNext.includes(option);

                return (
                  <option key={option} value={option} disabled={!selectable}>
                    {ORDER_STAGE_LABEL[option] ?? statusLabel(option)}
                    {selectable ? "" : " (locked)"}
                  </option>
                );
              })}
            </Select>
            <p className="mt-1.5 text-[10px] text-ink">
              {cancelled
                ? "Cancelled orders cannot be reopened."
                : allowedNext.length === 0
                  ? "This is a final status."
                  : `Next step: ${allowedNext.map(statusLabel).join(" or ")}`}
            </p>
            {!cancelled && (
              <p className="mt-1 text-[10px] text-navy/30">
                Pending → Confirmed → Packed → Shipped → Delivered. Later stages
                unlock as the order advances.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="payment-status">Payment</Label>
            <Select
              id="payment-status"
              value={paymentStatus}
              onChange={(event) =>
                setPaymentStatus(event.target.value as PaymentStatus)
              }
              disabled={locked}
            >
              {paymentOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            <p className="mt-1.5 text-[10px] text-ink">
              Payment only moves forward: pending → paid → refunded.
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="confirmed-total">Confirmed total (₹)</Label>
          <Input
            id="confirmed-total"
            type="number"
            min={0}
            step="0.01"
            value={confirmedTotal}
            onChange={(event) => setConfirmedTotal(event.target.value)}
            placeholder="Final amount confirmed on the call"
            disabled={cancelled}
          />
          <p className="mt-1.5 text-[10px] text-ink">
            Items subtotal is {formatINR(order.subtotal)}. Leave blank until the
            price including delivery is confirmed.
          </p>
        </div>

        {status === "shipped" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
                Shipping details
              </p>
              <span className="text-[10px] font-medium text-rose-600">
                All fields required
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="courier">Courier *</Label>
                <Input
                  id="courier"
                  value={courier}
                  onChange={(event) => setCourier(event.target.value)}
                  placeholder="e.g. India Post"
                  required
                  disabled={cancelled}
                />
              </div>
              <div>
                <Label htmlFor="tracking-number">Tracking number *</Label>
                <Input
                  id="tracking-number"
                  value={trackingNumber}
                  onChange={(event) => setTrackingNumber(event.target.value)}
                  required
                  disabled={cancelled}
                />
              </div>
              <div>
                <Label htmlFor="tracking-url">Tracking link *</Label>
                <Input
                  id="tracking-url"
                  value={trackingUrl}
                  onChange={(event) => setTrackingUrl(event.target.value)}
                  placeholder="https://"
                  required
                  disabled={cancelled}
                />
              </div>
            </div>
            <p className="text-[10px] text-ink">
              Customers see these details on their order page while the order is
              shipped or delivered.
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="admin-note">Internal note</Label>
          <Textarea
            id="admin-note"
            value={adminNote}
            onChange={(event) => setAdminNote(event.target.value)}
            maxLength={1000}
            placeholder="Only visible to the admin"
            className="min-h-20"
            disabled={cancelled}
          />
        </div>

        <Button
          type="submit"
          loading={pending}
          disabled={locked || changes.length === 0}
          className="w-full sm:w-auto"
        >
          Review order update
        </Button>
        {changes.length === 0 && !locked && (
          <p className="text-[10px] text-ink">
            Change a field to enable the update button.
          </p>
        )}
      </form>

      <Modal
        open={confirmOpen}
        onClose={() => (pending ? undefined : setConfirmOpen(false))}
        title="Confirm order update"
        description="Review every change before it is applied."
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
            >
              Go back
            </Button>
            <Button loading={pending} onClick={applyChanges}>
              Confirm update
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          {changes.map((change) => (
            <div
              key={change.label}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-blush/50 px-3.5 py-2.5 text-xs"
            >
              <span className="font-medium text-ink">{change.label}</span>
              <span className="flex items-center gap-1.5 font-medium text-navy">
                <span className="text-ink">{change.from}</span>
                <ArrowRight className="h-3.5 w-3.5 text-blue" />
                <span>{change.to}</span>
              </span>
            </div>
          ))}
        </div>

        {warnings.length > 0 && (
          <div className="mt-4 space-y-2">
            {warnings.map((warning) => (
              <div
                key={warning}
                className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[11px] leading-relaxed text-amber-800"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {warning}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
