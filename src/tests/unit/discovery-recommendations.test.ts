import { describe, expect, it } from "vitest";

import type { AttemptSummary } from "@/features/student/attempt-summary";
import {
  deriveStartHereItem,
  deriveNextForYouCards,
} from "@/features/student/components/discovery/discovery-recommendations";

function makeAttempt(partial: Partial<AttemptSummary> = {}): AttemptSummary {
  return {
    id: "attempt-1",
    submittedAt: "2026-09-01T10:00:00Z",
    title: "NAPLAN-style Numeracy — Grade 3",
    subjectLabel: "Numeracy",
    timing: "untimed",
    totalQuestions: 10,
    scorePercent: 70,
    attemptedQuestions: 10,
    pendingManualReview: false,
    ...partial,
  };
}

describe("deriveStartHereItem — deterministic priority", () => {
  it("prioritises an active session over everything else (Priority 1)", () => {
    const item = deriveStartHereItem({
      studentName: "Alex",
      yearLevel: 3,
      attempts: [makeAttempt({ scorePercent: 60 })],
      hasActiveSession: true,
    });

    expect(item.source).toBe("unfinished_session");
    expect(item.href).toBe("/exam");
    expect(item.actionLabel).toBe("Resume Session");
  });

  it("prioritises a recent imperfect attempt for retry when no active session exists (Priority 2)", () => {
    const item = deriveStartHereItem({
      studentName: "Alex",
      yearLevel: 3,
      attempts: [makeAttempt({ title: "NAPLAN-style Reading", scorePercent: 60, subjectLabel: "Reading" })],
      hasActiveSession: false,
    });

    expect(item.source).toBe("retry_attempt");
    expect(item.href).toBe("/practice");
    expect(item.title).toContain("NAPLAN-style Reading");
    expect(item.subtitle).toContain("60%");
  });

  it("falls back to deterministic Year 3 curriculum lesson for a fresh Year 3 student (Priority 3)", () => {
    const item = deriveStartHereItem({
      studentName: "Alex",
      yearLevel: 3,
      attempts: [],
      hasActiveSession: false,
    });

    expect(item.source).toBe("curriculum_lesson");
    expect(item.href).toContain("/student/learn/lessons/");
    expect(item.title).toContain("Year 3 Maths");
  });

  it("falls back to deterministic Year 5 curriculum lesson for a Year 5 student", () => {
    const item = deriveStartHereItem({
      studentName: "Sam",
      yearLevel: 5,
      attempts: [],
      hasActiveSession: false,
    });

    expect(item.source).toBe("curriculum_lesson");
    expect(item.href).toContain("/student/learn/lessons/");
    expect(item.title).toContain("Year 5 Maths");
  });
});

describe("deriveNextForYouCards", () => {
  it("returns up to 3 cards for a new student without fabricating weaknesses", () => {
    const cards = deriveNextForYouCards({
      yearLevel: 3,
      attempts: [],
      hasActiveSession: false,
    });

    expect(cards.length).toBeLessThanOrEqual(3);
    expect(cards.some((c) => c.href === "/student/learn")).toBe(true);
    expect(cards.some((c) => c.href.includes("practice"))).toBe(true);
  });

  it("includes a retry card when the student has a recent attempt with errors", () => {
    const cards = deriveNextForYouCards({
      yearLevel: 5,
      attempts: [makeAttempt({ title: "ICAS-style Mathematics", scorePercent: 50 })],
      hasActiveSession: false,
    });

    const retryCard = cards.find((c) => c.id === "retry-practice");
    expect(retryCard).toBeDefined();
    expect(retryCard?.title).toBe("Practise what you missed");
  });

  it("includes a resume card when an active session is detected", () => {
    const cards = deriveNextForYouCards({
      yearLevel: 3,
      attempts: [],
      hasActiveSession: true,
    });

    const activeCard = cards.find((c) => c.id === "active-session");
    expect(activeCard).toBeDefined();
    expect(activeCard?.href).toBe("/exam");
  });
});
