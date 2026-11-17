#!/usr/bin/env node
/**
 * Runs shoot-app.mjs against a protected DEV Preview: reads the Vercel automation-bypass secret from the project
 * API (logged-in `vercel` CLI) into memory only and passes it through the child environment. Never prints it.
 *   node scripts/visual-fidelity/shoot-deployed.mjs <preview-url> <out dir> <routes.json> [filter]
 */
import { execSync, spawnSync } from "node:child_process";
import path from "node:path";

const TEAM = "team_uZy8Cp91GPILsSUMAXjye0K9";
const [url, ...rest] = process.argv.slice(2);
if (!/^https:\/\/mindmosaic-exam-engine-[a-z0-9-]+-vishwas2018s-projects\.vercel\.app$/.test(url || "")) {
  console.error("ABORT: first argument must be a DEV Preview URL");
  process.exit(2);
}
const project = JSON.parse(
  execSync(`vercel api "/v9/projects/mindmosaic-exam-engine?teamId=${TEAM}"`, {
    encoding: "utf8",
    maxBuffer: 1 << 26,
    stdio: ["ignore", "pipe", "ignore"],
  }),
);
const pb = project.protectionBypass || {};
const secret = Object.keys(pb).find((k) => pb[k].scope === "automation-bypass");
if (!secret) {
  console.error("ABORT: no automation bypass configured");
  process.exit(2);
}
const r = spawnSync(process.execPath, [path.join(import.meta.dirname, "shoot-app.mjs"), url, ...rest], {
  stdio: "inherit",
  env: { ...process.env, VERCEL_AUTOMATION_BYPASS_SECRET: secret },
});
process.exit(r.status ?? 1);
