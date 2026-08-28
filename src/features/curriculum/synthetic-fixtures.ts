import {
  curriculumApplicabilitySchema,
  curriculumLicenceEvidenceSchema,
  curriculumNodeSchema,
  curriculumReleaseSchema,
  curriculumSourceSchema,
} from "./contracts";

/**
 * Contract fixtures only. SYN-* codes and example.invalid URLs make them
 * impossible to mistake for imported authority data or publishable mappings.
 */
const SYNTHETIC_SHA256 = "0000000000000000000000000000000000000000000000000000000000000000";
const ALL_SECTORS = ["government", "catholic", "independent"] as const;

export const SYNTHETIC_LICENCE_EVIDENCE = curriculumLicenceEvidenceSchema.parse({
  schemaVersion: 1,
  evidenceId: "00000000-0000-4000-8000-000000000001",
  evidenceKey: "synthetic-evidence",
  licenceId: "synthetic-metadata-only",
  evidenceUrl: "https://example.invalid/licence-evidence",
  retrievedAt: "2026-08-28T00:00:00.000Z",
  evidenceFingerprint: SYNTHETIC_SHA256,
  permitsStorage: false,
  permitsDisplay: false,
  notes: "Synthetic contract fixture; not evidence for any real curriculum source.",
});
const DEFINITIONS = [
  {
    suffix: "001",
    authority: "syn-acara",
    jurisdiction: "AU",
    scope: "national",
    sourceKey: "syn-acara-v9",
    releaseKey: "syn-au-ac9",
    code: "SYN-AC9-Y3-M-N01",
    axis: { yearLevels: [3], levelCodes: [], bandCodes: [], stageCodes: [] },
  },
  {
    suffix: "002",
    authority: "syn-vcaa",
    jurisdiction: "VIC",
    scope: "state",
    sourceKey: "syn-vic-v2",
    releaseKey: "syn-vic-v2",
    code: "SYN-VIC-L3-M-N01",
    axis: { yearLevels: [3], levelCodes: ["SYN-VIC-L3"], bandCodes: [], stageCodes: [] },
  },
  {
    suffix: "003",
    authority: "syn-nesa",
    jurisdiction: "NSW",
    scope: "state",
    sourceKey: "syn-nsw-s2",
    releaseKey: "syn-nsw-s2",
    code: "SYN-NSW-S2-M-N01",
    axis: { yearLevels: [3, 4], levelCodes: [], bandCodes: [], stageCodes: ["SYN-NSW-S2"] },
  },
  {
    suffix: "004",
    authority: "syn-scsa",
    jurisdiction: "WA",
    scope: "state",
    sourceKey: "syn-wa-y3",
    releaseKey: "syn-wa-y3",
    code: "SYN-WA-Y3-M-N01",
    axis: { yearLevels: [3], levelCodes: [], bandCodes: [], stageCodes: [] },
  },
] as const;

function fixtureUuid(suffix: string, kind: "source" | "release" | "node" | "axis"): string {
  const digit = { source: "1", release: "2", node: "3", axis: "4" }[kind];
  return `00000000-0000-4${digit}00-8${digit}00-000000000${suffix}`;
}

export const SYNTHETIC_CURRICULUM_FIXTURES = DEFINITIONS.map((definition) => {
  const source = curriculumSourceSchema.parse({
    schemaVersion: 1,
    sourceId: fixtureUuid(definition.suffix, "source"),
    sourceKey: definition.sourceKey,
    authorityCode: definition.authority,
    authorityName: `Synthetic ${definition.jurisdiction} authority`,
    jurisdictionCode: definition.jurisdiction,
    schoolSectors: [...ALL_SECTORS],
    title: `Synthetic ${definition.jurisdiction} curriculum source`,
    sourceUrl: `https://example.invalid/${definition.sourceKey}`,
    retrievedAt: "2026-08-28T00:00:00.000Z",
    sourceFingerprint: SYNTHETIC_SHA256,
    licenceEvidenceId: SYNTHETIC_LICENCE_EVIDENCE.evidenceId,
    licence: {
      id: SYNTHETIC_LICENCE_EVIDENCE.licenceId,
      name: "Synthetic metadata-only fixture licence",
      officialTextAccess: "metadata_only",
    },
  });
  const release = curriculumReleaseSchema.parse({
    schemaVersion: 1,
    releaseId: fixtureUuid(definition.suffix, "release"),
    releaseKey: definition.releaseKey,
    sourceId: source.sourceId,
    frameworkScope: definition.scope,
    jurisdictionCode: definition.jurisdiction,
    schoolSectors: [...ALL_SECTORS],
    title: `Synthetic ${definition.jurisdiction} release`,
    version: "SYN-1",
    sourceFingerprint: SYNTHETIC_SHA256,
  });
  const node = curriculumNodeSchema.parse({
    schemaVersion: 1,
    nodeId: fixtureUuid(definition.suffix, "node"),
    releaseId: release.releaseId,
    nodeKey: definition.code.toLowerCase(),
    kind: "content_descriptor",
    officialCode: definition.code,
    label: "Synthetic number concept",
    sortOrder: 0,
  });
  const applicability = curriculumApplicabilitySchema.parse({
    schemaVersion: 1,
    applicabilityId: fixtureUuid(definition.suffix, "axis"),
    nodeId: node.nodeId,
    releaseId: release.releaseId,
    jurisdictionCode: definition.jurisdiction,
    schoolSectors: [...ALL_SECTORS],
    ...definition.axis,
  });

  return { licenceEvidence: SYNTHETIC_LICENCE_EVIDENCE, source, release, node, applicability };
});
