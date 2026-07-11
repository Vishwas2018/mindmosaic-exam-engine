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

test("flow 1: grade 3 numeracy timed exam from setup to review", async ({ page }) => {
  const consoleErrors = watchConsole(page);

  await page.goto("/?seed=e2e-flow-1");
  await expect(
    page.getByRole("heading", { name: /Practice with purpose/i }),
  ).toBeVisible();

  await configureExam(page, {
    yearLevel: "3",
    examStyle: "naplan_style",
    subject: "numeracy",
    questionCount: "10",
    timing: "timed",
  });
  await expect(page.getByTestId("eligible-count")).toContainText("14 matching");
  await expect(page.getByTestId("config-summary")).toContainText("Grade 3");

  await page.getByTestId("start-exam").click();
  await expect(page).toHaveURL(/\/exam/);
  await expect(page.getByTestId("exam-timer")).toContainText("15:00");
  await expect(page.getByText("Question 1 of 10")).toBeVisible();

  /* Q1 (drag and drop): place every fraction card via the accessible fallback. */
  await page
    .getByLabel("One quarter (1/4)", { exact: true })
    .selectOption({ label: "Less than one half" });
  await page
    .getByLabel("One half (1/2)", { exact: true })
    .selectOption({ label: "Equal to one half" });
  await page
    .getByLabel("Three quarters (3/4)", { exact: true })
    .selectOption({ label: "More than one half" });

  /* Q2 (number entry): the canteen total is $6. */
  await page.getByTestId("next-question").click();
  await expect(page.getByText("Question 2 of 10")).toBeVisible();
  await page.getByRole("spinbutton").fill("6");

  /* Q3 (matching): match every point to its position. */
  await page.getByTestId("next-question").click();
  await page.getByLabel("Point A", { exact: true }).selectOption({ label: "(2, 3)" });
  await page.getByLabel("Point B", { exact: true }).selectOption({ label: "(5, 1)" });
  await page.getByLabel("Point C", { exact: true }).selectOption({ label: "(4, 4)" });

  /* Navigate backwards and confirm answers persisted. */
  await page.getByTestId("previous-question").click();
  await expect(page.getByRole("spinbutton")).toHaveValue("6");
  await page.getByTestId("previous-question").click();
  await expect(page.getByText("Question 1 of 10")).toBeVisible();
  await expect(page.getByLabel("One quarter (1/4)", { exact: true })).toHaveValue("zone-less");

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

  /* Results: all three answers were correct. */
  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByRole("heading", { level: 1, name: "Your results" })).toBeVisible();
  await expect(page.getByTestId("objective-percentage")).toHaveText("30%");
  await expect(page.getByTestId("result-total")).toHaveText("10");
  await expect(page.getByTestId("result-attempted")).toHaveText("3");
  await expect(page.getByTestId("time-taken")).toContainText("Time taken:");
  await expect(page.getByTestId("submission-reason")).toContainText("Submitted by you");

  /* Question review is present with statuses and flags. */
  await expect(page.getByTestId("review-question-1")).toBeVisible();
  await expect(page.getByTestId("review-status-1")).toHaveText("Correct");
  await expect(page.getByTestId("review-question-1").getByText("Flagged")).toBeVisible();
  await expect(page.getByTestId("review-status-5")).toHaveText("Not answered");

  expect(consoleErrors).toEqual([]);
});

