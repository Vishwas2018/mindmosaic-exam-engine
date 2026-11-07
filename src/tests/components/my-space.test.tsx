import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/exam-engine/components/ActiveSessionBanner", () => ({
  ActiveSessionBanner: () => <div data-testid="active-session-banner">Continue your paper</div>,
}));

import type { StudioAvailability, SubjectAvailability } from "@/features/practice-studio/availability";
import type { AttemptSummary, SubjectMastery } from "@/features/student/attempt-summary";
import { MySpaceHero } from "@/features/student/components/my-space/MySpaceHero";
import { MySpacePathways } from "@/features/student/components/my-space/MySpacePathways";
import { MySpaceProgress } from "@/features/student/components/my-space/MySpaceProgress";
import { MySpaceRecent } from "@/features/student/components/my-space/MySpaceRecent";
import { meetsFindingThreshold } from "@/features/student/progress-threshold";

function subject(over: Partial<SubjectAvailability>): SubjectAvailability {
  return {
    yearLevel: 5,
    examStyle: "naplan_style",
    subject: "numeracy",
    state: "ready",
    uniqueQuestions: 40,
    strands: [],
    duplicatesRemoved: 0,
    sharedPromptStems: { groups: 0, questions: 0 },
    reason: "has_content",
    ...over,
  };
}

function attempt(over: Partial<AttemptSummary> = {}): AttemptSummary {
  return {
    id: "a1",
    submittedAt: new Date().toISOString(),
    title: "NAPLAN-style Numeracy",
    subjectLabel: "Numeracy",
    timing: "timed",
    totalQuestions: 10,
    scorePercent: 70,
    attemptedQuestions: 9,
    pendingManualReview: false,
    ...over,
  };
}

const mastery = (over: Partial<SubjectMastery> = {}): SubjectMastery => ({
  subject: "numeracy",
  label: "Numeracy",
  percent: 70,
  marksEarned: 7,
  marksAvailable: 10,
  ...over,
});

describe("MySpaceHero", () => {
  it("offers Continue only when a confirmed open paper exists", () => {
    const { rerender } = render(<MySpaceHero hasActiveSession={false} hasFinishedPaper={false} />);
    expect(screen.queryByTestId("active-session-banner")).toBeNull();
    expect(screen.queryByText(/continue/i)).toBeNull();
    expect(screen.getByRole("link", { name: /Start practice/ })).toHaveAttribute("href", "/student/practice");
    rerender(<MySpaceHero hasActiveSession hasFinishedPaper />);
    expect(screen.getByTestId("active-session-banner")).toBeInTheDocument();
  });

  it("says a practice set starts again from question 1 and never claims it is saved", () => {
    render(<MySpaceHero hasActiveSession={false} hasFinishedPaper />);
    expect(screen.getByText(/starts again from question 1/)).toBeInTheDocument();
    expect(screen.queryByText(/saved/i)).toBeNull();
  });

  it("changes its heading for a first-time student", () => {
    render(<MySpaceHero hasActiveSession={false} hasFinishedPaper={false} />);
    expect(screen.getByRole("heading", { name: "Start your first practice set" })).toBeInTheDocument();
  });
});

