"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Instagram,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/config";
import { useCart } from "@/components/cart/cart-context";
import { FlowerMark, Logo } from "@/components/ui/logo";
import { signOutAction } from "@/lib/actions/auth";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/#craft", label: "Our Craft" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user, count } = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="bg-navy text-white">
        <div className="container-page flex items-center justify-between gap-3 py-2">
          <div className="flex flex-1 items-center justify-center gap-2 text-[10.5px] font-medium tracking-wide text-white/80 sm:justify-start sm:text-xs">
            <FlowerMark className="h-3.5 w-3.5 text-pink" />
            <span>Handmade flowers, crafted to order</span>
          </div>
          <Link
            href={SITE.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 text-xs text-white/70 transition hover:text-pink sm:flex"
          >
            <Instagram className="h-3.5 w-3.5" />
            Follow us
          </Link>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-navy/5 bg-white/85 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between gap-2 md:h-20">
          <div className="flex items-center gap-1 lg:hidden">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full text-navy transition hover:bg-blush"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <Logo />

          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href) &&
                    !link.href.includes("#");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    active
                      ? "bg-pink-soft text-navy"
                      : "text-navy/60 hover:bg-blush hover:text-navy"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1.5">
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="hidden items-center gap-1.5 rounded-full bg-navy px-3.5 py-2 text-xs font-medium text-white transition hover:bg-navy-soft md:inline-flex"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Admin
              </Link>
            )}

            {user && (
              <Link
                href="/orders"
                className="hidden h-10 w-10 place-items-center rounded-full text-navy/70 transition hover:bg-blush hover:text-navy sm:grid"
                aria-label="My orders"
                title="My orders"
              >
                <Package className="h-[19px] w-[19px]" />
              </Link>
            )}

            <Link
              href={user ? "/account" : "/login"}
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-navy/70 transition hover:bg-blush hover:text-navy md:inline-flex"
            >
              <UserRound className="h-[18px] w-[18px]" />
              {user ? user.fullName.split(" ")[0] || "Account" : "Sign in"}
            </Link>

            <Link
              href="/cart"
              className="relative grid h-10 w-10 place-items-center rounded-full text-navy transition hover:bg-blush"
              aria-label={`Cart with ${count} items`}
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-pink px-1 text-[10px] font-bold text-navy">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-navy/45 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white shadow-2xl animate-pop"
          >
            <div className="flex items-center justify-between border-b border-navy/5 px-5 py-4">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full text-navy/60 transition hover:bg-blush"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              <nav className="flex flex-col gap-1">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-xl px-4 py-3 text-base font-medium transition",
                      pathname === link.href
                        ? "bg-pink-soft text-navy"
                        : "text-navy/70 hover:bg-blush"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="my-5 h-px bg-navy/5" />

              <div className="flex flex-col gap-1">
                {user ? (
                  <>
                    <Link
                      href="/account"
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-navy/75 transition hover:bg-blush"
                    >
                      <UserRound className="h-4 w-4" />
                      My account
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-navy/75 transition hover:bg-blush"
                    >
                      <Package className="h-4 w-4" />
                      My orders
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 rounded-xl bg-navy px-4 py-3 text-sm font-medium text-white"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Admin dashboard
                      </Link>
                    )}
                    <div className="mt-1 rounded-xl bg-blush px-4 py-3">
                      <p className="truncate text-xs text-navy/50">
                        Signed in as
                      </p>
                      <p className="truncate text-sm font-medium">
                        {user.email}
                      </p>
                    </div>
                    <form action={signOutAction} className="mt-1">
                      <button
                        type="submit"
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 rounded-full bg-blue px-4 py-3 text-sm font-medium text-white"
                  >
                    <UserRound className="h-4 w-4" />
                    Sign in / Create account
                  </Link>
                )}
              </div>
            </div>

            <div className="border-t border-navy/5 px-5 py-4">
              <Link
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-navy/60"
              >
                <Instagram className="h-4 w-4" />
                Follow us on Instagram
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
