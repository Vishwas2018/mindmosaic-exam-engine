/**
 * Curriculum nodes whose assessed outcome must be demonstrated through live,
 * physical, or sustained classroom work rather than an auto-marked quiz.
 *
 * These lessons may teach the underlying concepts, but they must never bind
 * practice questions or present an online practice call to action.
 */
export const LEVEL_3_CLASSROOM_ONLY_NODES = Object.freeze([
  "VC2E3LA01", // Collaborative discussion conventions
  "VC2E3LE02", // Personal responses to literature
  "VC2E3LE05", // Sustained imaginative composition
  "VC2E3LY01", // Spoken interaction
  "VC2E3LY02", // Spoken delivery
  "VC2E3LY13", // Cursive handwriting
] as const);

export const LEVEL_5_CLASSROOM_ONLY_NODES = Object.freeze([
  "VC2E5LY01", // Live listening and spoken interaction
  "VC2E5LY02", // Live spoken and multimodal delivery
  "VC2E5LY12", // Fluent handwriting
] as const);

export const CLASSROOM_ONLY_CURRICULUM_CODES: ReadonlySet<string> = new Set([
  ...LEVEL_3_CLASSROOM_ONLY_NODES,
  ...LEVEL_5_CLASSROOM_ONLY_NODES,
]);

export function isClassroomOnlyCurriculumNode(curriculumCode: string): boolean {
  return CLASSROOM_ONLY_CURRICULUM_CODES.has(curriculumCode);
}
