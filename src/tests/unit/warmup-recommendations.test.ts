import { describe, expect, it } from "vitest";

import type { DiagnosticBaselineRecord, SkillBaselineEntry } from "@/features/student/onboarding/baseline-contract";
import { recommendFromWarmup } from "@/features/student/onboarding/recommendations";
import type { StudioAvailability, StrandAvailability, SubjectAvailability } from "@/features/practice-studio/availability";

function skill(
  subject: string,
  strand: string,
  name: string,
  earned: number,
  available: number,
): SkillBaselineEntry {
  const accuracy = available > 0 ? Math.round((earned / available) * 100) : 0;
  return {
    subject,
    strand,
    skill: name,
    source: "skill",
    marksEarned: earned,
    marksAvailable: available,
    accuracy,
    attemptedCount: 1,
    totalCount: 1,
    incorrectCount: earned < available ? 1 : 0,
    performanceTier: accuracy >= 80 ? "strength" : accuracy >= 50 ? "developing" : "focus_area",
  };
}

function baseline(skills: SkillBaselineEntry[], yearLevel = 3): DiagnosticBaselineRecord {
  return {
    version: 1,
    studentId: "s1",
    yearLevel,
    completedAt: "2026-11-16T00:00:00.000Z",
    totalQuestions: skills.length,
    attemptedQuestions: skills.length,
    correctCount: skills.filter((s) => s.marksEarned === s.marksAvailable).length,
    overallAccuracy: 0,
    objectiveMarksEarned: 0,
    objectiveMarksAvailable: 0,
    skills,
    subjects: {},
  };
}

function strand(subject: SubjectAvailability["subject"], label: string, key: string, unique: number): StrandAvailability {
  return {
    yearLevel: 3,
    examStyle: "naplan_style",
    subject,
    strand: label,
    strandKey: key,
    uniqueQuestions: unique,
    eligible: unique >= 5,
    medianSeconds: 60,
    state: "ready",
  };
}

function subject(
  s: SubjectAvailability["subject"],
  strands: StrandAvailability[],
  state: SubjectAvailability["state"] = "ready",
): SubjectAvailability {
  return {
    yearLevel: 3,
    examStyle: "naplan_style",
    subject: s,
    state,
    uniqueQuestions: strands.reduce((n, x) => n + (x.uniqueQuestions ?? 0), 0),
    strands,
    duplicatesRemoved: 0,
    sharedPromptStems: null,
    reason: state === "ready" ? "has_content" : "no_content",
  };
}

const availability: StudioAvailability = {
  integrity: "ok",
  subjects: [
    subject("numeracy", [strand("numeracy", "Number & Arithmetic", "arithmetic and number", 24)]),
    subject("reading", [strand("reading", "Comprehension", "comprehension", 12)]),
    subject("language", [strand("language", "Grammar", "grammar", 3)]),
    subject("science", [], "none"),
  ],
};

describe("recommendFromWarmup", () => {
  it("recommends only the areas the child got wrong, weakest first, and not the ones they got right", () => {
    const result = recommendFromWarmup(
      baseline([
        skill("numeracy", "Number & Arithmetic", "Multiplication facts", 0, 1),
        skill("reading", "Comprehension", "Inference", 1, 1),
      ]),
      availability,
    );
    expect(result.items.map((i) => i.subjectLabel)).toEqual(["Numeracy"]);
    expect(result.strengths).toEqual(["Inference"]);
    expect(result.items[0]!.reason).toContain("0 of 1");
    expect(result.items[0]!.reason).toContain("Multiplication facts");
  });

  it("links a matching open strand directly to an untimed Practice Studio set", () => {
    const [item] = recommendFromWarmup(
      baseline([skill("numeracy", "Number & Arithmetic", "Multiplication facts", 0, 1)]),
      availability,
    ).items;
    expect(item!.direct).toBe(true);
    expect(item!.href).toBe(
      "/practice/session?year=3&style=naplan_style&subject=numeracy&count=10&strand=arithmetic%20and%20number&untimed=1",
    );
  });

  it("sends a subject with no matching open strand to the studio rather than inventing a set", () => {
    const [item] = recommendFromWarmup(
      baseline([skill("numeracy", "Measurement", "Time", 0, 1)]),
      availability,
    ).items;
    expect(item!.direct).toBe(false);
    expect(item!.href).toBe("/student/practice");
  });

  it("never recommends a subject that has no open practice, or a strand below the floor", () => {
    const result = recommendFromWarmup(
      baseline([
        skill("science", "Biology", "Living things", 0, 1),
        skill("language_conventions", "Grammar", "Verbs", 0, 1),
      ]),
      availability,
    );
    const hrefs = result.items.map((i) => i.href);
    expect(result.items.some((i) => i.subjectLabel === "Science")).toBe(false);
    expect(hrefs.every((h) => !h.includes("grammar"))).toBe(true);
  });

  it("changes with performance: the same bank gives different advice for different answers", () => {
    const a = recommendFromWarmup(
      baseline([
        skill("numeracy", "Number & Arithmetic", "Multiplication facts", 0, 1),
        skill("reading", "Comprehension", "Inference", 1, 1),
      ]),
      availability,
    );
    const b = recommendFromWarmup(
      baseline([
        skill("numeracy", "Number & Arithmetic", "Multiplication facts", 1, 1),
        skill("reading", "Comprehension", "Inference", 0, 1),
      ]),
      availability,
    );
    expect(a.items.map((i) => i.subjectLabel)).toEqual(["Numeracy"]);
    expect(b.items.map((i) => i.subjectLabel)).toEqual(["Reading"]);
  });

  it("says so honestly when everything was correct, with no practice items", () => {
    const result = recommendFromWarmup(
      baseline([skill("numeracy", "Number & Arithmetic", "Multiplication facts", 1, 1)]),
      availability,
    );
    expect(result.items).toEqual([]);
    expect(result.note).toMatch(/every warm-up question correctly/);
  });

  it("makes no recommendation when nothing could be marked", () => {
    const result = recommendFromWarmup(
      baseline([skill("reading", "Comprehension", "Inference", 0, 0)]),
      availability,
    );
    expect(result.items).toEqual([]);
    expect(result.note).toMatch(/could be marked automatically/);
  });

  it("is deterministic and caps the list at three", () => {
    const skills = [
      skill("numeracy", "Number & Arithmetic", "A", 0, 1),
      skill("reading", "Comprehension", "B", 0, 1),
      skill("numeracy", "Measurement", "C", 0, 1),
      skill("reading", "Vocabulary", "D", 0, 1),
    ];
    const first = recommendFromWarmup(baseline(skills), availability);
    const second = recommendFromWarmup(baseline([...skills].reverse()), availability);
    expect(first.items.length).toBeLessThanOrEqual(3);
    expect(second.items).toEqual(first.items);
  });
});
