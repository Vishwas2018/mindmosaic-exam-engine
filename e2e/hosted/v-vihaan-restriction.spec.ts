/**
 * Scenario V — the Vihaan Scholarship Prep pilot is refused to every account that is not on
 * the deployment's allowlist. Uses family A from Scenarios A–C (synthetic, not allowlisted) and an anonymous visitor.
 */
import fs from "node:fs";
import path from "node:path";

import type { BrowserContext, Page } from "@playwright/test";

import { api, enterStudentCredentials, expect, parentSignIn, protectContext, test } from "./fixtures";

type Family = { email: string; password: string; childName: string; loginCode: string; pin: string };
const famFile = () =>
  process.env.FAMILY_FILE ?? path.join(process.env.HOSTED_OUTPUT ?? "test-results/hosted", "family-a.json");

async function freshPage(context: BrowserContext): Promise<Page> {
  const ctx = await context.browser()!.newContext({ viewport: { width: 1440, height: 900 } });
  await protectContext(ctx);
  return ctx.newPage();
}

test("V: Vihaan pilot routes and API refuse non-allowlisted parents, students and anonymous visitors", async ({
  page,
  context,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  const A = JSON.parse(fs.readFileSync(famFile(), "utf8")) as Family;
  const evidence: Record<string, unknown> = {};

  // Anonymous
  const anon = await freshPage(context);
  await anon.goto("/student/vihaan");
  await expect(anon).not.toHaveURL(/\/student\/vihaan/);
  evidence.anon_student_vihaan = new URL(anon.url()).pathname;
  await anon.goto("/parent/vihaan");
  await expect(anon).not.toHaveURL(/\/parent\/vihaan$/);
  evidence.anon_parent_vihaan = new URL(anon.url()).pathname;
  const anonPost = await api(anon).post("/api/student/vihaan/attempt", { responses: [] });
  expect(anonPost.status()).toBe(401);
  evidence.anon_api = anonPost.status();

  // Parent A (not allowlisted)
  await parentSignIn(page, A.email, A.password);
  await expect(page).toHaveURL(/\/parent/, { timeout: 30_000 });
  await expect(page.locator('a[href^="/parent/vihaan"]')).toHaveCount(0);
  await page.goto("/parent/vihaan");
  await expect(page).toHaveURL(/\/parent\/?$/);
  evidence.parent_vihaan = new URL(page.url()).pathname;

  // Student A (not allowlisted)
  const s = await freshPage(context);
  await s.goto("/sign-in");
  await s.getByRole("button", { name: /I'm a student/i }).click();
  await enterStudentCredentials(s, A.loginCode, A.pin);
  await s.getByRole("button", { name: /sign in/i }).last().click();
  await expect(s).toHaveURL(/\/student$/, { timeout: 30_000 });
  await expect(s.locator('a[href^="/student/vihaan"]')).toHaveCount(0);
  for (const p of ["/student/vihaan", "/student/vihaan/diagnostic"]) {
    await s.goto(p);
    await expect(s).toHaveURL(/\/student$/);
    evidence[`student${p}`] = new URL(s.url()).pathname;
  }
  const post = await api(s).post("/api/student/vihaan/attempt", { responses: [] });
  expect(post.status()).toBe(403);
  evidence.student_api = `${post.status()} ${JSON.stringify(await post.json())}`;

  fs.writeFileSync(
    path.join(process.env.HOSTED_OUTPUT ?? "test-results/hosted", "evidence-v.json"),
    JSON.stringify(evidence, null, 2),
  );
});
