import { readFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

import { e2eEnv } from "../fixtures/env";
import { STUDENTS } from "../fixtures/identities";
import { createAdminClient } from "../fixtures/supabase-admin";

/**
 * The preview-only Scholarship sample through the real student portal: code+PIN sign-in, Exam papers, Year 6,
 * Scholarship, the Comprehensive Sample, 12 questions with the shared passage, the 18-minute timer, submission,
 * server scoring, results and attempt history. Also proves the server-side allowlist (a second, non-allowlisted
 * student and a guest see nothing and cannot start it) and that NAPLAN / ICAS are untouched.
 *
 * Runs against a LOCAL Supabase only (see playwright.scholarship-preview.config.ts); fixtures use a reserved
 * e2e-only domain and the sessions/attempts this spec creates are removed afterwards.
 */

const PATTERN_ID = "scholarship-y6-comprehensive-sample-module";
const ALLOWED = STUDENTS.find((s) => s.key === "student-no-attempts")!;
const NOT_ALLOWED = STUDENTS.find((s) => s.key === "student-second-child")!;

interface DraftQuestion {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  answerKey: { optionId: string };
}
const drafts = [
  "verbal-reasoning",
  "numerical-reasoning",
  "reading",
  "mathematics",
].flatMap(
  (name) =>
    (JSON.parse(readFileSync(`content/scholarship-drafts/scholarship-y6-${name}-draft.json`, "utf8")) as { questions: DraftQuestion[] }).questions,
);
const SAMPLE_IDS = [
  "scholarship-y6-vr-001", "scholarship-y6-vr-016", "scholarship-y6-vr-032",
  "scholarship-y6-nr-001", "scholarship-y6-nr-022", "scholarship-y6-nr-023",
  "scholarship-y6-rc-001", "scholarship-y6-rc-002", "scholarship-y6-rc-003",
  "scholarship-y6-maths-004", "scholarship-y6-maths-007", "scholarship-y6-maths-014",
];
const sample = SAMPLE_IDS.map((id) => drafts.find((q) => q.id === id)!);
const norm = (text: string) => text.replace(/\s+/g, " ").trim();

async function signIn(page: Page, student: (typeof STUDENTS)[number]) {
  await page.goto("/student-sign-in");
  await page.getByLabel("Login code").fill(student.loginCode);
  await page.getByLabel("PIN").fill(e2eEnv.fixturePin);
  await page.getByRole("button", { name: "Sign in and start learning" }).click();
  await expect(page).toHaveURL(/\/student$/, { timeout: 45_000 });
}

async function openPaperPicker(page: Page) {
  // The student's own route: dashboard -> Practice -> Exam papers (the site header on /practice).
  await page.getByRole("link", { name: "Practice", exact: true }).first().click();
  await expect(page).toHaveURL(/\/practice$/);
  await page.getByRole("link", { name: "Exam papers" }).first().click();
  await expect(page).toHaveURL(/\/exams$/);
  await expect(page.getByRole("heading", { level: 1, name: "Sit a whole paper, start to finish" })).toBeVisible();
}

async function removeSessionsFor(studentEmail: string) {
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const id = data.users.find((user) => user.email === studentEmail)?.id;
  if (!id) return;
  const { data: sessions } = await admin.from("exam_sessions").select("id").eq("student_id", id);
  for (const session of sessions ?? []) {
    await admin.from("exam_attempts").delete().eq("session_id", session.id);
    await admin.from("exam_responses").delete().eq("session_id", session.id);
    await admin.from("exam_sessions").delete().eq("id", session.id);
  }
}

test.describe("Scholarship sample: allowlisted student journey", () => {
  test.afterEach(async () => {
    await removeSessionsFor(ALLOWED.email);
  });

  test("sign in, find Scholarship under Exam papers, sit all 12 questions, submit, see results and history", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The full sitting runs once, on desktop; tablet and mobile have their own layout test.");
    test.setTimeout(240_000);

    await signIn(page, ALLOWED);
    await openPaperPicker(page);

    // Year 6 -> Scholarship-style -> Comprehensive Sample
    await expect(page.getByRole("heading", { level: 2, name: "Year 6" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: /Scholarship/i })).toBeVisible();
    const card = page.getByRole("link", { name: /Comprehensive Sample/i }).first();
    await expect(card).toBeVisible();
    await card.click();
    await expect(page).toHaveURL(new RegExp(`/exams/${PATTERN_ID}$`));
    await expect(page.getByRole("heading", { level: 1, name: /Comprehensive Sample/i })).toBeVisible();
    await expect(page.getByText(/12 questions/i).first()).toBeVisible();
    await expect(page.getByText(/18 minutes/i).first()).toBeVisible();

    const created = page.waitForResponse((r) => r.url().endsWith("/api/exam/session") && r.request().method() === "POST");
    await page.getByTestId("start-pattern").click();
    await page.getByTestId("begin-exam").click();
    const sessionResponse = await created;
    expect(sessionResponse.ok()).toBe(true);
    const sessionBody = (await sessionResponse.json()) as { sessionId: string; questions: { id: string; answerKey?: unknown; explanation?: unknown }[] };
    expect(sessionBody.questions).toHaveLength(12);
    expect(sessionBody.questions.map((q) => q.id).sort()).toEqual([...SAMPLE_IDS].sort());
    for (const question of sessionBody.questions) {
      expect(question).not.toHaveProperty("answerKey");
      expect(question).not.toHaveProperty("explanation");
    }

    await expect(page).toHaveURL(/\/exam/);
    // 18-minute timer: the clock starts at 18:00 and has only counted down a little.
    const timer = page.getByTestId("exam-timer");
    await expect(timer).toBeVisible();
    await expect(timer).toHaveAttribute("aria-label", /Time remaining (18:00|17:[0-5]\d)/);

    for (let index = 1; index <= 12; index += 1) {
      await expect(page.getByRole("heading", { name: `Question ${index} of 12` })).toBeVisible();
      const text = norm(await page.locator("main").innerText());
      const question = sample.find((q) => text.includes(norm(q.prompt).slice(0, 60)));
      expect(question, `question ${index} matches one of the 12 sample prompts`).toBeTruthy();
      if (question!.id.includes("-rc-")) {
        await expect(page.getByText("The Estuary Watchers").first()).toBeVisible();
      }
      await page.locator(`label[for$="-option-${question!.answerKey.optionId}"]`).click();
      if (index < 12) await page.getByTestId("next-question").click();
    }

    await page.getByTestId("open-submit-dialog").click();
    await expect(page.getByTestId("submit-dialog")).toBeVisible();
    await expect(page.getByTestId("summary-answered")).toContainText("12");
    const submitted = page.waitForResponse((r) => r.url().includes("/submit") && r.request().method() === "POST");
    await page.getByTestId("confirm-submit").click();
    const submitResponse = await submitted;
    expect(submitResponse.ok()).toBe(true);
    const submitBody = (await submitResponse.json()) as { result: { correctCount: number; totalQuestions: number; objectivePercentage: number } };
    expect(submitBody.result).toMatchObject({ totalQuestions: 12, correctCount: 12, objectivePercentage: 100 });

    await expect(page).toHaveURL(/\/results/);
    await expect(page.getByRole("heading", { level: 1, name: "Your results" })).toBeVisible();
    await expect(page.getByText(/100\s*%/).first()).toBeVisible();

    // Persistence: exactly one attempt for this session, with the server-computed result.
    const admin = createAdminClient();
    const { data: attempts } = await admin.from("exam_attempts").select("session_id, result").eq("session_id", sessionBody.sessionId);
    expect(attempts).toHaveLength(1);
    expect((attempts![0]!.result as { correctCount: number }).correctCount).toBe(12);

    // Attempt history on the student dashboard.
    await page.goto("/student");
    await expect(page.getByText("No completed sessions yet.")).toHaveCount(0);
  });

  test("a second sitting scores a partial paper correctly (server-authoritative)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Scoring is device-independent; run once.");
    test.setTimeout(240_000);
    await signIn(page, ALLOWED);
    await page.goto(`/exams/${PATTERN_ID}`);
    const created = page.waitForResponse((r) => r.url().endsWith("/api/exam/session") && r.request().method() === "POST");
    await page.getByTestId("start-pattern").click();
    await page.getByTestId("begin-exam").click();
    expect((await created).ok()).toBe(true);

    // Answer every question wrongly except those whose key is "a" (answer those correctly): count them from source.
    let expectedCorrect = 0;
    for (let index = 1; index <= 12; index += 1) {
      await expect(page.getByRole("heading", { name: `Question ${index} of 12` })).toBeVisible();
      const text = norm(await page.locator("main").innerText());
      const question = sample.find((q) => text.includes(norm(q.prompt).slice(0, 60)))!;
      const key = question.answerKey.optionId;
      const choose = "a"; // always pick "a": correct only where the key is "a"
      if (key === choose) expectedCorrect += 1;
      await page.locator(`label[for$="-option-${choose}"]`).click();
      if (index < 12) await page.getByTestId("next-question").click();
    }
    await page.getByTestId("open-submit-dialog").click();
    const submitted = page.waitForResponse((r) => r.url().includes("/submit") && r.request().method() === "POST");
    await page.getByTestId("confirm-submit").click();
    const body = (await (await submitted).json()) as { result: { correctCount: number; incorrectCount: number } };
    expect(body.result.correctCount).toBe(expectedCorrect);
    expect(body.result.incorrectCount).toBe(12 - expectedCorrect);
  });

  test("tablet and mobile: the sample opens and renders without horizontal overflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop", "Desktop covered by the full journey.");
    await signIn(page, ALLOWED);
    await page.goto("/exams");
    await expect(page.getByRole("link", { name: /Comprehensive Sample/i }).first()).toBeVisible();
    await page.goto(`/exams/${PATTERN_ID}`);
    const created = page.waitForResponse((r) => r.url().endsWith("/api/exam/session") && r.request().method() === "POST");
    await page.getByTestId("start-pattern").click();
    await page.getByTestId("begin-exam").click();
    expect((await created).ok()).toBe(true);
    await expect(page.getByRole("heading", { name: "Question 1 of 12" })).toBeVisible();
    await expect(page.getByTestId("exam-timer")).toBeVisible();
    await expect(page.getByTestId("next-question")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    // Reading questions with the shared passage: step to the first reading item and check it fits too.
    for (let i = 1; i <= 12; i += 1) {
      const text = norm(await page.locator("main").innerText());
      if (text.includes("The Estuary Watchers")) {
        const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(o).toBeLessThanOrEqual(1);
        break;
      }
      if (i < 12) await page.getByTestId("next-question").click();
    }
  });
});

