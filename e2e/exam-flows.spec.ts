import { expect, test, type Page } from "@playwright/test";

/**
 * End-to-end exam flows. Every flow passes an explicit ?seed= so the
 * deterministic selection service always produces the same questions in the
 * same order; the assertions below rely on those fixed orders.
 */

function watchConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  return errors;
}

async function configureExam(
  page: Page,
  options: {
    yearLevel: string;
    examStyle: string;
    subject: string;
    questionCount: string;
    timing: string;
  },
) {
  await page.getByTestId("select-year-level").selectOption(options.yearLevel);
  await page.getByTestId("select-exam-style").selectOption(options.examStyle);
  await page.getByTestId("select-subject").selectOption(options.subject);
  await page.getByTestId("select-question-count").selectOption(options.questionCount);
  await page.getByTestId("select-timing").selectOption(options.timing);
}

async function answerAnyInteractive(page: Page, fallbackText: string = "6") {
  const radio = page.getByRole("radio").first();
  const spinbutton = page.getByRole("spinbutton").first();
  const textbox = page.getByRole("textbox").first();
  const combobox = page.getByRole("combobox").first();

  if (await radio.isVisible()) {
    await radio.click();
  } else if (await spinbutton.isVisible()) {
    await spinbutton.fill(fallbackText);
  } else if (await textbox.isVisible()) {
    await textbox.fill(fallbackText);
  } else if (await combobox.isVisible()) {
    const options = await combobox.locator("option").all();
    if (options.length > 1) {
      const val = await options[1].getAttribute("value");
      if (val) await combobox.selectOption(val);
    }
  }
}

test("flow 1: grade 3 numeracy timed exam from setup to review", async ({ page }) => {
  const consoleErrors = watchConsole(page);

  await page.goto("/practice/mixed-practice?seed=e2e-flow-1");
  await expect(page.getByTestId("start-exam")).toBeVisible();

  await configureExam(page, {
    yearLevel: "3",
    examStyle: "naplan_style",
    subject: "numeracy",
    questionCount: "10",
    timing: "timed",
  });
  await expect(page.getByTestId("eligible-count")).toContainText("matching questions available");
  await expect(page.getByTestId("config-summary")).toContainText("Grade 3");

  await page.getByTestId("start-exam").click();

  // Setup sheet -> standard instructions page -> the exam itself.

  await page.getByTestId("begin-exam").click();
  await expect(page).toHaveURL(/\/exam/);
  await expect(page.getByTestId("exam-timer")).toContainText("15:00");
  await expect(page.getByRole("heading", { name: "Question 1 of 10" })).toBeVisible();

  /* Q1: answer with valid input. */
  await answerAnyInteractive(page, "6");

  /* Q2: answer with valid input. */
  await page.getByTestId("next-question").click();
  await expect(page.getByRole("heading", { name: "Question 2 of 10" })).toBeVisible();
  await answerAnyInteractive(page, "6");

  /* Q3: answer with valid input. */
  await page.getByTestId("next-question").click();
  await expect(page.getByRole("heading", { name: "Question 3 of 10" })).toBeVisible();
  await answerAnyInteractive(page, "6");

  /* Navigate backwards and confirm navigation works. */
  await page.getByTestId("previous-question").click();
  await page.getByTestId("previous-question").click();
  await expect(page.getByRole("heading", { name: "Question 1 of 10" })).toBeVisible();

  /* Flag question 1 for review. */
  await page.getByTestId("flag-toggle").click();
  await expect(page.getByTestId("nav-question-1")).toHaveAttribute(
    "data-flagged",
    "true",
  );
  await expect(page.getByTestId("nav-question-2")).toHaveAttribute(
    "data-nav-state",
    "answered",
  );
  await expect(page.getByTestId("nav-question-5")).toHaveAttribute(
    "data-nav-state",
    "unanswered",
  );

  /* Submit via the confirmation dialog. */
  await page.getByTestId("open-submit-dialog").click();
  await expect(page.getByTestId("submit-dialog")).toBeVisible();
  await expect(page.getByTestId("summary-total")).toHaveText("10");
  await expect(page.getByTestId("summary-answered")).toHaveText("3");
  await expect(page.getByTestId("summary-unanswered")).toHaveText("7");
  await expect(page.getByTestId("summary-flagged")).toHaveText("1");
  await expect(page.getByTestId("summary-manual")).toHaveText("0");

  /* Returning to the exam keeps everything intact. */
  await page.getByTestId("return-to-exam").click();
  await expect(page.getByTestId("submit-dialog")).not.toBeVisible();
  await page.getByTestId("open-submit-dialog").click();
  await page.getByTestId("confirm-submit").click();

  /* Results */
  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByRole("heading", { level: 1, name: "Your results" })).toBeVisible();
  await expect(page.getByTestId("result-total")).toHaveText("10");
  await expect(page.getByTestId("result-attempted")).toHaveText("3");
  await expect(page.getByTestId("time-taken")).toContainText("Time taken:");
  await expect(page.getByTestId("submission-reason")).toContainText("Submitted by you");

  /* Question review is present with statuses and flags. */
  await expect(page.getByTestId("review-question-1")).toBeVisible();
  await expect(page.getByTestId("review-question-1").getByText("Flagged")).toBeVisible();
  await expect(page.getByTestId("review-status-5")).toHaveText("Not answered");

  expect(consoleErrors).toEqual([]);
});

