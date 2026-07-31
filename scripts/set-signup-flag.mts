/**
 * `npx tsx scripts/set-signup-flag.mts` — closes public sign-up through the
 * Supabase Management API, when the dashboard will not.
 *
 * Why this exists: two dashboard attempts to turn off "Allow new users to
 * sign up" left GoTrue still reporting `disable_signup: false` on the live
 * project. The Management API writes the same project-level flag over HTTP,
 * so it can be run, logged, and re-run — and, unlike a dashboard click, it
 * reports what the server actually stored rather than what a form displayed.
 *
 * It does four things, in order, and prints all four:
 *
 *   1. GET  /v1/projects/{ref}/config/auth   — the state before the write
 *   2. PATCH the same endpoint with {"disable_signup": true}
 *   3. GET  it again                         — the state after the write
 *   4. run scripts/verify-signup-closed.mts  — a live, unauthenticated probe
 *
 * Steps 1-3 ask Supabase's control plane what it believes. Step 4 asks GoTrue
 * itself, with the public anon key, exactly as a stranger would. Those are
 * different questions and the second is the one that matters: the control
 * plane can report `true` while the auth server has not yet picked it up. If
 * that happens this script waits 60s and re-probes, and reports both attempts
 * rather than rounding the first failure away.
 *
 * ---------------------------------------------------------------------------
 * THE TOKEN
 *
 * SUPABASE_ACCESS_TOKEN is a Supabase Personal Access Token. It is not the
 * anon key and not the service-role key — it is broader than either: it
 * administers every project the account owns. It is read from the environment
 * or .env.local, and this script NEVER prints it, never writes it anywhere,
 * and never includes it in an error message. Keep it out of git (.env* is
 * already ignored) and out of CI unless CI genuinely needs to administer the
 * project — it does not.
 *
 * Everything printed from an API response goes through an allowlist, not a
 * redactor. GET /config/auth returns SMTP passwords, OAuth client secrets and
 * webhook signing secrets alongside the flags we care about; dumping the
 * object and stripping known-bad keys would leak the first field Supabase
 * adds that we did not think of. Only named fields are printed.
 * ---------------------------------------------------------------------------
 *
 * Flags:
 *   --dry-run   do steps 1 and 4 only; never PATCH. Use to inspect state.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

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

const DRY_RUN = process.argv.includes("--dry-run");

/*
 * The project ref is derived from the URL the app itself uses, never passed
 * in separately. Two dashboard attempts may already have flipped the flag on
 * some other project; a script that takes the ref as an argument can make the
 * same mistake silently. This one can only ever write to the project the
 * running app authenticates against.
 */
const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL");
const refMatch = /^https:\/\/([a-z0-9]+)\.supabase\.co/i.exec(supabaseUrl);
if (!refMatch) {
  console.error(`NEXT_PUBLIC_SUPABASE_URL is not a hosted Supabase URL: ${supabaseUrl}`);
  console.error("  This script administers a hosted project; a local stack has no Management API.");
  process.exit(1);
}
const projectRef = refMatch[1];

let accessToken: string;
try {
  accessToken = env("SUPABASE_ACCESS_TOKEN");
} catch {
  console.error("SUPABASE_ACCESS_TOKEN is not set (checked the environment and .env.local).");
  console.error("");
  console.error("  Create one at https://supabase.com/dashboard/account/tokens");
  console.error("  then either export it for this shell or add it to .env.local:");
  console.error("");
  console.error("      SUPABASE_ACCESS_TOKEN=sbp_...");
  console.error("");
  console.error("  It administers every project on the account. .env.local is gitignored;");
  console.error("  keep it there or in your shell, and out of CI.");
  process.exit(1);
}

const configUrl = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;

/*
 * Printed fields, by hand. Anything not named here is never shown — see the
 * header note on why this is an allowlist rather than a redactor.
 *
 * `disable_signup` is the flag under test. The rest are its neighbours: each
 * one is either another route to a new account (anonymous sign-in, phone
 * signup, manual identity linking) or something that must keep working after
 * the write (the email provider, SMTP, the reset/confirm URLs). Printing them
 * before and after makes an accidental change to a neighbour visible instead
 * of silent.
 */
const REPORTED_FIELDS = [
  "disable_signup",
  "external_email_enabled",
  "external_phone_enabled",
  "external_anonymous_users_enabled",
  "security_manual_linking_enabled",
  "mailer_autoconfirm",
  "mailer_secure_email_change_enabled",
  "password_min_length",
  "site_url",
  "uri_allow_list",
  "smtp_host",
  "smtp_admin_email",
  "smtp_sender_name",
] as const;

