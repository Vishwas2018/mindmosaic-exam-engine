#!/usr/bin/env node
/**
 * Points DEV Supabase Auth at a custom SMTP provider (D-025) — DEV only, dry run by default.
 *
 *   node scripts/dev-auth/configure-smtp.mjs            # read current DEV Auth email settings, print the plan
 *   node scripts/dev-auth/configure-smtp.mjs --apply    # PATCH them, then read back and verify
 *
 * Inputs (environment only; nothing is written to disk and the password is never printed):
 *   SUPABASE_ACCESS_TOKEN  personal access token of the account that owns DEV (Management API)
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 *   SMTP_ADMIN_EMAIL       From address, on a domain verified with the provider
 *   SMTP_SENDER_NAME       optional, default "MindMosaic (beta)"
 *   SMTP_EMAILS_PER_HOUR   optional, default 30 (Auth's own email rate limit once custom SMTP is on)
 *
 * Guarantees:
 * - The project ref is fixed to DEV `mfglzabnayacssgertat`. PROD `uermhsptduikehuyceiz` is refused outright.
 * - Email confirmation stays ON: the script aborts if DEV has `mailer_autoconfirm` set, and never sends it.
 * - Only the SMTP fields and `rate_limit_email_sent` are sent. Templates, redirect URLs and providers are untouched.
 */
const DEV_REF = "mfglzabnayacssgertat";
const PROD_REF = "uermhsptduikehuyceiz";
const API = `https://api.supabase.com/v1/projects/${DEV_REF}/config/auth`;
const apply = process.argv.includes("--apply");

if (API.includes(PROD_REF)) throw new Error("refusing PROD");
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error("ABORT: SUPABASE_ACCESS_TOKEN is not set");
  process.exit(2);
}
const H = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

async function readConfig() {
  const r = await fetch(API, { headers: H });
  if (!r.ok) {
    console.error(
      `ABORT: GET auth config -> ${r.status} (token cannot see DEV ${DEV_REF}?)`,
    );
    process.exit(2);
  }
  return r.json();
}

function summary(c) {
  return {
    site_url: c.site_url,
    uri_allow_list: c.uri_allow_list,
    mailer_autoconfirm: c.mailer_autoconfirm,
    smtp_host: c.smtp_host ?? null,
    smtp_port: c.smtp_port ?? null,
    smtp_user: c.smtp_user ?? null,
    smtp_pass_set: Boolean(c.smtp_pass),
    smtp_admin_email: c.smtp_admin_email ?? null,
    smtp_sender_name: c.smtp_sender_name ?? null,
    rate_limit_email_sent: c.rate_limit_email_sent,
    confirmation_template_uses_token_hash: /token_hash/.test(
      c.mailer_templates_confirmation_content ?? "",
    ),
    recovery_template_uses_token_hash: /token_hash/.test(
      c.mailer_templates_recovery_content ?? "",
    ),
  };
}

const before = await readConfig();
console.log("DEV Auth email settings (current):", summary(before));
if (before.mailer_autoconfirm) {
  console.error(
    "ABORT: DEV has email confirmation switched OFF (mailer_autoconfirm=true). Not touching it.",
  );
  process.exit(2);
}

const need = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_ADMIN_EMAIL",
];
const missing = need.filter((k) => !process.env[k]);
if (missing.length) {
  console.log(
    `\nPlan incomplete: set ${missing.join(", ")} to configure SMTP.`,
  );
  process.exit(apply ? 2 : 0);
}
const patch = {
  smtp_host: process.env.SMTP_HOST,
  smtp_port: String(Number(process.env.SMTP_PORT)),
  smtp_user: process.env.SMTP_USER,
  smtp_pass: process.env.SMTP_PASS,
  smtp_admin_email: process.env.SMTP_ADMIN_EMAIL,
  smtp_sender_name: process.env.SMTP_SENDER_NAME || "MindMosaic (beta)",
  rate_limit_email_sent: Number(process.env.SMTP_EMAILS_PER_HOUR || 30),
};
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(patch.smtp_admin_email)) {
  console.error("ABORT: SMTP_ADMIN_EMAIL is not an email address");
  process.exit(2);
}
console.log("\nPlanned PATCH:", { ...patch, smtp_pass: "<set, not shown>" });
if (!apply) {
  console.log("\nDry run. Re-run with --apply to write.");
  process.exit(0);
}

const r = await fetch(API, {
  method: "PATCH",
  headers: H,
  body: JSON.stringify(patch),
});
if (!r.ok) {
  console.error(`PATCH failed: ${r.status} ${(await r.text()).slice(0, 300)}`);
  process.exit(1);
}
const after = summary(await readConfig());
console.log("\nDEV Auth email settings (after):", after);
const ok =
  after.smtp_host === patch.smtp_host &&
  after.smtp_admin_email === patch.smtp_admin_email &&
  after.smtp_pass_set &&
  after.rate_limit_email_sent === patch.rate_limit_email_sent &&
  after.mailer_autoconfirm === false;
console.log(
  ok
    ? "\nVERIFIED: custom SMTP active on DEV, confirmation still required."
    : "\nMISMATCH: check the dashboard.",
);
process.exit(ok ? 0 : 1);
