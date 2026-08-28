import "server-only";

import { Client } from "pg";

import {
  type CurriculumImportManifest,
  curriculumImportManifestSchema,
} from "./manifest-schema";

export type ImportMode = "validate_only" | "dry_run" | "apply";

export interface ImportOptions {
  mode?: ImportMode;
  client?: Client;
  connectionString?: string;
}

export interface CurriculumImportReport {
  success: boolean;
  mode: ImportMode;
  manifestKey: string;
  counts: {
    evidenceInserted: number;
    evidenceSkipped: number;
    sourcesInserted: number;
    sourcesSkipped: number;
    releasesInserted: number;
    releasesSkipped: number;
    nodesInserted: number;
    nodesSkipped: number;
    applicabilitiesInserted: number;
    applicabilitiesSkipped: number;
    crosswalksInserted: number;
    crosswalksSkipped: number;
    taxonomyAlignmentsInserted: number;
    taxonomyAlignmentsSkipped: number;
    reviewEventsInserted: number;
    reviewEventsSkipped: number;
  };
  durationMs: number;
  errors: string[];
  warnings: string[];
  timestamp: string;
}

export class CurriculumImportError extends Error {
  constructor(
    message: string,
    readonly code: string = "MM305",
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "CurriculumImportError";
  }
}

function setsEqual(a: readonly unknown[], b: readonly unknown[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a.map(String));
  return b.every((item) => setA.has(String(item)));
}

function normalizeDate(d: unknown): string | null {
  if (!d) return null;
  if (d instanceof Date) {
    return d.toISOString().substring(0, 10);
  }
  if (typeof d === "string") {
    return d.includes("T") ? d.split("T")[0]! : d;
  }
  return String(d);
}

/**
 * Topologically sort nodes so parents are inserted before children.
 */
function sortNodesTopologically(
  nodes: readonly CurriculumImportManifest["nodes"][number][],
): CurriculumImportManifest["nodes"][number][] {
  const result: CurriculumImportManifest["nodes"][number][] = [];
  const insertedNodeIds = new Set<string>();
  const remaining = [...nodes];

  let iterations = 0;
  const maxIterations = remaining.length * remaining.length + 10;

  while (remaining.length > 0 && iterations < maxIterations) {
    iterations++;
    const nextBatchIndex = remaining.findIndex(
      (node) => !node.parentNodeId || insertedNodeIds.has(node.parentNodeId),
    );

    if (nextBatchIndex === -1) {
      break;
    }

    const [node] = remaining.splice(nextBatchIndex, 1);
    if (node) {
      result.push(node);
      insertedNodeIds.add(node.nodeId);
    }
  }

  if (remaining.length > 0) {
    result.push(...remaining);
  }

  return result;
}

