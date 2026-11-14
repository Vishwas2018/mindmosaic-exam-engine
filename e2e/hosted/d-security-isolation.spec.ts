/**
 * Scenario D — security and family isolation on the hosted DEV Preview, with real browser sessions and real
 * requests. Family A comes from Scenarios A–C (it has a submitted attempt); family B is created here.
 * Nothing here uses a mocked response: every denial is the deployed app or DEV PostgREST refusing.
 */
import fs from "node:fs";
import path from "node:path";

import type { BrowserContext, Page } from "@playwright/test";

import {
  DEV_REF,
  STRONG_PASSWORD,
  api,
  devAdmin,
  devSupabaseUrl,
  enterStudentCredentials,
  expect,
  parentSignIn,
  protectContext,
  seededEmail,
  test,
} from "./fixtures";

type Family = {
  email: string;
  password: string;
  childName: string;
  loginCode: string;
  pin: string;
  sessionId?: string;
  attemptId?: string;
  childUserId?: string;
};
const famFile = () =>
  process.env.FAMILY_FILE ?? path.join(process.env.HOSTED_OUTPUT ?? "test-results/hosted", "family-a.json");

async function studentSignIn(page: Page, code: string, pin: string) {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /I'm a student/i }).click();
  await enterStudentCredentials(page, code, pin);
  await page.getByRole("button", { name: /sign in/i }).last().click();
  await expect(page).toHaveURL(/\/student$/, { timeout: 30_000 });
}

/** The Supabase access token of the browser's signed-in user, read from the app's auth cookie. */
async function accessToken(context: BrowserContext): Promise<string> {
  const name = `sb-${DEV_REF}-auth-token`;
  const parts = (await context.cookies())
    .filter((c) => c.name === name || c.name.startsWith(`${name}.`))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  let raw = parts.map((c) => c.value).join("");
  raw = decodeURIComponent(raw);
  if (raw.startsWith("base64-")) raw = Buffer.from(raw.slice(7), "base64url").toString("utf8");
  const token = (JSON.parse(raw) as { access_token?: string }).access_token;
  if (!token) throw new Error("no access token in auth cookie");
  return token;
}

async function newPage(browserContext: BrowserContext): Promise<Page> {
  const ctx = await browserContext.browser()!.newContext({ viewport: { width: 1440, height: 900 } });
  await protectContext(ctx);
  return ctx.newPage();
}

test.describe.configure({ mode: "serial" });

