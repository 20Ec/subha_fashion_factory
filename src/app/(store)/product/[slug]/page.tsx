import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  ChevronRight,
  Palette,
  Sparkles,
} from "lucide-react";
import {
  getProductBySlug,
  getRelatedProducts,
  sortedImages,
  sortedOptions,
} from "@/lib/data";
import { PRICING_TYPE_LABEL } from "@/lib/config";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductPurchase } from "@/components/shop/product-purchase";
import { ProductCard } from "@/components/shop/product-card";
import { FlowerMark } from "@/components/ui/logo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description:
      product.description.slice(0, 155) ||
      `Handmade flowers from Subha Fashion Factory.`,
    openGraph: product.cover_image
      ? { images: [{ url: product.cover_image }] }
      : undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const images = sortedImages(product);
  const options = sortedOptions(product);
  const related = await getRelatedProducts(
    product.category_id,
    product.id,
    4
  );
  const types = Array.from(new Set(options.map((option) => option.pricing_type)));

  return (
    <div className="container-page pb-24 pt-5 sm:pt-8 lg:pb-12">
      <nav className="flex items-center gap-1.5 overflow-hidden text-xs text-navy/40">
        <Link href="/" className="shrink-0 transition hover:text-navy">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link href="/shop" className="shrink-0 transition hover:text-navy">
          Shop
        </Link>
        {product.category && (
          <>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="shrink-0 transition hover:text-navy"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="truncate text-navy/60">{product.name}</span>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery
          images={images.map((image) => ({
            id: image.id,
            image_url: image.image_url,
          }))}
          name={product.name}
        />

        <div>
          {product.category?.name && (
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="text-[10px] font-semibold uppercase tracking-[0.2em] text-pink hover:text-navy"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {types.map((type) => (
              <span
                key={type}
                className="rounded-full bg-pink-soft px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-navy/60"
              >
                {PRICING_TYPE_LABEL[type]}
              </span>
            ))}
          </div>

          {product.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-navy/55">
              {product.description}
            </p>
          )}

          <div className="mt-6">
            <ProductPurchase
              productId={product.id}
              productName={product.name}
              productSlug={product.slug}
              image={product.cover_image ?? images[0]?.image_url ?? null}
              options={options}
            />
          </div>

          <div className="mt-7 grid gap-3 border-t border-navy/5 pt-5 sm:grid-cols-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-blue" />
              <span className="text-xs text-navy/55">Handcrafted finish</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Palette className="h-4 w-4 text-blue" />
              <span className="text-xs text-navy/55">Custom colours</span>
            </div>
            <div className="flex items-center gap-2.5">
              <BadgeCheck className="h-4 w-4 text-blue" />
              <span className="text-xs text-navy/55">Confirmed personally</span>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pink">
                You may also love
              </p>
              <h2 className="mt-1.5 flex items-center gap-2 text-2xl font-semibold tracking-tight">
                More from the studio
                <FlowerMark className="h-5 w-5 text-pink" />
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-sm font-medium text-blue hover:text-blue-dark"
            >
              Shop all
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
