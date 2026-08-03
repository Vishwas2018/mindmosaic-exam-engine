import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const push = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, refresh: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/exam",
}));

import ExamPage from "@/app/exam/page";
import { questionBank } from "@/content/questions/question-bank";
import { AuthProvider } from "@/features/auth";
import { useExamStore } from "@/features/exam-engine/state";

/* ExamPage reads useAuth() to decide whether a signed-in student's session
   is resumable after a refresh, so it needs a provider. Supabase is
   unconfigured under vitest, so this resolves straight to "unconfigured",
   which is guest behaviour. */
function renderExam() {
  return render(
    <AuthProvider>
      <ExamPage />
    </AuthProvider>,
  );
}

function startTimedExam() {
  useExamStore.getState().resetExam();
  useExamStore.getState().startExam(
    questionBank,
    {
      yearLevel: 3,
      examStyle: "naplan_style",
      subject: "numeracy",
      questionCount: 10,
      timing: "timed",
    },
    { seed: "shortcut-test" },
  );
}

describe("exam runner keyboard shortcuts", () => {
  beforeEach(() => {
    startTimedExam();
  });

  it("moves between questions with the arrow keys", async () => {
    const user = userEvent.setup();
    renderExam();
    expect(screen.getByRole("heading", { name: /^Question 1 of/ })).toBeInTheDocument();

    await user.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /^Question 2 of/ })).toBeInTheDocument(),
    );

    await user.keyboard("{ArrowLeft}");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /^Question 1 of/ })).toBeInTheDocument(),
    );
  });

  it("flags the current question with F", async () => {
    const user = userEvent.setup();
    renderExam();

    expect(screen.getByTestId("flag-toggle")).toHaveTextContent("Flag for review");
    await user.keyboard("f");
    await waitFor(() =>
      expect(screen.getByTestId("flag-toggle")).toHaveTextContent("Flagged for review"),
    );
  });

  /*
   * The one that matters: a number-entry or short-text question would
   * otherwise swallow every keystroke as navigation, and an arrow press
   * inside a field would jump away from a half-written answer.
   */
  it("ignores shortcuts while focus is inside an answer field", async () => {
    const user = userEvent.setup();
    renderExam();

    const field = screen.queryByRole("textbox") ?? screen.queryByRole("spinbutton");
    if (!field) {
      /* This seed's first question has no free-text input; the guard is
         still asserted by the button case below. */
      const button = screen.getByTestId("next-question");
      button.focus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("heading", { name: /^Question 1 of/ })).toBeInTheDocument();
      return;
    }

    field.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("heading", { name: /^Question 1 of/ })).toBeInTheDocument();
  });
});

describe("exam runner chrome", () => {
  beforeEach(() => {
    startTimedExam();
  });

  /*
   * A real paper tells a candidate neither, and knowing an item is "Easy"
   * changes how long a child is willing to spend on it. Matched
   * case-insensitively against the meta line itself: the difficulty is
   * rendered lowercase and only capitalised by CSS, so a case-sensitive
   * /Medium/ would pass whether or not the fix worked.
   */
  it("hides the item's skill and difficulty during a timed sitting", () => {
    renderExam();
    const meta = screen.getByTestId("question-meta");
    expect(meta).toHaveTextContent(/^Grade 3 · numeracy$/i);
    expect(meta.textContent).not.toMatch(/easy|medium|challenging/i);
  });

  it("shows them in untimed practice, where looking things up is the point", () => {
    useExamStore.getState().resetExam();
    useExamStore.getState().startExam(
      questionBank,
      {
        yearLevel: 3,
        examStyle: "naplan_style",
        subject: "numeracy",
        questionCount: 10,
        timing: "untimed",
      },
      { seed: "shortcut-test" },
    );
    renderExam();
    expect(screen.getByTestId("question-meta").textContent).toMatch(
      /easy|medium|challenging/i,
    );
  });

  /* One number, one place — it used to appear as "0 of 10 answered", as a
     labelled bar reading "0%", and as "0/10" in the sidebar. */
  it("reports progress once as a header progressbar", () => {
    renderExam();
    const bar = screen.getByRole("progressbar", { name: "Questions answered" });
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "10");
  });
});
