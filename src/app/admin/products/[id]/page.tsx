import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";
import type { Category, Product } from "@/lib/types";

export const metadata: Metadata = { title: "Edit product" };

const PRODUCT_SELECT = `
  *,
  category:categories(id, name, slug),
  images:product_images(id, product_id, image_url, public_id, sort_order),
  options:product_options(id, product_id, pricing_type, label, price, sort_order, is_active)
`;

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name").order("name", { ascending: true }),
  ]);

  if (!product) notFound();

  return (
    <ProductForm
      categories={(categories ?? []) as Pick<Category, "id" | "name">[]}
      product={product as unknown as Product}
    />
  );
}
