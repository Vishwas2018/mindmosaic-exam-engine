import { redirect } from "next/navigation";
import { resolveDefaultChildId } from "@/features/parent-dashboard/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/**
 * Legacy top-level writing route.
 * Redirects to child-scoped route wrapped in ParentShell:
 *   /parent/children/[childId]/writing
 * If no child exists, falls back to /parent/children.
 */
export default async function ParentWritingRedirectPage() {
  if (!isSupabaseConfigured) {
    redirect("/parent");
  }

  const defaultChildId = await resolveDefaultChildId();

  if (defaultChildId) {
    redirect(`/parent/children/${defaultChildId}/writing`);
  }

  redirect("/parent/children");
}
