/** Preparation only: audit exact revisions and write an INACTIVE re-pin proposal. */
import "./lib/allow-server-only.mts";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { z } from "zod";
import { candidateQuestionSchema } from "../src/features/question-factory/ingestion/candidate-question";
import { buildPublishedQuestion } from "../src/features/question-factory/publication/build-published-question";
import { canonicalQuestionHash } from "../src/features/content-governance/publication-integrity";
import { hashJson } from "../src/features/question-factory/provenance/content-hash";
import { externalPacketResponseSchema } from "../src/features/question-factory/review/scholarship-external-packet";

const sourceCommit = "45b6cdab335723b2ef822f854ac7e15e556bb7d7";
const originalCommit = "a21d23f4533cd857c2aad42b3057aef08e3d4105";
const dir = "docs/reviews/scholarship-sample-2026-10-21";
const out = `${dir}/release-preparation`;
const sha = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");
const blob = (commit: string, file: string) => execFileSync("git", ["show", `${commit}:${file}`]);
const readJson = async (file: string) => JSON.parse(await readFile(file, "utf8"));
const save = async (file: string, value: unknown) => writeFile(`${out}/${file}`, JSON.stringify(value, null, 2) + "\n");
await mkdir(out, { recursive: true });
const identities = await readJson("src/features/admin-review/release-identities.json");
const manifest = await readJson(`${dir}/approval-manifest.json`);
const originalPacketBytes = blob(originalCommit, `${dir}/packet.json`);
if (sha(originalPacketBytes) !== "c82c57d77f099f326b187b37f1943a46b1b87dc5f5fe3addb3af9dbba18cd2bf") throw new Error("Original packet drift");
await writeFile(`${out}/packet-reviewed-original.json`, originalPacketBytes);
const originalPacket = JSON.parse(originalPacketBytes.toString("utf8")) as { id: string }[];
const originalReviewBytes = await readFile(`${dir}/external-review-chatgpt.json`);
if (sha(originalReviewBytes) !== "331e7f8a54a9b9bf8ecf44e6cf9564ce143bcf8f537bdd455776dcf3d8701c15") throw new Error("Original review changed");
const manualSchema = externalPacketResponseSchema.pick({ items: true });
const originalReview = manualSchema.parse(JSON.parse(originalReviewBytes.toString("utf8"))).items;
if (originalReview.length !== 12 || new Set(originalReview.map(q => q.id)).size !== 12 || originalPacket.some(q => !originalReview.some(r => r.id === q.id))) throw new Error("Original review coverage invalid");
const amendedBytes = await readFile(`${dir}/packet-maths-014.json`);
if (sha(amendedBytes) !== "1538048ffb0b04bcd62d152895d7f0952eff94861d583d9c5dd76965aab3c30b") throw new Error("Amended packet drift");
const amendedPacket = JSON.parse(amendedBytes.toString("utf8")) as { id: string }[];
const reviewPath = `${dir}/external-review-maths-014.json`;
const amendedReviewBytes = await readFile(reviewPath).catch((e: NodeJS.ErrnoException) => { if (e.code === "ENOENT") return null; throw e; });
const amendedReview = amendedReviewBytes ? manualSchema.parse(JSON.parse(amendedReviewBytes.toString("utf8"))).items : [];
if (amendedReviewBytes && (amendedReview.length !== 1 || amendedReview[0].id !== "scholarship-y6-maths-014")) throw new Error("Amended review coverage invalid");
const attestationBytes = await readFile(`${dir}/external-review-maths-014.attestation.json`).catch((e: NodeJS.ErrnoException) => { if (e.code === "ENOENT") return null; throw e; });
const attestation = attestationBytes ? z.object({
  evidenceType: z.literal("manual_user_attested"), attestedBy: z.literal("user"),
  rawEvidenceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  packetSha256: z.literal("1538048ffb0b04bcd62d152895d7f0952eff94861d583d9c5dd76965aab3c30b"),
  sourceConversation: z.enum(["separate_fresh_conversation", "development_conversation", "unknown"]),
  modelLabel: z.string().min(1),
}).strict().parse(JSON.parse(attestationBytes.toString("utf8"))) : null;
if (attestation && (!amendedReviewBytes || attestation.rawEvidenceSha256 !== sha(amendedReviewBytes))) throw new Error("Manual attestation does not bind the raw submission");
const all = new Map<string, { candidateHash: string; publicationContentHash: string; rawHash: string; projection: unknown; key: string; difficulty: string }>();
const proposed = structuredClone(identities);
proposed.sourceRevision = sourceCommit;
const status = await readJson("docs/reviews/scholarship-2026-10-18/status.json");
const changedIds: string[] = [];
const activeIds: string[] = [];
for (const file of Object.keys(identities.packets)) {
  const filePath = `content/scholarship-drafts/${file}`;
  const bytes = await readFile(filePath);
  if (!bytes.equals(blob(sourceCommit, filePath))) throw new Error(`Unexpected source drift after ${sourceCommit}: ${file}`);
  const oldBytes = blob(identities.sourceRevision, filePath);
  if (sha(oldBytes) !== identities.packets[file]) throw new Error(`Historical packet identity invalid: ${file}`);
  const oldPacket = JSON.parse(oldBytes.toString("utf8")) as { questions: { id: string }[] };
  const packet = JSON.parse(bytes.toString("utf8")) as { questions: unknown[] };
  proposed.packets[file] = sha(bytes);
  for (const raw of packet.questions) {
    const q = candidateQuestionSchema.parse(raw);
    const built = buildPublishedQuestion(q);
    if (!built.ok) throw new Error(built.issues.join("; "));
    const rawHash = hashJson(raw);
    const candidateHash = hashJson(q);
    const publicationContentHash = canonicalQuestionHash(built.question);
    if (rawHash !== identities.questions[q.id].contentHash) changedIds.push(q.id);
    const prior = oldPacket.questions.find(x => x.id === q.id);
    if (!prior) throw new Error(`Added item ${q.id}`);
    if (q.id === "scholarship-y6-maths-014") {
      if (hashJson({ ...q, prompt: candidateQuestionSchema.parse(prior).prompt }) !== hashJson(candidateQuestionSchema.parse(prior))) throw new Error("Amendment changed fields other than prompt");
      if (candidateHash !== "71d11fa2c35f6551f230f3d018eaa0c7ef06932f1a60ccb1a4734d6867c2995c" || publicationContentHash !== "aeb211f7441a014aefc7cdf85b510e2df0175d615366b97f1d24c58a0372e03a") throw new Error("Amendment identity mismatch");
    } else if (hashJson(raw) !== hashJson(prior)) throw new Error(`Unrelated item changed: ${q.id}`);
    const projection = { id: q.id, prompt: q.prompt, ...(q.stimulus ? { stimulus: q.stimulus } : {}), options: q.options, ...(q.visuals.length ? { visuals: q.visuals } : {}) };
    if (q.answerKey.kind !== "single_option") throw new Error(`Unsupported key: ${q.id}`);
    all.set(q.id, { candidateHash, publicationContentHash, rawHash, projection, key: q.answerKey.optionId, difficulty: q.metadata.difficulty });
    proposed.questions[q.id] = { ...identities.questions[q.id], contentHash: rawHash, candidateHash, publishedContentHash: publicationContentHash };
    const row = status.items.find((r: { id: string }) => r.id === q.id);
    if (!row) throw new Error(`Missing governance row ${q.id}`);
    if (sha(bytes) === identities.packets[file] && rawHash === identities.questions[q.id].contentHash && row.candidateHash === candidateHash && row.publishedContentHash === publicationContentHash) activeIds.push(q.id);
    row.candidateHash = candidateHash;
    row.publishedContentHash = publicationContentHash;
  }
}
if (all.size !== 160 || changedIds.length !== 1 || changedIds[0] !== "scholarship-y6-maths-014") throw new Error("Expected exactly one amendment among 160 drafts");
const rows = manifest.items.map((item: { id: string; candidateHash: string; publicationContentHash: string }) => {
  const q = all.get(item.id)!;
  if (q.candidateHash !== item.candidateHash || q.publicationContentHash !== item.publicationContentHash) throw new Error(`Manifest drift: ${item.id}`);
  const amended = item.id === "scholarship-y6-maths-014";
  const reviewedProjection = (amended ? amendedPacket : originalPacket).find(x => x.id === item.id);
  if (hashJson(reviewedProjection) !== hashJson(q.projection)) throw new Error(`Reviewed projection differs: ${item.id}`);
  const review = (amended ? amendedReview : originalReview).find(x => x.id === item.id);
  const satisfactory = !!review && review.myAnswer === q.key && review.singleDefensibleAnswer && review.verdict === "PASS" && !review.issues && !review.fix;
  const provenanceSatisfactory = !amended || attestation?.sourceConversation === "separate_fresh_conversation";
  return { id: item.id, candidateHash: q.candidateHash, publicationContentHash: q.publicationContentHash,
    reviewedPacketSha256: amended ? sha(amendedBytes) : sha(originalPacketBytes), reviewedProjectionMatches: true,
    rawEvidenceFile: amended ? "external-review-maths-014.json" : "external-review-chatgpt.json",
    rawEvidenceSha256: amended ? (amendedReviewBytes ? sha(amendedReviewBytes) : null) : sha(originalReviewBytes),
    evidenceType: "manual_user_attested", authenticatedApiProvenance: false,
    reviewStatus: satisfactory && provenanceSatisfactory ? "PASS" : satisfactory ? "content_pass_provenance_pending" : review ? "unresolved" : "missing_raw_submission",
    manualAttestationSha256: amended && attestationBytes ? sha(attestationBytes) : null,
    answerAgreement: review ? review.myAnswer === q.key : null,
    declaredDifficulty: q.difficulty, reviewerDifficulty: review?.difficulty ?? null };
});
const passed = rows.filter((r: { reviewStatus: string }) => r.reviewStatus === "PASS").length;
await save("reconciliation.json", { sourceCommit, originalCommit, status: "BLOCKED", satisfactoryCurrentReviews: passed,
  evidenceLimitation: "Manual user-attested submissions; no authenticated API provenance. Session/model identity must be supplied honestly. No factory semantic review chain is created by this report.",
  unchangedDrafts: 159, changedIds, activeAdminEntries: activeIds.length, activeMathematicsEntries: activeIds.filter(id => id.includes("-maths-")).length, sampleSelectorAvailable: rows.every((r: { id: string }) => activeIds.includes(r.id)),
  difficultyDisagreements: rows.filter((r: { declaredDifficulty: string; reviewerDifficulty: string | null }) => r.reviewerDifficulty !== null && r.declaredDifficulty !== r.reviewerDifficulty),
  blockers: [...(passed !== 12 ? ["Exact raw amended review submission and its session provenance are required"] : []), "Governed review-ingest and publication lifecycle pending", "Active release pin/governance report and old blank sheet still describe historical source", "Explicit human decisions pending; CI release gates are red until coordinated activation"], items: rows });
await save("proposed-release-identities.json", proposed);
await save("proposed-status.json", status);
await save("proposal-binding.json", { sourceCommit, activePinChanged: false, proposalActivated: false,
  sourcePinSha256: sha(await readFile("src/features/admin-review/release-identities.json")),
  identitiesSha256: sha(await readFile(`${out}/proposed-release-identities.json`)),
  governanceSha256: sha(await readFile(`${out}/proposed-status.json`)),
  note: "Inactive preparation only. Historical identities and governance reports must remain archived unchanged. Coordinated active loader/status/sheet update and full CI are required before merge." });
console.log(JSON.stringify({ status: "BLOCKED", satisfactoryCurrentReviews: passed, changedIds, proposalActivated: false }));
