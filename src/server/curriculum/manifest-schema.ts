import { z } from "zod";

import {
  CURRICULUM_SCHEMA_VERSION,
  curriculumApplicabilitySchema,
  curriculumCrosswalkSchema,
  curriculumLicenceEvidenceSchema,
  curriculumNodeSchema,
  curriculumReleaseSchema,
  curriculumReviewEventSchema,
  curriculumSourceSchema,
  curriculumTaxonomyAlignmentSchema,
} from "@/features/curriculum/contracts";

const stableKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, "expected a stable lowercase identifier");

export const curriculumImportManifestSchema = z
  .object({
    $schema: z.string().optional(),
    schemaVersion: z.literal(CURRICULUM_SCHEMA_VERSION).default(CURRICULUM_SCHEMA_VERSION),
    manifestKey: stableKeySchema,
    title: z.string().trim().min(1).max(500),
    description: z.string().trim().min(1).max(5000).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    licenceEvidence: z.array(curriculumLicenceEvidenceSchema).min(1),
    sources: z.array(curriculumSourceSchema).min(1),
    releases: z.array(curriculumReleaseSchema).min(1),
    nodes: z.array(curriculumNodeSchema).min(1),
    applicabilities: z.array(curriculumApplicabilitySchema).min(1),
    crosswalks: z.array(curriculumCrosswalkSchema).default([]),
    taxonomyAlignments: z.array(curriculumTaxonomyAlignmentSchema).default([]),
    reviewEvents: z.array(curriculumReviewEventSchema).default([]),
  })
  .strict()
  .superRefine((manifest, context) => {
    // 1. Evidence uniqueness
    const evidenceIds = new Set<string>();
    const evidenceKeys = new Set<string>();
    for (let i = 0; i < manifest.licenceEvidence.length; i++) {
      const e = manifest.licenceEvidence[i]!;
      if (evidenceIds.has(e.evidenceId)) {
        context.addIssue({
          code: "custom",
          path: ["licenceEvidence", i, "evidenceId"],
          message: `duplicate evidence ID '${e.evidenceId}'`,
        });
      }
      evidenceIds.add(e.evidenceId);

      if (evidenceKeys.has(e.evidenceKey)) {
        context.addIssue({
          code: "custom",
          path: ["licenceEvidence", i, "evidenceKey"],
          message: `duplicate evidence key '${e.evidenceKey}'`,
        });
      }
      evidenceKeys.add(e.evidenceKey);
    }

    // 2. Source uniqueness and evidence reference
    const sourceIds = new Set<string>();
    const sourceKeys = new Set<string>();
    for (let i = 0; i < manifest.sources.length; i++) {
      const s = manifest.sources[i]!;
      if (sourceIds.has(s.sourceId)) {
        context.addIssue({
          code: "custom",
          path: ["sources", i, "sourceId"],
          message: `duplicate source ID '${s.sourceId}'`,
        });
      }
      sourceIds.add(s.sourceId);

      if (sourceKeys.has(s.sourceKey)) {
        context.addIssue({
          code: "custom",
          path: ["sources", i, "sourceKey"],
          message: `duplicate source key '${s.sourceKey}'`,
        });
      }
      sourceKeys.add(s.sourceKey);

      if (!evidenceIds.has(s.licenceEvidenceId)) {
        context.addIssue({
          code: "custom",
          path: ["sources", i, "licenceEvidenceId"],
          message: `source references unknown evidence '${s.licenceEvidenceId}'`,
        });
      }
    }

    // 3. Release uniqueness and source reference
    const releaseIds = new Set<string>();
    const releaseKeys = new Set<string>();
    for (let i = 0; i < manifest.releases.length; i++) {
      const r = manifest.releases[i]!;
      if (releaseIds.has(r.releaseId)) {
        context.addIssue({
          code: "custom",
          path: ["releases", i, "releaseId"],
          message: `duplicate release ID '${r.releaseId}'`,
        });
      }
      releaseIds.add(r.releaseId);

      if (releaseKeys.has(r.releaseKey)) {
        context.addIssue({
          code: "custom",
          path: ["releases", i, "releaseKey"],
          message: `duplicate release key '${r.releaseKey}'`,
        });
      }
      releaseKeys.add(r.releaseKey);

      if (!sourceIds.has(r.sourceId)) {
        context.addIssue({
          code: "custom",
          path: ["releases", i, "sourceId"],
          message: `release references unknown source '${r.sourceId}'`,
        });
      }
    }

    // 4. Node uniqueness and release/parent reference
    const nodeIds = new Set<string>();
    const nodeReleaseKeys = new Set<string>();
    for (let i = 0; i < manifest.nodes.length; i++) {
      const n = manifest.nodes[i]!;
      if (nodeIds.has(n.nodeId)) {
        context.addIssue({
          code: "custom",
          path: ["nodes", i, "nodeId"],
          message: `duplicate node ID '${n.nodeId}'`,
        });
      }
      nodeIds.add(n.nodeId);

      const scopedKey = `${n.releaseId}:${n.nodeKey}`;
      if (nodeReleaseKeys.has(scopedKey)) {
        context.addIssue({
          code: "custom",
          path: ["nodes", i, "nodeKey"],
          message: `duplicate node key '${n.nodeKey}' in release '${n.releaseId}'`,
        });
      }
      nodeReleaseKeys.add(scopedKey);

      if (!releaseIds.has(n.releaseId)) {
        context.addIssue({
          code: "custom",
          path: ["nodes", i, "releaseId"],
          message: `node references unknown release '${n.releaseId}'`,
        });
      }

      if (n.parentNodeId && !nodeIds.has(n.parentNodeId)) {
        const parentExists = manifest.nodes.some((other) => other.nodeId === n.parentNodeId);
        if (!parentExists) {
          context.addIssue({
            code: "custom",
            path: ["nodes", i, "parentNodeId"],
            message: `node '${n.nodeId}' references unknown parent node '${n.parentNodeId}'`,
          });
        }
      }
    }

    // 5. Hierarchy cycle detection
    const parentMap = new Map<string, string | undefined>();
    for (const node of manifest.nodes) {
      parentMap.set(node.nodeId, node.parentNodeId);
    }
    for (const node of manifest.nodes) {
      const visited = new Set<string>();
      let current: string | undefined = node.nodeId;
      while (current) {
        if (visited.has(current)) {
          context.addIssue({
            code: "custom",
            path: ["nodes"],
            message: `hierarchy cycle detected starting at node '${node.nodeId}'`,
          });
          break;
        }
        visited.add(current);
        current = parentMap.get(current);
      }
    }

    // 6. Applicability references
    for (let i = 0; i < manifest.applicabilities.length; i++) {
      const a = manifest.applicabilities[i]!;
      if (!releaseIds.has(a.releaseId)) {
        context.addIssue({
          code: "custom",
          path: ["applicabilities", i, "releaseId"],
          message: `applicability references unknown release '${a.releaseId}'`,
        });
      }
      if (!nodeIds.has(a.nodeId)) {
        context.addIssue({
          code: "custom",
          path: ["applicabilities", i, "nodeId"],
          message: `applicability references unknown node '${a.nodeId}'`,
        });
      }
    }

    // 7. Crosswalk references
    for (let i = 0; i < manifest.crosswalks.length; i++) {
      const cw = manifest.crosswalks[i]!;
      if (!releaseIds.has(cw.source.releaseId)) {
        context.addIssue({
          code: "custom",
          path: ["crosswalks", i, "source", "releaseId"],
          message: `crosswalk source references unknown release '${cw.source.releaseId}'`,
        });
      }
      if (!nodeIds.has(cw.source.nodeId)) {
        context.addIssue({
          code: "custom",
          path: ["crosswalks", i, "source", "nodeId"],
          message: `crosswalk source references unknown node '${cw.source.nodeId}'`,
        });
      }
    }

    // 8. Taxonomy alignment references
    for (let i = 0; i < manifest.taxonomyAlignments.length; i++) {
      const ta = manifest.taxonomyAlignments[i]!;
      if (!releaseIds.has(ta.curriculumReleaseId)) {
        context.addIssue({
          code: "custom",
          path: ["taxonomyAlignments", i, "curriculumReleaseId"],
          message: `taxonomy alignment references unknown release '${ta.curriculumReleaseId}'`,
        });
      }
      if (!nodeIds.has(ta.curriculumNodeId)) {
        context.addIssue({
          code: "custom",
          path: ["taxonomyAlignments", i, "curriculumNodeId"],
          message: `taxonomy alignment references unknown node '${ta.curriculumNodeId}'`,
        });
      }
    }
  });

export type CurriculumImportManifest = z.infer<typeof curriculumImportManifestSchema>;
