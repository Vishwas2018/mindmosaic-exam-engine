import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ status: "anonymous" as "anonymous" | "authenticated" | "loading" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/features/auth", () => ({ useAuth: () => ({ status: auth.status, role: auth.status === "authenticated" ? "student" : null }) }));

import { ExamPatternStarter } from "@/features/exam-engine/exam-patterns/components/ExamPatternStarter";
import { buildPatternReadiness, getExamPattern } from "@/features/exam-engine/exam-patterns";
import { PatternAdaptations } from "@/features/exam-engine/exam-patterns/components/PatternAdaptations";
import { loadScholarshipDraftQuestions } from "@/tests/helpers/scholarship-published";

const pattern = getExamPattern("scholarship-y6-numerical-reasoning-full")!;
const ready = buildPatternReadiness(loadScholarshipDraftQuestions("nr"), pattern);
const unavailable = buildPatternReadiness([], pattern);

describe("scholarship paper start screen", () => {
  it("asks a guest to sign in and does not allow a start, because the questions never ship publicly", () => {
    auth.status = "anonymous";
    render(<ExamPatternStarter pattern={pattern} readiness={ready} />);
    expect(screen.getByTestId("sign-in-required-notice")).toHaveTextContent(/signed-in students/i);
    expect(screen.getByRole("link", { name: /sign in to start/i })).toHaveAttribute("href", "/sign-in");
    expect(screen.getByTestId("start-pattern")).toBeDisabled();
  });

  it("lets a signed-in student review instructions for the full paper and never offers a practice module", () => {
    auth.status = "authenticated";
    render(<ExamPatternStarter pattern={pattern} readiness={ready} />);
    expect(screen.queryByTestId("sign-in-required-notice")).not.toBeInTheDocument();
    expect(screen.queryByTestId("reduced-module-notice")).not.toBeInTheDocument();
    expect(screen.getByTestId("pattern-sitting-shape")).toHaveTextContent("40 questions · 30 minutes");
    expect(screen.getByTestId("start-pattern")).toBeEnabled();
    expect(screen.getByTestId("start-pattern")).toHaveTextContent(/review instructions/i);
  });

  it("does not offer Confidence Mode, which would put every explanation in the browser before it is asked for", () => {
    auth.status = "authenticated";
    render(<ExamPatternStarter pattern={pattern} readiness={ready} />);
    expect(screen.queryByTestId("mode-confidence-mode")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mode-timed-simulation")).not.toBeInTheDocument();
    expect(screen.getByTestId("pattern-sitting-shape")).toHaveTextContent("40 questions · 30 minutes");
  });

  it("an unavailable scholarship readiness has nothing to draw and no partial count", () => {
    expect(unavailable.state).toBe("unavailable");
    expect(unavailable.availableCount).toBe(0);
  });

  it("tells families that the paper length and time are MindMosaic's own", () => {
    render(<PatternAdaptations pattern={pattern} />);
    expect(screen.getByText(/the length and time are our own/i)).toBeInTheDocument();
  });
});
