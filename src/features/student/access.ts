import "server-only";

import { isProfileRole, type ProfileRole } from "@/features/auth/roles";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side access check for the student portal pages (/student/*).
 * These pages read per-student rows (assignments, exam_attempts), so they
 * require a signed-in student. RLS is the real enforcement — this exists
 * to route each visitor somewhere sensible instead of showing an empty,
 * silently-filtered page.
 */
export type StudentAccess =
  | { kind: "not_configured" }
  | { kind: "unauthenticated" }
  | { kind: "wrong_role"; role: ProfileRole }
  | { kind: "ok"; userId: string; displayName: string };

export async function getStudentAccess(): Promise<StudentAccess> {
  if (!isSupabaseConfigured) {
    return { kind: "not_configured" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { kind: "unauthenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  const role = profile?.role;
  if (isProfileRole(role) && role !== "student") {
    return { kind: "wrong_role", role };
  }

  /* A missing profile row is treated as a student: the sign-up trigger
     defaults unknown roles to student, so this only happens mid-provisioning.
     RLS still returns zero rows for anything they should not see. */
  return {
    kind: "ok",
    userId: user.id,
    displayName:
      (typeof profile?.display_name === "string" && profile.display_name) ||
      "Student",
  };
}
