"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, UserRound } from "lucide-react";
import { useActionState } from "react";
import { toast } from "sonner";
import { signUpAction, type AuthFormState } from "@/lib/actions/auth";
import { useCart } from "@/components/cart/cart-context";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: AuthFormState = {};

export function RegisterForm({ next }: { next?: string | null }) {
  const router = useRouter();
  const { mergeAfterLogin } = useCart();
  const [state, formAction, pending] = useActionState(
    signUpAction,
    initialState
  );
  const [showPassword, setShowPassword] = useState(false);
  const handled = useRef(false);

  useEffect(() => {
    if (!state.success || handled.current) return;
    handled.current = true;

    (async () => {
      await mergeAfterLogin();
      toast.success("Your account is ready. Welcome!");
      router.push(next && !next.startsWith("/admin") ? next : "/");
      router.refresh();
    })();
  }, [state, mergeAfterLogin, next, router]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Create your account
      </h1>
      <p className="mt-1.5 text-sm text-navy/50">
        Save your addresses, track orders and keep your favourite blooms close.
      </p>

      <form action={formAction} className="mt-7 space-y-4">
        {state.error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
            {state.error}
          </div>
        )}

        <div>
          <Label htmlFor="fullName">Full name</Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/30" />
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              required
              placeholder="Your full name"
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/30" />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/30" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              className="pl-10 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/35 transition hover:text-navy"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/30" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="Re-enter your password"
              className="pl-10"
            />
          </div>
        </div>

        <Button type="submit" size="lg" loading={pending} className="w-full">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-navy/50">
        Already have an account?{" "}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="font-medium text-blue hover:text-blue-dark"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