test("a cleared fill-blank answer stays unanswered across navigation", async ({ page }) => {
  const consoleErrors = watchConsole(page);

  await page.goto("/practice/mixed-practice?seed=e2e-fill-blank-clear");
  await configureExam(page, {
    yearLevel: "3",
    examStyle: "naplan_style",
    subject: "numeracy",
    questionCount: "full",
    timing: "untimed",
  });
  await page.getByTestId("start-exam").click();
  // Setup sheet -> standard instructions page -> the exam itself.
  await page.getByTestId("begin-exam").click();
  await expect(page).toHaveURL(/\/exam/);

  /* Find whichever question in this deterministic selection is a
     fill-blank interaction, rather than assuming a fixed position. */
  const totalQuestions = await page.locator('[data-testid^="nav-question-"]').count();
  let fillBlankIndex = -1;
  for (let index = 1; index <= totalQuestions; index += 1) {
    await page.getByTestId(`nav-question-${index}`).click();
    if ((await page.locator('input[id*="-blank-"]').count()) > 0) {
      fillBlankIndex = index;
      break;
    }
  }
  expect(fillBlankIndex).toBeGreaterThan(0);

  /* The nav button for the *current* question always shows data-nav-state
     "current"; its aria-label still distinguishes answered/not-answered
     underneath that, so assertions read the label rather than the state
     attribute while sitting on the question itself. */
  const navButton = page.getByTestId(`nav-question-${fillBlankIndex}`);
  const input = page.locator('input[id*="-blank-"]').first();

  await input.fill("42");
  await expect(navButton).toHaveAttribute("aria-label", /, answered/);

  await input.fill("");
  await expect(navButton).toHaveAttribute("aria-label", /, not answered/);

  /* Navigate away and back; the cleared state must persist, not silently
     revert to the last non-empty value. */
  const otherIndex = fillBlankIndex === 1 ? 2 : 1;
  await page.getByTestId(`nav-question-${otherIndex}`).click();
  await navButton.click();
  await expect(page.locator('input[id*="-blank-"]').first()).toHaveValue("");
  await expect(navButton).toHaveAttribute("aria-label", /, not answered/);

  expect(consoleErrors).toEqual([]);
});

test("results back navigation does not loop back into the exam", async ({ page }) => {
  const consoleErrors = watchConsole(page);

  await page.goto("/practice/mixed-practice?seed=e2e-back-nav");
  await configureExam(page, {
    yearLevel: "3",
    examStyle: "naplan_style",
    subject: "numeracy",
    questionCount: "10",
    timing: "untimed",
  });
  await page.getByTestId("start-exam").click();
  // Setup sheet -> standard instructions page -> the exam itself.
  await page.getByTestId("begin-exam").click();
  await expect(page).toHaveURL(/\/exam/);

  await page.getByTestId("open-submit-dialog").click();
  await page.getByTestId("confirm-submit").click();
  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByRole("heading", { level: 1, name: "Your results" })).toBeVisible();

  /* Submission replaces /exam with /results, so /exam never stayed in
     history — browser Back from results goes straight to the setup route
     it replaced (/practice/mixed-practice, the templated program route the
     bare configurator now lives behind), not into a redirect loop on a
     submitted exam. */
  await page.goBack();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/practice/mixed-practice");
  await expect(page.getByTestId("start-exam")).toBeVisible();

  /* No stray redirect fires after landing back on the setup page. */
  await page.waitForTimeout(1000);
  expect(new URL(page.url()).pathname).toBe("/practice/mixed-practice");

  expect(consoleErrors).toEqual([]);
});

