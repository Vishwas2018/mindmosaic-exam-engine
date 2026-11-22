#!/usr/bin/env node
/**
 * Runs hosted billing specs against the branch Preview with sandbox credentials from local files.
 *
 *   node scripts/billing-readiness/run.mjs <preview-url> <supabase-env-file> [--config <playwright config>] -- <playwright args>
 *
 * Reads STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET from C:/tmp/stripe-readiness/*.env into the CHILD environment
 * only (as BILLING_STRIPE_KEY / BILLING_WEBHOOK_SECRET). Nothing is printed or written.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const args = process.argv.slice(2);
const sep = args.indexOf("--");
const own = sep === -1 ? args : args.slice(0, sep);
const rest = sep === -1 ? [] : args.slice(sep + 1);
const [url, envFile] = own;
const cfgIdx = own.indexOf("--config");
const config = cfgIdx === -1 ? "playwright.hosted.config.ts" : own[cfgIdx + 1];
const dir = process.env.BILLING_SECRETS_DIR ?? "C:/tmp/stripe-readiness";

function read(file, name) {
  for (const line of fs.readFileSync(`${dir}/${file}`, "utf8").split(/\r?\n/)) {
    const m = new RegExp(`^${name}=(.*)$`).exec(line);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  throw new Error(`${name} missing from ${file}`);
}

const res = spawnSync(
  process.execPath,
  ["scripts/hosted-acceptance/run.mjs", url, "--env", envFile, "--", ...rest],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      HOSTED_CONFIG: config,
      BILLING_STRIPE_KEY: read("sandbox.env", "STRIPE_SECRET_KEY"),
      BILLING_WEBHOOK_SECRET: read("webhook-secret.env", "STRIPE_WEBHOOK_SECRET"),
    },
  },
);
process.exit(res.status ?? 1);