export async function importCurriculumManifest(
  manifestInput: unknown,
  options: ImportOptions = {},
): Promise<CurriculumImportReport> {
  const startTime = Date.now();
  const mode = options.mode ?? "dry_run";
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Schema & contract validation
  const parseResult = curriculumImportManifestSchema.safeParse(manifestInput);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new CurriculumImportError(
      `Curriculum manifest validation failed: ${errorDetails}`,
      "MM305",
      parseResult.error.issues,
    );
  }

  const manifest = parseResult.data;

  // Fingerprint verification across release and source
  for (const release of manifest.releases) {
    const source = manifest.sources.find((s) => s.sourceId === release.sourceId);
    if (source && release.sourceFingerprint !== source.sourceFingerprint) {
      throw new CurriculumImportError(
        `Release '${release.releaseKey}' sourceFingerprint does not match source '${source.sourceKey}' fingerprint`,
        "MM305",
      );
    }
  }

  const counts = {
    evidenceInserted: 0,
    evidenceSkipped: 0,
    sourcesInserted: 0,
    sourcesSkipped: 0,
    releasesInserted: 0,
    releasesSkipped: 0,
    nodesInserted: 0,
    nodesSkipped: 0,
    applicabilitiesInserted: 0,
    applicabilitiesSkipped: 0,
    crosswalksInserted: 0,
    crosswalksSkipped: 0,
    taxonomyAlignmentsInserted: 0,
    taxonomyAlignmentsSkipped: 0,
    reviewEventsInserted: 0,
    reviewEventsSkipped: 0,
  };

  if (mode === "validate_only") {
    return {
      success: true,
      mode,
      manifestKey: manifest.manifestKey,
      counts: {
        ...counts,
        evidenceSkipped: manifest.licenceEvidence.length,
        sourcesSkipped: manifest.sources.length,
        releasesSkipped: manifest.releases.length,
        nodesSkipped: manifest.nodes.length,
        applicabilitiesSkipped: manifest.applicabilities.length,
        crosswalksSkipped: manifest.crosswalks.length,
        taxonomyAlignmentsSkipped: manifest.taxonomyAlignments.length,
        reviewEventsSkipped: manifest.reviewEvents.length,
      },
      durationMs: Date.now() - startTime,
      errors,
      warnings,
      timestamp: new Date().toISOString(),
    };
  }

  // 2. Database connection & transaction setup
  let client = options.client;
  let ownClient = false;

  if (!client) {
    const dbUrl =
      options.connectionString ??
      process.env.DATABASE_URL ??
      process.env.RLS_TEST_DB_URL ??
      "postgresql://postgres:postgres@127.0.0.1:56322/postgres";
    client = new Client({ connectionString: dbUrl });
    client.on("error", () => undefined);
    await client.connect();
    ownClient = true;
  }

  try {
    if (ownClient) {
      await client.query("BEGIN");
    } else {
      await client.query("SAVEPOINT curr_import_sp");
    }

    // A. Licence Evidence
    for (const evidence of manifest.licenceEvidence) {
      const existing = await client.query(
        `SELECT id, evidence_key, licence_id, evidence_url, evidence_fingerprint,
                permits_storage, permits_display, notes
           FROM public.curriculum_licence_evidence
          WHERE id = $1 OR evidence_key = $2`,
        [evidence.evidenceId, evidence.evidenceKey],
      );

      if (existing.rows.length > 0) {
        const row = existing.rows[0];
        const isMatch =
          row.id === evidence.evidenceId &&
          row.evidence_key === evidence.evidenceKey &&
          row.licence_id === evidence.licenceId &&
          row.evidence_url === evidence.evidenceUrl &&
          row.evidence_fingerprint === evidence.evidenceFingerprint &&
          row.permits_storage === evidence.permitsStorage &&
          row.permits_display === evidence.permitsDisplay;

        if (!isMatch) {
          throw new CurriculumImportError(
            `Licence evidence '${evidence.evidenceKey}' exists with conflicting data.`,
            "MM303",
          );
        }
        counts.evidenceSkipped++;
      } else {
        await client.query(
          `INSERT INTO public.curriculum_licence_evidence
             (id, evidence_key, schema_version, licence_id, evidence_url,
              retrieved_at, evidence_fingerprint, permits_storage, permits_display, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            evidence.evidenceId,
            evidence.evidenceKey,
            evidence.schemaVersion,
            evidence.licenceId,
            evidence.evidenceUrl,
            evidence.retrievedAt,
            evidence.evidenceFingerprint,
            evidence.permitsStorage,
            evidence.permitsDisplay,
            evidence.notes ?? null,
          ],
        );
        counts.evidenceInserted++;
      }
    }

    // B. Sources
    for (const source of manifest.sources) {
      const existing = await client.query(
        `SELECT id, source_key, authority_code, authority_name, jurisdiction_code,
                school_sectors, title, source_url, source_fingerprint, licence_evidence_id,
                licence_id, licence_name, licence_url, official_text_access, attribution
           FROM public.curriculum_sources
          WHERE id = $1 OR source_key = $2`,
        [source.sourceId, source.sourceKey],
      );

      if (existing.rows.length > 0) {
        const row = existing.rows[0];
        const isMatch =
          row.id === source.sourceId &&
          row.source_key === source.sourceKey &&
          row.authority_code === source.authorityCode &&
          row.authority_name === source.authorityName &&
          row.jurisdiction_code === source.jurisdictionCode &&
          setsEqual(row.school_sectors, source.schoolSectors) &&
          row.title === source.title &&
          row.source_url === source.sourceUrl &&
          row.source_fingerprint === source.sourceFingerprint &&
          row.licence_evidence_id === source.licenceEvidenceId &&
          row.licence_id === source.licence.id &&
          row.licence_name === source.licence.name &&
          row.official_text_access === source.licence.officialTextAccess;

        if (!isMatch) {
          throw new CurriculumImportError(
            `Curriculum source '${source.sourceKey}' exists with conflicting data.`,
            "MM303",
          );
        }
        counts.sourcesSkipped++;
      } else {
        await client.query(
          `INSERT INTO public.curriculum_sources
             (id, source_key, schema_version, authority_code, authority_name,
              jurisdiction_code, school_sectors, title, source_url, retrieved_at,
              source_fingerprint, licence_evidence_id, licence_id, licence_name,
              licence_url, official_text_access, attribution)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            source.sourceId,
            source.sourceKey,
            source.schemaVersion,
            source.authorityCode,
            source.authorityName,
            source.jurisdictionCode,
            source.schoolSectors,
            source.title,
            source.sourceUrl,
            source.retrievedAt,
            source.sourceFingerprint,
            source.licenceEvidenceId,
            source.licence.id,
            source.licence.name,
            source.licence.url ?? null,
            source.licence.officialTextAccess,
            source.licence.attribution ?? null,
          ],
        );
        counts.sourcesInserted++;
      }
    }

    // C. Releases
    for (const release of manifest.releases) {
      const existing = await client.query(
        `SELECT id, release_key, source_id, framework_scope, jurisdiction_code,
                school_sectors, title, release_version,
                effective_from::text as effective_from, effective_to::text as effective_to,
                source_fingerprint, supersedes_release_id
           FROM public.curriculum_releases
          WHERE id = $1 OR release_key = $2`,
        [release.releaseId, release.releaseKey],
      );

      if (existing.rows.length > 0) {
        const row = existing.rows[0];
        const isMatch =
          row.id === release.releaseId &&
          row.release_key === release.releaseKey &&
          row.source_id === release.sourceId &&
          row.framework_scope === release.frameworkScope &&
          row.jurisdiction_code === release.jurisdictionCode &&
          setsEqual(row.school_sectors, release.schoolSectors) &&
          row.title === release.title &&
          row.release_version === release.version &&
          normalizeDate(row.effective_from) === normalizeDate(release.effectiveFrom) &&
          normalizeDate(row.effective_to) === normalizeDate(release.effectiveTo) &&
          row.source_fingerprint === release.sourceFingerprint &&
          (row.supersedes_release_id ?? undefined) === release.supersedesReleaseId;

        if (!isMatch) {
          throw new CurriculumImportError(
            `Curriculum release '${release.releaseKey}' exists with conflicting data.`,
            "MM303",
          );
        }
        counts.releasesSkipped++;
      } else {
        await client.query(
          `INSERT INTO public.curriculum_releases
             (id, release_key, schema_version, source_id, framework_scope,
              jurisdiction_code, school_sectors, title, release_version,
              effective_from, effective_to, published_at, supersedes_release_id,
              source_fingerprint)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            release.releaseId,
            release.releaseKey,
            release.schemaVersion,
            release.sourceId,
            release.frameworkScope,
            release.jurisdictionCode,
            release.schoolSectors,
            release.title,
            release.version,
            release.effectiveFrom ?? null,
            release.effectiveTo ?? null,
            release.publishedAt ?? null,
            release.supersedesReleaseId ?? null,
            release.sourceFingerprint,
          ],
        );
        counts.releasesInserted++;
      }
    }

    // D. Nodes (topologically sorted)
    const sortedNodes = sortNodesTopologically(manifest.nodes);
    for (const node of sortedNodes) {
      const existing = await client.query(
        `SELECT id, release_id, node_key, node_kind, parent_node_id, official_code,
                label, official_text, official_text_licence_id, official_text_attribution,
                sort_order
           FROM public.curriculum_nodes
          WHERE id = $1 OR (release_id = $2 AND node_key = $3)`,
        [node.nodeId, node.releaseId, node.nodeKey],
      );

      if (existing.rows.length > 0) {
        const row = existing.rows[0];
        const isMatch =
          row.id === node.nodeId &&
          row.release_id === node.releaseId &&
          row.node_key === node.nodeKey &&
          row.node_kind === node.kind &&
          (row.parent_node_id ?? undefined) === node.parentNodeId &&
          (row.official_code ?? undefined) === node.officialCode &&
          row.label === node.label &&
          row.sort_order === node.sortOrder &&
          (row.official_text ?? undefined) === node.officialText?.text &&
          (row.official_text_licence_id ?? undefined) === node.officialText?.licenceId;

        if (!isMatch) {
          throw new CurriculumImportError(
            `Curriculum node '${node.nodeKey}' in release '${node.releaseId}' exists with conflicting data.`,
            "MM303",
          );
        }
        counts.nodesSkipped++;
      } else {
        await client.query(
          `INSERT INTO public.curriculum_nodes
             (id, release_id, node_key, node_kind, parent_node_id, official_code,
              label, official_text, official_text_licence_id, official_text_attribution,
              sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            node.nodeId,
            node.releaseId,
            node.nodeKey,
            node.kind,
            node.parentNodeId ?? null,
            node.officialCode ?? null,
            node.label,
            node.officialText?.text ?? null,
            node.officialText?.licenceId ?? null,
            node.officialText?.attribution ?? null,
            node.sortOrder,
          ],
        );
        counts.nodesInserted++;
      }
    }

    // E. Applicabilities
    for (const app of manifest.applicabilities) {
      const existing = await client.query(
        `SELECT id, release_id, node_id, jurisdiction_code, school_sectors,
                year_levels, level_codes, band_codes, stage_codes,
                effective_from::text as effective_from, effective_to::text as effective_to
           FROM public.curriculum_applicabilities
          WHERE id = $1`,
        [app.applicabilityId],
      );

      if (existing.rows.length > 0) {
        const row = existing.rows[0];
        const isMatch =
          row.release_id === app.releaseId &&
          row.node_id === app.nodeId &&
          row.jurisdiction_code === app.jurisdictionCode &&
          setsEqual(row.school_sectors, app.schoolSectors) &&
          setsEqual(row.year_levels.map(String), app.yearLevels.map(String)) &&
          setsEqual(row.level_codes, app.levelCodes) &&
          setsEqual(row.band_codes, app.bandCodes) &&
          setsEqual(row.stage_codes, app.stageCodes);

        if (!isMatch) {
          throw new CurriculumImportError(
            `Curriculum applicability '${app.applicabilityId}' exists with conflicting data.`,
            "MM303",
          );
        }
        counts.applicabilitiesSkipped++;
      } else {
        await client.query(
          `INSERT INTO public.curriculum_applicabilities
             (id, release_id, node_id, jurisdiction_code, school_sectors,
              year_levels, level_codes, band_codes, stage_codes,
              effective_from, effective_to)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            app.applicabilityId,
            app.releaseId,
            app.nodeId,
            app.jurisdictionCode,
            app.schoolSectors,
            app.yearLevels,
            app.levelCodes,
            app.bandCodes,
            app.stageCodes,
            app.effectiveFrom ?? null,
            app.effectiveTo ?? null,
          ],
        );
        counts.applicabilitiesInserted++;
      }
    }

    // F. Crosswalks
    for (const cw of manifest.crosswalks) {
      const existing = await client.query(
        `SELECT id, source_release_id, source_node_id, target_release_id, target_node_id,
                relation, confidence, rationale, provenance_method, provenance_source_url,
                supersedes_crosswalk_id
           FROM public.curriculum_crosswalks
          WHERE id = $1`,
        [cw.crosswalkId],
      );

      if (existing.rows.length > 0) {
        const row = existing.rows[0];
        const isMatch =
          row.source_release_id === cw.source.releaseId &&
          row.source_node_id === cw.source.nodeId &&
          (row.target_release_id ?? undefined) === cw.target?.releaseId &&
          (row.target_node_id ?? undefined) === cw.target?.nodeId &&
          row.relation === cw.relation &&
          Number(row.confidence) === cw.confidence &&
          row.rationale === cw.rationale &&
          row.provenance_method === cw.provenance.method &&
          row.provenance_source_url === cw.provenance.sourceUrl &&
          (row.supersedes_crosswalk_id ?? undefined) === cw.supersedesCrosswalkId;

        if (!isMatch) {
          throw new CurriculumImportError(
            `Curriculum crosswalk '${cw.crosswalkId}' exists with conflicting data.`,
            "MM303",
          );
        }
        counts.crosswalksSkipped++;
      } else {
        await client.query(
          `INSERT INTO public.curriculum_crosswalks
             (id, source_release_id, source_node_id, target_release_id, target_node_id,
              relation, confidence, rationale, provenance_method, provenance_source_url,
              provenance_retrieved_at, supersedes_crosswalk_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            cw.crosswalkId,
            cw.source.releaseId,
            cw.source.nodeId,
            cw.target?.releaseId ?? null,
            cw.target?.nodeId ?? null,
            cw.relation,
            cw.confidence,
            cw.rationale,
            cw.provenance.method,
            cw.provenance.sourceUrl,
            cw.provenance.retrievedAt,
            cw.supersedesCrosswalkId ?? null,
          ],
        );
        counts.crosswalksInserted++;

        // If crosswalk defines review status other than draft
        if (cw.review && cw.review.status !== "draft") {
          await client.query(
            `INSERT INTO public.curriculum_review_events
               (entity_kind, entity_id, status)
             VALUES ('crosswalk', $1, 'draft')`,
            [cw.crosswalkId],
          );
          await client.query(
            `INSERT INTO public.curriculum_review_events
               (entity_kind, entity_id, status)
             VALUES ('crosswalk', $1, 'in_review')`,
            [cw.crosswalkId],
          );
          await client.query(
            `INSERT INTO public.curriculum_review_events
               (entity_kind, entity_id, status, reviewer_id, created_at)
             VALUES ('crosswalk', $1, $2, $3, $4)`,
            [
              cw.crosswalkId,
              cw.review.status,
              cw.review.reviewedBy ?? "import-reviewer",
              cw.review.reviewedAt ?? new Date().toISOString(),
            ],
          );
        }
      }
    }

    // G. Taxonomy Alignments
    for (const ta of manifest.taxonomyAlignments) {
      const existing = await client.query(
        `SELECT id, curriculum_release_id, curriculum_node_id, taxonomy_id,
                taxonomy_version, taxonomy_node_id, relation, rationale, aligned_by,
                supersedes_alignment_id
           FROM public.curriculum_taxonomy_alignments
          WHERE id = $1`,
        [ta.alignmentId],
      );

      if (existing.rows.length > 0) {
        const row = existing.rows[0];
        const isMatch =
          row.curriculum_release_id === ta.curriculumReleaseId &&
          row.curriculum_node_id === ta.curriculumNodeId &&
          row.taxonomy_id === ta.taxonomyId &&
          row.taxonomy_version === ta.taxonomyVersion &&
          (row.taxonomy_node_id ?? null) === (ta.taxonomyNodeId ?? null) &&
          row.relation === ta.relation &&
          row.rationale === ta.rationale &&
          row.aligned_by === ta.provenance.alignedBy &&
          (row.supersedes_alignment_id ?? undefined) === ta.supersedesAlignmentId;

        if (!isMatch) {
          throw new CurriculumImportError(
            `Taxonomy alignment '${ta.alignmentId}' exists with conflicting data.`,
            "MM303",
          );
        }
        counts.taxonomyAlignmentsSkipped++;
      } else {
        await client.query(
          `INSERT INTO public.curriculum_taxonomy_alignments
             (id, curriculum_release_id, curriculum_node_id, taxonomy_id,
              taxonomy_version, taxonomy_node_id, relation, rationale,
              aligned_by, aligned_at, supersedes_alignment_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            ta.alignmentId,
            ta.curriculumReleaseId,
            ta.curriculumNodeId,
            ta.taxonomyId,
            ta.taxonomyVersion,
            ta.taxonomyNodeId ?? null,
            ta.relation,
            ta.rationale,
            ta.provenance.alignedBy,
            ta.provenance.alignedAt,
            ta.supersedesAlignmentId ?? null,
          ],
        );
        counts.taxonomyAlignmentsInserted++;

        if (ta.review && ta.review.status !== "draft") {
          await client.query(
            `INSERT INTO public.curriculum_review_events
               (entity_kind, entity_id, status)
             VALUES ('taxonomy_alignment', $1, 'draft')`,
            [ta.alignmentId],
          );
          await client.query(
            `INSERT INTO public.curriculum_review_events
               (entity_kind, entity_id, status)
             VALUES ('taxonomy_alignment', $1, 'in_review')`,
            [ta.alignmentId],
          );
          await client.query(
            `INSERT INTO public.curriculum_review_events
               (entity_kind, entity_id, status, reviewer_id, created_at)
             VALUES ('taxonomy_alignment', $1, $2, $3, $4)`,
            [
              ta.alignmentId,
              ta.review.status,
              ta.review.reviewedBy ?? "import-reviewer",
              ta.review.reviewedAt ?? new Date().toISOString(),
            ],
          );
        }
      }
    }

    // H. Review Events
    for (const re of manifest.reviewEvents) {
      const existing = await client.query(
        `SELECT id, entity_kind, entity_id, status, reviewer_id, notes, evidence_hash
           FROM public.curriculum_review_events
          WHERE id = $1`,
        [re.eventId],
      );

      if (existing.rows.length > 0) {
        counts.reviewEventsSkipped++;
      } else {
        await client.query(
          `INSERT INTO public.curriculum_review_events
             (id, entity_kind, entity_id, status, reviewer_id, notes, evidence_hash, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            re.eventId,
            re.entityKind,
            re.entityId,
            re.status,
            re.reviewerId ?? null,
            re.notes ?? null,
            re.evidenceHash ?? null,
            re.createdAt,
          ],
        );
        counts.reviewEventsInserted++;
      }
    }

    if (mode === "dry_run") {
      if (ownClient) {
        await client.query("ROLLBACK");
      } else {
        await client.query("ROLLBACK TO SAVEPOINT curr_import_sp");
        await client.query("RELEASE SAVEPOINT curr_import_sp");
      }
    } else if (mode === "apply") {
      if (ownClient) {
        await client.query("COMMIT");
      } else {
        await client.query("RELEASE SAVEPOINT curr_import_sp");
      }
    }

    return {
      success: true,
      mode,
      manifestKey: manifest.manifestKey,
      counts,
      durationMs: Date.now() - startTime,
      errors,
      warnings,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    if (ownClient) {
      await client.query("ROLLBACK").catch(() => undefined);
    } else {
      await client.query("ROLLBACK TO SAVEPOINT curr_import_sp").catch(() => undefined);
    }
    const message = error instanceof Error ? error.message : String(error);
    errors.push(message);
    if (error instanceof CurriculumImportError) {
      throw error;
    }
    throw new CurriculumImportError(`Curriculum import failed: ${message}`, "MM305", error);
  } finally {
    if (ownClient && client) {
      await client.end().catch(() => undefined);
    }
  }
}
