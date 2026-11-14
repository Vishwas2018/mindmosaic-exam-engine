#!/usr/bin/env node
/**
 * Launches the hosted DEV acceptance suite (playwright.hosted.config.ts) against a DEV Preview.
 *
 *   node scripts/hosted-acceptance/run.mjs <preview-url> [--env <path to .env.local>] [-- <playwright args>]
 *
 * - Refuses anything but a mindmosaic-exam-engine DEV Preview URL and the DEV Supabase project.
 * - Reads the automation-bypass secret from the Vercel project API (logged-in `vercel` CLI) into memory only,
 *   checks it is accepted, and hands it to Playwright through the child's environment.
 * - Reads NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from the env file without printing them.
 * - Writes the deployment's commit SHA next to the report so evidence is tied to a build.
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const TEAM = "team_uZy8Cp91GPILsSUMAXjye0K9";
const DEV_REF = "mfglzabnayacssgertat";
const args = process.argv.slice(2);
const sep = args.indexOf("--");
const own = sep === -1 ? args : args.slice(0, sep);
const pwArgs = sep === -1 ? [] : args.slice(sep + 1);
const url = own[0];
const envIdx = own.indexOf("--env");
const envFile = envIdx === -1 ? path.resolve(".env.local") : own[envIdx + 1];

if (!/^https:\/\/mindmosaic-exam-engine-[a-z0-9-]+-vishwas2018s-projects\.vercel\.app$/.test(url || "")) {
  console.error("ABORT: first argument must be a DEV Preview URL");
  process.exit(2);
}

const env = {};
for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
if (env.NEXT_PUBLIC_SUPABASE_URL !== `https://${DEV_REF}.supabase.co` || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ABORT: env file is not bound to DEV Supabase or lacks the service role key");
  process.exit(2);
}

const host = new URL(url).host;
const dep = JSON.parse(
  execSync(`vercel api "/v13/deployments/${host}?teamId=${TEAM}"`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }),
);
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
  console.error("ABORT: no automation bypass configured on the project");
  process.exit(2);
}

await (async () => {
  const r = await fetch(`${url}/`, { redirect: "manual", headers: { "x-vercel-protection-bypass": secret } });
  if (r.status === 401 || (r.status >= 300 && r.status < 400 && /vercel\.com\/sso/.test(r.headers.get("location") || ""))) {
    console.error(`ABORT: bypass not accepted (status ${r.status})`);
    process.exit(3);
  }
  const runId = `r${Date.now().toString(36)}`;
  const outDir = path.resolve("test-results", "hosted", runId);
  fs.mkdirSync(outDir, { recursive: true });
  const meta = {
    runId,
    url,
    deploymentId: dep.id,
    target: dep.target || "preview",
    ref: dep.meta && dep.meta.githubCommitRef,
    sha: dep.meta && dep.meta.githubCommitSha,
    supabase: DEV_REF,
    startedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(outDir, "deployment.json"), JSON.stringify(meta, null, 2));
  console.log(`hosted acceptance ${runId}: ${meta.ref} ${String(meta.sha).slice(0, 8)} ${dep.id}`);
  const res = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["playwright", "test", "-c", "playwright.hosted.config.ts", ...pwArgs],
    {
      stdio: "inherit",
      shell: process.platform === "win32",
      env: {
        ...process.env,
        HOSTED_URL: url,
        HOSTED_RUN_ID: runId,
        HOSTED_OUTPUT: outDir,
        HOSTED_REPORT: path.join(outDir, "report.json"),
        NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
        VERCEL_AUTOMATION_BYPASS_SECRET: secret,
        HOSTED_MAIL_BASE: process.env.HOSTED_MAIL_BASE || "",
      },
    },
  );
  process.exit(res.status ?? 1);
})();
