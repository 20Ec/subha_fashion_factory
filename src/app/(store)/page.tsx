import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Instagram,
  Palette,
  Sparkles,
} from "lucide-react";
import { getCategories, getHomeProducts } from "@/lib/data";
import { SITE } from "@/lib/config";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FloralArt } from "@/components/ui/floral-art";
import { FlowerMark } from "@/components/ui/logo";
import { ProductCard } from "@/components/shop/product-card";

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getHomeProducts(8),
  ]);

  return (
    <div className="overflow-hidden">
      {/* ---------------- HERO ---------------- */}
      <section className="relative">
        <div className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-pink-soft/60 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-blue/5 blur-3xl" />

        <div className="container-page relative grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:py-20">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-pink/40 bg-white/80 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-navy/60">
              <FlowerMark className="h-3.5 w-3.5 text-pink" />
              Handmade &amp; artificial flowers
            </span>

            <h1 className="mt-5 text-balance text-[2.6rem] font-semibold leading-[1.04] tracking-tight text-navy sm:text-6xl lg:text-[4.1rem]">
              Flowers that
              <span className="relative mx-2 inline-block text-blue">
                never fade
                <svg
                  viewBox="0 0 320 22"
                  className="absolute -bottom-2 left-0 h-4 w-full text-pink"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 15C70 6 150 4 316 11"
                    stroke="currentColor"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <br className="hidden sm:block" />
              and memories that stay.
            </h1>

            <p className="mt-6 max-w-md text-sm leading-relaxed text-navy/55 sm:text-base">
              Elegant handmade and artificial blooms, crafted petal by petal
              for your home, your celebrations and the people you love.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/shop" className={buttonClass({ size: "lg" })}>
                Shop the collection
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/#craft"
                className={buttonClass({ variant: "outline", size: "lg" })}
              >
                Our craft
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-navy/45">
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-blue" />
                Made by hand
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Palette className="h-4 w-4 text-blue" />
                Custom colours
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-blue" />
                Personal order confirmation
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px] animate-fade-up [animation-delay:120ms]">
            <FloralArt />

            <div className="absolute left-0 top-8 rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-soft backdrop-blur sm:left-2 sm:top-12">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy/40">
                Handcrafted
              </p>
              <p className="mt-0.5 text-sm font-medium text-navy">
                Petal by petal
              </p>
            </div>

            <div className="absolute bottom-10 right-0 rounded-2xl bg-navy px-4 py-3 text-white shadow-soft sm:right-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-pink">
                Made for you
              </p>
              <p className="mt-0.5 text-sm font-medium">Every order, confirmed</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CATEGORIES ---------------- */}
      {categories.length > 0 && (
        <section className="container-page py-12 sm:py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pink">
                Explore
              </p>
              <h2 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">
                Shop by bloom
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue hover:text-blue-dark"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {categories.slice(0, 4).map((category) => (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className="group relative flex h-36 flex-col justify-end overflow-hidden rounded-2xl border border-navy/5 p-4 sm:h-44"
              >
                {category.image_url ? (
                  <>
                    <Image
                      src={category.image_url}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-navy/75 via-navy/15 to-transparent" />
                    <span className="relative text-sm font-medium text-white">
                      {category.name}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="absolute inset-0 bg-gradient-to-br from-pink-soft via-white to-blush" />
                    <FlowerMark className="absolute right-3 top-3 h-9 w-9 text-pink/70" />
                    <span className="relative text-sm font-medium text-navy">
                      {category.name}
                    </span>
                    <span className="relative mt-0.5 text-[11px] text-navy/45">
                      Explore collection
                    </span>
                  </>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- PRODUCTS ---------------- */}
      <section className="container-page py-10 sm:py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pink">
              Fresh from the studio
            </p>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">
              Blooms you&apos;ll love
            </h2>
          </div>
          {products.length > 0 && (
            <Link
              href="/shop"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue hover:text-blue-dark"
            >
              Shop all
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {products.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-6"
            title="Our first blooms are being prepared"
            description="New handmade arrangements are on their way. Follow us on Instagram to see them first."
          >
            <Link
              href={SITE.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass({ variant: "outline", size: "sm" })}
            >
              <Instagram className="h-4 w-4" />
              Visit Instagram
            </Link>
          </EmptyState>
        )}
      </section>

      {/* ---------------- CRAFT ---------------- */}
      <section id="craft" className="container-page scroll-mt-24 py-12 sm:py-20">
        <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] border border-navy/5 bg-white p-6 sm:p-10 lg:grid-cols-2 lg:p-12">
          <div className="relative">
            <div className="rounded-[1.6rem] bg-gradient-to-br from-pink-soft via-blush to-white p-6">
              <FloralArt className="mx-auto max-w-[340px]" />
            </div>
            <div className="absolute -bottom-3 left-4 rounded-2xl bg-white px-4 py-3 shadow-soft sm:left-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-pink">
                Small studio
              </p>
              <p className="text-sm font-medium">Big attention to detail</p>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pink">
              Our craft
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Thoughtfully made, never rushed
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-navy/55">
              Each arrangement is shaped by hand — from the curve of a petal to
              the shade of the stem. Whether it&apos;s a single stem or a full
              celebration setup, we make every piece feel personal.
            </p>

            <div className="mt-6 space-y-4">
              {[
                {
                  icon: Sparkles,
                  title: "Handcrafted detail",
                  text: "Every flower is finished by hand for a natural, lasting look.",
                },
                {
                  icon: Palette,
                  title: "Made to order",
                  text: "Tell us your colours and occasion, and we'll craft around you.",
                },
                {
                  icon: BadgeCheck,
                  title: "A real person confirms",
                  text: "Our team calls you after your order to confirm every detail.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pink-soft text-navy">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-medium text-navy">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-navy/50">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- INSTAGRAM ---------------- */}
      <section className="container-page pb-4">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-pink-soft via-[#fff0f6] to-white px-6 py-12 text-center sm:px-10">
          <FlowerMark className="mx-auto h-8 w-8 text-pink" />
          <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
            See what&apos;s blooming
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-navy/55">
            New arrangements, behind-the-scenes moments and custom work — all on
            our Instagram.
          </p>
          <Link
            href={SITE.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass({ size: "lg", className: "mt-6" })}
          >
            <Instagram className="h-4 w-4" />
            Follow us on Instagram
          </Link>
        </div>
      </section>
    </div>
  );
}
