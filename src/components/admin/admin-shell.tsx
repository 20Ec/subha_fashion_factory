"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  RotateCcw,
  ShoppingBag,
  Tags,
  X,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { signOutAction } from "@/lib/actions/auth";
import { FlowerMark, Logo } from "@/components/ui/logo";
import type { SessionUser } from "@/lib/types";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: ShoppingBag },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/requests", label: "Requests", icon: RotateCcw },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {nav.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
              active
                ? "bg-white/10 text-white"
                : "text-white/55 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
            {active && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-pink" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  admin,
  onNavigate,
}: {
  admin: SessionUser;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-5 pt-6">
        <Link href="/admin" onClick={onNavigate} className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-gold">
            <FlowerMark className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-lg font-semibold leading-none text-white">
              Subha
            </span>
            <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.24em] text-white/40">
              Admin studio
            </span>
          </span>
        </Link>
      </div>

      <div className="px-5">
        <div className="rounded-xl bg-white/5 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">
            Signed in as
          </p>
          <p className="mt-0.5 truncate text-xs font-medium text-white/80">
            {admin.email}
          </p>
        </div>
      </div>

      <div className="mt-5 flex-1 overflow-y-auto px-3">
        <NavLinks onNavigate={onNavigate} />
      </div>

      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-white/55 transition hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
          View storefront
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-rose-300 transition hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminShell({
  admin,
  children,
}: {
  admin: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-screen bg-blush">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] bg-navy lg:block">
        <SidebarContent admin={admin} />
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-full text-navy transition hover:bg-blush"
            aria-label="Open admin menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo compact />
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-xs font-semibold text-white">
          {initials(admin.fullName)}
        </span>
      </header>

      <main className="lg:pl-[260px]">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>

      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute left-0 top-0 h-full w-[82%] max-w-xs bg-navy shadow-2xl animate-pop">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-white/60 hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent admin={admin} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
