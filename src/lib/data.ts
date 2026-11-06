import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";

const PRODUCT_SELECT = `
  *,
  category:categories(id, name, slug),
  images:product_images(id, product_id, image_url, public_id, sort_order),
  options:product_options(id, product_id, pricing_type, label, price, sort_order, is_active)
`;

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return (data ?? []) as Category[];
}

type ProductQuery = {
  q?: string;
  categorySlug?: string;
  pricingType?: string;
  sort?: string;
  page?: number;
  perPage?: number;
};

export async function getProducts({
  q,
  categorySlug,
  pricingType,
  sort = "newest",
  page = 1,
  perPage = 12,
}: ProductQuery = {}): Promise<{ products: Product[]; count: number }> {
  const supabase = await createClient();

  let categoryId: string | null = null;
  if (categorySlug) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .eq("is_active", true)
      .maybeSingle();
    categoryId = category?.id ?? null;
    if (!categoryId) return { products: [], count: 0 };
  }

  let productIds: string[] | null = null;
  if (pricingType && ["inch", "pieces", "size"].includes(pricingType)) {
    const { data: rows } = await supabase
      .from("product_options")
      .select("product_id")
      .eq("pricing_type", pricingType)
      .eq("is_active", true);
    productIds = Array.from(new Set((rows ?? []).map((row) => row.product_id)));
    if (productIds.length === 0) return { products: [], count: 0 };
  }

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .eq("is_active", true);

  if (q) query = query.ilike("name", `%${q}%`);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (productIds) query = query.in("id", productIds);

  switch (sort) {
    case "price-low":
      query = query.order("min_price", { ascending: true });
      break;
    case "price-high":
      query = query.order("min_price", { ascending: false });
      break;
    case "name":
      query = query.order("name", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error("getProducts", error.message);
    return { products: [], count: 0 };
  }

  return {
    products: (data ?? []) as unknown as Product[],
    count: count ?? 0,
  };
}

export async function getHomeProducts(limit = 8): Promise<Product[]> {
  const supabase = await createClient();

  const { data: featured } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (featured && featured.length > 0) {
    return featured as unknown as Product[];
  }

  const { data: latest } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (latest ?? []) as unknown as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  return (data as unknown as Product) ?? null;
}

export async function getRelatedProducts(
  categoryId: string | null,
  excludeId: string,
  limit = 4
): Promise<Product[]> {
  if (!categoryId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .eq("category_id", categoryId)
    .neq("id", excludeId)
    .limit(limit);

  return (data ?? []) as unknown as Product[];
}

export function sortedImages(product: Product) {
  return [...(product.images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
}

export function sortedOptions(product: Product) {
  return [...(product.options ?? [])]
    .filter((option) => option.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function groupOptionsByType(product: Product) {
  const groups: Record<string, Product["options"]> = {};
  for (const option of sortedOptions(product)) {
    groups[option.pricing_type] = groups[option.pricing_type] ?? [];
    groups[option.pricing_type].push(option);
  }
  return groups;
}
