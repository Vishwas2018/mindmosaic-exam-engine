import { expect, test } from "../fixtures/auth.fixture";
import { assertNoSeriousAccessibilityViolations } from "../accessibility";
import {
  A11Y_VIEWPORTS,
  expectMinimumTouchTargets,
  expectNoHorizontalOverflow,
  setViewport,
  visitAndStabilize,
  walkTabOrderAndAssertVisibleFocus,
} from "../helpers/screen-helpers";

const STUDENT_PAGES = [
  // Heading updated (2026-09 e2e repair): the dashboard is now the Stitch
  // portal rewrite's own StudentPortalShell page, not StudentShell's old
  // "Do you want to study today?" copy — the real h1 is the
  // DashboardWelcomeBanner greeting.
  { path: "/student", heading: /Welcome back/i },
  { path: "/student/learn", heading: /Learning hub/i },
  { path: "/student/assignments", heading: null },
  { path: "/student/engagement", heading: null },
  // Added (2026-09 e2e repair, Step 3): previously zero coverage, old or
  // new — Exam Centre and Practice Studio didn't exist in this list at all.
  { path: "/student/exam-preparation", heading: /Exam Centre/i },
  { path: "/student/practice", heading: /Practice Studio/i },
] as const;

test.describe("student dashboard: accessibility and responsive layout", () => {
  for (const { path, heading } of STUDENT_PAGES) {
    test(`${path} (no attempts yet) has no violations at every viewport`, async ({
      contextAs,
    }) => {
      const context = await contextAs("student-no-attempts");
      const page = await context.newPage();

      for (const viewport of A11Y_VIEWPORTS) {
        await setViewport(page, viewport);
        await visitAndStabilize(page, path, { readyLocator: "main" });
        if (heading) {
          await expect(page.getByRole("heading", { name: heading })).toBeVisible();
        }
        await expectNoHorizontalOverflow(page);
        await expectMinimumTouchTargets(page, "main button, main a[href], main input, main select");
        await assertNoSeriousAccessibilityViolations(page, `${path}, no attempts (${viewport.name})`);
      }
    });

    test(`${path} (completed attempt) has no violations at every viewport`, async ({
      contextAs,
    }) => {
      const context = await contextAs("student-completed-attempt");
      const page = await context.newPage();

      for (const viewport of A11Y_VIEWPORTS) {
        await setViewport(page, viewport);
        await visitAndStabilize(page, path, { readyLocator: "main" });
        await expectNoHorizontalOverflow(page);
        await expectMinimumTouchTargets(page, "main button, main a[href], main input, main select");
        await assertNoSeriousAccessibilityViolations(
          page,
          `${path}, completed attempt (${viewport.name})`,
        );
      }
    });
  }

  test("student home shows recent activity and the nav for a student with a completed attempt", async ({
    contextAs,
  }) => {
    const context = await contextAs("student-completed-attempt");
    const page = await context.newPage();
    await setViewport(page, A11Y_VIEWPORTS[0]);
    await visitAndStabilize(page, "/student", { readyLocator: "main" });
    // "Recent activity" (2026-09 e2e repair): RecentActivityCard's real
    // heading on the rewritten dashboard — was "Recent sessions" under the
    // old StudentShell dashboard.
    await expect(page.getByText("Recent activity")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("assignments tabs remain accessible after switching tabs", async ({ contextAs }) => {
    const context = await contextAs("student-no-attempts");
    const page = await context.newPage();
    await setViewport(page, A11Y_VIEWPORTS[0]);
    await visitAndStabilize(page, "/student/assignments", { readyLocator: "main" });

    const tabs = page.getByRole("tab");
    const tabCount = await tabs.count();
    if (tabCount > 0) {
      await tabs.nth(1).click();
      await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
      await expectNoHorizontalOverflow(page);
      await assertNoSeriousAccessibilityViolations(page, "student assignments, after tab switch");
      await expectMinimumTouchTargets(page, '[role="tab"]');
    }
  });

  test("mobile nav disclosure reaches every destination with visible focus, in order", async ({
    contextAs,
  }) => {
    const context = await contextAs("student-completed-attempt");
    const page = await context.newPage();
    await setViewport(page, A11Y_VIEWPORTS[0]);
    await visitAndStabilize(page, "/student", { readyLocator: "main" });

    // StudentTopBar's mobile nav (2026-09 e2e repair): the dashboard-family
    // shell (StudentPortalShell) has its own header, separate from
    // StudentShell's — below lg it lives behind this disclosure, so a
    // mobile keyboard user must be able to reach it. Was a native
    // <details>/<summary> that Chromium didn't expose with a "button" role
    // even with aria-label set; now a controlled <button aria-expanded>.
    const toggle = page.getByRole("button", { name: "Open menu" });
    await expect(toggle).toBeVisible();
    await expectMinimumTouchTargets(page, "header button");
    await toggle.focus();
    await page.keyboard.press("Enter");
    const panel = page.getByRole("navigation", { name: "Student navigation" });
    await expect(panel).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await assertNoSeriousAccessibilityViolations(page, "student home, mobile nav open");

    // Real sequence (2026-09 e2e repair): StudentSidebar's 5 items —
    // Dashboard, Learning Hub, Practice Studio, Exam Centre, My Progress.
    // No "Assignments" item exists on this shell (that page still uses the
    // separate, unrelated StudentShell nav) — the old assertion's premise
    // of one shared nav across both pages no longer holds.
    const sequence = await walkTabOrderAndAssertVisibleFocus(page);
    const dashboardIndex = sequence.findIndex((key) => key.includes("Dashboard"));
    const learnIndex = sequence.findIndex((key) => key.includes("Learning Hub"));
    const practiceIndex = sequence.findIndex((key) => key.includes("Practice Studio"));
    const examCentreIndex = sequence.findIndex((key) => key.includes("Exam Centre"));
    const progressIndex = sequence.findIndex((key) => key.includes("My Progress"));

    expect(dashboardIndex).toBeGreaterThanOrEqual(0);
    expect(learnIndex).toBeGreaterThan(dashboardIndex);
    expect(practiceIndex).toBeGreaterThan(learnIndex);
    expect(examCentreIndex).toBeGreaterThan(practiceIndex);
    expect(progressIndex).toBeGreaterThan(examCentreIndex);
  });

  test("keyboard walkthrough of the student nav and home page has visible focus throughout, in order (desktop)", async ({
    contextAs,
  }) => {
    const context = await contextAs("student-completed-attempt");
    const page = await context.newPage();
    await setViewport(page, A11Y_VIEWPORTS[2]);
    await visitAndStabilize(page, "/student", { readyLocator: "main" });

    // Same real StudentSidebar sequence as the mobile disclosure test above.
    const sequence = await walkTabOrderAndAssertVisibleFocus(page);
    const dashboardIndex = sequence.findIndex((key) => key.includes("Dashboard"));
    const learnIndex = sequence.findIndex((key) => key.includes("Learning Hub"));
    const practiceIndex = sequence.findIndex((key) => key.includes("Practice Studio"));
    const examCentreIndex = sequence.findIndex((key) => key.includes("Exam Centre"));
    const progressIndex = sequence.findIndex((key) => key.includes("My Progress"));

    expect(dashboardIndex).toBeGreaterThanOrEqual(0);
    expect(learnIndex).toBeGreaterThan(dashboardIndex);
    expect(practiceIndex).toBeGreaterThan(learnIndex);
    expect(examCentreIndex).toBeGreaterThan(practiceIndex);
    expect(progressIndex).toBeGreaterThan(examCentreIndex);
  });
});
