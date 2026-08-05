/**
 * `npm run audit:auth-users` — every row in auth.users on the live project,
 * classified, so an unrecognised account cannot hide behind a summary.
 *
 * Why this exists: public sign-up was open on this project while the app was
 * publicly reachable, before anyone intended it to be. Anyone who found the
 * URL could have created an account by POSTing to /auth/v1/signup with the
 * anon key that ships in the browser bundle.
 *
 * Sign-up is deliberately open again as of 5 August 2026 (`npm run
 * verify:signup-open`), so this is no longer an audit of accounts that got
 * in through a gap — it is an inventory of who exists, which matters more
 * now, not less. Accounts created before the wizard shipped were created
 * without consent being recorded and without a confirmed email.
 *
 * It lists auth.users, NOT profiles. A row created by a raw GoTrue signup
 * gets a profiles row from the on_auth_user_created trigger, but anything
 * that failed midway — or any path that bypassed the trigger — leaves an
 * auth.users row with no profile. Auditing profiles would miss exactly the
 * rows most worth finding, so auth.users is the source of truth here and the
 * profiles column is reported as a property of each row.
 *
 * Read-only by construction: it issues listUsers and one select. There is no
 * delete path in this file, deliberately — deciding a row is unwanted and
 * removing it are separate acts, and the second one needs a human.
 *
 * ---------------------------------------------------------------------------
 * ON PRINTING ALIAS EMAILS
 *
 * A student's alias email embeds their login code
 * (`childcode+K7XJ2P9R@students.mindmosaic.internal`) — the username half of
 * that child's credentials. .gitignore records what happened last time such a
 * document was produced: a report carrying three children's login codes went
 * into a commit and toward a public push, caught by reading the diff rather
 * than by any rule.
 *
 * So alias codes are masked by default. Every row stays identifiable by id,
 * created_at, role and profile status, which is what an audit needs. Pass
 * --reveal-codes if you specifically need the full alias; the output is then
 * credential material and belongs in a terminal, not a file, an issue or a
 * commit.
 * ---------------------------------------------------------------------------
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function env(name: string): string {
  if (process.env[name]) return process.env[name] as string;
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      if (line.startsWith(`${name}=`)) return line.slice(name.length + 1).trim();
    }
  }
  throw new Error(`${name} is not set (checked the environment and .env.local).`);
}

const REVEAL = process.argv.includes("--reveal-codes");

const url = env("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");

/*
 * Patterns read from the code that produces them, not guessed:
 *   ALIAS_DOMAIN          src/features/auth/student-alias.ts
 *   FIXTURE_EMAIL_DOMAIN  e2e/fixtures/identities.ts
 *   FIXTURE_CODE          e2e/fixtures/identities.ts (E2STUD01..03)
 *   PROBE                 scripts/verify-signup-open.mts
 */
const ALIAS_DOMAIN = "students.mindmosaic.internal";
const FIXTURE_DOMAIN = "e2e.mindmosaic.local";
const FIXTURE_ALIAS_CODE = /^childcode\+e2stud\d+@/i;
const PROBE_EMAIL = /^signup-probe-\d+@example\.com$/i;

type Bucket = "parent-or-operator" | "student-alias" | "e2e-fixture" | "signup-probe";

interface Row {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string;
  emailConfirmedAt: string;
  role: string;
  hasProfile: boolean;
  bucket: Bucket;
  domain: string;
}

function classify(email: string): Bucket {
  if (PROBE_EMAIL.test(email)) return "signup-probe";
  if (email.toLowerCase().endsWith(`@${FIXTURE_DOMAIN}`)) return "e2e-fixture";
  if (FIXTURE_ALIAS_CODE.test(email)) return "e2e-fixture";
  if (email.toLowerCase().endsWith(`@${ALIAS_DOMAIN}`)) return "student-alias";
  return "parent-or-operator";
}

function maskEmail(email: string): string {
  if (REVEAL) return email;
  const alias = /^childcode\+([^@]+)@(.+)$/i.exec(email);
  if (!alias) return email;
  const code = alias[1];
  return `childcode+${code.slice(0, 2)}${"*".repeat(Math.max(0, code.length - 2))}@${alias[2]}`;
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- every row, paged to exhaustion -------------------------------------
const users: Array<{
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
}> = [];

for (let page = 1; ; page += 1) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) {
    console.error(`listUsers failed on page ${page}: ${error.message}`);
    process.exit(1);
  }
  users.push(...data.users);
  /* Stop on a short page rather than trusting a total the API may not send. */
  if (data.users.length < 200) break;
}

