import "server-only";

import { PROGRAMS } from "@/features/catalogue/catalogue";
import {
  buildStudioAvailability,
  type StudioAvailability,
  type StudioProgramme,
} from "@/features/practice-studio/availability";
import { resolveProgramStatuses } from "@/features/taxonomy/coverage";
import { getExamBank } from "./exam-bank";
import { getPublicationEligibility } from "./publication-evidence";

/**
 * Styles Practice Studio may surface. AMC-style is held back on purpose (C9): its 53 questions sit
 * behind a coming-soon programme that would be promoted automatically once it clears the catalogue
 * threshold, and surfacing it is a separate decision. Scholarship-style is only ever sat as a whole
 * named paper.
 */
const SURFACED_STYLES: ReadonlySet<StudioProgramme["examStyle"]> = new Set(["naplan_style", "icas_style"]);

/** Only the years MindMosaic serves. No cells for years 2, 4 or 6-12 (D4, clarified). */
const SURFACED_YEARS: ReadonlySet<StudioProgramme["yearLevel"]> = new Set([3, 5]);

/**
 * Feeds the pure availability module from the served bank.
 *
 * Programme availability is PROGRAMS + resolveProgramStatuses, never route
 * existence. Only scoped programmes in SURFACED_STYLES and SURFACED_YEARS are surfaced: that
 * excludes the unscoped "Mixed practice" entry, AMC-style, scholarship-style and every year
 * other than 3 and 5.
 *
 * "Couldn't check" is any error path: a throw, a publication-integrity problem
 * or missing evidence (`servedBank()` itself returns an empty bank for the
 * latter, so integrity is read first and the emptiness is never taken at face
 * value). A successful read that returns zero is "no content available".
 *
 * Returns counts only: no question content, no answer keys, so a server
 * component may pass the result to the client.
 */
export function getStudioAvailability(): StudioAvailability {
  const programmes: StudioProgramme[] = resolveProgramStatuses(PROGRAMS).flatMap((program) =>
    program.scope &&
    SURFACED_STYLES.has(program.scope.examStyle) &&
    SURFACED_YEARS.has(program.scope.yearLevel)
      ? [{
          yearLevel: program.scope.yearLevel,
          examStyle: program.scope.examStyle,
          subject: program.scope.subject,
          status: program.status,
        }]
      : [],
  );
  try {
    const integrity = getPublicationEligibility().problems.length ? "unknown" : "ok";
    return buildStudioAvailability({ bank: getExamBank("practice"), integrity, programmes });
  } catch {
    return buildStudioAvailability({ bank: [], integrity: "unknown", programmes });
  }
}
