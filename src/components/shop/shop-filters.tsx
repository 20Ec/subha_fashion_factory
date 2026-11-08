"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input, Select } from "@/components/ui/input";
import { PRICING_TYPES } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

export function ShopFilters({
  categories,
  total,
}: {
  categories: Pick<Category, "id" | "name" | "slug">[];
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQuery = searchParams.get("q") ?? "";
  const currentCategory = searchParams.get("category") ?? "";
  const currentType = searchParams.get("type") ?? "";
  const currentSort = searchParams.get("sort") ?? "newest";

  const [query, setQuery] = useState(currentQuery);

  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  function navigate(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }

    params.delete("page");
    const suffix = params.toString();
    startTransition(() => {
      router.push(suffix ? `${pathname}?${suffix}` : pathname, {
        scroll: false,
      });
    });
  }

  const hasFilters = Boolean(
    currentQuery || currentCategory || currentType || currentSort !== "newest"
  );

  return (
    <div className={cn("transition", isPending && "opacity-70")}>
      <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <button
          type="button"
          onClick={() => navigate({ category: null })}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition",
            !currentCategory
              ? "border-navy bg-navy text-white"
              : "border-line bg-white text-navy/70 hover:border-navy/30"
          )}
        >
          All flowers
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => navigate({ category: category.slug })}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition",
              currentCategory === category.slug
                ? "border-navy bg-navy text-white"
                : "border-line bg-white text-navy/70 hover:border-navy/30"
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2.5 rounded-2xl border border-line bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <form
          className="relative flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            navigate({ q: query.trim() || null });
          }}
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search flowers..."
            aria-label="Search products"
            className="h-10 border-transparent bg-blush pl-10 pr-9 focus:bg-white"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                navigate({ q: null });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink hover:text-navy"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-ink" />
            <Select
              value={currentType}
              onChange={(event) =>
                navigate({ type: event.target.value || null })
              }
              aria-label="Filter by pricing type"
              className="h-10 border-transparent bg-blush pl-8 text-xs focus:bg-white"
            >
              <option value="">All types</option>
              {PRICING_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  By {type.label}
                </option>
              ))}
            </Select>
          </div>

          <Select
            value={currentSort}
            onChange={(event) =>
              navigate({ sort: event.target.value === "newest" ? null : event.target.value })
            }
            aria-label="Sort products"
            className="h-10 border-transparent bg-blush text-xs focus:bg-white"
          >
            <option value="newest">Newest first</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="name">Name: A to Z</option>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-ink">
          {total} {total === 1 ? "arrangement" : "arrangements"}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={() =>
              startTransition(() => router.push(pathname, { scroll: false }))
            }
            className="inline-flex items-center gap-1 text-xs font-medium text-blue hover:text-blue-dark"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
