import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { bankQuestion } from "@/tests/fixtures/exam-pattern-bank";
import { PATCH, POST, PUT } from "@/app/api/exam/guest-session/route";
import { setGuardStoreForTests } from "@/lib/security/guard-store";
import { downStore, sharedMemoryStore } from "@/tests/fixtures/guard-store";

const state = vi.hoisted(() => ({ browser: undefined as string | undefined, spent: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = name === "mm-guest-spent" ? state.spent : state.browser;
      return value ? { value } : undefined;
    },
  }),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/server/exam-bank", () => ({
  getGuestExamBank: () => [{
    ...bankQuestion({ id: "synthetic-guest-maths", subject: "numeracy", yearLevel: 3, examStyle: "naplan_style" }),
    explanation: "Synthetic worked example.",
  }],
}));

const selection = {
  config: { yearLevel: 3, examStyle: "naplan_style", subject: "numeracy", questionCount: 1, timing: "timed" },
};
const url = "http://localhost/api/exam/guest-session";
function request(method: string, data: unknown, origin = "http://localhost", client?: string) {
  const headers: Record<string, string> = { origin, host: "localhost" };
  if (client) headers["x-forwarded-for"] = client;
  return new Request(url, { method, headers, body: JSON.stringify(data) });
}

beforeEach(() => {
  vi.stubEnv("VERCEL", "1");
  setGuardStoreForTests(sharedMemoryStore());
  state.browser = undefined;
  state.spent = undefined;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-20T00:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  setGuardStoreForTests(undefined);
});

async function start(config = selection.config) {
  const response = await POST(request("POST", { selection: { config } }));
  expect(response.status).toBe(201);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  const cookie = response.cookies.get("mm-guest-exam");
  expect(cookie?.httpOnly).toBe(true);
  state.browser = cookie?.value;
  return { ...(await response.json()), cookie: cookie?.value };
}

