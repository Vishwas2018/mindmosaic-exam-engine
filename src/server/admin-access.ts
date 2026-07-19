import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type AdminAccess =
  | { status: "ok"; supabase: SupabaseClient }
  | { status: "not_configured" };

/**
 * Data-side access for admin pages. Auth + the admin-role gate already ran
 * in src/app/admin/layout.tsx before this renders; this only resolves
 * whether Supabase is configured at all, since the aggregate views enforce
 * the same rule again in the database (is_admin() inside each view) —
 * RLS holds the line per docs/DATA_MODEL_AND_ROLES.md.
 */
export async function requireAdminAccess(): Promise<AdminAccess> {
  if (!isSupabaseConfigured) return { status: "not_configured" };

  const supabase = await createClient();
  return { status: "ok", supabase };
}
