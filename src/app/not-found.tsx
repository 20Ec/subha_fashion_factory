import Link from "next/link";
import { Home, Search } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { FloralArt } from "@/components/ui/floral-art";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <FloralArt className="max-w-[220px] opacity-90" />
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-pink">
        404 — Page not found
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        This petal drifted away
      </h1>
      <p className="mt-2 max-w-sm text-sm text-navy/50">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Let&apos;s get you back to the blooms.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/" className={buttonClass()}>
          <Home className="h-4 w-4" />
          Go home
        </Link>
        <Link href="/shop" className={buttonClass({ variant: "outline" })}>
          <Search className="h-4 w-4" />
          Browse flowers
        </Link>
      </div>
    </div>
  );
}
