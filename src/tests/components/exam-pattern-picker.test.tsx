import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExamPatternCard } from "@/features/exam-engine/exam-patterns/components/ExamPatternCard";
import { PatternAdaptations } from "@/features/exam-engine/exam-patterns/components/PatternAdaptations";
import {
  getExamPattern,
  groupExamPatterns,
  type ExamPattern,
  type PatternReadiness,
} from "@/features/exam-engine/exam-patterns";

/**
 * The picker's job is to be honest at a glance to an eight-year-old and the
 * adult beside them: what the paper is, how long it takes, whether it can be
 * started, and — for anything that is not a full-length paper — that it is
 * not one.
 */

const NUMERACY = getExamPattern("naplan-y3-numeracy-full")!;
const READING_MODULE = getExamPattern("icas-y3-reading-module")!;
const LANGUAGE = getExamPattern("naplan-y3-language-full")!;
const ENGLISH = getExamPattern("icas-y5-english-full")!;
const WRITING = getExamPattern("naplan-y3-writing-deferred")!;

function readiness(
  pattern: ExamPattern,
  overrides: Partial<PatternReadiness> = {},
): PatternReadiness {
  return {
    patternId: pattern.id,
    state: "ready",
    requestedCount: pattern.questionCount,
    availableCount: pattern.questionCount,
    distinctPapers: 1,
    sources: pattern.sources.map((source) => ({
      sourceId: source.id,
      requested: source.count,
      poolSize: source.count,
      groupedPoolSize: source.count,
      stimulusGroups: 0,
      satisfiable: true,
    })),
    ...overrides,
  };
}

describe("exam pattern card", () => {
  it("names the subject and states the shape in plain language", () => {
    render(<ExamPatternCard pattern={NUMERACY} readiness={readiness(NUMERACY)} />);
    expect(screen.getByRole("heading", { name: "Numeracy" })).toBeInTheDocument();
    expect(screen.getByTestId(`pattern-shape-${NUMERACY.id}`)).toHaveTextContent(
      "36 questions · 45 minutes",
    );
  });

  it("is a keyboard-reachable link to the paper when it is startable", () => {
    render(<ExamPatternCard pattern={NUMERACY} readiness={readiness(NUMERACY)} />);
    const link = screen.getByTestId(`pattern-card-${NUMERACY.id}`);
    expect(link).toHaveAttribute("href", `/exams/${NUMERACY.id}`);
    /* Visible focus, not a colour-only hover cue. */
    expect(link.className).toContain("focus-visible:ring-4");
  });

  it("badges a practice module as not a full-length paper", () => {
    render(
      <ExamPatternCard pattern={READING_MODULE} readiness={readiness(READING_MODULE)} />,
    );
    expect(
      screen.getByTestId(`pattern-module-badge-${READING_MODULE.id}`),
    ).toHaveTextContent("Practice module — not a full-length paper");
  });

  it("does not badge a full-length paper as a practice module", () => {
    render(<ExamPatternCard pattern={NUMERACY} readiness={readiness(NUMERACY)} />);
    expect(
      screen.queryByTestId(`pattern-module-badge-${NUMERACY.id}`),
    ).not.toBeInTheDocument();
  });

  it("advertises the reduced size and time when the bank is short, not the full one", () => {
    render(
      <ExamPatternCard
        pattern={LANGUAGE}
        readiness={readiness(LANGUAGE, {
          state: "short",
          availableCount: 26,
          distinctPapers: 0,
        })}
      />,
    );
    /* 26 of 52 questions, so half the 45 minutes — never "52 questions". */
    expect(screen.getByTestId(`pattern-shape-${LANGUAGE.id}`)).toHaveTextContent(
      "26 questions · 23 minutes",
    );
    expect(screen.getByTestId(`pattern-state-${LANGUAGE.id}`)).toHaveTextContent(
      "Shorter practice module only",
    );
    expect(screen.getByText(/26 of 52/)).toBeInTheDocument();
  });

  it("renders an unavailable paper as coming soon, with nothing to click", () => {
    render(
      <ExamPatternCard
        pattern={LANGUAGE}
        readiness={readiness(LANGUAGE, {
          state: "unavailable",
          availableCount: 0,
          distinctPapers: 0,
        })}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByTestId(`pattern-state-${LANGUAGE.id}`)).toHaveTextContent(
      "Coming soon",
    );
  });

  it("explains why a deferred writing paper is not available", () => {
    render(
      <ExamPatternCard
        pattern={WRITING}
        readiness={readiness(WRITING, {
          state: "unavailable",
          availableCount: 0,
          distinctPapers: 0,
        })}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText(/marked by a person/)).toBeInTheDocument();
  });

  it("says how many non-overlapping papers there are when there is more than one", () => {
    render(
      <ExamPatternCard
        pattern={NUMERACY}
        readiness={readiness(NUMERACY, { distinctPapers: 3 })}
      />,
    );
    expect(screen.getByText(/3 different papers/)).toBeInTheDocument();
  });

  it("never shows the ICAS English source quotas as sections", () => {
    render(<ExamPatternCard pattern={ENGLISH} readiness={readiness(ENGLISH)} />);
    /* The child sits one undivided English paper: 30 and 20 are internal
       composition controls and must not appear. */
    expect(screen.getByRole("heading", { name: "English" })).toBeInTheDocument();
    expect(screen.getByTestId(`pattern-shape-${ENGLISH.id}`)).toHaveTextContent(
      "50 questions · 50 minutes",
    );
    expect(screen.queryByText(/Reading/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\b30\b/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\b20\b/)).not.toBeInTheDocument();
  });
});

