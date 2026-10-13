import { test, expect } from "../fixtures/auth.fixture";
import { createAdminClient } from "../fixtures/supabase-admin";
import { AUTH_APP_ORIGIN } from "../../playwright.auth.config";

/**
 * The timed writing flow end to end, against the seeded fixtures:
 *
 *   child:    student-no-attempts      (login code E2STUD01)
 *   parent:   parent-one-child         (linked to that child)
 *   stranger: parent-multi-children    (linked to other children, NOT to that child)
 *
 * The task is the dev fixture (src/features/writing/task.ts), resolvable only
 * because playwright.auth.config.ts sets WRITING_PREVIEW_ENABLED for this
 * production build. Every attempt a test creates is deleted again in `finally`,
 * so no other spec sees writing rows.
 */

const TASK_ID = "dev-fixture-written-expression";
const SCORES = { punctuation: 3, creativity: 4, construction: 3, grammar: 5, spelling: 2, relevance: 4 } as const;
const TOTAL = 21;

async function childId(): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("profiles").select("id").eq("display_name", "Student No Attempts").single();
  if (error || !data) throw new Error(`fixture child not found: ${error?.message}`);
  return data.id as string;
}

async function cleanWritingRows(): Promise<void> {
  const admin = createAdminClient();
  await admin.from("writing_attempts").delete().eq("task_id", TASK_ID);
}

test.describe("timed writing", () => {
  test.beforeEach(cleanWritingRows);
  test.afterEach(cleanWritingRows);

  test("shows the prompt and the countdown together, warns at 5 minutes and 1 minute, and auto-submits at expiry as timer_expired", async ({
    contextAs,
  }) => {
    test.setTimeout(150_000);
    const admin = createAdminClient();
    const student = await childId();
    const page = await (await contextAs("student-no-attempts")).newPage();

    await page.goto(`/writing/sit/${TASK_ID}`);
    // No planning screen and no prompt before the clock: the choices come first and show no task text.
    await expect(page.getByTestId("writing-prompt")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Timed, on paper/ })).toBeVisible();

    await page.getByRole("button", { name: /Timed, on screen/ }).click();
    await expect(page.getByTestId("writing-prompt")).toBeVisible();
    await expect(page.getByTestId("writing-countdown")).toBeVisible();
    await expect(page.getByTestId("writing-countdown")).toContainText(/1[45]:\d\d/);

    const text = "The key slid out of my pocket and I did not notice. By lunchtime everything had changed.";
    await page.getByTestId("writing-response").fill(text);
    await expect(page.getByTestId("writing-save-state")).toHaveText("Saved", { timeout: 10_000 });

    // The deadline is the server's: 900 seconds from the stored start.
    const { data: started } = await admin
      .from("writing_attempts")
      .select("id, started_at, deadline_at, duration_seconds, mode")
      .eq("student_id", student)
      .eq("task_id", TASK_ID)
      .single();
    expect(started?.mode).toBe("timed");
    expect(started?.duration_seconds).toBe(900);
    expect((Date.parse(started!.deadline_at as string) - Date.parse(started!.started_at as string)) / 1000).toBe(900);

    // Five minutes left (the test moves the server's deadline; the page picks it up on resume).
    await admin.from("writing_attempts").update({ deadline_at: new Date(Date.now() + 280_000).toISOString() }).eq("id", started!.id);
    await page.reload();
    await expect(page.getByTestId("writing-warning")).toHaveText("About five minutes left.");
    await expect(page.getByTestId("writing-response")).toHaveValue(text); // resumed from autosave

    // One minute left, then the clock runs out.
    await admin.from("writing_attempts").update({ deadline_at: new Date(Date.now() + 25_000).toISOString() }).eq("id", started!.id);
    await page.reload();
    await expect(page.getByTestId("writing-warning")).toContainText("About one minute left");

    await expect(page.getByTestId("writing-submitted")).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId("writing-submitted")).toContainText("Time's up");
    await expect(page.getByTestId("writing-response")).toBeDisabled();

    const { data: done } = await admin
      .from("writing_attempts")
      .select("submission_reason, submitted_at, deadline_at, response_text")
      .eq("id", started!.id)
      .single();
    expect(done?.submission_reason).toBe("timer_expired");
    expect(done?.response_text).toBe(text);
    expect(Date.parse(done!.submitted_at as string)).toBeLessThanOrEqual(Date.parse(done!.deadline_at as string));
  });

  test("an untimed attempt has no clock and is handed in by the child", async ({ contextAs }) => {
    const admin = createAdminClient();
    const student = await childId();
    const page = await (await contextAs("student-no-attempts")).newPage();

    await page.goto(`/writing/sit/${TASK_ID}`);
    await page.getByRole("button", { name: /Untimed practice/ }).click();
    await expect(page.getByTestId("writing-prompt")).toBeVisible();
    await expect(page.getByTestId("writing-countdown")).toHaveCount(0);

    await page.getByTestId("writing-response").fill("A short untimed piece.");
    await page.getByTestId("writing-hand-in").click();
    await page.getByRole("button", { name: "Yes, hand in" }).click();
    await expect(page.getByTestId("writing-submitted")).toContainText("Handed in");

    const { data } = await admin.from("writing_attempts").select("mode, submission_reason, deadline_at").eq("student_id", student).single();
    expect(data).toEqual({ mode: "untimed", submission_reason: "user_submitted", deadline_at: null });
  });

  test("an unknown task id is a 404 (nothing unapproved is reachable)", async ({ contextAs }) => {
    const page = await (await contextAs("student-no-attempts")).newPage();
    const response = await page.goto("/writing/sit/w6-narrative-draft-001");
    expect(response?.status()).toBe(404);
  });

  test("the print route works for a signed-in user and is a 404 for an unknown task", async ({ contextAs }) => {
    const page = await (await contextAs("parent-one-child")).newPage();
    expect((await page.goto(`/writing/print/${TASK_ID}`))?.status()).toBe(200);
    await expect(page.getByTestId("print-page")).toHaveCount(2);
    expect((await page.goto("/writing/print/w6-narrative-draft-001"))?.status()).toBe(404);
  });
});

