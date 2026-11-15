import type { Question } from "@/schemas/question.schema";

/** Pure planning only. Callers must supply the canonical server-gated bank.
 * This does not admit content, create sessions, accept client scores or persist attempts.
 */
export function selectPractice(
  approvedBank: readonly Question[], count: number,
  options: { subject?: string; weakTopics?: readonly string[]; random?: () => number } = {},
): Question[] {
  if (!Number.isInteger(count) || count<1) return [];
  const pool = approvedBank.filter(q=>q.status==="published" && q.examStyle==="scholarship_style" && q.id.startsWith("vihaan-") && (!options.subject || q.metadata.subject===options.subject) && (!options.weakTopics?.length || options.weakTopics.includes(q.metadata.topic)));
  const unique = [...new Map(pool.map(q=>[q.id,q])).values()];
  const random = options.random ?? Math.random;
  for (let i=unique.length-1;i>0;i--) {
    const r = random();
    if (!Number.isFinite(r) || r<0 || r>=1) throw new Error("Random source must return a value in [0,1)");
    const j = Math.floor(r*(i+1));
    [unique[i],unique[j]]=[unique[j],unique[i]];
  }
  return unique.slice(0,count);
}

/** Worked solution and optional human-only rubric/sample response for UI review. */
export interface VihaanSolutionDetail {
  readonly workedSolution: readonly string[];
  readonly rubric?: string;
  readonly sampleResponse?: string;
}

/** An adapter contract for server-verified persisted attempts, never browser input. */
export interface RecordedOutcome {
  responseId: string;
  questionId: string;
  topic: string;
  subject: string;
  submittedAt: string;
  elapsedSeconds: number;
  status: "correct" | "incorrect" | "unanswered" | "pending_manual_review";
}
export function summariseProgress(outcomes: readonly RecordedOutcome[]) {
  const topics = new Map<string,{ subject:string; topic:string; attempted:number; correct:number; seconds:number; attempts:Set<string> }>();
  const seen = new Set<string>();
  let pendingWriting = 0;
  for (const row of outcomes) {
    if (seen.has(row.responseId) || !row.responseId || !row.questionId.startsWith("vihaan-") || !Number.isFinite(Date.parse(row.submittedAt)) || !Number.isFinite(row.elapsedSeconds) || row.elapsedSeconds<0) continue;
    seen.add(row.responseId);
    if (row.subject==="writing") {
      if (row.status==="pending_manual_review") pendingWriting++;
      // A reviewed essay has rubric feedback, never an objectively correct answer.
      continue;
    }
    if (row.status==="pending_manual_review") continue;
    if (row.status!=="correct" && row.status!=="incorrect") continue;
    const key = JSON.stringify([row.subject,row.topic]);
    const topic = topics.get(key) ?? {subject:row.subject,topic:row.topic,attempted:0,correct:0,seconds:0,attempts:new Set<string>()};
    topic.attempted++;
    if (row.status==="correct") topic.correct++;
    topic.seconds+=row.elapsedSeconds;
    topic.attempts.add(row.questionId);
    topics.set(key,topic);
  }
  const summaries = [...topics.values()].map(t=>({subject:t.subject,topic:t.topic,attempted:t.attempted,distinctQuestions:t.attempts.size,accuracyPercent:Math.round(100*t.correct/t.attempted),meanSeconds:t.seconds/t.attempted,sufficientEvidence:t.attempts.size>=5}));
  return { topics:summaries, pendingWriting, weakTopics:summaries.filter(t=>t.sufficientEvidence && t.accuracyPercent<70).sort((a,b)=>a.accuracyPercent-b.accuracyPercent).map(t=>t.topic) };
}

export interface SittingOutcomeInput {
  readonly id: string;
  readonly submitted_at: string;
  readonly result: unknown;
}

export interface VihaanQuestionMetadata {
  readonly subject: string;
  readonly topic: string;
}

function inferSubjectFromQuestionId(questionId: string): string {
  if (/^vihaan-p\d+-m/.test(questionId)) return "numeracy";
  if (/^vihaan-p\d+-n/.test(questionId)) return "numerical_reasoning";
  if (/^vihaan-p\d+-v/.test(questionId)) return "verbal_reasoning";
  if (/^vihaan-p\d+-r/.test(questionId)) return "reading";
  if (/^vihaan-p\d+-w/.test(questionId)) return "writing";
  return "numeracy";
}