describe("adaptations disclosure", () => {
  it("lists every adaptation the pattern declares", () => {
    render(<PatternAdaptations pattern={LANGUAGE} />);
    const details = screen.getByTestId(`pattern-adaptations-${LANGUAGE.id}`);
    expect(
      within(details).getByText("How this differs from the real assessment"),
    ).toBeInTheDocument();
    expect(within(details).getByText(/Everyone gets the same questions/)).toBeInTheDocument();
    expect(
      within(details).getByText(/Spelling words are written, not spoken/),
    ).toBeInTheDocument();
    expect(within(details).getByText(/You can go back to any part/)).toBeInTheDocument();
  });

  it("explains the internal English mix on the ICAS English paper", () => {
    render(<PatternAdaptations pattern={ENGLISH} />);
    expect(screen.getByText(/We chose the mix of English questions/)).toBeInTheDocument();
  });

  it("states it is not the real assessment even with nothing else to add", () => {
    const maths = getExamPattern("icas-y3-numeracy-full")!;
    expect(maths.adaptations).toHaveLength(0);
    render(<PatternAdaptations pattern={maths} />);
    expect(screen.getByText(/It is not a real ICAS paper/)).toBeInTheDocument();
  });

  it("links to the assessment disclaimer", () => {
    render(<PatternAdaptations pattern={NUMERACY} />);
    expect(
      screen.getByRole("link", { name: /assessment disclaimer/i }),
    ).toHaveAttribute("href", "/assessment-disclaimer");
  });
});

describe("picker grouping", () => {
  it("groups year level, then exam type, then subjects", () => {
    const groups = groupExamPatterns();
    expect(groups.map((group) => group.yearLevel)).toEqual([3, 5]);

    const year3 = groups[0]!;
    expect(year3.styles.map((style) => style.examStyle)).toEqual([
      "naplan_style",
      "icas_style",
    ]);
    /* Full-length papers come before practice modules, which come before the
       deferred writing task — the order a child should scan. */
    const icasY3 = year3.styles[1]!.patterns.map((pattern) => pattern.id);
    expect(icasY3.indexOf("icas-y3-english-full")).toBeLessThan(
      icasY3.indexOf("icas-y3-reading-module"),
    );
    expect(icasY3.indexOf("icas-y3-reading-module")).toBeLessThan(
      icasY3.indexOf("icas-y3-writing-deferred"),
    );
  });
});
