import { BookOpen } from "lucide-react";
import type { LearningAreaPathwayGroup } from "../types";
import { LessonPathwayList } from "./LessonPathwayList";

interface CurriculumPathwaysPanelProps {
  yearLevel: number | null;
  learningAreas: readonly LearningAreaPathwayGroup[];
}

function EmptyPathwaysNotice({ message }: { message: string }) {
  return (
    <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-mm-line bg-white px-6 py-12 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-mm-tint text-mm-brand">
        <BookOpen className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="max-w-md text-[14.5px] leading-relaxed text-mm-muted">{message}</p>
    </div>
  );
}

/**
 * Renders every strand pathway for a student's real yearLevel, grouped by
 * learning area (Mathematics, English). Fails honestly instead of ever
 * substituting another year's content: a missing yearLevel or a yearLevel
 * with no authored pathways yet both render an explanatory empty state.
 */
export function CurriculumPathwaysPanel({ yearLevel, learningAreas }: CurriculumPathwaysPanelProps) {
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
    <div className="grid gap-8">
      {learningAreas.map((area) => (
        <div key={area.learningArea} className="grid gap-4">
          <h3 className="text-[19px] font-bold text-mm-ink">{area.learningArea}</h3>
          <div className="grid gap-6">
            {area.pathways.map((pathway) => (
              <LessonPathwayList key={pathway.strand} pathway={pathway} previewMode={false} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
