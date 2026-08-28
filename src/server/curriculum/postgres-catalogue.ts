import "server-only";

import type { Client, Pool, PoolClient } from "pg";
import { Client as PgClient } from "pg";
import { z } from "zod";

import {
  CURRICULUM_NODE_KINDS,
  type CurriculumCatalogue,
  type CurriculumCatalogueItem,
  type CurriculumCatalogueQuery,
  type CurriculumCatalogueResult,
  type CurriculumCoverage,
  type CurriculumRelation,
  type CurriculumRelease,
  curriculumCatalogueItemSchema,
  curriculumCatalogueQuerySchema,
  curriculumCatalogueResultSchema,
  curriculumReleaseSchema,
} from "@/features/curriculum";

export type CoverageResolver = (
  nodeId: string,
  alignments: readonly unknown[],
) => Promise<CurriculumCoverage> | CurriculumCoverage;

export interface PostgresCurriculumCatalogueOptions {
  connectionString?: string;
  client?: Client | Pool | PoolClient;
  coverageResolver?: CoverageResolver;
}

interface CursorData {
  sortOrder: number;
  nodeKey: string;
  id: string;
}

interface RowApplicability {
  id: string;
  node_id: string;
  release_id: string;
  jurisdiction_code: "AU" | "ACT" | "NSW" | "NT" | "QLD" | "SA" | "TAS" | "VIC" | "WA";
  school_sectors: ("government" | "catholic" | "independent")[];
  year_levels?: (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12)[];
  level_codes?: string[];
  band_codes?: string[];
  stage_codes?: string[];
  effective_from?: string | null;
  effective_to?: string | null;
}

interface RowCrosswalk {
  id: string;
  source_release_id: string;
  source_node_id: string;
  target_release_id?: string | null;
  target_node_id?: string | null;
  relation: CurriculumRelation;
  confidence: number | string;
  rationale: string;
  provenance_method: "human_review" | "structured_import" | "machine_suggested_human_reviewed";
  provenance_source_url: string;
  provenance_retrieved_at: string | Date;
  review_status?: string | null;
  reviewer_id?: string | null;
  reviewed_at?: string | Date | null;
  supersedes_crosswalk_id?: string | null;
}

interface RowTaxonomyAlignment {
  id: string;
  curriculum_release_id: string;
  curriculum_node_id: string;
  taxonomy_id: string;
  taxonomy_version: string;
  taxonomy_node_id?: string | null;
  relation: CurriculumRelation;
  rationale: string;
  aligned_by: string;
  aligned_at: string | Date;
  review_status?: string | null;
  reviewer_id?: string | null;
  reviewed_at?: string | Date | null;
}

interface CatalogueQueryRow {
  id: string;
  release_id: string;
  node_key: string;
  node_kind: (typeof CURRICULUM_NODE_KINDS)[number];
  parent_node_id?: string | null;
  official_code?: string | null;
  label: string;
  official_text?: string | null;
  official_text_licence_id?: string | null;
  official_text_attribution?: string | null;
  sort_order: number;
  release_key: string;
  release_schema_version: number;
  source_id: string;
  framework_scope: "national" | "state" | "territory";
  release_jurisdiction_code: "AU" | "ACT" | "NSW" | "NT" | "QLD" | "SA" | "TAS" | "VIC" | "WA";
  release_school_sectors: ("government" | "catholic" | "independent")[];
  release_title: string;
  release_version: string;
  release_effective_from?: string | null;
  release_effective_to?: string | null;
  release_published_at?: string | Date | null;
  release_supersedes_release_id?: string | null;
  release_source_fingerprint: string;
  source_id_val: string;
  source_key: string;
  source_schema_version: number;
  authority_code: string;
  authority_name: string;
  source_jurisdiction_code: "AU" | "ACT" | "NSW" | "NT" | "QLD" | "SA" | "TAS" | "VIC" | "WA";
  source_school_sectors: ("government" | "catholic" | "independent")[];
  source_title: string;
  source_url: string;
  source_retrieved_at: string | Date;
  source_fingerprint: string;
  licence_evidence_id: string;
  source_licence_id: string;
  licence_name: string;
  licence_url?: string | null;
  official_text_access: "metadata_only" | "store_only" | "display";
  source_attribution?: string | null;
  evidence_id: string;
  evidence_key: string;
  evidence_schema_version: number;
  evidence_licence_id: string;
  evidence_url: string;
  evidence_retrieved_at: string | Date;
  evidence_fingerprint: string;
  permits_storage: boolean;
  permits_display: boolean;
  evidence_notes?: string | null;
  applicabilities: RowApplicability[];
  crosswalks: RowCrosswalk[];
  taxonomy_alignments: RowTaxonomyAlignment[];
}