test("navigating between questions moves focus to the new question heading", async ({ page }) => {
  const consoleErrors = watchConsole(page);

  /* Reuses flow 1's seed so the question types at each position are
     already known: Q1 drag-drop, Q2 number entry. */
  await page.goto("/practice/mixed-practice?seed=e2e-flow-1");
  await configureExam(page, {
    yearLevel: "3",
    examStyle: "naplan_style",
    subject: "numeracy",
    questionCount: "10",
    timing: "timed",
  });
  await page.getByTestId("start-exam").click();
  // Setup sheet -> standard instructions page -> the exam itself.
  await page.getByTestId("begin-exam").click();
  await expect(page).toHaveURL(/\/exam/);

  const heading1 = page.getByRole("heading", { name: "Question 1 of 10" });
  await expect(heading1).toBeVisible();
  /* Focus is not forced onto the heading on initial load — the page's own
     natural focus (body/top of document) is left alone. */
  await expect(heading1).not.toBeFocused();

  /* Next moves focus to the new question's heading. */
  await page.getByTestId("next-question").click();
  const heading2 = page.getByRole("heading", { name: "Question 2 of 10" });
  await expect(heading2).toBeVisible();
  await expect(heading2).toBeFocused();

  /* Answering the current question (Q2 is number entry) must not steal
     focus away from the control the learner is using. */
  await page.getByRole("spinbutton").focus();
  await page.getByRole("spinbutton").fill("7");
  await expect(page.getByRole("spinbutton")).toBeFocused();

  /* Previous moves focus back. */
  await page.getByTestId("previous-question").click();
  await expect(heading1).toBeFocused();

  /* The question navigation map also moves focus. */
  await page.getByTestId("nav-question-2").click();
  await expect(heading2).toBeFocused();

  expect(consoleErrors).toEqual([]);
});

test("submission dialog is behaviourally modal", async ({ page }) => {
  const consoleErrors = watchConsole(page);

  await page.goto("/practice/mixed-practice?seed=e2e-dialog-a11y");
  await configureExam(page, {
    yearLevel: "3",
    examStyle: "naplan_style",
    subject: "numeracy",
    questionCount: "10",
    timing: "untimed",
  });
  await page.getByTestId("start-exam").click();
  // Setup sheet -> standard instructions page -> the exam itself.
  await page.getByTestId("begin-exam").click();
  await expect(page).toHaveURL(/\/exam/);

  /* Open by keyboard. */
  const openButton = page.getByTestId("open-submit-dialog");
  await openButton.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByTestId("submit-dialog");
  await expect(dialog).toBeVisible();

  /* Initial focus lands inside the dialog, on the non-destructive default. */
  await expect(page.getByTestId("return-to-exam")).toBeFocused();

  /*
   * Tab cycles within the dialog rather than escaping to the page behind
   * it. Chromium's native modal focus trap briefly parks focus on <body>
   * between the last dialog control and wrapping back to the first
   * (confirmed by inspecting document.activeElement directly) rather than
   * jumping straight from one dialog button to the other, so the
   * assertion here is the guarantee that actually matters for
   * accessibility: focus is never on an interactive control outside the
   * dialog, and repeated Tabs do eventually return to a dialog control.
   */
  const dialogControlIds = new Set(["return-to-exam", "confirm-submit"]);
  const focusLocations: string[] = [];
  for (let index = 0; index < 6; index += 1) {
    await page.keyboard.press("Tab");
    const location = await page.evaluate(() => {
      const active = document.activeElement;
      return active?.getAttribute("data-testid") ?? active?.tagName ?? null;
    });
    focusLocations.push(location ?? "null");
    if (location && location !== "BODY") {
      expect(dialogControlIds.has(location)).toBe(true);
    }
  }
  expect(focusLocations.some((location) => dialogControlIds.has(location))).toBe(true);

  /* Shift+Tab also stays within the dialog (or its body waypoint), never
     landing on a background control. */
  for (let index = 0; index < 3; index += 1) {
    await page.keyboard.press("Shift+Tab");
    const location = await page.evaluate(() => {
      const active = document.activeElement;
      return active?.getAttribute("data-testid") ?? active?.tagName ?? null;
    });
    if (location && location !== "BODY") {
      expect(dialogControlIds.has(location)).toBe(true);
    }
  }
  /* Return to a known focus state before continuing. */
  await page.getByTestId("return-to-exam").focus();

  /* Background controls cannot be activated while the dialog is open —
     showModal() makes the rest of the page inert, so Playwright's
     actionability check for a real (non-forced) click never succeeds.
     flag-toggle is ordinarily enabled (unlike previous-question on Q1),
     so this genuinely exercises inertness rather than an unrelated
     disabled state. */
  await expect(
    page.getByTestId("flag-toggle").click({ timeout: 2000 }),
  ).rejects.toThrow();
  await expect(page.getByTestId("flag-toggle")).toHaveAttribute("aria-pressed", "false");

  /* Escape closes and returns focus to the button that opened it. */
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(openButton).toBeFocused();

  /* Re-open, cancel via the Keep working button, focus returns again. */
  await openButton.click();
  await expect(dialog).toBeVisible();
  await page.getByTestId("return-to-exam").click();
  await expect(dialog).not.toBeVisible();
  await expect(openButton).toBeFocused();

  /* Confirm submits exactly once. */
  await openButton.click();
  await page.getByTestId("confirm-submit").click();
  await expect(page).toHaveURL(/\/results/);

  expect(consoleErrors).toEqual([]);
});

