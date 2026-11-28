import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ExamPage from "@/app/exam/page";
import ResultsPage from "@/app/results/page";
import { questionBank } from "@/content/questions/question-bank";
import { AuthProvider } from "@/features/auth";
import { buildExamResult } from "@/features/exam-engine/scoring/exam-report";
import { useExamStore } from "@/features/exam-engine/state";

/**
 * MT-003: the runner and results showed internal skill ids ("num.prod.measurement.perimeter") to children.
 * MT-004: results of an untimed sitting talked about "time was up" and "the same time limit".
 *
 * Both render the REAL pages from a real store. Synthetic bank questions only; the skill id is injected so the raw
 * form is unmistakable in the output.
 */
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/results",
}));

const RAW_SKILL = "num.prod.measurement.perimeter";
const RAW_PATTERN = /num\.prod\.measurement\.perimeter/;
const LABEL = "Measurement: perimeter";

const questions = questionBank
  .filter((question) => question.yearLevel === 3 && question.examStyle === "naplan_style")
  .slice(0, 4)
  .map((question) => ({ ...question, metadata: { ...question.metadata, skill: RAW_SKILL } }));

function renderWithAuth(page: React.ReactElement) {
  return render(<AuthProvider>{page}</AuthProvider>);
}

function submitted(timing: "timed" | "untimed", reason: "user_submitted" | "timer_expired") {
  const now = Date.now();
  useExamStore.setState({
    status: "submitted",
    config: {
      yearLevel: 3,
      examStyle: "naplan_style",
      subject: "numeracy",
      questionCount: questions.length,
      timing,
    } as never,
    reviewQuestions: questions,
    responses: {},
    flaggedQuestionIds: [],
    result: buildExamResult(questions, {}, { startedAt: now - 120_000, submittedAt: now, submissionReason: reason }),
  });
}

describe("exam runner (MT-003)", () => {
  vi.setConfig({ testTimeout: 30_000 });
  beforeEach(() => useExamStore.getState().resetExam());

  it("shows a readable skill name, never the internal skill id", () => {
    useExamStore.getState().startExam(questions, {
      yearLevel: 3,
      examStyle: "naplan_style",
      subject: "numeracy",
      questionCount: questions.length,
      timing: "untimed",
    }, { seed: "mt-003" });
    const { container } = renderWithAuth(<ExamPage />);
    expect(container.textContent).not.toMatch(RAW_PATTERN);
    expect(container.textContent).toContain(LABEL);
  });
});

describe("results page", () => {
  vi.setConfig({ testTimeout: 30_000 });
  beforeEach(() => useExamStore.getState().resetExam());

  it("MT-003: review shows a readable skill name, never the internal skill id", () => {
    submitted("untimed", "user_submitted");
    const { container } = renderWithAuth(<ResultsPage />);
    expect(container.textContent).not.toMatch(RAW_PATTERN);
    expect(container.textContent).toContain(LABEL);
  });

  it("MT-004: an untimed sitting never talks about time running out or being up", () => {
    submitted("untimed", "user_submitted");
    const { container } = renderWithAuth(<ResultsPage />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/before time was up/i);
    expect(text).not.toMatch(/time ran out/i);
    expect(text).not.toMatch(/same number of questions and time limit/i);
    expect(text).toMatch(/No time limit/i);
    // The time taken is still recorded and shown.
    expect(within(container).getByTestId("time-taken").textContent).toMatch(/Time taken: 2 min/);
  });

  it("MT-004: a timed sitting that ran out still says so", () => {
    submitted("timed", "timer_expired");
    renderWithAuth(<ResultsPage />);
    expect(screen.getByText(/Time ran out — submitted automatically/)).toBeInTheDocument();
    expect(screen.getByTestId("submission-reason").textContent).toMatch(/Time ran out/);
  });

  it("MT-004: a timed sitting submitted early keeps the time-was-up wording", () => {
    submitted("timed", "user_submitted");
    renderWithAuth(<ResultsPage />);
    expect(screen.getByText(/Submitted before time was up/)).toBeInTheDocument();
  });
});
