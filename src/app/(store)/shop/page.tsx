import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCategories, getProducts } from "@/lib/data";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/product-card";
import { ShopFilters } from "@/components/shop/shop-filters";
import { cleanQuery } from "@/lib/search";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse handmade and artificial flowers from Subha Fashion Factory.",
};

const PER_PAGE = 12;

type ShopSearchParams = {
  q?: string | string[];
  category?: string | string[];
  type?: string | string[];
  sort?: string | string[];
  page?: string | string[];
};

function value(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const params = await searchParams;
  const q = cleanQuery(params.q);
  const category = value(params.category) ?? "";
  const type = value(params.type) ?? "";
  const sort = value(params.sort) ?? "newest";
  const page = Math.max(1, Number(value(params.page) ?? "1") || 1);

  const [categories, result] = await Promise.all([
    getCategories(),
    getProducts({ q, categorySlug: category, pricingType: type, sort, page, perPage: PER_PAGE }),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.count / PER_PAGE));

  function pageHref(targetPage: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (category) sp.set("category", category);
    if (type) sp.set("type", type);
    if (sort !== "newest") sp.set("sort", sort);
    if (targetPage > 1) sp.set("page", String(targetPage));
    const suffix = sp.toString();
    return suffix ? `/shop?${suffix}` : "/shop";
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pink">
          The collection
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Flowers, made to last
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-navy/50 sm:text-base">
          Handmade and artificial arrangements for every corner, occasion and
          person you love. Choose your size, quantity or length on each piece.
        </p>
      </div>

      <div className="mt-7">
        <ShopFilters
          categories={categories.map((item) => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
          }))}
          total={result.count}
        />
      </div>

      {result.products.length > 0 ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {result.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-1.5">
              <Link
                href={pageHref(Math.max(1, page - 1))}
                aria-disabled={page === 1}
                className={buttonClass({
                  variant: "outline",
                  size: "icon",
                  className: page === 1 ? "pointer-events-none opacity-40" : "",
                })}
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>

              {Array.from({ length: totalPages }).map((_, index) => {
                const target = index + 1;
                if (
                  totalPages > 7 &&
                  target !== 1 &&
                  target !== totalPages &&
                  Math.abs(target - page) > 1
                ) {
                  if (target === 2 || target === totalPages - 1) {
                    return (
                      <span key={target} className="px-1 text-navy/30">
                        …
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <Link
                    key={target}
                    href={pageHref(target)}
                    className={buttonClass({
                      variant: target === page ? "secondary" : "outline",
                      size: "icon",
                      className: "text-xs",
                    })}
                  >
                    {target}
                  </Link>
                );
              })}

              <Link
                href={pageHref(Math.min(totalPages, page + 1))}
                aria-disabled={page === totalPages}
                className={buttonClass({
                  variant: "outline",
                  size: "icon",
                  className:
                    page === totalPages ? "pointer-events-none opacity-40" : "",
                })}
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          className="mt-5"
          title="No flowers match those filters"
          description="Try a different category, pricing type or search term."
        >
          <Link href="/shop" className={buttonClass({ size: "sm" })}>
            View all flowers
          </Link>
        </EmptyState>
      )}
    </div>
  );
}
