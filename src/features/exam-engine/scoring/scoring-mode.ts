/**
 * Which AssessmentScoringService submitExam selects — the one runtime
 * switch the Phase 0 addendum in docs/ASSESSMENT_SECURITY_MODEL.md calls
 * for. AuthProvider keeps it in sync with auth state: signed-in students
 * get server-authoritative scoring, everyone else (guests above all)
 * keeps local practice scoring exactly as before. Module state rather
 * than store state: the exam UI never renders differently because of it,
 * so it has no business in the reactive tree.
 */
export type ScoringMode = "local_practice" | "server_authoritative";

let mode: ScoringMode = "local_practice";

export function setScoringMode(next: ScoringMode): void {
  mode = next;
}

export function getScoringMode(): ScoringMode {
  return mode;
}
