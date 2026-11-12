import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { getExamBank } from "@/server/exam-bank";
import { getMappedQuestionIdsForNode } from "@/features/curriculum/lessons/alignments";
import {
  filterEligibleQuestions,
  seededShuffle,
  type ExamStyleFilter,
  type SubjectFilter,
  type YearLevelFilter,
} from "@/features/exam-engine/selection";
import { toCandidateQuestions } from "@/features/exam-engine/types";
import { SUBJECT_LABELS } from "@/features/exam-engine/components/describe-config";
import { strandKey } from "@/features/practice-studio/availability";
import type { Question } from "@/schemas/question.schema";

/**
 * Server-selected, answer-stripped question delivery for practice sets (D13, C10).
 *
 * Replaces the client reading the entire answer-bearing guest bank. Answer keys
 * and explanations are never transmitted to the browser before submission (C10, C15).
 * Questions are de-duplicated by SHA-256 prompt hash (C5).
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const subject = (searchParams.get("subject") ?? "numeracy") as SubjectFilter;
  const yearParam = searchParams.get("year");
  const yearLevel = (yearParam ? parseInt(yearParam, 10) : 3) as YearLevelFilter;
  const examStyle = (searchParams.get("style") ?? "naplan_style") as ExamStyleFilter;
  const strand = searchParams.get("strand") ?? null;
  const curriculumCode = searchParams.get("curriculumCode") ?? null;
  const countParam = searchParams.get("count");
  const count = countParam ? Math.max(1, parseInt(countParam, 10)) : 10;
  const seedParam = searchParams.get("seed");

  const bank = getExamBank("practice");

  const candidateSource: Question[] = [];
  let title = SUBJECT_LABELS[subject] ?? "Practice Set";

  if (curriculumCode) {
    const mappedIds = getMappedQuestionIdsForNode(curriculumCode);
    const bankMap = new Map<string, Question>();
    for (const q of bank) bankMap.set(q.id, q);

    for (const id of mappedIds) {
      const q = bankMap.get(id);
      if (q) candidateSource.push(q);
    }
    title = `Practice: ${curriculumCode}`;
  } else {
    const eligible = filterEligibleQuestions(bank, {
      subject,
      yearLevel,
      examStyle,
    });

    // Filter by strand if specified
    const strandFiltered = strand
      ? eligible.filter(
          (q) => strandKey(q.metadata.strand ?? "") === strandKey(strand),
        )
      : eligible;

    // De-duplicate on prompt hash (C5): 1 question per unique prompt text
    const seenPrompts = new Set<string>();
    for (const q of strandFiltered) {
      const hash = createHash("sha256")
        .update(q.prompt.trim().toLowerCase())
        .digest("hex");
      if (!seenPrompts.has(hash)) {
        seenPrompts.add(hash);
        candidateSource.push(q);
      }
    }

    if (strand) {
      title = `${SUBJECT_LABELS[subject] ?? "Practice"}: ${strand}`;
    }
  }

  const seed =
    seedParam ??
    `practice-${subject}-${yearLevel}-${examStyle}-${strand ?? curriculumCode ?? "all"}`;
  const selectedQuestions = seededShuffle(candidateSource, seed).slice(0, count);

  // Strip answer keys and explanations before delivering to browser (C10, C15)
  const candidateQuestions = toCandidateQuestions(selectedQuestions);

  // Median estimated time in minutes (default ~1.5 min per question, rounded to nearest 5 mins)
  const estimatedMinutes = Math.max(5, Math.round((candidateQuestions.length * 1.5) / 5) * 5);

  return NextResponse.json({
    ok: true,
    questions: candidateQuestions,
    count: candidateQuestions.length,
    title,
    estimatedMinutes,
    subject,
    yearLevel,
  });
}
