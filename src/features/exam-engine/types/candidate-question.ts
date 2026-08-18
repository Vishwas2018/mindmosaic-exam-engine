import type { AnswerKind, MediaAsset, Question } from "@/schemas/question.schema";

export type CandidateMediaAsset = Pick<
  MediaAsset,
  | "id"
  | "kind"
  | "mimeType"
  | "durationSeconds"
  | "title"
  | "instruction"
  | "playback"
  | "accessibility"
  | "integrity"
> & {
  /** Same-origin governed path. Private bucket/object details never cross the DTO. */
  src: string;
  transcript?: { visibility: "learner"; text: string };
};

/**
 * The complete authored question: answer key, explanation and every
 * editorial field. This is what scoring needs and what the review screen
 * reveals after submission — never what mid-exam UI state holds.
 */
export type AuthoringQuestion = Question;

/**
 * What the exam UI renders to a candidate mid-attempt: everything needed
 * to present and answer a question, with the answer key and explanation
 * stripped out entirely.
 *
 * `answerKind` is retained even though it is derived from the answer key,
 * because a few renderers dispatch on the *shape* of the expected answer
 * (reading comprehension picks a sub-renderer by it; short-answer decides
 * whether to show a "reviewed by a marker" notice). That shape is not
 * itself an answer — knowing a question is multiple-choice doesn't reveal
 * which option is correct.
 */
export type CandidateQuestion = Omit<
  Question,
  "answerKey" | "explanation" | "media"
> & {
  answerKind: AnswerKind;
  media?: readonly CandidateMediaAsset[];
  /** Instructional word-count guidance for essay-style responses, if any. */
  minWords?: number;
  maxWords?: number;
};

/**
 * What the results/review screen renders once an exam is submitted — the
 * full authored question, answer key and explanation included. Distinct
 * from AuthoringQuestion only in intent: this name marks the one place in
 * the UI where revealing that data is correct, not accidental.
 */
export type ReviewQuestion = Question;

export function toCandidateMediaAsset(asset: MediaAsset): CandidateMediaAsset {
  return {
    id: asset.id,
    kind: asset.kind,
    mimeType: asset.mimeType,
    durationSeconds: asset.durationSeconds,
    title: asset.title,
    instruction: asset.instruction,
    playback: asset.playback,
    accessibility: asset.accessibility,
    integrity: asset.integrity,
    src:
      asset.source.kind === "governed_local"
        ? asset.source.path
        : `/api/assessment/media/${encodeURIComponent(asset.id)}`,
    ...(asset.transcript.visibility === "learner"
      ? { transcript: { visibility: "learner" as const, text: asset.transcript.text } }
      : {}),
  };
}

/**
 * Strip a question down to what a candidate should see before submitting.
 * This is the one place answer-revealing fields are removed; every
 * candidate-facing surface (exam store, renderers, showcase) should reach
 * a CandidateQuestion only through this function, never by hand-picking
 * fields off an AuthoringQuestion.
 */
export function toCandidateQuestion(question: AuthoringQuestion): CandidateQuestion {
  const { answerKey, explanation: _explanation, media, ...rest } = question;
  void _explanation;
  const manual = answerKey.kind === "manual" ? answerKey : undefined;
  return {
    ...rest,
    media: media?.map(toCandidateMediaAsset),
    answerKind: answerKey.kind,
    minWords: manual?.minWords,
    maxWords: manual?.maxWords,
  };
}

export function toCandidateQuestions(
  questions: readonly AuthoringQuestion[],
): CandidateQuestion[] {
  return questions.map(toCandidateQuestion);
}
