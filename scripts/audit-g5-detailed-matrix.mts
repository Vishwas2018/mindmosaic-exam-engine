import "./lib/allow-server-only.mts";
import fs from "node:fs";
import { getExamBank } from "@/server/exam-bank";
import {
  extractQuestionIdsFromAlignments,
  gatedPracticeCoverageResolver,
} from "@/server/curriculum/gated-practice-coverage";
import { resolveCoverageBadge } from "@/features/curriculum/parent-content";

interface ManifestNode {
  nodeId: string;
  officialCode: string;
  label: string;
  kind: string;
}

interface TaxonomyAlignment {
  curriculumNodeId: string;
  taxonomyNodeId: string;
  relation: string;
  rationale: string;
  review?: { status?: string };
}

const manifest = JSON.parse(
  fs.readFileSync("content/curriculum-imports/vic-f10-v2-l3-l5.json", "utf8"),
) as {
  nodes: ManifestNode[];
  taxonomyAlignments: TaxonomyAlignment[];
};

const l5Nodes = manifest.nodes.filter(
  (n) => n.officialCode?.startsWith("VC2M5") || n.officialCode?.startsWith("VC2E5"),
);

const publishedBank = getExamBank("published");
const publishedIds = new Set(publishedBank.map((q) => q.id));

console.log(`Discovered ${l5Nodes.length} Level 5 nodes in manifest.\n`);

let covered = 0;
let partial = 0;
let empty = 0;

console.log("| Official Code | Subject | Strand | MindMosaic-Safe Label | Broader Count | Gated Servable Qs | Coverage Status | Gap to Target (≥5) | Recommended New Target |");
console.log("|---|---|---|---|---:|---:|---|---:|---:|");

for (const node of l5Nodes) {
  const alignments = manifest.taxonomyAlignments.filter(
    (t) => t.curriculumNodeId === node.nodeId,
  );
  const broaderCount = alignments.length;
  const coverage = gatedPracticeCoverageResolver(node.nodeId, alignments);
  const badge = resolveCoverageBadge(coverage);
  const mappedIds = extractQuestionIdsFromAlignments(alignments, { onlyApproved: true });
  const publishedMappedIds = mappedIds.filter((id) => publishedIds.has(id));

  const isMath = node.officialCode.startsWith("VC2M5");
  const strandCode = node.officialCode.slice(4, node.officialCode.length - 2);
  const subject = isMath ? "Mathematics" : "English";

  const gapTo5 = Math.max(0, 5 - coverage.supportingContentCount);
  const targetNew = coverage.supportingContentCount >= 5 ? 0 : Math.max(6, 6 - coverage.supportingContentCount);

  if (coverage.supportingContentCount >= 5) covered++;
  else if (coverage.supportingContentCount > 0) partial++;
  else empty++;

  console.log(
    `| ${node.officialCode} | ${subject} | ${strandCode} | ${node.label} | ${broaderCount} | ${coverage.supportingContentCount} | ${badge.meta.label} | ${gapTo5} | ${targetNew} |`,
  );
}

console.log("\n### Baseline Summary:");
console.log(`- Total Grade 5 Nodes: ${l5Nodes.length}`);
console.log(`- Covered (≥5 questions): ${covered}`);
console.log(`- Partial (1–4 questions): ${partial}`);
console.log(`- Empty (0 questions): ${empty}`);
console.log(`- Deficient Nodes Requiring Remediation: ${partial + empty}`);
