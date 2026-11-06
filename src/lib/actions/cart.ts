"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CartLine, PricingType } from "@/lib/types";

type CartActionResult = {
  error?: string;
  success?: string;
  count?: number;
};

function revalidateCart() {
  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/", "layout");
}

export async function getCartLines(): Promise<CartLine[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!cart) return [];

  const { data: items } = await supabase
    .from("cart_items")
    .select("id, option_id, product_id, quantity, created_at")
    .eq("cart_id", cart.id)
    .order("created_at", { ascending: true });

  if (!items || items.length === 0) return [];

  const optionIds = items.map((item) => item.option_id);
  const { data: options } = await supabase
    .from("product_options")
    .select("id, product_id, pricing_type, label, price, is_active")
    .in("id", optionIds)
    .eq("is_active", true);

  const productIds = Array.from(
    new Set((options ?? []).map((option) => option.product_id))
  );

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, cover_image, is_active")
    .in("id", productIds)
    .eq("is_active", true);

  const optionMap = new Map((options ?? []).map((option) => [option.id, option]));
  const productMap = new Map((products ?? []).map((product) => [product.id, product]));

  const lines: CartLine[] = [];

  for (const item of items) {
    const option = optionMap.get(item.option_id);
    const product = option ? productMap.get(option.product_id) : null;
    if (!option || !product) continue;

    lines.push({
      id: item.id,
      optionId: option.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.cover_image,
      pricingType: option.pricing_type as PricingType,
      label: option.label,
      price: Number(option.price),
      quantity: item.quantity,
    });
  }

  return lines;
}

async function ensureCartId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();

  if (error) return null;
  return created.id;
}

async function addLine(
  supabase: Awaited<ReturnType<typeof createClient>>,
  cartId: string,
  optionId: string,
  quantity: number
) {
  const { data: option } = await supabase
    .from("product_options")
    .select("product_id")
    .eq("id", optionId)
    .maybeSingle();

  if (!option) return false;

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("option_id", optionId)
    .maybeSingle();

  if (existing) {
    const nextQuantity = Math.min(99, existing.quantity + quantity);
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: nextQuantity })
      .eq("id", existing.id);
    return !error;
  }

  const { error } = await supabase.from("cart_items").insert({
    cart_id: cartId,
    option_id: optionId,
    product_id: option.product_id,
    quantity,
  });

  return !error;
}

export async function addToCartAction(
  optionId: string,
  quantity = 1
): Promise<CartActionResult> {
  if (!optionId || Number.isNaN(quantity)) {
    return { error: "Please choose a valid option" };
  }

  const qty = Math.max(1, Math.min(99, Math.floor(quantity)));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please sign in to add items to your cart" };

  const { data: option } = await supabase
    .from("product_options")
    .select("id, product_id, is_active")
    .eq("id", optionId)
    .maybeSingle();

  if (!option || !option.is_active) {
    return { error: "This option is no longer available" };
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, is_active")
    .eq("id", option.product_id)
    .maybeSingle();

  if (!product || !product.is_active) {
    return { error: "This product is no longer available" };
  }

  const cartId = await ensureCartId(supabase, user.id);
  if (!cartId) return { error: "Could not update your cart. Please try again." };

  const ok = await addLine(supabase, cartId, optionId, qty);
  if (!ok) return { error: "Could not add this item. Please try again." };

  revalidateCart();
  return { success: "Added to cart" };
}

export async function mergeGuestCartAction(
  lines: { optionId: string; quantity: number }[]
): Promise<CartActionResult> {
  if (!Array.isArray(lines) || lines.length === 0) return { success: "Cart merged" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please sign in first" };

  const cartId = await ensureCartId(supabase, user.id);
  if (!cartId) return { error: "Could not merge your cart" };

  let merged = 0;
  for (const line of lines.slice(0, 30)) {
    const optionId = String(line.optionId ?? "");
    const quantity = Math.max(1, Math.min(99, Number(line.quantity) || 1));
    if (!optionId) continue;

    const { data: option } = await supabase
      .from("product_options")
      .select("id")
      .eq("id", optionId)
      .eq("is_active", true)
      .maybeSingle();

    if (!option) continue;

    const ok = await addLine(supabase, cartId, optionId, quantity);
    if (ok) merged += 1;
  }

  revalidateCart();
  return { success: `${merged} item${merged === 1 ? "" : "s"} added to your cart`, count: merged };
}

export async function updateCartQuantityAction(
  itemId: string,
  quantity: number
): Promise<CartActionResult> {
  const qty = Math.max(1, Math.min(99, Math.floor(quantity)));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please sign in" };

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!cart) return { error: "Cart not found" };

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity: qty })
    .eq("id", itemId)
    .eq("cart_id", cart.id);

  if (error) return { error: "Could not update quantity" };

  revalidateCart();
  return { success: "Cart updated" };
}

export async function removeCartItemAction(
  itemId: string
): Promise<CartActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please sign in" };

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!cart) return { error: "Cart not found" };

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", itemId)
    .eq("cart_id", cart.id);

  if (error) return { error: "Could not remove item" };

  revalidateCart();
  return { success: "Item removed" };
}
