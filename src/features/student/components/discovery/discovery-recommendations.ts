import type { AttemptSummary } from "../../attempt-summary";
import {
  getCurriculumPathwaysForYearLevel,
  type LessonPathwayNode,
} from "@/features/curriculum/lessons";

export interface StartHereProgress {
  /** e.g. "30 of 30 answered" or "Lesson 1 of 8" — always built from real counts. */
  completedLabel: string;
  completed: number;
  total: number;
  /** 0-100. For retry_attempt this is the real score; for curriculum_lesson, real completion-so-far. */
  percent: number;
  /** Real title of the next item in sequence, when one is genuinely known. */
  nextUp?: string;
}

export interface StartHereRecommendation {
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  actionLabel: string;
  href: string;
  source: "unfinished_session" | "retry_attempt" | "curriculum_lesson" | "default_activity";
  subjectSlug?: "numeracy" | "reading" | "language" | "science";
  metaChips: readonly string[];
  /** Real minutes-to-complete, only known for curriculum_lesson (LessonPathwayNode.estimatedMinutes). */
  estimatedMinutes?: number;
  /**
   * Only set for sources where real per-item progress exists
   * (retry_attempt's answered/total question counts, curriculum_lesson's
   * position within its pathway). Omitted for unfinished_session and
   * default_activity — there is no honest count to show there, so the
   * dashboard hero renders no progress widget rather than a fabricated one
   * (audit finding D-01).
   */
  progress?: StartHereProgress;
}

export interface NextForYouCard {
  id: string;
  tag: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  tone: "purple" | "coral" | "amber" | "teal";
  iconName: "book" | "refresh" | "sparkles" | "clock" | "calculator" | "target";
}

/**
 * Deterministically derives the primary Start Here activity card.
 *
 * Suggested Priority:
 * 1. genuine unfinished activity (if flagged by caller)
 * 2. recent activity suitable for retry (most recent attempt with missed questions / < 100%)
 * 3. deterministic next curriculum item for the student's year level
 * 4. default year-appropriate activity
 */
export function deriveStartHereItem({
  yearLevel,
  attempts,
  hasActiveSession = false,
}: {
  studentName?: string | null;
  yearLevel?: number | null;
  attempts: readonly AttemptSummary[];
  hasActiveSession?: boolean;
}): StartHereRecommendation {
  const effectiveYear = yearLevel === 5 ? 5 : 3;

  // 1. Unfinished session
  if (hasActiveSession) {
    return {
      tag: "CONTINUE SESSION",
      title: "Resume In-Progress Assessment",
      subtitle: "Pick up exactly where you left off",
      description: "You have an active session waiting. Jump back in to finish your responses and receive your full score report.",
      actionLabel: "Resume Session",
      href: "/exam",
      source: "unfinished_session",
      metaChips: ["In Progress", "Timed Session", "Autosaved"],
    };
  }

  // 2. Recent activity suitable for retry
  const lastAttempt = attempts[0];
  if (
    lastAttempt &&
    lastAttempt.scorePercent !== null &&
    lastAttempt.scorePercent < 100
  ) {
    const isNumeracy = lastAttempt.title.toLowerCase().includes("numeracy") || lastAttempt.subjectLabel.toLowerCase().includes("numeracy");
    const total = lastAttempt.totalQuestions ?? lastAttempt.attemptedQuestions;
    return {
      tag: "PRACTISE & IMPROVE",
      title: `Review & Practise: ${lastAttempt.title}`,
      subtitle: `Recent score: ${lastAttempt.scorePercent}% (${lastAttempt.attemptedQuestions}/${total} answered)`,
      description: "Strengthen your understanding by working through targeted practice questions on concepts from your recent session.",
      actionLabel: "Practise Again",
      href: "/practice",
      source: "retry_attempt",
      subjectSlug: isNumeracy ? "numeracy" : "reading",
      metaChips: [lastAttempt.subjectLabel, "Targeted Practice", "Self-Paced"],
      progress: {
        completedLabel: `${lastAttempt.attemptedQuestions} of ${total} answered`,
        completed: lastAttempt.attemptedQuestions,
        total,
        percent: lastAttempt.scorePercent,
      },
    };
  }

  // 3. Deterministic curriculum lesson for student's year level
  const pathways = getCurriculumPathwaysForYearLevel(effectiveYear);
  const firstPathway = pathways[0];
  const firstNode: LessonPathwayNode | undefined = firstPathway?.nodes[0];

  if (firstNode) {
    const total = firstPathway.nodes.length;
    const nextNode = firstPathway.nodes[1];
    return {
      tag: "CURRICULUM LESSON",
      title: `Year ${effectiveYear} Maths: ${firstNode.title}`,
      subtitle: `Australian & Victorian Curriculum · ${firstPathway.title}`,
      description: firstNode.learningIntention || "Master core concepts with step-by-step worked examples, key vocabulary, and checkpoint questions.",
      actionLabel: "Start Lesson",
      href: `/student/learn/lessons/${firstNode.curriculumCode}`,
      source: "curriculum_lesson",
      subjectSlug: "numeracy",
      metaChips: [`Year ${effectiveYear}`, "Mathematics", `${firstNode.estimatedMinutes ?? 15} mins`],
      estimatedMinutes: firstNode.estimatedMinutes,
      progress: {
        completedLabel: `Lesson 1 of ${total}`,
        completed: 0,
        total,
        percent: 0,
        nextUp: nextNode?.title,
      },
    };
  }

  // 4. Default year-appropriate activity
  return {
    tag: "START HERE",
    title: `Year ${effectiveYear} NAPLAN-style Practice`,
    subtitle: "Original numeracy and reading questions",
    description: "Begin with a friendly practice session designed specifically for Year 3 and Year 5 Australian curriculum standards.",
    actionLabel: "Start Practice",
    href: "/practice?style=naplan_style",
    source: "default_activity",
    subjectSlug: "numeracy",
    metaChips: [`Year ${effectiveYear}`, "Original Bank", "No Time Limit"],
  };
}

