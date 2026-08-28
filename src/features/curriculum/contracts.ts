import { z } from "zod";

import { yearLevelSchema } from "@/schemas/question.schema";

import {
  australianJurisdictionCodeSchema,
  schoolSectorSchema,
} from "./jurisdictions";

export const CURRICULUM_SCHEMA_VERSION = 1 as const;
const curriculumSchemaVersionSchema = z.literal(CURRICULUM_SCHEMA_VERSION);

const uuidSchema = z.string().uuid();
const sha256Schema = z.string().regex(/^[0-9a-f]{64}$/, "expected a lowercase SHA-256 digest");
const dateSchema = z.iso.date();
const dateTimeSchema = z.iso.datetime({ offset: true });
const stableKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, "expected a stable lowercase identifier");
const boundedCodeSchema = z.string().trim().min(1).max(120);
const httpUrlSchema = z
  .string()
  .url()
  .refine((value) => value.startsWith("https://") || value.startsWith("http://"), {
    message: "expected an HTTP(S) URL",
  });

function unique<T>(values: readonly T[]): boolean {
  return new Set(values).size === values.length;
}

const uniqueYearLevelsSchema = z
  .array(yearLevelSchema)
  .max(12)
  .refine(unique, "year levels must be unique");
const uniqueCodesSchema = z
  .array(boundedCodeSchema)
  .max(24)
  .refine(unique, "codes must be unique");
const uniqueSectorsSchema = z
  .array(schoolSectorSchema)
  .min(1)
  .max(3)
  .refine(unique, "school sectors must be unique");

export const officialTextAccessSchema = z.enum(["metadata_only", "store_only", "display"]);
export const curriculumLicenceSchema = z
  .object({
    id: z.string().trim().min(1).max(160),
    name: z.string().trim().min(1).max(240),
    url: httpUrlSchema.optional(),
    officialTextAccess: officialTextAccessSchema,
    attribution: z.string().trim().min(1).max(2000).optional(),
  })
  .strict();

/** Evidence for the uses MindMosaic is permitted to make of one source. */
export const curriculumLicenceEvidenceSchema = z
  .object({
    schemaVersion: curriculumSchemaVersionSchema,
    evidenceId: uuidSchema,
    evidenceKey: stableKeySchema,
    licenceId: z.string().trim().min(1).max(160),
    evidenceUrl: httpUrlSchema,
    retrievedAt: dateTimeSchema,
    evidenceFingerprint: sha256Schema,
    permitsStorage: z.boolean(),
    permitsDisplay: z.boolean(),
    notes: z.string().trim().min(1).max(5000).optional(),
  })
  .strict()
  .superRefine((evidence, context) => {
    if (evidence.permitsDisplay && !evidence.permitsStorage) {
      context.addIssue({
        code: "custom",
        path: ["permitsDisplay"],
        message: "display permission requires storage permission",
      });
    }
  });
export type CurriculumLicenceEvidence = z.infer<typeof curriculumLicenceEvidenceSchema>;

/** A retrieved authoritative source snapshot, not a mutable "current URL" pointer. */
export const curriculumSourceSchema = z
  .object({
    schemaVersion: curriculumSchemaVersionSchema,
    sourceId: uuidSchema,
    sourceKey: stableKeySchema,
    authorityCode: stableKeySchema,
    authorityName: z.string().trim().min(1).max(240),
    jurisdictionCode: australianJurisdictionCodeSchema,
    schoolSectors: uniqueSectorsSchema,
    title: z.string().trim().min(1).max(500),
    sourceUrl: httpUrlSchema,
    retrievedAt: dateTimeSchema,
    sourceFingerprint: sha256Schema,
    licenceEvidenceId: uuidSchema,
    licence: curriculumLicenceSchema,
  })
  .strict();
export type CurriculumSource = z.infer<typeof curriculumSourceSchema>;

export const curriculumFrameworkScopeSchema = z.enum(["national", "state", "territory"]);

