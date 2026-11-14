#!/usr/bin/env node
/**
 * Removes the synthetic families the hosted acceptance suite created on DEV — and nothing else.
 *
 *   node scripts/hosted-acceptance/cleanup.mjs --env <path to .env.local>            # dry run (default)
 *   node scripts/hosted-acceptance/cleanup.mjs --env <path> --apply                  # delete
 *   node scripts/hosted-acceptance/cleanup.mjs --env <path> --apply --run rmwg93j1w   # one run only
 *
 * Scope, by stable identifiers only:
 * - parents whose email is `mm-accept-<runId>-<label>@example.com` (seeded by the suite), or a plus-address
 *   containing `+mmaccept-<runId>-` (registered through the form by the suite);
 * - children linked to those parents through parent_children (their auth users are `childcode+…`).
 * Deleting an auth user cascades to its profile, sessions and attempts. Anything else — mm-dev-* fixtures, other
 * parents' children, accounts that may be real — is never selected. Refuses any project but DEV.
 */
import fs from "node:fs";

const DEV = "https://mfglzabnayacssgertat.supabase.co";
const args = process.argv.slice(2);
const envPath = args[args.indexOf("--env") + 1];
const apply = args.includes("--apply");
const runIdx = args.indexOf("--run");
const run = runIdx === -1 ? null : args[runIdx + 1];
if (!envPath || args.indexOf("--env") === -1) {
  console.error("usage: cleanup.mjs --env <.env.local> [--apply] [--run <runId>]");
  process.exit(2);
}
if (run !== null && !/^r[a-z0-9]+$/.test(run)) {
  console.error("ABORT: --run must look like r<base36>");
  process.exit(2);
}

const env = {};
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
if (env.NEXT_PUBLIC_SUPABASE_URL !== DEV || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ABORT: not bound to DEV Supabase");
  process.exit(2);
}
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };

const runPart = run ?? "r[a-z0-9]+";
const SEEDED = new RegExp(`^mm-accept-${runPart}-[a-z0-9]+@example\\.com$`);
const REGISTERED = new RegExp(`^[^@+]+\\+mmaccept-${runPart}-[a-z0-9]+@[^@]+$`);

async function allUsers() {
  const users = [];
  for (let page = 1; page < 100; page++) {
    const r = await fetch(`${DEV}/auth/v1/admin/users?page=${page}&per_page=200`, { headers: H });
    const j = await r.json();
    users.push(...j.users);
    if (j.users.length < 200) break;
  }
  return users;
}

const users = await allUsers();
const parents = users.filter((u) => SEEDED.test(u.email ?? "") || REGISTERED.test(u.email ?? ""));
const parentIds = new Set(parents.map((u) => u.id));
let links = [];
if (parentIds.size) {
  const r = await fetch(`${DEV}/rest/v1/parent_children?select=parent_id,child_id&parent_id=in.(${[...parentIds].join(",")})`, {
    headers: H,
  });
  links = await r.json();
}
const childIds = new Set(links.map((l) => l.child_id));
const children = users.filter((u) => childIds.has(u.id) && /^childcode\+/.test(u.email ?? ""));
// A child linked to any parent outside the selection is left alone.
const foreign = new Set();
if (childIds.size) {
  const r = await fetch(`${DEV}/rest/v1/parent_children?select=parent_id,child_id&child_id=in.(${[...childIds].join(",")})`, {
    headers: H,
  });
  for (const l of await r.json()) if (!parentIds.has(l.parent_id)) foreign.add(l.child_id);
}
const targets = [...children.filter((c) => !foreign.has(c.id)), ...parents];

console.log(`${apply ? "DELETING" : "DRY RUN"}: ${parents.length} parent(s), ${targets.length - parents.length} child(ren)`);
for (const u of targets) console.log(`  ${u.id}  ${(u.email ?? "").replace(/^[^+@]+\+/, "<base>+")}`);
if (foreign.size) console.log(`  kept ${foreign.size} child(ren) also linked to a parent outside the selection`);
if (!apply) process.exit(0);

let failed = 0;
for (const u of targets) {
  const r = await fetch(`${DEV}/auth/v1/admin/users/${u.id}`, { method: "DELETE", headers: H });
  if (!r.ok) {
    failed++;
    console.log(`  FAILED ${u.id}: ${r.status}`);
  }
}
console.log(failed ? `${failed} deletion(s) failed` : "done");
process.exit(failed ? 1 : 0);