/**
 * Deterministically derives up to 3 adaptive quick-action cards for "Next for You".
 * Strictly derived from real attempt history and curriculum pathways.
 */
export function deriveNextForYouCards({
  yearLevel,
  attempts,
  hasActiveSession = false,
}: {
  yearLevel?: number | null;
  attempts: readonly AttemptSummary[];
  hasActiveSession?: boolean;
}): readonly NextForYouCard[] {
  const cards: NextForYouCard[] = [];
  const effectiveYear = yearLevel === 5 ? 5 : 3;

  // Card 1: Continue / Curriculum Next
  if (hasActiveSession) {
    cards.push({
      id: "active-session",
      tag: "IN PROGRESS",
      title: "Continue where you left off",
      description: "Resume your active assessment session with all saved answers.",
      actionLabel: "Resume Exam",
      href: "/exam",
      tone: "purple",
      iconName: "clock",
    });
  } else if (attempts.length > 0) {
    cards.push({
      id: "curriculum-next",
      tag: "CURRICULUM",
      title: "Explore Curriculum Lessons",
      description: `Structured Year ${effectiveYear} lessons with worked examples and checkpoints.`,
      actionLabel: "View Lessons",
      href: "/student/learn",
      tone: "purple",
      iconName: "book",
    });
  } else {
    cards.push({
      id: "start-curriculum",
      tag: "RECOMMENDED",
      title: "Start with Curriculum Lessons",
      description: `Step-by-step Year ${effectiveYear} lessons in Mathematics and English.`,
      actionLabel: "Start Learning",
      href: "/student/learn",
      tone: "purple",
      iconName: "book",
    });
  }

  // Card 2: Retry Missed / Practice Mode
  const lastAttemptWithErrors = attempts.find(
    (a) => a.scorePercent !== null && a.scorePercent < 100,
  );

  if (lastAttemptWithErrors) {
    cards.push({
      id: "retry-practice",
      tag: "TARGETED PRACTICE",
      title: "Practise what you missed",
      description: `Refine your skills following your recent ${lastAttemptWithErrors.title} session.`,
      actionLabel: "Practise Now",
      href: "/practice",
      tone: "coral",
      iconName: "refresh",
    });
  } else {
    cards.push({
      id: "naplan-pathway",
      tag: "EXAM FORMAT",
      title: "NAPLAN-style Practice",
      description: "Familiarise yourself with authentic question types and answer formats.",
      actionLabel: "Try NAPLAN",
      href: "/practice?style=naplan_style",
      tone: "amber",
      iconName: "target",
    });
  }

  // Card 3: Challenge / Quick Sprint
  cards.push({
    id: "quick-sprint",
    tag: "QUICK SESSION",
    title: "10-Minute Skill Sprint",
    description: "A fast, 10-question mixed practice set to build speed and confidence.",
    actionLabel: "Start Sprint",
    href: "/practice/mixed-practice",
    tone: "teal",
    iconName: "sparkles",
  });

  return Object.freeze(cards.slice(0, 3));
}
