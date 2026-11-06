"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addressSchema } from "@/lib/validators";
import type { ActionResult } from "@/lib/types";

type AddressInput = {
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  is_default?: boolean;
};

function revalidateAddresses() {
  revalidatePath("/account");
  revalidatePath("/checkout");
}

export async function createAddressAction(
  input: AddressInput
): Promise<ActionResult & { id?: string }> {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid address" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please sign in" };

  const { count } = await supabase
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= 5) {
    return { error: "You can save a maximum of 5 delivery addresses" };
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      user_id: user.id,
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      line1: parsed.data.line1,
      line2: parsed.data.line2 ?? "",
      city: parsed.data.city,
      state: parsed.data.state,
      pincode: parsed.data.pincode,
      landmark: parsed.data.landmark ?? "",
      is_default: parsed.data.is_default ?? false,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message || "Could not save address" };
  }

  revalidateAddresses();
  return { success: "Address saved", id: data.id };
}

export async function updateAddressAction(
  addressId: string,
  input: AddressInput
): Promise<ActionResult> {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid address" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please sign in" };

  const { error } = await supabase
    .from("addresses")
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      line1: parsed.data.line1,
      line2: parsed.data.line2 ?? "",
      city: parsed.data.city,
      state: parsed.data.state,
      pincode: parsed.data.pincode,
      landmark: parsed.data.landmark ?? "",
      is_default: parsed.data.is_default ?? false,
    })
    .eq("id", addressId)
    .eq("user_id", user.id);

  if (error) return { error: error.message || "Could not update address" };

  revalidateAddresses();
  return { success: "Address updated" };
}

export async function setDefaultAddressAction(
  addressId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please sign in" };

  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("user_id", user.id);

  if (error) return { error: "Could not set default address" };

  revalidateAddresses();
  return { success: "Default address updated" };
}

export async function deleteAddressAction(
  addressId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please sign in" };

  const { data: deleted } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", user.id)
    .select("is_default")
    .maybeSingle();

  if (deleted?.is_default) {
    const { data: remaining } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1);

    if (remaining && remaining[0]) {
      await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", remaining[0].id);
    }
  }

  revalidateAddresses();
  return { success: "Address deleted" };
}
