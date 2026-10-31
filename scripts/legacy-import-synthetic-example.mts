import "./lib/allow-server-only.mts";
import { writeFile } from "node:fs/promises";
import { candidateQuestionSchema } from "../src/features/question-factory/ingestion/candidate-question";
import { buildPublishedQuestion } from "../src/features/question-factory/publication/build-published-question";
import { canonicalQuestionHash } from "../src/features/content-governance/publication-integrity";
import { hashJson } from "../src/features/question-factory/provenance/content-hash";
import { candidateProvenanceSchema } from "../src/features/question-factory/provenance/candidate-provenance";
import { buildLegacyRecord } from "../src/features/question-factory/legacy-import/record";
import { legacyImportManifestSchema } from "../src/features/question-factory/legacy-import/manifest";

const question = candidateQuestionSchema.parse({ id: "synthetic-legacy-example", type: "number_entry", yearLevel: 3, examStyle: "naplan_style",
  prompt: "What is 23 + 48?", options: [], visuals: [], answerKey: { kind: "number", value: 71, tolerance: 0 }, explanation: "23 + 48 = 71.",
  metadata: { subject: "numeracy", strand: "Number", skill: "num.addition.two-digit", difficulty: "easy", marks: 1, estimatedTimeSeconds: 60 } });
const built = buildPublishedQuestion(question);
if (!built.ok) throw new Error(built.issues.join("; "));
const source = { repository: "synthetic/fixture", commit: "a".repeat(40), path: "synthetic/source.json", blob: "b".repeat(40), sha256: "c".repeat(64) };
const hash = hashJson(question);
const item = { id: question.id, source, rawQuestionHash: hash, sourceCandidateHash: hash, candidateHash: hash,
  publicationContentHash: canonicalQuestionHash(built.question),
  blueprint: { ...source, path: "synthetic/blueprint.json", id: "synthetic-blueprint", contentHash: "d".repeat(64) },
  reviewPacket: { ...source, path: "synthetic/review.json", projectionHash: "e".repeat(64) }, transformation: null };
const manifest = legacyImportManifestSchema.parse({ version: 1, batchId: "synthetic-fixture", sourceRegister: { ...source, path: "synthetic/register.json" },
  limitations: ["Synthetic schema example; Git objects and repository are invented fixture data, not verified source evidence."],
  evidenceReferences: ["synthetic-fixture-only"], items: [item] });
const record = buildLegacyRecord({ manifest, manifestHash: hashJson(manifest), items: [] }, { item, question, replay: false }, "2000-01-01T00:00:00.000Z");
candidateProvenanceSchema.parse(record.provenance);
await writeFile("docs/reviews/legacy-content-provenance-phase1/synthetic-record.json", JSON.stringify({
  fixtureNotice: "SYNTHETIC SCHEMA EXAMPLE ONLY. NOT source-verified; NOT imported. The fake Git objects must fail real preflight. This wrapper is not a factory record.",
  schemaValidated: true, sourceVerified: false, record,
}, null, 2) + "\n");
console.log("Synthetic provenance schema validates; no import, repository write or gate execution performed.");
