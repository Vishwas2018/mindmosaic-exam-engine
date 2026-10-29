// @vitest-environment node
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

vi.mock("server-only", () => ({}));

const state = vi.hoisted(() => ({
  userId: null as string | null,
  rows: new Map<string, unknown>(),
  unavailable: false,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {getUser: async () => ({data: {user: state.userId ? {id: state.userId} : null}})},
  }),
}));

vi.mock("@/features/singapore-maths-sample/attempt-store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/singapore-maths-sample/attempt-store")>();
  const id = (a: string, e: string, k: string) => `${a}\u0000${e}\u0000${k}`;
  const port: import("@/features/singapore-maths-sample/attempt-store").IdempotencyPort = {
    async insert(row) {
      await Promise.resolve();
      const k = id(row.actor_id, row.endpoint, row.key);
      if (state.rows.has(k)) return "conflict";
      state.rows.set(k, row);
      return "inserted";
    },
    async get(a, e, k) {
      await Promise.resolve();
      return (state.rows.get(id(a, e, k)) as never) ?? null;
    },
    async latest(a, e) {
      await Promise.resolve();
      const mine = ([...state.rows.values()] as import("@/features/singapore-maths-sample/attempt-store").StoredRow[]).filter(
        (r) => r.actor_id === a && r.endpoint === e,
      );
      mine.sort((x, y) => (x.created_at === y.created_at ? (x.key < y.key ? 1 : -1) : x.created_at < y.created_at ? 1 : -1));
      return mine[0] ?? null;
    },
    async list(a, e) {
      await Promise.resolve();
      return ([...state.rows.values()] as import("@/features/singapore-maths-sample/attempt-store").StoredRow[]).filter(
        (r) => r.actor_id === a && r.endpoint === e,
      );
    },
  };
  return {
    ...actual,
    // A NEW store object per call, exactly as a new serverless instance would build one.
    getSampleStore: () => {
      if (state.unavailable) throw new actual.SampleStoreUnavailableError("down");
      return actual.createSampleStore(port);
    },
  };
});

import {barModelPilotFixtures} from "@/content/visual-fixtures/bar-model";
import {POST as submit} from "@/app/api/practice/singapore-maths/sample/submit/route";
import {POST as reveal} from "@/app/api/practice/singapore-maths/sample/reveal/route";
import {DELETE as reset, GET as restore} from "@/app/api/practice/singapore-maths/sample/session/route";

const ALICE = "11111111-1111-4111-8111-111111111111";
const BOB = "22222222-2222-4222-8222-222222222222";
const Y3 = barModelPilotFixtures.filter((f) => f.yearLevel === 3);
const Y5 = barModelPilotFixtures.filter((f) => f.yearLevel === 5);
const Q = Y3[0]!;
const Q2 = Y3[1]!;
const BASE = "http://localhost/api/practice/singapore-maths/sample";

const post = (path: string, body: unknown) =>
  new Request(`${BASE}/${path}`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)});
const send = (name: string, answer: unknown) => submit(post("submit", {questionId: name, answer}));
const json = async (r: Response) => (await r.json()) as Record<string, unknown>;

beforeEach(() => {
  state.userId = ALICE;
  state.rows.clear();
  state.unavailable = false;
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubEnv("SINGAPORE_MATHS_SAMPLE_ENABLED", "1");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://qawbnonprodproject.supabase.co");
  vi.stubEnv("SINGAPORE_MATHS_SAMPLE_SUPABASE_REF", "qawbnonprodproject");
  vi.stubEnv("PRODUCTION_SUPABASE_PROJECT_REF", "liveprodproject");
});
afterEach(() => vi.unstubAllEnvs());

