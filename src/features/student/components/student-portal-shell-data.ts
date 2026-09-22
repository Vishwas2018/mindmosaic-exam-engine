import "server-only";

import { createClient } from "@/lib/supabase/server";
import { fetchActiveSitting } from "@/server/assessment/read-dispatch";

import { getCurriculumPathwaysForYearLevel, groupPathwaysByLearningArea, type LessonPathway } from "@/features/curriculum/lessons";
import type { StudentContext } from "@/features/student/require-student";
import { WEEKLY_SESSION_TARGET } from "@/features/student/engagement/achievements";
import { fetchEngagementAttempts } from "@/features/student/engagement/fetch-engagement";
import { computeStreakStats, countThisWeek, toDayKey, uniqueSortedDayKeys, weekDots, type WeekDot } from "@/features/student/engagement/streaks";

export interface StudentPortalShellData {
  mathematicsPathways: readonly LessonPathway[];
  weekDots: readonly WeekDot[];
  currentStreak: number;
  sessionsThisWeek: number;
  weeklyTarget: number;
  /** Real signal — see fetchActiveSitting. Drives the resume recommendation and the header's notification dot. */
  hasActiveSession: boolean;
}

/**
 * Everything the shared student sidebar/header (StudentPortalShell) needs,
 * factored out of the dashboard page so Learning Hub, Exam Centre, and My
 * Progress can render the identical real chrome without re-deriving it.
 */
export async function fetchStudentPortalShellData(student: StudentContext): Promise<StudentPortalShellData> {
  const engagementResult = await fetchEngagementAttempts(student.userId);
  const now = new Date();
  const today = toDayKey(now);
  const engagementAttempts = engagementResult.ok ? engagementResult.attempts : [];
  const attemptDayKeys = engagementAttempts.map((attempt) => toDayKey(new Date(attempt.submittedAt)));
  const dayKeys = uniqueSortedDayKeys(engagementAttempts.map((attempt) => new Date(attempt.submittedAt)));
  const streak = computeStreakStats(dayKeys, today);

  // Only curriculum Levels 3 & 5 are authored — same collapse convention deriveStartHereItem() uses.
  const effectiveYear = student.yearLevel === 5 ? 5 : 3;
  const pathwayGroups = groupPathwaysByLearningArea(getCurriculumPathwaysForYearLevel(effectiveYear));
  const mathematicsPathways = pathwayGroups.find((group) => group.learningArea === "Mathematics")?.pathways ?? [];

  const supabase = await createClient();
  const activeSitting = await fetchActiveSitting(supabase, student.userId);

  return {
    mathematicsPathways,
    weekDots: weekDots(dayKeys, today),
    currentStreak: streak.current,
    sessionsThisWeek: countThisWeek(attemptDayKeys, today),
    weeklyTarget: WEEKLY_SESSION_TARGET,
    hasActiveSession: activeSitting.kind === "ready",
  };
}
