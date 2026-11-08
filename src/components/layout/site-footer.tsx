import Link from "next/link";
import { Instagram, Youtube } from "lucide-react";
import { SITE } from "@/lib/config";
import { FlowerMark, Logo } from "@/components/ui/logo";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/70 transition hover:-translate-y-0.5 hover:border-gold hover:bg-white/5 hover:text-gold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40"
    >
      {children}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-gold/30 bg-navy text-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
            Handmade and artificial flowers, thoughtfully crafted for
            celebrations, gifts and everyday joy.
          </p>
          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
              Follow us
            </p>
            <div className="mt-3 flex items-center gap-2">
              <SocialLink href={SITE.instagram} label="Instagram">
                <Instagram className="h-4 w-4" />
              </SocialLink>
              <SocialLink href={SITE.youtube} label="YouTube">
                <Youtube className="h-[18px] w-[18px]" />
              </SocialLink>
              <SocialLink
                href={SITE.whatsapp.url}
                label={`WhatsApp ${SITE.whatsapp.display}`}
              >
                <WhatsAppIcon className="h-4 w-4" />
              </SocialLink>
            </div>
          </div>
        </div>

        <div>
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
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
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
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
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
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
            <FlowerMark className="h-3 w-3 text-gold" />
            in India
          </p>
        </div>
      </div>
    </footer>
  );
}