/**
 * Extracts verified `vihaan-*` question outcomes from persisted exam sitting
 * rows returned by `fetchSittingRows`. Keeps question bank lookup injected so
 * client modules never import draft question files.
 */
export function extractVihaanOutcomesFromSittings(
  sittings: readonly SittingOutcomeInput[],
  questionLookup: ReadonlyMap<string, VihaanQuestionMetadata> = new Map(),
): RecordedOutcome[] {
  const outcomes: RecordedOutcome[] = [];

  for (const sitting of sittings) {
    if (!sitting.id || !Number.isFinite(Date.parse(sitting.submitted_at))) continue;
    if (!sitting.result || typeof sitting.result !== "object") continue;

    const resultRecord = sitting.result as Record<string, unknown>;
    const rawDetails = Array.isArray(resultRecord.questionDetails)
      ? resultRecord.questionDetails
      : [];
    if (rawDetails.length === 0) continue;

    const rawSeconds = resultRecord.timeTakenSeconds;
    const totalSeconds =
      typeof rawSeconds === "number" && Number.isFinite(rawSeconds) && rawSeconds >= 0
        ? rawSeconds
        : 0;
    const elapsedPerQuestion = totalSeconds / rawDetails.length;

    for (const rawDetail of rawDetails) {
      if (!rawDetail || typeof rawDetail !== "object") continue;
      const detail = rawDetail as Record<string, unknown>;
      const questionId = typeof detail.questionId === "string" ? detail.questionId : "";
      if (!questionId.startsWith("vihaan-")) continue;

      const meta = questionLookup.get(questionId);
      const subject =
        meta?.subject ??
        (typeof detail.subject === "string" && detail.subject.trim()
          ? detail.subject.trim()
          : inferSubjectFromQuestionId(questionId));
      const topic =
        meta?.topic ??
        (typeof detail.topic === "string" && detail.topic.trim()
          ? detail.topic.trim()
          : "Diagnostic practice");

      const status: RecordedOutcome["status"] =
        detail.pendingManualReview === true ||
        detail.status === "pending_manual_review" ||
        (detail.requiresManualMarking === true && detail.attempted === true)
          ? "pending_manual_review"
          : detail.status === "correct"
            ? "correct"
            : detail.status === "incorrect"
              ? "incorrect"
              : "unanswered";

      outcomes.push({
        responseId: `${sitting.id}:${questionId}`,
        questionId,
        subject,
        topic,
        submittedAt: sitting.submitted_at,
        elapsedSeconds: elapsedPerQuestion,
        status,
      });
    }
  }

  return outcomes;
}

export interface VihaanSubjectSummary {
  readonly subject: string;
  readonly label: string;
  readonly attempted: number;
  readonly correct: number;
  readonly accuracyPercent: number | null;
  readonly pendingManualReview: number;
}

export interface VihaanParentDashboardSummary {
  readonly activitiesCompleted: number;
  readonly recordedItemsCount: number;
  readonly timeSpentMinutes: number;
  readonly overallAccuracyPercent: number | null;
  readonly pendingWriting: number;
  readonly weakTopics: readonly string[];
  readonly weakSubjects: readonly string[];
  readonly subjects: readonly VihaanSubjectSummary[];
}

const PARENT_SUBJECT_CATALOG: readonly { readonly key: string; readonly label: string; readonly planKey: string }[] = [
  { key: "numeracy", label: "Mathematics", planKey: "mathematics" },
  { key: "numerical_reasoning", label: "Numerical Reasoning", planKey: "numerical_reasoning" },
  { key: "verbal_reasoning", label: "Verbal Reasoning", planKey: "verbal_reasoning" },
  { key: "reading", label: "Reading Comprehension", planKey: "reading_comprehension" },
  { key: "writing", label: "Written Expression", planKey: "written_expression" },
];

function canonicalizeSubject(rawSubject: string): string {
  if (rawSubject === "mathematics") return "numeracy";
  if (rawSubject === "reading_comprehension") return "reading";
  if (rawSubject === "written_expression") return "writing";
  return rawSubject;
}

