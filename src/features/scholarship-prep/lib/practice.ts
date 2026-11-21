import type { Question } from "@/schemas/question.schema";

/**
 * Persisted DEV E2E verification sittings from PR #133 verification.
 * Excluded from Vihaan's genuine student/parent progress metrics without
 * deleting audit/database records.
 */
export const SYNTHETIC_E2E_SITTING_IDS: ReadonlySet<string> = new Set([
  "c2f65f8b-2f38-4c8b-87e6-bc5960fb5f8e",
  "c0d0073f-ec53-4a3f-b3ae-7929e05144ec",
  "42bdcb30-9f97-4685-b8c9-36b79afc66e0",
  "fc64941f-19a1-474c-89c7-b4d3826ab3b4",
]);

/**
 * Reserves 166 unseen questions from the 500-item bank strictly for timed
 * official Mock Examinations:
 * - Mathematics (`m075`–`m114`): 40
 * - Numerical Reasoning (`n076`–`n115`): 40
 * - Verbal Reasoning (`v072`–`v116`): 45
 * - Reading Comprehension (`r063`–`r097`, 7 complete passages): 35
 * - Written Expression (`w033`–`w038`): 6
 */
export function isExposedMockQuestion(questionId: string): boolean {
  const match = /^vihaan-e500-([mnvrw])(\d{3})$/.exec(questionId);
  if (!match) return false;
  const kind = match[1];
  const index = Number(match[2]);
  switch (kind) {
    case "m":
      return index >= 75 && index <= 114;
    case "n":
      return index >= 76 && index <= 115;
    case "v":
      return index >= 72 && index <= 116;
    case "r":
      return index >= 63 && index <= 97;
    case "w":
      return index >= 33 && index <= 38;
    default:
      return false;
  }
}

/**
 * The 166 items above were published, with stems and answer keys, in the public repository (since 2026-11-16),
 * so they can no longer be offered as UNSEEN mock material. While this flag is true they are ordinary practice
 * items: they join the practice pool, the unseen mock pool is empty, and no mock paper can be sat. Historical
 * attempts that used them stay readable (they resolve by question id). Flip it only when a privately held,
 * independently reviewed replacement set is released through a hash-bound source (docs: private content
 * migration), never to re-reserve the exposed ids.
 */
export const EXPOSED_MOCK_ITEMS_PRACTICE_ONLY = true;

/** Items reserved exclusively for unseen Mock Examinations. Empty while the exposed set is practice-only. */
export function isReservedMockExamQuestion(questionId: string): boolean {
  return !EXPOSED_MOCK_ITEMS_PRACTICE_ONLY && isExposedMockQuestion(questionId);
}

