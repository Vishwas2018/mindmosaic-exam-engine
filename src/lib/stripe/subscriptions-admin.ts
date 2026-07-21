import "server-only";

import { createClient as createAdminClient, type SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Service-role Supabase client, scoped to the billing write path.
 *
 * public.subscriptions and public.subscription_events deliberately have no
 * insert/update/delete policy for `authenticated` (see
 * supabase/migrations/20260720100000_subscriptions.sql) — every write to
 * either table happens through this client, exactly like the service-role
 * client provisionChild() constructs inline in
 * src/features/auth/provision-child.ts. Never exported to, or callable
 * from, client code: `import "server-only"` above turns an accidental
 * client import into a build failure.
 *
 * Returns null (fail-clean, not throw) when SUPABASE_SERVICE_ROLE_KEY is
 * unset, so callers can respond with a friendly "not configured" error
 * instead of crashing — same shape as provisionChild()'s own check.
 */
export function createSubscriptionsAdminClient(): SupabaseClient | null {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || serviceRoleKey.trim().length === 0) {
    return null;
  }

  return createAdminClient(SUPABASE_URL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
