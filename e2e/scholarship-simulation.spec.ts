import { expect, test, type Page } from "@playwright/test";
import { ALL_TEST_SCHOLARSHIP_QUESTIONS } from "./fixtures/scholarship-fixtures";
import { toCandidateQuestions } from "@/features/exam-engine/types";
import { buildExamResult } from "@/features/exam-engine/scoring/exam-report";

async function setupScholarshipRouteMocks(page: Page, options?: { confidenceMode?: boolean }) {
  const confidenceMode = options?.confidenceMode ?? false;

  await page.route("**/api/exam/guest-bank", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        curated: ALL_TEST_SCHOLARSHIP_QUESTIONS,
        published: ALL_TEST_SCHOLARSHIP_QUESTIONS,
        practice: ALL_TEST_SCHOLARSHIP_QUESTIONS,
      }),
    });
  });

  await page.route("**/api/exam/session", async (route) => {
    if (route.request().method() === "POST") {
      const sessionId = "test-session-scholarship-001";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sessionId,
          questions: toCandidateQuestions(ALL_TEST_SCHOLARSHIP_QUESTIONS, {
            confidenceMode,
          }),
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
    const report = buildExamResult(ALL_TEST_SCHOLARSHIP_QUESTIONS, responses, {
      startedAt: now - 60000,
      submittedAt: now,
      submissionReason: "user_submitted",
    });

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sessionId: "test-session-scholarship-001",
        attemptId: "test-attempt-scholarship-001",
        result: report,
        reviewQuestions: ALL_TEST_SCHOLARSHIP_QUESTIONS,
      }),
    });
  });
}

test.describe("Scholarship-style practice simulation and Confidence Mode", () => {
  test("Timed simulation: runs with timer active, hides explanations during attempt, submits to results", async ({
    page,
  }) => {
    await setupScholarshipRouteMocks(page, { confidenceMode: false });

    await page.goto("/practice/mixed-practice?seed=scholarship-test-seed");
    await expect(page.getByTestId("start-exam").first()).toBeVisible();
    await page.getByTestId("start-exam").first().click();
    await expect(page.getByTestId("begin-exam")).toBeVisible();
    await page.getByTestId("begin-exam").click();

    await expect(page).toHaveURL(/\/exam/);
    await expect(page.getByTestId("exam-timer")).toBeVisible();

    // Check Question 1: multiple choice options rendered
    await expect(page.getByRole("heading", { name: /Question 1 of/i })).toBeVisible();

    // In timed simulation, explanation is not shown before or after answering
    await expect(page.getByTestId("confidence-mode-explanation")).not.toBeVisible();

    const optionA = page.getByRole("radio").first();
    await optionA.click({ force: true });

    // Still no explanation in timed mode
    await expect(page.getByTestId("confidence-mode-explanation")).not.toBeVisible();

    // Move to next question
    await page.getByTestId("next-question").click();
    await expect(page.getByRole("heading", { name: /Question 2 of/i })).toBeVisible();

    // Submit the paper
    await page.getByTestId("open-submit-dialog").click();
    await expect(page.getByTestId("submit-dialog")).toBeVisible();
    await page.getByTestId("confirm-submit").click();

    await expect(page).toHaveURL(/\/results/);
    await expect(page.getByRole("heading", { level: 1, name: "Your results" })).toBeVisible();
  });

  test("Confidence Mode: untimed practice reveals step-by-step explanation immediately after answer", async ({
    page,
  }) => {
    await setupScholarshipRouteMocks(page, { confidenceMode: true });

    await page.goto("/practice/mixed-practice?confidenceMode=true&seed=confidence-test-seed");
    await expect(page.getByTestId("start-exam").first()).toBeVisible();
    await page.getByTestId("start-exam").first().click();
    await expect(page.getByTestId("begin-exam")).toBeVisible();
    await page.getByTestId("begin-exam").click();

    await expect(page).toHaveURL(/\/exam/);

    // Question 1: initially unanswered, explanation is NOT visible
    await expect(page.getByRole("heading", { name: /Question 1 of/i })).toBeVisible();
    await expect(page.getByTestId("confidence-mode-explanation")).not.toBeVisible();

    // Select an answer
    const optionA = page.getByRole("radio").first();
    await optionA.click({ force: true });

    // Explanation is revealed immediately!
    const explanationSection = page.getByTestId("confidence-mode-explanation");
    await expect(explanationSection).toBeVisible();
    await expect(explanationSection).toContainText("An ocean is fundamentally composed");

    // Move to Question 2
    await page.getByTestId("next-question").click();
    await expect(page.getByRole("heading", { name: /Question 2 of/i })).toBeVisible();

    // Q2 explanation is not visible yet
    await expect(page.getByTestId("confidence-mode-explanation")).not.toBeVisible();

    // Answer Q2
    const optionD = page.getByRole("radio").nth(3);
    await optionD.click({ force: true });

    // Q2 explanation is revealed immediately!
    await expect(page.getByTestId("confidence-mode-explanation")).toBeVisible();
    await expect(page.getByTestId("confidence-mode-explanation")).toContainText("Whisper, mumble, mutter");

    // Submit to results
    await page.getByTestId("open-submit-dialog").click();
    await page.getByTestId("confirm-submit").click();

    await expect(page).toHaveURL(/\/results/);
  });
});
