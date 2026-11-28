// @vitest-environment node
import {describe, expect, it, vi} from "vitest";

vi.mock("server-only", () => ({}));

import {
  createSampleStore,
  SampleStoreUnavailableError,
  type IdempotencyPort,
  type StoredRow,
} from "@/features/singapore-maths-sample/attempt-store";

const ALICE = "11111111-1111-4111-8111-111111111111";
const BOB = "22222222-2222-4222-8222-222222222222";
const Q3A = "pilot-y3-part-whole-01";
const Q3B = "pilot-y3-comparison-01";
const Q5A = "pilot-y5-before-after-01";

/**
 * In-memory stand-in for the `idempotency_keys` table. It models the one property the store relies on:
 * insert is atomic with respect to the primary key (actor_id, endpoint, key). The real table is exercised
 * against DEV Supabase in the PR's hosted evidence.
 */
function fakeTable() {
  const rows = new Map<string, StoredRow>();
  const id = (a: string, e: string, k: string) => `${a}\u0000${e}\u0000${k}`;
  const port: IdempotencyPort = {
    async insert(row) {
      await Promise.resolve(); // yield, so concurrent callers genuinely interleave
      const k = id(row.actor_id, row.endpoint, row.key);
      if (rows.has(k)) return "conflict";
      rows.set(k, row);
      return "inserted";
    },
    async get(actorId, endpoint, key) {
      await Promise.resolve();
      return rows.get(id(actorId, endpoint, key)) ?? null;
    },
    async latest(actorId, endpoint) {
      await Promise.resolve();
      const mine = [...rows.values()].filter((r) => r.actor_id === actorId && r.endpoint === endpoint);
      mine.sort((a, b) => (a.created_at === b.created_at ? (a.key < b.key ? 1 : -1) : a.created_at < b.created_at ? 1 : -1));
      return mine[0] ?? null;
    },
    async list(actorId, endpoint) {
      await Promise.resolve();
      return [...rows.values()].filter((r) => r.actor_id === actorId && r.endpoint === endpoint);
    },
  };
  return {port, rows};
}

