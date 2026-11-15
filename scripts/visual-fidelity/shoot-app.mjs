#!/usr/bin/env node
/**
 * Screenshots real application routes, signed in as a real DEV account, at desktop / tablet / mobile widths.
 *
 *   node scripts/visual-fidelity/shoot-app.mjs <base-url> <out dir> <routes.json> [filter regex]
 *
 * routes.json: [{ "id": "auth-05-signup", "path": "/sign-up", "as": "anon" | "parent" | "student" }]
 * Credentials come from the environment only: VF_PARENT_EMAIL, VF_PARENT_PASSWORD, VF_STUDENT_CODE, VF_STUDENT_PIN.
 * For a protected Vercel Preview, VERCEL_AUTOMATION_BYPASS_SECRET is sent to that host only.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const [base, out, routesFile, filter] = process.argv.slice(2);
const re = filter ? new RegExp(filter, "i") : null;
const routes = JSON.parse(fs.readFileSync(routesFile, "utf8")).filter((r) => !re || re.test(r.id));
const WIDTHS = (process.env.VF_WIDTHS ?? "1440,834,390").split(",").map(Number);
const origin = new URL(base).origin;
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

const browser = await chromium.launch();

async function newContext(width) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 1000 }, baseURL: base });
  if (bypass) {
    await ctx.route((u) => u.origin === origin, (route) =>
      route.continue({ headers: { ...route.request().headers(), "x-vercel-protection-bypass": bypass } }),
    );
  }
  return ctx;
}

async function signIn(page, as) {
  if (as === "parent") {
    await page.goto("/sign-in?role=parent");
    const parentTab = page.getByRole("tab", { name: /parent/i });
    if (await parentTab.isVisible().catch(() => false)) await parentTab.click();
    await page.getByLabel(/email/i).first().fill(process.env.VF_PARENT_EMAIL);
    await page.getByLabel(/password/i).first().fill(process.env.VF_PARENT_PASSWORD);
    await page.getByRole("button", { name: /^sign in/i }).first().click();
    await page.waitForURL(/\/parent/, { timeout: 45_000 });
  } else if (as === "student") {
    await page.goto("/student-sign-in");
    await page.getByLabel("Login code").fill(process.env.VF_STUDENT_CODE);
    await page.waitForFunction(() => document.querySelectorAll('[aria-label^="Your PIN, number"]').length === 6);
    await page.getByLabel(/^Your PIN, number 1 of 6/).click();
    await page.keyboard.type(process.env.VF_STUDENT_PIN);
    await page.getByRole("button", { name: /^sign in/i }).first().click();
    await page.waitForURL(/\/student$/, { timeout: 45_000 });
  }
}

const sessions = {};
for (const width of WIDTHS) {
  for (const as of [...new Set(routes.map((r) => r.as))]) {
    const ctx = await newContext(width);
    const page = await ctx.newPage();
    try {
      await signIn(page, as);
    } catch (e) {
      console.log(`SIGN-IN FAILED as ${as} @${width}: ${e.message.split("\n")[0]}`);
    }
    sessions[`${as}@${width}`] = { ctx, page };
  }
  for (const r of routes) {
    const { page } = sessions[`${r.as}@${width}`];
    const o = path.join(out, `${r.id}@${width}.png`);
    fs.mkdirSync(path.dirname(o), { recursive: true });
    try {
      const res = await page.goto(r.path, { waitUntil: "networkidle", timeout: 60_000 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: o, fullPage: true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      console.log(`shot ${r.id}@${width} status=${res?.status()} url=${new URL(page.url()).pathname} overflowX=${overflow}`);
    } catch (e) {
      console.log(`FAIL ${r.id}@${width}: ${e.message.split("\n")[0]}`);
    }
  }
  for (const k of Object.keys(sessions)) {
    await sessions[k].ctx.close();
    delete sessions[k];
  }
}
await browser.close();
