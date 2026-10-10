import { Circle, Square, Triangle } from "lucide-react";

import { ConceptCaption, PlannedBadge, StudentHeader } from "./chrome";

const SECTIONS = ["Reading comprehension", "Quantitative reasoning", "Abstract reasoning", "Writing"] as const;
const ACTIVE = 2;

type Cell = { shape: "circle" | "square" | "triangle"; count: number } | null;

/** The 3 x 3 pattern grid; `null` is the missing cell. */
const GRID: ReadonlyArray<ReadonlyArray<Cell>> = [
  [{ shape: "circle", count: 1 }, { shape: "circle", count: 2 }, { shape: "circle", count: 3 }],
  [{ shape: "square", count: 1 }, { shape: "square", count: 2 }, { shape: "square", count: 3 }],
  [{ shape: "triangle", count: 1 }, { shape: "triangle", count: 2 }, null],
];
const ICON = { circle: Circle, square: Square, triangle: Triangle } as const;

function GridCell({ cell }: { cell: Cell }) {
  if (!cell) {
    return (
      <div className="grid h-[78px] place-items-center rounded-xl border-2 border-dashed border-primary/45 text-[22px] font-extrabold text-primary">
        ?
      </div>
    );
  }
  const Icon = ICON[cell.shape];
  return (
    <div className="flex h-[78px] items-center justify-center gap-1.5 rounded-xl border border-parchment-border bg-white">
      {Array.from({ length: cell.count }, (_, index) => (
        <Icon key={index} className="h-6 w-6 text-primary" strokeWidth={2.4} aria-hidden="true" />
      ))}
    </div>
  );
}

/**
 * Illustrative concept: an entry-test practice sitting, section by section. No scores, percentiles or dates are
 * shown, because none exist; the sections are common shapes of selective-entry tests, and which apply varies.
 */
export function SelectivePreview() {
  return (
    <div className="flex h-full flex-col bg-page">
      <StudentHeader active="practice" />
      <div className="flex shrink-0 items-center justify-between gap-3 px-6 pt-4">
        <p className="m-0 font-vietnam text-[12px] font-semibold uppercase tracking-wider text-plum-muted">
          Practice / Selective &amp; scholarships
        </p>
        <PlannedBadge programme="Selective" />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[210px_minmax(0,1fr)] gap-4 px-6 py-4">
        <aside className="flex min-h-0 flex-col gap-2.5 overflow-hidden">
          <p className="m-0 font-jakarta text-[13px] font-extrabold uppercase tracking-wider text-plum-muted">Test sections</p>
          {SECTIONS.map((section, index) => (
            <div
              key={section}
              className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 ${
                index === ACTIVE ? "border-primary bg-primary-tint shadow-warm-sm" : "border-parchment-border bg-white"
              }`}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12.5px] font-extrabold ${
                  index === ACTIVE ? "bg-primary text-white" : "bg-surface-container-high text-plum-muted"
                }`}
              >
                {index + 1}
              </span>
              <span className="font-jakarta text-[13px] font-bold leading-tight text-plum-dark">{section}</span>
            </div>
          ))}
          <p className="m-0 mt-1 rounded-2xl border border-dashed border-primary/30 bg-primary-tint/40 p-3 font-vietnam text-[12px] leading-snug text-plum-muted">
            Which sections apply varies from test to test.
          </p>
        </aside>
        <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-royal/10 bg-white shadow-[0_18px_50px_rgba(49,32,86,0.09)]">
          <div className="flex shrink-0 items-center justify-between border-b border-primary/8 bg-[linear-gradient(110deg,#FFFFFF_0%,#F7F4FF_100%)] px-6 py-4">
            <div>
              <p className="m-0 text-[12.5px] font-extrabold uppercase tracking-[0.1em] text-primary">Section 3 · Abstract reasoning</p>
              <p className="m-0 mt-1 text-[12.5px] font-semibold text-plum-muted">Practice sitting · timed by section</p>
            </div>
            <span className="rounded-full bg-primary-tint px-3 py-1 text-[12px] font-bold text-primary">Review before submit</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 py-5">
            <p className="m-0 font-jakarta text-[16px] font-bold leading-snug text-plum-dark">Which choice completes the pattern?</p>
            <div className="grid grid-cols-3 gap-2.5">
              {GRID.flatMap((row, r) => row.map((cell, c) => <GridCell key={`${r}${c}`} cell={cell} />))}
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {[1, 2, 3, 4].map((count, index) => (
                <div key={count} className="flex min-h-12 items-center gap-2.5 rounded-xl border border-royal/15 bg-white px-3 py-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-page text-[13px] font-bold text-muted">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex gap-0.5">
                    {Array.from({ length: count }, (_, i) => (
                      <Triangle key={i} className="h-3.5 w-3.5 text-primary" strokeWidth={2.4} aria-hidden="true" />
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <ConceptCaption>Selective &amp; scholarships · in development</ConceptCaption>
    </div>
  );
}
