import { RETURN_WINDOW_DAYS } from "@/lib/config";
import type { Order, OrderRequest, OrderStatus } from "@/lib/types";

/** The happy-path stages every order moves through. */
export const ORDER_JOURNEY_STAGES: OrderStatus[] = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
];

export const ORDER_STAGE_LABEL: Record<string, string> = {
  pending: "Order placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export type OrderJourneyStage = {
  status: OrderStatus;
  label: string;
  state: "done" | "current" | "upcoming" | "cancelled";
  at: string | null;
  note: string | null;
};

/**
 * Builds the full order journey for the timeline: every happy-path stage is
 * shown, with completed, current and upcoming steps distinguished. Cancelled
 * orders keep the stages they reached and add a final cancelled step.
 */
export function buildOrderJourney(order: Order): OrderJourneyStage[] {
  const history = [...(order.order_status_history ?? order.history ?? [])].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const entryFor = (status: string) =>
    history.find((entry) => entry.status === status) ?? null;

  if (order.status === "cancelled") {
    const reached = history
      .map((entry) => ORDER_JOURNEY_STAGES.indexOf(entry.status))
      .filter((index) => index >= 0);
    const lastReached = reached.length > 0 ? Math.max(...reached) : -1;
    const cancelledEntry = entryFor("cancelled");

    return [
      ...ORDER_JOURNEY_STAGES.slice(0, lastReached + 1).map((status) => {
        const entry = entryFor(status);
        return {
          status,
          label: ORDER_STAGE_LABEL[status],
          state: "done" as const,
          at: entry?.created_at ?? null,
          note: entry?.note ?? null,
        };
      }),
      {
        status: "cancelled",
        label: ORDER_STAGE_LABEL.cancelled,
        state: "cancelled" as const,
        at: cancelledEntry?.created_at ?? null,
        note:
          cancelledEntry?.note ??
          order.cancellation_reason ??
          "This order was cancelled.",
      },
    ];
  }

  const currentIndex = ORDER_JOURNEY_STAGES.indexOf(order.status);

  return ORDER_JOURNEY_STAGES.map((status, index) => {
    const entry = entryFor(status);
    return {
      status,
      label: ORDER_STAGE_LABEL[status],
      state:
        index < currentIndex
          ? ("done" as const)
          : index === currentIndex
            ? ("current" as const)
            : ("upcoming" as const),
      at: entry?.created_at ?? null,
      note: entry?.note ?? null,
    };
  });
}

export function isWithinReturnWindow(order: Order) {
  if (order.status !== "delivered" || !order.delivered_at) return false;
  const delivered = new Date(order.delivered_at).getTime();
  if (Number.isNaN(delivered)) return false;
  return Date.now() <= delivered + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export function returnWindowEnds(order: Order) {
  if (!order.delivered_at) return null;
  const delivered = new Date(order.delivered_at).getTime();
  if (Number.isNaN(delivered)) return null;
  return new Date(delivered + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

export function canRequestCancellation(order: Order) {
  // After confirmation the customer can still request cancellation, including
  // while the order is already shipped.
  return ["confirmed", "packed", "shipped"].includes(order.status);
}

export function hasActiveReturnOrReplace(
  requests: Pick<OrderRequest, "type" | "status">[]
) {
  return requests.some(
    (request) =>
      (request.type === "return" || request.type === "replace") &&
      ["pending", "approved", "completed"].includes(request.status)
  );
}

export function hasCompletedReturnOrReplace(
  requests: Pick<OrderRequest, "type" | "status">[]
) {
  return requests.some(
    (request) =>
      (request.type === "return" || request.type === "replace") &&
      request.status === "completed"
  );
}

export function orderAddressLines(order: Order) {
  const address = order.address_snapshot ?? {};
  const line1 = String(address.line1 ?? "");
  const line2 = String(address.line2 ?? "");
  const city = String(address.city ?? "");
  const state = String(address.state ?? "");
  const pincode = String(address.pincode ?? "");
  const landmark = String(address.landmark ?? "");

  return {
    name: String(address.full_name ?? order.customer_name ?? ""),
    phone: String(address.phone ?? order.customer_phone ?? ""),
    line1,
    line2,
    city,
    state,
    pincode,
    landmark,
  };
}