describe("Singapore Maths sample routes: gate and authentication", () => {
  it("every route is 404 when the gate is closed (production)", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect((await send(Q.name, 1)).status).toBe(404);
    expect((await reveal(post("reveal", {questionId: Q.name}))).status).toBe(404);
    expect((await restore(new Request(`${BASE}/session?year=3`))).status).toBe(404);
    expect((await reset(new Request(`${BASE}/session`, {method: "DELETE"}))).status).toBe(404);
  });

  it("guests get 401 everywhere", async () => {
    state.userId = null;
    expect((await send(Q.name, 1)).status).toBe(401);
    expect((await reveal(post("reveal", {questionId: Q.name}))).status).toBe(401);
    expect((await restore(new Request(`${BASE}/session?year=3`))).status).toBe(401);
    expect((await reset(new Request(`${BASE}/session`, {method: "DELETE"}))).status).toBe(401);
  });

  it("rejects malformed input without touching storage", async () => {
    expect((await submit(new Request(`${BASE}/submit`, {method: "POST", body: "{nope"}))).status).toBe(400);
    expect((await send(Q.name, "22")).status).toBe(400);
    expect((await send(Q.name, null)).status).toBe(400);
    expect((await send(Q.name, -1)).status).toBe(400);
    expect((await send(Q.name, 22.5)).status).toBe(400);
    expect((await send("no-such-question", 1)).status).toBe(404);
    expect((await restore(new Request(`${BASE}/session?year=4`))).status).toBe(400);
    expect((await reset(new Request(`${BASE}/session?year=9`, {method: "DELETE"}))).status).toBe(400);
    expect(state.rows.size).toBe(0);
  });

  it("answers 503 (not a crash, not a fake verdict) when storage is unavailable", async () => {
    state.unavailable = true;
    for (const response of [
      await send(Q.name, Q.privateAnswerKey),
      await reveal(post("reveal", {questionId: Q.name})),
      await restore(new Request(`${BASE}/session?year=3`)),
      await reset(new Request(`${BASE}/session`, {method: "DELETE"})),
    ]) {
      expect(response.status).toBe(503);
      expect(await json(response)).toEqual({error: "store_unavailable"});
    }
  });
});

describe("Singapore Maths sample routes: one immutable graded submission per question", () => {
  it("a correct answer returns the verdict and the explanation in one response", async () => {
    const body = await json(await send(Q.name, Q.privateAnswerKey));
    expect(body).toMatchObject({correct: true, answer: Q.privateAnswerKey, alreadyAnswered: false, workedExplanation: Q.workedExplanation});
  });

  it("a wrong answer returns no explanation and no hint of the right answer", async () => {
    const body = await json(await send(Q.name, Q.privateAnswerKey + 9));
    expect(body).toEqual({correct: false, answer: Q.privateAnswerKey + 9, alreadyAnswered: false});
  });

  it("QA-002: wrong first, then the correct answer again => the RECORDED wrong verdict, never 'correct'", async () => {
    await send(Q.name, Q.privateAnswerKey + 9);
    const retry = await json(await send(Q.name, Q.privateAnswerKey));
    expect(retry).toEqual({correct: false, answer: Q.privateAnswerKey + 9, alreadyAnswered: true});
  });

  it("QA-002: correct first, then a wrong answer => the RECORDED correct verdict with the answer that was recorded", async () => {
    await send(Q.name, Q.privateAnswerKey);
    const retry = await json(await send(Q.name, Q.privateAnswerKey + 3));
    expect(retry).toMatchObject({correct: true, answer: Q.privateAnswerKey, alreadyAnswered: true});
  });

  it("QA-001: 30 parallel submissions (mixed answers) all agree on one verdict and the explanation never 403s", async () => {
    const results = await Promise.all(
      Array.from({length: 30}, (_, i) => send(Q.name, i % 2 ? Q.privateAnswerKey : Q.privateAnswerKey + 1)),
    );
    const bodies = await Promise.all(results.map(json));
    expect(new Set(bodies.map((b) => `${b.answer}:${b.correct}`)).size).toBe(1);
    expect(bodies.filter((b) => b.alreadyAnswered === false)).toHaveLength(1);
    if (bodies[0]!.correct) {
      const reveals = await Promise.all(Array.from({length: 30}, () => reveal(post("reveal", {questionId: Q.name}))));
      expect(reveals.map((r) => r.status)).toEqual(Array(30).fill(200));
    }
  });
});

