import { expect, test } from "@playwright/test";

/**
 * Regression for the AMC multi-line prompt defect found while reviewing
 * roadmap-amc-y5-019: a clue list authored one clue per line is shown in a
 * multiple-choice <legend>, and the browser collapsed the line breaks so the
 * clues ran together into one paragraph with inline bullets (before:
 * `white-space: normal`, a single line of innerText).
 *
 * The fix keeps line breaks for `amc_style` only. The test uses clearly
 * synthetic demonstration text on /showcase, never a real or unpublished
 * question. 63 NAPLAN-style and ICAS-style prompts in the served banks
 * already contain line breaks and display collapsed today; the control card
 * pins that this change leaves them exactly as they were, so any later
 * decision to change them is made deliberately and reviewed on its own.
 */
const viewports = [
  { name: "desktop", size: { width: 1280, height: 800 } },
  { name: "mobile", size: { width: 390, height: 844 } },
] as const;

const DEMO_LINES = [
  "• First line of the demonstration list.",
  "• Second line of the demonstration list.",
  "• Third line of the demonstration list.",
];

for (const { name, size } of viewports) {
  test.describe(`AMC multi-line prompt (${name})`, () => {
    test.use({ viewport: size });

    test.beforeEach(async ({ page }) => {
      await page.goto("/showcase");
      await expect(page.getByTestId("showcase-prompt-layout")).toBeVisible();
    });

    test("is labelled as demonstration content and holds no real question text", async ({ page }) => {
      const section = page.getByTestId("showcase-prompt-layout");
      await expect(section.getByText("Demonstration content")).toBeVisible();
      await expect(section).toContainText("not a real or approved question");
      await expect(page.locator("body")).not.toContainText("Five friends");
      await expect(page.locator("body")).not.toContainText("Which fruit does Chen choose");
    });

    test("keeps each line on its own line for amc_style", async ({ page }) => {
      const legend = page.getByTestId("prompt-layout-amc_style").locator("fieldset legend");
      await expect(legend).toContainText("Demonstration only");
      await expect(legend).toHaveCSS("white-space", "pre-line");

      const lines = (await legend.innerText()).split("\n").map((line) => line.trim()).filter(Boolean);
      expect(lines.filter((line) => line.startsWith("•"))).toEqual(DEMO_LINES);
      expect(lines.at(-1)).toBe("Choose any option to try the layout.");

      /* Fits the viewport: preserving breaks must not cause sideways scrolling. */
      const box = await legend.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x + box!.width).toBeLessThanOrEqual(size.width);
    });

    test("leaves naplan_style prompts exactly as they were", async ({ page }) => {
      const legend = page.getByTestId("prompt-layout-naplan_style").locator("fieldset legend");
      await expect(legend).toContainText("Demonstration only");
      await expect(legend).toHaveCSS("white-space", "normal");
      expect(await legend.innerText()).not.toContain("\n");
    });
  });
}
