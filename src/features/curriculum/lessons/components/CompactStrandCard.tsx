import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { LessonPathway } from "../types";

/**
 * A smaller, denser strand card for pathways beyond the first three shown in
 * full detail on the Learn hub — every lesson is still real and linkable,
 * just listed compactly rather than with the full banner treatment.
 */
export function CompactStrandCard({ pathway }: { pathway: LessonPathway }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-parchment-border bg-white p-5 shadow-warm-sm">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="font-vietnam text-[11px] font-bold uppercase tracking-wider text-plum-muted">
            {pathway.nodes.length} Lesson{pathway.nodes.length === 1 ? "" : "s"}
          </span>
        </div>
        <h3 className="font-jakarta text-lg font-bold text-plum-dark">{pathway.title}</h3>
        <p className="mt-1 font-vietnam text-xs leading-relaxed text-plum-muted">
          {pathway.description}
        </p>

        <div className="mt-3 grid gap-2">
          {pathway.nodes.map((node) => (
            <Link
              key={node.curriculumCode}
              href={`/student/learn/lessons/${node.curriculumCode}`}
              className="group flex min-w-0 items-center justify-between gap-2 rounded-xl border border-parchment-border bg-surface-container-low p-3 transition-colors hover:border-primary/40"
            >
              <span className="min-w-0">
                <span className="block font-mono text-[11px] font-semibold text-primary">
                  {node.curriculumCode} &middot;{" "}
                  <span className="inline-flex items-center gap-1 font-vietnam font-normal text-plum-muted">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {node.estimatedMinutes} min
                  </span>
                </span>
                <span className="block truncate font-vietnam text-sm font-semibold text-plum-dark">
                  {node.title}
                </span>
              </span>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
