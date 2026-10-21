/** Read-only governance preparation. Never records approvals or publishes. */
import "./lib/allow-server-only.mts";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { candidateQuestionSchema } from "../src/features/question-factory/ingestion/candidate-question";
import { hashJson } from "../src/features/question-factory/provenance/content-hash";
import { canonicalQuestionHash } from "../src/features/content-governance/publication-integrity";
import { buildPublishedQuestion } from "../src/features/question-factory/publication/build-published-question";
import { getExamPattern } from "../src/features/exam-engine/exam-patterns/exam-pattern-registry";
import { isScholarshipAttestedItem, verifyFirstPartyScholarshipAttestation } from "../src/features/question-factory/correctness/scholarship-attestation";
import { computeSolver, solverAnswerError } from "../src/features/question-factory/correctness/solver-verification";

const dir = "docs/reviews/scholarship-sample-2026-10-21";
await mkdir(dir, { recursive: true });
const pattern = getExamPattern("scholarship-y6-comprehensive-sample-module")!;
const legacy = JSON.parse(await readFile("docs/reviews/scholarship-2026-10-18/status.json", "utf8"));
const oldPacket = JSON.parse(await readFile("docs/reviews/scholarship-2026-10-18/external-review/packet-manifest.json", "utf8"));
const reviewText = await readFile(`${dir}/release-preparation/reconciliation.json`, "utf8");
const review = reviewText ? JSON.parse(reviewText) : null;
const reviewEvidenceSha256 = reviewText ? createHash("sha256").update(reviewText).digest("hex") : null;
const items = [];
const blind = [];
for (const source of pattern.sources) {
  const sourcePath = `content/scholarship-drafts/${source.programmeId}-draft.json`;
  const packet = JSON.parse(await readFile(sourcePath, "utf8"));
  for (const id of source.filters!.questionIds!) {
    const raw = packet.questions.find((q: { id: string }) => q.id === id);
    const candidate = candidateQuestionSchema.parse(raw);
    const built = buildPublishedQuestion(candidate);
    if (!built.ok) throw new Error(JSON.stringify(built.issues));
    const candidateHash = hashJson(candidate);
    const publicationContentHash = canonicalQuestionHash(built.question);
    const previous = legacy.items.find((q: { id: string }) => q.id === id);
    const isAmended = id === "scholarship-y6-maths-014";
    if (isAmended && (candidateHash !== "71d11fa2c35f6551f230f3d018eaa0c7ef06932f1a60ccb1a4734d6867c2995c" || publicationContentHash !== "aeb211f7441a014aefc7cdf85b510e2df0175d615366b97f1d24c58a0372e03a")) throw new Error("Amendment identity drift; a fresh review binding is required");
    const boundReview = review.items.find((item: { id: string }) => item.id === id);
    if (!boundReview || boundReview.candidateHash !== candidateHash || boundReview.publicationContentHash !== publicationContentHash) throw new Error(`Reconciliation is stale: ${id}`);
    const passedManual = boundReview.reviewStatus === "PASS";
    if (!isAmended && (candidateHash !== previous.candidateHash || publicationContentHash !== previous.publishedContentHash)) throw new Error(`Release identity drift: ${id}`);
    const old = oldPacket.items.find((q: { id: string }) => q.id === id);
    if (!isAmended && old && (old.candidateHash !== candidateHash || old.publishedContentHash !== publicationContentHash)) throw new Error(`Old packet identity drift: ${id}`);
    let deterministicProof: { method: string; passed: boolean } | null = null;
    if (isScholarshipAttestedItem(candidate)) {
      deterministicProof = { method: "first-party hash-bound recompute", passed: verifyFirstPartyScholarshipAttestation(candidate).ok };
    } else if (!old) {
      const params = packet.parameters[id];
      const computed = computeSolver(params);
      deterministicProof = { method: `closed-language solver (${params.solver})`, passed: computed.ok && !solverAnswerError(candidate, computed.value) };
    }
    if (deterministicProof && !deterministicProof.passed) throw new Error(`Deterministic proof failed: ${id}`);
    items.push({ id, sourcePath, skill: candidate.metadata.skill, difficulty: candidate.metadata.difficulty,
      marks: candidate.metadata.marks, estimatedTimeSeconds: candidate.metadata.estimatedTimeSeconds,
      candidateHash, publicationContentHash, revision: isAmended ? 1 : 0, releaseIdentityMatches: !isAmended,
      previousHashes: isAmended ? { candidateHash: previous.candidateHash, publicationContentHash: previous.publishedContentHash } : null,
      sharedPassageHash: candidate.stimulus ? hashJson(candidate.stimulus) : null,
      deterministicProof,
      previousFindings: { bucket: previous.bucket, reasons: previous.reasons, difficultyGate: previous.difficultyGate },
      reviewBinding: {
        packet: isAmended ? "packet-maths-014.json" : "release-preparation/packet-reviewed-original.json",
        packetSha256: boundReview.reviewedPacketSha256,
        rawEvidenceFile: boundReview.rawEvidenceFile,
        rawEvidenceSha256: boundReview.rawEvidenceSha256,
        result: "release-preparation/reconciliation.json",
        sha256: reviewEvidenceSha256,
        status: passedManual ? "passed_user_attested" : boundReview.reviewStatus
      },
      unresolvedFindings: [
        "Human decision pending",
        ...(isAmended && !passedManual ? ["Exact amended raw review submission and session provenance pending"] : []),
        ...(isAmended ? ["Active admin release pin and old blank approval sheet remain historical"] : []),
        ...(old && !passedManual ? ["Different-provider manual review evidence pending"] : []),
        ...(old ? ["Governed per-candidate semantic review ingest pending"] : [])
      ],
    });
    // Deliberate allowlist: no keys, explanations, difficulty or author notes sent.
    blind.push({ id, prompt: candidate.prompt, ...(candidate.stimulus ? { stimulus: candidate.stimulus } : {}), options: candidate.options,
      ...(candidate.visuals?.length ? { visuals: candidate.visuals } : {}) });
  }
}
if (items.length !== 12 || new Set(items.map(q => q.id)).size !== 12) throw new Error("Sample scope invalid");
const packetText = JSON.stringify(blind, null, 2) + "\n";
const packetSha256 = createHash("sha256").update(packetText).digest("hex");
await writeFile(`${dir}/packet.json`, packetText);
const manifest = { schemaVersion: 1, patternId: pattern.id, questionCount: 12, timeMinutes: 18,
  timingBasis: "Authoring judgement; no empirical student timing validation", packetSha256,
  hashDefinitions: { candidateHash: "hashJson(candidateQuestionSchema.parse(raw))", publicationContentHash: "canonicalQuestionHash(buildPublishedQuestion(candidate).question)", sharedPassageHash: "hashJson(candidate.stimulus)" }, items };
await writeFile(`${dir}/approval-manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
const columns = ["id", "sourcePath", "skill", "difficulty", "marks", "estimatedTimeSeconds", "candidateHash", "publicationContentHash", "sharedPassageHash"] as const;
const csv = (v: unknown) => JSON.stringify(String(v ?? ""));
await writeFile(`${dir}/approval-manifest.csv`, columns.join(",") + "\n" + items.map(q => columns.map(c => csv(q[c])).join(",")).join("\n") + "\n");
await writeFile(`${dir}/approval-table.md`, "| ID | Skill | Difficulty | Marks | Seconds | Candidate hash | Publication content hash |\n| --- | --- | --- | --- | --- | --- | --- |\n" + items.map(q => `| ${q.id} | ${q.skill} | ${q.difficulty} | ${q.marks} | ${q.estimatedTimeSeconds} | ${q.candidateHash} | ${q.publicationContentHash} |`).join("\n") + "\n");
console.log(`Verified ${items.length} identities: 11 historical matches and one frozen amendment; packet ${packetSha256}; no release activation`);
