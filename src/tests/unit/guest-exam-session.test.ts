import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { bankQuestion } from "@/tests/fixtures/exam-pattern-bank";
import { PATCH, POST, PUT } from "@/app/api/exam/guest-session/route";
import { resetRateLimitsForTests } from "@/lib/security/rate-limit";

const state = vi.hoisted(() => ({ browser: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => state.browser ? { value: state.browser } : undefined }),
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
  resetRateLimitsForTests();
  state.browser = undefined;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-20T00:00:00Z"));
});
afterEach(() => vi.useRealTimers());

async function start(config = selection.config) {
  const response = await POST(request("POST", { selection: { config } }));
  expect(response.status).toBe(201);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  const cookie = response.cookies.get("mm-guest-exam");
  expect(cookie?.httpOnly).toBe(true);
  state.browser = cookie?.value;
  return await response.json();
}

describe("guest exam disclosure boundary", () => {
  it("delivers a candidate projection and reveals review material after submission", async () => {
    const started = await start();
    expect(started.questions).toHaveLength(1);
    expect(started.questions[0]).not.toHaveProperty("answerKey");
    expect(started.questions[0]).not.toHaveProperty("explanation");
    expect(started.questions[0]).not.toHaveProperty("sampleResponse");

    const blank = await PUT(request("PUT", { ticket: started.ticket, responses: {} }));
    expect((await blank.json()).reviewQuestions).toEqual([]);

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

  it("throttles a client that keeps starting and submitting sessions to harvest answers", async () => {
    const attacker = "203.0.113.7";
    let blocked = 0;
    for (let i = 0; i < 31; i += 1) {
      const response = await POST(request("POST", { selection }, "http://localhost", attacker));
      if (response.status === 429) {
        blocked += 1;
        expect(response.headers.get("retry-after")).toMatch(/^\d+$/);
        expect(await response.json()).toEqual({ error: "rate_limited" });
      }
    }
    expect(blocked).toBe(1);

    const other = await POST(request("POST", { selection }, "http://localhost", "203.0.113.8"));
    expect(other.status).toBe(201);
    const { ticket } = await other.json();
    state.browser = other.cookies.get("mm-guest-exam")?.value;
    let throttledSubmit = 0;
    for (let i = 0; i < 21; i += 1) {
      const response = await PUT(request("PUT", { ticket, responses: {} }, "http://localhost", "203.0.113.8"));
      if (response.status === 429) {
        throttledSubmit += 1;
        const body = await response.json();
        expect(body).not.toHaveProperty("reviewQuestions");
      }
    }
    expect(throttledSubmit).toBe(1);
  });
});