// --- which of those ids have a public.profiles row ----------------------
const { data: profileRows, error: profileError } = await admin.from("profiles").select("id, role");
if (profileError) {
  console.error(`profiles select failed: ${profileError.message}`);
  process.exit(1);
}
const profileIds = new Set((profileRows ?? []).map((p) => p.id as string));

const rows: Row[] = users
  .map((u) => {
    const email = u.email ?? "(no email)";
    return {
      id: u.id,
      email,
      createdAt: u.created_at ?? "",
      lastSignInAt: u.last_sign_in_at ?? "never",
      emailConfirmedAt: u.email_confirmed_at ?? "not confirmed",
      role: (u.user_metadata?.role as string | undefined) ?? "(none)",
      hasProfile: profileIds.has(u.id),
      bucket: classify(email),
      domain: email.includes("@") ? email.split("@")[1].toLowerCase() : "(none)",
    };
  })
  .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

// --- output --------------------------------------------------------------
console.log(`Project: ${url}`);
console.log(`\nauth.users rows: ${rows.length}`);
console.log(`profiles rows:   ${profileIds.size}`);
if (!REVEAL) console.log(`\n(student login codes masked — pass --reveal-codes to show them)`);

console.log(`\n--- every row, created_at ascending ---\n`);
console.table(
  rows.map((r) => ({
    created_at: r.createdAt,
    email: maskEmail(r.email),
    role: r.role,
    profile: r.hasProfile ? "yes" : "NO",
    last_sign_in: r.lastSignInAt,
    confirmed: r.emailConfirmedAt === "not confirmed" ? "NOT CONFIRMED" : "yes",
    classification: r.bucket,
    id: r.id,
  })),
);

function section(title: string, subset: Row[], emptyNote: string): void {
  console.log(`\n### ${title} — ${subset.length}`);
  if (subset.length === 0) {
    console.log(`  ${emptyNote}`);
    return;
  }
  for (const r of subset) {
    console.log(`  ${r.createdAt}  ${maskEmail(r.email)}  role=${r.role}  profile=${r.hasProfile ? "yes" : "NO"}  ${r.id}`);
  }
}

section(
  "Student alias accounts (children provisioned by a parent)",
  rows.filter((r) => r.bucket === "student-alias"),
  "none",
);
section(
  "e2e fixture leftovers",
  rows.filter((r) => r.bucket === "e2e-fixture"),
  "none — expected, the fixture suite refuses to run against a hosted project",
);
section(
  "Sign-up probe rows (scripts/verify-signup-open.mts)",
  rows.filter((r) => r.bucket === "signup-probe"),
  "none — no probe ever created an account",
);
section(
  "Everything else — CONFIRM EACH ONE IS YOURS",
  rows.filter((r) => r.bucket === "parent-or-operator"),
  "none",
);
section(
  "auth.users rows with NO profiles row",
  rows.filter((r) => !r.hasProfile),
  "none — every auth user has a profile",
);

const knownDomains = new Set([ALIAS_DOMAIN, FIXTURE_DOMAIN]);
const otherDomains = [...new Set(rows.filter((r) => !knownDomains.has(r.domain)).map((r) => r.domain))];
console.log(`\n### Email domains outside the alias/fixture domains — ${otherDomains.length}`);
for (const d of otherDomains) {
  const count = rows.filter((r) => r.domain === d).length;
  console.log(`  ${d}  (${count} row${count === 1 ? "" : "s"})  <- confirm this is yours`);
}
if (otherDomains.length === 0) console.log("  none");

/*
 * Exit code carries the finding: unexplained rows are the whole point of
 * running this, so they must not be reported as a success. A probe row or an
 * orphaned auth.users row is equally a finding.
 */
const findings =
  rows.filter((r) => r.bucket === "signup-probe").length +
  rows.filter((r) => !r.hasProfile).length;

console.log(
  findings === 0
    ? `\nNo probe rows and no orphaned auth.users rows. Confirm the "everything else" list above by eye.`
    : `\n${findings} row(s) need attention — see the sections above.`,
);
process.exit(findings === 0 ? 0 : 1);