/** Separate from assessment-delivery `framework_versions`. */
export const curriculumReleaseSchema = z
  .object({
    schemaVersion: curriculumSchemaVersionSchema,
    releaseId: uuidSchema,
    releaseKey: stableKeySchema,
    sourceId: uuidSchema,
    frameworkScope: curriculumFrameworkScopeSchema,
    jurisdictionCode: australianJurisdictionCodeSchema,
    schoolSectors: uniqueSectorsSchema,
    title: z.string().trim().min(1).max(500),
    version: z.string().trim().min(1).max(120),
    effectiveFrom: dateSchema.optional(),
    effectiveTo: dateSchema.optional(),
    publishedAt: dateTimeSchema.optional(),
    supersedesReleaseId: uuidSchema.optional(),
    sourceFingerprint: sha256Schema,
  })
  .strict()
  .superRefine((release, context) => {
    if (release.effectiveFrom && release.effectiveTo && release.effectiveTo < release.effectiveFrom) {
      context.addIssue({
        code: "custom",
        path: ["effectiveTo"],
        message: "effectiveTo must not precede effectiveFrom",
      });
    }
    if (release.supersedesReleaseId === release.releaseId) {
      context.addIssue({
        code: "custom",
        path: ["supersedesReleaseId"],
        message: "a release cannot supersede itself",
      });
    }
    if (release.frameworkScope === "national" && release.jurisdictionCode !== "AU") {
      context.addIssue({
        code: "custom",
        path: ["jurisdictionCode"],
        message: "a national release must use jurisdiction AU",
      });
    }
    if (release.frameworkScope !== "national" && release.jurisdictionCode === "AU") {
      context.addIssue({
        code: "custom",
        path: ["jurisdictionCode"],
        message: "a state or territory release must identify that jurisdiction",
      });
    }
  });
export type CurriculumRelease = z.infer<typeof curriculumReleaseSchema>;

export const CURRICULUM_NODE_KINDS = [
  "year",
  "level",
  "band",
  "stage",
  "learning_area",
  "discipline",
  "strand",
  "sub_strand",
  "content_descriptor",
  "achievement_standard",
] as const;
export const curriculumNodeKindSchema = z.enum(CURRICULUM_NODE_KINDS);

const licensedOfficialTextSchema = z
  .object({
    text: z.string().trim().min(1).max(50_000),
    licenceId: z.string().trim().min(1).max(160),
    attribution: z.string().trim().min(1).max(2000),
  })
  .strict();

export const curriculumNodeSchema = z
  .object({
    schemaVersion: curriculumSchemaVersionSchema,
    nodeId: uuidSchema,
    releaseId: uuidSchema,
    nodeKey: stableKeySchema,
    kind: curriculumNodeKindSchema,
    parentNodeId: uuidSchema.optional(),
    officialCode: z.string().trim().min(1).max(160).optional(),
    label: z.string().trim().min(1).max(1000),
    officialText: licensedOfficialTextSchema.optional(),
    sortOrder: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((node, context) => {
    if (node.parentNodeId === node.nodeId) {
      context.addIssue({
        code: "custom",
        path: ["parentNodeId"],
        message: "a curriculum node cannot parent itself",
      });
    }
  });
export type CurriculumNode = z.infer<typeof curriculumNodeSchema>;

/**
 * Year, level, band and NSW-style stage are parallel applicability axes.
 * A source can supply any combination without pretending the axes are equal.
 */
export const curriculumApplicabilitySchema = z
  .object({
    schemaVersion: curriculumSchemaVersionSchema,
    applicabilityId: uuidSchema,
    nodeId: uuidSchema,
    releaseId: uuidSchema,
    jurisdictionCode: australianJurisdictionCodeSchema,
    schoolSectors: uniqueSectorsSchema,
    yearLevels: uniqueYearLevelsSchema,
    levelCodes: uniqueCodesSchema,
    bandCodes: uniqueCodesSchema,
    stageCodes: uniqueCodesSchema,
    effectiveFrom: dateSchema.optional(),
    effectiveTo: dateSchema.optional(),
  })
  .strict()
  .superRefine((applicability, context) => {
    if (
      applicability.yearLevels.length === 0 &&
      applicability.levelCodes.length === 0 &&
      applicability.bandCodes.length === 0 &&
      applicability.stageCodes.length === 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["yearLevels"],
        message: "at least one year, level, band or stage must be supplied",
      });
    }
    if (
      applicability.effectiveFrom &&
      applicability.effectiveTo &&
      applicability.effectiveTo < applicability.effectiveFrom
    ) {
      context.addIssue({
        code: "custom",
        path: ["effectiveTo"],
        message: "effectiveTo must not precede effectiveFrom",
      });
    }
  });
