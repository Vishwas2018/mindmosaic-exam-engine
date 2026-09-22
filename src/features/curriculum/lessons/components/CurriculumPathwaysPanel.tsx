import { BookOpen } from "lucide-react";
import type { LearningAreaPathwayGroup } from "../types";
import { CompactStrandCard } from "./CompactStrandCard";
import { LessonPathwayList } from "./LessonPathwayList";

interface CurriculumPathwaysPanelProps {
  yearLevel: number | null;
  learningAreas: readonly LearningAreaPathwayGroup[];
  selectedStrand?: string | null;
}

/** Full-detail treatment for the first N strands; the rest get a compact card. */
const DETAILED_STRAND_COUNT = 3;

function EmptyPathwaysNotice({ message }: { message: string }) {
  return (
    <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-parchment-border bg-white px-6 py-12 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-tint text-primary">
        <BookOpen className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="max-w-md font-vietnam text-[14.5px] leading-relaxed text-plum-muted">{message}</p>
    </div>
  );
}

/**
 * Renders every strand pathway for a student's real yearLevel, grouped by
 * learning area (Mathematics, English). Fails honestly instead of ever
 * substituting another year's content: a missing yearLevel or a yearLevel
 * with no authored pathways yet both render an explanatory empty state.
 */
export function CurriculumPathwaysPanel({
  yearLevel,
  learningAreas,
  selectedStrand = "all",
}: CurriculumPathwaysPanelProps) {
  if (yearLevel === null) {
    return (
      <EmptyPathwaysNotice message="We don't have a year level on file for your account yet, so we can't show your curriculum pathway. Ask a parent or teacher to add it in settings." />
    );
  }

  if (learningAreas.length === 0) {
    return (
      <EmptyPathwaysNotice
        message={`Year ${yearLevel} lessons haven't been published yet. Your pathway will appear here as soon as they are.`}
      />
    );
  }

  return (
    <div className="grid gap-10">
      {learningAreas.map((area) => {
        const isFiltered = Boolean(selectedStrand && selectedStrand !== "all");
        const pathwaysToRender = isFiltered
          ? area.pathways.filter((p) => p.strand === selectedStrand)
          : area.pathways;

        const detailed = isFiltered
          ? pathwaysToRender
          : pathwaysToRender.slice(0, DETAILED_STRAND_COUNT);
        const compact = isFiltered ? [] : pathwaysToRender.slice(DETAILED_STRAND_COUNT);

        return (
          <div key={area.learningArea} className="grid gap-5">
            <h3 className="font-jakarta text-xl font-bold text-plum-dark">{area.learningArea}</h3>
            <div className="grid gap-6">
              {detailed.map((pathway) => (
                <div key={pathway.strand} id={`strand-${pathway.strand}`}>
                  <LessonPathwayList pathway={pathway} previewMode={false} />
                </div>
              ))}
            </div>
            {compact.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {compact.map((pathway) => (
                  <div key={pathway.strand} id={`strand-${pathway.strand}`}>
                    <CompactStrandCard pathway={pathway} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
