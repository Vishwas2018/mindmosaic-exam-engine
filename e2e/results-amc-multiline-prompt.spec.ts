import { expect, test, type Page } from "@playwright/test";

import { showcasePromptLayoutQuestions } from "@/content/questions/showcase-prompt-layout-fixtures";
import type { Question } from "@/schemas/question.schema";

import { assertNoSeriousAccessibilityViolations } from "./accessibility";
import { expectNoHorizontalOverflow, startExamSession } from "./helpers/screen-helpers";

/**
 * Regression for the post-exam review: the exam page keeps line breaks for
 * `amc_style` prompts, and the results page must too. Before the fix the
 * results page rendered the prompt in a plain paragraph, so a multi-line AMC
 * prompt collapsed to one run-on line (`white-space: normal`).
 *
 * The guest bank route is mocked and serves ONLY the synthetic demonstration
 * questions from the showcase prompt-layout fixtures, which carry the same text
 * under `amc_style` and `naplan_style`. No real or unpublished question is
 * involved. The NAPLAN card is the control: it must stay exactly as before.
 */
const [amcQuestion, naplanQuestion] = showcasePromptLayoutQuestions;

const viewports = [
  { name: "desktop", size: { width: 1280, height: 800 } },
  { name: "mobile", size: { width: 390, height: 844 } },
] as const;

const DEMO_LINES = [
  "• First line of the demonstration list.",
  "• Second line of the demonstration list.",
  "• Third line of the demonstration list.",
];

/**
 * A guest picks questions from the guest bank in the browser and is scored
 * locally, so the bank route is the only one that needs serving. It returns
 * twelve copies of ONE synthetic demonstration question (distinct ids), so the
 * setup screen has enough to build a ten-question paper for that exam style.
 */
function demonstrationBank(source: Question) {
  return Array.from({ length: 12 }, (_, index) => ({ ...source, id: `${source.id}-${index + 1}` }));
}

async function reachResults(page: Page, source: Question, examStyle: string, subject: string): Promise<void> {
  const bank = demonstrationBank(source);
  await page.route("**/api/exam/guest-bank", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ curated: bank, published: bank, practice: bank }),
    });
  });
  await startExamSession(page, {
    path: "/practice/mixed-practice?seed=results-multiline",
    yearLevel: "5",
    examStyle,
    subject,
    questionCount: "10",
    timing: "untimed",
  });
  await page.getByTestId("open-submit-dialog").click();
  await page.getByTestId("confirm-submit").click();
  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByRole("heading", { level: 1, name: "Your results" })).toBeVisible();
}

for (const { name, size } of viewports) {
  test.describe(`results page: AMC multi-line prompt (${name})`, () => {
    test.use({ viewport: size });

    test("keeps each authored line on its own line for amc_style", async ({ page }) => {
      test.setTimeout(90_000);
      await reachResults(page, amcQuestion, "mixed", "mixed");

      /* Ten copies of one question are drawn; any one shows the behaviour. */
      const prompt = page.locator('[data-testid^="review-prompt-"]').first();
      await expect(prompt).toContainText("Demonstration only");
      await expect(prompt).toHaveCSS("white-space", "pre-line");

      const lines = (await prompt.innerText()).split("\n").map((line) => line.trim()).filter(Boolean);
      expect(lines.filter((line) => line.startsWith("•"))).toEqual(DEMO_LINES);
      expect(lines.at(-1)).toBe("Choose any option to try the layout.");

      /* Preserving breaks must not push the prompt past the viewport. */
      const box = await prompt.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x + box!.width).toBeLessThanOrEqual(size.width);
      await expectNoHorizontalOverflow(page);
    });

    test("leaves the naplan_style prompt with the same text exactly as before", async ({ page }) => {
      test.setTimeout(90_000);
      await reachResults(page, naplanQuestion, "naplan_style", "numeracy");

      /* Ten copies of one question are drawn; any one shows the behaviour. */
      const prompt = page.locator('[data-testid^="review-prompt-"]').first();
      await expect(prompt).toContainText("Demonstration only");
      await expect(prompt).toHaveCSS("white-space", "normal");
      expect(await prompt.innerText()).not.toContain("\n");
    });

    test("has no serious or critical accessibility violations", async ({ page }) => {
      test.setTimeout(90_000);
      await reachResults(page, amcQuestion, "mixed", "mixed");
      await assertNoSeriousAccessibilityViolations(page, `results page, AMC multi-line prompt (${name})`);
    });
  });
}
