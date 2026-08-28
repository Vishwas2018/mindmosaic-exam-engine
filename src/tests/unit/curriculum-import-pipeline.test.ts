import type { Client } from "pg";
import { describe, expect, it } from "vitest";

import {
  CurriculumImportError,
  curriculumImportManifestSchema,
  importCurriculumManifest,
  SYNTHETIC_CONFLICTING_MANIFEST,
  SYNTHETIC_DISPLAY_LICENSED_MANIFEST,
  SYNTHETIC_NATIONAL_MANIFEST,
  SYNTHETIC_STORE_ONLY_MANIFEST,
  SYNTHETIC_VIC_MANIFEST,
} from "@/server/curriculum";

describe("curriculum import manifest — schema validation", () => {
  it("validates synthetic national and state manifests", () => {
    expect(curriculumImportManifestSchema.safeParse(SYNTHETIC_NATIONAL_MANIFEST).success).toBe(true);
    expect(curriculumImportManifestSchema.safeParse(SYNTHETIC_VIC_MANIFEST).success).toBe(true);
    expect(curriculumImportManifestSchema.safeParse(SYNTHETIC_DISPLAY_LICENSED_MANIFEST).success).toBe(true);
    expect(curriculumImportManifestSchema.safeParse(SYNTHETIC_STORE_ONLY_MANIFEST).success).toBe(true);
    expect(curriculumImportManifestSchema.safeParse(SYNTHETIC_CONFLICTING_MANIFEST).success).toBe(true);
  });

  it("detects and rejects hierarchy cycles in node tree", () => {
    const cyclicManifest = {
      ...SYNTHETIC_NATIONAL_MANIFEST,
      manifestKey: "syn-cyclic-manifest",
      nodes: [
        {
          schemaVersion: 1,
          nodeId: "40000000-0000-4000-8000-000000000001",
          releaseId: SYNTHETIC_NATIONAL_MANIFEST.releases[0]!.releaseId,
          parentNodeId: "40000000-0000-4000-8000-000000000002", // cycles with node 2
          nodeKey: "node-1",
          kind: "learning_area" as const,
          label: "Node 1",
          sortOrder: 1,
        },
        {
          schemaVersion: 1,
          nodeId: "40000000-0000-4000-8000-000000000002",
          releaseId: SYNTHETIC_NATIONAL_MANIFEST.releases[0]!.releaseId,
          parentNodeId: "40000000-0000-4000-8000-000000000001", // cycles with node 1
          nodeKey: "node-2",
          kind: "strand" as const,
          label: "Node 2",
          sortOrder: 2,
        },
      ],
      applicabilities: [
        {
          schemaVersion: 1,
          applicabilityId: "40000000-0000-4000-8000-000000000003",
          nodeId: "40000000-0000-4000-8000-000000000001",
          releaseId: SYNTHETIC_NATIONAL_MANIFEST.releases[0]!.releaseId,
          jurisdictionCode: "AU" as const,
          schoolSectors: ["government" as const],
          yearLevels: [3 as const],
          levelCodes: [],
          bandCodes: [],
          stageCodes: [],
        },
      ],
    };

    const result = curriculumImportManifestSchema.safeParse(cyclicManifest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("hierarchy cycle detected"))).toBe(true);
    }
  });

  it("detects unknown parent node references", () => {
    const invalidParentManifest = {
      ...SYNTHETIC_NATIONAL_MANIFEST,
      manifestKey: "syn-bad-parent-manifest",
      nodes: [
        {
          schemaVersion: 1,
          nodeId: "40000000-0000-4000-8000-000000000001",
          releaseId: SYNTHETIC_NATIONAL_MANIFEST.releases[0]!.releaseId,
          parentNodeId: "40000000-0000-4000-8000-999999999999", // non-existent parent
          nodeKey: "node-orphan",
          kind: "content_descriptor" as const,
          label: "Orphan node",
          sortOrder: 1,
        },
      ],
      applicabilities: [
        {
          schemaVersion: 1,
          applicabilityId: "40000000-0000-4000-8000-000000000003",
          nodeId: "40000000-0000-4000-8000-000000000001",
          releaseId: SYNTHETIC_NATIONAL_MANIFEST.releases[0]!.releaseId,
          jurisdictionCode: "AU" as const,
          schoolSectors: ["government" as const],
          yearLevels: [3 as const],
          levelCodes: [],
          bandCodes: [],
          stageCodes: [],
        },
      ],
    };

    const result = curriculumImportManifestSchema.safeParse(invalidParentManifest);
    expect(result.success).toBe(false);
  });
});

describe("curriculum import pipeline — validate-only & dry-run execution", () => {
  it("completes validate-only mode without database interaction", async () => {
    const report = await importCurriculumManifest(SYNTHETIC_NATIONAL_MANIFEST, {
      mode: "validate_only",
    });

    expect(report.success).toBe(true);
    expect(report.mode).toBe("validate_only");
    expect(report.manifestKey).toBe(SYNTHETIC_NATIONAL_MANIFEST.manifestKey);
    expect(report.counts.releasesSkipped).toBe(1);
    expect(report.counts.nodesSkipped).toBe(3);
  });

  it("fails validation when release fingerprint drifts from source fingerprint", async () => {
    const driftingManifest = {
      ...SYNTHETIC_NATIONAL_MANIFEST,
      manifestKey: "syn-drifting-fingerprint",
      releases: [
        {
          ...SYNTHETIC_NATIONAL_MANIFEST.releases[0]!,
          sourceFingerprint: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        },
      ],
    };

    await expect(
      importCurriculumManifest(driftingManifest, { mode: "validate_only" }),
    ).rejects.toThrowError(CurriculumImportError);
  });

  it("handles duplicate and conflict detection in mock client", async () => {
    const mockClient = {
      query: async (sql: string) => {
        if (sql === "BEGIN" || sql === "ROLLBACK" || sql === "COMMIT") {
          return { rows: [] };
        }
        if (sql.includes("FROM public.curriculum_licence_evidence")) {
          return { rows: [] };
        }
        if (sql.includes("FROM public.curriculum_sources")) {
          return { rows: [] };
        }
        if (sql.includes("FROM public.curriculum_releases")) {
          // Return conflicting release
          return {
            rows: [
              {
                id: SYNTHETIC_NATIONAL_MANIFEST.releases[0]!.releaseId,
                release_key: SYNTHETIC_NATIONAL_MANIFEST.releases[0]!.releaseKey,
                source_id: SYNTHETIC_NATIONAL_MANIFEST.releases[0]!.sourceId,
                framework_scope: "national",
                jurisdiction_code: "AU",
                school_sectors: ["government"],
                title: "Existing Title That Conflicts",
                release_version: "SYN-1.0-DIFFERENT",
                effective_from: null,
                effective_to: null,
                source_fingerprint: "0000000000000000000000000000000000000000000000000000000000000000",
                supersedes_release_id: null,
              },
            ],
          };
        }
        return { rows: [] };
      },
    } as unknown as Client;

    await expect(
      importCurriculumManifest(SYNTHETIC_NATIONAL_MANIFEST, {
        mode: "dry_run",
        client: mockClient,
      }),
    ).rejects.toMatchObject({
      name: "CurriculumImportError",
      code: "MM303",
    });
  });
});