function toStudyPlanSubject(canonicalSubject: string): string {
  return (
    PARENT_SUBJECT_CATALOG.find((item) => item.key === canonicalSubject)?.planKey ?? canonicalSubject
  );
}

/**
 * Computes parent dashboard aggregates from deduplicated `vihaan-*` outcomes.
 * Writing tasks are tracked via `pendingManualReview` and excluded from objective accuracy.
 */
export function buildVihaanParentSummary(
  outcomes: readonly RecordedOutcome[],
): VihaanParentDashboardSummary {
  const normalized = outcomes.map((row) => ({
    ...row,
    subject: canonicalizeSubject(row.subject),
  }));
  const progress = summariseProgress(normalized);

  const seen = new Set<string>();
  const activityKeys = new Set<string>();
  const buckets = new Map<
    string,
    { attempted: number; correct: number; pendingManualReview: number }
  >(
    PARENT_SUBJECT_CATALOG.map((entry) => [
      entry.key,
      { attempted: 0, correct: 0, pendingManualReview: 0 },
    ]),
  );

  let totalSeconds = 0;
  let recordedItemsCount = 0;
  let objectiveAttempted = 0;
  let objectiveCorrect = 0;

  for (const row of normalized) {
    if (
      !row.responseId ||
      seen.has(row.responseId) ||
      !row.questionId.startsWith("vihaan-") ||
      !Number.isFinite(Date.parse(row.submittedAt)) ||
      !Number.isFinite(row.elapsedSeconds) ||
      row.elapsedSeconds < 0
    ) {
      continue;
    }
    seen.add(row.responseId);
    totalSeconds += row.elapsedSeconds;

    if (row.status === "unanswered") continue;

    const sep = row.responseId.indexOf(":");
    const activityKey = sep > 0 ? row.responseId.slice(0, sep) : row.responseId;
    activityKeys.add(activityKey);
    recordedItemsCount += 1;

    const bucket = buckets.get(row.subject) ?? {
      attempted: 0,
      correct: 0,
      pendingManualReview: 0,
    };

    if (row.subject === "writing") {
      if (row.status === "pending_manual_review") {
        bucket.attempted += 1;
        bucket.pendingManualReview += 1;
      }
      buckets.set(row.subject, bucket);
      continue;
    }

    if (row.status === "pending_manual_review") {
      bucket.pendingManualReview += 1;
      buckets.set(row.subject, bucket);
      continue;
    }

    bucket.attempted += 1;
    objectiveAttempted += 1;
    if (row.status === "correct") {
      bucket.correct += 1;
      objectiveCorrect += 1;
    }
    buckets.set(row.subject, bucket);
  }

  const weakSubjects = Array.from(
    new Set(
      progress.topics
        .filter((t) => t.sufficientEvidence && t.accuracyPercent < 70)
        .sort((a, b) => a.accuracyPercent - b.accuracyPercent)
        .map((t) => toStudyPlanSubject(t.subject)),
    ),
  );

  const subjects: VihaanSubjectSummary[] = PARENT_SUBJECT_CATALOG.map((entry) => {
    const counts = buckets.get(entry.key) ?? {
      attempted: 0,
      correct: 0,
      pendingManualReview: 0,
    };
    const isWriting = entry.key === "writing";
    const accuracyPercent =
      !isWriting && counts.attempted > 0
        ? Math.round((100 * counts.correct) / counts.attempted)
        : null;
    return {
      subject: entry.key,
      label: entry.label,
      attempted: counts.attempted,
      correct: counts.correct,
      accuracyPercent,
      pendingManualReview: counts.pendingManualReview,
    };
  });

  return {
    activitiesCompleted: activityKeys.size,
    recordedItemsCount,
    timeSpentMinutes: Math.round(totalSeconds / 60),
    overallAccuracyPercent:
      objectiveAttempted > 0 ? Math.round((100 * objectiveCorrect) / objectiveAttempted) : null,
    pendingWriting: progress.pendingWriting,
    weakTopics: progress.weakTopics,
    weakSubjects,
    subjects,
  };
}
