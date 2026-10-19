import { describe, expect, it } from "vitest";

import { publishedExamBank } from "@/content/questions/practice-bank";
import { allFactoryPublishedQuestions } from "@/content/questions/factory-pools";
import { programmeIdForQuestion, publicationGateMode, selectServedQuestions } from "@/features/content-governance/gate-config";
import { buildExamResult } from "@/features/exam-engine/scoring/exam-report";
import { buildPatternReadiness, getExamPattern, selectPatternQuestions } from "@/features/exam-engine/exam-patterns";
import { adaptationSchema } from "@/features/exam-engine/exam-patterns/exam-pattern";
import { loadScholarshipDraftQuestions } from "@/tests/helpers/scholarship-published";
import type { Question } from "@/schemas/question.schema";

const sections = {
  vr: { id: "scholarship-y6-verbal-reasoning-full", total: 45, minutes: 30 },
  nr: { id: "scholarship-y6-numerical-reasoning-full", total: 40, minutes: 30 },
  rc: { id: "scholarship-y6-reading-full", total: 35, minutes: 30 },
  maths: { id: "scholarship-y6-mathematics-full", total: 40, minutes: 30 },
} as const;
const bank = {
  vr: loadScholarshipDraftQuestions("vr"),
  nr: loadScholarshipDraftQuestions("nr"),
  rc: loadScholarshipDraftQuestions("rc"),
  maths: loadScholarshipDraftQuestions("maths"),
};
const all = Object.values(bank).flat();

describe("production draft exclusion", () => {
  it("serves no scholarship content today: the served pool has none and drafts are not importable", () => {
    expect(allFactoryPublishedQuestions.filter((q) => q.examStyle === "scholarship_style")).toEqual([]);
    expect(publishedExamBank.filter((q) => q.examStyle === "scholarship_style")).toEqual([]);
    expect(publishedExamBank.some((q) => q.id.startsWith("scholarship-"))).toBe(false);
  });

  it("enforces approval for every scholarship programme by default, with no explicit switch", () => {
    for (const q of all) expect(publicationGateMode(programmeIdForQuestion(q)), q.id).toBe("enforce");
    expect(new Set(all.map(programmeIdForQuestion))).toEqual(new Set([
      "scholarship-y6-verbal-reasoning", "scholarship-y6-numerical-reasoning", "scholarship-y6-reading", "scholarship-y6-numeracy",
    ]));
  });

  it("drops an unapproved scholarship item even though no programme is explicitly enforced", () => {
    const legacy = publishedExamBank.slice(0, 5);
    const pool: Question[] = [...legacy, bank.nr[0], bank.nr[1]];
    const served = selectServedQuestions(pool, new Set([bank.nr[1].id]));
    expect(served.map((q) => q.id)).toEqual([...legacy.map((q) => q.id), bank.nr[1].id]);
    expect(selectServedQuestions(pool, new Set()).some((q) => q.id === bank.nr[0].id)).toBe(false);
  });

  it("leaves every existing programme in report mode and returns the identical array when nothing is scholarship", () => {
    const legacy = publishedExamBank.slice(0, 50);
    expect(selectServedQuestions(legacy, new Set())).toBe(legacy);
    expect(publicationGateMode("naplan-y5-numeracy")).toBe("report");
    expect(publicationGateMode("icas-y5-reading")).toBe("report");
    expect(publicationGateMode("amc-y5-mathematics")).toBe("report");
  });
});

describe("section selection and insufficient approved coverage", () => {
  for (const [key, s] of Object.entries(sections) as [keyof typeof sections, (typeof sections)[keyof typeof sections]][]) {
    const pattern = getExamPattern(s.id)!;

    it(`${key}: exposes the exact paper shape and says the length is our own`, () => {
      expect(pattern.questionCount).toBe(s.total);
      expect(pattern.timeMinutes).toBe(s.minutes);
      expect(pattern.basis).toBe("internal");
      expect(pattern.adaptations).toContain("unofficial_paper_shape");
      expect(pattern.practiceModule).toBe("not_offered");
      expect(adaptationSchema.safeParse("unofficial_paper_shape").success).toBe(true);
    });

    it(`${key}: is unavailable with nothing approved and never offers a partial module`, () => {
      const readiness = buildPatternReadiness([], pattern);
      expect(readiness.state).toBe("unavailable");
      expect(readiness.availableCount).toBe(0);
    });

    it(`${key}: is ready only with the complete approved section`, () => {
      expect(buildPatternReadiness(bank[key], pattern).state).toBe("ready");
      const drawn = selectPatternQuestions(bank[key], pattern, "seed-1");
      expect(drawn.ok).toBe(true);
      if (drawn.ok) {
        expect(drawn.questions).toHaveLength(s.total);
        expect(new Set(drawn.questions.map((q) => q.id)).size).toBe(s.total);
        expect(drawn.reduced).toBe(false);
      }
    });

    it(`${key}: one item short makes the paper unavailable, not a shorter paper, even when a module is requested`, () => {
      const short = bank[key].slice(1);
      const readiness = buildPatternReadiness(short, pattern);
      expect(readiness.state).toBe("unavailable");
      expect(readiness.availableCount).toBe(0);
      expect(selectPatternQuestions(short, pattern, "seed-1").ok).toBe(false);
      expect(selectPatternQuestions(short, pattern, "seed-1", { asPracticeModule: true }).ok).toBe(false);
    });

    it(`${key}: draws only from its own section`, () => {
      const mixed = all.filter((q) => !bank[key].includes(q)).concat(bank[key]);
      const drawn = selectPatternQuestions(mixed, pattern, "seed-2");
      expect(drawn.ok).toBe(true);
      if (drawn.ok) expect(drawn.questions.every((q) => bank[key].some((b) => b.id === q.id))).toBe(true);
    });
  }

  it("keeps the written-expression paper deferred and unavailable", () => {
    const pattern = getExamPattern("scholarship-y6-written-expression-full")!;
    expect(pattern.status).toBe("deferred");
    expect(buildPatternReadiness(all, pattern).state).toBe("unavailable");
  });
});

