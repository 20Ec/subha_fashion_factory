"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

export async function placeOrderAction(
  addressId: string,
  note: string
): Promise<ActionResult & { orderId?: string }> {
  if (!addressId) return { error: "Please choose a delivery address" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please sign in to place your order" };

  const { data, error } = await supabase.rpc("place_order", {
    p_address_id: addressId,
    p_note: note?.slice(0, 1000) ?? null,
  });

  if (error) {
    return { error: error.message || "Could not place your order. Please try again." };
  }

  revalidatePath("/orders");
  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/", "layout");

  return { success: "Order placed successfully", orderId: data as string };
}

export async function cancelOrderAction(
  orderId: string,
  reason: string
): Promise<ActionResult> {
  if (!reason.trim()) return { error: "Please select a reason for cancelling" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please sign in" };

  const { error } = await supabase.rpc("cancel_order", {
    p_order_id: orderId,
    p_reason: reason.trim().slice(0, 200),
  });

  if (error) {
    return { error: error.message || "Could not cancel the order" };
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: "Order cancelled" };
}

export async function submitOrderRequestAction(
  orderId: string,
  type: "return" | "replace" | "cancel",
  reason: string,
  description: string,
  orderItemId?: string | null
): Promise<ActionResult> {
  if (!reason.trim()) return { error: "Please select a reason" };

  if (description.trim().length > 1000) {
    return { error: "Please keep the description under 1000 characters" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please sign in" };

  const { error } = await supabase.rpc("request_order_action", {
    p_order_id: orderId,
    p_type: type,
    p_reason: reason.slice(0, 200),
    p_description: description.slice(0, 1000),
    p_order_item_id: orderItemId || null,
  });

  if (error) {
    return { error: error.message || "Could not submit your request" };
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/admin/requests");
  return {
    success:
      type === "cancel"
        ? "Cancellation request submitted"
        : `${type === "return" ? "Return" : "Replacement"} request submitted`,
  };
}
