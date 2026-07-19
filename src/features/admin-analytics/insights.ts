import { masteryPct } from "./item-statistics";
import type {
  DimensionPerformance,
  Insight,
  QuestionIntelligenceRow,
  UnattemptedQuestion,
} from "./types";

/**
 * Derives the "Insights" feeds for both admin screens from aggregate rows.
 * Pure functions: given the same aggregates they always produce the same
 * insights, so the thresholds are testable and the screens stay free of
 * ad hoc analysis logic.
 */

/** Subjects at or below this mastery deserve a content warning. */
const WEAK_MASTERY_PCT = 55;

/** Subjects at or above this mastery are called out as strengths. */
const STRONG_MASTERY_PCT = 75;

/** A strand with fewer attempted questions than this is a coverage gap. */
const THIN_COVERAGE_QUESTION_COUNT = 5;

function formatCount(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

/** Content-intelligence insights: item quality and coverage, no student data. */
export function deriveContentInsights(
  rows: readonly QuestionIntelligenceRow[],
  unattempted: readonly UnattemptedQuestion[],
): Insight[] {
  const insights: Insight[] = [];

  const tooEasy = rows.filter((row) => row.health === "too_easy");
  if (tooEasy.length > 0) {
    insights.push({
      tone: "warn",
      title: `${formatCount(tooEasy.length, "question")} may be too easy`,
      body: `${tooEasy
        .slice(0, 3)
        .map((row) => row.questionId)
        .join(", ")}${tooEasy.length > 3 ? " and others" : ""} are answered correctly in 90%+ of deliveries, so they add little assessment signal.`,
      action: "Review difficulty labels or retire the weakest items",
    });
  }

  const tooHard = rows.filter((row) => row.health === "too_hard");
  if (tooHard.length > 0) {
    insights.push({
      tone: "bad",
      title: `${formatCount(tooHard.length, "question")} may be too hard or unclear`,
      body: `${tooHard
        .slice(0, 3)
        .map((row) => row.questionId)
        .join(", ")}${tooHard.length > 3 ? " and others" : ""} fall below 40% accuracy. Low accuracy with low discrimination can also indicate an ambiguous prompt or a miskeyed answer.`,
      action: "Check wording and answer keys before assuming difficulty",
    });
  }

  const lowDisc = rows.filter((row) => row.health === "low_discrimination");
  if (lowDisc.length > 0) {
    insights.push({
      tone: "warn",
      title: `${formatCount(lowDisc.length, "question")} with low discrimination`,
      body: "These items barely separate high-scoring attempts from low-scoring ones, which weakens what the exam measures.",
      action: "Revise distractors or replace the items",
    });
  }

  const thinStrands = new Map<string, number>();
  for (const row of rows) {
    thinStrands.set(row.strand, (thinStrands.get(row.strand) ?? 0) + 1);
  }
  for (const [strand, count] of thinStrands) {
    if (count < THIN_COVERAGE_QUESTION_COUNT) {
      insights.push({
        tone: "warn",
        title: `${strand} has thin live coverage`,
        body: `Only ${formatCount(count, "attempted question")} in this strand — too few to assess it reliably.`,
        action: `Author more ${strand} questions across difficulty levels`,
      });
    }
  }

  if (unattempted.length > 0) {
    insights.push({
      tone: "good",
      title: `${formatCount(unattempted.length, "bank question")} not yet delivered`,
      body: "These authored questions have never appeared in a submitted attempt, so they carry no statistics yet.",
      action: "No action needed — statistics accrue as they are delivered",
    });
  }

  if (insights.length === 0) {
    insights.push({
      tone: "good",
      title: "No content issues detected",
      body: "Every question with enough attempts sits inside the healthy accuracy and discrimination thresholds.",
      action: "Keep monitoring as attempt volume grows",
    });
  }

  return insights;
}

/** Platform-analytics insights over subject-level aggregate performance. */
export function derivePerformanceInsights(
  subjects: readonly DimensionPerformance[],
): Insight[] {
  const insights: Insight[] = [];

  for (const subject of subjects) {
    const mastery = masteryPct(subject);
    if (mastery === null) continue;
    if (mastery <= WEAK_MASTERY_PCT) {
      insights.push({
        tone: "bad",
        title: `${subject.name} mastery is ${mastery}%`,
        body: `Across ${formatCount(subject.attempts, "attempt")}, students earn ${mastery}% of available ${subject.name} marks — the weakest aggregate area.`,
        action: `Prioritise ${subject.name} content and practice volume`,
      });
    } else if (mastery >= STRONG_MASTERY_PCT) {
      insights.push({
        tone: "good",
        title: `${subject.name} is a strength at ${mastery}%`,
        body: `Aggregate mastery across ${formatCount(subject.attempts, "attempt")} is comfortably above target.`,
        action: "Use as the benchmark for weaker subjects",
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      tone: "good",
      title: "Performance is even across subjects",
      body: "No subject stands out as unusually weak or strong at aggregate level.",
      action: "No action needed",
    });
  }

  return insights;
}
