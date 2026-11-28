/**
 * A-01 regression: /api/practice/check must not be an answer oracle.
 *
 * Before the fix the route accepted any question id with no session, resolved it from the raw authored bank
 * (bypassing the publication gate) and returned the answer and explanation. These tests pin the closed behaviour
 * with the gate in enforce mode (as on every deployed build) and a bank holding approved and unapproved items.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const pool = vi.hoisted(() => ({
  questions: [] as Array<{ id: string; examStyle: string; answerKey: { kind: string; optionId?: string } }>,
  approved: new Set<string>(),
  userId: null as string | null,
}));

vi.mock("@/content/questions/practice-bank", async () => {
  const { questionBank } = await import("@/content/questions/question-bank");
  const { loadScholarshipDraftQuestions } = await import("@/tests/helpers/scholarship-published");
  const singles = questionBank.filter((q) => q.answerKey.kind === "single_option").slice(0, 6);
  const scholarship = loadScholarshipDraftQuestions("nr")
    .filter((q) => q.answerKey.kind === "single_option")
    .slice(0, 2);
  pool.questions = [...singles, ...scholarship] as typeof pool.questions;
  // Approve the first four general items and both scholarship items; items 4 and 5 stay unapproved.
  pool.approved = new Set([...singles.slice(0, 4), ...scholarship].map((q) => q.id));
  return { publishedExamBank: pool.questions };
});
vi.mock("@/server/publication-evidence", () => ({
  getPublicationEligibility: () => ({
    problems: [],
    approvals: new Map([...pool.approved].map((id) => [id, {}])),
  }),
}));
vi.mock("@/server/practice-session-user", () => ({
  getSignedInUserId: vi.fn(async () => pool.userId),
}));

const ORIGIN = "http://localhost:3000";

beforeAll(() => {
  vi.stubEnv("MM_PUBLICATION_GATE", "enforce");
  vi.stubEnv("PRACTICE_SESSION_SECRET", "test-practice-secret-a01");
});
beforeEach(() => {
  pool.userId = null;
});
afterEach(() => {
  vi.useRealTimers();
});

async function loadRoutes() {
  const check = await import("@/app/api/practice/check/route");
  const questions = await import("@/app/api/practice/session/questions/route");
  const token = await import("@/server/practice-session-token");
  return { checkPOST: check.POST, questionsGET: questions.GET, ...token };
}

function checkRequest(body: unknown, headers: Record<string, string> = { origin: ORIGIN, host: "localhost:3000" }) {
  return new Request(`${ORIGIN}/api/practice/check`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function general(index: number) {
  return pool.questions.filter((q) => q.examStyle !== "scholarship_style")[index]!;
}
function scholarship(index: number) {
  return pool.questions.filter((q) => q.examStyle === "scholarship_style")[index]!;
}

describe("A-01 practice answer oracle — negative cases", () => {
  it("refuses a check with no practice token (the original exploit shape)", async () => {
    const { checkPOST } = await loadRoutes();
    const q = general(0);
    const res = await checkPOST(checkRequest({ questionId: q.id, answer: q.answerKey.optionId }));
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).not.toContain("correctAnswer");
    expect(text).not.toContain("explanation");
  });

  it("refuses an unapproved question even inside a validly signed token", async () => {
    const { checkPOST, issuePracticeToken } = await loadRoutes();
    const unapproved = general(4);
    expect(pool.approved.has(unapproved.id)).toBe(false);
    const practiceToken = issuePracticeToken({ ids: [unapproved.id] })!;
    const res = await checkPOST(checkRequest({ questionId: unapproved.id, answer: "A", practiceToken }));
    expect(res.status).toBe(404);
    expect(await res.text()).not.toContain("correctAnswer");
  });

  it("refuses an approved question that was not delivered in the token's set", async () => {
    const { checkPOST, issuePracticeToken } = await loadRoutes();
    const practiceToken = issuePracticeToken({ ids: [general(0).id] })!;
    const res = await checkPOST(checkRequest({ questionId: general(1).id, answer: "A", practiceToken }));
    expect(res.status).toBe(404);
  });

  it("refuses a tampered token (ids swapped, signature kept)", async () => {
    const { checkPOST, issuePracticeToken } = await loadRoutes();
    const token = issuePracticeToken({ ids: [general(0).id] })!;
    const [, sig] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ ids: [general(4).id], exp: Math.floor(Date.now() / 1000) + 3600 }),
    ).toString("base64url");
    const res = await checkPOST(
      checkRequest({ questionId: general(4).id, answer: "A", practiceToken: `${forgedPayload}.${sig}` }),
    );
    expect(res.status).toBe(403);
  });

  it("refuses a token signed with a different key", async () => {
    const { checkPOST, issuePracticeToken } = await loadRoutes();
    const practiceToken = issuePracticeToken({ ids: [general(0).id] }, { key: Buffer.from("attacker-key") })!;
    const res = await checkPOST(checkRequest({ questionId: general(0).id, answer: "A", practiceToken }));
    expect(res.status).toBe(403);
  });

  it("refuses an expired token", async () => {
    const { checkPOST, issuePracticeToken, PRACTICE_TOKEN_TTL_SECONDS } = await loadRoutes();
    const issuedAt = Math.floor(Date.now() / 1000) - PRACTICE_TOKEN_TTL_SECONDS - 1;
    const practiceToken = issuePracticeToken({ ids: [general(0).id] }, { now: issuedAt })!;
    const res = await checkPOST(checkRequest({ questionId: general(0).id, answer: "A", practiceToken }));
    expect(res.status).toBe(403);
  });

  it("does not disclose the answer before an attempt (empty answer)", async () => {
    const { checkPOST, issuePracticeToken } = await loadRoutes();
    const practiceToken = issuePracticeToken({ ids: [general(0).id] })!;
    for (const answer of [null, "", []]) {
      const res = await checkPOST(checkRequest({ questionId: general(0).id, answer, practiceToken }));
      expect(res.status).toBe(400);
      expect(await res.text()).not.toContain("correctAnswer");
    }
  });

  it("refuses a cross-site request (no Origin)", async () => {
    const { checkPOST, issuePracticeToken } = await loadRoutes();
    const practiceToken = issuePracticeToken({ ids: [general(0).id] })!;
    const res = await checkPOST(
      checkRequest({ questionId: general(0).id, answer: "A", practiceToken }, { host: "localhost:3000" }),
    );
    expect(res.status).toBe(403);
  });

  it("requires sign-in for scholarship-style content", async () => {
    const { checkPOST, issuePracticeToken } = await loadRoutes();
    const q = scholarship(0);
    const practiceToken = issuePracticeToken({ ids: [q.id], sub: "user-a" })!;
    const res = await checkPOST(checkRequest({ questionId: q.id, answer: q.answerKey.optionId, practiceToken }));
    expect(res.status).toBe(401);
  });

  it("refuses scholarship content when the token belongs to another user", async () => {
    const { checkPOST, issuePracticeToken } = await loadRoutes();
    const q = scholarship(0);
    pool.userId = "user-b";
    const practiceToken = issuePracticeToken({ ids: [q.id], sub: "user-a" })!;
    const res = await checkPOST(checkRequest({ questionId: q.id, answer: q.answerKey.optionId, practiceToken }));
    expect(res.status).toBe(404);
  });

  it("never delivers scholarship content, or a token for it, to a guest", async () => {
    const { questionsGET, verifyPracticeToken } = await loadRoutes();
    const res = await questionsGET(
      new Request(`${ORIGIN}/api/practice/session/questions?style=scholarship_style&year=6&subject=numeracy&strand=x`),
    );
    const body = (await res.json()) as { questions: { id: string }[]; practiceToken: string };
    const verdict = verifyPracticeToken(body.practiceToken);
    expect(verdict.ok).toBe(true);
    const scholarshipIds = new Set(pool.questions.filter((q) => q.examStyle === "scholarship_style").map((q) => q.id));
    expect(body.questions.some((q) => scholarshipIds.has(q.id))).toBe(false);
    if (verdict.ok) expect(verdict.claims.ids.some((id) => scholarshipIds.has(id))).toBe(false);
  });

  it("caps the set size, so one token cannot cover the whole bank", async () => {
    const { questionsGET, verifyPracticeToken, PRACTICE_TOKEN_MAX_QUESTIONS } = await loadRoutes();
    const res = await questionsGET(new Request(`${ORIGIN}/api/practice/session/questions?count=100000`));
    const body = (await res.json()) as { practiceToken: string; count: number };
    expect(body.count).toBeLessThanOrEqual(PRACTICE_TOKEN_MAX_QUESTIONS);
    const verdict = verifyPracticeToken(body.practiceToken);
    expect(verdict.ok && verdict.claims.ids.length).toBeLessThanOrEqual(PRACTICE_TOKEN_MAX_QUESTIONS);
  });
});

describe("A-01 practice feedback — positive cases", () => {
  it("scores and explains an approved question delivered in the set, after an answer", async () => {
    const { checkPOST, questionsGET } = await loadRoutes();
    const q = general(0);
    const delivered = await questionsGET(
      new Request(`${ORIGIN}/api/practice/session/questions?count=10&seed=a01`),
    );
    const set = (await delivered.json()) as { questions: { id: string; answerKey?: unknown }[]; practiceToken: string };
    expect(set.questions.map((x) => x.id)).toContain(q.id);
    // Delivery stays answer-stripped.
    expect(set.questions.every((x) => x.answerKey === undefined)).toBe(true);

    const res = await checkPOST(
      checkRequest({ questionId: q.id, answer: q.answerKey.optionId, practiceToken: set.practiceToken }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; correct: boolean; correctAnswer: string | null };
    expect(body.status).toBe("correct");
    expect(body.correct).toBe(true);
    expect(body.correctAnswer).not.toBeNull();
  });

  it("marks a wrong answer incorrect and still returns the feedback", async () => {
    const { checkPOST, issuePracticeToken } = await loadRoutes();
    const q = general(1);
    const practiceToken = issuePracticeToken({ ids: [q.id] })!;
    const res = await checkPOST(checkRequest({ questionId: q.id, answer: "__not-an-option__", practiceToken }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { correct: boolean; correctAnswer: string | null };
    expect(body.correct).toBe(false);
    expect(body.correctAnswer).not.toBeNull();
  });

  it("lets the signed-in owner check scholarship content from their own set", async () => {
    const { checkPOST, issuePracticeToken } = await loadRoutes();
    const q = scholarship(0);
    pool.userId = "user-a";
    const practiceToken = issuePracticeToken({ ids: [q.id], sub: "user-a" })!;
    const res = await checkPOST(checkRequest({ questionId: q.id, answer: q.answerKey.optionId, practiceToken }));
    expect(res.status).toBe(200);
    expect(((await res.json()) as { correct: boolean }).correct).toBe(true);
  });
});

describe("practice token key", () => {
  it("fails closed on a deployed build with no secret", async () => {
    const { practiceTokenKey, issuePracticeToken, verifyPracticeToken } = await loadRoutes();
    const env = { VERCEL_ENV: "preview" } as unknown as NodeJS.ProcessEnv;
    expect(practiceTokenKey(env)).toBeNull();
    expect(issuePracticeToken({ ids: ["x"] }, { key: practiceTokenKey(env) })).toBeNull();
    expect(verifyPracticeToken("a.b", { key: practiceTokenKey(env) })).toEqual({ ok: false, reason: "unavailable" });
  });

  it("derives a key from the service-role secret that differs from the secret itself", async () => {
    const { practiceTokenKey } = await loadRoutes();
    const key = practiceTokenKey({ VERCEL_ENV: "preview", SUPABASE_SERVICE_ROLE_KEY: "svc" } as unknown as NodeJS.ProcessEnv);
    expect(key).not.toBeNull();
    expect(key!.toString("utf8")).not.toContain("svc");
    expect(key!.length).toBe(32);
  });
});
