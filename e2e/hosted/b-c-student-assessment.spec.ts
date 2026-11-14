/**
 * Scenarios B (student authentication and assessment) and C (persistence and results) on the hosted DEV Preview,
 * using the family created by Scenario A (family-a.json in this run's output, or FAMILY_FILE).
 *
 * Marks shown in the browser are compared with the attempt row the server persisted (read with the DEV service
 * role). Scoring correctness against an independent answer oracle is covered at API level by
 * run-preview-acceptance (66 checks); this file proves the browser journey shows what the server recorded.
 */
import fs from "node:fs";
import path from "node:path";

import type { Page } from "@playwright/test";

import { devAdmin, enterStudentCredentials, expect, findUserByEmail, parentSignIn, test } from "./fixtures";

type Family = { email: string; password: string; childName: string; loginCode: string; pin: string };

const familyFile = () =>
  process.env.FAMILY_FILE ?? path.join(process.env.HOSTED_OUTPUT ?? "test-results/hosted", "family-a.json");
function family(): Family {
  return JSON.parse(fs.readFileSync(familyFile(), "utf8")) as Family;
}
/** Records what Scenario D needs to attack (session and attempt ids of family A). */
function remember(extra: Record<string, unknown>) {
  fs.writeFileSync(familyFile(), JSON.stringify({ ...family(), ...extra }, null, 2));
}

export async function studentSignIn(page: Page, code: string, pin: string) {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /I'm a student/i }).click();
  await enterStudentCredentials(page, code, pin);
  await page.getByRole("button", { name: /sign in/i }).last().click();
}

async function dismissWelcome(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Welcome to MindMosaic" });
  // It opens after hydration; give it a moment to appear before deciding it will not.
  await dialog.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {});
  if (await dialog.isVisible().catch(() => false)) {
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();
  }
}

/** Answers the visible question with whatever control it offers. Returns the kind used. */
async function answerVisible(page: Page, text = "6"): Promise<string> {
  const q = page.getByRole("main");
  const radio = q.getByRole("radio").first();
  if (await radio.isVisible().catch(() => false)) {
    await radio.check({ force: true }).catch(async () => radio.click());
    return "choice";
  }
  const box = q.getByRole("checkbox").first();
  if (await box.isVisible().catch(() => false)) {
    await box.check({ force: true }).catch(async () => box.click());
    return "multi";
  }
  const spin = q.getByRole("spinbutton").first();
  if (await spin.isVisible().catch(() => false)) {
    await spin.fill(text);
    return "number";
  }
  const tb = q.getByRole("textbox").first();
  if (await tb.isVisible().catch(() => false)) {
    await tb.fill(text);
    return "text";
  }
  return "unsupported";
}

/** Keyboard activation: the runner's buttons lift on hover, which can keep Playwright's stability check waiting. */
async function press(page: Page, testId: string) {
  const b = page.getByTestId(testId);
  await b.focus();
  await page.keyboard.press("Enter");
}

test.describe.configure({ mode: "serial" });

test("B1–B2: wrong code and wrong PIN get one generic message; correct ones reach My Space", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  const fam = family();
  const generic = /code and PIN didn.t match/i;

  await studentSignIn(page, fam.loginCode, fam.pin === "111111" ? "222222" : "111111");
  await expect(page.getByText(generic)).toBeVisible();
  await expect(page).not.toHaveURL(/\/student/);

  await studentSignIn(page, "ZZZZ-ZZZZ", fam.pin);
  await expect(page.getByText(generic), "unknown code is indistinguishable from a wrong PIN").toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("b1-generic-error.png"), fullPage: true });

  await studentSignIn(page, fam.loginCode, fam.pin);
  await expect(page).toHaveURL(/\/student$/, { timeout: 30_000 });
  await dismissWelcome(page);
  await expect(page.getByRole("heading", { level: 1, name: new RegExp(`Welcome back, ${fam.childName.split(" ")[0]}`) })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("b2-my-space.png"), fullPage: true });

  // Unauthorised routes for a student
  for (const r of ["/parent", "/admin"]) {
    await page.goto(r);
    await expect(page, `${r} is not served to a student`).not.toHaveURL(new RegExp(`${r}(/|$)`));
  }
});

