import { describe, expect, it } from "vitest";

import { bankQuestion } from "@/tests/fixtures/exam-pattern-bank";
import type { Question } from "@/schemas/question.schema";
import { buildDrill, DRILL_QUESTION_COUNT, type DrillTarget } from "@/features/exam-engine/recommendation/build-drill";
import type { SkillRecommendation } from "@/features/exam-engine/recommendation/recommend-skills";

function makePoolQuestion(overrides: {
  id: string;
  subject?: string;
  skill?: string;
  topic?: string;
  yearLevel?: 3 | 5;
  examStyle?: 'naplan_style' | 'icas_style';
}): Question {
  const q = bankQuestion({
    id: overrides.id,
    subject: overrides.subject ?? 'numeracy',
    yearLevel: overrides.yearLevel,
    examStyle: overrides.examStyle,
  });
  return {
    ...q,
    metadata: {
      ...q.metadata,
      skill: overrides.skill,
      topic: overrides.topic ?? 'Fractions',
    },
  } as unknown as Question;
}

function makeRecommendation(overrides: Partial<SkillRecommendation> = {}): SkillRecommendation {
  return {
    subject: 'numeracy',
    skillOrTopic: 'Fractions',
    source: 'skill' as const,
    lostMarks: 2,
    accuracy: 33,
    attemptedCount: 3,
    totalCount: 3,
    reason: '2 of 3 Fractions questions need another look.',
    ...overrides,
  };
}

function makeTarget(overrides: Partial<DrillTarget> = {}): DrillTarget {
  return {
    recommendation: makeRecommendation(overrides.recommendation),
    yearLevel: 3,
    examStyle: 'naplan_style',
    previousQuestionIds: [],
    seed: 'test-seed',
    ...overrides,
  };
}

