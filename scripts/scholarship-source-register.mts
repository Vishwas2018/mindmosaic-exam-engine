/** Read-only Git/source investigation. Writes documentation only; never ingests. */
import "./lib/allow-server-only.mts";
import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { candidateQuestionSchema } from "../src/features/question-factory/ingestion/candidate-question";
import { buildPublishedQuestion } from "../src/features/question-factory/publication/build-published-question";
import { canonicalQuestionHash } from "../src/features/content-governance/publication-integrity";
import { hashJson } from "../src/features/question-factory/provenance/content-hash";
import { normalisedIdentitySchema, normaliseIdentity, identitiesAreIndependentForJudgementReview } from "../src/features/question-factory/config/identity-normalisation";
import { resolveDeclaredIdentity } from "../src/features/question-factory/manual-ingestion/identity";

const root = "docs/reviews/scholarship-sample-2026-10-22/provenance";
const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const sha = (value: Buffer | string) => createHash("sha256").update(value).digest("hex");
const manifestPath = "docs/reviews/scholarship-sample-2026-10-21/approval-manifest.json";
const manifestBytes = await readFile(manifestPath);
if (sha(manifestBytes) !== "4e754be7fd4df59a9208549c261e7f251abf5d6f1a6b2de55215ed11ad11eb40") throw new Error("Manifest drift");
const manifest = JSON.parse(manifestBytes.toString("utf8")) as { items: { id: string; sourcePath: string; candidateHash: string; publicationContentHash: string }[] };
const fieldsChanged = (before: Record<string, unknown> | undefined, after: Record<string, unknown>) => before ? [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(key => hashJson(before[key] ?? null) !== hashJson(after[key] ?? null)) : ["introduced"];
const parsePacket = (commit: string, file: string): { questions: Record<string, unknown>[] } | null => {
  try { return JSON.parse(git("show", `${commit}:${file}`)); } catch { return null; }
};
const commitInfo = new Map<string, { commit: string; authoredAt: string; committedAt: string; subject: string; onPrLineage: boolean }>();
const info = (commit: string) => {
  if (!commitInfo.has(commit)) {
    const [authoredAt, committedAt, subject] = git("show", "-s", "--format=%aI%n%cI%n%s", commit).trim().split("\n");
    let onPrLineage = true;
    try { git("merge-base", "--is-ancestor", commit, "HEAD"); } catch { onPrLineage = false; }
    commitInfo.set(commit, { commit, authoredAt, committedAt, subject, onPrLineage });
  }
  return commitInfo.get(commit)!;
};
const register = [];
for (const file of new Set(manifest.items.map(item => item.sourcePath))) {
  const commits = git("log", "--all", "--reverse", "--topo-order", "--format=%H", "--", file).trim().split("\n").filter(Boolean);
  const snapshots = commits.map(commit => {
    const packet = parsePacket(commit, file);
    const parent = parsePacket(`${commit}^`, file);
    return { ...info(commit), packet, parent, packetGitBlob: packet ? git("rev-parse", `${commit}:${file}`).trim() : null };
  });
  const current = JSON.parse(await readFile(file, "utf8")) as { questions: Record<string, unknown>[] };
  for (const item of manifest.items.filter(row => row.sourcePath === file)) {
    const raw = current.questions.find(q => q.id === item.id)!;
    const candidate = candidateQuestionSchema.parse(raw);
    const built = buildPublishedQuestion(candidate);
    if (!built.ok || hashJson(candidate) !== item.candidateHash || canonicalQuestionHash(built.question) !== item.publicationContentHash) throw new Error(`Current binding mismatch: ${item.id}`);
    const events = snapshots.flatMap(snapshot => {
      const question = snapshot.packet?.questions.find(q => q.id === item.id);
      if (!question) return [];
      const prior = snapshot.parent?.questions.find(q => q.id === item.id);
      const changedFields = fieldsChanged(prior, question);
      return changedFields.length ? [{ commit: snapshot.commit, authoredAt: snapshot.authoredAt, committedAt: snapshot.committedAt, onPrLineage: snapshot.onPrLineage, subject: snapshot.subject, packetGitBlob: snapshot.packetGitBlob, rawQuestionHash: hashJson(question), changedFields, eventType: prior ? "repository_revision" : "first_appearance_on_this_lineage" }] : [];
    }).sort((a,b) => a.committedAt.localeCompare(b.committedAt));
    const first = events[0];
    const firstOnPr = events.find(event => event.onPrLineage)!;
    register.push({ id: item.id, sourcePath: file,
      classification: "git_traceable_legacy_draft_original_generation_unverified",
      originalGeneration: { provider: null, model: null, prompt: null, promptHash: null, generatedAt: null, candidateGenerationEvent: null, status: "unverified" },
      earliestAvailableGitAppearance: first, firstAppearanceOnPrLineage: firstOnPr,
      currentCandidateHash: item.candidateHash, currentPublicationContentHash: item.publicationContentHash,
      currentRawQuestionHash: hashJson(raw), knownRepositoryRevisions: events,
      limitations: ["Git author/committer and co-author trailers do not establish original question authorship.", "Available agent records establish later editing/review/import activity only; no original candidate generation event or authenticated generation prompt was found.", "Repository import declarations are not evidence of original generation. No factory provenance is created by this register."] });
  }
}
if (register.length !== 12) throw new Error("Coverage mismatch");
register.sort((a,b) => manifest.items.findIndex(item => item.id === a.id) - manifest.items.findIndex(item => item.id === b.id));
await mkdir(root, { recursive: true });
await writeFile(`${root}/source-register.json`, JSON.stringify({
  schemaVersion: 1, investigatedHead: "9e5eb1eb6dd69aef8ff48b720683e9ee378e1e2a",
  manifestCommit: "16c5c1ddb22c30c325f8ef03f8845168a9b0fda8", manifestSha256: sha(manifestBytes),
  scope: "Available local Git refs and inspected local execution records; not proof of exhaustive historical recovery or remote API authentication.",
  originalGenerationClassification: "UNVERIFIED for all 12", factoryRecordsCreated: false,
  items: register,
}, null, 2) + "\n");
await writeFile(`${root}/source-register.csv`, [
  "id,sourcePath,earliestAvailableGitCommit,firstPrLineageCommit,currentCandidateHash,currentPublicationContentHash,originalProvider,originalModel,originalPrompt,originalGenerationEvent,knownRevisionCommits",
  ...register.map(item => [item.id, item.sourcePath, item.earliestAvailableGitAppearance.commit, item.firstAppearanceOnPrLineage.commit, item.currentCandidateHash, item.currentPublicationContentHash, "unverified", "unverified", "unverified", "unverified", item.knownRepositoryRevisions.map(event => event.commit).join(";")].join(",")),
].join("\n") + "\n");
const probe = {
  unknownProviderAccepted: normalisedIdentitySchema.safeParse({ provider: "unknown", modelId: "unknown", modelFamily: "unknown", interactionMode: "external_manual" }).success,
  unknownAliasResolved: normaliseIdentity("unknown") !== undefined,
  legacyUnknownAliasResolved: normaliseIdentity("legacy-unknown") !== undefined,
  otherUnknownCliIdentityResolved: resolveDeclaredIdentity({ source: "other", model: "unknown" }) !== undefined,
  claudeAliasNormalisation: normaliseIdentity("claude"),
  arbitraryOtherUnknownShapeAccepted: normalisedIdentitySchema.safeParse({ provider: "other", modelId: "unknown", modelFamily: "unknown", interactionMode: "external_manual" }).success,
  arbitraryOtherUnknownWouldAppearDifferentProvider: identitiesAreIndependentForJudgementReview({ provider: "other", modelId: "unknown", modelFamily: "unknown", interactionMode: "external_manual" }, normaliseIdentity("chatgpt")!),
  note: "Pure schema/identity probes only; no ingestion runner, repository constructor, gate transition or factory writes invoked. Provider other is not an unknown-origin provenance category.",
};
await writeFile(`${root}/schema-probe.json`, JSON.stringify(probe, null, 2) + "\n");
const inventoryArg = process.argv.indexOf("--historical-inventory");
if (inventoryArg >= 0) {
  const inventory = JSON.parse(await readFile(process.argv[inventoryArg + 1], "utf8"));
  for (const record of inventory.matchingStoredCandidateRecords) {
    const storedBytes = await readFile(record.localPath);
    if (sha(storedBytes) !== record.sha256) throw new Error(`Historical record changed since inventory: ${record.localPath}`);
    const stored = JSON.parse(storedBytes.toString("utf8"));
    const parsed = candidateQuestionSchema.safeParse(stored.question);
    const built = parsed.success ? buildPublishedQuestion(parsed.data) : null;
    const current = manifest.items.find(item => item.id === record.candidateId);
    record.storedCandidateSchemaValid = parsed.success;
    record.actualCandidateHash = parsed.success ? hashJson(parsed.data) : null;
    record.claimedContentHashMatches = record.actualCandidateHash === stored.provenance.contentHash;
    record.actualPublicationContentHash = built?.ok ? canonicalQuestionHash(built.question) : null;
    record.matchesCurrentCandidate = record.actualCandidateHash === current?.candidateHash;
    record.matchesCurrentPublication = record.actualPublicationContentHash === current?.publicationContentHash;
    record.originalGenerationVerified = false;
  }
  await writeFile(`${root}/historical-import-records.json`, JSON.stringify(inventory, null, 2) + "\n");
}
console.log(JSON.stringify({ candidates: register.length, originalGeneration: "unverified", factoryWrites: 0, earliest: register.map(item => ({ id: item.id, earliest: item.earliestAvailableGitAppearance.commit.slice(0,8), firstPr: item.firstAppearanceOnPrLineage.commit.slice(0,8), revisions: item.knownRepositoryRevisions.length })), probe }));
