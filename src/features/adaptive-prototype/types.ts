import type { ExamStyle, Question, YearLevel } from "@/schemas/question.schema";
import type { SubjectFilter } from "@/features/exam-engine/selection";
import type { DifficultyBand } from "@/features/taxonomy/capacity-report";

export type { DifficultyBand };

/** The (family, year, subject) a session draws its testlets from. Matches
    filterEligibleQuestions()'s own config shape (spike, not a session model). */
export interface ContentScope {
  readonly examStyle: ExamStyle;
  readonly yearLevel: YearLevel;
  readonly subject: Exclude<SubjectFilter, "mixed">;
}

/**
 * The two open thresholds strategy doc §16 leaves for ADR-1. `routeUpAt` and
 * `routeDownAt` are read against a 0-1 running proportion-correct.
 * `routeDownAt` MUST be strictly less than `routeUpAt`, or the band between
 * them collapses and "medium" can never be routed to.
 */
export interface RoutingThresholds {
  readonly routeUpAt: number;
  readonly routeDownAt: number;
}

/**
 * A scripted mock student: given the 1-based stage number, the item's
 * 0-based position within that stage, and the item itself, decides whether
 * this answer is correct. No real scoring, no answer-key comparison — the
 * whole point of a mock is that the router only ever sees the boolean this
 * function returns.
 */
export type AnswerStrategy = (
  stageNumber: 1 | 2 | 3,
  itemIndex: number,
  item: Question,
) => boolean;

export interface StageItemOutcome {
  readonly id: string;
  readonly difficulty: DifficultyBand;
  readonly correct: boolean;
}

export interface StageOutcome {
  readonly stage: 1 | 2 | 3;
  readonly band: DifficultyBand;
  /** How many items this stage asked for (== itemsPerStage). */
  readonly requested: number;
  readonly served: readonly StageItemOutcome[];
  /** True when `served.length < requested` — the band's pool was too thin. */
  readonly degraded: boolean;
  readonly stageCorrect: number;
  /** `stageCorrect / served.length`, or 0 if nothing was served. */
  readonly stageScore: number;
  readonly runningCorrect: number;
  readonly runningTotal: number;
  /** `runningCorrect / runningTotal`, or 0 if nothing has been served yet. */
  readonly runningScore: number;
}

export interface AdaptiveSessionParams {
  readonly scope: ContentScope;
  readonly itemsPerStage: number;
  readonly thresholds: RoutingThresholds;
  /** Deterministic seed for item shuffling — same seed, same path. */
  readonly seed: string;
  readonly answerStrategy: AnswerStrategy;
}

export interface AdaptiveSessionResult {
  readonly scope: ContentScope;
  readonly itemsPerStage: number;
  readonly thresholds: RoutingThresholds;
  readonly seed: string;
  readonly stages: readonly StageOutcome[];
  readonly finalScore: number;
}
