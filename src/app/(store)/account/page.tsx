import type { Metadata } from "next";
import Link from "next/link";
import { LogOut, Package, ShoppingBag } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, initials } from "@/lib/utils";
import { signOutAction } from "@/lib/actions/auth";
import { AddressManager } from "@/components/account/address-manager";
import { buttonClass } from "@/components/ui/button";
import { FlowerMark } from "@/components/ui/logo";
import type { Address } from "@/lib/types";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const supabase = await createClient();

  const [{ data: profile }, { data: addresses }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true }),
  ]);

  return (
    <div className="container-page py-8 sm:py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pink">
        Your space
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        My account
      </h1>

      <div className="mt-7 grid gap-5 lg:grid-cols-[280px_1fr] lg:items-start">
        <aside className="rounded-2xl border border-navy/5 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-pink-soft text-base font-semibold text-navy">
              {initials(profile?.full_name ?? user.fullName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {profile?.full_name || user.fullName || "Customer"}
              </p>
              <p className="truncate text-xs text-navy/45">{user.email}</p>
            </div>
          </div>

          {profile?.created_at && (
            <p className="mt-4 rounded-xl bg-blush px-3.5 py-2.5 text-[11px] text-navy/45">
              With us since {formatDate(profile.created_at)}
            </p>
          )}

          <nav className="mt-4 space-y-1">
            <Link
              href="/orders"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-navy/70 transition hover:bg-blush"
            >
              <Package className="h-4 w-4" />
              My orders
            </Link>
            <Link
              href="/cart"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-navy/70 transition hover:bg-blush"
            >
              <ShoppingBag className="h-4 w-4" />
              My cart
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </nav>

          <div className="mt-4 flex items-center gap-2 border-t border-navy/5 pt-4 text-[11px] text-navy/35">
            <FlowerMark className="h-4 w-4 text-pink" />
            Handmade with care
          </div>
        </aside>

        <section className="rounded-2xl border border-navy/5 bg-white p-5 shadow-card sm:p-6">
          <AddressManager addresses={(addresses ?? []) as Address[]} />
        </section>
      </div>

      <div className="mt-6 rounded-2xl border border-navy/5 bg-white/70 p-5 text-center">
        <p className="text-sm text-navy/55">
          Need help with an order or a custom floral piece?
        </p>
        <Link
          href={process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/"}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass({ variant: "outline", size: "sm", className: "mt-3" })}
        >
          Message us on Instagram
        </Link>
      </div>
    </div>
  );
}