test.describe("Scholarship sample: server-side access control", () => {
  test("a signed-in student who is not allowlisted sees no Scholarship and cannot start it", async ({ page }) => {
    await signIn(page, NOT_ALLOWED);
    await openPaperPicker(page);
    await expect(page.getByRole("heading", { level: 3, name: /Scholarship/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Comprehensive Sample/i })).toHaveCount(0);
    expect((await page.goto(`/exams/${PATTERN_ID}`))?.status()).toBe(404);

    const response = await page.request.post("/api/exam/session", {
      data: { patternId: PATTERN_ID },
      headers: { origin: new URL(page.url()).origin },
    });
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ error: "unknown_pattern" });
    const other = await page.request.post("/api/exam/session", {
      data: { patternId: "scholarship-y6-mathematics-full" },
      headers: { origin: new URL(page.url()).origin },
    });
    expect(other.status()).toBe(404);
  });

  test("a guest (no sign-in) sees no Scholarship and the sample route is not found", async ({ page }) => {
    await page.goto("/exams");
    await expect(page.getByRole("heading", { level: 1, name: "Sit a whole paper, start to finish" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: /Scholarship/i })).toHaveCount(0);
    expect((await page.goto(`/exams/${PATTERN_ID}`))?.status()).toBe(404);
    const bank = await page.request.get("/api/exam/guest-bank");
    expect(JSON.stringify(await bank.json())).not.toContain("scholarship-y6-");
  });

  test("NAPLAN and ICAS papers are still listed and open for both students", async ({ page }) => {
    for (const student of [ALLOWED, NOT_ALLOWED]) {
      await signIn(page, student);
      await openPaperPicker(page);
      await expect(page.getByRole("heading", { level: 3, name: /NAPLAN/i }).first()).toBeVisible();
      await expect(page.getByRole("heading", { level: 3, name: /ICAS/i }).first()).toBeVisible();
      await page.context().clearCookies();
    }
  });
});
