import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { getExamBank, getGuestExamBank } from "@/server/exam-bank";
import {
  PRACTICE_TOKEN_MAX_QUESTIONS,
  issuePracticeToken,
} from "@/server/practice-session-token";
import { getSignedInUserId } from "@/server/practice-session-user";
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
import { checkOrigin } from "@/features/auth/require-origin";
import { parsePracticeSessionParams } from "@/features/exam-engine/practice-mode/practice-params.schema";
import { buildDrill } from "@/features/exam-engine/recommendation/build-drill";
import { drillLaunchRequestSchema } from "@/features/exam-engine/recommendation/drill-handoff";
import { skillLabel } from "@/features/parent-dashboard/skill-label";

const privateHeaders = { "Cache-Control": "private, no-store" };

/**
 * Server-selected, answer-stripped question delivery for practice sets (D13, C10).
 *
 * Replaces the client reading the entire answer-bearing guest bank. Answer keys
 * and explanations are never transmitted to the browser before submission (C10, C15).
 * Questions are de-duplicated by SHA-256 prompt hash (C5).
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("source") === "learning") {
    const parsed = parsePracticeSessionParams(searchParams);
    if (!parsed.ok || parsed.mode !== "standard") {
      return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400, headers: privateHeaders });
    }
    const { subject, year, style, curriculumCode, skill, count, seed } = parsed.params;
    const bank = getGuestExamBank("published");
    let candidates: readonly Question[];
    if (curriculumCode) {
      const mapped = new Set(getMappedQuestionIdsForNode(curriculumCode));
      candidates = bank.filter((item) => mapped.has(item.id));
    } else {
      const eligible = filterEligibleQuestions(bank, { subject, yearLevel: year, examStyle: style });
      candidates = skill
        ? eligible.filter((item) => (item.metadata.skill ?? item.metadata.topic) === skill)
        : eligible;
    }
    const selected = seededShuffle(candidates, seed ?? ["practice", subject, year, style, skill ?? "any"].join("-")).slice(0, count);
    const title = curriculumCode ? "Practice: " + curriculumCode
      : skill ? skillLabel(skill) : (SUBJECT_LABELS[subject] ?? "Practice");
    return deliver(selected, title, { subject, yearLevel: year });
  }

  const subject = (searchParams.get("subject") ?? "numeracy") as SubjectFilter;
  const yearParam = searchParams.get("year");
  const yearLevel = (yearParam ? parseInt(yearParam, 10) : 3) as YearLevelFilter;
  const examStyle = (searchParams.get("style") ?? "naplan_style") as ExamStyleFilter;
  const strand = searchParams.get("strand") ?? null;
  const curriculumCode = searchParams.get("curriculumCode") ?? null;
  const countParam = searchParams.get("count");
  const parsedCount = countParam ? parseInt(countParam, 10) : 10;
  const count = Number.isFinite(parsedCount)
    ? Math.min(PRACTICE_TOKEN_MAX_QUESTIONS, Math.max(1, parsedCount))
    : 10;
  const seedParam = searchParams.get("seed");

  // Scholarship-style content is signed-in only (see getGuestExamBank); a guest never receives it here either.
  const userId = await getSignedInUserId();
  const fullBank = getExamBank("practice");
  const bank = userId ? fullBank : fullBank.filter((q) => q.examStyle !== "scholarship_style");

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

  return deliver(selectedQuestions, title, { subject, yearLevel }, userId);
}

/** A validated drill request selects a set on the server. It cannot select answer-bearing fields. */
export async function POST(request: Request): Promise<NextResponse> {
  const origin = checkOrigin(request);
  if (!origin.ok) return origin.response;
  const body: unknown = await request.json().catch(() => null);
  const parsed = drillLaunchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400, headers: privateHeaders });
  }
  const { subject, yearLevel, examStyle, previousQuestionIds, skillOrTopic, source, seed } = parsed.data;
  const bank = getGuestExamBank("published");
  const bankById = new Map(bank.map((item) => [item.id, item]));
  const result = buildDrill(bank, {
    recommendation: { subject, skillOrTopic, source, reason: "low_accuracy", lostMarks: 0, accuracy: 0, attemptedCount: 0, totalCount: 0 },
    yearLevel,
    examStyle,
    previousQuestionIds: previousQuestionIds.filter((id) => bankById.has(id)),
    seed,
  });
  if (!result.ok) {
    /* Too few eligible questions is an expected outcome, not a failed request: 200 keeps it out of the console. */
    return NextResponse.json({
      ok: false, error: result.reason,
      ...(result.reason === "insufficient_questions" ? { eligibleCount: result.eligibleCount } : {}),
    }, { status: result.reason === "insufficient_questions" ? 200 : 422, headers: privateHeaders });
  }
  const selected = result.questionIds.flatMap((id) => {
    const question = bankById.get(id);
    return question ? [question] : [];
  });
  if (selected.length !== 5 || new Set(selected.map(({ id }) => id)).size !== 5) {
    return NextResponse.json({ ok: false, error: "invalid_drill" }, { status: 422, headers: privateHeaders });
  }
  return deliver(selected, 'Practise: ' + skillLabel(skillOrTopic), { subject, yearLevel });
}

function deliver(
  selected: readonly Question[],
  title: string,
  context: { subject: string; yearLevel: YearLevelFilter },
  userId?: string | null,
) {
  const questions = toCandidateQuestions(selected);
  const signedInOnly = selected.some((q) => q.examStyle === "scholarship_style");
  const practiceToken = issuePracticeToken({
    ids: selected.map((q) => q.id),
    ...(signedInOnly && userId ? { sub: userId } : {}),
  });
  if (practiceToken === null) {
    return NextResponse.json({ ok: false, error: "practice_unavailable" }, { status: 503, headers: privateHeaders });
  }
  return NextResponse.json({
    ok: true, questions, count: questions.length, practiceToken, title,
    estimatedMinutes: Math.max(5, Math.round((questions.length * 1.5) / 5) * 5),
    ...context,
  }, { headers: privateHeaders });
}