test("flow 2: complex renderers in a mixed full-set exam", async ({ page }) => {
  const consoleErrors = watchConsole(page);

  await page.goto("/practice/mixed-practice?seed=e2e-flow-2");
  await configureExam(page, {
    yearLevel: "mixed",
    examStyle: "mixed",
    subject: "mixed",
    questionCount: "full",
    timing: "untimed",
  });
  await expect(page.getByTestId("eligible-count")).toContainText("matching");
  await page.getByTestId("start-exam").click();
  // Setup sheet -> standard instructions page -> the exam itself.
  await page.getByTestId("begin-exam").click();
  await expect(page.getByRole("heading", { name: /Question 1 of/ })).toBeVisible();

  /* Q1: answer with interactive input. */
  await answerAnyInteractive(page, "6");

  /* Q2: answer with interactive input. */
  await page.getByTestId("nav-question-2").click();
  await answerAnyInteractive(page, "6");

  /* Q3: answer with interactive input. */
  await page.getByTestId("nav-question-3").click();
  await answerAnyInteractive(page, "6");

  /* Responses survive navigating back across the exam. */
  await page.getByTestId("nav-question-1").click();
  await page.getByTestId("nav-question-2").click();
  await page.getByTestId("nav-question-3").click();

  /* Flag question 2; flags survive navigation. */
  await page.getByTestId("nav-question-2").click();
  await page.getByTestId("flag-toggle").click();
  await page.getByTestId("nav-question-3").click();
  await expect(page.getByTestId("nav-question-2")).toHaveAttribute(
    "data-flagged",
    "true",
  );

  /* Submit the exam */
  await page.getByTestId("open-submit-dialog").click();
  await expect(page.getByTestId("summary-total")).toBeVisible();
  await page.getByTestId("confirm-submit").click();

  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByTestId("review-status-1")).toBeVisible();
  await expect(page.getByTestId("review-status-2")).toBeVisible();
  await expect(page.getByTestId("review-status-3")).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("flow 3: timer expiry auto-submits once and keeps answers", async ({ page }) => {
  const consoleErrors = watchConsole(page);

  await page.clock.install();
  await page.goto("/practice/mixed-practice?seed=e2e-flow-3");
  await configureExam(page, {
    yearLevel: "3",
    examStyle: "naplan_style",
    subject: "numeracy",
    questionCount: "10",
    timing: "timed",
  });
  await page.getByTestId("start-exam").click();
  // Setup sheet -> standard instructions page -> the exam itself.
  await page.getByTestId("begin-exam").click();
  await expect(page.getByTestId("exam-timer")).toContainText("15:00");

  /* Q1: give one answer that must survive expiry. */
  await answerAnyInteractive(page, "6");

  /* Jump close to the end: warning and critical states appear. */
  await page.clock.fastForward("13:30");
  await expect(page.getByTestId("exam-timer")).toHaveAttribute(
    "data-timer-state",
    "warning",
  );
  await page.clock.fastForward("01:15");
  await expect(page.getByTestId("exam-timer")).toHaveAttribute(
    "data-timer-state",
    "critical",
  );

  /* Let the clock run past zero: the exam submits itself exactly once. */
  await page.clock.fastForward("00:30");
  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByTestId("submission-reason")).toContainText(
    "Time ran out (auto-submitted)",
  );
  await expect(page.getByTestId("result-attempted")).toHaveText("1");
  await expect(page.getByTestId("time-taken")).toContainText("15 min");

  /* The kept answer survives. */
  await expect(page.getByTestId("review-question-1")).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("flow 4: untimed exam shows no countdown but records time taken", async ({ page }) => {
  const consoleErrors = watchConsole(page);

  await page.goto("/practice/mixed-practice?seed=e2e-flow-4");
  await configureExam(page, {
    yearLevel: "3",
    examStyle: "naplan_style",
    subject: "numeracy",
    questionCount: "10",
    timing: "untimed",
  });
  await page.getByTestId("start-exam").click();
  // Setup sheet -> standard instructions page -> the exam itself.
  await page.getByTestId("begin-exam").click();
  await expect(page.getByTestId("exam-timer-untimed")).toBeVisible();
  await expect(page.getByTestId("exam-timer")).toHaveCount(0);

  /* Q1: answer one question. */
  await answerAnyInteractive(page, "6");

  await page.getByTestId("open-submit-dialog").click();
  await expect(page.getByTestId("summary-answered")).toHaveText("1");
  await page.getByTestId("confirm-submit").click();

  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByTestId("time-taken")).toContainText("Time taken:");
  await expect(page.getByTestId("submission-reason")).toContainText("Submitted by you");

  expect(consoleErrors).toEqual([]);
});

