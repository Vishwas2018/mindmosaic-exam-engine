import "server-only";

import { redirect } from "next/navigation";

import { isProfileRole, roleHomePath } from "@/features/auth/roles";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface StudentContext {
  userId: string;
  displayName: string | null;
  yearLevel: number | null;
}

/**
 * Server-side gate for /student pages: guests go to sign-in, other roles to
 * their own home. This is UX routing only — the database's RLS policies are
 * what actually protect student data (docs/DATA_MODEL_AND_ROLES.md).
 */
export async function requireStudent(): Promise<StudentContext> {
  if (!isSupabaseConfigured) {
    redirect("/");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, year_level")
    .eq("id", user.id)
    .single();

  const role = profile?.role;
  if (!profile || !isProfileRole(role)) {
    redirect("/");
  }
  if (role !== "student") {
    redirect(roleHomePath(role));
  }

  return {
    userId: user.id,
    displayName:
      (profile.display_name as string | null) ??
      (user.user_metadata?.display_name as string | undefined) ??
      null,
    yearLevel:
      typeof profile.year_level === "number" ? profile.year_level : null,
  };
}
