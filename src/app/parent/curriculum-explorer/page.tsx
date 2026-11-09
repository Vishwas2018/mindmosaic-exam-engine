import { redirect } from "next/navigation";
import { resolveDefaultChildId } from "@/features/parent-dashboard/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/**
 * Legacy top-level curriculum route.
 * Redirects to child-scoped route wrapped in ParentShell:
 *   /parent/children/[childId]/curriculum
 * If no child exists, falls back to /parent/children.
 */
export default async function ParentCurriculumExplorerRedirectPage() {
  if (!isSupabaseConfigured) {
    redirect("/parent");
  }

  const defaultChildId = await resolveDefaultChildId();

  if (defaultChildId) {
    redirect(`/parent/children/${defaultChildId}/curriculum`);
  }

  redirect("/parent/children");
}
