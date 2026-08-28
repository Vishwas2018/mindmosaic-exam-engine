import { describe, expect, it } from "vitest";

import {
  AUSTRALIAN_JURISDICTIONS,
  AUSTRALIAN_JURISDICTION_CODES,
  CURRICULUM_RELATIONS,
  SCHOOL_SECTORS,
  SYNTHETIC_CURRICULUM_FIXTURES,
  curriculumApplicabilitySchema,
  curriculumCatalogueItemSchema,
  curriculumCrosswalkSchema,
  curriculumLicenceEvidenceSchema,
  curriculumReviewEventSchema,
  curriculumSourceSchema,
  isCurriculumReviewTransition,
} from "@/features/curriculum";

const NOW = "2026-08-28T00:00:00.000Z";
const UUID_A = "10000000-0000-4000-8000-000000000001";
const UUID_B = "10000000-0000-4000-8000-000000000002";

describe("curriculum platform contracts", () => {
  it("registers AU and all eight states and territories with every sector", () => {
    expect(AUSTRALIAN_JURISDICTIONS.map(({ code }) => code)).toEqual([
      ...AUSTRALIAN_JURISDICTION_CODES,
    ]);
    expect(AUSTRALIAN_JURISDICTIONS).toHaveLength(9);
    for (const jurisdiction of AUSTRALIAN_JURISDICTIONS) {
      expect(jurisdiction.schoolSectors).toEqual([...SCHOOL_SECTORS]);
    }
  });

  it("rejects unknown source and licence-evidence keys", () => {
    const fixture = SYNTHETIC_CURRICULUM_FIXTURES[0]!;
    expect(curriculumSourceSchema.safeParse({ ...fixture.source, surprise: true }).success).toBe(false);
    expect(
      curriculumLicenceEvidenceSchema.safeParse({
        ...fixture.licenceEvidence,
        unsupportedPermission: true,
      }).success,
    ).toBe(false);
  });

  it("keeps year, level, band and stage as independent applicability axes", () => {
    const base = {
      schemaVersion: 1,
      applicabilityId: UUID_A,
      nodeId: UUID_A,
      releaseId: UUID_B,
      jurisdictionCode: "VIC",
      schoolSectors: ["government"],
      effectiveFrom: "2026-01-01",
    };
    for (const axes of [
      { yearLevels: [3], levelCodes: [], bandCodes: [], stageCodes: [] },
      { yearLevels: [], levelCodes: ["L3"], bandCodes: [], stageCodes: [] },
      { yearLevels: [], levelCodes: [], bandCodes: ["L3-4"], stageCodes: [] },
      { yearLevels: [], levelCodes: [], bandCodes: [], stageCodes: ["S2"] },
    ]) {
      expect(curriculumApplicabilitySchema.safeParse({ ...base, ...axes }).success).toBe(true);
    }
    expect(
      curriculumApplicabilitySchema.safeParse({
        ...base,
        yearLevels: [],
        levelCodes: [],
        bandCodes: [],
        stageCodes: [],
      }).success,
    ).toBe(false);
  });

  it("supports all directional relations and only allows an absent target for unmapped", () => {
    for (const relation of CURRICULUM_RELATIONS) {
      const target = relation === "unmapped" ? null : { releaseId: UUID_B, nodeId: UUID_B };
      expect(
        curriculumCrosswalkSchema.safeParse({
          schemaVersion: 1,
          crosswalkId: "10000000-0000-4000-8000-000000000003",
          source: { releaseId: UUID_A, nodeId: UUID_A },
          target,
          relation,
          confidence: 0.8,
          rationale: "Synthetic relationship for contract testing.",
          provenance: {
            method: "human_review",
            sourceUrl: "https://example.invalid/crosswalk",
            retrievedAt: NOW,
          },
          review: { status: "draft" },
        }).success,
      ).toBe(true);
    }
  });

  it("models a terminal draft-to-review-to-decision lifecycle", () => {
    expect(isCurriculumReviewTransition(null, "draft")).toBe(true);
    expect(isCurriculumReviewTransition("draft", "in_review")).toBe(true);
    expect(isCurriculumReviewTransition("in_review", "approved")).toBe(true);
    expect(isCurriculumReviewTransition("in_review", "rejected")).toBe(true);
    expect(isCurriculumReviewTransition("approved", "draft")).toBe(false);
    expect(isCurriculumReviewTransition("rejected", "in_review")).toBe(false);
    expect(
      curriculumReviewEventSchema.safeParse({
        schemaVersion: 1,
        eventId: UUID_A,
        entityKind: "node",
        entityId: UUID_B,
        status: "approved",
        createdAt: NOW,
      }).success,
    ).toBe(false);
  });

  it("keeps descriptors valid with zero supporting content", () => {
    const fixture = SYNTHETIC_CURRICULUM_FIXTURES[0]!;
    const item = {
      ...fixture,
      applicability: [fixture.applicability],
      crosswalks: [],
      taxonomyAlignments: [],
      coverage: {
        status: "none",
        supportingContentCount: 0,
        policyId: "synthetic-coverage-v1",
        computedAt: NOW,
      },
    };
    expect(curriculumCatalogueItemSchema.safeParse(item).success).toBe(true);
    expect(
      curriculumCatalogueItemSchema.safeParse({
        ...item,
        node: {
          ...item.node,
          officialText: {
            text: "Synthetic official text",
            licenceId: item.source.licence.id,
            attribution: "Synthetic attribution",
          },
        },
      }).success,
    ).toBe(false);
  });

  it("keeps national, Victorian, NSW and WA releases distinct", () => {
    expect(SYNTHETIC_CURRICULUM_FIXTURES.map(({ release }) => release.jurisdictionCode)).toEqual([
      "AU",
      "VIC",
      "NSW",
      "WA",
    ]);
    expect(new Set(SYNTHETIC_CURRICULUM_FIXTURES.map(({ release }) => release.releaseId)).size).toBe(4);
  });

  it("rejects source/release jurisdiction drift", () => {
    const fixture = SYNTHETIC_CURRICULUM_FIXTURES[1]!;
    const item = {
      ...fixture,
      release: { ...fixture.release, jurisdictionCode: "NSW" },
      applicability: [fixture.applicability],
      crosswalks: [],
      taxonomyAlignments: [],
      coverage: {
        status: "not_assessed",
        supportingContentCount: 0,
        policyId: "synthetic-coverage-v1",
        computedAt: NOW,
      },
    };
    expect(curriculumCatalogueItemSchema.safeParse(item).success).toBe(false);
  });
});