function encodeCursor(data: CursorData): string {
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}

function decodeCursor(cursor: string): CursorData | null {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.sortOrder === "number" &&
      typeof parsed.nodeKey === "string" &&
      typeof parsed.id === "string"
    ) {
      return parsed as CursorData;
    }
    return null;
  } catch {
    return null;
  }
}

function defaultCoverageResolver(
  _nodeId: string,
  alignments: readonly unknown[],
): CurriculumCoverage {
  const count = alignments.length;
  return {
    status: count > 0 ? "partial" : "none",
    supportingContentCount: count,
    policyId: "curriculum-coverage-v1",
    computedAt: new Date().toISOString(),
  };
}

function formatReviewRef(
  status?: string | null,
  reviewerId?: string | null,
  reviewedAt?: string | Date | null,
) {
  const s = status ?? "draft";
  if (s === "approved" || s === "rejected") {
    return {
      status: s as "approved" | "rejected",
      reviewedBy: reviewerId ?? "system-reviewer",
      reviewedAt: reviewedAt ? new Date(reviewedAt).toISOString() : new Date().toISOString(),
    };
  }
  return {
    status: (s === "in_review" ? "in_review" : "draft") as "draft" | "in_review",
  };
}

export class PostgresCurriculumCatalogue implements CurriculumCatalogue {
  private readonly connectionString?: string;
  private readonly client?: Client | Pool | PoolClient;
  private readonly coverageResolver: CoverageResolver;

  constructor(options: PostgresCurriculumCatalogueOptions = {}) {
    this.connectionString =
      options.connectionString ??
      process.env.DATABASE_URL ??
      process.env.RLS_TEST_DB_URL ??
      "postgresql://postgres:postgres@127.0.0.1:56322/postgres";
    this.client = options.client;
    this.coverageResolver = options.coverageResolver ?? defaultCoverageResolver;
  }

  private async executeQuery<T>(
    sql: string,
    params: readonly unknown[],
  ): Promise<{ rows: T[] }> {
    if (this.client) {
      return this.client.query<T & Record<string, unknown>>(sql, params as unknown[]);
    }
    const tempClient = new PgClient({ connectionString: this.connectionString });
    tempClient.on("error", () => undefined);
    await tempClient.connect();
    try {
      return await tempClient.query<T & Record<string, unknown>>(sql, params as unknown[]);
    } finally {
      await tempClient.end().catch(() => undefined);
    }
  }

  async getRelease(releaseId: string): Promise<CurriculumRelease | null> {
    const result = await this.executeQuery<{
      id: string;
      release_key: string;
      schema_version: number;
      source_id: string;
      framework_scope: "national" | "state" | "territory";
      jurisdiction_code: "AU" | "ACT" | "NSW" | "NT" | "QLD" | "SA" | "TAS" | "VIC" | "WA";
      school_sectors: ("government" | "catholic" | "independent")[];
      title: string;
      release_version: string;
      effective_from: string | null;
      effective_to: string | null;
      published_at: Date | null;
      supersedes_release_id: string | null;
      source_fingerprint: string;
    }>(
      `SELECT id, release_key, schema_version, source_id, framework_scope,
              jurisdiction_code, school_sectors, title, release_version,
              effective_from::text as effective_from, effective_to::text as effective_to,
              published_at, supersedes_release_id, source_fingerprint
         FROM public.curriculum_releases
        WHERE id = $1`,
      [releaseId],
    );

    const row = result.rows[0];
    if (!row) return null;

    const release = {
      schemaVersion: 1 as const,
      releaseId: row.id,
      releaseKey: row.release_key,
      sourceId: row.source_id,
      frameworkScope: row.framework_scope,
      jurisdictionCode: row.jurisdiction_code,
      schoolSectors: row.school_sectors,
      title: row.title,
      version: row.release_version,
      effectiveFrom: row.effective_from ? String(row.effective_from).substring(0, 10) : undefined,
      effectiveTo: row.effective_to ? String(row.effective_to).substring(0, 10) : undefined,
      publishedAt: row.published_at ? new Date(row.published_at).toISOString() : undefined,
      supersedesReleaseId: row.supersedes_release_id ?? undefined,
      sourceFingerprint: row.source_fingerprint,
    };

    return curriculumReleaseSchema.parse(release);
  }

