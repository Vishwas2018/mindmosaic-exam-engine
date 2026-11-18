import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ParentDashboard } from "@/features/parent-dashboard/components/ParentDashboard";
import { buildChildSummary } from "@/features/parent-dashboard/summary";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const NOW = new Date(2026, 9, 30, 12, 0, 0);
const child = { id: "c1", displayName: "Arjun", yearLevel: 5, createdAt: "2026-01-01T00:00:00.000Z" };
const subscription = { status: "ready", subscription: null } as never;

function result(earned: number, available: number) {
  return {
    totalQuestions: 10,
    attemptedQuestions: 10,
    manualReviewQuestions: 0,
    objectivePercentage: Math.round((earned / available) * 100),
    objectiveMarksEarned: earned,
    objectiveMarksAvailable: available,
    timeTakenSeconds: 600,
    breakdowns: {
      bySubject: {
        numeracy: { total: 10, correct: earned, objectiveMarksEarned: earned, objectiveMarksAvailable: available },
      },
    },
  };
}

const config = { yearLevel: 5, examStyle: "naplan_style", subject: "numeracy", questionCount: 10, timing: "untimed" };
const attempt = (id: string, daysAgo: number, r: ReturnType<typeof result>) => ({
  id,
  submittedAt: new Date(2026, 9, 30 - daysAgo, 10).toISOString(),
  result: r,
  sessionConfig: config,
});

function renderWith(attempts: ReturnType<typeof attempt>[]) {
  const summary = buildChildSummary(child, attempts, NOW);
  render(<ParentDashboard summaries={[summary]} subscription={subscription} hasAccess />);
}

describe("ParentDashboard — a verdict needs evidence", () => {
  it("one paper: shows the real counts, no band, no comparison, no average", () => {
    renderWith([attempt("a", 0, result(9, 10))]);
    expect(screen.getAllByText(/1 paper · 9 of 10 marks/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/not enough yet for a rating/i)).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/\bStrong\b|Needs practice|Building|\bGood\b/);
    expect(document.body).not.toHaveTextContent(/up \d+% on the attempt before|down \d+% on the attempt before/i);
    expect(document.body).not.toHaveTextContent(/mastered|readiness/i);
    expect(screen.getByText(/too few finished papers for an average yet/i)).toBeInTheDocument();
  });

  it("two papers with enough marks: a band appears, with its evidence beside it", () => {
    renderWith([attempt("a", 1, result(9, 10)), attempt("b", 0, result(9, 10))]);
    expect(screen.getByText("Strong")).toBeInTheDocument();
    expect(screen.getByText(/2 papers · 18 of 20 marks/i)).toBeInTheDocument();
    expect(screen.queryByText(/not enough yet for a rating/i)).not.toBeInTheDocument();
  });
});
