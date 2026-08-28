import "server-only";

import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/features/auth/current-profile";
import { isSupabaseConfigured } from "@/lib/supabase/config";

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

  const { user, profile } = await getCurrentProfile();
  if (!user) {
    /* Unreachable once the layout gate has run; kept for type safety. */
    redirect("/sign-in");
  }

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
