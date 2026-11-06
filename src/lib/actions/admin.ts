"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { destroyCloudinaryImages } from "@/lib/cloudinary";
import {
  categorySchema,
  orderUpdateSchema,
  productSchema,
} from "@/lib/validators";
import {
  isPaymentTransitionAllowed,
  isStatusTransitionAllowed,
} from "@/lib/order-rules";
import { slugify } from "@/lib/utils";
import type {
  ActionResult,
  OrderStatus,
  PaymentStatus,
  RequestStatus,
} from "@/lib/types";

async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  name: string,
  table: "products" | "categories"
) {
  const base = slugify(name) || "item";
  let slug = base;
  let counter = 1;

  while (true) {
    const { data } = await supabase
      .from(table)
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!data) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
}

/* ----------------------------- CATEGORIES ----------------------------- */

type CategoryInput = {
  name: string;
  description?: string;
  image_url?: string;
  image_public_id?: string | null;
  is_active?: boolean;
  sort_order?: number;
};

export async function createCategoryAction(
  input: CategoryInput
): Promise<ActionResult & { id?: string }> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid category" };
  }

  const supabase = await createClient();
  const slug = await uniqueSlug(supabase, parsed.data.name, "categories");

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: parsed.data.name,
      slug,
      description: parsed.data.description ?? "",
      image_url: parsed.data.image_url || null,
      image_public_id: parsed.data.image_public_id || null,
      is_active: parsed.data.is_active ?? true,
      sort_order: parsed.data.sort_order ?? 0,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/shop");
  return { success: "Category created", id: data.id };
}

export async function updateCategoryAction(
  categoryId: string,
  input: CategoryInput
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid category" };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("categories")
    .select("image_public_id")
    .eq("id", categoryId)
    .maybeSingle();

  const nextPublicId = parsed.data.image_public_id || null;

  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? "",
      image_url: parsed.data.image_url || null,
      image_public_id: nextPublicId,
      is_active: parsed.data.is_active ?? true,
      sort_order: parsed.data.sort_order ?? 0,
    })
    .eq("id", categoryId);

  if (error) return { error: error.message };

  if (existing?.image_public_id && existing.image_public_id !== nextPublicId) {
    await destroyCloudinaryImages([existing.image_public_id]);
  }

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/shop");
  return { success: "Category updated" };
}

export async function deleteCategoryAction(
  categoryId: string
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("image_public_id")
    .eq("id", categoryId)
    .maybeSingle();

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) return { error: error.message };

  await destroyCloudinaryImages([category?.image_public_id]);

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/shop");
  return { success: "Category deleted" };
}

/* ------------------------------ PRODUCTS ------------------------------ */

type ProductInput = {
  id?: string;
  name: string;
  description: string;
  category_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  images: { image_url: string; public_id?: string | null }[];
  options: {
    id?: string;
    pricing_type: "inch" | "pieces" | "size";
    label: string;
    price: number;
  }[];
};

export async function saveProductAction(
  input: ProductInput
): Promise<ActionResult & { id?: string }> {
  await requireAdmin();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid product" };
  }

  if (!parsed.data.category_id) {
    return { error: "Please choose a category" };
  }

  const supabase = await createClient();
  const values = {
    name: parsed.data.name,
    description: parsed.data.description ?? "",
    category_id: parsed.data.category_id,
    is_active: parsed.data.is_active ?? true,
    is_featured: parsed.data.is_featured ?? false,
    cover_image: parsed.data.images[0]?.image_url ?? null,
  };

  let productId = input.id;

  if (!productId) {
    const slug = await uniqueSlug(supabase, parsed.data.name, "products");
    const { data, error } = await supabase
      .from("products")
      .insert({ ...values, slug })
      .select("id")
      .single();

    if (error) return { error: error.message };
    productId = data.id;
  } else {
    const { error } = await supabase
      .from("products")
      .update(values)
      .eq("id", productId);

    if (error) return { error: error.message };
  }

  // Sync images (Cloudinary files that were removed are deleted too)
  const { data: existingImages } = await supabase
    .from("product_images")
    .select("id, image_url, public_id")
    .eq("product_id", productId);

  const keepUrls = new Set(parsed.data.images.map((image) => image.image_url));
  const removed = (existingImages ?? []).filter(
    (image) => !keepUrls.has(image.image_url)
  );

  if (removed.length > 0) {
    await destroyCloudinaryImages(removed.map((image) => image.public_id));
  }

  await supabase.from("product_images").delete().eq("product_id", productId);

  const { error: imageError } = await supabase.from("product_images").insert(
    parsed.data.images.map((image, index) => ({
      product_id: productId,
      image_url: image.image_url,
      public_id: image.public_id ?? null,
      sort_order: index,
    }))
  );

  if (imageError) return { error: imageError.message };

  // Sync options while preserving IDs. cart_items references option_id with
  // ON DELETE CASCADE, so deleting and re-inserting every option would silently
  // wipe customers' carts whenever the admin saved a product.
  const { data: existingOptions } = await supabase
    .from("product_options")
    .select("id")
    .eq("product_id", productId);

  const existingIds = new Set((existingOptions ?? []).map((option) => option.id));
  const keptIds = new Set<string>();

  for (const [index, option] of parsed.data.options.entries()) {
    const values = {
      product_id: productId,
      pricing_type: option.pricing_type,
      label: option.label,
      price: option.price,
      sort_order: index,
      is_active: true,
    };

    if (option.id && existingIds.has(option.id)) {
      if (keptIds.has(option.id)) {
        return { error: "Duplicate option found. Please refresh and try again." };
      }

      const { error } = await supabase
        .from("product_options")
        .update(values)
        .eq("id", option.id)
        .eq("product_id", productId);

      if (error) return { error: error.message };
      keptIds.add(option.id);
    } else {
      const { error } = await supabase
        .from("product_options")
        .insert(values);

      if (error) return { error: error.message };
    }
  }

  const removedOptionIds = [...existingIds].filter((id) => !keptIds.has(id));
  if (removedOptionIds.length > 0) {
    const { error } = await supabase
      .from("product_options")
      .delete()
      .in("id", removedOptionIds);

    if (error) return { error: error.message };
  }

  const { data: product } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .maybeSingle();

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin/products");
  if (product?.slug) revalidatePath(`/product/${product.slug}`);

  return {
    success: input.id ? "Product updated" : "Product created",
    id: productId,
  };
}

