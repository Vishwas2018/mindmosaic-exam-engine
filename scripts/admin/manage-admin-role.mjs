#!/usr/bin/env node
/**
 * Grants or revokes the Admin entitlement on an EXISTING account (service role, DEV only, dry run by default).
 *
 *   node scripts/admin/manage-admin-role.mjs --env <.env.local> --email <address> --reason "<why>" [--revoke] [--apply]
 *
 * - Refuses any project but the DEV Supabase (mfglzabnayacssgertat) and never prints keys.
 * - The account must already exist (admin access is never created by sign-up) and must not be a student profile.
 * - Calls public.grant_admin_role / revoke_admin_role, which record an append-only role_audit_events row.
 * - Without --apply it only reports what it would do. Production is out of scope: it needs its own owner-approved run.
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const DEV = "https://mfglzabnayacssgertat.supabase.co";
const args = process.argv.slice(2);
const flag = (name) => args.indexOf(name);
const value = (name) => (flag(name) === -1 ? null : args[flag(name) + 1]);
const envPath = value("--env");
const email = value("--email")?.trim().toLowerCase();
const reason = value("--reason")?.trim();
const revoke = flag("--revoke") !== -1;
const apply = flag("--apply") !== -1;

if (!envPath || !email || !reason || reason.length < 5) {
  console.error('usage: manage-admin-role.mjs --env <.env.local> --email <address> --reason "<at least 5 chars>" [--revoke] [--apply]');
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

const users = [];
for (let page = 1; ; page += 1) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
  if (error) throw error;
  users.push(...data.users);
  if (data.users.length < 200) break;
}
const matches = users.filter((u) => (u.email ?? "").toLowerCase() === email);
if (matches.length !== 1) {
  console.error(`ABORT: expected exactly one account for that email, found ${matches.length}.`);
  process.exit(1);
}
const user = matches[0];
const { data: profile, error: profileError } = await db.from("profiles").select("role, display_name, access_revoked_at").eq("id", user.id).single();
if (profileError || !profile) {
  console.error("ABORT: no profile for that account.");
  process.exit(1);
}
if (profile.role === "student") {
  console.error("ABORT: student profiles can never hold an elevated role.");
  process.exit(1);
}
const words = (profile.display_name ?? "").trim().split(/\s+/).filter(Boolean);
if (!revoke && words.length < 2) {
  console.error("ABORT: the account's display name must be the reviewer's real full name (two or more words); Admin Review locks the reviewer identity to it.");
  process.exit(1);
}

console.log(`${revoke ? "REVOKE" : "GRANT"} admin for ${email} (profile role ${profile.role}, display name "${profile.display_name}", id ${user.id.slice(0, 8)}…)`);
if (!apply) {
  console.log("Dry run only. Re-run with --apply to write.");
  process.exit(0);
}

const { data, error } = await db.rpc(revoke ? "revoke_admin_role" : "grant_admin_role", {
  p_user: user.id,
  p_actor: "owner:manage-admin-role.mjs",
  p_reason: reason,
});
if (error) {
  console.error(`FAILED: ${error.message}`);
  process.exit(1);
}
console.log(`Result: ${data}`);
