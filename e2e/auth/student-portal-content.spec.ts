import { expect, test } from "../fixtures/auth.fixture";
import { visitAndStabilize } from "../helpers/screen-helpers";

/**
 * Content-level coverage for the Stitch-ported student portal (2026-09 e2e
 * repair, Step 3) — beyond "no a11y violations", this asserts the specific
 * data-integrity properties the portal rewrite's own audit called for:
 *
 *  - real attempt history renders identically across every screen that
 *    shows it (dashboard, Exam Centre, My Progress, Practice Studio) — the
 *    exact cross-page contradiction risk the audit flagged when a mock's
 *    fixed example rows were ported verbatim;
 *  - "coming soon" controls are genuinely inert (aria-disabled), not just
 *    styled to look that way;
 *  - Practice Studio's drill-module links resolve to real, correctly
 *    filtered catalogue destinations, not dead ends.
 *
 * `student-completed-attempt`'s seeded attempt has an empty `result`/
 * `config` (see e2e/fixtures/seed.ts's ensureCompletedAttempt), which
 * summarizeAttempt() deterministically turns into title "Practice session",
 * timing "Untimed", and a null score ("Pending") — see
 * src/features/student/attempt-summary.ts. Asserting on those exact,
 * deterministic fallback strings (rather than inventing expected numbers)
 * is what makes this robust to reseeding.
 */

const REAL_ATTEMPT_TITLE = "Practice session";

test.describe("student portal: real data, not placeholders", () => {
  test("the same real attempt appears consistently across dashboard, Exam Centre, My Progress, and Practice Studio", async ({
    contextAs,
  }) => {
    const context = await contextAs("student-completed-attempt");
    const page = await context.newPage();

    await visitAndStabilize(page, "/student", { readyLocator: "main" });
    await expect(page.getByText("Recent activity")).toBeVisible();
    await expect(page.getByText(REAL_ATTEMPT_TITLE)).toBeVisible();

    await visitAndStabilize(page, "/student/exam-preparation", { readyLocator: "main" });
    await expect(page.getByText("Recent papers")).toBeVisible();
    await expect(page.getByText(REAL_ATTEMPT_TITLE)).toBeVisible();

    await visitAndStabilize(page, "/student/engagement", { readyLocator: "main" });
    await expect(page.getByText("Recent completed sessions")).toBeVisible();
    await expect(page.getByText(REAL_ATTEMPT_TITLE)).toBeVisible();

    await visitAndStabilize(page, "/student/practice", { readyLocator: "main" });
    await expect(page.getByText("Recent practice history")).toBeVisible();
    await expect(page.getByText(REAL_ATTEMPT_TITLE)).toBeVisible();
  });

  test("/student/engagement shows the real (empty) mastery state, not a fixed strand-progression example", async ({
    contextAs,
  }) => {
    // Both fixtures' seeded data has no scored bySubject breakdown (see
    // module doc comment), so both genuinely hit the same real empty
    // state — this is the correct behaviour, not a gap in the fixture.
    for (const key of ["student-no-attempts", "student-completed-attempt"] as const) {
      const context = await contextAs(key);
      const page = await context.newPage();
      await visitAndStabilize(page, "/student/engagement", { readyLocator: "main" });
      await expect(page.getByText("Nothing measured yet.")).toBeVisible();
    }
  });

  test("coming-soon controls are aria-disabled, not just styled inert", async ({ contextAs }) => {
    const context = await contextAs("student-no-attempts");
    const page = await context.newPage();

    await visitAndStabilize(page, "/student/practice", { readyLocator: "main" });
    await expect(page.getByRole("button", { name: "Start daily sprint" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(
      page.getByRole("button", { name: "Thinking Skills & Logic" }),
    ).toHaveAttribute("aria-disabled", "true");

    await visitAndStabilize(page, "/student", { readyLocator: "main" });
    await expect(page.getByTitle("No notifications")).toHaveAttribute("aria-disabled", "true");
  });

  test("Practice Studio's real drill-module links resolve to correctly filtered catalogue pages", async ({
    contextAs,
  }) => {
    const context = await contextAs("student-no-attempts");
    const page = await context.newPage();
    await visitAndStabilize(page, "/student/practice", { readyLocator: "main" });

    await page.getByRole("link", { name: "Practise arithmetic" }).click();
    await expect(page).toHaveURL(/\/practice\?subject=numeracy&grade=\d&style=naplan_style/);
    // A real, live program — not a 404 or an empty catalogue result.
    await expect(page.getByText(/matching questions available/i)).toBeVisible();
  });
});
