#!/usr/bin/env node
/**
 * Safe orphan reconciliation for synthetic Admin fixtures on DEV.
 *
 *   npx tsx scripts/hosted-acceptance/reconcile-fixtures.mts --env <.env.local>             # dry run (default)
 *   npx tsx scripts/hosted-acceptance/reconcile-fixtures.mts --env <.env.local> --apply     # revoke via audited RPC
 *   options: --run <runId>  one run only     --older-than <minutes>  (default 120; protects a run in progress)
 *
 * Selection is by the synthetic email pattern only (see e2e/hosted/fixture-admin-reconcile.ts), never by role alone;
 * the retained Admins are in a protected list. Accounts are NEVER deleted. Refuses any project but DEV. Prints counts
 * and run ids, never emails, keys or tokens.
 */
import fs from "node:fs";

import { createClient } from "@supabase/supabase-js";

import { findFixtureAdmins, revokeFixtureAdmins } from "../../e2e/hosted/fixture-admin-reconcile";

const args = process.argv.slice(2);
const val = (f: string) => (args.includes(f) ? args[args.indexOf(f) + 1] : undefined);
const envPath = val("--env");
const apply = args.includes("--apply");
const runId = val("--run");
const minutes = Number(val("--older-than") ?? "120");
if (!envPath || !Number.isFinite(minutes) || (runId && !/^r[a-z0-9]+$/.test(runId))) {
  console.error("usage: reconcile-fixtures.mts --env <.env.local> [--apply] [--run r<id>] [--older-than <minutes>]");
  process.exit(2);
}
const env: Record<string, string> = {};
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
  if (m) env[m[1]!] = m[2]!.replace(/^["']|["']$/g, "");
}
if (env.NEXT_PUBLIC_SUPABASE_URL !== "https://mfglzabnayacssgertat.supabase.co" || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ABORT: env is not bound to DEV Supabase");
  process.exit(2);
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const orphans = await findFixtureAdmins(sb, { runId, olderThanMs: minutes * 60_000 });
const runs = [...new Set(orphans.map((o) => o.runId))];
console.log(`${apply ? "APPLY" : "DRY RUN"}: ${orphans.length} synthetic Admin fixture entitlement(s) older than ${minutes} min; runs: ${runs.join(", ") || "none"}`);
if (apply && orphans.length) {
  const n = await revokeFixtureAdmins(sb, orphans, "ops:reconcile-fixtures");
  console.log(`revoked ${n}`);
}
const { count } = await sb.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin").is("revoked_at", null);
console.log(`active Admin entitlements now: ${count}`);
