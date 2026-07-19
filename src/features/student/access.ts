import "server-only";

import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Data loader for the /student/{assignments,engagement} portal pages. Auth +
 * the student-role gate already ran in src/app/student/layout.tsx before
 * this renders (see the seam note in src/features/student/require-student.ts,
 * used by the sibling /student/{page,learn} shell instead — same auth gate,
 * different not-configured presentation). RLS is the real data enforcement
 * (docs/DATA_MODEL_AND_ROLES.md).
 */
export type StudentAccess =
  | { kind: "not_configured" }
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
    /* Unreachable once the layout gate has run; kept for type safety. */
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return {
    kind: "ok",
    userId: user.id,
    displayName:
      (typeof profile?.display_name === "string" && profile.display_name) ||
      "Student",
  };
}
