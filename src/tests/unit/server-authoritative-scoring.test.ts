import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import { ServerAuthoritativeScoringService } from "@/features/exam-engine/scoring";
import { selectExamQuestions } from "@/features/exam-engine/selection";
import { useExamStore } from "@/features/exam-engine/state";
import { toCandidateQuestions } from "@/features/exam-engine/types";

const config = {
  yearLevel: 3,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 10,
  timing: "untimed",
} as const;

/* Server-selected questions for the session-create response: same shape a
   real /api/exam/session response has (answer-stripped candidates). */
function serverQuestions() {
  const selection = selectExamQuestions(questionBank, config, "server-chosen");
  if (!selection.ok) throw new Error("fixture selection failed");
  return { authoring: selection.questions, candidates: toCandidateQuestions(selection.questions) };
}

/* Minimal result shape; the client treats the server payload as opaque
   and authoritative. */
const serverResult = { totalQuestions: 10, objectivePercentage: 70 };

afterEach(() => {
  vi.unstubAllGlobals();
  useExamStore.getState().resetExam();
});

describe("ServerAuthoritativeScoringService", () => {
  it("submits responses to the session's submit endpoint and returns the server's result and review questions", async () => {
    const { authoring } = serverQuestions();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ result: serverResult, reviewQuestions: authoring })),
    );
    vi.stubGlobal("fetch", fetchMock);

    const service = new ServerAuthoritativeScoringService("session-1");
    const submission = await service.score([], { q1: "a" }, {
      startedAt: 1,
      submittedAt: 2,
      submissionReason: "user_submitted",
    });

    expect(submission.result).toEqual(serverResult);
    expect(submission.reviewQuestions).toHaveLength(authoring.length);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/exam/session/session-1/submit");
    expect(JSON.parse(init.body)).toEqual({
      responses: { q1: "a" },
      submissionReason: "user_submitted",
    });
  });

  it("rejects when the endpoint fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 401 })),
    );
    const service = new ServerAuthoritativeScoringService("session-1");

    await expect(
      service.score([], {}, {
        startedAt: 1,
        submittedAt: 2,
        submissionReason: "user_submitted",
      }),
    ).rejects.toThrow(/Server scoring request failed/);
  });
});

describe("startServerExam and server-session submission", () => {
  beforeEach(() => {
    useExamStore.getState().resetExam();
  });

  it("creates the session server-side before any question is shown, with no client seed", async () => {
    const { candidates } = serverQuestions();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ sessionId: "server-session", questions: candidates })),
    );
    vi.stubGlobal("fetch", fetchMock);

    const started = await useExamStore.getState().startServerExam(config, {
      bankId: "curated",
    });

    expect(started).toBe(true);
    const state = useExamStore.getState();
    expect(state.status).toBe("in_progress");
    expect(state.sessionMode).toBe("server");
    expect(state.sessionId).toBe("server-session");
    /* The seed is server-chosen and never present client-side. */
    expect(state.seed).toBeNull();
    expect(state.questions).toHaveLength(10);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/exam/session");
    expect(JSON.parse(init.body)).toEqual({ config, bankId: "curated" });
    expect(JSON.parse(init.body)).not.toHaveProperty("seed");
  });

  it("submits a server session to the server and uses its result and review questions", async () => {
    const { authoring, candidates } = serverQuestions();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ sessionId: "server-session", questions: candidates })),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ result: serverResult, reviewQuestions: authoring })),
      );
    vi.stubGlobal("fetch", fetchMock);

    await useExamStore.getState().startServerExam(config, { bankId: "curated" });
    useExamStore.getState().submitExam();

    await vi.waitFor(() => {
      expect(useExamStore.getState().status).toBe("submitted");
    });
    expect(useExamStore.getState().result).toEqual(serverResult);
    expect(useExamStore.getState().reviewQuestions).toHaveLength(authoring.length);
    const [submitUrl] = fetchMock.mock.calls[1];
    expect(submitUrl).toBe("/api/exam/session/server-session/submit");
  });

  it("returns to in_progress when server submission fails, so the student can retry", async () => {
    const { candidates } = serverQuestions();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ sessionId: "server-session", questions: candidates })),
      )
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await useExamStore.getState().startServerExam(config, { bankId: "curated" });
    useExamStore.getState().submitExam();

    await vi.waitFor(() => {
      expect(useExamStore.getState().status).toBe("in_progress");
    });
    /* No result was fabricated locally: a server session has no client
       bank to score against. */
    expect(useExamStore.getState().result).toBeNull();
    expect(useExamStore.getState().reviewQuestions).toBeNull();
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
    expect(useExamStore.getState().result?.totalQuestions).toBe(10);
    expect(useExamStore.getState().reviewQuestions).toHaveLength(10);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
