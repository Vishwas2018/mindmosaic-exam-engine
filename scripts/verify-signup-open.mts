/**
 * `npm run verify:signup-open` — proves public sign-up is actually reachable.
 *
 * This replaces `verify:signup-closed`. The deployment decision changed:
 * public parent sign-up is open, /sign-up renders the three-step wizard
 * (src/features/auth/components/SignUpWizard.tsx), and
 * PUBLIC_SIGNUP_ENABLED is true. The failure this guards against inverted
 * with it — it is no longer "the app claims a door is shut that is not",
 * it is "the app offers a form that the backend will reject".
 *
 * Why a script and not a test: the only thing that decides this is Supabase
 * Auth's project-level setting, and that lives in the hosted project, not in
 * this repo. `PUBLIC_SIGNUP_ENABLED` and supabase/config.toml's
 * `enable_signup` govern the app and local stacks respectively; neither can
 * tell you what the live project will do. So this asks GoTrue directly, with
 * the public anon key, exactly as a stranger would.
 *
 * The probe deliberately sends a password too short to be accepted. GoTrue
 * evaluates the request in this order:
 *
 *     disable_signup  ->  password strength  ->  email validity
 *
 * so the response says which stage the request reached:
 *
 *   signup_disabled        the gate refused it            -> CLOSED
 *   weak_password          it got PAST the gate           -> OPEN
 *   email_address_invalid  it got past the gate           -> OPEN
 *   2xx                    it got past everything         -> OPEN (and a user
 *                                                            now exists)
 *
 * Because the password can never pass, "open" is detected without creating an
 * account or sending a confirmation email to anyone — the probe is safe to
 * run against production repeatedly.
 *
 * Exit codes are the whole point of the inversion, so they are stated plainly:
 *
 *   0  OPEN          — the gate let the request through. This is the wanted
 *                      state, and the state /sign-up's form depends on.
 *   1  CLOSED        — GoTrue refused at the gate. /sign-up would show a form
 *                      that cannot succeed. Turn sign-up on in the dashboard
 *                      (Authentication > Sign In / Providers > "Allow new
 *                      users to sign up"), or `npm run open:signup`.
 *   1  INCONCLUSIVE  — the response matched neither. Reported as a failure
 *                      rather than rounded to good news; the previous version
 *                      of this probe had a bug in exactly that direction.
 *
 * This is deliberately NOT wired into CI. It needs live project credentials
 * and makes a real network call to the production auth server; a required
 * check that depends on both would flake on Supabase's availability rather
 * than on this repo's correctness. Run it after a deployment or a dashboard
 * change. See docs/DEPLOYMENT.md.
 */
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

const url = env("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");

const probeEmail = `signup-probe-${Date.now()}@example.com`;
/* Below GoTrue's minimum on purpose — see the ordering note above. */
const tooShortPassword = "x";

console.log(`Project: ${url}`);
console.log(`Probe:   ${probeEmail} (password deliberately too short)\n`);

// --- 1. What the project reports about itself ----------------------------
const settingsResponse = await fetch(`${url}/auth/v1/settings`, {
  headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
});
const settings = (await settingsResponse.json()) as { disable_signup?: boolean };
console.log(`GET /auth/v1/settings -> ${settingsResponse.status}`);
console.log(`  disable_signup: ${settings.disable_signup}\n`);

// --- 2. A real request to the real endpoint, with the public key ----------
const signupResponse = await fetch(`${url}/auth/v1/signup`, {
  method: "POST",
  headers: { apikey: anonKey, "Content-Type": "application/json" },
  body: JSON.stringify({ email: probeEmail, password: tooShortPassword }),
});
const bodyText = await signupResponse.text();
console.log(`POST /auth/v1/signup -> ${signupResponse.status}`);
console.log(`  ${bodyText.slice(0, 400)}\n`);

let parsed: { error_code?: string; msg?: string } = {};
try {
  parsed = JSON.parse(bodyText) as typeof parsed;
} catch {
  /* Non-JSON body falls through to inconclusive below. */
}

const GATE_REFUSED =
  parsed.error_code === "signup_disabled" || /signups? not allowed/i.test(parsed.msg ?? "");
const GATE_PASSED =
  signupResponse.status < 400 ||
  parsed.error_code === "weak_password" ||
  parsed.error_code === "email_address_invalid";

if (GATE_PASSED) {
  console.log("OPEN — the request passed the signup gate and was evaluated on its merits.");
  console.log(`  reached: ${parsed.error_code ?? `HTTP ${signupResponse.status}`}`);
  if (signupResponse.status < 400) {
    /* Not an error — the gate being open is the wanted state — but the
       probe was designed never to get this far, so say so loudly. */
    console.warn("  NOTE: a user was created. The password should have been rejected first.");
    console.warn("  Delete it in the Supabase dashboard: Authentication -> Users.");
  } else {
    console.log("  No account was created — the password could never pass.");
  }
  if (settings.disable_signup === true) {
    console.log(
      "  (note: /settings reports disable_signup true — the endpoint is authoritative, but worth a look)",
    );
  }
  process.exit(0);
}

if (GATE_REFUSED) {
  console.error("CLOSED — a direct GoTrue attempt with the public anon key was refused at the gate.");
  console.error("  /sign-up renders a form that cannot succeed against this project.");
  console.error("\nTurn sign-up on: Supabase dashboard > Authentication > Sign In / Providers >");
  console.error('  "Allow new users to sign up" — or `npm run open:signup`. See docs/DEPLOYMENT.md.');
  process.exit(1);
}

console.error("INCONCLUSIVE — the response matched neither a signup-gate refusal nor a validation error.");
console.error(`  status ${signupResponse.status}, error_code ${parsed.error_code ?? "(none)"}`);
console.error("  This proves nothing either way. Fix the probe; do not read it as a pass.");
process.exit(1);
