import type { SubjectRow } from "./programme-status";

/**
 * The badge on a programme detail page, from the same subject rows the page lists below it (which come from pattern
 * readiness). It used to say "Available for Years 3 and 5" for every family, including ICAS-style while no ICAS item was
 * approved (MT-001).
 */
export function openBadge(years: ReadonlyArray<{ readonly year: number; readonly subjects: readonly SubjectRow[] }>): string {
  const open = years.filter((entry) => entry.subjects.some((subject) => subject.status === "available")).map((entry) => entry.year);
  if (open.length === 0) return "Not open yet — questions are still being reviewed";
  const label = open.length === 1 ? `Year ${open[0]}` : `Years ${open.slice(0, -1).join(", ")} and ${open[open.length - 1]}`;
  const everySubject = years.every((entry) => entry.subjects.every((subject) => subject.status === "available"));
  return everySubject ? `Open for ${label}` : `Some subjects open for ${label}`;
}