describe("Singapore Maths sample routes: explanation access", () => {
  it("is refused before any submission and after a wrong submission, granted after a correct one", async () => {
    expect((await reveal(post("reveal", {questionId: Q.name}))).status).toBe(403);
    await send(Q.name, Q.privateAnswerKey + 9);
    expect((await reveal(post("reveal", {questionId: Q.name}))).status).toBe(403);
    await send(Q2.name, Q2.privateAnswerKey);
    const ok = await reveal(post("reveal", {questionId: Q2.name}));
    expect(ok.status).toBe(200);
    expect(await json(ok)).toEqual({workedExplanation: Q2.workedExplanation});
  });

  it("is refused for unknown questions", async () => {
    expect((await reveal(post("reveal", {questionId: "nope"}))).status).toBe(403);
  });
});

describe("Singapore Maths sample routes: reload, reset, isolation", () => {
  it("restores recorded answers after a reload; explanations only for correct answers", async () => {
    await send(Q.name, Q.privateAnswerKey + 9);
    await send(Q2.name, Q2.privateAnswerKey);

    const restored = await json(await restore(new Request(`${BASE}/session?year=3`)));
    const byId = Object.fromEntries((restored.submissions as Array<Record<string, unknown>>).map((s) => [s.questionId, s]));
    expect(byId[Q.name]).toEqual({questionId: Q.name, answer: Q.privateAnswerKey + 9, correct: false});
    expect(byId[Q2.name]).toMatchObject({correct: true, answer: Q2.privateAnswerKey, workedExplanation: Q2.workedExplanation});
    expect(JSON.stringify(restored)).not.toContain(Q.workedExplanation);
  });

  it("restore is scoped to the requested year and to the signed-in student", async () => {
    await send(Q.name, Q.privateAnswerKey);
    expect(((await json(await restore(new Request(`${BASE}/session?year=5`)))).submissions as unknown[])).toEqual([]);
    state.userId = BOB;
    expect(((await json(await restore(new Request(`${BASE}/session?year=3`)))).submissions as unknown[])).toEqual([]);
    expect((await reveal(post("reveal", {questionId: Q.name}))).status).toBe(403);
    expect(await json(await send(Q.name, Q.privateAnswerKey + 1))).toMatchObject({correct: false, alreadyAnswered: false});
  });

  it("reset starts a new attempt: answers clear, a fresh answer is graded, nothing else is touched", async () => {
    await send(Q.name, Q.privateAnswerKey + 9);
    state.userId = BOB;
    await send(Q.name, Q.privateAnswerKey);
    state.userId = ALICE;

    expect((await reset(new Request(`${BASE}/session?year=3`, {method: "DELETE"}))).status).toBe(200);

    expect(((await json(await restore(new Request(`${BASE}/session?year=3`)))).submissions as unknown[])).toEqual([]);
    expect(await json(await send(Q.name, Q.privateAnswerKey))).toMatchObject({correct: true, alreadyAnswered: false});
    state.userId = BOB;
    expect(await json(await send(Q.name, Q.privateAnswerKey + 1))).toMatchObject({correct: true, alreadyAnswered: true});
  });

  it("reset without a year renews both years and never deletes earlier attempts", async () => {
    await send(Q.name, Q.privateAnswerKey);
    const y5 = Y5[0]!;
    await send(y5.name, y5.privateAnswerKey);
    const before = state.rows.size;

    await reset(new Request(`${BASE}/session`, {method: "DELETE"}));

    expect(state.rows.size).toBeGreaterThan(before); // only appended
    expect(((await json(await restore(new Request(`${BASE}/session?year=3`)))).submissions as unknown[])).toEqual([]);
    expect(((await json(await restore(new Request(`${BASE}/session?year=5`)))).submissions as unknown[])).toEqual([]);
  });

  it("answer confidentiality: no response ever contains a private answer key field", async () => {
    const all = [
      await json(await send(Q.name, Q.privateAnswerKey)),
      await json(await send(Q2.name, Q2.privateAnswerKey + 1)),
      await json(await restore(new Request(`${BASE}/session?year=3`))),
    ];
    expect(JSON.stringify(all)).not.toMatch(/privateAnswerKey/);
  });
});