type AuthConfig = Record<string, unknown>;

function report(label: string, config: AuthConfig): void {
  console.log(`${label}:`);
  for (const field of REPORTED_FIELDS) {
    const value = field in config ? JSON.stringify(config[field]) : "(absent)";
    console.log(`  ${field.padEnd(34)} ${value}`);
  }
  console.log("");
}

async function getConfig(): Promise<AuthConfig> {
  const response = await fetch(configUrl, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  if (response.status === 401 || response.status === 403) {
    /*
     * Deliberately terminal. A 401/403 means the token is wrong or lacks
     * scope for this project — it says nothing about the flag, and retrying
     * or falling back to some other mechanism would be guessing at a
     * security control. Stop and let a human look.
     */
    console.error(`\nHTTP ${response.status} from the Management API.`);
    console.error("  The token was rejected. This is an auth failure, NOT a failure to set the flag —");
    console.error("  the flag's state is unchanged and unknown from here.");
    console.error(`  Check the token has access to project ${projectRef} and has not expired.`);
    process.exit(2);
  }
  if (!response.ok) {
    console.error(`\nHTTP ${response.status} from GET ${configUrl}`);
    console.error(`  ${(await response.text()).slice(0, 300)}`);
    process.exit(1);
  }
  return (await response.json()) as AuthConfig;
}

console.log(`Project:  ${projectRef} (derived from NEXT_PUBLIC_SUPABASE_URL)`);
console.log(`Endpoint: ${configUrl}`);
console.log(DRY_RUN ? "Mode:     DRY RUN — no write will be attempted\n" : "");

// --- 1. Before ------------------------------------------------------------
const before = await getConfig();
report("BEFORE", before);

// --- 2. Write -------------------------------------------------------------
let after: AuthConfig = before;
if (DRY_RUN) {
  console.log("PATCH skipped (--dry-run).\n");
} else if (before.disable_signup === true) {
  console.log("PATCH skipped — disable_signup is already true in the control plane.\n");
} else {
  const patch = await fetch(configUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ disable_signup: true }),
  });
  if (patch.status === 401 || patch.status === 403) {
    console.error(`\nHTTP ${patch.status} on PATCH.`);
    console.error("  The token could read the config but not write it — a scope problem.");
    console.error("  The flag is unchanged. Stopping.");
    process.exit(2);
  }
  if (!patch.ok) {
    console.error(`\nHTTP ${patch.status} from PATCH ${configUrl}`);
    console.error(`  ${(await patch.text()).slice(0, 300)}`);
    process.exit(1);
  }
  console.log(`PATCH {"disable_signup": true} -> ${patch.status}\n`);

  // --- 3. After -----------------------------------------------------------
  after = await getConfig();
  report("AFTER", after);
}

// --- 4. Ask GoTrue itself -------------------------------------------------
/*
 * Spawned rather than imported: verify-signup-closed.mts is a top-level-await
 * module that calls process.exit, so importing it would end this process
 * before the retry logic below could run.
 */
function probe(): number {
  const result = spawnSync("npx", ["tsx", "scripts/verify-signup-closed.mts"], {
    stdio: "inherit",
    shell: true,
  });
  return result.status ?? 1;
}

console.log("--- live probe against GoTrue (public anon key) ---\n");
let probeStatus = probe();

if (probeStatus !== 0 && after.disable_signup === true) {
  /*
   * The control plane stored the flag but the auth server has not applied it
   * yet. That is a real and expected state for a few seconds after a write —
   * but it is indistinguishable, from here, from a write that will never take
   * effect. So: wait once, re-probe once, and report both results. No loop.
   */
  console.log("\nControl plane says disable_signup: true, but GoTrue still accepts signups.");
  console.log("Consistent with propagation delay. Waiting 60s for one more probe.\n");
  await new Promise((resolve) => setTimeout(resolve, 60_000));
  console.log("--- live probe, second attempt ---\n");
  probeStatus = probe();
}

console.log("");
if (probeStatus === 0) {
  console.log("DONE — control plane and live endpoint agree: sign-up is closed.");
  process.exit(0);
}

console.error("NOT CLOSED — the live endpoint still accepts sign-up requests.");
console.error(`  control plane disable_signup: ${JSON.stringify(after.disable_signup)}`);
console.error("  Do not treat the control-plane value as sufficient. The probe is the proof.");
process.exit(1);
