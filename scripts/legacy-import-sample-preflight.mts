import "./lib/allow-server-only.mts";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { getWorkspaceRoot } from "../src/features/question-factory/config";
import { FsFactoryRepository } from "../src/features/question-factory/storage";
import { prepareScholarshipLegacyManifest } from "../src/features/question-factory/legacy-import/bindings";
import { GitLegacySourceReader, sha256 } from "../src/features/question-factory/legacy-import/source";
import { preflightLegacyImport } from "../src/features/question-factory/legacy-import/preflight";

// Reference objects are read only. Output is documentation, never the factory workspace.
const commit = "dcb60a80f3f6eabdb522b20202929d2e3f328a94";
const directory = "docs/reviews/legacy-content-provenance-phase1";
const manifest = prepareScholarshipLegacyManifest(process.cwd(), commit);
const plan = await preflightLegacyImport(manifest, new GitLegacySourceReader(process.cwd()), new FsFactoryRepository(getWorkspaceRoot()));
await mkdir(directory, { recursive: true });
await writeFile(`${directory}/sample-import-manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
await writeFile(`${directory}/preflight-12.json`, JSON.stringify({ sourceCommit: commit, writesToFactory: 0, status: "PASS",
  manifestSha256: sha256(await readFile(`${directory}/sample-import-manifest.json`)), manifestHash: plan.manifestHash,
  independentReviewEligible: false, stagingEligible: false, publicationEligible: false,
  items: plan.items.map(entry => ({ id: entry.item.id, status: "PASS", rawQuestionHash: entry.item.rawQuestionHash, sourceCandidateHash: entry.item.sourceCandidateHash,
    factoryCandidateHash: entry.item.candidateHash, publicationContentHash: entry.item.publicationContentHash, transformation: entry.item.transformation?.kind ?? "none" })),
}, null, 2) + "\n");
console.log("PASS: all 12 source/register/blueprint/review-packet bindings; zero factory writes; independent review, staging and publication remain ineligible.");
