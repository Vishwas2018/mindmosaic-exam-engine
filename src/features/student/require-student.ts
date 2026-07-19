import "server-only";

import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface StudentContext {
  userId: string;
  displayName: string | null;
  yearLevel: number | null;
}

/**
 * Data loader for the /student/{page,learn} shell pages. Auth + the
 * student-role gate already ran in src/app/student/layout.tsx before this
 * renders, so this only resolves display data for the confirmed student —
 * it does not re-check role. The "not configured" redirect is this shell's
 * own behaviour (see the seam note in src/features/student/access.ts, used
 * by the sibling /student/{assignments,engagement} shell instead).
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
    /* Unreachable once the layout gate has run; kept for type safety. */
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, year_level")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    displayName:
      (profile?.display_name as string | null) ??
      (user.user_metadata?.display_name as string | undefined) ??
      null,
    yearLevel:
      typeof profile?.year_level === "number" ? profile.year_level : null,
  };
}
