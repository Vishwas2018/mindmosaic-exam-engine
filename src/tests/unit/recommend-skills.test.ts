import { describe, expect, it } from "vitest";

import { bankQuestion } from "@/tests/fixtures/exam-pattern-bank";
import type { Question } from "@/schemas/question.schema";
import type { ExamResult, QuestionResultDetail } from "@/features/exam-engine/scoring/exam-report";
import { recommendSkills } from "@/features/exam-engine/recommendation/recommend-skills";

function makeQuestion(overrides: {
  id: string;
  subject?: string;
  skill?: string;
  topic?: string;
  marks?: number;
}): Question {
  const q = bankQuestion({
    id: overrides.id,
    subject: overrides.subject ?? 'numeracy',
  });
  return {
    ...q,
    metadata: {
      ...q.metadata,
      skill: overrides.skill,
      topic: overrides.topic ?? 'General',
      marks: overrides.marks ?? 1,
    },
  } as unknown as Question;
}

function makeResult(details: QuestionResultDetail[]): ExamResult {
  return {
    totalQuestions: details.length,
    attemptedQuestions: details.filter(d => d.attempted).length,
    autoMarkedQuestions: details.filter(d => !d.requiresManualMarking).length,
    manualReviewQuestions: details.filter(d => d.requiresManualMarking).length,
    correctCount: details.filter(d => d.status === 'correct').length,
    incorrectCount: details.filter(d => d.status === 'incorrect').length,
    unansweredCount: details.filter(d => d.status === 'unanswered').length,
    objectiveMarksEarned: details.filter(d => !d.requiresManualMarking).reduce((s, d) => s + d.awardedMarks, 0),
    objectiveMarksAvailable: details.filter(d => !d.requiresManualMarking).reduce((s, d) => s + d.availableMarks, 0),
    objectivePercentage: 0,
    pendingManualMarks: 0,
    timeTakenSeconds: 600,
    submissionReason: 'user_submitted' as const,
    startedAt: 1000,
    submittedAt: 2000,
    questionDetails: details,
    breakdowns: {
      byQuestionType: {},
      bySubject: {},
      bySkill: {},
      byDifficulty: {},
      byYearLevel: {},
      byExamStyle: {},
    },
  };
}

function detail(questionId: string, overrides: Partial<QuestionResultDetail> = {}): QuestionResultDetail {
  return {
    questionId,
    status: 'incorrect',
    attempted: true,
    requiresManualMarking: false,
    pendingManualReview: false,
    awardedMarks: 0,
    availableMarks: 1,
    ...overrides,
  };
}

