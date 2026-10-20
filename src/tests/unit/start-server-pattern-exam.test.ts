import { describe, expect, it, vi, beforeEach } from "vitest";
import { useExamStore } from "@/features/exam-engine/state";
import { getExamPattern } from "@/features/exam-engine/exam-patterns";

const pattern = getExamPattern("amc-y3-middle-primary-module")!;

describe("startServerPatternExam error handling and lastServerError", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useExamStore.setState({ lastServerError: null, status: "not_started" });
  });

  it("records accurate role message when server rejects non-student with 403 students_only", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "students_only" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const started = await useExamStore.getState().startServerPatternExam(pattern, {
      asPracticeModule: true,
    });

    expect(started).toBe(false);
    expect(useExamStore.getState().lastServerError).toBe(
      "Exam sessions are only available to student accounts. Please sign in with a student account to start this exam.",
    );
  });

  it("records session expired message when server returns 401 unauthenticated", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "unauthenticated" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const started = await useExamStore.getState().startServerPatternExam(pattern, {
      asPracticeModule: true,
    });

    expect(started).toBe(false);
    expect(useExamStore.getState().lastServerError).toBe(
      "Your session has expired. Please sign in again.",
    );
  });

  it("records network error message when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Failed to fetch")));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const started = await useExamStore.getState().startServerPatternExam(pattern, {
      asPracticeModule: true,
    });

    expect(started).toBe(false);
    expect(useExamStore.getState().lastServerError).toBe(
      "We couldn't connect to the server. Check your internet connection and try again.",
    );
    consoleError.mockRestore();
  });

  it("clears lastServerError on successful session creation", async () => {
    useExamStore.setState({ lastServerError: "stale error" });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            sessionId: "test-session-123",
            questions: [
              {
                id: "q-1",
                type: "multiple_choice",
                prompt: "What is 2 + 2?",
                options: [{ id: "opt-1", label: "4" }],
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const started = await useExamStore.getState().startServerPatternExam(pattern, {
      asPracticeModule: true,
    });

    expect(started).toBe(true);
    expect(useExamStore.getState().lastServerError).toBeNull();
    expect(useExamStore.getState().sessionId).toBe("test-session-123");
  });
});
