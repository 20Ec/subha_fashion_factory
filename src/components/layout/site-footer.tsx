import Link from "next/link";
import { Instagram } from "lucide-react";
import { SITE } from "@/lib/config";
import { FlowerMark, Logo } from "@/components/ui/logo";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-navy text-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
            Handmade and artificial flowers, thoughtfully crafted for
            celebrations, gifts and everyday joy.
          </p>
          <Link
            href={SITE.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-white/80 transition hover:border-pink hover:text-pink"
          >
            <Instagram className="h-4 w-4" />
            Follow us on Instagram
          </Link>
        </div>

        <div>
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-pink">
            <FlowerMark className="h-3.5 w-3.5" />
            Shop
          </h3>
          <div className="mt-4 flex flex-col gap-2.5 text-sm text-white/60">
            <Link href="/shop" className="transition hover:text-white">
              All flowers
            </Link>
            <Link href="/shop?sort=newest" className="transition hover:text-white">
              New arrivals
            </Link>
            <Link href="/cart" className="transition hover:text-white">
              Your cart
            </Link>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-pink">
            Account
          </h3>
          <div className="mt-4 flex flex-col gap-2.5 text-sm text-white/60">
            <Link href="/account" className="transition hover:text-white">
              My account
            </Link>
            <Link href="/orders" className="transition hover:text-white">
              My orders
            </Link>
            <Link href="/login" className="transition hover:text-white">
              Sign in
            </Link>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-pink">
            Good to know
          </h3>
          <div className="mt-4 space-y-2.5 text-sm leading-relaxed text-white/60">
            <p>Every order is confirmed personally by our team.</p>
            <p>Return or replacement requests are accepted for 7 days after delivery.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/40 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5">
            Handcrafted with
            <FlowerMark className="h-3 w-3 text-pink" />
            in India
          </p>
        </div>
      </div>
    </footer>
  );
}
