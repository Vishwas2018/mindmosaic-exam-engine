import "./lib/allow-server-only.mts";
import fs from "node:fs";
import { gatedPracticeCoverageResolver } from "@/server/curriculum/gated-practice-coverage";
import { resolveCoverageBadge } from "@/features/curriculum/parent-content";
import { resolveQuestionsForCurriculumNode } from "@/features/curriculum/lessons/resolver";

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
}

const manifest = JSON.parse(
  fs.readFileSync("content/curriculum-imports/vic-f10-v2-l3-l5.json", "utf8"),
) as {
  nodes: ManifestNode[];
  taxonomyAlignments: TaxonomyAlignment[];
};

const l3Nodes = manifest.nodes.filter(
  (n) => n.officialCode?.startsWith("VC2M3") || n.officialCode?.startsWith("VC2E3"),
);
const l5Nodes = manifest.nodes.filter(
  (n) => n.officialCode?.startsWith("VC2M5") || n.officialCode?.startsWith("VC2E5"),
);

console.log("=== Curriculum Gated Coverage Audit ===");
console.log(`Discovered ${l3Nodes.length} Level 3 nodes and ${l5Nodes.length} Level 5 nodes.\n`);

function auditLevel(nodes: ManifestNode[], levelName: string) {
  let coveredCount = 0;
  let partialCount = 0;
  let emptyCount = 0;

  const coveredList: string[] = [];
  const partialList: string[] = [];
  const emptyList: string[] = [];

  const mismatches: Array<{
    code: string;
    broader: number;
    gated: number;
    delta: number;
    badge: string;
    label: string;
  }> = [];

  const allRows: Array<{
    code: string;
    broader: number;
    gated: number;
    delta: number;
    badgeState: string;
    badgeLabel: string;
    studentCount?: number;
    agreesWithStudent?: boolean;
    label: string;
  }> = [];

  for (const node of nodes) {
    const alignments = manifest.taxonomyAlignments.filter(
      (t) => t.curriculumNodeId === node.nodeId,
    );
    const broaderCount = alignments.length;

    const coverage = gatedPracticeCoverageResolver(node.nodeId, alignments);
    const badge = resolveCoverageBadge(coverage);

    const gatedCount = coverage.supportingContentCount;
    const delta = broaderCount - gatedCount;

    if (badge.state === "covered") {
      coveredCount++;
      coveredList.push(node.officialCode);
    } else if (badge.state === "partial") {
      partialCount++;
      partialList.push(node.officialCode);
    } else {
      emptyCount++;
      emptyList.push(node.officialCode);
    }

    if (delta !== 0) {
      mismatches.push({
        code: node.officialCode,
        broader: broaderCount,
        gated: gatedCount,
        delta,
        badge: badge.meta.label,
        label: node.label,
      });
    }

    let studentCount: number | undefined = undefined;
    let agreesWithStudent: boolean | undefined = undefined;

    if (levelName === "Level 3") {
      const studentQuestions = resolveQuestionsForCurriculumNode(node.officialCode);
      studentCount = studentQuestions.length;
      agreesWithStudent = studentCount === gatedCount;
    }

    allRows.push({
      code: node.officialCode,
      broader: broaderCount,
      gated: gatedCount,
      delta,
      badgeState: badge.state,
      badgeLabel: badge.meta.label,
      studentCount,
      agreesWithStudent,
      label: node.label,
    });
  }

  console.log(`--------------------------------------------------------------------------------`);
  console.log(`--- ${levelName} SUMMARY ---`);
  console.log(`Total Nodes: ${nodes.length}`);
  console.log(`Covered (>=5 Qs): ${coveredCount} (${((coveredCount / nodes.length) * 100).toFixed(1)}%)`);
  console.log(`Partial (1-4 Qs): ${partialCount} (${((partialCount / nodes.length) * 100).toFixed(1)}%)`);
  console.log(`Empty (0 Qs):     ${emptyCount} (${((emptyCount / nodes.length) * 100).toFixed(1)}%)`);
  console.log(`--------------------------------------------------------------------------------`);

  console.log(`\nBucket Lists for ${levelName}:`);
  console.log(`  Covered (${coveredList.length}): ${coveredList.join(", ")}`);
  console.log(`  Partial (${partialList.length}): ${partialList.join(", ")}`);
  console.log(`  Empty   (${emptyList.length}): ${emptyList.join(", ")}`);

  console.log(`\nBroader vs Gated Delta Mismatches for ${levelName} (${mismatches.length} nodes):`);
  console.log(`Code       | Broader | Gated | Delta | Resulting Badge       | Label`);
  console.log(`-----------|---------|-------|-------|-----------------------|---------------------------------------------`);
  for (const m of mismatches) {
    console.log(
      `${m.code.padEnd(10)} | ${String(m.broader).padStart(7)} | ${String(m.gated).padStart(5)} | ${String(m.delta).padStart(5)} | ${m.badge.padEnd(21)} | ${m.label}`,
    );
  }

  console.log(`\nFull 100% Matrix for ${levelName}:`);
  console.log(`Code       | Broader | Gated | Delta | Gated Badge           ${levelName === "Level 3" ? "| Student Qs | Agrees " : ""}| Label`);
  console.log(`-----------|---------|-------|-------|-----------------------${levelName === "Level 3" ? "|------------|--------" : ""}|---------------------------------------------`);
  for (const r of allRows) {
    const studentPart =
      levelName === "Level 3"
        ? `| ${String(r.studentCount).padStart(10)} | ${r.agreesWithStudent ? "YES    " : "NO     "}`
        : "";
    console.log(
      `${r.code.padEnd(10)} | ${String(r.broader).padStart(7)} | ${String(r.gated).padStart(5)} | ${String(r.delta).padStart(5)} | ${r.badgeLabel.padEnd(21)} ${studentPart}| ${r.label}`,
    );
  }
}

auditLevel(l3Nodes, "Level 3");
auditLevel(l5Nodes, "Level 5");
