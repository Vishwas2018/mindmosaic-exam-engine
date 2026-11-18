import type { ExamPattern } from "./exam-pattern";
import type { PatternReadinessMap } from "./pattern-readiness";

/**
 * A full-length paper the picker does not list because its practice module already stands for it.
 *
 * Where the reviewed pool cannot fill a full-length paper (state `short`) and a practice module draws on the same
 * programme, the two would otherwise be listed side by side as identical shorter sittings with the same question count
 * (MT-005). The module is the one honest listing: it is badged "Practice module — not a full-length paper". The
 * withheld full paper is reported separately so the page can say plainly that it is not open yet and why.
 */
export interface WithheldFullPaper {
  readonly pattern: ExamPattern;
  readonly availableCount: number;
  readonly requestedCount: number;
}

export interface PatternListing {
  readonly shown: readonly ExamPattern[];
  readonly withheldFull: readonly WithheldFullPaper[];
}

function sameProgramme(a: ExamPattern, b: ExamPattern): boolean {
  return (
    a.examStyle === b.examStyle &&
    a.yearLevel === b.yearLevel &&
    a.sources[0]?.programmeId === b.sources[0]?.programmeId
  );
}

export function listPatternsForPicker(
  patterns: readonly ExamPattern[],
  readiness: PatternReadinessMap,
): PatternListing {
  const withheldFull: WithheldFullPaper[] = [];
  const shown = patterns.filter((pattern) => {
    if (pattern.presentation !== "full_length_practice") return true;
    const state = readiness[pattern.id];
    if (state?.state !== "short") return true;
    const hasModuleSibling = patterns.some(
      (other) =>
        other.presentation === "practice_module" &&
        other.status === "available" &&
        sameProgramme(pattern, other) &&
        readiness[other.id]?.state !== "unavailable",
    );
    if (!hasModuleSibling) return true;
    withheldFull.push({
      pattern,
      availableCount: state.availableCount,
      requestedCount: state.requestedCount,
    });
    return false;
  });
  return { shown, withheldFull };
}
