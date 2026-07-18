import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ExamPage from "@/app/exam/page";
import { questionBank } from "@/content/questions/question-bank";
import { ExamConfigurator } from "@/features/exam-engine/components/ExamConfigurator";
import { useExamStore } from "@/features/exam-engine/state";

const replace = vi.fn();
const push = vi.fn();
const prefetch = vi.fn();
/* Real Next.js returns a stable router instance across renders; mocking
   that stability (rather than a fresh object literal per call) matters
   here because effects depend on `router` identity. */
const router = { push, replace, prefetch };

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(),
}));

const config = {
  yearLevel: 3,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 10,
  timing: "untimed",
} as const;

beforeEach(() => {
  useExamStore.getState().resetExam();
  replace.mockClear();
  push.mockClear();
  prefetch.mockClear();
});

describe("exam submission navigates by replace, not push", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("replaces to /results exactly once when the route change succeeds immediately", () => {
    useExamStore.getState().startExam(questionBank, config, { seed: "nav-test" });
    useExamStore.getState().submitExam("user_submitted");
    render(<ExamPage />);
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/results");
    /* Using replace (not push) is what lets browser Back skip over /exam
       entirely once results is reached — a push would leave a submitted
       /exam entry in history for Back to land on and re-trigger. */
    expect(push).not.toHaveBeenCalled();
  });

  it("explicitly shows a submitted state instead of the interactive exam", () => {
    useExamStore.getState().startExam(questionBank, config, { seed: "nav-test" });
    useExamStore.getState().submitExam("user_submitted");
    render(<ExamPage />);
    expect(
      screen.getByRole("heading", { name: "This exam has already been submitted" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("open-submit-dialog")).not.toBeInTheDocument();
  });

  it("bounds retries and stops instead of retrying forever", () => {
    useExamStore.getState().startExam(questionBank, config, { seed: "nav-test" });
    useExamStore.getState().submitExam("user_submitted");
    render(<ExamPage />);
    replace.mockClear();

    /* Default budget is 6 attempts total (1 already made above, 5 left)
       spaced 400ms apart; because the mocked router never actually
       navigates away, every attempt fires in this jsdom environment. */
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(replace).toHaveBeenCalledTimes(5);
    expect(screen.getByTestId("manual-results-link")).toBeInTheDocument();

    /* No further calls once the budget is exhausted — this is the "no
       repeated router calls" / no-loop guarantee. */
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(replace).toHaveBeenCalledTimes(5);
  });

  it("does not re-trigger navigation once the exam is reset", () => {
    useExamStore.getState().startExam(questionBank, config, { seed: "nav-test" });
    useExamStore.getState().submitExam("user_submitted");
    const { unmount } = render(<ExamPage />);
    expect(replace).toHaveBeenCalledTimes(1);
    unmount();
    replace.mockClear();
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("exam start has a pending state and cannot create duplicate sessions", () => {
  it("disables Start once a session begins so a second click cannot start another", async () => {
    const user = userEvent.setup();
    render(<ExamConfigurator curatedBank={questionBank} practiceBank={questionBank} />);

    const startButton = screen.getByTestId("start-exam");
    await user.click(startButton);

    /* A real browser (and user-event, matching it) refuses to dispatch a
       click to a disabled button at all, so this is what actually stops a
       second click from creating a second session. */
    expect(startButton).toBeDisabled();
    expect(useExamStore.getState().sessionId).not.toBeNull();
    const sessionIdAfterFirstClick = useExamStore.getState().sessionId;

    await user.click(startButton);
    expect(useExamStore.getState().sessionId).toBe(sessionIdAfterFirstClick);
  });

  it("shows a recoverable error and lets the learner retry without a new session", () => {
    vi.useFakeTimers();
    render(<ExamConfigurator curatedBank={questionBank} practiceBank={questionBank} />);
    const startButton = screen.getByTestId("start-exam");
    act(() => {
      startButton.click();
    });
    const sessionId = useExamStore.getState().sessionId;
    push.mockClear();

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByTestId("navigation-failed")).toBeInTheDocument();
    expect(useExamStore.getState().sessionId).toBe(sessionId);

    push.mockClear();
    act(() => {
      screen.getByRole("button", { name: "Try again" }).click();
    });
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/exam");
    /* Retrying navigation never creates a second session. */
    expect(useExamStore.getState().sessionId).toBe(sessionId);
    vi.useRealTimers();
  });
});
