/**
 * Runs once in the Playwright runner process after the whole run, including when a worker crashed mid-test (the
 * afterAll hooks of a dead worker never run, which is how an Admin fixture entitlement used to survive a crash).
 * Revokes any still-active Admin entitlement belonging to THIS run's synthetic fixtures. Never deletes anything.
 */
import { createClient } from "@supabase/supabase-js";

import { findFixtureAdmins, revokeFixtureAdmins } from "./fixture-admin-reconcile";

export default async function globalTeardown(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const runId = process.env.HOSTED_RUN_ID;
  if (!url || !key || !runId) return;
  if (new URL(url).hostname !== "mfglzabnayacssgertat.supabase.co") return; // DEV only
  const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  try {
    const left = await findFixtureAdmins(sb, { runId });
    const n = await revokeFixtureAdmins(sb, left, `e2e:hosted:teardown:${runId}`);
    if (left.length) console.warn(`global-teardown: revoked ${n}/${left.length} Admin fixture entitlement(s) left by run ${runId}`);
  } catch (e) {
    // Teardown must never mask test results; scripts/hosted-acceptance/reconcile-fixtures.mts is the backstop.
    console.warn(`global-teardown: ${(e as Error).message}`);
  }
}
