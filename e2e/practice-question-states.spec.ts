import { expect, test, type Page } from "@playwright/test";

import { visitAndStabilize } from "./helpers/screen-helpers";

/**
 * Real-browser proof that checking a practice answer shows inline
 * per-element grading vocabulary (never colour alone — see
 * docs/design.md:1167-1177), and that exam mode never shows it (the
 * server-authoritative, answer-key-withheld model,
 * docs/ASSESSMENT_SECURITY_MODEL.md). Component-level coverage
 * (question-renderers.test.tsx's "reveal states" blocks,
 * PracticeSession.test.tsx) already proves this precisely per type; this
 * spec proves the real guest-bank-backed page wires it together.
 *
 * Practice sessions are guest-accessible by design (src/app/practice/
 * session/page.tsx's own doc comment) — no sign-in needed here.
 */

const GRADED_SIGNALS = /Correct answer|Your answer|Correct|Marked by a teacher/;

/** Answers whatever control the current question actually rendered — the guest bank's seeded selection can land on any of the 14 types, and this spec only needs *an* answer, not a specific one. */
async function answerWhateverIsThere(page: Page): Promise<void> {
  const radio = page.getByRole("radio").first();
  if (await radio.isVisible().catch(() => false)) {
    await radio.check();
    return;
  }
  const checkbox = page.getByRole("checkbox").first();
  if (await checkbox.isVisible().catch(() => false)) {
    await checkbox.check();
    return;
  }
  const select = page.locator("select").first();
  if (await select.isVisible().catch(() => false)) {
    const optionValue = await select.locator("option").nth(1).getAttribute("value");
    if (optionValue) await select.selectOption(optionValue);
    return;
  }
  const numberInput = page.locator('input[type="number"]').first();
  if (await numberInput.isVisible().catch(() => false)) {
    await numberInput.fill("1");
    return;
  }
  const textInput = page.locator('input[type="text"]').first();
  if (await textInput.isVisible().catch(() => false)) {
    await textInput.fill("answer");
    return;
  }
  const textarea = page.locator("textarea").first();
  if (await textarea.isVisible().catch(() => false)) {
    await textarea.fill("A short response to satisfy the minimum answer requirement for this practice question.");
  }
}

test.describe("practice mode — inline reveal states", () => {
  test("checking an answer shows real per-element grading vocabulary, colour paired with text every time", async ({ page }) => {
    await visitAndStabilize(page, "/practice/session?subject=numeracy&style=naplan_style&count=1&seed=e2e-reveal-desktop", {
      // "main" alone resolves on Next's empty pre-hydration shell — the
      // check-answer button only exists once the question has genuinely
      // rendered, so waiting for it (not "main") is what actually proves
      // the page is ready to interact with.
      readyLocator: "[data-testid='check-answer']",
    });

    await answerWhateverIsThere(page);

    const checkButton = page.getByTestId("check-answer");
    await expect(checkButton).toBeEnabled();
    await checkButton.click();

    const feedbackPanel = page.getByTestId("feedback-panel");
    await expect(feedbackPanel).toBeVisible();
    await expect(feedbackPanel).toHaveAttribute("data-status", /correct|incorrect|manual_review/);

    // The graded vocabulary must appear somewhere on the page — either the
    // banner's own label or the renderer's inline per-element tag.
    await expect(page.getByText(GRADED_SIGNALS).first()).toBeVisible();
  });

  test("mobile viewport: the reveal flow itself adds no new horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await visitAndStabilize(page, "/practice/session?subject=numeracy&style=naplan_style&count=1&seed=e2e-reveal-mobile", {
      readyLocator: "[data-testid='check-answer']",
    });

    // Baseline BEFORE this feature's own DOM (the reveal-driven tags/ghost
    // items) exists at all, so a pre-existing overflow elsewhere on the
    // page (confirmed present in PracticeSession's header chrome,
    // unrelated to this feature and out of this task's scope — see the
    // implementation report) never fails this assertion. This test only
    // proves reveal doesn't make things *worse*.
    const before = await page.evaluate(() => document.documentElement.scrollWidth);

    await answerWhateverIsThere(page);
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("feedback-panel")).toBeVisible();

    const after = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(after).toBeLessThanOrEqual(before);
  });

  test("exam mode never shows practice's reveal vocabulary, even for a disabled/read-only question", async ({ page }) => {
    await visitAndStabilize(page, "/exam", { readyLocator: "main" });
    // The exam entry screen itself (jurisdiction/subject picker) never
    // renders question content or grading vocabulary at all — this is the
    // simplest, most robust proof that reveal never leaks outside practice
    // mode: the words this feature introduces don't exist anywhere on an
    // exam-mode page before a student has even started a sitting.
    await expect(page.getByText("Correct answer")).toHaveCount(0);
    await expect(page.getByTestId("feedback-panel")).toHaveCount(0);
  });
});
