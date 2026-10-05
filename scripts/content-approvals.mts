import "./lib/allow-server-only.mts";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { publishedExamBank } from "@/content/questions/practice-bank";
import {
  getSourceManifestForQuestion,
  parseApprovalCsv,
  recordApprovalsToDisk,
  validateApprovalBatch,
  validateSingleApproval,
} from "@/features/content-governance/approval-verification";
import { canonicalQuestionHash } from "@/features/content-governance/publication-integrity";
import { getPublicationEligibility } from "@/server/publication-evidence";

const command = process.argv[2];
const args = process.argv.slice(3);
function argument(name: string): string | undefined {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}

if (command === "queue") {
  const ids = argument("--question-ids")?.split(",");
  const report = getPublicationEligibility();
  if (report.problems.length) throw new Error(report.problems.join("\n"));
  const requested = ids ? publishedExamBank.filter((q) => ids.includes(q.id)) : publishedExamBank;
  if (ids && requested.length !== new Set(ids).size) throw new Error("Unknown or duplicate question IDs.");
  const directory = "content/question-factory/reports/human-approval";
  await mkdir(directory, { recursive: true });
  let count = 0;
  for (const question of requested) {
    if (report.approvals.has(question.id)) continue;
    const source = await getSourceManifestForQuestion(question);
    const packet = {
      kind: "human_publication_approval",
      schemaVersion: 1,
      questionId: question.id,
      revision: source.revision,
      approvedBy: "",
      approvedAt: "",
      contentHash: canonicalQuestionHash(question),
      sourceManifestHash: source.sourceManifestHash,
      checks: { correctness: false, originality: false, ageAppropriateness: false },
      question,
    };
    // Never overwrite a reviewer's edits.
    try {
      await writeFile(path.join(directory, `${question.id}.json`), JSON.stringify(packet, null, 2) + "\n", {
        flag: "wx",
      });
      count++;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
  }
  console.log(`${count} unsigned review packets prepared in ${directory}. No publication state changed.`);
} else if (command === "record") {
  const packetFile = argument("--packet");
  const reviewer = argument("--reviewer");
  if (!packetFile) throw new Error("Usage: content:record-approval -- --packet <reviewed-packet.json>");
  const packet = JSON.parse(await readFile(packetFile, "utf8"));
  const reviewerName = reviewer ?? packet.approvedBy;
  if (!reviewerName || reviewerName.trim().length === 0) {
    throw new Error("Reviewer full name must be explicitly supplied (in packet or via --reviewer).");
  }

  const result = await validateSingleApproval({
    row: {
      questionId: packet.questionId,
      contentHash: packet.contentHash,
      revision: packet.revision,
      sourceManifestHash: packet.sourceManifestHash,
      correctness: packet.checks?.correctness ? "yes" : "",
      originality: packet.checks?.originality ? "yes" : "",
      ageAppropriateness: packet.checks?.ageAppropriateness ? "yes" : "",
      decision: "approve",
    },
    reviewerFullName: reviewerName.trim(),
    approvedAt: packet.approvedAt || new Date().toISOString(),
    questionBank: publishedExamBank,
  });

  if (!result.ok) {
    throw new Error(`Approval validation failed: ${result.error}`);
  }

  if (result.alreadyRecorded) {
    console.log(`Approval for ${result.approval.questionId} was already recorded earlier (skipped, no-op).`);
  } else {
    await recordApprovalsToDisk([result.approval]);
    console.log(`Recorded reviewer-supplied approval for ${result.approval.questionId}. Review and commit this record.`);
  }
} else if (command === "record-batch" || command === "record-approvals") {
  const sheetFile = argument("--sheet");
  const reviewer = argument("--reviewer");
  if (!sheetFile) {
    throw new Error("Usage: content:record-approvals -- --sheet <reviewed-sheet.csv> --reviewer '<Reviewer Full Name>'");
  }
  if (!reviewer || reviewer.trim().length === 0) {
    throw new Error("Reviewer full name must be explicitly supplied via --reviewer '<Full Name>'.");
  }

  const csvContent = await readFile(sheetFile, "utf8");
  const rows = parseApprovalCsv(csvContent);
  if (rows.length === 0) {
    throw new Error(`No approval rows found in ${sheetFile}.`);
  }

  const validation = await validateApprovalBatch({
    rows,
    reviewerFullName: reviewer.trim(),
    questionBank: publishedExamBank,
  });

  if (!validation.ok) {
    console.error(`\nValidation failed with ${validation.fatalErrors.length} fatal error(s). No approvals written:`);
    for (const err of validation.fatalErrors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  if (validation.newApprovals.length > 0) {
    await recordApprovalsToDisk(validation.newApprovals);
  }

  console.log(`\nApproval Recording Summary for reviewer '${reviewer}':`);
  console.log(`  New approvals recorded:       ${validation.newApprovals.length}`);
  console.log(`  Already recorded (skipped):   ${validation.alreadyRecorded.length}`);
  console.log(`  Rejected (no approval written): ${validation.rejectedCount}`);
  console.log(`  Revision requested:           ${validation.revisedCount}`);
  console.log(`  Unreviewed / blank:           ${validation.unreviewedCount}`);
} else if (command === "verify") {
  const report = getPublicationEligibility();
  console.log(
    JSON.stringify(
      {
        authored: publishedExamBank.length,
        eligible: report.questions.length,
        awaitingApproval: report.excluded.filter((q) => q.reason === "awaiting_human_approval").length,
        problems: report.problems,
      },
      null,
      2,
    ),
  );
  if (report.problems.length) process.exitCode = 1;
} else {
  throw new Error("Expected queue, record, record-batch, record-approvals, or verify.");
}
