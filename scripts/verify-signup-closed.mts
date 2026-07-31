/**
 * `npm run verify:signup-closed` — proves public sign-up is actually shut.
 *
 * Why a script and not a test: the only control that matters is Supabase
 * Auth's project-level setting, and that lives in the hosted project, not in
 * this repo. The app can refuse all it likes — the anon key ships to every
 * browser, so anyone can POST straight to GoTrue's /auth/v1/signup and skip
 * the UI entirely. Same shape as MM-AUTH-01, where a route check existed and
 * the RLS policy did not.
 *
 * It asks GoTrue directly, with the public anon key, exactly as a stranger
 * would.
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
 * Because the password can never pass, the open case is detected without
 * creating an account or sending a confirmation email to anyone. Two earlier
 * versions of this script got this wrong in the dangerous direction: one
 * treated any 4xx as proof of closure and passed while signups were wide
 * open, the same mistake as reading a NOT NULL violation as an RLS block.
 * Only `signup_disabled` counts as closed here; anything unrecognised is
 * reported as inconclusive and fails, rather than being rounded to good news.
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

const GATE_REFUSED = parsed.error_code === "signup_disabled" || /signups? not allowed/i.test(parsed.msg ?? "");
const GATE_PASSED =
  signupResponse.status < 400 ||
  parsed.error_code === "weak_password" ||
  parsed.error_code === "email_address_invalid";

if (GATE_REFUSED) {
  console.log("CLOSED — a direct GoTrue attempt with the public anon key was refused at the signup gate.");
  if (settings.disable_signup !== true) {
    console.log("  (note: /settings still reports disable_signup false — the endpoint is authoritative, but worth a look)");
  }
  process.exit(0);
}

if (GATE_PASSED) {
  console.error("OPEN — the request passed the signup gate and was evaluated on its merits.");
  console.error(`  reached: ${parsed.error_code ?? `HTTP ${signupResponse.status}`}`);
  if (signupResponse.status < 400) {
    console.error("  A USER WAS CREATED. Delete it in the Supabase dashboard: Authentication -> Users.");
  } else {
    console.error("  No account was created — the password could never pass — but a real one would have.");
  }
  console.error("\nAnyone with the public anon key can create an account. See docs/DEPLOYMENT.md.");
  process.exit(1);
}

console.error("INCONCLUSIVE — the response matched neither a signup-gate refusal nor a validation error.");
console.error(`  status ${signupResponse.status}, error_code ${parsed.error_code ?? "(none)"}`);
console.error("  This proves nothing either way. Fix the probe; do not read it as a pass.");
process.exit(1);