describe("MySpacePathways", () => {
  const ready: StudioAvailability = {
    integrity: "ok",
    subjects: [
      subject({}),
      subject({ examStyle: "icas_style", subject: "science", state: "none", reason: "coming_soon", uniqueQuestions: 0 }),
      subject({ yearLevel: 3, subject: "reading" }),
    ],
  };

  it("lists only ready subjects for the student's own year", () => {
    render(<MySpacePathways availability={ready} yearLevel={5} />);
    expect(screen.getByRole("link", { name: "Numeracy" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Science" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Reading" })).toBeNull();
  });

  it("keeps 'no practice' and 'couldn't check' on different wording, with no counts when unchecked", () => {
    const { rerender } = render(
      <MySpacePathways availability={{ integrity: "ok", subjects: [subject({ state: "none", reason: "no_content", uniqueQuestions: 0 })] }} yearLevel={5} />,
    );
    expect(screen.getByText(/no practice available for Year 5 yet/)).toBeInTheDocument();
    rerender(
      <MySpacePathways availability={{ integrity: "unknown", subjects: [subject({ state: "unknown", reason: "unchecked", uniqueQuestions: null })] }} yearLevel={5} />,
    );
    expect(screen.getByText(/couldn.t check what practice is available/)).toBeInTheDocument();
    expect(screen.queryByText(/no practice available/)).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByText(/\d+ questions/)).toBeNull();
  });

  it("never says questions are checked, reviewed or approved", () => {
    const { container } = render(<MySpacePathways availability={ready} yearLevel={5} />);
    expect(container.textContent).not.toMatch(/approved|reviewed|checked by|verified/i);
  });
});

describe("MySpaceProgress", () => {
  it("states there is nothing yet for a first-time student", () => {
    render(<MySpaceProgress attempts={[]} mastery={[]} />);
    expect(screen.getByText(/after you finish a timed paper/)).toBeInTheDocument();
  });

  it("states what it is computed from and withholds a subject below the threshold", () => {
    render(<MySpaceProgress attempts={[attempt()]} mastery={[mastery()]} />);
    expect(screen.getByText(/finished timed paper\./)).toBeInTheDocument();
    expect(screen.getByText(/Practice sets are not recorded/)).toBeInTheDocument();
    expect(screen.getByText(/Not enough yet/)).toBeInTheDocument();
    expect(screen.queryByText(/7 of 10 marks/)).toBeNull();
  });

  it("shows marks out of marks available once the D6 threshold is met", () => {
    render(<MySpaceProgress attempts={[attempt({ id: "a1" }), attempt({ id: "a2" })]} mastery={[mastery()]} />);
    expect(screen.getByText(/7 of 10 marks · 2 papers/)).toBeInTheDocument();
  });

  it("has no percentage ring, streak, XP or mastery language", () => {
    const { container } = render(<MySpaceProgress attempts={[attempt(), attempt({ id: "a2" })]} mastery={[mastery()]} />);
    expect(container.textContent).not.toMatch(/streak|xp|mastery|level|%/i);
  });

  it("uses one shared threshold: 2 attempts and 8 marks", () => {
    expect(meetsFindingThreshold(2, 8)).toBe(true);
    expect(meetsFindingThreshold(1, 20)).toBe(false);
    expect(meetsFindingThreshold(5, 7)).toBe(false);
  });
});

describe("MySpaceRecent", () => {
  it("shows an empty state", () => {
    render(<MySpaceRecent attempts={[]} />);
    expect(screen.getByRole("heading", { name: "Recent activity" })).toBeInTheDocument();
    expect(screen.getByText(/Nothing finished yet/)).toBeInTheDocument();
  });

  it("shows marks out of what could be marked and a not-yet-marked note, never a zero", () => {
    render(<MySpaceRecent attempts={[attempt({ scorePercent: null, pendingManualReview: true })]} />);
    expect(screen.getByRole("heading", { level: 3, name: "NAPLAN-style Numeracy" })).toBeInTheDocument();
    expect(screen.getByText(/No marks to show yet · some questions not yet marked/)).toBeInTheDocument();
    expect(screen.queryByText(/\b0%/)).toBeNull();
  });

  it("does not link to a per-attempt review that does not exist", () => {
    render(<MySpaceRecent attempts={[attempt()]} />);
    expect(screen.queryByRole("link", { name: /review answers/i })).toBeNull();
    expect(screen.getByRole("link", { name: /Open My Results/ })).toHaveAttribute("href", "/results");
  });

  it("shows at most three", () => {
    const many = Array.from({ length: 5 }, (_, i) => attempt({ id: `a${i}`, title: `Paper ${i}` }));
    render(<MySpaceRecent attempts={many} />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
  });
});
