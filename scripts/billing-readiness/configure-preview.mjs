#!/usr/bin/env node
/**
 * Configures the Stripe SANDBOX and the branch-scoped Vercel Preview for billing readiness.
 *
 *   node scripts/billing-readiness/configure-preview.mjs <key-file> <preview-alias-url>
 *
 * <key-file> is a local, untracked env file holding the sandbox secret key:
 *     STRIPE_SECRET_KEY=sk_test_...
 *
 * Hard guards (any failure aborts before anything is written):
 *   - the key must be a TEST key (sk_test_/rk_test_), never live;
 *   - /v1/account must report the sandbox account acct_1StznKDtPH5dvWkm and livemode=false on a probe object;
 *   - the Vercel target must be a mindmosaic-exam-engine Preview alias, and variables are scoped to the
 *     feat/stripe-billing-readiness branch only (never Production, never other previews);
 *   - secrets are passed to the Vercel CLI on stdin and are never printed or written to disk.
 *
 * What it does (idempotent):
 *   1. reads the four recurring prices by lookup key (created by `npm run stripe:setup` or the CLI);
 *   2. creates (or reuses) one webhook endpoint for the Preview alias and captures its signing secret;
 *   3. creates the customer-portal configuration if none is the default;
 *   4. sets STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, the four STRIPE_PRICE_* ids and
 *      BILLING_ENFORCEMENT_ENABLED=true for the branch.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const SANDBOX_ACCOUNT = "acct_1StznKDtPH5dvWkm";
const BRANCH = "feat/stripe-billing-readiness";
const TEAM = "team_uZy8Cp91GPILsSUMAXjye0K9";
const PROJECT = "prj_E3cvtuTiV0XMVdcfoDarUs2XFS1A";
const WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
  "invoice.paid",
];
const LOOKUPS = {
  STRIPE_PRICE_INDIVIDUAL_MONTHLY: "mindmosaic_individual_monthly",
  STRIPE_PRICE_INDIVIDUAL_ANNUAL: "mindmosaic_individual_annual",
  STRIPE_PRICE_FAMILY_MONTHLY: "mindmosaic_family_monthly",
  STRIPE_PRICE_FAMILY_ANNUAL: "mindmosaic_family_annual",
};

function abort(message) {
  console.error(`ABORT: ${message}`);
  process.exit(2);
}

const [keyFile, aliasUrl] = process.argv.slice(2);
if (!keyFile || !aliasUrl) abort("usage: configure-preview.mjs <key-file> <preview-alias-url>");
if (!/^https:\/\/mindmosaic-exam-engine-[a-z0-9-]+-vishwas2018s-projects\.vercel\.app$/.test(aliasUrl)) {
  abort("second argument must be a mindmosaic-exam-engine Preview alias");
}

const keyEnv = {};
for (const line of fs.readFileSync(keyFile, "utf8").split(/\r?\n/)) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
  if (m) keyEnv[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const KEY = keyEnv.STRIPE_SECRET_KEY ?? "";
if (!/^(sk|rk)_test_[A-Za-z0-9]+$/.test(KEY)) abort("STRIPE_SECRET_KEY must be a Stripe TEST-mode key");

const auth = { Authorization: `Bearer ${KEY}` };
async function stripe(method, path, form) {
  const res = await fetch(`https://api.stripe.com${path}`, {
    method,
    headers: { ...auth, ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: form ? new URLSearchParams(form) : undefined,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Stripe ${method} ${path}: ${body?.error?.message ?? res.status}`);
  return body;
}

const account = await stripe("GET", "/v1/account");
if (account.id !== SANDBOX_ACCOUNT) abort(`key belongs to ${account.id}, not the sandbox ${SANDBOX_ACCOUNT}`);
const probe = await stripe("GET", "/v1/prices?limit=1");
if (probe.data[0] && probe.data[0].livemode !== false) abort("probe object is live-mode");
console.log(`Stripe: ${account.id} (sandbox, test mode) verified`);

// 1. prices
const priceIds = {};
for (const [envName, lookup] of Object.entries(LOOKUPS)) {
  const list = await stripe("GET", `/v1/prices?lookup_keys[]=${lookup}&active=true`);
  if (!list.data[0]) abort(`no active price with lookup key ${lookup}; run the catalogue setup first`);
  priceIds[envName] = list.data[0].id;
}
console.log(`Prices: ${Object.keys(priceIds).length}/4 resolved by lookup key`);

// 2. webhook endpoint for the Preview alias
const bypass = await (async () => {
  const r = spawnSync("vercel", ["api", `/v9/projects/${PROJECT}?teamId=${TEAM}`], {
    encoding: "utf8",
    maxBuffer: 1 << 26,
    shell: process.platform === "win32",
  });
  const pb = JSON.parse(r.stdout).protectionBypass ?? {};
  return Object.keys(pb).find((k) => pb[k].scope === "automation-bypass") ?? null;
})();
// Deployment Protection would 401 Stripe's delivery. The bypass token rides on the sandbox endpoint URL only.
const endpointUrl = `${aliasUrl}/api/stripe/webhook${bypass ? `?x-vercel-protection-bypass=${bypass}` : ""}`;
const endpoints = await stripe("GET", "/v1/webhook_endpoints?limit=100");
const existing = endpoints.data.find((e) => e.metadata?.mindmosaic_branch === BRANCH);
let webhookSecret = null;
if (existing) {
  await stripe("POST", `/v1/webhook_endpoints/${existing.id}`, { url: endpointUrl });
  console.log(`Webhook: reusing ${existing.id}; signing secret is only shown at creation`);
} else {
  const form = new URLSearchParams();
  form.append("url", endpointUrl);
  form.append("description", `MindMosaic Preview ${BRANCH}`);
  form.append("metadata[mindmosaic_branch]", BRANCH);
  for (const ev of WEBHOOK_EVENTS) form.append("enabled_events[]", ev);
  const res = await fetch("https://api.stripe.com/v1/webhook_endpoints", {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const created = await res.json();
  if (!res.ok) abort(`webhook create failed: ${created?.error?.message}`);
  webhookSecret = created.secret;
  console.log(`Webhook: created ${created.id} for ${aliasUrl}/api/stripe/webhook`);
}

// 3. customer portal
const portals = await stripe("GET", "/v1/billing_portal/configurations?is_default=true&limit=1");
const wanted = {
  "business_profile[headline]": "Manage your MindMosaic plan",
  "features[customer_update][enabled]": "true",
  "features[customer_update][allowed_updates][]": "email",
  "features[invoice_history][enabled]": "true",
  "features[payment_method_update][enabled]": "true",
  "features[subscription_cancel][enabled]": "true",
  "features[subscription_cancel][mode]": "at_period_end",
};
if (portals.data[0]) {
  console.log(`Portal: default configuration ${portals.data[0].id} present`);
} else {
  const created = await stripe("POST", "/v1/billing_portal/configurations", wanted);
  console.log(`Portal: created ${created.id}`);
}

// 4. Vercel env (branch-scoped Preview only)
function vercelEnv(name, value) {
  const r = spawnSync(
    "vercel",
    ["env", "add", name, "--environment", "preview", "--git-branch", BRANCH, "--force", "--sensitive", "--yes"],
    {
      input: value,
      encoding: "utf8",
      shell: process.platform === "win32",
      env: { ...process.env, VERCEL_ORG_ID: TEAM, VERCEL_PROJECT_ID: PROJECT },
    },
  );
  if (r.status !== 0) abort(`vercel env add ${name} failed: ${(r.stderr || r.stdout).split("\n")[0]}`);
  console.log(`Vercel Preview[${BRANCH}]: ${name} set`);
}
vercelEnv("STRIPE_SECRET_KEY", KEY);
if (webhookSecret) vercelEnv("STRIPE_WEBHOOK_SECRET", webhookSecret);
for (const [name, id] of Object.entries(priceIds)) vercelEnv(name, id);
vercelEnv("BILLING_ENFORCEMENT_ENABLED", "true");

if (webhookSecret) {
  // Tests need the same signing secret; keep it beside the key file, untracked, never printed.
  const out = keyFile.replace(/[^\\/]+$/, "webhook-secret.env");
  fs.writeFileSync(out, `STRIPE_WEBHOOK_SECRET=${webhookSecret}\n`, { mode: 0o600 });
  console.log(`Webhook signing secret saved to ${out}`);
}
console.log("Done. Redeploy the branch so the Preview picks the variables up.");
