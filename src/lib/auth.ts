import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role, SessionUser } from "@/lib/types";

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: profile?.email || user.email || "",
    fullName:
      profile?.full_name ||
      (user.user_metadata?.full_name as string | undefined) ||
      "",
    role: (profile?.role as Role | undefined) ?? "customer",
  };
});

export async function requireUser(nextPath?: string): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect(
      nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"
    );
  }

  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (user.role !== "admin") {
    notFound();
  }

  return user;
}
