"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-pink-soft text-pink">
        🌸
      </span>
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-pink">
        Something went wrong
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        A small hiccup in the studio
      </h1>
      <p className="mt-2 max-w-sm text-sm text-navy/50">
        We couldn&apos;t load this page right now. Please try again — if it keeps
        happening, reach out to us on Instagram.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={reset} className={buttonClass()}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
        <Link href="/" className={buttonClass({ variant: "outline" })}>
          Go home
        </Link>
      </div>
    </div>
  );
}