describe("guest exam disclosure boundary", () => {
  it("delivers a candidate projection and reveals review material after submission", async () => {
    const started = await start();
    expect(started.questions).toHaveLength(1);
    expect(started.questions[0]).not.toHaveProperty("answerKey");
    expect(started.questions[0]).not.toHaveProperty("explanation");
    expect(started.questions[0]).not.toHaveProperty("sampleResponse");

    const other = await start();
    const blank = await PUT(request("PUT", { ticket: other.ticket, responses: {} }));
    expect((await blank.json()).reviewQuestions).toEqual([]);
    state.browser = started.cookie;

    const responses = { [started.questions[0].id]: "a" };
    const response = await PUT(request("PUT", { ticket: started.ticket, responses }));
    expect(response.status).toBe(200);
    const submitted = await response.json();
    expect(submitted.reviewQuestions[0]).toHaveProperty("answerKey");
    expect(submitted.reviewQuestions[0].explanation).toBe("Synthetic worked example.");
    const retry = await PUT(request("PUT", { ticket: started.ticket, responses }));
    expect(await retry.json()).toEqual(submitted);
  });

  it("records a candidate-reported timer expiry for a timed ticket and ignores it for untimed ones", async () => {
    const timed = await start();
    const answered = { [timed.questions[0].id]: "a" };
    const expired = await (await PUT(request("PUT", { ticket: timed.ticket, responses: answered, submissionReason: "timer_expired" }))).json();
    expect(expired.result.submissionReason).toBe("timer_expired");
    expect(expired.result.timeTakenSeconds).toBe(timed.durationSeconds);
    const manual = await (await PUT(request("PUT", { ticket: timed.ticket, responses: answered }))).json();
    expect(manual.result.submissionReason).toBe("user_submitted");

    const untimed = await start({ ...selection.config, timing: "untimed" } as typeof selection.config);
    const claimed = await (await PUT(request("PUT", { ticket: untimed.ticket, responses: {}, submissionReason: "timer_expired" }))).json();
    expect(claimed.result.submissionReason).toBe("user_submitted");
  });

  it("rejects unrelated browsers, expired attempts and unassigned responses", async () => {
    const { ticket } = await start();
    const browser = state.browser;
    state.browser = undefined;
    expect((await PUT(request("PUT", { ticket, responses: {} }))).status).toBe(404);
    state.browser = browser;
    expect((await PUT(request("PUT", { ticket, responses: { unrelated: "a" } }))).status).toBe(400);
    vi.setSystemTime(Date.now() + 4 * 60 * 60 * 1000);
    expect((await PUT(request("PUT", { ticket, responses: {} }))).status).toBe(404);
  });

  it("keeps feedback out of timed attempts and allows it for answered confidence practice", async () => {
    const timed = await start();
    const answer = { questionId: timed.questions[0].id, answer: "a" };
    expect((await PATCH(request("PATCH", { ticket: timed.ticket, ...answer }))).status).toBe(404);
    const confidence = await start({ ...selection.config, timing: "untimed", confidenceMode: true } as typeof selection.config);
    expect((await PATCH(request("PATCH", { ticket: confidence.ticket, ...answer, answer: "" }))).status).toBe(400);
    const feedback = await PATCH(request("PATCH", { ticket: confidence.ticket, ...answer }));
    expect(await feedback.json()).toEqual({ explanation: "Synthetic worked example." });
  });

  it("refuses scholarship guest starts and cross-origin requests", async () => {
    const scholarship = { ...selection.config, yearLevel: 6, examStyle: "scholarship_style" };
    expect((await POST(request("POST", { selection: { config: scholarship } }))).status).toBe(404);
    expect((await POST(request("POST", { selection }, "http://other.test"))).status).toBe(403);
  });

  it("throttles a browser that keeps starting and submitting sessions to harvest answers", async () => {
    const client = "203.0.113.7";
    state.browser = "browser-harvester";
    const starts: number[] = [];
    for (let i = 0; i < 21; i += 1) starts.push((await POST(request("POST", { selection }, "http://localhost", client))).status);
    expect(starts.filter((status) => status === 429)).toHaveLength(1);
    const blocked = await POST(request("POST", { selection }, "http://localhost", client));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toMatch(/^\d+$/);
    expect(await blocked.json()).toEqual({ error: "rate_limited" });

    // A different browser behind the same address (shared NAT) is unaffected.
    state.browser = "browser-neighbour";
    expect((await POST(request("POST", { selection }, "http://localhost", client))).status).toBe(201);
  });

  it("still throttles by address when the client discards its cookie, with a ceiling high enough for a classroom", async () => {
    state.browser = undefined;
    const statuses: number[] = [];
    for (let i = 0; i < 121; i += 1) statuses.push((await POST(request("POST", { selection }, "http://localhost", "198.51.100.9"))).status);
    expect(statuses.slice(0, 120).every((status) => status === 201)).toBe(true);
    expect(statuses[120]).toBe(429);
  });

  it("does not return review material to a throttled submit", async () => {
    const started = await start();
    const { ticket } = started;
    let throttled = 0;
    for (let i = 0; i < 21; i += 1) {
      const response = await PUT(request("PUT", { ticket, responses: {} }, "http://localhost", "203.0.113.8"));
      if (response.status === 429) {
        throttled += 1;
        expect(await response.json()).not.toHaveProperty("reviewQuestions");
      }
    }
    expect(throttled).toBe(1);
  });

  it("refuses to re-submit a ticket with different answers once answers were revealed", async () => {
    const started = await start();
    const id = started.questions[0].id;
    const first = await PUT(request("PUT", { ticket: started.ticket, responses: { [id]: "a" } }));
    expect(first.status).toBe(200);
    const spent = first.cookies.get("mm-guest-spent");
    expect(spent?.httpOnly).toBe(true);
    state.spent = spent?.value;

    const probe = await PUT(request("PUT", { ticket: started.ticket, responses: { [id]: "b" } }));
    expect(probe.status).toBe(409);
    expect(await probe.json()).toEqual({ error: "already_submitted" });

    const retry = await PUT(request("PUT", { ticket: started.ticket, responses: { [id]: "a" } }));
    expect(retry.status).toBe(200);
    expect((await retry.json()).reviewQuestions).toHaveLength(1);

    // Discarding the cookie record does not help: the shared atomic claim still refuses changed answers.
    state.spent = undefined;
    expect((await PUT(request("PUT", { ticket: started.ticket, responses: { [id]: "b" } }))).status).toBe(409);
    expect((await PUT(request("PUT", { ticket: started.ticket, responses: { [id]: "a" } }))).status).toBe(200);
  });
});

