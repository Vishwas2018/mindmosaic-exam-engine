import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ResultsPage from "@/app/results/page";
import { showcasePromptLayoutQuestions } from "@/content/questions/showcase-prompt-layout-fixtures";
import { AuthProvider } from "@/features/auth";
import { useExamStore } from "@/features/exam-engine/state";
import { buildExamResult } from "@/features/exam-engine/scoring/exam-report";

/**
 * Renders the REAL results page (post-submit review) from a submitted store
 * and checks the class on the question prompt it actually produces.
 *
 * Synthetic demonstration content only: the two fixtures carry identical text
 * under `amc_style` and `naplan_style`, so the only variable is the exam
 * style. jsdom does not apply Tailwind, so this pins the class that selects
 * `white-space: pre-line`; the computed CSS and the visible lines are asserted
 * in a real browser by e2e/results-amc-multiline-prompt.spec.ts.
 */
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/results",
}));

const [amcQuestion, naplanQuestion] = showcasePromptLayoutQuestions;
const now = Date.now();

describe("results page: question prompt line breaks", () => {
  /* The first render pays the cost of loading the whole results page module graph. */
  vi.setConfig({ testTimeout: 30_000 });

  beforeEach(() => {
    useExamStore.getState().resetExam();
    useExamStore.setState({
      status: "submitted",
      config: {
        yearLevel: 5,
        examStyle: "mixed",
        subject: "mixed",
        questionCount: 2,
        timing: "untimed",
      } as never,
      reviewQuestions: showcasePromptLayoutQuestions,
      responses: {},
      flaggedQuestionIds: [],
      result: buildExamResult(showcasePromptLayoutQuestions, {}, {
        startedAt: now - 60_000,
        submittedAt: now,
        submissionReason: "user_submitted",
      }),
    });
  });

  function renderResults() {
    return render(
      <AuthProvider>
        <ResultsPage />
      </AuthProvider>,
    );
  }

  it("keeps authored line breaks for an amc_style prompt", () => {
    renderResults();
    const prompt = screen.getByTestId(`review-prompt-${amcQuestion.id}`);
    expect(prompt.tagName).toBe("P");
    expect(prompt).toHaveClass("whitespace-pre-line");
    expect(prompt.textContent).toBe(amcQuestion.prompt);
    expect(prompt.textContent).toContain("\n");
  });

  it("leaves a naplan_style prompt with the same text exactly as before", () => {
    renderResults();
    const prompt = screen.getByTestId(`review-prompt-${naplanQuestion.id}`);
    expect(prompt).not.toHaveClass("whitespace-pre-line");
    expect(prompt.className).toBe("mt-4 text-base font-bold leading-7 text-plum-dark");
    expect(prompt.textContent).toBe(naplanQuestion.prompt);
  });

  it("does not change the displayed text, only its layout class", () => {
    renderResults();
    expect(screen.getByTestId(`review-prompt-${amcQuestion.id}`).textContent).toBe(
      screen.getByTestId(`review-prompt-${naplanQuestion.id}`).textContent,
    );
  });
});
