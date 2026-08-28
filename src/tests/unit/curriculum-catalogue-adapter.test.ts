import type { Client } from "pg";
import { describe, expect, it } from "vitest";

import {
  curriculumCatalogueQuerySchema,
  curriculumCatalogueResultSchema,
  SYNTHETIC_CURRICULUM_FIXTURES,
} from "@/features/curriculum";
import { PostgresCurriculumCatalogue } from "@/server/curriculum";

const NOW = "2026-08-28T00:00:00.000Z";
const HASH = "0000000000000000000000000000000000000000000000000000000000000000";

function createMockPgClient(
  queryHandler: (sql: string, params: readonly unknown[]) => Promise<{ rows: Record<string, unknown>[] }>,
): Client {
  return {
    query: async (sql: string, params: readonly unknown[]) => queryHandler(sql, params),
  } as unknown as Client;
}

describe("curriculum catalogue adapter — query schema & options", () => {
  it("defaults pagination and safety flags", () => {
    const parsed = curriculumCatalogueQuerySchema.parse({
      jurisdictionCode: "VIC",
      schoolSector: "government",
    });
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.pageSize).toBe(25);
    expect(parsed.coverage).toBe("any");
    expect(parsed.includeOfficialText).toBe(false);
    expect(parsed.cursor).toBeUndefined();
  });

  it("accepts all applicability axis filters", () => {
    const parsed = curriculumCatalogueQuerySchema.parse({
      jurisdictionCode: "NSW",
      schoolSector: "catholic",
      yearLevels: [3, 4],
      levelCodes: ["L3"],
      bandCodes: ["B3-4"],
      stageCodes: ["S2"],
      nodeKinds: ["content_descriptor", "achievement_standard"],
      coverage: "with_supporting_content",
      includeOfficialText: true,
      pageSize: 50,
    });
    expect(parsed.yearLevels).toEqual([3, 4]);
    expect(parsed.stageCodes).toEqual(["S2"]);
    expect(parsed.nodeKinds).toEqual(["content_descriptor", "achievement_standard"]);
    expect(parsed.coverage).toBe("with_supporting_content");
    expect(parsed.includeOfficialText).toBe(true);
  });

  it("rejects invalid or unknown query fields", () => {
    expect(
      curriculumCatalogueQuerySchema.safeParse({
        jurisdictionCode: "VIC",
        schoolSector: "government",
        unexpectedProperty: "leak",
      }).success,
    ).toBe(false);
  });
});

