import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import {
  ServerAuthoritativeScoringService,
  setScoringMode,
} from "@/features/exam-engine/scoring";
import { useExamStore } from "@/features/exam-engine/state";

const config = {
  yearLevel: 3,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 10,
  timing: "untimed",
} as const;

/* Minimal shape the store needs back; the real ExamResult is richer but the
   client treats the server's payload as opaque and authoritative. */
const serverResult = { totalQuestions: 10, objectivePercentage: 70 };

function mockFetchSequence(): ReturnType<typeof vi.fn> {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ sessionId: "session-1", questions: [] })),
    )
    .mockResolvedValueOnce(new Response(JSON.stringify(serverResult)));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  setScoringMode("local_practice");
  useExamStore.getState().resetExam();
});

describe("ServerAuthoritativeScoringService", () => {
  it("creates the server session then submits responses, returning the server's result", async () => {
    const fetchMock = mockFetchSequence();
    const service = new ServerAuthoritativeScoringService({
      config,
      seed: "svc-test",
      bankId: "curated",
    });

    const result = await service.score([], { q1: "a" }, {
      startedAt: 1,
      submittedAt: 2,
      submissionReason: "user_submitted",
    });

    expect(result).toEqual(serverResult);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [sessionUrl, sessionInit] = fetchMock.mock.calls[0];
    expect(sessionUrl).toBe("/api/exam/session");
    expect(JSON.parse(sessionInit.body)).toEqual({
      config,
      seed: "svc-test",
      bankId: "curated",
    });
    const [submitUrl, submitInit] = fetchMock.mock.calls[1];
    expect(submitUrl).toBe("/api/exam/session/session-1/submit");
    expect(JSON.parse(submitInit.body)).toEqual({
      responses: { q1: "a" },
      submissionReason: "user_submitted",
    });
  });

  it("rejects when either endpoint fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 401 })),
    );
    const service = new ServerAuthoritativeScoringService({
      config,
      seed: "svc-test",
      bankId: "curated",
    });

    await expect(
      service.score([], {}, {
        startedAt: 1,
        submittedAt: 2,
        submissionReason: "user_submitted",
      }),
    ).rejects.toThrow(/Server scoring request failed/);
  });
});

describe("submitExam scoring-mode selection", () => {
  beforeEach(() => {
    useExamStore.getState().resetExam();
  });

  it("uses the server result for signed-in students", async () => {
    mockFetchSequence();
    setScoringMode("server_authoritative");
    useExamStore.getState().startExam(questionBank, config, { seed: "mode-test" });

    useExamStore.getState().submitExam();

    await vi.waitFor(() => {
      expect(useExamStore.getState().status).toBe("submitted");
    });
    expect(useExamStore.getState().result).toEqual(serverResult);
  });

  it("falls back to local scoring when the server is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    setScoringMode("server_authoritative");
    useExamStore.getState().startExam(questionBank, config, { seed: "mode-test" });

    useExamStore.getState().submitExam();

    await vi.waitFor(() => {
      expect(useExamStore.getState().status).toBe("submitted");
    });
    /* A locally computed ExamResult, not the (unreachable) server's. */
    expect(useExamStore.getState().result?.totalQuestions).toBe(10);
    expect(useExamStore.getState().result?.questionDetails).toHaveLength(10);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("keeps guest submission fully synchronous with local scoring", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    useExamStore.getState().startExam(questionBank, config, { seed: "mode-test" });

    useExamStore.getState().submitExam();

    /* No await: local practice scoring resolves before submitExam returns. */
    expect(useExamStore.getState().status).toBe("submitted");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
