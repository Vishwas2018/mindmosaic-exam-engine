export {
  ADAPTATIONS,
  adaptationSchema,
  examPatternBasisSchema,
  examPatternPresentationSchema,
  examPatternSchema,
  examPatternStatusSchema,
  hasVisibleSections,
  matchesStrandFilter,
  matchesTypeFilter,
  patternSectionOrderSchema,
  patternSourceSchema,
  sourcesForSection,
  sourcesInSittingOrder,
  stimulusRuleSchema,
} from "./exam-pattern";
export type {
  Adaptation,
  ExamPattern,
  ExamPatternBasis,
  ExamPatternPresentation,
  ExamPatternStatus,
  PatternSectionOrder,
  PatternSource,
  StimulusRule,
} from "./exam-pattern";
export {
  EXAM_PATTERNS,
  STARTABLE_EXAM_PATTERNS,
  getExamPattern,
  groupExamPatterns,
} from "./exam-pattern-registry";
export type { ExamPatternGroup, ExamPatternYearGroup } from "./exam-pattern-registry";
export { MAX_FORMS, formIndexes, formOfUnit, unitsInForm } from "./form-partition";
export { packBestEffort, packExact } from "./pack-units";
export type { PackBounds } from "./pack-units";
export { parseProgrammeId, requireProgrammeScope } from "./programme-id";
export type { ProgrammeScope } from "./programme-id";
export { buildAllPatternReadiness, buildPatternReadiness } from "./pattern-readiness";
export type {
  PatternReadiness,
  PatternReadinessMap,
  PatternReadinessState,
  SourceReadiness,
} from "./pattern-readiness";
export {
  ADAPTATION_COPY,
  describePaperShape,
  patternExamConfig,
  patternSittingLabel,
  patternSubjectFilter,
  reducedModuleMinutes,
  sessionDurationSeconds,
} from "./pattern-session";
export {
  selectPatternQuestions,
  selectSourceQuestions,
  sourcePool,
} from "./select-pattern-questions";
export type {
  PatternSelectionResult,
  SelectPatternOptions,
  SourceSelection,
} from "./select-pattern-questions";
export {
  buildSelectionUnits,
  stimulusGroupKey,
  unitQuestionCount,
} from "./selection-units";
export type { SelectionUnit } from "./selection-units";
