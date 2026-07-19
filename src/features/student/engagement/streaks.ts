/**
 * Pure streak calculations over practice days. A "practice day" is any
 * local calendar day with at least one submitted exam attempt.
 *
 * Timezone note (documented assumption): day boundaries use the server's
 * local timezone. For this single-region product that matches the family's
 * clock closely enough for Phase 0; per-user timezones would need a
 * profile column that doesn't exist yet.
 */

/** Local-calendar "YYYY-MM-DD" key. */
export function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function keyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(key: string, days: number): string {
  const date = keyToDate(key);
  date.setDate(date.getDate() + days);
  return toDayKey(date);
}

export function uniqueSortedDayKeys(dates: readonly Date[]): string[] {
  return [...new Set(dates.map(toDayKey))].sort();
}

export interface StreakStats {
  /** Consecutive practice days ending today or yesterday; 0 otherwise. */
  current: number;
  /** Longest run of consecutive practice days ever. */
  best: number;
  practisedToday: boolean;
}

export function computeStreakStats(
  dayKeys: readonly string[],
  today: string,
): StreakStats {
  const days = new Set(dayKeys);
  let best = 0;
  for (const day of days) {
    if (days.has(addDays(day, -1))) continue; // not a run start
    let length = 1;
    while (days.has(addDays(day, length))) length += 1;
    best = Math.max(best, length);
  }

  /* Current streak: anchored to today if practised today, else to
     yesterday — a streak isn't broken until a full day is missed. */
  const practisedToday = days.has(today);
  const anchor = practisedToday ? today : addDays(today, -1);
  let current = 0;
  let cursor = anchor;
  while (days.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { current, best, practisedToday };
}

/**
 * First day on which a run of `target` consecutive practice days was
 * completed, or null if it never happened. Used to date streak
 * achievements retroactively from attempt history.
 */
export function streakReachedOn(
  dayKeys: readonly string[],
  target: number,
): string | null {
  if (target < 1) return null;
  const days = new Set(dayKeys);
  let earliest: string | null = null;
  for (const day of days) {
    if (days.has(addDays(day, -1))) continue;
    let length = 1;
    let cursor = day;
    while (days.has(addDays(cursor, 1))) {
      cursor = addDays(cursor, 1);
      length += 1;
      if (length === target) break;
    }
    if (length >= target && (earliest === null || cursor < earliest)) {
      earliest = cursor;
    }
  }
  return earliest;
}

export type WeekDotState = "done" | "today_done" | "today_pending" | "missed" | "future";

export interface WeekDot {
  /** Single-letter weekday label, Monday first. */
  label: string;
  dayKey: string;
  state: WeekDotState;
}

const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

/** Monday-start week containing `today`, with practice state per day. */
export function weekDots(
  dayKeys: readonly string[],
  today: string,
): WeekDot[] {
  const days = new Set(dayKeys);
  const todayDate = keyToDate(today);
  /* getDay(): Sunday 0 … Saturday 6 → offset back to Monday. */
  const mondayOffset = (todayDate.getDay() + 6) % 7;
  const monday = addDays(today, -mondayOffset);

  return WEEK_LABELS.map((label, index) => {
    const dayKey = addDays(monday, index);
    let state: WeekDotState;
    if (dayKey === today) {
      state = days.has(dayKey) ? "today_done" : "today_pending";
    } else if (dayKey > today) {
      state = "future";
    } else {
      state = days.has(dayKey) ? "done" : "missed";
    }
    return { label, dayKey, state };
  });
}

/** Attempts submitted in the Monday-start week containing `today`. */
export function countThisWeek(
  attemptDayKeysWithDuplicates: readonly string[],
  today: string,
): number {
  const todayDate = keyToDate(today);
  const monday = addDays(today, -((todayDate.getDay() + 6) % 7));
  const nextMonday = addDays(monday, 7);
  return attemptDayKeysWithDuplicates.filter(
    (key) => key >= monday && key < nextMonday,
  ).length;
}