export type CurriculumApplicability = z.infer<typeof curriculumApplicabilitySchema>;

export const CURRICULUM_RELATIONS = [
  "exact",
  "equivalent",
  "broader",
  "narrower",
  "related",
  "unmapped",
] as const;
export const curriculumRelationSchema = z.enum(CURRICULUM_RELATIONS);
export type CurriculumRelation = z.infer<typeof curriculumRelationSchema>;

export const curriculumReviewStatusSchema = z.enum([
  "draft",
  "in_review",
  "approved",
  "rejected",
]);
export const CURRICULUM_REVIEW_TRANSITIONS = {
  draft: ["in_review"],
  in_review: ["approved", "rejected"],
  approved: [],
  rejected: [],
} as const satisfies Record<
  z.infer<typeof curriculumReviewStatusSchema>,
  readonly z.infer<typeof curriculumReviewStatusSchema>[]
>;

export function isCurriculumReviewTransition(
  from: z.infer<typeof curriculumReviewStatusSchema> | null,
  to: z.infer<typeof curriculumReviewStatusSchema>,
): boolean {
  if (from === null) return to === "draft";
  return (CURRICULUM_REVIEW_TRANSITIONS[from] as readonly string[]).includes(to);
}

export const curriculumReviewEventSchema = z
  .object({
    schemaVersion: curriculumSchemaVersionSchema,
    eventId: uuidSchema,
    entityKind: z.enum(["release", "node", "crosswalk", "taxonomy_alignment"]),
    entityId: uuidSchema,
    status: curriculumReviewStatusSchema,
    reviewerId: z.string().trim().min(1).max(200).optional(),
    notes: z.string().trim().min(1).max(5000).optional(),
    evidenceHash: sha256Schema.optional(),
    createdAt: dateTimeSchema,
  })
  .strict()
  .superRefine((event, context) => {
    const decided = event.status === "approved" || event.status === "rejected";
    if (decided && !event.reviewerId) {
      context.addIssue({
        code: "custom",
        path: ["reviewerId"],
        message: "approved/rejected events require a reviewer",
      });
    }
  });
export type CurriculumReviewEvent = z.infer<typeof curriculumReviewEventSchema>;
const curriculumReviewRefSchema = z
  .object({
    status: curriculumReviewStatusSchema,
    reviewedBy: z.string().trim().min(1).max(200).optional(),
    reviewedAt: dateTimeSchema.optional(),
  })
  .strict()
  .superRefine((review, context) => {
    const decided = review.status === "approved" || review.status === "rejected";
    if (decided !== Boolean(review.reviewedBy && review.reviewedAt)) {
      context.addIssue({
        code: "custom",
        path: ["reviewedBy"],
        message: "approved/rejected reviews require reviewer identity and timestamp only",
      });
    }
  });

const relationTargetSchema = z
  .object({
    releaseId: uuidSchema,
    nodeId: uuidSchema,
  })
  .strict();

/** `broader` means the source node is broader than the target; `narrower` is the inverse. */
export const curriculumCrosswalkSchema = z
  .object({
    schemaVersion: curriculumSchemaVersionSchema,
    crosswalkId: uuidSchema,
    source: relationTargetSchema,
    target: relationTargetSchema.nullable(),
    relation: curriculumRelationSchema,
    confidence: z.number().min(0).max(1),
    rationale: z.string().trim().min(1).max(5000),
    provenance: z
      .object({
        method: z.enum(["human_review", "structured_import", "machine_suggested_human_reviewed"]),
        sourceUrl: httpUrlSchema,
        retrievedAt: dateTimeSchema,
      })
      .strict(),
    review: curriculumReviewRefSchema,
    supersedesCrosswalkId: uuidSchema.optional(),
  })
  .strict()
  .superRefine((crosswalk, context) => {
    if ((crosswalk.relation === "unmapped") !== (crosswalk.target === null)) {
      context.addIssue({
        code: "custom",
        path: ["target"],
        message: "only an unmapped crosswalk may omit its target",
      });
    }
    if (
      crosswalk.target?.releaseId === crosswalk.source.releaseId &&
      crosswalk.target.nodeId === crosswalk.source.nodeId
    ) {
      context.addIssue({
        code: "custom",
        path: ["target"],
        message: "a crosswalk cannot target the same node",
      });
    }
  });