describe("curriculum catalogue adapter — projection & suppression boundary", () => {
  it("suppresses official text when includeOfficialText is false", async () => {
    const fixture = SYNTHETIC_CURRICULUM_FIXTURES[0]!;
    const mockClient = createMockPgClient(async (sql) => {
      if (sql.includes("count(DISTINCT n.id)")) {
        return { rows: [{ total: 1 }] };
      }
      return {
        rows: [
          {
            id: fixture.node.nodeId,
            release_id: fixture.release.releaseId,
            node_key: fixture.node.nodeKey,
            node_kind: fixture.node.kind,
            parent_node_id: null,
            official_code: fixture.node.officialCode,
            label: fixture.node.label,
            official_text: "Restricted official text",
            official_text_licence_id: fixture.source.licence.id,
            official_text_attribution: "Authority",
            sort_order: 1,
            release_key: fixture.release.releaseKey,
            release_schema_version: 1,
            source_id: fixture.source.sourceId,
            framework_scope: fixture.release.frameworkScope,
            release_jurisdiction_code: fixture.release.jurisdictionCode,
            release_school_sectors: fixture.release.schoolSectors,
            release_title: fixture.release.title,
            release_version: fixture.release.version,
            release_effective_from: null,
            release_effective_to: null,
            release_published_at: null,
            release_supersedes_release_id: null,
            release_source_fingerprint: HASH,
            source_id_val: fixture.source.sourceId,
            source_key: fixture.source.sourceKey,
            source_schema_version: 1,
            authority_code: fixture.source.authorityCode,
            authority_name: fixture.source.authorityName,
            source_jurisdiction_code: fixture.source.jurisdictionCode,
            source_school_sectors: fixture.source.schoolSectors,
            source_title: fixture.source.title,
            source_url: fixture.source.sourceUrl,
            source_retrieved_at: NOW,
            source_fingerprint: HASH,
            licence_evidence_id: fixture.licenceEvidence.evidenceId,
            source_licence_id: fixture.source.licence.id,
            licence_name: fixture.source.licence.name,
            licence_url: null,
            official_text_access: "metadata_only",
            source_attribution: "Authority",
            evidence_id: fixture.licenceEvidence.evidenceId,
            evidence_key: fixture.licenceEvidence.evidenceKey,
            evidence_schema_version: 1,
            evidence_licence_id: fixture.licenceEvidence.licenceId,
            evidence_url: fixture.licenceEvidence.evidenceUrl,
            evidence_retrieved_at: NOW,
            evidence_fingerprint: HASH,
            permits_storage: false,
            permits_display: false,
            evidence_notes: null,
            applicabilities: [
              {
                id: fixture.applicability.applicabilityId,
                release_id: fixture.release.releaseId,
                node_id: fixture.node.nodeId,
                jurisdiction_code: fixture.applicability.jurisdictionCode,
                school_sectors: fixture.applicability.schoolSectors,
                year_levels: fixture.applicability.yearLevels,
                level_codes: fixture.applicability.levelCodes,
                band_codes: fixture.applicability.bandCodes,
                stage_codes: fixture.applicability.stageCodes,
              },
            ],
            crosswalks: [],
            taxonomy_alignments: [],
          },
        ],
      };
    });

    const catalogue = new PostgresCurriculumCatalogue({ client: mockClient });
    const result = await catalogue.query({
      jurisdictionCode: "AU",
      schoolSector: "government",
      includeOfficialText: false,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.node.officialText).toBeUndefined();
    expect(curriculumCatalogueResultSchema.safeParse(result).success).toBe(true);
  });

  it("suppresses official text on metadata-only and store-only sources even if requested", async () => {
    const fixture = SYNTHETIC_CURRICULUM_FIXTURES[0]!;
    const mockClient = createMockPgClient(async (sql) => {
      if (sql.includes("count(DISTINCT n.id)")) {
        return { rows: [{ total: 1 }] };
      }
      return {
        rows: [
          {
            id: fixture.node.nodeId,
            release_id: fixture.release.releaseId,
            node_key: fixture.node.nodeKey,
            node_kind: fixture.node.kind,
            parent_node_id: null,
            official_code: fixture.node.officialCode,
            label: fixture.node.label,
            official_text: "Store only text",
            official_text_licence_id: fixture.source.licence.id,
            official_text_attribution: "Authority",
            sort_order: 1,
            release_key: fixture.release.releaseKey,
            release_schema_version: 1,
            source_id: fixture.source.sourceId,
            framework_scope: fixture.release.frameworkScope,
            release_jurisdiction_code: fixture.release.jurisdictionCode,
            release_school_sectors: fixture.release.schoolSectors,
            release_title: fixture.release.title,
            release_version: fixture.release.version,
            release_effective_from: null,
            release_effective_to: null,
            release_published_at: null,
            release_supersedes_release_id: null,
            release_source_fingerprint: HASH,
            source_id_val: fixture.source.sourceId,
            source_key: fixture.source.sourceKey,
            source_schema_version: 1,
            authority_code: fixture.source.authorityCode,
            authority_name: fixture.source.authorityName,
            source_jurisdiction_code: fixture.source.jurisdictionCode,
            source_school_sectors: fixture.source.schoolSectors,
            source_title: fixture.source.title,
            source_url: fixture.source.sourceUrl,
            source_retrieved_at: NOW,
            source_fingerprint: HASH,
            licence_evidence_id: fixture.licenceEvidence.evidenceId,
            source_licence_id: fixture.source.licence.id,
            licence_name: fixture.source.licence.name,
            licence_url: null,
            official_text_access: "store_only",
            source_attribution: "Authority",
            evidence_id: fixture.licenceEvidence.evidenceId,
            evidence_key: fixture.licenceEvidence.evidenceKey,
            evidence_schema_version: 1,
            evidence_licence_id: fixture.licenceEvidence.licenceId,
            evidence_url: fixture.licenceEvidence.evidenceUrl,
            evidence_retrieved_at: NOW,
            evidence_fingerprint: HASH,
            permits_storage: true,
            permits_display: false,
            evidence_notes: null,
            applicabilities: [
              {
                id: fixture.applicability.applicabilityId,
                release_id: fixture.release.releaseId,
                node_id: fixture.node.nodeId,
                jurisdiction_code: fixture.applicability.jurisdictionCode,
                school_sectors: fixture.applicability.schoolSectors,
                year_levels: fixture.applicability.yearLevels,
                level_codes: fixture.applicability.levelCodes,
                band_codes: fixture.applicability.bandCodes,
                stage_codes: fixture.applicability.stageCodes,
              },
            ],
            crosswalks: [],
            taxonomy_alignments: [],
          },
        ],
      };
    });

    const catalogue = new PostgresCurriculumCatalogue({ client: mockClient });
    const result = await catalogue.query({
      jurisdictionCode: "AU",
      schoolSector: "government",
      includeOfficialText: true,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.node.officialText).toBeUndefined();
  });

  it("returns official text only when display licence and verified evidence permit display", async () => {
    const fixture = SYNTHETIC_CURRICULUM_FIXTURES[0]!;
    const mockClient = createMockPgClient(async (sql) => {
      if (sql.includes("count(DISTINCT n.id)")) {
        return { rows: [{ total: 1 }] };
      }
      return {
        rows: [
          {
            id: fixture.node.nodeId,
            release_id: fixture.release.releaseId,
            node_key: fixture.node.nodeKey,
            node_kind: fixture.node.kind,
            parent_node_id: null,
            official_code: fixture.node.officialCode,
            label: fixture.node.label,
            official_text: "Display licensed text",
            official_text_licence_id: fixture.source.licence.id,
            official_text_attribution: "Licensed Authority",
            sort_order: 1,
            release_key: fixture.release.releaseKey,
            release_schema_version: 1,
            source_id: fixture.source.sourceId,
            framework_scope: fixture.release.frameworkScope,
            release_jurisdiction_code: fixture.release.jurisdictionCode,
            release_school_sectors: fixture.release.schoolSectors,
            release_title: fixture.release.title,
            release_version: fixture.release.version,
            release_effective_from: null,
            release_effective_to: null,
            release_published_at: null,
            release_supersedes_release_id: null,
            release_source_fingerprint: HASH,
            source_id_val: fixture.source.sourceId,
            source_key: fixture.source.sourceKey,
            source_schema_version: 1,
            authority_code: fixture.source.authorityCode,
            authority_name: fixture.source.authorityName,
            source_jurisdiction_code: fixture.source.jurisdictionCode,
            source_school_sectors: fixture.source.schoolSectors,
            source_title: fixture.source.title,
            source_url: fixture.source.sourceUrl,
            source_retrieved_at: NOW,
            source_fingerprint: HASH,
            licence_evidence_id: fixture.licenceEvidence.evidenceId,
            source_licence_id: fixture.source.licence.id,
            licence_name: fixture.source.licence.name,
            licence_url: null,
            official_text_access: "display",
            source_attribution: "Licensed Authority",
            evidence_id: fixture.licenceEvidence.evidenceId,
            evidence_key: fixture.licenceEvidence.evidenceKey,
            evidence_schema_version: 1,
            evidence_licence_id: fixture.licenceEvidence.licenceId,
            evidence_url: fixture.licenceEvidence.evidenceUrl,
            evidence_retrieved_at: NOW,
            evidence_fingerprint: HASH,
            permits_storage: true,
            permits_display: true,
            evidence_notes: null,
            applicabilities: [
              {
                id: fixture.applicability.applicabilityId,
                release_id: fixture.release.releaseId,
                node_id: fixture.node.nodeId,
                jurisdiction_code: fixture.applicability.jurisdictionCode,
                school_sectors: fixture.applicability.schoolSectors,
                year_levels: fixture.applicability.yearLevels,
                level_codes: fixture.applicability.levelCodes,
                band_codes: fixture.applicability.bandCodes,
                stage_codes: fixture.applicability.stageCodes,
              },
            ],
            crosswalks: [],
            taxonomy_alignments: [],
          },
        ],
      };
    });

    const catalogue = new PostgresCurriculumCatalogue({ client: mockClient });
    const result = await catalogue.query({
      jurisdictionCode: "AU",
      schoolSector: "government",
      includeOfficialText: true,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.node.officialText).toEqual({
      text: "Display licensed text",
      licenceId: fixture.source.licence.id,
      attribution: "Licensed Authority",
    });
  });

  it("fails closed on licence ID mismatch between node and source", async () => {
    const fixture = SYNTHETIC_CURRICULUM_FIXTURES[0]!;
    const mockClient = createMockPgClient(async (sql) => {
      if (sql.includes("count(DISTINCT n.id)")) {
        return { rows: [{ total: 1 }] };
      }
      return {
        rows: [
          {
            id: fixture.node.nodeId,
            release_id: fixture.release.releaseId,
            node_key: fixture.node.nodeKey,
            node_kind: fixture.node.kind,
            parent_node_id: null,
            official_code: fixture.node.officialCode,
            label: fixture.node.label,
            official_text: "Mismatched licence text",
            official_text_licence_id: "different-licence-id", // mismatched from source licence
            official_text_attribution: "Authority",
            sort_order: 1,
            release_key: fixture.release.releaseKey,
            release_schema_version: 1,
            source_id: fixture.source.sourceId,
            framework_scope: fixture.release.frameworkScope,
            release_jurisdiction_code: fixture.release.jurisdictionCode,
            release_school_sectors: fixture.release.schoolSectors,
            release_title: fixture.release.title,
            release_version: fixture.release.version,
            release_effective_from: null,
            release_effective_to: null,
            release_published_at: null,
            release_supersedes_release_id: null,
            release_source_fingerprint: HASH,
            source_id_val: fixture.source.sourceId,
            source_key: fixture.source.sourceKey,
            source_schema_version: 1,
            authority_code: fixture.source.authorityCode,
            authority_name: fixture.source.authorityName,
            source_jurisdiction_code: fixture.source.jurisdictionCode,
            source_school_sectors: fixture.source.schoolSectors,
            source_title: fixture.source.title,
            source_url: fixture.source.sourceUrl,
            source_retrieved_at: NOW,
            source_fingerprint: HASH,
            licence_evidence_id: fixture.licenceEvidence.evidenceId,
            source_licence_id: fixture.source.licence.id,
            licence_name: fixture.source.licence.name,
            licence_url: null,
            official_text_access: "display",
            source_attribution: "Authority",
            evidence_id: fixture.licenceEvidence.evidenceId,
            evidence_key: fixture.licenceEvidence.evidenceKey,
            evidence_schema_version: 1,
            evidence_licence_id: fixture.licenceEvidence.licenceId,
            evidence_url: fixture.licenceEvidence.evidenceUrl,
            evidence_retrieved_at: NOW,
            evidence_fingerprint: HASH,
            permits_storage: true,
            permits_display: true,
            evidence_notes: null,
            applicabilities: [
              {
                id: fixture.applicability.applicabilityId,
                release_id: fixture.release.releaseId,
                node_id: fixture.node.nodeId,
                jurisdiction_code: fixture.applicability.jurisdictionCode,
                school_sectors: fixture.applicability.schoolSectors,
                year_levels: fixture.applicability.yearLevels,
                level_codes: fixture.applicability.levelCodes,
                band_codes: fixture.applicability.bandCodes,
                stage_codes: fixture.applicability.stageCodes,
              },
            ],
            crosswalks: [],
            taxonomy_alignments: [],
          },
        ],
      };
    });

    const catalogue = new PostgresCurriculumCatalogue({ client: mockClient });
    const result = await catalogue.query({
      jurisdictionCode: "AU",
      schoolSector: "government",
      includeOfficialText: true,
    });

    // Mismatched licence ID strips official text to fail closed
    expect(result.items[0]!.node.officialText).toBeUndefined();
    expect(curriculumCatalogueResultSchema.safeParse(result).success).toBe(true);
  });
});

describe("curriculum catalogue adapter — getRelease", () => {
  it("returns parsed release when found", async () => {
    const fixture = SYNTHETIC_CURRICULUM_FIXTURES[0]!;
    const mockClient = createMockPgClient(async () => ({
      rows: [
        {
          id: fixture.release.releaseId,
          release_key: fixture.release.releaseKey,
          schema_version: 1,
          source_id: fixture.source.sourceId,
          framework_scope: fixture.release.frameworkScope,
          jurisdiction_code: fixture.release.jurisdictionCode,
          school_sectors: fixture.release.schoolSectors,
          title: fixture.release.title,
          release_version: fixture.release.version,
          effective_from: null,
          effective_to: null,
          published_at: null,
          supersedes_release_id: null,
          source_fingerprint: HASH,
        },
      ],
    }));

    const catalogue = new PostgresCurriculumCatalogue({ client: mockClient });
    const release = await catalogue.getRelease(fixture.release.releaseId);
    expect(release).not.toBeNull();
    expect(release!.releaseKey).toBe(fixture.release.releaseKey);
  });

  it("returns null when release is not found", async () => {
    const mockClient = createMockPgClient(async () => ({ rows: [] }));
    const catalogue = new PostgresCurriculumCatalogue({ client: mockClient });
    const release = await catalogue.getRelease("00000000-0000-4000-8000-000000000000");
    expect(release).toBeNull();
  });
});