async function scoreAll(page: import("@playwright/test").Page, scores: Record<string, number>): Promise<void> {
  for (const [criterion, score] of Object.entries(scores)) {
    await page.locator("label", { has: page.getByTestId(`score-${criterion}-${score}`) }).click();
  }
}

test.describe("parent marking", () => {
  test.beforeEach(cleanWritingRows);
  test.afterEach(cleanWritingRows);

  test("marked on paper: a linked parent scores the six criteria with NO response text, in under three minutes; the child sees the marks and comment; another parent is denied", async ({
    contextAs,
  }) => {
    test.setTimeout(120_000);
    const parent = await contextAs("parent-one-child");
    const parentPage = await parent.newPage();
    const began = Date.now();

    await parentPage.goto("/parent/writing");
    await parentPage.locator('[data-testid="mark-paper-link"]:visible').click();
    await expect(parentPage).toHaveURL(/\/writing\/mark\/new$/);

    // No response text is typed. The optional box stays closed and empty.
    await expect(parentPage.getByTestId("mark-save")).toBeDisabled(); // all six criteria are needed
    await scoreAll(parentPage, SCORES);
    await parentPage.getByText("Add a comment (optional)").first().click();
    await parentPage.getByLabel("Comment on Punctuation").fill("Speech marks need practice.");
    await expect(parentPage.getByTestId("mark-total")).toHaveText(`${TOTAL} / 30`);
    await parentPage.getByTestId("mark-save").click();
    await expect(parentPage.getByTestId("mark-saved")).toContainText(`Marks saved: ${TOTAL} out of 30`);
    expect(Date.now() - began).toBeLessThan(3 * 60_000);

    // The database holds a paper-only attempt (no text) with the server-derived total and ceiling.
    const admin = createAdminClient();
    const student = await childId();
    const { data: attempt } = await admin
      .from("writing_attempts")
      .select("id, mode, response_source, response_text, submission_reason")
      .eq("student_id", student)
      .eq("task_id", TASK_ID)
      .single();
    expect(attempt).toMatchObject({ mode: "paper", response_source: "paper_only", response_text: "", submission_reason: "user_submitted" });
    const attemptId = attempt!.id as string;
    const { data: mark } = await admin
      .from("writing_marks")
      .select("awarded_marks, max_marks, writing_mark_criteria(criterion_id, score, comment)")
      .eq("attempt_id", attemptId)
      .single();
    expect([Number(mark?.awarded_marks), Number(mark?.max_marks)]).toEqual([TOTAL, 30]);
    expect(mark?.writing_mark_criteria).toHaveLength(6);
    expect(mark?.writing_mark_criteria.find((c: { criterion_id: string }) => c.criterion_id === "punctuation")?.comment).toBe(
      "Speech marks need practice.",
    );

    // The marking screen for it says plainly that nothing was typed.
    await parentPage.goto(`/writing/mark/${attemptId}`);
    await expect(parentPage.getByTestId("response-text")).toContainText("Written on paper. No typed copy was added.");

    // The child sees the marks, per criterion and in total.
    const childPage = await (await contextAs("student-no-attempts")).newPage();
    await childPage.goto("/student/writing");
    await expect(childPage.locator('[data-testid="writing-result-total"]:visible')).toHaveText(`${TOTAL} / 30`);
    await expect(childPage.getByText("Spelling").and(childPage.locator(":visible"))).toBeVisible();

    // The parent sees the same list.
    await parentPage.goto("/parent/writing");
    await expect(parentPage.locator('[data-testid="writing-result-total"]:visible')).toHaveText(`${TOTAL} / 30`);

    // A child cannot mark.
    const childMark = await childPage.context().request.post(`/api/writing/attempts/${attemptId}/mark`, {
      headers: { origin: AUTH_APP_ORIGIN },
      data: { rubricId: "scholarship-written-expression", rubricVersion: 1, scores: { ...SCORES, spelling: 5 } },
    });
    expect(childMark.status()).toBe(404);

    // Another parent (linked to other children) is denied everywhere.
    const strangerContext = await contextAs("parent-multi-children");
    const stranger = await strangerContext.newPage();
    expect((await stranger.goto(`/writing/mark/${attemptId}`))?.status()).toBe(404);
    await stranger.goto("/parent/writing");
    await expect(stranger.getByText("Student No Attempts")).toHaveCount(0);
    await expect(stranger.locator('[data-testid="writing-result-total"]:visible')).toHaveCount(0);

    const post = (path: string, data: unknown) =>
      strangerContext.request.post(path, { headers: { origin: AUTH_APP_ORIGIN }, data });
    const markBody = { rubricId: "scholarship-written-expression", rubricVersion: 1, scores: { ...SCORES, spelling: 5 } };
    expect((await post(`/api/writing/attempts/${attemptId}/mark`, markBody)).status()).toBe(404);
    expect((await post("/api/writing/paper", { childId: student, taskId: TASK_ID, mark: markBody })).status()).toBe(404);
    expect((await post("/api/writing/paper", { childId: student, taskId: TASK_ID, text: "Not my child." })).status()).toBe(404);

    // The mark, and the attempt count, are untouched by all of it.
    const { data: after } = await admin.from("writing_marks").select("awarded_marks").eq("attempt_id", attemptId).single();
    expect(Number(after?.awarded_marks)).toBe(TOTAL);
    const { count } = await admin.from("writing_attempts").select("id", { count: "exact", head: true }).eq("task_id", TASK_ID);
    expect(count).toBe(1);
  });

  test("a paper response can also be typed in (optional), and marked from the marking screen", async ({ contextAs }) => {
    test.setTimeout(120_000);
    const parentPage = await (await contextAs("parent-one-child")).newPage();
    const admin = createAdminClient();
    const student = await childId();

    // Marked on paper with the optional typed copy.
    await parentPage.goto("/writing/mark/new");
    await parentPage.getByText("Also type in what they wrote (optional)").click();
    await parentPage.getByTestId("paper-text").fill("The door creaked open and a cold draught rushed in.");
    await scoreAll(parentPage, SCORES);
    await parentPage.getByTestId("mark-save").click();
    await expect(parentPage.getByTestId("mark-saved")).toBeVisible();
    const { data: typed } = await admin
      .from("writing_attempts")
      .select("id, response_source, response_text")
      .eq("student_id", student)
      .eq("task_id", TASK_ID)
      .single();
    expect(typed).toMatchObject({ response_source: "parent_typed", response_text: "The door creaked open and a cold draught rushed in." });

    // An attempt recorded without marks (API) is marked later on its marking screen.
    const created = await parentPage.context().request.post("/api/writing/paper", {
      headers: { origin: AUTH_APP_ORIGIN },
      data: { childId: student, taskId: TASK_ID },
    });
    expect(created.status()).toBe(200);
    const { attempt } = (await created.json()) as { attempt: { id: string; responseSource: string } };
    expect(attempt.responseSource).toBe("paper_only");
    await parentPage.goto(`/writing/mark/${attempt.id}`);
    await scoreAll(parentPage, { ...SCORES, spelling: 4 });
    await parentPage.getByTestId("mark-save").click();
    await expect(parentPage.getByTestId("mark-saved")).toContainText(`${TOTAL + 2} out of 30`);
  });
});

