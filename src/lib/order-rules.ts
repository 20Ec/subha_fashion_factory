import { ORDER_STATUS_FLOW, PAYMENT_STATUS_FLOW } from "@/lib/config";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";

export function allowedStatusTransitions(current: OrderStatus): OrderStatus[] {
  return (ORDER_STATUS_FLOW[current] ?? []) as OrderStatus[];
}

/** The current status plus every status the order may move to. */
export function statusOptionsFor(current: OrderStatus): OrderStatus[] {
  return Array.from(new Set([current, ...allowedStatusTransitions(current)]));
}

export function isStatusTransitionAllowed(
  current: OrderStatus,
  next: OrderStatus
) {
  if (current === next) return true;
  return allowedStatusTransitions(current).includes(next);
}

export function allowedPaymentTransitions(
  current: PaymentStatus
): PaymentStatus[] {
  return (PAYMENT_STATUS_FLOW[current] ?? []) as PaymentStatus[];
}

/** The current payment status plus every status it may move to. */
export function paymentOptionsFor(current: PaymentStatus): PaymentStatus[] {
  return Array.from(
    new Set<PaymentStatus>([current, ...allowedPaymentTransitions(current)])
  );
}

export function isPaymentTransitionAllowed(
  current: PaymentStatus,
  next: PaymentStatus
) {
  if (current === next) return true;
  return allowedPaymentTransitions(current).includes(next);
}

/**
 * A cancelled order is read-only. The only exception is a paid order, where
 * the payment may still be marked as refunded.
 */
export function canUpdateOrder(
  order: Pick<Order, "status" | "payment_status">
) {
  if (order.status !== "cancelled") return true;
  return order.payment_status === "paid";
}

export function isCancelledReadOnly(
  order: Pick<Order, "status" | "payment_status">
) {
  return order.status === "cancelled" && order.payment_status !== "paid";
}

export const REQUEST_TYPE_LABEL: Record<string, string> = {
  return: "Return",
  replace: "Replacement",
  cancel: "Cancellation",
};

export function isReturnOrReplace(type: string) {
  return type === "return" || type === "replace";
}