test("D: two families are isolated; students, parents and anonymous visitors are refused what is not theirs", async ({
  page,
  context,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  const A = JSON.parse(fs.readFileSync(famFile(), "utf8")) as Family;
  expect(A.sessionId && A.attemptId && A.childUserId, "Scenario C recorded family A's sitting").toBeTruthy();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const SB = devSupabaseUrl();
  const evidence: Record<string, unknown> = {};

  // Family B: seeded parent, child created through the parent's own UI
  const bEmail = seededEmail("pb");
  const { error } = await devAdmin().auth.admin.createUser({
    email: bEmail,
    password: STRONG_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: "Accept ParentB", role: "parent" },
  });
  expect(error).toBeNull();
  await parentSignIn(page, bEmail, STRONG_PASSWORD);
  await expect(page).toHaveURL(/\/parent/, { timeout: 30_000 });
  await page.goto("/parent/children");
  const childB = `Ben ${Date.now().toString(36).slice(-4)}`;
  await page.getByLabel("Child's name").fill(childB);
  await page.getByLabel("Year level (optional)").selectOption({ label: "Year 5" });
  const created = page.waitForResponse((r) => r.url().endsWith("/api/parent/children") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Create login" }).click();
  const B = (await (await created).json()) as { loginCode: string; pin: string; childId?: string };
  expect(B.loginCode).toBeTruthy();

  // D1 Parent B sees only family B
  await page.goto("/parent");
  await expect(page.getByText(childB).first()).toBeVisible();
  await expect(page.getByText(A.childName)).toHaveCount(0);
  await page.goto("/parent/results");
  await expect(page.getByText(A.childName)).toHaveCount(0);
  // D2 Parent B cannot open family A's child pages
  for (const sub of ["", "/progress", "/learning", "/writing", "/curriculum", "/learning/preview"]) {
    const res = await page.goto(`/parent/children/${A.childUserId}${sub}`);
    const body = await page.locator("body").innerText();
    expect(body, `parent B on A's child${sub}`).not.toContain(A.childName);
    evidence[`parentB-childA${sub || "/"}`] = res?.status();
  }
  // Parent B's API cannot touch A's child
  const apiPatch = await api(page).patch(`/api/parent/children/${A.childUserId}`, { displayName: "hijacked" });
  expect(apiPatch.status(), "parent B renaming A's child").toBeGreaterThanOrEqual(400);
  evidence.parentB_patch_childA = apiPatch.status();
  // Parent B's JWT reads nothing of A from PostgREST
  const parentBToken = await accessToken(page.context());
  for (const [table, filter] of [
    ["exam_attempts", `student_id=eq.${A.childUserId}`],
    ["exam_sessions", `student_id=eq.${A.childUserId}`],
    ["profiles", `id=eq.${A.childUserId}`],
  ] as const) {
    const r = await fetch(`${SB}/rest/v1/${table}?select=id&${filter}`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${parentBToken}` },
    });
    const rows = r.ok ? ((await r.json()) as unknown[]).length : -1;
    expect(rows, `parent B reads ${table} of A (status ${r.status})`).toBeLessThanOrEqual(0);
    evidence[`parentB_rest_${table}`] = `${r.status}/${rows}`;
  }
  // D3 admin routes are denied to a parent
  await page.goto("/admin");
  await expect(page).not.toHaveURL(/\/admin(\/|$)/);
  evidence.parent_admin = page.url();

  // Parent A sees only family A
  const pageA = await newPage(context);
  await parentSignIn(pageA, A.email, A.password);
  await expect(pageA).toHaveURL(/\/parent/, { timeout: 30_000 });
  await expect(pageA.getByText(A.childName).first()).toBeVisible();
  await expect(pageA.getByText(childB)).toHaveCount(0);
  await pageA.context().close();

  // D4/D5 Student B cannot read or write student A's session or attempt
  const pageSB = await newPage(context);
  await studentSignIn(pageSB, B.loginCode, B.pin);
  // Positive control: the helper reaches the app itself and gets a JSON answer for B's own state
  const control = await api(pageSB).get("/api/exam/session/active");
  expect(control.headers()["content-type"] ?? "", "API reached the app").toContain("json");
  evidence.control_active = control.status();
  const sbGet = await api(pageSB).get(`/api/exam/session/${A.sessionId}`);
  const sbGetBody = await sbGet.text();
  fs.writeFileSync(
    testInfo.outputPath("studentB-get-sessionA.txt"),
    `${sbGet.status()} ${sbGet.headers()["content-type"]}
${sbGetBody.slice(0, 4000)}`,
  );
  expect(sbGetBody, "student B is never handed A's paper").not.toContain(String(A.sessionId) + '"');
  expect(sbGet.status(), `student B reading A's session: ${sbGetBody.slice(0, 200)}`).toBe(404);
  // Well-formed bodies, so a refusal can only come from ownership, not from validation
  const before = await devAdmin().from("exam_attempts").select("id, result").eq("session_id", A.sessionId!).single();
  const sbSave = await api(pageSB).post(`/api/exam/session/${A.sessionId}/responses`, {
    responses: {},
    currentQuestionIndex: 0,
    flaggedQuestionIds: [],
  });
  expect(sbSave.status(), "student B autosaving into A's session").toBe(404);
  const sbSubmit = await api(pageSB).post(`/api/exam/session/${A.sessionId}/submit`, {
    responses: {},
    submissionReason: "user_submitted",
  });
  expect(sbSubmit.status(), "student B submitting A's session").toBe(404);
  const after = await devAdmin().from("exam_attempts").select("id, result").eq("session_id", A.sessionId!).single();
  expect(after.data, "A's stored attempt is unchanged").toEqual(before.data);
  evidence.studentB_api = { get: sbGet.status(), save: sbSave.status(), submit: sbSubmit.status() };
  await pageSB.goto(`/results?attempt=${A.attemptId}`);
  await expect(pageSB.locator("main")).not.toContainText(A.childName);
  const studentBToken = await accessToken(pageSB.context());
  const rest = await fetch(`${SB}/rest/v1/exam_attempts?select=id&id=eq.${A.attemptId}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${studentBToken}` },
  });
  expect(((await rest.json()) as unknown[]).length, "student B reads A's attempt via RLS").toBe(0);
  // Legacy forged-result RPCs stay closed to a signed-in student. Called with their real signatures, so the only
  // acceptable answer is the database refusing EXECUTE (42501), not "no such function".
  const forged = { objectiveMarksEarned: 99, objectiveMarksAvailable: 99, objectivePercentage: 100, FORGED_MARKER: true };
  const calls: Array<[string, Record<string, unknown>]> = [
    ["record_exam_attempt", { p_session_id: A.sessionId, p_responses: {}, p_result: forged }],
    [
      "create_exam_session",
      { p_config: {}, p_seed: "forged", p_selected_question_ids: [], p_expires_at: new Date(Date.now() + 3.6e6).toISOString() },
    ],
  ];
  for (const [fn, args] of calls) {
    const r = await fetch(`${SB}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: anonKey, Authorization: `Bearer ${studentBToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    const t = await r.text();
    expect(r.status, `${fn} as a student: ${t.slice(0, 160)}`).toBe(403);
    expect(t, `${fn} refused by permission`).toMatch(/42501/);
    evidence[`rpc_${fn}`] = `${r.status} ${t.slice(0, 80)}`;
  }
  const stillA = await devAdmin().from("exam_attempts").select("id, result").eq("session_id", A.sessionId!);
  expect(stillA.data!.length, "no forged second attempt").toBe(1);
  expect(JSON.stringify(stillA.data![0]!.result)).not.toContain("FORGED_MARKER");

  // Students never start payments
  const pay = await api(pageSB).post("/api/stripe/checkout", {});
  expect(pay.status(), "student starting a checkout").toBeGreaterThanOrEqual(400);
  evidence.student_checkout = pay.status();
  for (const r of ["/admin", "/parent"]) {
    await pageSB.goto(r);
    await expect(pageSB, `${r} as a student`).not.toHaveURL(new RegExp(`${r}(/|$)`));
  }
  // A child is never shown a plan, a price or a checkout
  await pageSB.goto("/billing");
  await expect(pageSB.locator("main")).not.toContainText(/A\$|per month|Subscribe|Checkout|Choose the Family plan/i);
  await pageSB.context().close();

  // Anonymous
  const anon = await newPage(context);
  for (const r of ["/student", "/parent", "/admin"]) {
    await anon.goto(r);
    await expect(anon, `${r} anonymously`).not.toHaveURL(new RegExp(`${r}(/|\\?|$)`));
  }
  // /results is open to guests (practice without an account) but holds no server data for them
  await anon.goto(`/results?attempt=${A.attemptId}`);
  await expect(anon.locator("main")).not.toContainText(A.childName);
  await expect(anon.locator("main")).toContainText(/No results to show yet|Finish an exam/i);
  const anonCreate = await api(anon).post("/api/exam/session", {});
  expect(anonCreate.status(), "anonymous exam session create").toBeGreaterThanOrEqual(400);
  const anonRest = await fetch(`${SB}/rest/v1/exam_attempts?select=id&limit=1`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  const anonRows = anonRest.ok ? ((await anonRest.json()) as unknown[]).length : 0;
  expect(anonRows, "anonymous reads attempts").toBe(0);
  evidence.anon = { create: anonCreate.status(), rest: `${anonRest.status}/${anonRows}` };
  await anon.context().close();

  fs.writeFileSync(testInfo.outputPath("d-evidence.json"), JSON.stringify(evidence, null, 2));
  fs.writeFileSync(
    path.join(path.dirname(famFile()), "family-b.json"),
    JSON.stringify({ email: bEmail, password: STRONG_PASSWORD, childName: childB, ...B }, null, 2),
  );
});
