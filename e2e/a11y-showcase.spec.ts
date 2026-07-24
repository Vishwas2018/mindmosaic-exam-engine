import { expect, test } from "@playwright/test";

import { assertNoSeriousAccessibilityViolations } from "./accessibility";
import {
  A11Y_VIEWPORTS,
  expectMinimumTouchTargets,
  expectNoHorizontalOverflow,
  setViewport,
  visitAndStabilize,
  walkTabOrderAndAssertVisibleFocus,
} from "./helpers/screen-helpers";

/*
 * The showcase page exercises every question and visual renderer the exam
 * engine has without needing a live exam session (no setup, no timer, no
 * submission) — the same registry-driven components an in-progress exam
 * renders. That makes it the right place to axe/viewport/keyboard-test every
 * question format at once, rather than the handful an actual exam session
 * happens to draw.
 */
test.describe("exam question renderers (showcase page): accessibility and responsive layout", () => {
  test("every renderer has no serious/critical axe violations at every viewport", async ({
    page,
  }) => {
    /*
     * A full-page axe scan across 14 question renderers and 10 visual
     * renderers, repeated for 3 viewports, comfortably exceeds Playwright's
     * default 30s test timeout even without host contention.
     */
    test.setTimeout(90_000);

    for (const viewport of A11Y_VIEWPORTS) {
      await setViewport(page, viewport);
      await visitAndStabilize(page, "/showcase", { readyLocator: "main" });
      await expect(page.locator("[data-question-type]")).toHaveCount(14);
      await expect(page.locator("[data-visual-type]")).toHaveCount(10);
      await expectNoHorizontalOverflow(page);
      await expectMinimumTouchTargets(
        page,
        'main button, main a[href], main input, main select, main [role="tab"], main [role="checkbox"]',
      );
      await assertNoSeriousAccessibilityViolations(page, `showcase page (${viewport.name})`);
    }
  });

  test("keyboard walkthrough of the whole showcase reaches every renderer with visible focus, no traps", async ({
    page,
  }) => {
    await setViewport(page, A11Y_VIEWPORTS[0]);
    await visitAndStabilize(page, "/showcase", { readyLocator: "main" });

    const sequence = await walkTabOrderAndAssertVisibleFocus(page, { maxSteps: 120 });

    // Sanity: the walk actually traversed a substantial, non-trivial part of
    // the page rather than exiting after one or two stops (which would
    // indicate an early focus trap swallowing the rest of the tab order).
    expect(sequence.length).toBeGreaterThan(20);
  });

  test("essay word count and ordering reorder remain accessible after interaction", async ({
    page,
  }) => {
    await setViewport(page, A11Y_VIEWPORTS[0]);
    await visitAndStabilize(page, "/showcase", { readyLocator: "main" });

    const orderingCard = page.locator('[data-question-type="ordering"]');
    // The first item's own "move up" button is always disabled (nothing
    // above it to swap with) — the second item's is the first enabled one.
    await orderingCard.getByRole("button", { name: /Move .* up/ }).nth(1).click();
    const essayCard = page.locator('[data-question-type="essay"]');
    await essayCard.getByRole("textbox").fill("A short accessible answer");

    await expectNoHorizontalOverflow(page);
    await assertNoSeriousAccessibilityViolations(page, "showcase after ordering/essay interaction");
  });
});
