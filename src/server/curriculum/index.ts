import "server-only";

export {
  PostgresCurriculumCatalogue,
  type CoverageResolver,
  type PostgresCurriculumCatalogueOptions,
} from "./postgres-catalogue";
export {
  createGatedPracticeCoverageResolver,
  extractQuestionIdsFromAlignments,
  gatedPracticeCoverageResolver,
  type GatedPracticeCoverageResolverFn,
  type GatedPracticeCoverageResolverOptions,
} from "./gated-practice-coverage";
export {
  CurriculumImportError,
  importCurriculumManifest,
  type CurriculumImportReport,
  type ImportMode,
  type ImportOptions,
} from "./importer";
export {
  curriculumImportManifestSchema,
  type CurriculumImportManifest,
} from "./manifest-schema";
export {
  SYNTHETIC_CONFLICTING_MANIFEST,
  SYNTHETIC_DISPLAY_LICENSED_MANIFEST,
  SYNTHETIC_NATIONAL_MANIFEST,
  SYNTHETIC_STORE_ONLY_MANIFEST,
  SYNTHETIC_VIC_MANIFEST,
} from "./synthetic-manifests";