  async query(
    input: CurriculumCatalogueQuery | z.input<typeof curriculumCatalogueQuerySchema>,
  ): Promise<CurriculumCatalogueResult> {
    const query = curriculumCatalogueQuerySchema.parse(input);

    const baseWhereClauses: string[] = [
      "r.jurisdiction_code = $1",
      "$2 = ANY(r.school_sectors)",
      "a.jurisdiction_code = $1",
      "$2 = ANY(a.school_sectors)",
    ];
    const baseParams: unknown[] = [query.jurisdictionCode, query.schoolSector];

    let paramIdx = 3;

    if (query.releaseIds && query.releaseIds.length > 0) {
      baseWhereClauses.push(`r.id = ANY($${paramIdx}::uuid[])`);
      baseParams.push(query.releaseIds);
      paramIdx++;
    }

    if (query.nodeKinds && query.nodeKinds.length > 0) {
      baseWhereClauses.push(`n.node_kind = ANY($${paramIdx}::text[])`);
      baseParams.push(query.nodeKinds);
      paramIdx++;
    }

    if (query.parentNodeId !== undefined) {
      baseWhereClauses.push(`n.parent_node_id = $${paramIdx}`);
      baseParams.push(query.parentNodeId);
      paramIdx++;
    }

    if (query.yearLevels && query.yearLevels.length > 0) {
      baseWhereClauses.push(`a.year_levels && $${paramIdx}::smallint[]`);
      baseParams.push(query.yearLevels);
      paramIdx++;
    }

    if (query.levelCodes && query.levelCodes.length > 0) {
      baseWhereClauses.push(`a.level_codes && $${paramIdx}::text[]`);
      baseParams.push(query.levelCodes);
      paramIdx++;
    }

    if (query.bandCodes && query.bandCodes.length > 0) {
      baseWhereClauses.push(`a.band_codes && $${paramIdx}::text[]`);
      baseParams.push(query.bandCodes);
      paramIdx++;
    }

    if (query.stageCodes && query.stageCodes.length > 0) {
      baseWhereClauses.push(`a.stage_codes && $${paramIdx}::text[]`);
      baseParams.push(query.stageCodes);
      paramIdx++;
    }

    const whereSql = baseWhereClauses.join(" AND ");

    // Count total matching items
    const countSql = `
      SELECT count(DISTINCT n.id)::int as total
        FROM public.curriculum_nodes n
        JOIN public.curriculum_releases r ON r.id = n.release_id
        JOIN public.curriculum_applicabilities a ON a.node_id = n.id AND a.release_id = n.release_id
       WHERE ${whereSql}
    `;
    const countRes = await this.executeQuery<{ total: number }>(countSql, baseParams);
    const total = countRes.rows[0]?.total ?? 0;

    // Build paginated query with cursor
    const paginatedClauses = [...baseWhereClauses];
    const paginatedParams = [...baseParams];

    if (query.cursor) {
      const cursorData = decodeCursor(query.cursor);
      if (cursorData) {
        paginatedClauses.push(
          `(n.sort_order, n.node_key, n.id) > ($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}::uuid)`,
        );
        paginatedParams.push(cursorData.sortOrder, cursorData.nodeKey, cursorData.id);
        paramIdx += 3;
      }
    }

    const paginatedWhereSql = paginatedClauses.join(" AND ");
    const limit = query.pageSize + 1;
    paginatedParams.push(limit);
    const limitParamIdx = paramIdx;

    const dataSql = `
      WITH matched_nodes AS (
        SELECT DISTINCT n.id, n.release_id, n.node_key, n.node_kind, n.parent_node_id,
               n.official_code, n.label, n.official_text, n.official_text_licence_id,
               n.official_text_attribution, n.sort_order
          FROM public.curriculum_nodes n
          JOIN public.curriculum_releases r ON r.id = n.release_id
          JOIN public.curriculum_applicabilities a ON a.node_id = n.id AND a.release_id = n.release_id
         WHERE ${paginatedWhereSql}
         ORDER BY n.sort_order ASC, n.node_key ASC, n.id ASC
         LIMIT $${limitParamIdx}
      )
      SELECT
        mn.*,
        -- Release
        r.release_key, r.schema_version as release_schema_version, r.source_id,
        r.framework_scope, r.jurisdiction_code as release_jurisdiction_code,
        r.school_sectors as release_school_sectors, r.title as release_title,
        r.release_version, r.effective_from::text as release_effective_from,
        r.effective_to::text as release_effective_to, r.published_at as release_published_at,
        r.supersedes_release_id as release_supersedes_release_id,
        r.source_fingerprint as release_source_fingerprint,
        -- Source
        s.id as source_id_val, s.source_key, s.schema_version as source_schema_version,
        s.authority_code, s.authority_name, s.jurisdiction_code as source_jurisdiction_code,
        s.school_sectors as source_school_sectors, s.title as source_title,
        s.source_url, s.retrieved_at as source_retrieved_at,
        s.source_fingerprint, s.licence_evidence_id, s.licence_id as source_licence_id,
        s.licence_name, s.licence_url, s.official_text_access, s.attribution as source_attribution,
        -- Evidence
        e.id as evidence_id, e.evidence_key, e.schema_version as evidence_schema_version,
        e.licence_id as evidence_licence_id, e.evidence_url, e.retrieved_at as evidence_retrieved_at,
        e.evidence_fingerprint, e.permits_storage, e.permits_display, e.notes as evidence_notes,
        -- Applicabilities
        COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'id', ap.id,
            'release_id', ap.release_id,
            'node_id', ap.node_id,
            'jurisdiction_code', ap.jurisdiction_code,
            'school_sectors', ap.school_sectors,
            'year_levels', ap.year_levels,
            'level_codes', ap.level_codes,
            'band_codes', ap.band_codes,
            'stage_codes', ap.stage_codes,
            'effective_from', ap.effective_from::text,
            'effective_to', ap.effective_to::text
          ))
          FROM public.curriculum_applicabilities ap
          WHERE ap.node_id = mn.id AND ap.release_id = mn.release_id
        ), '[]'::jsonb) as applicabilities,
        -- Crosswalks
        COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'id', cw.id,
            'source_release_id', cw.source_release_id,
            'source_node_id', cw.source_node_id,
            'target_release_id', cw.target_release_id,
            'target_node_id', cw.target_node_id,
            'relation', cw.relation,
            'confidence', cw.confidence,
            'rationale', cw.rationale,
            'provenance_method', cw.provenance_method,
            'provenance_source_url', cw.provenance_source_url,
            'provenance_retrieved_at', cw.provenance_retrieved_at,
            'supersedes_crosswalk_id', cw.supersedes_crosswalk_id,
            'review_status', rev.status,
            'reviewer_id', rev.reviewer_id,
            'reviewed_at', rev.created_at
          ))
          FROM public.curriculum_crosswalks cw
          LEFT JOIN public.curriculum_latest_review_statuses rev
            ON rev.entity_kind = 'crosswalk' AND rev.entity_id = cw.id
          WHERE cw.source_node_id = mn.id AND cw.source_release_id = mn.release_id
        ), '[]'::jsonb) as crosswalks,
        -- Taxonomy alignments
        COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'id', ta.id,
            'curriculum_release_id', ta.curriculum_release_id,
            'curriculum_node_id', ta.curriculum_node_id,
            'taxonomy_id', ta.taxonomy_id,
            'taxonomy_version', ta.taxonomy_version,
            'taxonomy_node_id', ta.taxonomy_node_id,
            'relation', ta.relation,
            'rationale', ta.rationale,
            'aligned_by', ta.aligned_by,
            'aligned_at', ta.aligned_at,
            'supersedes_alignment_id', ta.supersedes_alignment_id,
            'review_status', rev.status,
            'reviewer_id', rev.reviewer_id,
            'reviewed_at', rev.created_at
          ))
          FROM public.curriculum_taxonomy_alignments ta
          LEFT JOIN public.curriculum_latest_review_statuses rev
            ON rev.entity_kind = 'taxonomy_alignment' AND rev.entity_id = ta.id
          WHERE ta.curriculum_node_id = mn.id AND ta.curriculum_release_id = mn.release_id
        ), '[]'::jsonb) as taxonomy_alignments
      FROM matched_nodes mn
      JOIN public.curriculum_releases r ON r.id = mn.release_id
      JOIN public.curriculum_sources s ON s.id = r.source_id
      JOIN public.curriculum_licence_evidence e ON e.id = s.licence_evidence_id AND e.licence_id = s.licence_id
      ORDER BY mn.sort_order ASC, mn.node_key ASC, mn.id::text ASC
    `;

    const dataRes = await this.executeQuery<CatalogueQueryRow>(dataSql, paginatedParams);
    const hasMore = dataRes.rows.length > query.pageSize;
    const itemRows = hasMore ? dataRes.rows.slice(0, query.pageSize) : dataRes.rows;

    const items: CurriculumCatalogueItem[] = [];

    for (const row of itemRows) {
      // Official text projection boundary check
      let officialText:
        | {
            text: string;
            licenceId: string;
            attribution: string;
          }
        | undefined = undefined;

      if (
        query.includeOfficialText &&
        row.official_text &&
        row.official_text_access === "display" &&
        row.permits_display === true &&
        row.permits_storage === true &&
        row.licence_evidence_id === row.evidence_id &&
        row.source_licence_id === row.evidence_licence_id &&
        row.official_text_licence_id === row.source_licence_id
      ) {
        officialText = {
          text: row.official_text,
          licenceId: row.official_text_licence_id,
          attribution:
            row.official_text_attribution ??
            row.source_attribution ??
            row.authority_name,
        };
      }

      const coverage = await this.coverageResolver(row.id, row.taxonomy_alignments);

      // Apply coverage filter if requested
      if (
        query.coverage === "with_supporting_content" &&
        coverage.supportingContentCount === 0
      ) {
        continue;
      }
      if (
        query.coverage === "without_supporting_content" &&
        coverage.supportingContentCount > 0
      ) {
        continue;
      }

      const item: CurriculumCatalogueItem = {
        licenceEvidence: {
          schemaVersion: 1,
          evidenceId: row.evidence_id,
          evidenceKey: row.evidence_key,
          licenceId: row.evidence_licence_id,
          evidenceUrl: row.evidence_url,
          retrievedAt: new Date(row.evidence_retrieved_at).toISOString(),
          evidenceFingerprint: row.evidence_fingerprint,
          permitsStorage: row.permits_storage,
          permitsDisplay: row.permits_display,
          notes: row.evidence_notes ?? undefined,
        },
        source: {
          schemaVersion: 1,
          sourceId: row.source_id_val,
          sourceKey: row.source_key,
          authorityCode: row.authority_code,
          authorityName: row.authority_name,
          jurisdictionCode: row.source_jurisdiction_code,
          schoolSectors: row.source_school_sectors,
          title: row.source_title,
          sourceUrl: row.source_url,
          retrievedAt: new Date(row.source_retrieved_at).toISOString(),
          sourceFingerprint: row.source_fingerprint,
          licenceEvidenceId: row.licence_evidence_id,
          licence: {
            id: row.source_licence_id,
            name: row.licence_name,
            url: row.licence_url ?? undefined,
            officialTextAccess: row.official_text_access,
            attribution: row.source_attribution ?? undefined,
          },
        },
        release: {
          schemaVersion: 1,
          releaseId: row.release_id,
          releaseKey: row.release_key,
          sourceId: row.source_id,
          frameworkScope: row.framework_scope,
          jurisdictionCode: row.release_jurisdiction_code,
          schoolSectors: row.release_school_sectors,
          title: row.release_title,
          version: row.release_version,
          effectiveFrom: row.release_effective_from
            ? String(row.release_effective_from).substring(0, 10)
            : undefined,
          effectiveTo: row.release_effective_to
            ? String(row.release_effective_to).substring(0, 10)
            : undefined,
          publishedAt: row.release_published_at
            ? new Date(row.release_published_at).toISOString()
            : undefined,
          supersedesReleaseId: row.release_supersedes_release_id ?? undefined,
          sourceFingerprint: row.release_source_fingerprint,
        },
        node: {
          schemaVersion: 1,
          nodeId: row.id,
          releaseId: row.release_id,
          nodeKey: row.node_key,
          kind: row.node_kind,
          parentNodeId: row.parent_node_id ?? undefined,
          officialCode: row.official_code ?? undefined,
          label: row.label,
          officialText,
          sortOrder: row.sort_order,
        },
        applicability: (row.applicabilities || []).map((app: RowApplicability) => ({
          schemaVersion: 1,
          applicabilityId: app.id,
          nodeId: app.node_id,
          releaseId: app.release_id,
          jurisdictionCode: app.jurisdiction_code,
          schoolSectors: app.school_sectors,
          yearLevels: app.year_levels ?? [],
          levelCodes: app.level_codes ?? [],
          bandCodes: app.band_codes ?? [],
          stageCodes: app.stage_codes ?? [],
          effectiveFrom: app.effective_from ? String(app.effective_from).substring(0, 10) : undefined,
          effectiveTo: app.effective_to ? String(app.effective_to).substring(0, 10) : undefined,
        })),
        crosswalks: (row.crosswalks || []).map((cw: RowCrosswalk) => ({
          schemaVersion: 1,
          crosswalkId: cw.id,
          source: {
            releaseId: cw.source_release_id,
            nodeId: cw.source_node_id,
          },
          target:
            cw.relation === "unmapped" || !cw.target_node_id
              ? null
              : {
                  releaseId: cw.target_release_id!,
                  nodeId: cw.target_node_id,
                },
          relation: cw.relation,
          confidence: Number(cw.confidence),
          rationale: cw.rationale,
          provenance: {
            method: cw.provenance_method,
            sourceUrl: cw.provenance_source_url,
            retrievedAt: new Date(cw.provenance_retrieved_at).toISOString(),
          },
          review: formatReviewRef(cw.review_status, cw.reviewer_id, cw.reviewed_at),
          supersedesCrosswalkId: cw.supersedes_crosswalk_id ?? undefined,
        })),
        taxonomyAlignments: (row.taxonomy_alignments || []).map((ta: RowTaxonomyAlignment) => ({
          schemaVersion: 1,
          alignmentId: ta.id,
          curriculumReleaseId: ta.curriculum_release_id,
          curriculumNodeId: ta.curriculum_node_id,
          taxonomyId: ta.taxonomy_id,
          taxonomyVersion: ta.taxonomy_version,
          taxonomyNodeId: ta.relation === "unmapped" ? null : (ta.taxonomy_node_id ?? null),
          relation: ta.relation,
          rationale: ta.rationale,
          provenance: {
            alignedBy: ta.aligned_by,
            alignedAt: new Date(ta.aligned_at).toISOString(),
          },
          review: formatReviewRef(ta.review_status, ta.reviewer_id, ta.reviewed_at),
        })),
        coverage,
      };

      items.push(curriculumCatalogueItemSchema.parse(item));
    }

    let nextCursor: string | null = null;
    if (hasMore && itemRows.length > 0) {
      const last = itemRows[itemRows.length - 1];
      nextCursor = encodeCursor({
        sortOrder: last.sort_order,
        nodeKey: last.node_key,
        id: last.id,
      });
    }

    const result: CurriculumCatalogueResult = {
      schemaVersion: 1,
      query,
      items,
      total,
      nextCursor,
    };

    return curriculumCatalogueResultSchema.parse(result);
  }
}
