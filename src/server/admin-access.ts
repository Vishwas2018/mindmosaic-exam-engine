import "server-only";

import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { isProfileRole, roleHomePath } from "@/features/auth/roles";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type AdminAccess =
  | { status: "ok"; supabase: SupabaseClient }
  | { status: "not_configured" };

/**
 * Server-side gate for admin pages. Redirects anonymous visitors to
 * sign-in and non-admin roles to their own home; only an admin profile
 * gets a client back. The aggregate views enforce the same rule again in
 * the database (is_admin() inside each view), so this check is UX, not
 * the security boundary — RLS holds the line per
 * docs/DATA_MODEL_AND_ROLES.md.
 */
export async function requireAdminAccess(nextPath: string): Promise<AdminAccess> {
  if (!isSupabaseConfigured) return { status: "not_configured" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const roleValue = profile?.role;
  const role = isProfileRole(roleValue) ? roleValue : null;
  if (role !== "admin") redirect(roleHomePath(role));

  return { status: "ok", supabase };
}
