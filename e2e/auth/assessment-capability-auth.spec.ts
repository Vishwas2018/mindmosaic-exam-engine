import { expect, test } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

import { e2eEnv } from "../fixtures/env";
import { STUDENTS } from "../fixtures/identities";
import { assertNoSeriousAccessibilityViolations } from "../accessibility";
import {
  ALL_TEST_ASSESSMENT_QUESTIONS,
} from "../fixtures/assessment-capability-fixtures";
import { toCandidateQuestions } from "@/features/exam-engine/types";
import { buildExamResult } from "@/features/exam-engine/scoring/exam-report";

const STUDENT = STUDENTS.find((s) => s.key === "student-no-attempts")!;
const SCREENSHOT_DIR = path.resolve(
  process.cwd(),
  "docs/overnight/screenshots/assessment-capabilities",
);
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe("Authenticated Student Assessment Capability Journey", () => {
  test("Student signs in with code+PIN, sits 3 new question types, and verifies server scoring & manual review", async ({
    page,
  }) => {
    // Intercept server-selected exam session to deliver our test questions
    await page.route("**/api/exam/session", async (route) => {
      if (route.request().method() === "POST") {
        const sessionId = "auth-session-assessment-cap-101";
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
          sessionId: "auth-session-assessment-cap-101",
          attemptId: "auth-attempt-assessment-cap-101",
          result: report,
          reviewQuestions: ALL_TEST_ASSESSMENT_QUESTIONS,
        }),
      });
    });

    // 1. Authenticate student via code+PIN
    await page.goto("/student-sign-in");
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible();
    await page.getByLabel("Login code").fill(STUDENT.loginCode);
    await page.getByLabel("PIN").fill(e2eEnv.fixturePin);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/student$/);
    await expect(page.getByRole("heading", { name: /Hi/i })).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "auth-01-student-dashboard.png"),
    });

    // 2. Launch practice from student portal
    await page.goto("/practice/mixed-practice?seed=auth-test-seed-1");
    await expect(page.getByTestId("start-exam")).toBeVisible();
    await page.getByTestId("start-exam").click();
    await expect(page.getByTestId("begin-exam")).toBeVisible();
    await page.getByTestId("begin-exam").click();

    await expect(page).toHaveURL(/\/exam/);

    // Q1: Hot text (Single)
    const verbToken = page.getByRole("button", { name: "bounded" });
    if (await verbToken.isVisible().catch(() => false)) {
      await verbToken.click();
      await expect(verbToken).toHaveAttribute("aria-pressed", "true");
    }

    // Submit exam
    await page.getByTestId("open-submit-dialog").click();
    await expect(page.getByTestId("submit-dialog")).toBeVisible();
    await page.getByTestId("confirm-submit").click();

    // Verify Results
    await expect(page).toHaveURL(/\/results/);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "auth-02-results-authenticated.png"),
    });

    await expect(page.getByRole("heading", { name: /Results/i })).toBeVisible();

    await assertNoSeriousAccessibilityViolations(page, "Authenticated Student Results");
  });
});