export type CurriculumCrosswalk = z.infer<typeof curriculumCrosswalkSchema>;

export const curriculumTaxonomyAlignmentSchema = z
  .object({
    schemaVersion: curriculumSchemaVersionSchema,
    alignmentId: uuidSchema,
    curriculumReleaseId: uuidSchema,
    curriculumNodeId: uuidSchema,
    taxonomyId: stableKeySchema,
    taxonomyVersion: z.string().trim().min(1).max(120),
    taxonomyNodeId: stableKeySchema.nullable(),
    relation: curriculumRelationSchema,
    rationale: z.string().trim().min(1).max(5000),
    provenance: z
      .object({
        alignedBy: z.string().trim().min(1).max(200),
        alignedAt: dateTimeSchema,
      })
      .strict(),
    review: curriculumReviewRefSchema,
    supersedesAlignmentId: uuidSchema.optional(),
  })
  .strict()
  .superRefine((alignment, context) => {
    if ((alignment.relation === "unmapped") !== (alignment.taxonomyNodeId === null)) {
      context.addIssue({
        code: "custom",
        path: ["taxonomyNodeId"],
        message: "only an unmapped alignment may omit its taxonomy node",
      });
    }
  });
export type CurriculumTaxonomyAlignment = z.infer<
  typeof curriculumTaxonomyAlignmentSchema
>;

export const learnerCurriculumPreferenceSchema = z
  .object({
    jurisdictionCode: australianJurisdictionCodeSchema,
    schoolSector: schoolSectorSchema,
  })
  .strict();
export type LearnerCurriculumPreference = z.infer<
  typeof learnerCurriculumPreferenceSchema
>;

export const curriculumCoverageSchema = z
  .object({
    status: z.enum(["not_assessed", "none", "partial", "covered"]),
    supportingContentCount: z.number().int().nonnegative(),
    policyId: stableKeySchema,
    computedAt: dateTimeSchema,
  })
  .strict()
  .superRefine((coverage, context) => {
    if (
      (coverage.status === "none" || coverage.status === "not_assessed") &&
      coverage.supportingContentCount !== 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["supportingContentCount"],
        message: `${coverage.status} coverage must have zero supporting content`,
      });
    }
    if (
      (coverage.status === "partial" || coverage.status === "covered") &&
      coverage.supportingContentCount === 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["supportingContentCount"],
        message: `${coverage.status} coverage requires supporting content`,
      });
    }
  });
export type CurriculumCoverage = z.infer<typeof curriculumCoverageSchema>;

export const curriculumCatalogueQuerySchema = z
  .object({
    schemaVersion: curriculumSchemaVersionSchema.default(CURRICULUM_SCHEMA_VERSION),
    jurisdictionCode: australianJurisdictionCodeSchema,
    schoolSector: schoolSectorSchema,
    releaseIds: z.array(uuidSchema).max(20).refine(unique, "release ids must be unique").optional(),
    yearLevels: uniqueYearLevelsSchema.optional(),
    levelCodes: uniqueCodesSchema.optional(),
    bandCodes: uniqueCodesSchema.optional(),
    stageCodes: uniqueCodesSchema.optional(),
    nodeKinds: z
      .array(curriculumNodeKindSchema)
      .max(CURRICULUM_NODE_KINDS.length)
      .refine(unique, "node kinds must be unique")
      .optional(),
    parentNodeId: uuidSchema.optional(),
    coverage: z.enum(["any", "with_supporting_content", "without_supporting_content"]).default("any"),
    includeOfficialText: z.boolean().default(false),
    cursor: z.string().trim().min(1).max(500).optional(),
    pageSize: z.number().int().min(1).max(100).default(25),
  })
  .strict();
