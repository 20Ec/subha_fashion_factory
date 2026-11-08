import type { Metadata } from "next";
import { safeNextPath } from "@/lib/utils";
import { AuthAside } from "@/components/auth/auth-aside";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);

  return (
    <div className="container-page flex items-center justify-center py-8 sm:py-14">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-line bg-white shadow-soft lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="p-6 sm:p-10">
          <LoginForm next={next} />
        </div>
        <AuthAside />
      </div>
    </div>
  );
}
