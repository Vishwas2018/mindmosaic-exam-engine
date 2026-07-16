/**
 * Pure, deterministic structural-proxy difficulty estimator. Three
 * measurable signals — reading load, vocabulary complexity, and a
 * reasoning-step proxy — combined into a single 0..1 score and mapped
 * onto the same three-band scale (`easy`/`medium`/`challenging`) the
 * blueprint's own `difficulty` field uses. Explicitly not a calibrated
 * psychometric model (PD-4 Option A, rejected) — see the Mission 3D plan
 * §4b for the exact formulas this file implements.
 */
import { DIFFICULTY_BANDS, type DifficultyBand, type DifficultySignals } from "./types";

/** Bump when a signal formula, the combination weighting, or the confidence formula changes. */
export const DIFFICULTY_ESTIMATOR_VERSION = "1" as const;

const WORDS_LOW = 20;
const WORDS_HIGH = 60;
const AVG_WORD_LENGTH_LOW = 4.0;
const AVG_WORD_LENGTH_HIGH = 7.0;
const COMPLEX_WORD_MIN_LENGTH = 8;
const SENTENCE_COUNT_LOW = 1;
const SENTENCE_COUNT_HIGH = 4;
const MIN_WORDS_FOR_CONFIDENT_ESTIMATE = 8;

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export interface DifficultyEstimateInput {
  readonly prompt: string;
  readonly stimulusBody?: string | undefined;
  readonly optionTexts: readonly string[];
  readonly explanation?: string | undefined;
}

export interface DifficultyEstimate {
  readonly estimatedDifficulty: DifficultyBand;
  readonly estimateConfidence: number;
  readonly signals: DifficultySignals;
}

function stripToAlphanumeric(word: string): string {
  return word.replace(/[^\p{L}\p{N}]/gu, "");
}

function extractWords(input: DifficultyEstimateInput): readonly string[] {
  const comparableText = [input.prompt, input.stimulusBody, ...input.optionTexts]
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(" ");
  return comparableText
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

function countExplanationSentences(explanation: string | undefined): number {
  if (explanation === undefined) return 0;
  return explanation
    .split(/[.!?]+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0).length;
}

/**
 * Deterministic, pure, side-effect free. `estimateConfidence` is a direct
 * function of `wordCount` alone (§4b): a candidate with fewer than 4
 * extractable words never reaches the 0.5 confidence floor, which is this
 * gate's testable "insufficient evidence" trigger.
 */
export function estimateDifficulty(input: DifficultyEstimateInput): DifficultyEstimate {
  const words = extractWords(input);
  const wordCount = words.length;

  const readingLoadScore = clamp01((wordCount - WORDS_LOW) / (WORDS_HIGH - WORDS_LOW));

  const strippedLengths = words.map((word) => stripToAlphanumeric(word).length);
  const avgWordLength = wordCount > 0 ? strippedLengths.reduce((sum, length) => sum + length, 0) / wordCount : 0;
  const avgLengthScore = clamp01((avgWordLength - AVG_WORD_LENGTH_LOW) / (AVG_WORD_LENGTH_HIGH - AVG_WORD_LENGTH_LOW));
  const complexWordFraction = wordCount > 0 ? strippedLengths.filter((length) => length >= COMPLEX_WORD_MIN_LENGTH).length / wordCount : 0;
  const vocabularyComplexityScore = (avgLengthScore + complexWordFraction) / 2;

  const sentenceCount = countExplanationSentences(input.explanation);
  const reasoningStepScore = clamp01((sentenceCount - SENTENCE_COUNT_LOW) / (SENTENCE_COUNT_HIGH - SENTENCE_COUNT_LOW));

  const difficultyScore = (readingLoadScore + vocabularyComplexityScore + reasoningStepScore) / 3;
  const bandIndex = difficultyScore < 1 / 3 ? 0 : difficultyScore < 2 / 3 ? 1 : 2;
  const estimatedDifficulty = DIFFICULTY_BANDS[bandIndex];

  const estimateConfidence = clamp01(wordCount / MIN_WORDS_FOR_CONFIDENT_ESTIMATE);

  return {
    estimatedDifficulty,
    estimateConfidence,
    signals: { wordCount, readingLoadScore, vocabularyComplexityScore, reasoningStepScore },
  };
}

export function bandIndex(band: DifficultyBand): number {
  return DIFFICULTY_BANDS.indexOf(band);
}

/** `|estimatedBandIndex - declaredBandIndex| / 2` — 0 = same band, 1 = maximally distant (`easy` vs `challenging`). */
export function computeDifficultyDeviation(estimated: DifficultyBand, declared: DifficultyBand): number {
  return Math.abs(bandIndex(estimated) - bandIndex(declared)) / 2;
}