describe('recommendSkills', () => {
  it('groups questions by skill and ranks by lost marks', () => {
    const q1 = makeQuestion({ id: 'q1', skill: 'Skill A', marks: 1 });
    const q2 = makeQuestion({ id: 'q2', skill: 'Skill A', marks: 1 });
    const q3 = makeQuestion({ id: 'q3', skill: 'Skill B', marks: 1 });
    
    const result = makeResult([
      detail('q1', { awardedMarks: 0, availableMarks: 1 }),
      detail('q2', { awardedMarks: 0, availableMarks: 1 }),
      detail('q3', { awardedMarks: 0, availableMarks: 1 }),
    ]);

    const recs = recommendSkills(result, [q1, q2, q3]);
    
    expect(recs.perfectObjective).toBe(false);
    expect(recs.recommendations.length).toBe(2);
    expect(recs.recommendations[0].skillOrTopic).toBe('Skill A');
    expect(recs.recommendations[0].lostMarks).toBe(2);
    expect(recs.recommendations[1].skillOrTopic).toBe('Skill B');
    expect(recs.recommendations[1].lostMarks).toBe(1);
  });

  it('uses lower accuracy to tie-break when lost marks are equal', () => {
    const q1 = makeQuestion({ id: 'q1', skill: 'Skill A', marks: 1 });
    const q2 = makeQuestion({ id: 'q2', skill: 'Skill A', marks: 1 });
    const q3 = makeQuestion({ id: 'q3', skill: 'Skill B', marks: 1 });

    const result = makeResult([
      detail('q1', { status: 'correct', awardedMarks: 1, availableMarks: 1 }),
      detail('q2', { status: 'incorrect', awardedMarks: 0, availableMarks: 1 }),
      detail('q3', { status: 'incorrect', awardedMarks: 0, availableMarks: 1 }),
    ]);

    const recs = recommendSkills(result, [q1, q2, q3]);
    
    expect(recs.recommendations[0].skillOrTopic).toBe('Skill B'); 
    expect(recs.recommendations[1].skillOrTopic).toBe('Skill A'); 
  });

  it('uses larger sample size to tie-break when marks and accuracy are equal', () => {
    const qA1 = makeQuestion({ id: 'qA1', skill: 'Skill A', marks: 1 });
    const qA2 = makeQuestion({ id: 'qA2', skill: 'Skill A', marks: 1 });
    const qA3 = makeQuestion({ id: 'qA3', skill: 'Skill A', marks: 1 });
    const qA4 = makeQuestion({ id: 'qA4', skill: 'Skill A', marks: 1 });

    const qB1 = makeQuestion({ id: 'qB1', skill: 'Skill B', marks: 2 });
    const qB2 = makeQuestion({ id: 'qB2', skill: 'Skill B', marks: 2 });

    const result = makeResult([
      detail('qA1', { status: 'correct', awardedMarks: 1, availableMarks: 1 }),
      detail('qA2', { status: 'correct', awardedMarks: 1, availableMarks: 1 }),
      detail('qA3', { status: 'incorrect', awardedMarks: 0, availableMarks: 1 }),
      detail('qA4', { status: 'incorrect', awardedMarks: 0, availableMarks: 1 }),

      detail('qB1', { status: 'correct', awardedMarks: 2, availableMarks: 2 }),
      detail('qB2', { status: 'incorrect', awardedMarks: 0, availableMarks: 2 }),
    ]);

    const recs = recommendSkills(result, [qA1, qA2, qA3, qA4, qB1, qB2]);
    
    expect(recs.recommendations[0].skillOrTopic).toBe('Skill A');
    expect(recs.recommendations[1].skillOrTopic).toBe('Skill B');
  });

  it('uses alphabetical order for final tie-break', () => {
    const q1 = makeQuestion({ id: 'q1', skill: 'Skill Y', marks: 1 });
    const q2 = makeQuestion({ id: 'q2', skill: 'Skill X', marks: 1 });

    const result = makeResult([
      detail('q1', { status: 'incorrect', awardedMarks: 0, availableMarks: 1 }),
      detail('q2', { status: 'incorrect', awardedMarks: 0, availableMarks: 1 }),
    ]);

    const recs = recommendSkills(result, [q1, q2]);
    
    expect(recs.recommendations[0].skillOrTopic).toBe('Skill X');
    expect(recs.recommendations[1].skillOrTopic).toBe('Skill Y');
  });

  it('groups questions with the same skill together', () => {
    const q1 = makeQuestion({ id: 'q1', skill: 'Algebra', marks: 1 });
    const q2 = makeQuestion({ id: 'q2', skill: 'Algebra', marks: 1 });

    const result = makeResult([
      detail('q1', { status: 'incorrect', awardedMarks: 0, availableMarks: 1 }),
      detail('q2', { status: 'incorrect', awardedMarks: 0, availableMarks: 1 }),
    ]);

    const recs = recommendSkills(result, [q1, q2]);
    expect(recs.recommendations.length).toBe(1);
    expect(recs.recommendations[0].skillOrTopic).toBe('Algebra');
    expect(recs.recommendations[0].lostMarks).toBe(2);
    expect(recs.recommendations[0].totalCount).toBe(2);
  });

  it('uses topic as fallback when skill is absent', () => {
    const q1 = makeQuestion({ id: 'q1', skill: undefined, topic: 'Fractions', marks: 1 });
    
    const result = makeResult([
      detail('q1', { status: 'incorrect', awardedMarks: 0, availableMarks: 1 }),
    ]);

    const recs = recommendSkills(result, [q1]);
    expect(recs.recommendations[0].skillOrTopic).toBe('Fractions');
    expect(recs.recommendations[0].source).toBe('topic');
  });

  it('counts unanswered objective items as lost marks', () => {
    const q1 = makeQuestion({ id: 'q1', skill: 'Algebra', marks: 1 });
    
    const result = makeResult([
      detail('q1', { status: 'unanswered', attempted: false, awardedMarks: 0, availableMarks: 1 }),
    ]);

    const recs = recommendSkills(result, [q1]);
    expect(recs.recommendations[0].lostMarks).toBe(1);
  });

  it('excludes manual-review (essay) questions from recommendations', () => {
    const q1 = makeQuestion({ id: 'q1', skill: 'Writing', marks: 10 });
    
    const result = makeResult([
      detail('q1', { status: 'manual_review', requiresManualMarking: true, pendingManualReview: true, awardedMarks: 0, availableMarks: 10 }),
    ]);

    const recs = recommendSkills(result, [q1]);
    expect(recs.recommendations.length).toBe(0);
  });

  it('returns perfectObjective true when no mistakes in objective questions', () => {
    const q1 = makeQuestion({ id: 'q1', skill: 'Algebra', marks: 1 });
    
    const result = makeResult([
      detail('q1', { status: 'correct', awardedMarks: 1, availableMarks: 1 }),
    ]);

    const recs = recommendSkills(result, [q1]);
    expect(recs.perfectObjective).toBe(true);
    expect(recs.recommendations.length).toBe(0);
  });

  it('separates groups for mixed subjects', () => {
    const q1 = makeQuestion({ id: 'q1', subject: 'numeracy', skill: 'Data', marks: 1 });
    const q2 = makeQuestion({ id: 'q2', subject: 'reading', skill: 'Data', marks: 1 });

    const result = makeResult([
      detail('q1', { status: 'incorrect', awardedMarks: 0, availableMarks: 1 }),
      detail('q2', { status: 'incorrect', awardedMarks: 0, availableMarks: 1 }),
    ]);

    const recs = recommendSkills(result, [q1, q2]);
    expect(recs.recommendations.length).toBe(2);
    expect(recs.recommendations[0].subject).not.toBe(recs.recommendations[1].subject);
  });

  it('produces deterministic output (same input produces same output)', () => {
    const q1 = makeQuestion({ id: 'q1', skill: 'A', marks: 1 });
    const q2 = makeQuestion({ id: 'q2', skill: 'B', marks: 1 });
    
    const result = makeResult([
      detail('q1', { status: 'incorrect', awardedMarks: 0, availableMarks: 1 }),
      detail('q2', { status: 'incorrect', awardedMarks: 0, availableMarks: 1 }),
    ]);

    const recs1 = recommendSkills(result, [q1, q2]);
    const recs2 = recommendSkills(result, [q1, q2]);
    
    expect(recs1).toEqual(recs2);
  });

  it('returns a maximum of three recommendations', () => {
    const q1 = makeQuestion({ id: 'q1', skill: 'Skill 1', marks: 1 });
    const q2 = makeQuestion({ id: 'q2', skill: 'Skill 2', marks: 1 });
    const q3 = makeQuestion({ id: 'q3', skill: 'Skill 3', marks: 1 });
    const q4 = makeQuestion({ id: 'q4', skill: 'Skill 4', marks: 1 });

    const result = makeResult([
      detail('q1', { status: 'incorrect', awardedMarks: 0, availableMarks: 1 }),
      detail('q2', { status: 'incorrect', awardedMarks: 0, availableMarks: 1 }),
      detail('q3', { status: 'incorrect', awardedMarks: 0, availableMarks: 1 }),
      detail('q4', { status: 'incorrect', awardedMarks: 0, availableMarks: 1 }),
    ]);

    const recs = recommendSkills(result, [q1, q2, q3, q4]);
    expect(recs.recommendations.length).toBe(3);
  });
});
