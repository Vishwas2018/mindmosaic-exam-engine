import Link from "next/link";

import { SUBJECT_LABELS } from "@/features/exam-engine/components/describe-config";
import type { StudioAvailability } from "@/features/practice-studio/availability";

const STYLES = [
  { style: "naplan_style", label: "NAPLAN-style" },
  { style: "icas_style", label: "ICAS-style" },
] as const;

/**
 * Pathways come from PROGRAMS + resolveProgramStatuses via the Practice Studio
 * availability module, never from route existence. Two distinct empty states
 * never share wording: "no practice available" (a real zero) and "we couldn't
 * check" (the check failed). The second shows nothing countable at all.
 * Nothing here says questions are checked, reviewed or approved.
 */
export function MySpacePathways({
  availability,
  yearLevel,
}: {
  availability: StudioAvailability;
  yearLevel: 3 | 5;
}) {
  const forYear = availability.subjects.filter((s) => s.yearLevel === yearLevel);
  const unchecked = forYear.some((s) => s.state === "unknown");
  const groups = STYLES.map(({ style, label }) => ({
    style,
    label,
    subjects: forYear.filter((s) => s.examStyle === style && s.state === "ready"),
  })).filter((group) => group.subjects.length > 0);

  return (
    <section aria-labelledby="my-space-pathways" className="space-y-3">
      <h2 id="my-space-pathways" className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-mm-ink">
        Year {yearLevel} practice you can start
      </h2>
      {unchecked ? (
        <p role="status" className="rounded-2xl border border-mm-line bg-white p-5 text-sm text-mm-muted">
          We couldn&rsquo;t check what practice is available right now. Please try again in a little while.
        </p>
      ) : groups.length === 0 ? (
        <p className="rounded-2xl border border-mm-line bg-white p-5 text-sm text-mm-muted">
          There is no practice available for Year {yearLevel} yet.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((group) => (
            <div key={group.style} className="rounded-2xl border border-mm-line bg-white p-5 shadow-xs">
              <h3 className="font-[family-name:var(--font-display)] text-base font-bold text-mm-ink">{group.label}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {group.subjects.map((s) => (
                  <li key={s.subject}>
                    <Link
                      href="/student/practice"
                      className="inline-flex min-h-11 items-center rounded-btn border border-mm-line bg-mm-tint-soft px-4 text-sm font-semibold text-primary hover:bg-mm-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {SUBJECT_LABELS[s.subject]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
