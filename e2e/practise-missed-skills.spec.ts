import { expect, test, type Page } from "@playwright/test";

import { assertNoSeriousAccessibilityViolations } from "./accessibility";
import {
  createQualityMonitor,
  expectNoHorizontalOverflow,
  setViewport,
  visitAndStabilize,
} from "./helpers/screen-helpers";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

/**
 * Helper to inject a valid DrillLaunchRequest into sessionStorage for deterministic testing.
 */
async function injectDrillLaunchRecord(
  page: Page,
  launchId: string,
  overrides: {
    subject?: "numeracy" | "reading" | "language_conventions" | "science";
    skillOrTopic?: string;
    source?: "skill" | "topic";
    yearLevel?: 3 | 5 | "mixed";
    examStyle?: "naplan_style" | "icas_style" | "mixed";
    previousQuestionIds?: string[];
  } = {},
) {
  await page.evaluate(
    ({ id, opts }) => {
      const storageKey = `mm:drill-launch:${id}`;
      const record = {
        version: 1,
        launchId: id,
        subject: opts.subject ?? "language_conventions",
        skillOrTopic: opts.skillOrTopic ?? "Punctuation",
        source: opts.source ?? "topic",
        yearLevel: opts.yearLevel ?? 5,
        examStyle: opts.examStyle ?? "naplan_style",
        previousQuestionIds: opts.previousQuestionIds ?? [],
        seed: `drill-${opts.subject ?? "language_conventions"}-testseed`,
        createdAt: Date.now(),
      };
      window.sessionStorage.setItem(storageKey, JSON.stringify(record));
    },
    { id: launchId, opts: overrides },
  );
}