export async function deleteProductAction(
  productId: string
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: images } = await supabase
    .from("product_images")
    .select("public_id")
    .eq("product_id", productId);

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) return { error: error.message };

  await destroyCloudinaryImages((images ?? []).map((image) => image.public_id));

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin/products");
  return { success: "Product deleted" };
}

/* ------------------------------- ORDERS ------------------------------- */

type OrderUpdateInput = {
  status: OrderStatus;
  payment_status: "pending" | "paid" | "refunded";
  confirmed_total: number | null;
  courier?: string;
  tracking_number?: string;
  tracking_url?: string;
  admin_note?: string;
};

export async function updateOrderAction(
  orderId: string,
  input: OrderUpdateInput
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = orderUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid order details" };
  }

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, status, payment_status, confirmed_total, courier, tracking_number, tracking_url, admin_note, cancellation_reason, delivered_at"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return { error: "Order not found" };

  const currentStatus = order.status as OrderStatus;
  const nextStatus = parsed.data.status as OrderStatus;
  const currentPayment = order.payment_status as PaymentStatus;
  const nextPayment = parsed.data.payment_status as PaymentStatus;

  if (!isStatusTransitionAllowed(currentStatus, nextStatus)) {
    return {
      error: `An order marked "${currentStatus}" cannot be changed to "${nextStatus}"`,
    };
  }

  if (!isPaymentTransitionAllowed(currentPayment, nextPayment)) {
    return {
      error: `Payment cannot be changed from "${currentPayment}" to "${nextPayment}"`,
    };
  }

  const nextCourier = parsed.data.courier || null;
  const nextTrackingNumber = parsed.data.tracking_number || null;
  const nextTrackingUrl = parsed.data.tracking_url || null;
  const nextAdminNote = parsed.data.admin_note || null;

  if (nextStatus === "shipped") {
    if (!nextCourier) {
      return { error: "Courier is required before an order can be marked shipped." };
    }
    if (!nextTrackingNumber) {
      return {
        error: "Tracking number is required before an order can be marked shipped.",
      };
    }
    if (!nextTrackingUrl) {
      return {
        error: "Tracking link is required before an order can be marked shipped.",
      };
    }
    let protocol = "";
    try {
      protocol = new URL(nextTrackingUrl).protocol;
    } catch {
      protocol = "";
    }
    if (protocol !== "http:" && protocol !== "https:") {
      return {
        error:
          "Tracking link must be a valid URL starting with http:// or https://.",
      };
    }
  }
  const nextDeliveredAt =
    nextStatus === "delivered"
      ? order.delivered_at ?? new Date().toISOString()
      : order.delivered_at;

  if (currentStatus === "cancelled") {
    // Cancelled orders are frozen. A paid order may only be moved to refunded;
    // every other field must remain unchanged.
    const otherFieldsChanged =
      nextConfirmedTotalChanged(parsed.data.confirmed_total, order.confirmed_total) ||
      nextCourier !== order.courier ||
      nextTrackingNumber !== order.tracking_number ||
      nextTrackingUrl !== order.tracking_url ||
      nextAdminNote !== order.admin_note ||
      nextDeliveredAt !== order.delivered_at;

    if (otherFieldsChanged) {
      return {
        error:
          "This order is cancelled. Only the payment status can be updated, and only from paid to refunded.",
      };
    }

    if (currentPayment !== "paid") {
      return { error: "This cancelled order is read-only." };
    }

    if (nextPayment !== "refunded") {
      return {
        error:
          "This cancelled order can only be updated by marking the payment as refunded.",
      };
    }
  }

  const cancellationReason =
    nextStatus === "cancelled" && currentStatus !== "cancelled"
      ? order.cancellation_reason ?? "Cancelled by admin"
      : order.cancellation_reason;

  const { error } = await supabase
    .from("orders")
    .update({
      status: nextStatus,
      payment_status: nextPayment,
      confirmed_total: parsed.data.confirmed_total,
      courier: nextCourier,
      tracking_number: nextTrackingNumber,
      tracking_url: nextTrackingUrl,
      admin_note: nextAdminNote,
      cancellation_reason: cancellationReason,
      delivered_at: nextDeliveredAt,
    })
    .eq("id", orderId);

  if (error) return { error: error.message };

  // Keep open cancellation requests in sync with manual admin changes.
  if (nextStatus === "cancelled" && currentStatus !== "cancelled") {
    const { error: requestError } = await supabase
      .from("order_requests")
      .update({
        status: "approved",
        admin_note: "Order cancelled by admin",
        resolved_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .eq("type", "cancel")
      .eq("status", "pending");

    if (requestError) return { error: requestError.message };
  }

  if (nextStatus === "delivered" && currentStatus !== "delivered") {
    const { error: requestError } = await supabase
      .from("order_requests")
      .update({
        status: "rejected",
        admin_note:
          "Order was delivered before the cancellation request could be approved.",
        resolved_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .eq("type", "cancel")
      .eq("status", "pending");

    if (requestError) return { error: requestError.message };
  }

  const historyNotes: string[] = [];
  if (nextStatus !== currentStatus) {
    historyNotes.push(`Status: ${currentStatus} → ${nextStatus}`);
  }
  if (nextPayment !== currentPayment) {
    historyNotes.push(`Payment: ${currentPayment} → ${nextPayment}`);
  }

  if (historyNotes.length > 0) {
    await supabase.from("order_status_history").insert({
      order_id: orderId,
      status: nextStatus,
      note: historyNotes.join(" · "),
      created_by: admin.id,
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/requests");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return { success: "Order updated" };
}

function nextConfirmedTotalChanged(
  next: number | null,
  current: number | string | null
) {
  if (next === null && current === null) return false;
  if (next === null || current === null) return true;
  return Number(next) !== Number(current);
}

export async function resolveRequestAction(
  requestId: string,
  status: Extract<RequestStatus, "approved" | "rejected" | "completed">,
  adminNote: string
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const note = adminNote.trim();

  if (status === "rejected" && !note) {
    return {
      error: "Please write a reason for rejecting this request.",
    };
  }

  const supabase = await createClient();

  const { data: request } = await supabase
    .from("order_requests")
    .select("id, order_id, type, status, reason")
    .eq("id", requestId)
    .maybeSingle();

  if (!request) return { error: "Request not found" };

  const current = request.status as RequestStatus;

  if (!["pending", "approved"].includes(current)) {
    return { error: "This request has already been resolved" };
  }

  if (current === "pending" && status === "completed") {
    return { error: "Approve the request before marking it completed" };
  }

  if (current === "approved" && status !== "completed") {
    return { error: "An approved request can only be marked as completed" };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, payment_status, cancellation_reason")
    .eq("id", request.order_id)
    .maybeSingle();

  if (!order) return { error: "Order not found" };

  if (request.type === "cancel" && status === "approved") {
    if (order.status === "delivered") {
      return {
        error:
          "This order has already been delivered, so the cancellation request can only be rejected.",
      };
    }

    if (
      !["pending", "confirmed", "packed", "shipped"].includes(order.status)
    ) {
      return {
        error:
          "This order can no longer be cancelled. Reject the request with a reason instead.",
      };
    }
  }

  if (request.type !== "cancel" && status === "approved") {
    if (order.status !== "delivered") {
      return {
        error: "Return and replacement requests can only be approved after delivery.",
      };
    }
  }

  if (request.type === "cancel" && status === "approved" && order.status !== "cancelled") {
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancellation_reason: request.reason,
      })
      .eq("id", request.order_id);

    if (orderError) return { error: orderError.message };

    await supabase.from("order_status_history").insert({
      order_id: request.order_id,
      status: "cancelled",
      note: `Cancellation request approved — ${request.reason}`,
      created_by: admin.id,
    });
  }

  const { error } = await supabase
    .from("order_requests")
    .update({
      status,
      admin_note: note || null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) return { error: error.message };

  revalidatePath("/admin/requests");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${request.order_id}`);
  revalidatePath("/orders");
  revalidatePath(`/orders/${request.order_id}`);
  return { success: `Request ${status}` };
}
