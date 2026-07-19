/**
 * Small, pure display formatters shared by the teacher views. Kept out of
 * the components so the pages (server components) and any client widgets
 * format identically.
 */

const shortDate = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatShortDate(iso: string | null): string {
  if (!iso) return "—";
  const parsed = Date.parse(iso);
  return Number.isNaN(parsed) ? "—" : shortDate.format(parsed);
}

export function formatLastActive(iso: string | null, now: number = Date.now()): string {
  if (!iso) return "No activity";
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return "No activity";
  const days = Math.floor((now - parsed) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return shortDate.format(parsed);
}

/**
 * Whether a due date has passed. Lives here (not inline in a component)
 * so the clock read stays out of render, mirroring formatLastActive.
 */
export function isPastDue(dueAtIso: string | null, now: number = Date.now()): boolean {
  if (!dueAtIso) return false;
  const parsed = Date.parse(dueAtIso);
  return !Number.isNaN(parsed) && parsed < now;
}

export function formatTimeSpent(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0 min";
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${(minutes / 60).toFixed(1)} h`;
}
