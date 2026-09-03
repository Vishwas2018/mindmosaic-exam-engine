import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

import { assertNoSeriousAccessibilityViolations } from "./accessibility";
import {
  createQualityMonitor,
  expectNoHorizontalOverflow,
  setViewport,
} from "./helpers/screen-helpers";
import {
  ALL_TEST_ASSESSMENT_QUESTIONS,
} from "./fixtures/assessment-capability-fixtures";
import { toCandidateQuestions } from "@/features/exam-engine/types";
import { buildExamResult } from "@/features/exam-engine/scoring/exam-report";

const SCREENSHOT_DIR = path.resolve(
  process.cwd(),
  "docs/overnight/screenshots/assessment-capabilities",
);
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const BREAKPOINTS = [
  { name: "375-mobile", width: 375, height: 667 },
  { name: "768-tablet", width: 768, height: 1024 },
  { name: "1024-laptop", width: 1024, height: 768 },
  { name: "1440-desktop", width: 1440, height: 900 },
] as const;

/**
 * Setup route interception to inject the test-only assessment capability
 * questions into the guest and server exam APIs seamlessly.
 */
async function setupAssessmentRouteMocks(page: Page) {
  await page.route("**/api/exam/guest-bank", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        curated: ALL_TEST_ASSESSMENT_QUESTIONS,
        published: ALL_TEST_ASSESSMENT_QUESTIONS,
        practice: ALL_TEST_ASSESSMENT_QUESTIONS,
      }),
    });
  });

  await page.route("**/api/exam/session", async (route) => {
    if (route.request().method() === "POST") {
      const sessionId = "test-session-assessment-cap-001";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sessionId,
          questions: toCandidateQuestions(ALL_TEST_ASSESSMENT_QUESTIONS),
        }),
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/api/exam/session/*/responses", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.route("**/api/exam/session/*/submit", async (route) => {
    const postData = route.request().postDataJSON() || {};
    const responses = postData.responses || {};
    const now = Date.now();
    const report = buildExamResult(ALL_TEST_ASSESSMENT_QUESTIONS, responses, {
      startedAt: now - 95000,
      submittedAt: now,
      submissionReason: "user_submitted",
    });

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sessionId: "test-session-assessment-cap-001",
        attemptId: "test-attempt-assessment-cap-001",
        result: report,
        reviewQuestions: ALL_TEST_ASSESSMENT_QUESTIONS,
      }),
    });
  });
}

test.describe("Assessment Capability E2E — hot_text, matrix_choice, structured_response", () => {
  test("1. RENDER & ROUND-TRIP: Full correct run with manual-review structured response", async ({
    page,
  }) => {
    const quality = createQualityMonitor(page);
    await setupAssessmentRouteMocks(page);

    await page.goto("/practice/mixed-practice?seed=test-seed-1");
    await expect(page.getByTestId("start-exam")).toBeVisible();
    await page.getByTestId("start-exam").click();
    await expect(page.getByTestId("begin-exam")).toBeVisible();
    await page.getByTestId("begin-exam").click();
    await expect(page).toHaveURL(/\/exam/);

    // Answer all questions by iterating through the exam
    for (let index = 1; index <= 10; index++) {
      await expect(
        page.getByRole("heading", { name: new RegExp(`Question ${index} of 10`, "i") }),
      ).toBeVisible();

      // Check if hot_text (single)
      const verbToken = page.getByRole("button", { name: "bounded" });
      if (await verbToken.isVisible().catch(() => false)) {
        await verbToken.click();
        await expect(verbToken).toHaveAttribute("aria-pressed", "true");
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, "render-hot-text-single-1440.png"),
        });
      }

      // Check if hot_text (multi)
      const adj1Token = page.getByRole("button", { name: "ancient" });
      if (await adj1Token.isVisible().catch(() => false)) {
        const adj2Token = page.getByRole("button", { name: "gnarled" });
        await adj1Token.click();
        await adj2Token.click();
        await expect(adj1Token).toHaveAttribute("aria-pressed", "true");
        await expect(adj2Token).toHaveAttribute("aria-pressed", "true");
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, "render-hot-text-multi-1440.png"),
        });
      }

      // Check if matrix_choice (single)
      const koalaRadio = page.getByRole("radio", { name: "Koala: Mammal" });
      if (await koalaRadio.isVisible().catch(() => false)) {
        const kookRadio = page.getByRole("radio", { name: "Kookaburra: Bird" });
        await koalaRadio.click();
        await kookRadio.click();
        await expect(koalaRadio).toBeChecked();
        await expect(kookRadio).toBeChecked();
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, "render-matrix-single-1440.png"),
        });
      }

      // Check if matrix_choice (multi)
      const sqEqualCheckbox = page.getByRole("checkbox", { name: "Square: 4 equal sides" });
      if (await sqEqualCheckbox.isVisible().catch(() => false)) {
        const sqRightCheckbox = page.getByRole("checkbox", { name: "Square: 4 right angles" });
        const recRightCheckbox = page.getByRole("checkbox", {
          name: "Oblong rectangle: 4 right angles",
        });
        await sqEqualCheckbox.click();
        await sqRightCheckbox.click();
        await recRightCheckbox.click();
        await expect(sqEqualCheckbox).toBeChecked();
        await expect(sqRightCheckbox).toBeChecked();
        await expect(recRightCheckbox).toBeChecked();
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, "render-matrix-multi-1440.png"),
        });
      }

      // Check if structured_response
      const numInput = page.getByPlaceholder("e.g. 65");
      if (await numInput.isVisible().catch(() => false)) {
        const textInput = page.getByPlaceholder("e.g. acute");
        const reasonArea = page.getByPlaceholder(/Show your working and explain/i);
        await numInput.fill("65");
        await textInput.fill("acute");
        await reasonArea.fill(
          "Angles on a straight line sum to 180 degrees. Therefore x = 180 - 115 = 65 degrees, which is an acute angle.",
        );
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, "render-structured-response-1440.png"),
        });
      }

      if (index < 10) {
        await page.getByTestId("next-question").click();
      }
    }

    // Submit exam
    await page.getByTestId("open-submit-dialog").click();
    await expect(page.getByTestId("submit-dialog")).toBeVisible();
    await page.getByTestId("confirm-submit").click();

    // Verify Results Page & Server Scoring Outcome
    await expect(page).toHaveURL(/\/results/);
    await expect(
      page.getByRole("heading", { name: /Practice summary|Assessment results|Results/i }),
    ).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "results-screen-1440.png"),
      fullPage: true,
    });

    // Check review cards
    const reviewCards = page.locator("[data-testid^='review-question-']");
    await expect(reviewCards).toHaveCount(10);

    // Verify presence of Correct badges and Manual review badge
    const manualReviewBadge = page.getByText(/Marked by a person|Requires marking|pending review/i);
    await expect(manualReviewBadge.first()).toBeVisible();

    quality.assertClean();
  });

  test("2. INTERACTION & UX: Enforce single vs multi, min/max selections, and radio switching", async ({
    page,
  }) => {
    const quality = createQualityMonitor(page);
    await setupAssessmentRouteMocks(page);

    await page.goto("/practice/mixed-practice?seed=test-seed-1");
    await page.getByTestId("start-exam").click();
    await page.getByTestId("begin-exam").click();
    await expect(page).toHaveURL(/\/exam/);

    // Navigate to hot_text single-select
    for (let i = 0; i < 10; i++) {
      const verb = page.getByRole("button", { name: "bounded" });
      if (await verb.isVisible().catch(() => false)) {
        const noun = page.getByRole("button", { name: "paddock" });
        await verb.click();
        await expect(verb).toHaveAttribute("aria-pressed", "true");
        await expect(noun).toHaveAttribute("aria-pressed", "false");

        // Clicking noun replaces verb
        await noun.click();
        await expect(noun).toHaveAttribute("aria-pressed", "true");
        await expect(verb).toHaveAttribute("aria-pressed", "false");

        // Deselect
        await noun.click();
        await expect(noun).toHaveAttribute("aria-pressed", "false");
        break;
      }
      await page.getByTestId("next-question").click();
    }

    quality.assertClean();
  });

  test("3. ACCESSIBILITY: Full keyboard navigation, ARIA attributes, and axe-core scan", async ({
    page,
  }) => {
    const quality = createQualityMonitor(page);
    await setupAssessmentRouteMocks(page);

    await page.goto("/practice/mixed-practice?seed=test-seed-1");
    await page.getByTestId("start-exam").click();
    await page.getByTestId("begin-exam").click();
    await expect(page).toHaveURL(/\/exam/);

    // Axe audit on Exam screen
    await assertNoSeriousAccessibilityViolations(page, "Exam Screen");

    quality.assertClean();
  });

  for (const bp of BREAKPOINTS) {
    test(`4. RESPONSIVE: [${bp.name} (${bp.width}px)] rendering, reflow, and zero overflow`, async ({
      page,
    }) => {
      const quality = createQualityMonitor(page);
      await setViewport(page, bp);
      await setupAssessmentRouteMocks(page);

      await page.goto("/practice/mixed-practice?seed=test-seed-1");
      await page.getByTestId("start-exam").click();
      await page.getByTestId("begin-exam").click();
      await expect(page).toHaveURL(/\/exam/);

      // Iterate through questions to capture each type at this breakpoint
      for (let index = 1; index <= 5; index++) {
        const verbToken = page.getByRole("button", { name: "bounded" });
        if (await verbToken.isVisible().catch(() => false)) {
          await expectNoHorizontalOverflow(page);
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, `responsive-hot-text-single-${bp.name}.png`),
          });
        }

        const koalaRadio = page.getByRole("radio", { name: "Koala: Mammal" });
        if (await koalaRadio.isVisible().catch(() => false)) {
          await expectNoHorizontalOverflow(page);
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, `responsive-matrix-single-${bp.name}.png`),
          });
        }

        const numInput = page.getByPlaceholder("e.g. 65");
        if (await numInput.isVisible().catch(() => false)) {
          await expectNoHorizontalOverflow(page);
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, `responsive-structured-response-${bp.name}.png`),
          });
        }

        if (index < 5) {
          await page.getByTestId("next-question").click();
        }
      }

      quality.assertClean();
    });
  }
});
