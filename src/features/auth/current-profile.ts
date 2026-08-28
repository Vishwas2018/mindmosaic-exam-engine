import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

function isMissingRevocationColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error?.message?.includes("access_revoked_at")) return false;
  return error.code === "42703" || error.code === "PGRST204";
}

/**
 * One cookie-scoped auth/profile read per server render. Role layouts and
 * their pages both need this identity; caching it prevents a dashboard
 * navigation from repeating the same two remote Supabase round trips.
 */
export const getCurrentProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, profile: null };

  const fullProfile = await supabase
    .from("profiles")
    .select("role, access_revoked_at, display_name, year_level")
    .eq("id", user.id)
    .single();

  if (!fullProfile.error) {
    return { supabase, user, profile: fullProfile.data };
  }

  /*
   * Development and staged deployments can briefly run an older schema
   * while migrations are being applied. Before the erasure-request migration
   * there is no revocation column and therefore no persisted revocation state
   * to enforce. Fall back only for that exact missing-column error; every
   * other profile failure remains fail-closed in requireRole(). Once the
   * migration lands, the normal single-query path above is used again.
   */
  if (isMissingRevocationColumn(fullProfile.error)) {
    const { data: legacyProfile } = await supabase
      .from("profiles")
      .select("role, display_name, year_level")
      .eq("id", user.id)
      .single();

    return {
      supabase,
      user,
      profile: legacyProfile ? { ...legacyProfile, access_revoked_at: null } : null,
    };
  }

  return { supabase, user, profile: null };
});
