/**
 * Hosted DEV checks for the manual-testing findings MT-001 .. MT-005 (docs/beta-readiness/DEFECT-REGISTER.md).
 *
 * - H1 (anonymous): ICAS and AMC availability says the same thing on the landing page, the programmes pages, the
 *   practice catalogue and the paper picker, and each reads as the approved content allows.
 * - H2 (AMC): one listing per year on the picker, modules badged as modules, no duplicate catalogue entry.
 * - H3 (signed-in child, untimed sitting): no internal skill ids in the runner or results, no "time was up" wording.
 *
 * Needs the family from scenario A (family-a.json) for H3 only. Synthetic accounts, DEV only.
 */
import fs from "node:fs";
import path from "node:path";

import type { Page } from "@playwright/test";

import { enterStudentCredentials, expect, test } from "./fixtures";

const RAW_SKILL_ID = /\b(?:num|lit|lang|read|sci|core)\.[a-z0-9_-]+\.[a-z0-9_.-]+/i;

async function bodyText(page: Page, url: string): Promise<string> {
  await page.goto(url);
  await page.waitForLoadState("networkidle").catch(() => {});
  return (await page.locator("body").innerText()).replace(/\s+/g, " ");
}

test.describe("H1: availability reads the same on every public surface (MT-001, MT-002)", () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440", "content check runs once");
  });

  test("ICAS-style is not offered anywhere while its practice catalogue entries are coming soon", async ({ page }, testInfo) => {
    const practice = await bodyText(page, "/practice");
    const icasHub = await bodyText(page, "/practice/icas");
    const landing = await bodyText(page, "/");
    const programmes = await bodyText(page, "/programs");
    const icasProgramme = await bodyText(page, "/programs/icas-style");
    fs.writeFileSync(
      testInfo.outputPath("availability-text.json"),
      JSON.stringify({ practice, icasHub, landing, programmes, icasProgramme }, null, 2),
    );

    // The practice catalogue is the authority: it lists no live ICAS programme.
    const icasLive = await page.goto("/practice").then(() => page.getByRole("link", { name: /ICAS-style/ }).count());
    const catalogueSaysOpen = icasLive > 0;

    expect(landing, "landing must not say ICAS-style is available now").not.toMatch(/Available now:[^.]*ICAS/i);
    expect(landing, "landing must not say ICAS-style is open now").not.toMatch(/Open now:[^.]*ICAS/i);
    expect(programmes, "programmes page lists ICAS-style subjects as not available").toMatch(/ICAS/);
    if (!catalogueSaysOpen) {
      expect(landing).not.toMatch(/ICAS-style (Mathematics|practice)[^.]{0,40}(available|open) now/i);
      expect(icasProgramme).not.toMatch(/\bAvailable\b(?! —)/);
    }
  });

  test("AMC-style is described the same way on landing, programmes, practice and the picker", async ({ page }) => {
    const landing = await bodyText(page, "/");
    const practice = await bodyText(page, "/practice");
    const picker = await bodyText(page, "/exams");

    expect(picker).toMatch(/AMC-style/);
    // Modules exist on the picker, so no surface may call AMC wholly unavailable.
    expect(landing, "landing must not say there is no AMC-style year level open").not.toMatch(
      /AMC-style[^.]{0,80}no year level is (live|open) yet/i,
    );
    expect(practice, "practice must say modules are open, not just 'planned'").toMatch(/practice modules? open|Practice modules open/i);
    expect(practice).toMatch(/full-length papers? (are|is) not available yet/i);
  });
});

test.describe("H2: AMC has one listing per year and modules are not full papers (MT-005)", () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440", "content check runs once");
  });

  test("the paper picker lists one AMC-style sitting per year, badged as a module", async ({ page }, testInfo) => {
    await page.goto("/exams");
    await page.waitForLoadState("networkidle").catch(() => {});
    for (const year of [3, 5]) {
      const section = page.locator(`section[aria-labelledby="year-${year}-heading"]`);
      const amc = section.locator(`ul[aria-labelledby="year-${year}-amc_style-heading"] > li`);
      await expect(amc, `Year ${year} AMC listings`).toHaveCount(1);
      await expect(amc.getByText("Practice module — not a full-length paper")).toBeVisible();
    }
    await page.screenshot({ path: testInfo.outputPath("h2-exams-amc.png"), fullPage: true });
  });

  test("the practice catalogue lists AMC once", async ({ page }) => {
    const text = await bodyText(page, "/practice");
    const mentions = text.match(/Australian Maths Competition/g) ?? [];
    expect(mentions.length, "AMC named once in the practice catalogue").toBe(1);
    expect(text).not.toMatch(/AMC-style (Maths|AMC Maths)[^.]{0,30}Year \d+/i);
  });
});

test.describe("H3: an untimed sitting shows no internal ids and no time-limit wording (MT-003, MT-004)", () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440", "journey runs once");
  });

  test("start untimed, read the runner, submit, read the results", async ({ page }, testInfo) => {
    const file =
      process.env.FAMILY_FILE ?? path.join(process.env.HOSTED_OUTPUT ?? "test-results/hosted", "family-a.json");
    test.skip(!fs.existsSync(file), "needs the scenario A family");
    const fam = JSON.parse(fs.readFileSync(file, "utf8")) as { loginCode: string; pin: string };

    await page.goto("/sign-in");
    await page.getByRole("button", { name: /I'm a student/i }).click();
    await enterStudentCredentials(page, fam.loginCode, fam.pin);
    await page.getByRole("button", { name: /sign in/i }).last().click();
    await expect(page).toHaveURL(/\/student$/, { timeout: 30_000 });

    await page.goto("/practice/naplan-g3-numeracy");
    await page.getByLabel("Number of questions").selectOption({ label: "10 questions" });
    await page.getByLabel("Timing").selectOption({ label: "Untimed" });
    await page.getByRole("button", { name: "Review instructions" }).click();
    await page.getByTestId("begin-exam").click();
    await expect(page).toHaveURL(/\/exam/);
    await expect(page.getByRole("heading", { name: "Question 1 of 10" })).toBeVisible();

    const runner = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    expect(runner, "runner shows no internal skill id").not.toMatch(RAW_SKILL_ID);
    await page.screenshot({ path: testInfo.outputPath("h3-runner.png"), fullPage: true });

    await page.getByTestId("open-submit-dialog").focus();
    await page.keyboard.press("Enter");
    await page.getByTestId("confirm-submit").click();
    await expect(page).toHaveURL(/\/results/, { timeout: 30_000 });
    await expect(page.getByTestId("time-taken")).toBeVisible();

    const results = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    await page.screenshot({ path: testInfo.outputPath("h3-results.png"), fullPage: true });
    expect(results, "results show no internal skill id").not.toMatch(RAW_SKILL_ID);
    expect(results, "untimed results never say time was up").not.toMatch(/before time was up|time ran out/i);
    expect(results, "untimed results never claim a time limit").not.toMatch(/same number of questions and time limit/i);
    expect(results).toMatch(/No time limit|Untimed/);
  });
});
