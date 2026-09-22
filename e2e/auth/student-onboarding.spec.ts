import { expect, test } from "../fixtures/auth.fixture";
import { assertNoSeriousAccessibilityViolations } from "../accessibility";
import {
  A11Y_VIEWPORTS,
  expectMinimumTouchTargets,
  expectNoHorizontalOverflow,
  setViewport,
  visitAndStabilize,
} from "../helpers/screen-helpers";

test.describe("student onboarding + diagnostic warmup", () => {
  test("fresh student sees first-run modal, completes 3 preference steps, sits 5-question diagnostic, and reaches dashboard", async ({
    contextAs,
  }) => {
    const context = await contextAs("student-no-attempts");
    const page = await context.newPage();
    await setViewport(page, A11Y_VIEWPORTS[0]);

    await visitAndStabilize(page, "/student", { readyLocator: "main" });

    // 1. First-run modal opens automatically
    // `page.locator("dialog")`, not `getByRole("dialog")`: the student
    // dashboard's ExploreGridSection always renders a second role="dialog"
    // element (its "Notify me" coming-soon preview, present-but-inert when
    // closed — a role query matches it regardless of visibility), so
    // getByRole("dialog") is a strict-mode violation on this page. The
    // onboarding modal (src/components/ui/Modal.tsx) is a native <dialog>
    // element and the other one is a plain <div role="dialog">, so the tag
    // selector is unambiguous (CI, 2026-09-22 dev consolidation).
    const dialog = page.locator("dialog");
    await expect(dialog).toBeVisible();
    // toHaveAccessibleName, not getByRole("heading", {name: /Welcome/i}):
    // the welcome step's own content (OnboardingStepWelcome.tsx) renders its
    // own "Welcome, {firstName}!" heading INSIDE the dialog, alongside
    // Modal.tsx's chrome title heading ("Welcome to MindMosaic") — both
    // real, both inside the dialog, both matching /Welcome/i. The dialog's
    // accessible name resolves via aria-labelledby to only the chrome
    // title, so it's unambiguous regardless of the step content's own
    // (fixture-dependent) greeting text (CI, 2026-09-22).
    await expect(dialog).toHaveAccessibleName("Welcome to MindMosaic");
    await expectMinimumTouchTargets(page, "dialog button");
    await assertNoSeriousAccessibilityViolations(page, "onboarding step 1 welcome");

    // 2. Step 1: Confirm Year Level
    await dialog.getByRole("button", { name: /Year 3/i }).click();
    await dialog.getByRole("button", { name: "Continue" }).click();

    // 3. Step 2: Focus Areas & Interests
    await expect(dialog.getByRole("heading", { name: /focus on/i })).toBeVisible();
    await dialog.getByRole("button", { name: "Continue" }).click();

    // 4. Step 3: Weekly Practice Target
    await expect(dialog.getByRole("heading", { name: /weekly practice goal/i })).toBeVisible();
    await dialog.getByRole("button", { name: /Start Warmup/i }).click();

    // 5. Diagnostic Warmup: 5 questions
    await expect(dialog.getByText(/Question 1 of 5/i)).toBeVisible();

    for (let q = 1; q <= 5; q++) {
      await expect(dialog.getByText(new RegExp(`Question ${q} of 5`, "i"))).toBeVisible();

      // Pick an answer option if options exist
      const firstOption = dialog.getByRole("radio").first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }

      if (q < 5) {
        await dialog.getByRole("button", { name: /Next Question/i }).click();
      } else {
        await dialog.getByRole("button", { name: /Finish Warmup/i }).click();
      }
    }

    // 6. Diagnostic Summary
    await expect(dialog.getByRole("heading", { name: /starting baseline is ready/i })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Go to my dashboard/i })).toBeVisible();
    await dialog.getByRole("button", { name: /Go to my dashboard/i }).click();

    // 7. Modal closes, returning to dashboard
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("returning student with completed onboarding never sees first-run modal", async ({
    contextAs,
  }) => {
    const context = await contextAs("student-completed-attempt");
    const page = await context.newPage();
    await setViewport(page, A11Y_VIEWPORTS[0]);

    await visitAndStabilize(page, "/student", { readyLocator: "main" });

    // Modal is NOT shown
    const dialog = page.locator("dialog");
    await expect(dialog).not.toBeVisible();

    // Standard dashboard is visible
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
    await expect(page.getByText("Recent activity").first()).toBeVisible();
  });

  test("dismissed onboarding modal can be resumed from the dashboard resume banner", async ({
    contextAs,
  }) => {
    const context = await contextAs("student-no-attempts");
    const page = await context.newPage();
    await setViewport(page, A11Y_VIEWPORTS[0]);

    await visitAndStabilize(page, "/student", { readyLocator: "main" });

    const dialog = page.locator("dialog");
    if (await dialog.isVisible()) {
      // Close via close button
      const closeBtn = dialog.getByRole("button", { name: "Close" });
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      } else {
        await page.keyboard.press("Escape");
      }
      await expect(dialog).not.toBeVisible();
    }

    // Resume banner is visible
    const resumeBanner = page.getByLabel("Diagnostic warmup invitation");
    await expect(resumeBanner).toBeVisible();

    // Clicking 'Start warmup' reopens modal
    await resumeBanner.getByRole("button", { name: /Start warmup/i }).click();
    await expect(dialog).toBeVisible();
  });
});