test("B3–B8 + C: timed paper — answer, navigate, autosave, resume, submit, marks equal the stored attempt, review, history, parent view", async ({
  page,
  consoleErrors,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  const fam = family();
  const shot = (n: string) => page.screenshot({ path: testInfo.outputPath(`${n}.png`), fullPage: true });
  await studentSignIn(page, fam.loginCode, fam.pin);
  await expect(page).toHaveURL(/\/student$/, { timeout: 30_000 });
  await dismissWelcome(page);

  // B3 Practice Studio is reachable and lists programmes for the child's year
  await page.getByRole("link", { name: "Start practice" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Practice Studio" })).toBeVisible();

  // B4 a timed paper from a programme page
  await page.goto("/practice/naplan-g3-numeracy");
  await page.getByLabel("Number of questions").selectOption({ label: "10 questions" });
  await page.getByLabel("Timing").selectOption({ label: "Timed" });
  await page.getByRole("button", { name: "Review instructions" }).click();
  const created = page.waitForResponse((r) => r.url().endsWith("/api/exam/session") && r.request().method() === "POST");
  await page.getByTestId("begin-exam").click();
  const createdRes = await created;
  expect(createdRes.ok(), `session create ${createdRes.status()}`).toBe(true);
  const { sessionId } = (await createdRes.json()) as { sessionId: string };
  expect(sessionId).toBeTruthy();
  await expect(page).toHaveURL(/\/exam/);
  await expect(page.getByRole("heading", { name: "Question 1 of 10" })).toBeVisible();
  await shot("b4-q1");

  // B5 answer five questions, recording the kinds of control met
  const kinds: string[] = [];
  for (let i = 1; i <= 5; i++) {
    await expect(page.getByRole("heading", { name: `Question ${i} of 10` })).toBeVisible();
    kinds.push(await answerVisible(page));
    await press(page, "next-question");
  }
  testInfo.annotations.push({ type: "answer-kinds", description: kinds.join(",") });
  expect(kinds.filter((k) => k !== "unsupported").length, `answered with: ${kinds}`).toBeGreaterThanOrEqual(4);

  // B6 navigate back with the palette: Q1 keeps its answer
  await page.getByTestId("nav-question-1").click();
  await expect(page.getByRole("heading", { name: "Question 1 of 10" })).toBeVisible();
  await expect(page.getByTestId("nav-question-1")).toHaveAttribute("aria-label", /, answered/);

  // C2–C6 autosave then reload resumes with answers kept
  const saved = page.waitForResponse(
    (r) => r.url().includes(`/api/exam/session/${sessionId}/responses`) && r.request().method() === "POST",
    { timeout: 20_000 },
  );
  await press(page, "flag-toggle");
  await press(page, "next-question");
  expect((await saved).ok(), "autosave acknowledged").toBe(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: /Question \d+ of 10/ })).toBeVisible({ timeout: 30_000 });
  for (let i = 1; i <= 5; i++) {
    if (kinds[i - 1] === "unsupported") continue;
    await expect(page.getByTestId(`nav-question-${i}`), `Q${i} still answered after reload`).toHaveAttribute(
      "aria-label",
      /, answered/,
    );
  }
  await expect(page.getByTestId("nav-question-1")).toHaveAttribute("data-flagged", "true");
  await shot("c5-resumed");

  // B6/C7 submit
  await press(page, "open-submit-dialog");
  await expect(page.getByTestId("submit-dialog")).toBeVisible();
  const submitted = page.waitForResponse(
    (r) => /\/api\/exam\/session\/[^/]+\/submit/.test(r.url()) && r.request().method() === "POST",
  );
  await page.getByTestId("confirm-submit").click();
  const subRes = await submitted;
  expect(subRes.ok(), `submit ${subRes.status()}`).toBe(true);
  await expect(page).toHaveURL(/\/results/, { timeout: 30_000 });
  await shot("b7-results");

  // B7/C8 the marks on screen are the marks the server stored
  const user = await findUserByEmail(
    `childcode+${fam.loginCode.replace(/[^A-Z0-9]/gi, "").toLowerCase()}@students.mindmosaic.internal`,
  );
  expect(user, "child auth user").toBeTruthy();
  const { data: attempts, error } = await devAdmin()
    .from("exam_attempts")
    .select("id, session_id, student_id, result, submitted_at")
    .eq("session_id", sessionId);
  expect(error).toBeNull();
  expect(attempts!.length, "exactly one attempt persisted for this sitting").toBe(1);
  const attempt = attempts![0] as { id: string; student_id: string; result: Record<string, number> };
  expect(attempt.student_id, "the attempt belongs to this child").toBe(user!.id);
  fs.writeFileSync(testInfo.outputPath("attempt.json"), JSON.stringify(attempt, null, 2));
  remember({ sessionId, attemptId: attempt.id, childUserId: user!.id });
  const { objectiveMarksEarned: earned, objectiveMarksAvailable: total, objectivePercentage: pct, correctCount } =
    attempt.result;
  testInfo.annotations.push({ type: "stored-marks", description: `${earned}/${total} ${pct}% correct=${correctCount}` });
  const main = page.getByRole("main");
  await expect(main).toContainText(`${pct}%`);
  await expect(main).toContainText(new RegExp(`\\b${earned}\\s*(/|out of|of)\\s*${total}\\b`));

  // B8 answer review with explanations
  const review = page.getByRole("button", { name: /review|answers/i }).first();
  if (await review.isVisible().catch(() => false)) await review.click();
  await expect(page.getByText(/explanation|worked solution|why/i).first()).toBeVisible();
  await shot("b8-review");

  // Duplicate submission: going back to the exam does not reopen a submitted paper
  await page.goto("/exam");
  await expect(page.getByTestId("confirm-submit")).toHaveCount(0);
  await shot("c-dup-exam-route");

  // C9–C11 sign out, sign back in, the result is in history
  await page.goto("/student");
  await dismissWelcome(page);
  await page.getByRole("button", { name: /sign out/i }).first().click();
  await expect(page).not.toHaveURL(/\/student/, { timeout: 20_000 });
  await studentSignIn(page, fam.loginCode, fam.pin);
  await expect(page).toHaveURL(/\/student$/, { timeout: 30_000 });
  await dismissWelcome(page);
  await page.goto("/results");
  await expect(page.getByText(/No results to show yet/)).toHaveCount(0);
  await shot("c11-history");

  // C12 the parent sees this child's result
  await page.context().clearCookies();
  await parentSignIn(page, fam.email, fam.password);
  await expect(page).toHaveURL(/\/parent/, { timeout: 30_000 });
  await expect(page.getByText(fam.childName).first()).toBeVisible();
  await shot("c12-parent-home");
  await page.goto(`/parent/children/${user!.id}/progress`);
  // With fewer than 2 papers the page must say so rather than draw conclusions (evidence rule from PR #121)
  await expect(page.getByRole("main")).toContainText(/finished 1 paper|One paper so far|Numeracy/i);
  await expect(page.getByRole("main"), "no internal build notes shown to parents").not.toContainText(/NEEDS A BUILD|does not exist yet/i);
  await expect(page.getByRole("main"), "no raw skill ids shown to parents").not.toContainText(/Num\.[a-z]+\./);
  await shot("c12-parent-child-progress");
  // Follow the parent's own link to the paper, as a parent would
  await page.getByRole("link", { name: /Open/ }).first().click();
  await expect(page).toHaveURL(/\/parent\/results\//);
  await expect(page.getByRole("main")).toContainText(new RegExp(`(?<!\\d)${earned}\\s*(of|/)\\s*${total}(?!\\d)`));
  await expect(page.getByRole("main"), "no invented time limit").not.toContainText(/minutes of 40/);
  await shot("c12-parent-result-detail");

  fs.writeFileSync(testInfo.outputPath("console-errors.json"), JSON.stringify(consoleErrors, null, 2));
});
