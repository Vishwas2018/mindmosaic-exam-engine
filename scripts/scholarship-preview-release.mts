/** Versioned admin preview only. Does not ingest, approve, stage or publish. */
import "./lib/allow-server-only.mts";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { candidateQuestionSchema } from "../src/features/question-factory/ingestion/candidate-question";
import { hashJson } from "../src/features/question-factory/provenance/content-hash";
import { buildPublishedQuestion } from "../src/features/question-factory/publication/build-published-question";
import { canonicalQuestionHash } from "../src/features/content-governance/publication-integrity";
import { reviewIngestionInputSchema } from "../src/features/question-factory/review/review-ingest";
import { getWorkspaceRoot } from "../src/features/question-factory/config";
import path from "node:path";
import { isScholarshipAttestedItem } from "../src/features/question-factory/correctness/scholarship-attestation";
import ingestionIdentities from "../src/features/question-factory/correctness/scholarship-identity-pins.json";

const previous = "docs/reviews/scholarship-sample-2026-10-21";
const output = "docs/reviews/scholarship-sample-2026-10-22";
const releasePath = "src/features/admin-review/releases/scholarship-2026-10-22.json";
const decisionCommit = "16c5c1ddb22c30c325f8ef03f8845168a9b0fda8";
const source = "45b6cdab335723b2ef822f854ac7e15e556bb7d7";
const sha = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
const load = async (file: string) => JSON.parse(await readFile(file, "utf8"));
const save = async (file: string, data: unknown) => writeFile(file, JSON.stringify(data, null, 2) + "\n");
const identities = await load(`${previous}/release-preparation/proposed-release-identities.json`);
if (identities.sourceRevision !== source) throw new Error("Unexpected proposal source");
const status = await load(`${previous}/release-preparation/proposed-status.json`);
const manifestBytes = execFileSync("git", ["show", `${decisionCommit}:${previous}/approval-manifest.json`]);
if (!(await readFile(`${previous}/approval-manifest.json`)).equals(manifestBytes)) throw new Error("Advisory manifest has changed");
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const rawById = new Map();
const intakeById = new Map();
for (const [file, expected] of Object.entries(identities.packets)) {
  const filePath = `content/scholarship-drafts/${file}`;
  const bytes = await readFile(filePath);
  if (sha(bytes) !== expected || !bytes.equals(execFileSync("git", ["show", `${source}:${filePath}`]))) throw new Error(`Source drift: ${file}`);
  const packet = JSON.parse(bytes.toString("utf8"));
  for (const raw of packet.questions) {
    const candidate = candidateQuestionSchema.parse(raw);
    const built = buildPublishedQuestion(candidate);
    if (!built.ok) throw new Error(built.issues.join("; "));
    const identity = identities.questions[candidate.id];
    const row = status.items.find((item: { id: string }) => item.id === candidate.id);
    if (!identity || !row || identity.contentHash !== hashJson(raw) || identity.candidateHash !== hashJson(candidate) || identity.publishedContentHash !== canonicalQuestionHash(built.question) || row.candidateHash !== identity.candidateHash || row.publishedContentHash !== identity.publishedContentHash) throw new Error(`Identity mismatch: ${candidate.id}`);
    rawById.set(candidate.id, raw);
    const side = packet.parameters?.[raw.id];
    // Inspect the existing intake adapter's enrichment without ingesting it or changing the manifest.
    const merged = side && typeof side.solver === "string" && !isScholarshipAttestedItem(raw) ? { ...raw, solverParams: {
      solver: side.solver, solverParams: side.solverParams ?? {},
      ...((side.ruleOrientation ?? side.solverParams?.ruleOrientation) ? { ruleOrientation: side.ruleOrientation ?? side.solverParams?.ruleOrientation } : {}),
      ...(side.targetOption ? { targetOption: side.targetOption } : {}),
      ...(side.correctValue !== undefined ? { correctValue: side.correctValue } : {}),
    } } : raw;
    const intake = candidateQuestionSchema.parse(merged);
    const intakeBuilt = buildPublishedQuestion(intake);
    if (!intakeBuilt.ok || canonicalQuestionHash(intakeBuilt.question) !== identity.publishedContentHash) throw new Error(`Intake alters publication: ${raw.id}`);
    intakeById.set(raw.id, { intakeCandidateHash: hashJson(intake), addsSolverSidecar: hashJson(intake) !== hashJson(candidate),
      registeredIdentityMatches: ingestionIdentities[raw.id as keyof typeof ingestionIdentities] === hashJson(intake), publicationUnchanged: true });
  }
}
if (rawById.size !== 160 || manifest.items.length !== 12) throw new Error("Unexpected coverage");
await mkdir(output, { recursive: true });
await mkdir("src/features/admin-review/releases", { recursive: true });
// Preserve inherited gate classifications as historical advisory facts, not new review evidence.
status.sourceRevision = source;
status.previewOnly = true;
status.inheritedClassificationSource = "docs/reviews/scholarship-2026-10-18/status.json";
status.classificationNote = "Inherited release classifications are advisory historical facts; matching hashes do not establish a factory gate chain. Manual sample reviews and advisory recommendation are separate, revision-bound evidence. No owner approval is recorded.";
const amended = status.items.find((item: { id: string }) => item.id === "scholarship-y6-maths-014");
amended.reasons = [...amended.reasons, "Prompt amended at 45b6cdab; prior review findings are superseded. The exact amended revision has a manual user-attested PASS; factory ingestion and human publication approval remain pending."];
await save(releasePath, identities);
await save(`${output}/status.json`, status);
await save(`${output}/advisory-recommendation.json`, {
  kind: "advisory_content_review_recommendation", source: "user_supplied_ChatGPT_recommendation",
  decision: "APPROVE_advisory", manifestCommit: decisionCommit, manifestSha256: sha(manifestBytes),
  scope: "The 12 exact manifest-bound revisions are satisfactory for answer correctness and Year 6 scholarship suitability.",
  originality: "No substantive originality concerns identified; comprehensive plagiarism certification has not been performed.",
  retainedMedium: ["scholarship-y6-vr-001", "scholarship-y6-nr-023"],
  disagreementsPreserved: true, ownerApproval: false, authorisedApprovedBySignature: false,
});
const sheet = ["questionId,candidateHash,contentHash,revision,sourceManifestHash,correctness,originality,ageAppropriateness,decision,notes"];
for (const item of manifest.items) {
  const identity = identities.questions[item.id];
  if (identity.candidateHash !== item.candidateHash || identity.publishedContentHash !== item.publicationContentHash) throw new Error(`Manifest drift: ${item.id}`);
  // No invented ingestion revision or staged source fingerprint. This is deliberately not publish-ready.
  sheet.push([item.id, identity.candidateHash, identity.publishedContentHash, "", "", "", "", "", "", ""].join(","));
}
await writeFile(`${output}/review-sheet-sample-prestage-blank.csv`, sheet.join("\n") + "\n");
await save(`${output}/preview-binding.json`, {
  sourceRevision: source, manifestCommit: decisionCommit, manifestSha256: sha(manifestBytes),
  identitiesSha256: sha(await readFile(releasePath)), governanceSha256: sha(await readFile(`${output}/status.json`)),
  sheetSha256: sha(await readFile(`${output}/review-sheet-sample-prestage-blank.csv`)),
  adminPreviewEntries: 160, sampleEntries: 12, publicationEnabled: false, ownerApprovalRecorded: false,
});
const incomingReviews = await Promise.all(["external-review-chatgpt.json", "external-review-maths-014.json"].map(async file => {
  const bytes = await readFile(`${previous}/${file}`);
  const result = reviewIngestionInputSchema.safeParse(JSON.parse(bytes.toString("utf8")));
  return { file, sha256: sha(bytes), factorySchemaAccepted: result.success,
    missingOrInvalidFields: result.success ? [] : result.error.issues.map(issue => issue.path.join(".")) };
}));
const compartments = ["generated", "review-queue", "staged"] as const;
const lifecycle = [];
for (const item of manifest.items) {
  const records: Record<string, boolean> = {};
  for (const compartment of compartments) {
    records[compartment] = await readFile(path.join(getWorkspaceRoot(), compartment, `${item.id}.json`)).then(() => true).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
      return false;
    });
  }
  const blueprint = await load(`content/question-factory/blueprints/${item.id}-seed-001.json`);
  lifecycle.push({ id: item.id, candidateHash: item.candidateHash, publicationContentHash: item.publicationContentHash,
    records, blueprintId: blueprint.id, blueprintHash: hashJson(blueprint), blueprintBindingEstablished: false, ...intakeById.get(item.id) });
}
await save(`${output}/ingestion-preflight.json`, {
  status: "BLOCKED", writesPerformed: false, reviews: incomingReviews, items: lifecycle,
  blockers: [
    "No generated, review-queue or staged records exist for these 12 IDs; genuine generator identity and source prompt/version must be established before manual ingestion, followed by the registered gates.",
    "Aggregate manual review JSON is not a factory review response. A known normalisable reviewer identity/version, genuine confidence, reviewedAt and review prompt/version binding are missing; candidate revision and blueprint binding must come from actual stored provenance.",
    "The existing intake script adds solver sidecars to some candidates. Its resulting hashes are reported separately; they must not be substituted for the 16c5 manifest candidate hashes. Resolve the technical intake/review binding before ingestion; no enriched candidate is approved by this recommendation.",
    "Do not manufacture those fields from PASS or advisory acceptance. Issue bound review prompts after correctness checks; obtain complete different-provider responses for judgement items, then review-ingest and run the remaining gates.",
    "Generate the final publication sheet from genuinely staged records. Formal owner approval, merge, publication and deployment remain separately unauthorised.",
  ],
});
console.log("Verified 160 preview identities and 12 unchanged manifest bindings; blank pre-stage sheet only. No governance lifecycle or approval writes.");