function shuffleWithRandom<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const r = random();
    if (!Number.isFinite(r) || r < 0 || r >= 1) {
      throw new Error("Random source must return a value in [0,1)");
    }
    const j = Math.floor(r * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Pure planning only. Callers must supply the canonical server-gated bank.
 * This does not admit content, create sessions, accept client scores or persist attempts.
 */
export function selectPractice(
  approvedBank: readonly Question[],
  count: number,
  options: { subject?: string; weakTopics?: readonly string[]; random?: () => number } = {},
): Question[] {
  if (!Number.isInteger(count) || count < 1) return [];
  const pool = approvedBank.filter(
    (q) =>
      q.status === "published" &&
      q.examStyle === "scholarship_style" &&
      q.id.startsWith("vihaan-") &&
      !isReservedMockExamQuestion(q.id) &&
      (!options.subject || q.metadata.subject === options.subject) &&
      (!options.weakTopics?.length || options.weakTopics.includes(q.metadata.topic)),
  );
  const unique = [...new Map(pool.map((q) => [q.id, q])).values()];
  return shuffleWithRandom(unique, options.random ?? Math.random).slice(0, count);
}

/**
 * Adaptive practice selector across the 334 non-mock items:
 * 1) Strictly excludes the 166 reserved mock-exam items.
 * 2) Prioritizes unseen questions first, then previously incorrect questions,
 *    and previously correct questions last (minimal repetition).
 * 3) Calibrates difficulty mix (`easy` / `medium` / `challenging`) using
 *    rolling subject accuracy (< 60% Foundation, 60–80% Standard, > 80% Stretch).
 * 4) Keeps shared Reading Comprehension passages grouped together when selecting.
 */
export function selectAdaptivePractice(
  approvedBank: readonly Question[],
  count: number,
  options: {
    subject?: string;
    skill?: string;
    weakTopics?: readonly string[];
    outcomes?: readonly RecordedOutcome[];
    excludeIds?: ReadonlySet<string>;
    random?: () => number;
  } = {},
): Question[] {
  if (!Number.isInteger(count) || count < 1) return [];
  const random = options.random ?? Math.random;
  const canonicalFilter = options.subject ? canonicalizeSubject(options.subject) : undefined;

  const pool = approvedBank.filter((q) => {
    if (
      q.status !== "published" ||
      q.examStyle !== "scholarship_style" ||
      !q.id.startsWith("vihaan-") ||
      isReservedMockExamQuestion(q.id) ||
      options.excludeIds?.has(q.id)
    ) {
      return false;
    }
    if (canonicalFilter && q.metadata.subject !== canonicalFilter) return false;
    if (options.skill && q.metadata.skill !== options.skill) return false;
    if (options.weakTopics?.length && !options.weakTopics.includes(q.metadata.topic)) {
      return false;
    }
    return true;
  });

  const unique = [...new Map(pool.map((q) => [q.id, q])).values()];
  if (unique.length === 0) return [];

  const lastStatusById = new Map<string, RecordedOutcome["status"]>();
  let subjectAttempted = 0;
  let subjectCorrect = 0;

  for (const outcome of options.outcomes ?? []) {
    if (outcome.status === "unanswered") continue;
    lastStatusById.set(outcome.questionId, outcome.status);
    if (!canonicalFilter || canonicalizeSubject(outcome.subject) === canonicalFilter) {
      if (outcome.status === "correct" || outcome.status === "incorrect") {
        subjectAttempted += 1;
        if (outcome.status === "correct") subjectCorrect += 1;
      }
    }
  }

  const accuracy = subjectAttempted > 0 ? Math.round((100 * subjectCorrect) / subjectAttempted) : 70;
  const difficultyRank: Record<string, number> =
    accuracy < 60
      ? { easy: 0, medium: 1, challenging: 2 }
      : accuracy > 80
        ? { challenging: 0, medium: 1, easy: 2 }
        : { medium: 0, challenging: 1, easy: 2 };

  const unseen = unique.filter((q) => !lastStatusById.has(q.id));
  const previouslyIncorrect = unique.filter((q) => lastStatusById.get(q.id) === "incorrect");
  const previouslyOther = unique.filter(
    (q) => lastStatusById.has(q.id) && lastStatusById.get(q.id) !== "incorrect",
  );

  const sortTier = (tier: Question[]): Question[] => {
    const shuffled = shuffleWithRandom(tier, random);
    shuffled.sort(
      (a, b) =>
        (difficultyRank[a.metadata.difficulty] ?? 1) - (difficultyRank[b.metadata.difficulty] ?? 1),
    );
    return shuffled;
  };

  const ordered = [
    ...sortTier(unseen),
    ...sortTier(previouslyIncorrect),
    ...sortTier(previouslyOther),
  ];

  // For shared reading passages, pull sibling questions from the same passage together when possible.
  if (canonicalFilter === "reading") {
    const picked: Question[] = [];
    const seenIds = new Set<string>();
    const byPassage = new Map<string, Question[]>();
    for (const q of unique) {
      const title = q.stimulus?.title ?? q.id;
      const list = byPassage.get(title) ?? [];
      list.push(q);
      byPassage.set(title, list);
    }
    for (const q of ordered) {
      if (picked.length >= count) break;
      if (seenIds.has(q.id)) continue;
      const siblings = (byPassage.get(q.stimulus?.title ?? q.id) ?? [q]).sort((a, b) =>
        a.id.localeCompare(b.id),
      );
      for (const sib of siblings) {
        if (picked.length >= count) break;
        if (!seenIds.has(sib.id)) {
          seenIds.add(sib.id);
          picked.push(sib);
        }
      }
    }
    return picked.slice(0, count);
  }

  return ordered.slice(0, count);
}

export type MockExamSectionKey =
  | "verbal_reasoning"
  | "numerical_reasoning"
  | "reading"
  | "numeracy"
  | "writing"
  | "full_mock";

/**
 * Selects questions strictly from the 166 reserved unseen Mock Examination pool.
 */
export function selectMockExamQuestions(
  approvedBank: readonly Question[],
  section: MockExamSectionKey,
  outcomes: readonly RecordedOutcome[] = [],
): Question[] {
  const reserved = approvedBank
    .filter(
      (q) =>
        q.status === "published" &&
        q.examStyle === "scholarship_style" &&
        isReservedMockExamQuestion(q.id),
    )
    .sort((a, b) => a.id.localeCompare(b.id));

  const pickSection = (subject: string, limit: number): Question[] =>
    reserved.filter((q) => q.metadata.subject === subject).slice(0, limit);

  const pickWritingPrompt = (): Question[] => {
    const seenIds = new Set(outcomes.map((o) => o.questionId));
    const writingPool = reserved.filter((q) => q.metadata.subject === "writing");
    const unseen = writingPool.find((q) => !seenIds.has(q.id));
    return unseen ? [unseen] : writingPool.slice(0, 1);
  };

  if (section === "full_mock") {
    return [
      ...pickSection("verbal_reasoning", 45),
      ...pickSection("numerical_reasoning", 40),
      ...pickSection("reading", 35),
      ...pickSection("numeracy", 40),
      ...pickWritingPrompt(),
    ];
  }
  if (section === "verbal_reasoning") return pickSection("verbal_reasoning", 45);
  if (section === "numerical_reasoning") return pickSection("numerical_reasoning", 40);
  if (section === "reading") return pickSection("reading", 35);
  if (section === "numeracy") return pickSection("numeracy", 40);
  return pickWritingPrompt();
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
  readonly session?: { readonly config?: unknown } | null;
}

export interface VihaanQuestionMetadata {
  readonly subject: string;
  readonly topic: string;
}

export function isSyntheticVihaanSitting(sitting: SittingOutcomeInput): boolean {
  if (SYNTHETIC_E2E_SITTING_IDS.has(sitting.id)) {
    return true;
  }
  const sessionConfig =
    sitting.session && typeof sitting.session === "object"
      ? (sitting.session.config as Record<string, unknown> | null | undefined)
      : null;
  if (sessionConfig?.isSyntheticE2e === true) {
    return true;
  }
  const resultRecord =
    sitting.result && typeof sitting.result === "object"
      ? (sitting.result as Record<string, unknown>)
      : null;
  return resultRecord?.isSyntheticE2e === true;
}

function inferSubjectFromQuestionId(questionId: string): string {
  if (/^vihaan-(?:p\d+|e500)-m/.test(questionId)) return "numeracy";
  if (/^vihaan-(?:p\d+|e500)-n/.test(questionId)) return "numerical_reasoning";
  if (/^vihaan-(?:p\d+|e500)-v/.test(questionId)) return "verbal_reasoning";
  if (/^vihaan-(?:p\d+|e500)-r/.test(questionId)) return "reading";
  if (/^vihaan-(?:p\d+|e500)-w/.test(questionId)) return "writing";
  return "numeracy";
}

/**
 * Extracts verified `vihaan-*` question outcomes from persisted exam sitting
 * rows returned by `fetchSittingRows`. Excludes synthetic E2E verification
 * sittings by default so Vihaan's genuine metrics stay uncontaminated without
 * deleting database records.
 */
export function extractVihaanOutcomesFromSittings(
  sittings: readonly SittingOutcomeInput[],
  questionLookup: ReadonlyMap<string, VihaanQuestionMetadata> = new Map(),
  options: { readonly includeSyntheticE2e?: boolean } = {},
): RecordedOutcome[] {
  const outcomes: RecordedOutcome[] = [];

  for (const sitting of sittings) {
    if (!sitting.id || !Number.isFinite(Date.parse(sitting.submitted_at))) continue;
    if (!options.includeSyntheticE2e && isSyntheticVihaanSitting(sitting)) continue;
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
