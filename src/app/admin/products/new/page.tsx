import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";
import type { Category } from "@/lib/types";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <ProductForm
      categories={(data ?? []) as Pick<Category, "id" | "name">[]}
    />
  );
}
