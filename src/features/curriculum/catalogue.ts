import type {
  CurriculumCatalogueQuery,
  CurriculumCatalogueResult,
  CurriculumRelease,
} from "./contracts";

/**
 * Database-agnostic read boundary for UI and research branches. Implementations
 * may use Supabase, fixtures or an import snapshot; consumers receive only
 * validated curriculum contracts and never table/query-builder details.
 */
export interface CurriculumCatalogue {
  query(input: CurriculumCatalogueQuery): Promise<CurriculumCatalogueResult>;
  getRelease(releaseId: string): Promise<CurriculumRelease | null>;
}
