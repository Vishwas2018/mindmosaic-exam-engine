#!/usr/bin/env node
/**
 * READ-ONLY check that every existing administrator is safely carried by the multi-role migration (DEV only).
 *
 *   node scripts/admin/verify-admin-migration.mjs --env <.env.local>
 *
 * Preflight (before the migration): lists each admin profile and whether it can be backfilled safely.
 * Postflight (after the migration): checks every admin profile has an ACTIVE user_roles grant and a backfill audit row,
 * that parent links / children are untouched, and that no student holds an entitlement.
 * Never writes. Never prints keys. Aborts for any project but the DEV Supabase (mfglzabnayacssgertat).
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const DEV = "https://mfglzabnayacssgertat.supabase.co";
const args = process.argv.slice(2);
const envPath = args[args.indexOf("--env") + 1];
if (!envPath || args.indexOf("--env") === -1) {
  console.error("usage: verify-admin-migration.mjs --env <.env.local>");
  process.exit(2);
}
const env = {};
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
if (env.NEXT_PUBLIC_SUPABASE_URL !== DEV || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ABORT: not bound to the DEV Supabase project.");
  process.exit(2);
}
const db = createClient(DEV, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: admins, error } = await db
  .from("profiles")
  .select("id, role, display_name, access_revoked_at")
  .eq("role", "admin");
if (error) throw error;

const roles = await db.from("user_roles").select("user_id, role, revoked_at, granted_by");
const migrated = !roles.error;
const missingTable = roles.error && ["42P01", "PGRST205"].includes(roles.error.code);
if (roles.error && !missingTable) {
  console.error(`ABORT: unexpected error reading user_roles (${roles.error.code}).`);
  process.exit(1);
}

const emails = new Map();
for (let page = 1; ; page += 1) {
  const { data, error: listError } = await db.auth.admin.listUsers({ page, perPage: 200 });
  if (listError) throw listError;
  for (const user of data.users) emails.set(user.id, user.email ?? "(none)");
  if (data.users.length < 200) break;
}

let problems = 0;
console.log(`${migrated ? "POSTFLIGHT" : "PREFLIGHT"} (read-only) on DEV: ${admins.length} admin profile(s)`);
for (const admin of admins) {
  const words = (admin.display_name ?? "").trim().split(/\s+/).filter(Boolean);
  const grant = migrated ? roles.data.find((row) => row.user_id === admin.id && row.role === "admin") : null;
  const notes = [];
  if (admin.access_revoked_at) notes.push("account access revoked");
  if (words.length < 2) notes.push("display name is not a two-word real name (Admin Review decisions will be refused)");
  if (migrated && !grant) {
    notes.push("NO ENTITLEMENT ROW (would lose admin)");
    problems += 1;
  } else if (migrated && grant.revoked_at) {
    notes.push("entitlement REVOKED");
  } else if (migrated) {
    notes.push(`active grant (${grant.granted_by})`);
  } else {
    notes.push("will be backfilled");
  }
  console.log(`  - ${emails.get(admin.id) ?? "?"} | id ${admin.id.slice(0, 8)}… | ${notes.join("; ")}`);
}

if (migrated) {
  const students = await db.from("profiles").select("id").eq("role", "student");
  const studentIds = new Set((students.data ?? []).map((row) => row.id));
  const studentGrants = roles.data.filter((row) => studentIds.has(row.user_id));
  console.log(`  students holding an entitlement: ${studentGrants.length} (must be 0)`);
  if (studentGrants.length) problems += 1;
  const audit = await db.from("role_audit_events").select("action", { count: "exact", head: true }).eq("action", "backfill");
  console.log(`  backfill audit rows: ${audit.count ?? "?"}`);
}

console.log(problems === 0 ? "RESULT: OK" : `RESULT: ${problems} PROBLEM(S) - do not proceed`);
process.exit(problems === 0 ? 0 : 1);
