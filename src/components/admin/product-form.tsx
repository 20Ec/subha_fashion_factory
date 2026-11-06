"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, GripVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveProductAction } from "@/lib/actions/admin";
import { PRICING_TYPES } from "@/lib/config";
import { ImageUploader, type UploadedImage } from "@/components/admin/image-uploader";
import { Button, buttonClass } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { Category, PricingType, Product } from "@/lib/types";

type OptionRow = {
  key: string;
  id?: string;
  pricing_type: PricingType;
  label: string;
  price: string;
};

type FormValues = {
  name: string;
  description: string;
  category_id: string;
  is_active: boolean;
  is_featured: boolean;
  images: UploadedImage[];
  options: OptionRow[];
};

let rowCounter = 0;
function newRow(pricing_type: PricingType = "size", label = "", price = ""): OptionRow {
  rowCounter += 1;
  return { key: `row-${Date.now()}-${rowCounter}`, pricing_type, label, price };
}

export function ProductForm({
  categories,
  product,
}: {
  categories: Pick<Category, "id" | "name">[];
  product?: Product;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => {
    const initialOptions = [...(product?.options ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((option) => ({
        key: option.id,
        id: option.id,
        pricing_type: option.pricing_type,
        label: option.label,
        price: String(option.price),
      }));

    return {
      name: product?.name ?? "",
      description: product?.description ?? "",
      category_id: product?.category_id ?? "",
      is_active: product?.is_active ?? true,
      is_featured: product?.is_featured ?? false,
      images: [...(product?.images ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((image) => ({
          image_url: image.image_url,
          public_id: image.public_id,
        })),
      options:
        initialOptions.length > 0 ? initialOptions : [newRow("size")],
    };
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  function updateOption(key: string, patch: Partial<OptionRow>) {
    update(
      "options",
      values.options.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!values.category_id) {
      setError("Please choose a category.");
      return;
    }

    const options = values.options
      .map((row) => ({
        id: row.id,
        pricing_type: row.pricing_type,
        label: row.label.trim(),
        price: Number(row.price),
      }))
      .filter((row) => row.label.length > 0);

    if (options.length === 0) {
      setError("Add at least one price option.");
      return;
    }

    if (options.some((row) => !Number.isFinite(row.price) || row.price < 0)) {
      setError("Every option needs a valid price.");
      return;
    }

    const duplicates = new Set<string>();
    for (const option of options) {
      const key = `${option.pricing_type}:${option.label.toLowerCase()}`;
      if (duplicates.has(key)) {
        setError(
          `Duplicate option "${option.label}" for ${option.pricing_type}. Labels must be unique per pricing type.`
        );
        return;
      }
      duplicates.add(key);
    }

    setPending(true);
    const result = await saveProductAction({
      id: product?.id,
      name: values.name,
      description: values.description,
      category_id: values.category_id,
      is_active: values.is_active,
      is_featured: values.is_featured,
      images: values.images.map((image) => ({
        image_url: image.image_url,
        public_id: image.public_id,
      })),
      options,
    });
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    toast.success(result.success ?? "Product saved");
    router.push("/admin/products");
    router.refresh();
  }

  const activeTypes = Array.from(
    new Set(values.options.map((row) => row.pricing_type))
  );

  return (
    <div>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-xs font-medium text-navy/45 transition hover:text-navy"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        All products
      </Link>

      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-pink">
          Catalog
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {product ? "Edit product" : "Add product"}
        </h1>
        <p className="mt-1 text-sm text-navy/45">
          Fill in the details your customers will see on the storefront.
        </p>
      </div>

      <form onSubmit={submit} className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          <section className="rounded-2xl border border-navy/5 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Basic details</h2>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="product-name">Product name</Label>
                <Input
                  id="product-name"
                  value={values.name}
                  onChange={(event) => update("name", event.target.value)}
                  required
                  placeholder="e.g. Blush rose bouquet"
                />
              </div>

              <div>
                <Label htmlFor="product-description">Description</Label>
                <Textarea
                  id="product-description"
                  value={values.description}
                  onChange={(event) => update("description", event.target.value)}
                  maxLength={5000}
                  placeholder="Describe the arrangement, materials, colours and styling."
                />
              </div>

              <div>
                <Label htmlFor="product-category">Category</Label>
                <Select
                  id="product-category"
                  value={values.category_id}
                  onChange={(event) => update("category_id", event.target.value)}
                  required
                >
                  <option value="">Choose a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
                {categories.length === 0 && (
                  <p className="mt-1.5 text-[11px] text-amber-700">
                    Create a category first.{" "}
                    <Link href="/admin/categories" className="font-medium underline">
                      Go to categories
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-navy/5 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Images</h2>
                <p className="mt-0.5 text-xs text-navy/45">
                  Add as many photos as you like. The first is the cover.
                </p>
              </div>
              <span className="rounded-full bg-blush px-2.5 py-1 text-[10px] font-medium text-navy/50">
                {values.images.length} added
              </span>
            </div>
            <div className="mt-4">
              <ImageUploader
                images={values.images}
                onChange={(images) => update("images", images)}
                multiple
              />
            </div>
          </section>

          <section className="rounded-2xl border border-navy/5 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Pricing options</h2>
                <p className="mt-0.5 text-xs text-navy/45">
                  A product can be sold by inches, pieces, size — or all three at
                  once.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => update("options", [...values.options, newRow()])}
              >
                <Plus className="h-3.5 w-3.5" />
                Add option
              </Button>
            </div>

            {activeTypes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {activeTypes.map((type) => (
                  <span
                    key={type}
                    className="rounded-full bg-pink-soft px-2.5 py-1 text-[10px] font-medium capitalize text-navy/60"
                  >
                    {type} ·{" "}
                    {values.options.filter((row) => row.pricing_type === type).length}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 space-y-2.5">
              {values.options.map((row, index) => (
                <div
                  key={row.key}
                  className="grid gap-2 rounded-xl border border-navy/8 bg-blush/40 p-2.5 sm:grid-cols-[20px_110px_1fr_110px_36px] sm:items-center"
                >
                  <span className="hidden items-center justify-center text-navy/25 sm:flex">
                    <GripVertical className="h-4 w-4" />
                  </span>

                  <Select
                    value={row.pricing_type}
                    onChange={(event) =>
                      updateOption(row.key, {
                        pricing_type: event.target.value as PricingType,
                      })
                    }
                    aria-label={`Pricing type for option ${index + 1}`}
                    className="h-10 bg-white text-xs"
                  >
                    {PRICING_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>

                  <Input
                    value={row.label}
                    onChange={(event) =>
                      updateOption(row.key, { label: event.target.value })
                    }
                    placeholder={
                      row.pricing_type === "inch"
                        ? "e.g. 12 inches"
                        : row.pricing_type === "pieces"
                          ? "e.g. 50 pieces"
                          : "e.g. Medium"
                    }
                    aria-label={`Label for option ${index + 1}`}
                    className="h-10 bg-white text-xs"
                  />

                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.price}
                    onChange={(event) =>
                      updateOption(row.key, { price: event.target.value })
                    }
                    placeholder="Price"
                    aria-label={`Price for option ${index + 1}`}
                    className="h-10 bg-white text-xs"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      update(
                        "options",
                        values.options.filter((item) => item.key !== row.key)
                      )
                    }
                    className="grid h-9 w-9 place-items-center justify-self-end rounded-lg text-navy/35 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Remove option"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {values.options.length === 0 && (
                <div className="rounded-xl border border-dashed border-navy/15 px-4 py-8 text-center text-xs text-navy/40">
                  No pricing options yet. Add at least one so customers can buy
                  this product.
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <section className="rounded-2xl border border-navy/5 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Visibility</h2>
            <div className="mt-3 space-y-3">
              <label className="flex items-start gap-2.5 text-sm text-navy/70">
                <input
                  type="checkbox"
                  checked={values.is_active}
                  onChange={(event) => update("is_active", event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-navy/20 text-blue focus:ring-blue/20"
                />
                <span>
                  Active
                  <span className="mt-0.5 block text-[11px] text-navy/40">
                    Show this product on the storefront.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-sm text-navy/70">
                <input
                  type="checkbox"
                  checked={values.is_featured}
                  onChange={(event) => update("is_featured", event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-navy/20 text-blue focus:ring-blue/20"
                />
                <span>
                  Featured
                  <span className="mt-0.5 block text-[11px] text-navy/40">
                    Prefer this product on the home page.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-navy/5 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Ready to publish?</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-navy/45">
              Saving updates the storefront immediately. The cheapest active option
              is used as the &ldquo;from&rdquo; price.
            </p>
            <Button type="submit" loading={pending} className="mt-4 w-full">
              {product ? "Save changes" : "Create product"}
            </Button>
            <Link
              href="/admin/products"
              className={buttonClass({
                variant: "ghost",
                size: "sm",
                className: "mt-2 w-full",
              })}
            >
              Cancel
            </Link>
          </section>

          {product && (
            <Link
              href={`/product/${product.slug}`}
              target="_blank"
              className="block rounded-2xl border border-navy/5 bg-white p-4 text-center text-xs font-medium text-blue transition hover:border-blue/30"
            >
              Preview on storefront ↗
            </Link>
          )}
        </aside>
      </form>
    </div>
  );
}
