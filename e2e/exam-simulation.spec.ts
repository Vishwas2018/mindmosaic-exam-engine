import { expect, test } from "@playwright/test";

import { assertNoSeriousAccessibilityViolations } from "./accessibility";

/**
 * Sitting a full-length practice paper, end to end: pick it from /exams,
 * confirm the paper is the size and length the pattern declares, submit, and
 * land on results with the paper named.
 *
 * The pattern is NAPLAN-style Year 3 Numeracy — 36 questions, 45 minutes —
 * which the gated bank can fill today. An explicit ?seed= keeps the draw
 * reproducible, exactly as the other exam flows do.
 */
test("a full-length practice paper runs from the picker to results", async ({ page }) => {
  await page.goto("/exams");

  await expect(
    page.getByRole("heading", { name: "Sit a whole paper, start to finish" }),
  ).toBeVisible();

  /* Grouped year level, then assessment, then subject. */
  await expect(page.getByRole("heading", { name: "Year 3", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Year 5", exact: true })).toBeVisible();

  const card = page.getByTestId("pattern-card-naplan-y3-numeracy-full");
  await expect(card).toBeVisible();
  await expect(page.getByTestId("pattern-shape-naplan-y3-numeracy-full")).toHaveText(
    "36 questions · 45 minutes",
  );

  await card.click();
  await expect(page).toHaveURL(/\/exams\/naplan-y3-numeracy-full/);

  /* The paper is named as practice, never as a real or official paper. */
  await expect(page.getByTestId("pattern-sitting-label")).toHaveText(
    "NAPLAN-style Year 3 Numeracy — full-length practice",
  );
  await expect(page.getByTestId("pattern-sitting-shape")).toHaveText(
    "36 questions · 45 minutes",
  );

  /* The adaptations disclosure is present, keyboard-operable, and says what
     is different — here, that the real test is adaptive and this is not. */
  const adaptations = page.getByTestId("pattern-adaptations-naplan-y3-numeracy-full");
  await expect(adaptations).toBeVisible();
  await adaptations.getByText("How this differs from the real assessment").click();
  await expect(adaptations.getByText("Everyone gets the same questions")).toBeVisible();

  await page.getByTestId("start-pattern").click();
  await expect(page.getByTestId("instructions-questions")).toHaveText("36");
  await page.getByTestId("begin-exam").click();

  await expect(page).toHaveURL(/\/exam/);
  await expect(page.getByTestId("exam-timer")).toContainText("45:00");
  await expect(page.getByRole("heading", { name: "Question 1 of 36" })).toBeVisible();
  await expect(page.getByTestId("answered-count")).toHaveText("0 of 36 answered");

  /* Submitting without answering is allowed and is what keeps this spec
     about the paper's shape rather than about 36 renderers. */
  await page.getByTestId("open-submit-dialog").click();
  await expect(page.getByTestId("summary-total")).toHaveText("36");
  await page.getByTestId("confirm-submit").click();

  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByText("NAPLAN-style Year 3 Numeracy — full-length practice")).toBeVisible();
  await expect(page.getByTestId("paper-fidelity")).toContainText("Full-length practice paper");
  await expect(page.getByTestId("result-total")).toHaveText("36");
});

test("the picker is keyboard navigable and free of serious a11y violations", async ({
  page,
}) => {
  await page.goto("/exams");
  await expect(page.getByTestId("pattern-card-naplan-y3-numeracy-full")).toBeVisible();

  /* Every startable paper is reachable by keyboard, with a visible focus
     ring — the audience is eight and ten years old, and some of them tab. */
  const card = page.getByTestId("pattern-card-naplan-y3-numeracy-full");
  await card.focus();
  await expect(card).toBeFocused();

  await assertNoSeriousAccessibilityViolations(page, "/exams");
});

test("a paper the bank cannot fill is never offered as full length", async ({ page }) => {
  await page.goto("/exams");

  /* Year 5 Science has no gated content yet. It must render as coming soon
     with nothing to click — not a broken route, and not a short paper wearing
     the full-length paper's name. */
  const science = page.getByTestId("pattern-card-icas-y5-science-full");
  await expect(science).toBeVisible();
  await expect(page.getByTestId("pattern-state-icas-y5-science-full")).toHaveText(
    "Coming soon",
  );
  expect(await science.evaluate((node) => node.tagName)).not.toBe("A");

  /* And the deferred writing tasks are listed but never startable. */
  await expect(page.getByTestId("pattern-state-naplan-y3-writing-deferred")).toHaveText(
    "Coming soon",
  );
});
