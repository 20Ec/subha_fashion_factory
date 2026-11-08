import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import { PRICING_TYPE_LABEL } from "@/lib/config";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { FlowerMark } from "@/components/ui/logo";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { AutoFilterForm } from "@/components/admin/auto-filter-form";
import { cleanQuery, firstValue } from "@/lib/search";
import type { Product } from "@/lib/types";

export const metadata: Metadata = { title: "Products" };

const PER_PAGE = 20;

type Row = Pick<
  Product,
  "id" | "name" | "slug" | "cover_image" | "min_price" | "is_active" | "is_featured"
> & {
  category: { name: string } | null;
  images: { id: string; image_url: string }[];
  options: { pricing_type: string; is_active: boolean }[];
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    page?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const rawQuery = (firstValue(params.q) ?? "").trim();
  const q = cleanQuery(params.q);
  const status = firstValue(params.status) ?? "all";
  const page = Math.max(1, Number(firstValue(params.page) ?? "1") || 1);

  const supabase = await createClient();
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  let query = supabase
    .from("products")
    .select(
      "id, name, slug, cover_image, min_price, is_active, is_featured, category:categories(name), images:product_images(id, image_url), options:product_options(pricing_type, is_active)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) query = query.ilike("name", `%${q}%`);
  if (status === "active") query = query.eq("is_active", true);
  if (status === "hidden") query = query.eq("is_active", false);
  if (status === "featured") query = query.eq("is_featured", true);

  const { data, count, error } = await query;
  const products = (data ?? []) as unknown as Row[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  function href(targetPage: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status !== "all") sp.set("status", status);
    if (targetPage > 1) sp.set("page", String(targetPage));
    const suffix = sp.toString();
    return suffix ? `/admin/products?${suffix}` : "/admin/products";
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deep-rose">
            Catalog
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Products
          </h1>
          <p className="mt-1 text-sm text-ink">
            {total} {total === 1 ? "product" : "products"} in your catalog.
          </p>
        </div>
        <Link href="/admin/products/new" className={buttonClass({ size: "sm" })}>
          <Plus className="h-4 w-4" />
          Add product
        </Link>
      </div>

      <AutoFilterForm className="mt-5 flex flex-col gap-2 rounded-2xl border border-line bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/30" />
          <Input
            name="q"
            defaultValue={rawQuery}
            placeholder="Search products by name"
            aria-label="Search products"
            className="h-10 border-transparent bg-blush pl-10 focus:bg-white"
          />
        </div>
        <Select
          name="status"
          defaultValue={status}
          aria-label="Filter by status"
          className="h-10 border-transparent bg-blush text-xs sm:w-44 focus:bg-white"
        >
          <option value="all">All products</option>
          <option value="active">Active only</option>
          <option value="hidden">Hidden only</option>
          <option value="featured">Featured only</option>
        </Select>
        <button
          type="submit"
          className={buttonClass({ variant: "secondary", size: "sm", className: "h-10" })}
        >
          Apply
        </button>
        {(rawQuery || status !== "all") && (
          <Link
            href="/admin/products"
            className={buttonClass({ variant: "ghost", size: "sm", className: "h-10" })}
          >
            Clear
          </Link>
        )}
      </AutoFilterForm>

      {error && (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
          {error.message}
        </p>
      )}

      {products.length === 0 ? (
        <EmptyState
          className="mt-6 bg-white"
          title={q || status !== "all" ? "No matching products" : "No products yet"}
          description={
            q || status !== "all"
              ? "Try clearing the search or choosing a different status."
              : "Add your first arrangement to start selling."
          }
        >
          <Link href="/admin/products/new" className={buttonClass({ size: "sm" })}>
            <Plus className="h-4 w-4" />
            Add product
          </Link>
        </EmptyState>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-blush/60 text-[10px] uppercase tracking-wider text-ink">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-3 py-3 font-semibold">Category</th>
                  <th className="px-3 py-3 font-semibold">Pricing</th>
                  <th className="px-3 py-3 font-semibold">From</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {products.map((product) => {
                  const types = Array.from(
                    new Set(
                      (product.options ?? [])
                        .filter((option) => option.is_active)
                        .map((option) => option.pricing_type)
                    )
                  );
                  const image =
                    product.cover_image ?? product.images?.[0]?.image_url ?? null;

                  return (
                    <tr key={product.id} className="hover:bg-blush/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-blush">
                            {image ? (
                              <Image
                                src={image}
                                alt={product.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <span className="grid h-full place-items-center text-deep-rose">
                                <FlowerMark className="h-4 w-4" />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[240px] truncate text-xs font-semibold">
                              {product.name}
                            </p>
                            <p className="mt-0.5 max-w-[240px] truncate text-[10px] text-ink">
                              /{product.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-ink">
                        {product.category?.name ?? "—"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {types.length === 0 ? (
                            <span className="text-[10px] text-navy/30">None</span>
                          ) : (
                            types.map((type) => (
                              <span
                                key={type}
                                className="rounded-full bg-pink-soft px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-ink"
                              >
                                {PRICING_TYPE_LABEL[type] ?? type}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs font-medium">
                        {formatINR(product.min_price)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge
                            status={product.is_active ? "delivered" : "cancelled"}
                            label={product.is_active ? "Active" : "Hidden"}
                          />
                          {product.is_featured && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-medium text-amber-700">
                              Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className={buttonClass({
                              variant: "ghost",
                              size: "sm",
                              className: "px-2.5",
                            })}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                          <DeleteProductButton
                            productId={product.id}
                            productName={product.name}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-ink">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={href(page - 1)}
                className={buttonClass({ variant: "outline", size: "sm" })}
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={href(page + 1)}
                className={buttonClass({ variant: "outline", size: "sm" })}
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
