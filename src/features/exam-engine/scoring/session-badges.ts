import type { ExamResult } from "./exam-report";

/**
 * Display-only "results page badges" (screen 14, v1). Derived purely from
 * this one just-finished session's ExamResult — the results page is
 * entirely client-store-driven with no server fetch and works for guests
 * as well as signed-in students (src/app/results/page.tsx), so badges here
 * cannot depend on cross-session history the way the full achievement
 * ladder on /student/engagement does (achievements.ts). Nothing here is
 * persisted; it is recomputed from the same result every render.
 */

export type SessionBadgeTone = "gold" | "purple" | "green";

export interface SessionBadge {
  id: string;
  label: string;
  tone: SessionBadgeTone;
}

export function computeSessionBadges(result: ExamResult): SessionBadge[] {
  const badges: SessionBadge[] = [];

  if (result.objectiveMarksAvailable > 0) {
    if (result.objectivePercentage === 100) {
      badges.push({ id: "perfect-score", label: "Perfect score", tone: "gold" });
    } else if (result.objectivePercentage >= 90) {
      badges.push({ id: "high-achiever", label: "High achiever", tone: "purple" });
    }
  }

  if (result.totalQuestions > 0 && result.unansweredCount === 0) {
    badges.push({ id: "full-attempt", label: "Every question attempted", tone: "green" });
  }

  return badges;
}
