/**
 * Service-role Supabase client for seed/cleanup only. Never imported from
 * anything that ships to a browser — this whole `e2e/` tree is test tooling,
 * not app source, but the same discipline as `src/features/auth/provision-child.ts`
 * applies: the service-role key only ever lives in Node-side scripts.
 */
import { createClient } from "@supabase/supabase-js";

import { assertLocalSupabaseEnvironment } from "./environment-guard";
import { e2eEnv } from "./env";

export function createAdminClient() {
  assertLocalSupabaseEnvironment();
  return createClient(e2eEnv.supabaseUrl, e2eEnv.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
