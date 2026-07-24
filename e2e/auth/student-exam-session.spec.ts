import { expect, test } from "@playwright/test";

import { createAdminClient } from "../fixtures/supabase-admin";
import { e2eEnv } from "../fixtures/env";
import { STUDENTS } from "../fixtures/identities";

/**
 * Full student journey driven entirely through the UI: code+PIN sign-in
 * (no storageState shortcut — this is the one thing this spec exists to
 * exercise), the student dashboard, starting a signed-in ("server-mode")
 * exam, its debounced autosave, and resuming after a hard refresh.
 *
 * Uses the "student-no-attempts" fixture and never submits the exam, so
 * this never creates an exam_attempts row for it — role-access.smoke.spec.ts
 * depends on that identity showing "No sessions yet" on /student. The
 * exam_sessions row this test does create is deleted in the `finally` block
 * to leave that fixture exactly as seed.ts left it.
 *
 * A server-mode session's question order is server-chosen
 * (crypto.randomUUID(), not a caller seed — see startServerExam's comment
 * in src/features/exam-engine/state/exam-store.ts), so which renderer
 * lands on any given question index is not predictable run to run. Flagging
 * and navigating (rather than answering a specific renderer) exercises the
 * same autosave/resume machinery without depending on the queston bank's
 * random draw.
 */

const STUDENT = STUDENTS.find((s) => s.key === "student-no-attempts")!;

test("student code+PIN sign-in reaches the dashboard, starts a timed exam, autosaves, and resumes after refresh", async ({
  page,
}) => {
  const admin = createAdminClient();
  let sessionId: string | null = null;

  try {
    await page.goto("/student-sign-in");
    await expect(page.getByRole("heading", { name: "Student sign in" })).toBeVisible();
    await page.getByLabel("Login code").fill(STUDENT.loginCode);
    await page.getByLabel("PIN").fill(e2eEnv.fixturePin);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/student$/);
    await expect(
      page.getByRole("heading", { name: "Student, how do you want to study today?" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Start practising/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Start an exam sim/ })).toBeVisible();
    await expect(page.getByText("No sessions yet")).toBeVisible();

    /* The dashboard's mode CTAs point at "/#exam-setup", which has no
       matching element on the marketing root — the real entry point into
       the configurator is a /practice/<program> route (see
       ExamConfigurator, rendered from src/app/practice/[program]/page.tsx).
       Exercising that real route here, the same way a student would after
       clicking through /practice. */
    await page.goto("/practice/mixed-practice");
    await expect(page.getByRole("heading", { name: "Set up an exam" })).toBeVisible();
    await page.getByTestId("select-year-level").selectOption("3");
    await page.getByTestId("select-exam-style").selectOption("naplan_style");
    await page.getByTestId("select-subject").selectOption("numeracy");
    await page.getByTestId("select-question-count").selectOption("10");
    await page.getByTestId("select-timing").selectOption("timed");
    await expect(page.getByTestId("eligible-count")).not.toContainText("0 matching");

    const sessionCreated = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/exam/session") && response.request().method() === "POST",
    );
    await page.getByTestId("start-exam").click();
    const sessionResponse = await sessionCreated;
    expect(sessionResponse.ok()).toBe(true);
    const created = (await sessionResponse.json()) as { sessionId?: string };
    expect(created.sessionId).toBeTruthy();
    sessionId = created.sessionId!;

    await expect(page).toHaveURL(/\/exam/);
    await expect(page.getByRole("heading", { name: "Question 1 of 10" })).toBeVisible();

    /* Flag question 1, move to question 2 — both mutate autosave-tracked
       state (see noteAutosaveChange in exam-store.ts) without depending on
       what renderer either question happens to be. */
    await page.getByTestId("flag-toggle").click();
    await expect(page.getByTestId("flag-toggle")).toHaveAttribute("aria-pressed", "true");

    const autosaved = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/exam/session/${sessionId}/responses`) &&
        response.request().method() === "POST",
      { timeout: 10_000 },
    );
    await page.getByTestId("next-question").click();
    await expect(page.getByRole("heading", { name: "Question 2 of 10" })).toBeVisible();
    const autosaveResponse = await autosaved;
    expect(autosaveResponse.ok()).toBe(true);

    /* A hard refresh wipes the client-side store; a signed-in student gets
       one resume attempt against the autosaved session. */
    await page.reload();
    await expect(page.getByRole("heading", { name: "Question 2 of 10" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("nav-question-1")).toHaveAttribute("data-flagged", "true");
    await expect(page.getByTestId("nav-question-2")).toHaveAttribute("data-nav-state", "current");
  } finally {
    if (sessionId) {
      await admin.from("exam_sessions").delete().eq("id", sessionId);
    }
  }
});