describe('buildDrill', () => {
  it('returns exactly 5 question IDs when sufficient pool exists', () => {
    const bank = Array.from({ length: 10 }, (_, i) => makePoolQuestion({ id: `q${i}`, skill: 'Fractions' }));
    const target = makeTarget();

    const result = buildDrill(bank, target);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.questionIds.length).toBe(DRILL_QUESTION_COUNT);
    }
  });

  it('produces deterministic output (same inputs produce same IDs and order)', () => {
    const bank = Array.from({ length: 10 }, (_, i) => makePoolQuestion({ id: `q${i}`, skill: 'Fractions' }));
    const target = makeTarget({ seed: 'consistent-seed' });

    const result1 = buildDrill(bank, target);
    const result2 = buildDrill(bank, target);
    
    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);
    if (result1.ok && result2.ok) {
      expect(result1.questionIds).toEqual(result2.questionIds);
    }
  });

  it('excludes previous questions when alternatives exist', () => {
    const bank = Array.from({ length: 10 }, (_, i) => makePoolQuestion({ id: `q${i}`, skill: 'Fractions' }));
    const target = makeTarget({ previousQuestionIds: ['q0', 'q1', 'q2'] });

    const result = buildDrill(bank, target);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.questionIds).not.toContain('q0');
      expect(result.questionIds).not.toContain('q1');
      expect(result.questionIds).not.toContain('q2');
    }
  });

  it('includes previous when alternatives insufficient', () => {
    const bank = Array.from({ length: 5 }, (_, i) => makePoolQuestion({ id: `q${i}`, skill: 'Fractions' }));
    const target = makeTarget({ previousQuestionIds: ['q0', 'q1'] }); 

    const result = buildDrill(bank, target);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.questionIds.length).toBe(5);
      expect(result.questionIds).toContain('q0'); 
    }
  });

  it('never duplicates IDs', () => {
    const bank = Array.from({ length: 6 }, (_, i) => makePoolQuestion({ id: `q${i}`, skill: 'Fractions' }));
    const target = makeTarget();

    const result = buildDrill(bank, target);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const uniqueIds = new Set(result.questionIds);
      expect(uniqueIds.size).toBe(5);
    }
  });

  it('never crosses subject', () => {
    const bank = [
      ...Array.from({ length: 5 }, (_, i) => makePoolQuestion({ id: `q${i}`, subject: 'numeracy', skill: 'Fractions' })),
      ...Array.from({ length: 5 }, (_, i) => makePoolQuestion({ id: `r${i}`, subject: 'reading', skill: 'Fractions' })),
    ];
    const target = makeTarget({ recommendation: makeRecommendation({ subject: 'numeracy' }) });

    const result = buildDrill(bank, target);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const allNumeracy = result.questionIds.every(id => id.startsWith('q'));
      expect(allNumeracy).toBe(true);
    }
  });

  it('prefers questions matching exam style', () => {
    const bank = [
      ...Array.from({ length: 5 }, (_, i) => makePoolQuestion({ id: `n${i}`, skill: 'Fractions', examStyle: 'naplan_style' })),
      ...Array.from({ length: 5 }, (_, i) => makePoolQuestion({ id: `i${i}`, skill: 'Fractions', examStyle: 'icas_style' })),
    ];
    const target = makeTarget({ examStyle: 'naplan_style' });

    const result = buildDrill(bank, target);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const naplanCount = result.questionIds.filter(id => id.startsWith('n')).length;
      expect(naplanCount).toBeGreaterThanOrEqual(5); 
    }
  });

  it('prefers questions matching year level', () => {
    const bank = [
      ...Array.from({ length: 5 }, (_, i) => makePoolQuestion({ id: `y3_${i}`, skill: 'Fractions', yearLevel: 3 })),
      ...Array.from({ length: 5 }, (_, i) => makePoolQuestion({ id: `y5_${i}`, skill: 'Fractions', yearLevel: 5 })),
    ];
    const target = makeTarget({ yearLevel: 3 });

    const result = buildDrill(bank, target);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const y3Count = result.questionIds.filter(id => id.startsWith('y3')).length;
      expect(y3Count).toBeGreaterThanOrEqual(5); 
    }
  });

  it('returns insufficient-pool result when <5 eligible questions', () => {
    const bank = Array.from({ length: 4 }, (_, i) => makePoolQuestion({ id: `q${i}`, skill: 'Fractions' }));
    const target = makeTarget();

    const result = buildDrill(bank, target);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBeDefined();
    }
  });

  it('returns error for empty subject or skill/topic in target', () => {
    const bank = Array.from({ length: 10 }, (_, i) => makePoolQuestion({ id: `q${i}`, skill: 'Fractions' }));
    
    // @ts-expect-error testing runtime invalid empty subject
    const target1 = makeTarget({ recommendation: makeRecommendation({ subject: "" }) });
    const result1 = buildDrill(bank, target1);
    expect(result1.ok).toBe(false);

    const target2 = makeTarget({ recommendation: makeRecommendation({ skillOrTopic: '' }) });
    const result2 = buildDrill(bank, target2);
    expect(result2.ok).toBe(false);
  });

  it('only selects from the provided bank', () => {
    const bank = Array.from({ length: 5 }, (_, i) => makePoolQuestion({ id: `q${i}`, skill: 'Fractions' }));
    const target = makeTarget();

    const result = buildDrill(bank, target);
    expect(result.ok).toBe(true);
    if (result.ok) {
      result.questionIds.forEach(id => {
        expect(bank.find(q => q.id === id)).toBeDefined();
      });
    }
  });

  it('returns insufficient result for empty bank', () => {
    const bank: Question[] = [];
    const target = makeTarget();

    const result = buildDrill(bank, target);
    expect(result.ok).toBe(false);
  });

  it('works when recommendation uses topic', () => {
    const bank = Array.from({ length: 5 }, (_, i) => makePoolQuestion({ id: `q${i}`, skill: undefined, topic: 'Fractions' }));
    const target = makeTarget({ recommendation: makeRecommendation({ source: 'topic' }) });

    const result = buildDrill(bank, target);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.questionIds.length).toBe(5);
    }
  });
});