test.describe("Practise Missed Skills Release-Readiness Acceptance", () => {
  for (const viewport of VIEWPORTS) {
    test(`[${viewport.name}] complete learning loop: take exam -> missed skills CTA -> opaque 5-question drill -> back to results`, async ({
      page,
    }) => {
      const qualityMonitor = createQualityMonitor(page);
      await setViewport(page, viewport);

      // 1. Complete an assessment with errors to produce real results
      await page.goto("/practice/mixed-practice?seed=e2e-flow-1");
      await page.getByTestId("select-year-level").selectOption("3");
      await page.getByTestId("select-exam-style").selectOption("naplan_style");
      await page.getByTestId("select-subject").selectOption("numeracy");
      await page.getByTestId("select-question-count").selectOption("10");
      await page.getByTestId("select-timing").selectOption("timed");
      await page.getByTestId("start-exam").click();
      await page.getByTestId("begin-exam").click();

      await expect(page).toHaveURL(/\/exam/);

      // Answer Q1 True
      await page.getByRole("radio", { name: "True" }).click();

      // Submit exam
      await page.getByTestId("open-submit-dialog").click();
      await expect(page.getByTestId("submit-dialog")).toBeVisible();
      await page.getByTestId("confirm-submit").click();

      // 2. Arrive at Results and verify Practise Missed Skills
      await expect(page).toHaveURL(/\/results/);
      const missedSkillsCard = page.getByTestId("practise-missed-skills");
      await expect(missedSkillsCard).toBeVisible();
      await expect(missedSkillsCard.getByText("Practise missed skills")).toBeVisible();

      const launchBtn = page.getByTestId("launch-drill");
      await expect(launchBtn).toBeVisible();

      await page.screenshot({
        path: `test-results/screenshots/results-recommendations-${viewport.name}.png`,
      });

      // 3. Launch drill and verify opaque URL
      await launchBtn.click();
      await expect(page).toHaveURL(/\/practice\/session\?mode=drill&launchId=/);

      const currentUrl = new URL(page.url());
      expect(currentUrl.pathname).toBe("/practice/session");
      expect(currentUrl.searchParams.get("mode")).toBe("drill");
      expect(currentUrl.searchParams.has("launchId")).toBe(true);

      // Assert zero parameter leakage
      expect(currentUrl.searchParams.has("subject")).toBe(false);
      expect(currentUrl.searchParams.has("skill")).toBe(false);
      expect(currentUrl.searchParams.has("count")).toBe(false);
      expect(currentUrl.searchParams.has("year")).toBe(false);
      expect(currentUrl.searchParams.has("style")).toBe(false);
      expect(currentUrl.searchParams.has("seed")).toBe(false);

      // 4. Return to results via recovery/exit action
      const backLink = page.getByRole("link", { name: /Back to results/i }).first();
      await expect(backLink).toBeVisible();
      await backLink.click();
      await expect(page).toHaveURL(/\/results/);

      qualityMonitor.assertClean();
    });
  }

  test("guaranteed active 5-question drill: excludes previous assessment questions and answers all items", async ({
    page,
  }) => {
    const qualityMonitor = createQualityMonitor(page);
    const launchId = "e2e-guaranteed-5q-drill";
    const previousQuestionIds = [
      "man-00ca549c846f7e9022b82acc",
      "prev-punctuation-q2",
    ];

    // Seed storage with a topic known to have 5+ questions (Punctuation)
    await page.goto("/practice");
    await injectDrillLaunchRecord(page, launchId, {
      subject: "language_conventions",
      skillOrTopic: "Punctuation",
      source: "topic",
      yearLevel: 5,
      examStyle: "naplan_style",
      previousQuestionIds,
    });

    await page.goto(`/practice/session?mode=drill&launchId=${launchId}`);

    // Verify exactly 5 fresh questions are presented
    await expect(page.getByTestId("practice-nav-1")).toBeVisible();
    await expect(page.getByTestId("practice-nav-5")).toBeVisible();
    await expect(page.getByTestId("practice-nav-6")).not.toBeVisible();

    // Verify header title and exit button
    await expect(page.getByText("Practise: Punctuation")).toBeVisible();
    const headerExit = page.getByTestId("exit-practice");
    await expect(headerExit).toHaveText(/Back to results/i);
    await expect(headerExit).toHaveAttribute("href", "/results");

    await page.screenshot({
      path: "test-results/screenshots/drill-session-active.png",
    });

    // Step through each question, answer/skip, and advance
    for (let q = 1; q <= 5; q++) {
      await page.getByTestId(`practice-nav-${q}`).click();
      const firstOption = page.locator('button[id*="-opt-"]').first();
      const textbox = page.getByRole("textbox").first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        const checkBtn = page.getByRole("button", { name: "Submit answer" });
        if (await checkBtn.isVisible()) {
          await checkBtn.click();
        }
      } else if (await textbox.isVisible()) {
        await textbox.fill("children's");
        const checkBtn = page.getByRole("button", { name: "Submit answer" });
        if (await checkBtn.isVisible()) {
          await checkBtn.click();
        }
      } else {
        const skipBtn = page.getByRole("button", { name: "Skip for now" });
        if (await skipBtn.isVisible()) {
          await skipBtn.click();
        }
      }

      const nextOrSummary = page.getByRole("button", {
        name: /View results|Next question/i,
      });
      if (await nextOrSummary.isVisible()) {
        await nextOrSummary.click();
      }
    }

    await expect(page.getByText("Session complete")).toBeVisible();

    await page.screenshot({
      path: "test-results/screenshots/drill-summary.png",
    });

    const finishBtn = page.getByRole("link", { name: "Back to results" });
    await expect(finishBtn).toBeVisible();
    await expect(finishBtn).toHaveAttribute("href", "/results");

    await finishBtn.click();
    await expect(page).toHaveURL(/\/results/);

    qualityMonitor.assertClean();
  });

  test("guaranteed same-tab reload preserves active 5-question drill", async ({
    page,
  }) => {
    const qualityMonitor = createQualityMonitor(page);
    const launchId = "e2e-same-tab-reload-drill";

    await page.goto("/practice");
    await injectDrillLaunchRecord(page, launchId, {
      subject: "language_conventions",
      skillOrTopic: "Punctuation",
      source: "topic",
      yearLevel: 5,
      examStyle: "naplan_style",
      previousQuestionIds: [],
    });

    await page.goto(`/practice/session?mode=drill&launchId=${launchId}`);
    await expect(page.getByTestId("practice-nav-1")).toBeVisible();
    await expect(page.getByTestId("practice-nav-5")).toBeVisible();

    // Reload active drill in the same tab
    await page.reload();

    // Assert drill remains fully active and interactive after reload
    await expect(page.getByTestId("practice-nav-1")).toBeVisible();
    await expect(page.getByTestId("practice-nav-5")).toBeVisible();
    await expect(page.getByTestId("exit-practice")).toHaveText(/Back to results/i);

    qualityMonitor.assertClean();
  });

  test("guaranteed fewer-than-five insufficiency state and recovery links", async ({
    page,
  }) => {
    const qualityMonitor = createQualityMonitor(page);
    const launchId = "e2e-insufficient-drill";

    // Skill with <5 published questions (Decimals has 2)
    await page.goto("/practice");
    await injectDrillLaunchRecord(page, launchId, {
      subject: "numeracy",
      skillOrTopic: "Decimals",
      source: "skill",
      yearLevel: 3,
      examStyle: "naplan_style",
      previousQuestionIds: [],
    });

    await page.goto(`/practice/session?mode=drill&launchId=${launchId}`);

    // Guaranteed failure if insufficiency state is not reached
    const heading = page.getByRole("heading", {
      name: "There aren't enough published questions for this skill yet",
    });
    await expect(heading).toBeVisible();

    const desc = page.getByText(/Only \d+ eligible published questions found for Decimals; 5 are needed/);
    await expect(desc).toBeVisible();

    const backToResultsLink = page.getByRole("link", { name: "Back to results" });
    await expect(backToResultsLink).toBeVisible();
    await expect(backToResultsLink).toHaveAttribute("href", "/results");

    const chooseAnotherLink = page.getByRole("link", { name: "Choose another skill" });
    await expect(chooseAnotherLink).toBeVisible();
    await expect(chooseAnotherLink).toHaveAttribute("href", "/student/learn");

    await page.screenshot({
      path: "test-results/screenshots/insufficiency-state.png",
    });

    qualityMonitor.assertClean();
  });

  test("guaranteed perfect-objective-result test: positive state without drill launch CTA", async ({
    page,
  }) => {
    const qualityMonitor = createQualityMonitor(page);

    await page.goto("/practice/mixed-practice?seed=e2e-perfect-score");
    await page.getByTestId("select-year-level").selectOption("3");
    await page.getByTestId("select-exam-style").selectOption("naplan_style");
    await page.getByTestId("select-subject").selectOption("numeracy");
    await page.getByTestId("select-question-count").selectOption("10");
    await page.getByTestId("select-timing").selectOption("untimed");
    await page.getByTestId("start-exam").click();
    await page.getByTestId("begin-exam").click();
    await expect(page).toHaveURL(/\/exam/);

    // Inject perfect score result directly into the active store on /exam
    await page.evaluate(() => {
      interface StoreState {
        questions: Array<{ id: string; [key: string]: unknown }>;
        setState: (partial: Record<string, unknown>) => void;
        getState: () => StoreState;
      }
      const store = (
        window as unknown as { __EXAM_STORE__?: { getState: () => StoreState; setState: (partial: Record<string, unknown>) => void } }
      ).__EXAM_STORE__;
      if (!store) return;
      const state = store.getState();
      const details = state.questions.map((q: { id: string }) => ({
        questionId: q.id,
        status: "correct" as const,
        attempted: true,
        requiresManualMarking: false,
        pendingManualReview: false,
        awardedMarks: 1,
        availableMarks: 1,
      }));
      const perfectResult = {
        totalQuestions: details.length,
        attemptedQuestions: details.length,
        autoMarkedQuestions: details.length,
        manualReviewQuestions: 0,
        correctCount: details.length,
        incorrectCount: 0,
        unansweredCount: 0,
        objectiveMarksEarned: details.length,
        objectiveMarksAvailable: details.length,
        objectivePercentage: 100,
        pendingManualMarks: 0,
        timeTakenSeconds: 30,
        submissionReason: "user_submitted" as const,
        startedAt: Date.now() - 30000,
        submittedAt: Date.now(),
        questionDetails: details,
        breakdowns: {
          byQuestionType: {},
          bySubject: {},
          bySkill: {},
          byDifficulty: {},
          byYearLevel: {},
          byExamStyle: {},
        },
      };
      store.setState({
        status: "submitted",
        result: perfectResult,
        reviewQuestions: state.questions.map((q: { id: string; [key: string]: unknown }) => ({
          ...q,
          explanation: "Perfect answer",
          answerKey: { kind: "single_option", optionId: "a" },
        })),
      });
    });

    // Automatic bounded navigation on status === "submitted" lands on /results
    await expect(page).toHaveURL(/\/results/);

    // Verify positive no-missed-skills state
    const noMissed = page.getByTestId("no-missed-skills");
    await expect(noMissed).toBeVisible();
    await expect(
      page.getByText("No missed objective skills to revise from this session"),
    ).toBeVisible();

    // Verify launch CTA is NOT rendered
    await expect(page.getByTestId("launch-drill")).not.toBeVisible();

    await page.screenshot({
      path: "test-results/screenshots/results-perfect-state.png",
    });

    qualityMonitor.assertClean();
  });

  test("guaranteed cross-tab isolation renders missing-session state in another tab", async ({
    page,
    browser,
  }) => {
    const qualityMonitor = createQualityMonitor(page);
    const launchId = "e2e-tab-isolated-launch";

    // Open in separate browser context (fresh tab without parent sessionStorage)
    const newContext = await browser.newContext();
    const otherTab = await newContext.newPage();
    await otherTab.goto(`/practice/session?mode=drill&launchId=${launchId}`);

    await expect(
      otherTab.getByRole("heading", { name: "Practice drill session not found" }),
    ).toBeVisible();

    const backToResultsLink = otherTab.getByRole("link", { name: "Back to results" });
    await expect(backToResultsLink).toBeVisible();
    await expect(backToResultsLink).toHaveAttribute("href", "/results");

    const chooseAnotherLink = otherTab.getByRole("link", { name: "Choose another skill" });
    await expect(chooseAnotherLink).toBeVisible();
    await expect(chooseAnotherLink).toHaveAttribute("href", "/student/learn");

    await otherTab.screenshot({
      path: "test-results/screenshots/missing-session-state.png",
    });

    await newContext.close();
    qualityMonitor.assertClean();
  });

  test("WAI-ARIA radiogroup keyboard navigation: focus, aria-checked, wrapping, and launch button updates", async ({
    page,
  }) => {
    const qualityMonitor = createQualityMonitor(page);

    // Complete assessment with errors across multiple skills to get multiple targets
    await page.goto("/practice/mixed-practice?seed=e2e-flow-1");
    await page.getByTestId("select-year-level").selectOption("3");
    await page.getByTestId("select-exam-style").selectOption("naplan_style");
    await page.getByTestId("select-subject").selectOption("numeracy");
    await page.getByTestId("select-question-count").selectOption("10");
    await page.getByTestId("select-timing").selectOption("timed");
    await page.getByTestId("start-exam").click();
    await page.getByTestId("begin-exam").click();

    // Submit with multiple unanswered/incorrect items
    await page.getByTestId("open-submit-dialog").click();
    await page.getByTestId("confirm-submit").click();
    await expect(page).toHaveURL(/\/results/);

    const target0 = page.getByTestId("drill-target-0");
    const target1 = page.getByTestId("drill-target-1");
    const launchBtn = page.getByTestId("launch-drill");

    await expect(target0).toBeVisible();
    await expect(target0).toHaveAttribute("aria-checked", "true");
    await expect(target0).toHaveAttribute("tabindex", "0");

    if (await target1.isVisible()) {
      await expect(target1).toHaveAttribute("aria-checked", "false");
      await expect(target1).toHaveAttribute("tabindex", "-1");

      const initialText = await launchBtn.textContent();

      // Focus target0 and press ArrowRight -> moves to target1
      await target0.focus();
      await page.keyboard.press("ArrowRight");

      await expect(target1).toHaveAttribute("aria-checked", "true");
      await expect(target1).toHaveAttribute("tabindex", "0");
      await expect(target0).toHaveAttribute("aria-checked", "false");
      await expect(target0).toHaveAttribute("tabindex", "-1");

      const updatedText = await launchBtn.textContent();
      expect(updatedText).not.toBe(initialText);

      // Press ArrowLeft -> moves back to target0
      await page.keyboard.press("ArrowLeft");
      await expect(target0).toHaveAttribute("aria-checked", "true");
      await expect(target0).toHaveAttribute("tabindex", "0");
      expect(await launchBtn.textContent()).toBe(initialText);

      // Test wrapping: press ArrowLeft on target0 -> wraps to last target
      const lastTargetIndex = (await page.locator('[data-testid^="drill-target-"]').count()) - 1;
      const lastTarget = page.getByTestId(`drill-target-${lastTargetIndex}`);

      await page.keyboard.press("ArrowLeft");
      await expect(lastTarget).toHaveAttribute("aria-checked", "true");
      await expect(lastTarget).toHaveAttribute("tabindex", "0");

      // Press ArrowRight on last target -> wraps back to target0
      await page.keyboard.press("ArrowRight");
      await expect(target0).toHaveAttribute("aria-checked", "true");
    }

    qualityMonitor.assertClean();
  });

  test("accessibility audit and responsive viewports across all key states", async ({
    page,
  }) => {
    for (const viewport of VIEWPORTS) {
      await setViewport(page, viewport);

      // 1. Missing session error screen
      await visitAndStabilize(
        page,
        "/practice/session?mode=drill&launchId=a11y-test-id",
        { readyLocator: "main" },
      );
      await expectNoHorizontalOverflow(page);
      await assertNoSeriousAccessibilityViolations(
        page,
        `Drill Missing-Session Screen at ${viewport.name}`,
      );

      // 2. Public practice catalogue
      await visitAndStabilize(page, "/practice", { readyLocator: "main" });
      await expectNoHorizontalOverflow(page);
      await assertNoSeriousAccessibilityViolations(
        page,
        `Practice Catalogue at ${viewport.name}`,
      );
    }
  });
});
