import { execFileSync } from "node:child_process";
import { candidateQuestionSchema } from "../ingestion/candidate-question";
import { hashJson } from "../provenance/content-hash";
import { gitSourceSchema, gitObjectSchema, repositoryPathSchema } from "../provenance/legacy-import";
import { legacyImportManifestSchema } from "./manifest";
import { sha256 } from "./source";

/** Read-only preparation from the investigation's immutable source register. */
export function prepareScholarshipLegacyManifest(repositoryRoot: string, commit: string) {
  gitObjectSchema.parse(commit);
  const git = (...args: string[]) => execFileSync("git", ["-C", repositoryRoot, ...args], { stdio: ["ignore", "pipe", "ignore"] });
  const bind = (file: string) => {
    repositoryPathSchema.parse(file);
    const bytes = git("show", `${commit}:${file}`);
    const source = gitSourceSchema.parse({ repository: "Vishwas2018/mindmosaic-exam-engine", commit, path: file,
      blob: git("rev-parse", `${commit}:${file}`).toString("utf8").trim(), sha256: sha256(bytes) });
    return { source, data: JSON.parse(bytes.toString("utf8")) };
  };
  const register = bind("docs/reviews/scholarship-sample-2026-10-22/provenance/source-register.json");
  const review = bind("docs/reviews/scholarship-sample-2026-10-21/packet.json");
  return legacyImportManifestSchema.parse({ version: 1, batchId: "legacy-scholarship-sample-phase1",
    sourceRegister: register.source,
    limitations: ["Original generator, model, generation prompt and execution event are unverified. Git and repository import are not original authorship evidence."],
    evidenceReferences: [`git:${commit}:${register.source.path}`],
    items: register.data.items.map((row: { id: string; sourcePath: string; currentCandidateHash: string; currentPublicationContentHash: string }) => {
      const packet = bind(row.sourcePath);
      const raw = packet.data.questions.find((question: { id: string }) => question.id === row.id);
      const original = candidateQuestionSchema.parse(raw);
      const side = ["scholarship-y6-vr-032", "scholarship-y6-nr-001"].includes(row.id) ? packet.data.parameters?.[row.id] : null;
      const candidate = side ? candidateQuestionSchema.parse({ ...original, solverParams: {
        solver: side.solver, solverParams: side.solverParams ?? {},
        ...((side.ruleOrientation ?? side.solverParams?.ruleOrientation) ? { ruleOrientation: side.ruleOrientation ?? side.solverParams?.ruleOrientation } : {}),
        ...(side.targetOption ? { targetOption: side.targetOption } : {}), ...(side.correctValue !== undefined ? { correctValue: side.correctValue } : {}),
      } }) : original;
      const blueprint = bind(`content/question-factory/blueprints/${row.id}-seed-001.json`);
      const reviewed = review.data.find((question: { id: string }) => question.id === row.id);
      return { id: row.id, source: packet.source, rawQuestionHash: hashJson(raw), sourceCandidateHash: row.currentCandidateHash,
        candidateHash: hashJson(candidate), publicationContentHash: row.currentPublicationContentHash,
        blueprint: { ...blueprint.source, id: blueprint.data.id, contentHash: hashJson(blueprint.data) },
        reviewPacket: { ...review.source, projectionHash: hashJson(reviewed) },
        transformation: side ? { kind: "solver_sidecar", sidecarHash: hashJson(side) } : null };
    }),
  });
}
