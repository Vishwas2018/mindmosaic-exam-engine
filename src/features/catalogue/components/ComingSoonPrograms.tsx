import { Lock } from "lucide-react";

import type { Program } from "../catalogue";
import { SUBJECT_LABELS } from "../filter-state";
import { examStyleLabel } from "../presentation";

/**
 * Planned programs — a roadmap, kept to roadmap weight.
 *
 * This section used to render every planned entry as its own card. Once the
 * Year 1-12 expansion cells landed that was ~40 cards, and the roadmap took
 * up more of the page than the twelve programs a student can actually sit
 * today. The named pathways (the three competitions) still read as distinct
 * products, because they are; the expansion cells collapse into one row per
 * year level, which is the axis anyone scanning them cares about.
 *
 * Nothing here is interactive and nothing pretends to be: no link, no
 * button, no hover state. Unavailability is stated in words at the top of
 * the section rather than implied by a faded card.
 */
export function ComingSoonPrograms({ programs }: { programs: readonly Program[] }) {
  if (programs.length === 0) return null;

  const named = programs.filter((program) => program.scope === undefined);

  /*
   * Year -> assessment style -> the subjects planned for that pair.
   *
   * Two levels rather than one flat list because the style prefix is the
   * repeated part: "ICAS-style Numeracy, ICAS-style Reading, ICAS-style
   * Language Conventions…" spends most of its width restating the same two
   * words, and on a phone that alone ran the roadmap to several screens.
   * Naming the style once per row leaves the chips carrying only what
   * differs.
   */
  const byYear = new Map<number, Map<string, { id: string; subject: string }[]>>();
  for (const program of programs) {
    const scope = program.scope;
    if (!scope) continue;
    const style = examStyleLabel(program);
    const subject = SUBJECT_LABELS[scope.subject] ?? scope.subject;
    const styles = byYear.get(scope.yearLevel) ?? new Map();
    byYear.set(scope.yearLevel, styles);
    const bucket = styles.get(style);
    if (bucket) bucket.push({ id: program.id, subject });
    else styles.set(style, [{ id: program.id, subject }]);
  }
  const years = [...byYear.entries()].sort(([a], [b]) => a - b);

  return (
    <section
      aria-labelledby="coming-soon-heading"
      className="rounded-[20px] border border-dashed border-mm-line-quiet bg-white/60 p-[clamp(20px,2.4vw,32px)]"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-mm-tint-quiet text-mm-quiet"
        >
          <Lock className="h-4 w-4" />
        </span>
        <h2
          id="coming-soon-heading"
          className="text-[clamp(20px,2vw,25px)] font-bold leading-tight text-mm-ink"
        >
          Planned programs
        </h2>
      </div>
      <p className="mt-2.5 max-w-[60ch] text-[15px] leading-[1.6] text-mm-muted">
        Not available to sit yet. These are what we are building next.
      </p>

      {named.length > 0 && (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {named.map((program) => (
            <li
              key={program.id}
              className="rounded-[14px] border border-mm-line bg-white p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[15px] font-bold leading-tight text-mm-ink">
                  {program.name}
                </h3>
                <span className="rounded-full bg-mm-surface-quiet px-2.5 py-1 text-[10.5px] font-bold uppercase leading-none tracking-[0.09em] text-mm-quiet">
                  Planned
                </span>
              </div>
              <p className="mt-2 text-[14px] leading-[1.55] text-mm-muted">{program.blurb}</p>
            </li>
          ))}
        </ul>
      )}

      {years.length > 0 && (
        <>
          <h3 className="mt-8 text-[11.5px] font-bold uppercase tracking-[0.1em] text-mm-muted">
            Year levels in the pipeline
          </h3>
          <dl className="mt-3 border-t border-mm-line-soft">
            {years.map(([year, styles]) => (
              <div
                key={year}
                className="grid gap-2 border-b border-mm-line-soft py-3 sm:grid-cols-[68px_minmax(0,1fr)] sm:gap-x-4"
              >
                <dt className="text-[13px] font-bold text-mm-ink">Year {year}</dt>
                <dd className="grid min-w-0 gap-2">
                  {[...styles.entries()].map(([style, items]) => (
                    <div key={style} className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
                      <span className="text-[10.5px] font-bold uppercase tracking-[0.09em] text-mm-quiet">
                        {style}
                      </span>
                      {items.map((item) => (
                        <span
                          key={item.id}
                          className="rounded-md border border-mm-line bg-mm-page px-2.5 py-1 text-[12.5px] font-medium leading-[1.4] text-mm-muted"
                        >
                          {item.subject}
                        </span>
                      ))}
                    </div>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </section>
  );
}