describe("Singapore Maths sample attempt store (durable, immutable per question)", () => {
  it("records the first submission and reports created=true", async () => {
    const {port} = fakeTable();
    const store = createSampleStore(port);

    const first = await store.recordSubmission(ALICE, 3, Q3A, 22, true);

    expect(first.created).toBe(true);
    expect(first.submission).toMatchObject({questionId: Q3A, answer: 22, correct: true});
  });

  it("QA-002: a later submission returns the RECORDED answer and verdict, never a verdict for the new answer", async () => {
    const {port} = fakeTable();
    const store = createSampleStore(port);

    await store.recordSubmission(ALICE, 3, Q3A, 99, false); // wrong first
    const retry = await store.recordSubmission(ALICE, 3, Q3A, 22, true); // the correct answer typed later

    expect(retry.created).toBe(false);
    expect(retry.submission).toMatchObject({answer: 99, correct: false});

    await store.recordSubmission(ALICE, 3, Q3B, 12, true); // correct first
    const wrongLater = await store.recordSubmission(ALICE, 3, Q3B, 7, false);

    expect(wrongLater.created).toBe(false);
    expect(wrongLater.submission).toMatchObject({answer: 12, correct: true});
  });

  it("concurrent submissions for one question store exactly one row and all callers see the same verdict", async () => {
    const {port, rows} = fakeTable();
    const store = createSampleStore(port);

    const results = await Promise.all(
      Array.from({length: 40}, (_, i) => store.recordSubmission(ALICE, 3, Q3A, i % 2 ? 22 : 23, i % 2 === 1)),
    );

    expect(results.filter((r) => r.created)).toHaveLength(1);
    expect(new Set(results.map((r) => `${r.submission.answer}:${r.submission.correct}`)).size).toBe(1);
    const submitRows = [...rows.values()].filter((r) => r.endpoint.startsWith("singapore_maths_sample:submit:"));
    expect(submitRows).toHaveLength(1);
  });

  it("concurrent first use creates exactly one attempt", async () => {
    const {port, rows} = fakeTable();
    const store = createSampleStore(port);

    const ids = await Promise.all(Array.from({length: 25}, () => store.currentAttemptId(ALICE, 3)));

    expect(new Set(ids).size).toBe(1);
    expect([...rows.values()].filter((r) => r.endpoint === "singapore_maths_sample:attempt:y3")).toHaveLength(1);
  });

  it("QA-001: another server instance, or a restarted one, sees what was recorded (no process memory involved)", async () => {
    const {port} = fakeTable();
    const instanceA = createSampleStore(port);
    await instanceA.recordSubmission(ALICE, 3, Q3A, 22, true);

    const instanceB = createSampleStore(port); // a different instance / a restart: new store object, same database
    expect(await instanceB.getSubmission(ALICE, 3, Q3A)).toMatchObject({answer: 22, correct: true});
    expect((await instanceB.listSubmissions(ALICE, 3)).map((s) => s.questionId)).toEqual([Q3A]);
    const again = await instanceB.recordSubmission(ALICE, 3, Q3A, 1, false);
    expect(again).toMatchObject({created: false, submission: {answer: 22, correct: true}});
  });

  it("isolates students from each other", async () => {
    const {port} = fakeTable();
    const store = createSampleStore(port);
    await store.recordSubmission(ALICE, 3, Q3A, 22, true);

    expect(await store.getSubmission(BOB, 3, Q3A)).toBeNull();
    expect(await store.listSubmissions(BOB, 3)).toEqual([]);
    const bob = await store.recordSubmission(BOB, 3, Q3A, 5, false);
    expect(bob).toMatchObject({created: true, submission: {answer: 5, correct: false}});
    expect(await store.getSubmission(ALICE, 3, Q3A)).toMatchObject({answer: 22, correct: true});
  });

  it("keeps Year 3 and Year 5 attempts independent", async () => {
    const {port} = fakeTable();
    const store = createSampleStore(port);
    await store.recordSubmission(ALICE, 3, Q3A, 22, true);
    await store.recordSubmission(ALICE, 5, Q5A, 45, true);

    expect((await store.listSubmissions(ALICE, 3)).map((s) => s.questionId)).toEqual([Q3A]);
    expect((await store.listSubmissions(ALICE, 5)).map((s) => s.questionId)).toEqual([Q5A]);
    await store.startNewAttempt(ALICE, 3);
    expect(await store.listSubmissions(ALICE, 3)).toEqual([]);
    expect((await store.listSubmissions(ALICE, 5)).map((s) => s.questionId)).toEqual([Q5A]);
  });

  it("a new attempt is the only retry: it starts empty, allows a fresh answer, and keeps the old attempt's rows", async () => {
    const {port, rows} = fakeTable();
    let clock = Date.parse("2026-10-30T00:00:00.000Z");
    const store = createSampleStore(port, () => new Date((clock += 1000)));

    await store.recordSubmission(ALICE, 3, Q3A, 99, false);
    const first = await store.currentAttemptId(ALICE, 3);
    const second = await store.startNewAttempt(ALICE, 3);

    expect(second).not.toBe(first);
    expect(await store.currentAttemptId(ALICE, 3)).toBe(second);
    expect(await store.listSubmissions(ALICE, 3)).toEqual([]);
    const fresh = await store.recordSubmission(ALICE, 3, Q3A, 22, true);
    expect(fresh).toMatchObject({created: true, submission: {answer: 22, correct: true}});
    // earlier attempt's evidence is kept
    expect([...rows.values()].some((r) => r.endpoint === `singapore_maths_sample:submit:y3:${first}` && r.key === Q3A)).toBe(true);
  });

  it("a reset before any submission still wins over the initial attempt marker", async () => {
    const {port} = fakeTable();
    const store = createSampleStore(port);
    const reset = await store.startNewAttempt(ALICE, 5);
    expect(await store.currentAttemptId(ALICE, 5)).toBe(reset);
  });

  it("concurrent resets and submissions never throw and always converge on one current attempt", async () => {
    const {port} = fakeTable();
    const store = createSampleStore(port);

    await Promise.all([
      ...Array.from({length: 10}, () => store.startNewAttempt(ALICE, 3)),
      ...Array.from({length: 10}, (_, i) => store.recordSubmission(ALICE, 3, Q3A, i, false)),
    ]);

    const current = await store.currentAttemptId(ALICE, 3);
    expect(await store.currentAttemptId(ALICE, 3)).toBe(current);
  });

  it("stored rows carry a retention date for the table's reaper and never the correct answer", async () => {
    const {port, rows} = fakeTable();
    const store = createSampleStore(port, () => new Date("2026-10-30T00:00:00.000Z"));
    await store.recordSubmission(ALICE, 3, Q3A, 22, true);

    for (const row of rows.values()) {
      expect(Date.parse(row.expires_at)).toBeGreaterThan(Date.parse("2026-10-30T00:00:00.000Z"));
      expect(JSON.stringify(row)).not.toMatch(/privateAnswerKey|workedExplanation|explanation/);
    }
  });

  it("fails loudly (not silently) when the recorded row cannot be read back or the database fails", async () => {
    const {port, rows} = fakeTable();
    const store = createSampleStore(port);
    await store.recordSubmission(ALICE, 3, Q3A, 22, true);
    for (const [k, row] of rows) if (row.key === Q3A) rows.set(k, {...row, response_body: {corrupt: true}});

    await expect(store.recordSubmission(ALICE, 3, Q3A, 1, false)).rejects.toBeInstanceOf(SampleStoreUnavailableError);

    const broken = createSampleStore({
      ...port,
      latest: async () => {
        throw new SampleStoreUnavailableError("db down");
      },
    });
    await expect(broken.recordSubmission(ALICE, 3, Q3A, 1, false)).rejects.toBeInstanceOf(SampleStoreUnavailableError);
  });
});