describe("hosted guest guard fails closed", () => {
  it("refuses to start, submit or reveal feedback while Redis is down, without disclosing answers", async () => {
    const started = await start();
    const id = started.questions[0].id;
    setGuardStoreForTests(downStore());
    const client = "192.0.2.10";
    for (const response of [
      await POST(request("POST", { selection }, "http://localhost", client)),
      await PUT(request("PUT", { ticket: started.ticket, responses: { [id]: "a" } }, "http://localhost", client)),
      await PATCH(request("PATCH", { ticket: started.ticket, questionId: id, answer: "a" }, "http://localhost", client)),
    ]) {
      expect(response.status).toBe(503);
      expect(response.headers.get("retry-after")).toBe("15");
      const body = await response.json();
      expect(body).toEqual({ error: "guard_unavailable" });
    }
  });

  it("refuses a submit when only the claim step fails, even from a client with no address header", async () => {
    const started = await start();
    const id = started.questions[0].id;
    // Rate limiting passes (hit works) but the claim cannot be recorded.
    const shared = sharedMemoryStore();
    setGuardStoreForTests({ kind: "redis", hit: shared.hit.bind(shared), get: async () => { throw new Error("down"); }, claim: async () => { throw new Error("down"); } });
    const response = await PUT(request("PUT", { ticket: started.ticket, responses: { [id]: "a" } }));
    expect(response.status).toBe(503);
    expect(await response.json()).not.toHaveProperty("reviewQuestions");
  });

  it("refuses when hosted with no Redis configured, and works again once it is provisioned", async () => {
    const started = await start();
    const id = started.questions[0].id;
    setGuardStoreForTests(undefined);
    expect((await PUT(request("PUT", { ticket: started.ticket, responses: { [id]: "a" } }))).status).toBe(503);
    setGuardStoreForTests(sharedMemoryStore());
    expect((await PUT(request("PUT", { ticket: started.ticket, responses: { [id]: "a" } }))).status).toBe(200);
  });

  it("keeps the sitting recoverable: the same ticket submits normally after the outage ends", async () => {
    const started = await start();
    const id = started.questions[0].id;
    setGuardStoreForTests(downStore());
    expect((await PUT(request("PUT", { ticket: started.ticket, responses: { [id]: "a" } }))).status).toBe(503);
    setGuardStoreForTests(sharedMemoryStore());
    const ok = await PUT(request("PUT", { ticket: started.ticket, responses: { [id]: "a" } }));
    expect(ok.status).toBe(200);
    expect((await ok.json()).reviewQuestions).toHaveLength(1);
  });

  it("admits only one of many concurrent submissions with different answers, and rejects replay and expiry", async () => {
    const started = await start();
    const id = started.questions[0].id;
    const answers = ["a", "b", "c", "d"];
    const results = await Promise.all(
      Array.from({ length: 12 }, (_, i) => PUT(request("PUT", { ticket: started.ticket, responses: { [id]: answers[i % 4] } }))),
    );
    const statuses = results.map((r) => r.status);
    expect(statuses.filter((s) => s === 200).length).toBeGreaterThanOrEqual(3);
    expect(new Set(await Promise.all(results.filter((r) => r.status === 200).map(async (r) => JSON.stringify((await r.json()).result.score ?? null)))).size).toBe(1);
    expect(statuses.every((s) => s === 200 || s === 409)).toBe(true);
    vi.setSystemTime(Date.now() + 4 * 60 * 60 * 1000);
    expect((await PUT(request("PUT", { ticket: started.ticket, responses: { [id]: "a" } }))).status).toBe(404);
  });

  it("does not throttle two browsers sharing one address through the guard", async () => {
    for (const browser of ["nat-a", "nat-b", "nat-c"]) {
      state.browser = browser;
      expect((await POST(request("POST", { selection }, "http://localhost", "192.0.2.77"))).status).toBe(201);
    }
  });
});