export type CurriculumCatalogueQuery = z.infer<typeof curriculumCatalogueQuerySchema>;

export const curriculumCatalogueItemSchema = z
  .object({
    licenceEvidence: curriculumLicenceEvidenceSchema,
    source: curriculumSourceSchema,
    release: curriculumReleaseSchema,
    node: curriculumNodeSchema,
    applicability: z.array(curriculumApplicabilitySchema).min(1).max(24),
    crosswalks: z.array(curriculumCrosswalkSchema).max(100),
    taxonomyAlignments: z.array(curriculumTaxonomyAlignmentSchema).max(100),
    coverage: curriculumCoverageSchema,
  })
  .strict()
  .superRefine((item, context) => {
    if (item.source.licenceEvidenceId !== item.licenceEvidence.evidenceId) {
      context.addIssue({
        code: "custom",
        path: ["source", "licenceEvidenceId"],
        message: "source/licence evidence mismatch",
      });
    }
    if (item.source.licence.id !== item.licenceEvidence.licenceId) {
      context.addIssue({
        code: "custom",
        path: ["source", "licence", "id"],
        message: "source licence does not match its evidence",
      });
    }
    const access = item.source.licence.officialTextAccess;
    if (access !== "metadata_only" && !item.licenceEvidence.permitsStorage) {
      context.addIssue({
        code: "custom",
        path: ["licenceEvidence", "permitsStorage"],
        message: "source declares text storage without supporting evidence",
      });
    }
    if (access === "display" && !item.licenceEvidence.permitsDisplay) {
      context.addIssue({
        code: "custom",
        path: ["licenceEvidence", "permitsDisplay"],
        message: "source declares display access without supporting evidence",
      });
    }
    if (item.release.sourceId !== item.source.sourceId) {
      context.addIssue({ code: "custom", path: ["release", "sourceId"], message: "release/source mismatch" });
    }
    if (item.release.jurisdictionCode !== item.source.jurisdictionCode) {
      context.addIssue({
        code: "custom",
        path: ["release", "jurisdictionCode"],
        message: "release jurisdiction must match its source",
      });
    }
    if (!item.release.schoolSectors.every((sector) => item.source.schoolSectors.includes(sector))) {
      context.addIssue({
        code: "custom",
        path: ["release", "schoolSectors"],
        message: "release sectors must be a subset of source sectors",
      });
    }
    if (item.node.releaseId !== item.release.releaseId) {
      context.addIssue({ code: "custom", path: ["node", "releaseId"], message: "node/release mismatch" });
    }
    if (item.node.officialText) {
      if (item.source.licence.officialTextAccess !== "display") {
        context.addIssue({
          code: "custom",
          path: ["node", "officialText"],
          message: "official text may be returned only under a display licence",
        });
      }
      if (item.node.officialText.licenceId !== item.source.licence.id) {
        context.addIssue({
          code: "custom",
          path: ["node", "officialText", "licenceId"],
          message: "official text must cite the source licence",
        });
      }
    }
  });
export type CurriculumCatalogueItem = z.infer<typeof curriculumCatalogueItemSchema>;

export const curriculumCatalogueResultSchema = z
  .object({
    schemaVersion: curriculumSchemaVersionSchema,
    query: curriculumCatalogueQuerySchema,
    items: z.array(curriculumCatalogueItemSchema).max(100),
    total: z.number().int().nonnegative(),
    nextCursor: z.string().trim().min(1).max(500).nullable(),
  })
  .strict()
  .superRefine((result, context) => {
    if (!result.query.includeOfficialText) {
      result.items.forEach((item, index) => {
        if (item.node.officialText) {
          context.addIssue({
            code: "custom",
            path: ["items", index, "node", "officialText"],
            message: "official text was not requested",
          });
        }
      });
    }
  });
export type CurriculumCatalogueResult = z.infer<typeof curriculumCatalogueResultSchema>;