describe("shared-passage consistency", () => {
  it("gives every dependent question of a passage the identical stimulus", () => {
    const byTitle = new Map<string, Set<string>>();
    for (const q of bank.rc) {
      if (!q.stimulus) throw new Error(`${q.id} has no stimulus`);
      byTitle.set((q.stimulus.title ?? ""), (byTitle.get((q.stimulus.title ?? "")) ?? new Set()).add(JSON.stringify(q.stimulus)));
    }
    expect(byTitle.size).toBe(4);
    for (const [title, variants] of byTitle) expect(variants.size, title).toBe(1);
  });

  it("serves four whole passages, never a split one", () => {
    const pattern = getExamPattern(sections.rc.id)!;
    const sizes = new Map<string, number>();
    for (const q of bank.rc) sizes.set((q.stimulus!.title ?? ""), (sizes.get((q.stimulus!.title ?? "")) ?? 0) + 1);
    expect([...sizes.values()].sort()).toEqual([8, 9, 9, 9]);
    const drawn = selectPatternQuestions(bank.rc, pattern, "seed-passage");
    expect(drawn.ok).toBe(true);
    if (drawn.ok) {
      const counts = new Map<string, number>();
      for (const q of drawn.questions) counts.set((q.stimulus!.title ?? ""), (counts.get((q.stimulus!.title ?? "")) ?? 0) + 1);
      expect(counts).toEqual(sizes);
    }
  });

  it("makes the paper unavailable if one question of any passage is unapproved", () => {
    const pattern = getExamPattern(sections.rc.id)!;
    for (const drop of [bank.rc[0], bank.rc[10], bank.rc[20], bank.rc[34]]) {
      const without = bank.rc.filter((q) => q.id !== drop.id);
      expect(buildPatternReadiness(without, pattern).state, drop.id).toBe("unavailable");
    }
  });

  it("does not let an approved question stay attached to a stale copy of its passage", () => {
    const pattern = getExamPattern(sections.rc.id)!;
    const stale = bank.rc.map((q, i) => (i === 3 ? { ...q, stimulus: { ...q.stimulus!, body: `${q.stimulus!.body} (older wording)` } } : q));
    // The changed question is a different passage unit, so the four-passage rule no longer holds.
    expect(buildPatternReadiness(stale, pattern).state).toBe("unavailable");
  });
});

describe("scoring of correct, incorrect and unanswered responses", () => {
  const context = { startedAt: 0, submittedAt: 60_000, submissionReason: "user_submitted" as const };

  it("scores each state exactly and never counts an unanswered question as attempted", () => {
    const qs = bank.nr;
    const responses: Record<string, string | undefined> = {};
    qs.forEach((q, i) => {
      const key = (q.answerKey as { optionId: string }).optionId;
      if (i < 10) responses[q.id] = key;
      else if (i < 25) responses[q.id] = q.options.find((o) => o.id !== key)!.id;
      // the rest are left unanswered
    });
    const result = buildExamResult(qs, responses, context);
    expect(result.totalQuestions).toBe(40);
    expect(result.correctCount).toBe(10);
    expect(result.incorrectCount).toBe(15);
    expect(result.unansweredCount).toBe(15);
    expect(result.attemptedQuestions).toBe(25);
    expect(result.objectiveMarksAvailable).toBe(40);
    expect(result.objectiveMarksEarned).toBe(10);
    expect(result.objectivePercentage).toBe(25);
  });

  it("awards full marks for every key, and zero for none, across all four sections", () => {
    for (const key of Object.keys(sections) as (keyof typeof sections)[]) {
      const qs = bank[key];
      const perfect = Object.fromEntries(qs.map((q) => [q.id, (q.answerKey as { optionId: string }).optionId]));
      expect(buildExamResult(qs, perfect, context).correctCount, key).toBe(qs.length);
      expect(buildExamResult(qs, {}, context).unansweredCount, key).toBe(qs.length);
    }
  });

  it("marks reading by the real marks of each question, so section totals equal the sum of marks", () => {
    const totalMarks = bank.rc.reduce((sum, q) => sum + q.metadata.marks, 0);
    expect(buildExamResult(bank.rc, {}, context).objectiveMarksAvailable).toBe(totalMarks);
  });
});