test("flow 2: complex renderers in a mixed full-set exam", async ({ page }) => {
  const consoleErrors = watchConsole(page);

  await page.goto("/?seed=e2e-flow-2");
  await configureExam(page, {
    yearLevel: "mixed",
    examStyle: "mixed",
    subject: "mixed",
    questionCount: "full",
    timing: "untimed",
  });
  await expect(page.getByTestId("eligible-count")).toContainText("100 matching");
  await page.getByTestId("start-exam").click();
  await expect(page.getByText("Question 1 of 100")).toBeVisible();

  /* Q2: essay accepts text and reports a word count. */
  await page.getByTestId("nav-question-2").click();
  await page
    .getByRole("textbox")
    .fill("First fill the water bowl. Then brush your pet gently every day.");
  await expect(page.getByText("12 words")).toBeVisible();

  /* Q3: matching via labelled selects. */
  await page.getByTestId("nav-question-3").click();
  await page.getByLabel("Point A", { exact: true }).selectOption({ label: "(2, 3)" });
  await page.getByLabel("Point B", { exact: true }).selectOption({ label: "(5, 1)" });

  /* Q5: drag-and-drop fallback sorts a statement. */
  await page.getByTestId("nav-question-5").click();
  await page
    .getByLabel("Canberra is the capital of Australia.")
    .selectOption({ label: "Fact" });

  /* Q10: keyboard ordering. */
  await page.getByTestId("nav-question-10").click();
  await page.getByRole("button", { name: "Move Ava down" }).click();

  /* Q13: label the cube diagram. */
  await page.getByTestId("nav-question-13").click();
  await page
    .getByLabel("Face", { exact: true })
    .selectOption({ label: "Marker A, on the flat front surface" });

  /* Q17: reading comprehension radio choice. */
  await page.getByTestId("nav-question-17").click();
  await page
    .getByRole("radio", { name: "A lyrebird may be imitating the sound of a chainsaw" })
    .check();

  /* Q24: hotspot region selection. */
  await page.getByTestId("nav-question-24").click();
  await page.getByRole("checkbox", { name: "Square in the middle" }).click();

  /* Responses survive navigating back across the exam. */
  await page.getByTestId("nav-question-2").click();
  await expect(page.getByRole("textbox")).toHaveValue(/water bowl/);
  await page.getByTestId("nav-question-3").click();
  await expect(page.getByLabel("Point A", { exact: true })).toHaveValue("pos-2-3");
  await page.getByTestId("nav-question-17").click();
  await expect(
    page.getByRole("radio", { name: "A lyrebird may be imitating the sound of a chainsaw" }),
  ).toBeChecked();

  /* Flag the essay; flags survive navigation. */
  await page.getByTestId("nav-question-2").click();
  await page.getByTestId("flag-toggle").click();
  await page.getByTestId("nav-question-24").click();
  await expect(page.getByTestId("nav-question-2")).toHaveAttribute(
    "data-flagged",
    "true",
  );

  /* Submit: the full set contains the 4 manual-review writing tasks. */
  await page.getByTestId("open-submit-dialog").click();
  await expect(page.getByTestId("summary-total")).toHaveText("100");
  await expect(page.getByTestId("summary-manual")).toHaveText("4");
  await page.getByTestId("confirm-submit").click();

  await expect(page).toHaveURL(/\/results/);
  /* The essay is manual review and excluded from the objective percentage. */
  await expect(page.getByTestId("review-status-2")).toHaveText("Marked by a person");
  await expect(
    page
      .getByTestId("review-question-2")
      .getByText(/Writing tasks have no single correct answer/),
  ).toBeVisible();
  await expect(page.getByTestId("review-status-17")).toHaveText("Correct");
  await expect(page.getByText(/are marked by a person and are not counted/i)).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("flow 3: timer expiry auto-submits once and keeps answers", async ({ page }) => {
  const consoleErrors = watchConsole(page);

  await page.clock.install();
  await page.goto("/?seed=e2e-flow-3");
  await configureExam(page, {
    yearLevel: "3",
    examStyle: "naplan_style",
    subject: "numeracy",
    questionCount: "10",
    timing: "timed",
  });
  await page.getByTestId("start-exam").click();
  await expect(page.getByTestId("exam-timer")).toContainText("15:00");

  /* Q1 (matching): give one answer that must survive expiry. */
  await page.getByLabel("Point A", { exact: true }).selectOption({ label: "(2, 3)" });

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

  /* The kept answer scores as a partial matching attempt (incorrect, not lost). */
  await expect(page.getByTestId("review-question-1").getByText("Point A matched to (2, 3)")).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("flow 4: untimed exam shows no countdown but records time taken", async ({ page }) => {
  const consoleErrors = watchConsole(page);

  await page.goto("/?seed=e2e-flow-4");
  await configureExam(page, {
    yearLevel: "3",
    examStyle: "naplan_style",
    subject: "numeracy",
    questionCount: "10",
    timing: "untimed",
  });
  await page.getByTestId("start-exam").click();

  await expect(page.getByTestId("exam-timer-untimed")).toBeVisible();
  await expect(page.getByTestId("exam-timer")).toHaveCount(0);

  /* Q1 (dropdown): describe the circle model, 2 shaded of 3 parts. */
  await page.getByLabel("Number of shaded parts").selectOption({ label: "2" });
  await page.getByLabel("Total number of equal parts").selectOption({ label: "3" });

  await page.getByTestId("open-submit-dialog").click();
  await expect(page.getByTestId("summary-answered")).toHaveText("1");
  await page.getByTestId("confirm-submit").click();

  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByTestId("objective-percentage")).toHaveText("10%");
  await expect(page.getByTestId("time-taken")).toContainText("Time taken:");
  await expect(page.getByTestId("submission-reason")).toContainText("Submitted by you");

  expect(consoleErrors).toEqual([]);
});