test.describe("who can open the marking and sitting pages", () => {
  test.beforeEach(cleanWritingRows);
  test.afterEach(cleanWritingRows);

  async function paperAttemptId(): Promise<string> {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("writing_attempts")
      .insert({
        student_id: await childId(),
        task_id: TASK_ID,
        mode: "paper",
        response_source: "paper_only",
        submitted_at: new Date().toISOString(),
        submission_reason: "user_submitted",
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(`seed attempt failed: ${error?.message}`);
    return data.id as string;
  }

  test("a child opening /writing/mark/* is turned away to their own home and sees none of the marking screen", async ({ contextAs }) => {
    const attemptId = await paperAttemptId();
    const page = await (await contextAs("student-no-attempts")).newPage();
    for (const path of [`/writing/mark/${attemptId}`, "/writing/mark/new"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/student$/);
      await expect(page.getByTestId("mark-save")).toHaveCount(0);
      await expect(page.getByTestId("response-text")).toHaveCount(0);
    }
  });

  test("a parent opening /writing/sit/* is turned away to the parent dashboard", async ({ contextAs }) => {
    const page = await (await contextAs("parent-one-child")).newPage();
    await page.goto(`/writing/sit/${TASK_ID}`);
    await expect(page).toHaveURL(/\/parent$/);
    await expect(page.getByTestId("writing-prompt")).toHaveCount(0);
  });

  test("signed-out visitors are redirected to sign-in from every writing page, and see none of it", async ({ contextAs }) => {
    const attemptId = await paperAttemptId();
    const page = await (await contextAs("unauthenticated")).newPage();
    for (const path of [
      `/writing/mark/${attemptId}`,
      "/writing/mark/new",
      `/writing/sit/${TASK_ID}`,
      `/writing/print/${TASK_ID}`,
      "/student/writing",
      "/parent/writing",
    ]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/sign-in/);
      await expect(page.getByTestId("mark-save")).toHaveCount(0);
      await expect(page.getByTestId("writing-prompt")).toHaveCount(0);
      await expect(page.getByTestId("print-page")).toHaveCount(0);
    }
  });

  test("signed-out API calls are refused", async ({ contextAs }) => {
    const attemptId = await paperAttemptId();
    const context = await contextAs("unauthenticated");
    const post = (path: string, data: unknown) => context.request.post(path, { headers: { origin: AUTH_APP_ORIGIN }, data });
    const markBody = { rubricId: "scholarship-written-expression", rubricVersion: 1, scores: SCORES };
    expect((await post(`/api/writing/attempts/${attemptId}/mark`, markBody)).status()).toBe(401);
    expect((await post("/api/writing/attempts", { taskId: TASK_ID, mode: "untimed" })).status()).toBe(401);
    expect((await post("/api/writing/paper", { childId: await childId(), taskId: TASK_ID, mark: markBody })).status()).toBe(401);
  });
});
