import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useExamStore } from "@/features/exam-engine/state";
import type { ExamSelectionConfig } from "@/features/exam-engine/selection";

/**
 * Duplicate exam sessions from rapid clicks or a duplicated request.
 *
 * POST /api/exam/session has always deduped on `idempotencyKey` and answered
 * 409 `idempotency_key_reused`, but no caller ever sent one: the route fell
 * back to `idempotencyKey ?? crypto.randomUUID()`, so every request got a
 * fresh key and the dedupe was unreachable from the application. Two
 * concurrent POSTs each created a real session, leaving an orphan attached to
 * the student.
 *
 * `ExamConfigurator.handleStart` does guard with `isStarting || isCreating`
 * and disables the button, but that is React state: it is a UI guard, not a
 * request guard, and it cannot help a request duplicated in transit or a
 * programmatic double-invoke in one tick. These tests cover the store, which
 * is where the request is actually issued.
 */

const config: ExamSelectionConfig = {
  yearLevel: 3,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 10,
  timing: "timed",
};

function sessionResponse(sessionId: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      sessionId,
      questions: [
        {
          id: "q1",
          type: "number_entry",
          prompt: "1 + 1",
          options: [],
          visuals: [],
          metadata: { marks: 1, estimatedTimeSeconds: 30 },
        },
      ],
    }),
  } as unknown as Response;
}

beforeEach(() => {
  useExamStore.getState().resetExam();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  useExamStore.getState().resetExam();
});

describe("startServerExam request identity", () => {
  it("sends an idempotencyKey, so the route's 409 dedupe is reachable at all", async () => {
    const fetchMock = vi.fn(async () => sessionResponse("s-1"));
    vi.stubGlobal("fetch", fetchMock);

    await useExamStore.getState().startServerExam(config);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as { idempotencyKey?: string };
    expect(typeof body.idempotencyKey).toBe("string");
    expect(body.idempotencyKey!.length).toBeGreaterThan(0);
  });

  it("mints a FRESH key per attempt, so retrying after a failure is not a spent-key 409", async () => {
    const keys: string[] = [];
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      keys.push(JSON.parse(String(init.body)).idempotencyKey);
      return sessionResponse(`s-${keys.length}`);
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    await useExamStore.getState().startServerExam(config);
    useExamStore.getState().resetExam();
    await useExamStore.getState().startServerExam(config);

    expect(keys).toHaveLength(2);
    expect(keys[0]).not.toBe(keys[1]);
  });
});

describe("startServerExam concurrency", () => {
  it("coalesces concurrent starts into ONE request, so a double submit cannot create two sessions", async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const fetchMock = vi.fn(async () => {
      await gate;
      return sessionResponse("s-only");
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const first = useExamStore.getState().startServerExam(config);
    const second = useExamStore.getState().startServerExam(config);
    const third = useExamStore.getState().startServerExam(config);
    release!();
    const results = await Promise.all([first, second, third]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results).toEqual([true, true, true]);
    expect(useExamStore.getState().sessionId).toBe("s-only");
  });

  it("releases the coalescing slot after a failure, so the student can retry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "boom" }),
        text: async () => "boom",
      } as unknown as Response)
      .mockResolvedValueOnce(sessionResponse("s-after-retry"));
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    await expect(useExamStore.getState().startServerExam(config)).resolves.toBe(false);
    await expect(useExamStore.getState().startServerExam(config)).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(useExamStore.getState().sessionId).toBe("s-after-retry");
  });

  it("releases the coalescing slot after a thrown network error too", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(sessionResponse("s-after-throw"));
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    await expect(useExamStore.getState().startServerExam(config)).resolves.toBe(false);
    await expect(useExamStore.getState().startServerExam(config)).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
