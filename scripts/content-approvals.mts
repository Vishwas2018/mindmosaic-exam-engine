import "./lib/allow-server-only.mts";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { publishedExamBank } from "@/content/questions/practice-bank";
import { factoryPublishedQuestions } from "@/content/questions/generated";
import { approvalFingerprint, canonicalQuestionHash, humanPublicationApprovalSchema,
  validateHumanApproval, validatePublicationSource } from "@/features/content-governance/publication-integrity";
import { getPublicationEligibility } from "@/server/publication-evidence";

const command = process.argv[2];
const factoryIds = new Set(factoryPublishedQuestions.map((q) => q.id));
const args = process.argv.slice(3);
function argument(name: string): string | undefined {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}

let sourceRecords: unknown[] | undefined;
async function sourceFor(question: (typeof publishedExamBank)[number]) {
  if (!factoryIds.has(question.id)) return { revision: 1, sourceManifestHash: null };
  // The factory uses candidate IDs as filenames; locate by question ID, never infer a filename.
  const { readdir } = await import("node:fs/promises");
  const directory = "content/question-factory/published-manifests";
  if (!sourceRecords) {
    sourceRecords = [];
    for (const file of (await readdir(directory)).filter((f) => f.endsWith(".json"))) {
      sourceRecords.push(JSON.parse(await readFile(path.join(directory, file), "utf8")));
    }
  }
  const matches = sourceRecords.filter((raw) => raw && typeof raw === "object" &&
    (raw as Record<string, unknown>).questionId === question.id);
  if (matches.length !== 1) throw new Error(`Expected one source manifest for ${question.id}.`);
  const source = validatePublicationSource(matches[0], question);
  if (!source.ok) throw new Error(`${question.id}: ${source.reason}`);
  return source;
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
    const source = await sourceFor(question);
    const packet = {
      kind: "human_publication_approval", schemaVersion: 1, questionId: question.id,
      revision: source.revision, approvedBy: "", approvedAt: "",
      contentHash: canonicalQuestionHash(question), sourceManifestHash: source.sourceManifestHash,
      checks: { correctness: false, originality: false, ageAppropriateness: false }, question,
    };
    // Never overwrite a reviewer's edits.
    try { await writeFile(path.join(directory, `${question.id}.json`), JSON.stringify(packet, null, 2) + "\n", { flag: "wx" }); count++; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
  }
  console.log(`${count} unsigned review packets prepared in ${directory}. No publication state changed.`);
} else if (command === "record") {
  const packetFile = argument("--packet");
  if (!packetFile) throw new Error("Usage: content:record-approval -- --packet <reviewed-packet.json>");
  const packet = JSON.parse(await readFile(packetFile, "utf8"));
  const { fingerprint: _oldFingerprint, ...facts } = packet;
  void _oldFingerprint;
  const approval = humanPublicationApprovalSchema.parse({ ...facts, fingerprint: approvalFingerprint(facts) });
  const question = publishedExamBank.find((q) => q.id === approval.questionId);
  if (!question) throw new Error("Approval refers to an unknown authoring question.");
  const source = await sourceFor(question);
  const validated = validateHumanApproval(approval, question, source.revision, source.sourceManifestHash);
  if (!validated.ok) throw new Error(validated.reason);
  if (getPublicationEligibility().approvals.has(question.id)) throw new Error("This revision is already approved.");
  const directory = "content/publication-approvals";
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, `${question.id}.json`), JSON.stringify(approval, null, 2) + "\n", { flag: "wx" });
  console.log(`Recorded reviewer-supplied approval for ${question.id}. Review and commit this record before deployment.`);
} else if (command === "verify") {
  const report = getPublicationEligibility();
  console.log(JSON.stringify({ authored: publishedExamBank.length, eligible: report.questions.length,
    awaitingApproval: report.excluded.filter((q) => q.reason === "awaiting_human_approval").length,
    problems: report.problems }, null, 2));
  if (report.problems.length) process.exitCode = 1;
} else throw new Error("Expected queue, record, or verify.");
