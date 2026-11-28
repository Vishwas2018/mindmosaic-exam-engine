import "./allow-server-only.mts";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

import { canonicalQuestionHash, validateHumanApproval } from "@/features/content-governance/publication-integrity";
import { verifyFirstPartyAmcAttestation } from "@/features/question-factory/correctness/amc-attestation";
import { candidateQuestionSchema, type CandidateQuestion } from "@/features/question-factory/ingestion/candidate-question";
import { skillTaxonomyRegistry } from "@/features/question-factory/taxonomy";
import { checkTaxonomy } from "@/features/question-factory/validation/taxonomy-checks";

import { amcIntakeBlueprint } from "./amc-intake-blueprint.mjs";
import { AMC_EXCLUDED_FROM_REVIEW, type AmcReviewTarget, loadAmcReviewTargets } from "./amc-review-sources.mjs";

/**
 * Exact-ID-scoped, READ-ONLY intake preflight for the seven outstanding AMC
 * questions.
 *
 * It exists because `scripts/ingest-amc-reviewed-drafts.mts` is a one-off for
 * the 17 October set: it asserts exactly 57 targets, re-derives intake for every
 * non-excluded draft and writes inbox files with an exclusive-create flag, so
 * it cannot be re-run, and its count must not be edited to 60.
 *
 * This module only EVALUATES. It imports no write, spawn or network API (a unit
 * test pins that), so it can never create a blueprint, an inbox file, a manifest
 * or an approval, and it cannot start staging or publication. Every unsafe
 * condition produces a named blocker; nothing is ever downgraded to a warning.
 */

/** The only IDs this mechanism will ever evaluate. Anything else is rejected. */
export const FINAL_SEVEN_IDS = Object.freeze([
  "roadmap-amc-y3-005",
  "roadmap-amc-y3-014",
  "roadmap-amc-y3-016",
  "roadmap-amc-y3-026",
  "roadmap-amc-y5-006",
  "roadmap-amc-y5-019",
  "roadmap-amc-y5-028",
] as const);

export type BlockerCode =
  | "id_not_allowed"
  | "duplicate_id"
  | "draft_missing"
  | "draft_invalid"
  | "registry_row_missing"
  | "registry_hash_mismatch"
  | "expected_hash_missing"
  | "expected_hash_mismatch"
  | "attestation_failed"
  | "taxonomy_skill_unresolvable"
  | "taxonomy_mismatch"
  | "question_type_not_recommended"
  | "blueprint_unbuildable"
  | "blueprint_stale"
  | "already_published"
  | "already_ingested"
  | "excluded_from_review"
  | "approval_missing"
  | "approval_invalid";

export interface Blocker {
  readonly code: BlockerCode;
  readonly message: string;
}

export interface ExpectedHashes {
  readonly questionId: string;
  readonly revision: number;
  readonly sourceQuestionHash: string;
  readonly contentHash: string;
  readonly sourceManifestHash: string;
}

export interface RegistryRow {
  readonly questionId: string;
  readonly revision: number;
  readonly sourceQuestionHash: string;
  readonly contentHash: string;
}

/** Everything the evaluation reads, gathered up front so the evaluation itself is pure. */
export interface IntakeWorld {
  readonly targets: readonly AmcReviewTarget[];
  /** Raw draft objects by id, exactly as stored in the draft files. */
  readonly rawDrafts: ReadonlyMap<string, unknown>;
  readonly registryRows: readonly RegistryRow[];
  /** Parsed blueprint file already on disk for the derived blueprint id, if any. */
  readonly blueprintsOnDisk: ReadonlyMap<string, unknown>;
  /** Question-factory paths (outside blueprints/) whose name contains a question id. */
  readonly factoryPaths: ReadonlyMap<string, readonly string[]>;
  readonly servedBankIds: ReadonlySet<string>;
  readonly publishedManifestIds: ReadonlySet<string>;
  /** Parsed approval records by question id. */
  readonly approvals: ReadonlyMap<string, unknown>;
  readonly exclusions: Readonly<Record<string, string>>;
}

export interface IdResult {
  readonly questionId: string;
  readonly ready: boolean;
  readonly blockers: readonly Blocker[];
  readonly facts: {
    readonly revision?: number;
    readonly sourceQuestionHash?: string;
    readonly contentHash?: string;
    readonly sourceManifestHash?: string;
    readonly skill?: string;
    readonly strand?: string;
    readonly taxonomyEntryId?: string;
    readonly blueprintId?: string;
    readonly blueprint?: "would_create" | "matches_disk";
  };
}

export interface IntakeReport {
  readonly mode: "dry-run";
  readonly writesPerformed: 0;
  readonly requestedIds: readonly string[];
  readonly results: readonly IdResult[];
  readonly rejectedIds: readonly Blocker[];
  readonly ready: boolean;
}

const allowed = new Set<string>(FINAL_SEVEN_IDS);

function blocker(code: BlockerCode, message: string): Blocker {
  return { code, message };
}

/**
 * Evaluates the requested IDs (default: all seven). Pure: reads only `world`.
 * `expected` is an optional external pin (for example the hash manifest handed
 * to the reviewer); when supplied, every ID must be present in it and agree.
 */
export function evaluateFinalSevenIntake(
  world: IntakeWorld,
  options: { readonly ids?: readonly string[]; readonly expected?: readonly ExpectedHashes[] } = {},
): IntakeReport {
  const requested = options.ids ?? FINAL_SEVEN_IDS;
  const rejectedIds: Blocker[] = [];
  const accepted: string[] = [];
  const seen = new Set<string>();
  for (const id of requested) {
    if (!allowed.has(id)) {
      rejectedIds.push(blocker("id_not_allowed", `${id} is not one of the seven allow-listed question IDs; refused.`));
    } else if (seen.has(id)) {
      rejectedIds.push(blocker("duplicate_id", `${id} was requested more than once; refused.`));
    } else {
      seen.add(id);
      accepted.push(id);
    }
  }

  const results = accepted.map((id) => evaluateOne(world, id, options.expected));
  return {
    mode: "dry-run",
    writesPerformed: 0,
    requestedIds: [...requested],
    results,
    rejectedIds,
    ready: rejectedIds.length === 0 && results.length > 0 && results.every((result) => result.ready),
  };
}

function evaluateOne(world: IntakeWorld, id: string, expected: readonly ExpectedHashes[] | undefined): IdResult {
  const blockers: Blocker[] = [];
  const facts: { -readonly [K in keyof IdResult["facts"]]: IdResult["facts"][K] } = {};
  const finish = (): IdResult => ({ questionId: id, ready: blockers.length === 0, blockers, facts });

  const targets = world.targets.filter((target) => target.question.id === id);
  const raw = world.rawDrafts.get(id);
  if (targets.length !== 1 || raw === undefined) {
    blockers.push(blocker("draft_missing", `${id} does not resolve to exactly one bound review target and one draft.`));
    return finish();
  }
  const target = targets[0];
  facts.revision = target.source.revision;
  facts.sourceQuestionHash = target.source.sourceQuestionHash;
  facts.contentHash = target.source.contentHash;
  facts.sourceManifestHash = target.sourceManifestHash;

  const parsed = candidateQuestionSchema.safeParse(raw);
  if (!parsed.success) {
    blockers.push(blocker("draft_invalid", `${id} does not parse as an ingestion candidate.`));
    return finish();
  }
  const candidate: CandidateQuestion = parsed.data;
  facts.skill = candidate.metadata.skill;
  facts.strand = candidate.metadata.strand;

  // Exact hash binding against the committed review-source registry.
  const rows = world.registryRows.filter((row) => row.questionId === id);
  if (rows.length !== 1) {
    blockers.push(blocker("registry_row_missing", `${id} has ${rows.length} review-source registry rows; exactly one is required.`));
  } else if (
    rows[0].revision !== target.source.revision ||
    rows[0].sourceQuestionHash !== target.source.sourceQuestionHash ||
    rows[0].contentHash !== target.source.contentHash
  ) {
    blockers.push(blocker("registry_hash_mismatch", `${id}: the draft no longer matches its registered source/content hash (stale binding).`));
  }

  // Optional external pin.
  if (expected) {
    const pin = expected.find((row) => row.questionId === id);
    if (!pin) {
      blockers.push(blocker("expected_hash_missing", `${id} is absent from the supplied expected-hash manifest.`));
    } else if (
      pin.revision !== target.source.revision ||
      pin.sourceQuestionHash !== target.source.sourceQuestionHash ||
      pin.contentHash !== target.source.contentHash ||
      pin.sourceManifestHash !== target.sourceManifestHash
    ) {
      blockers.push(blocker("expected_hash_mismatch", `${id}: current revision or hashes differ from the supplied manifest; any approval or review of the older text does not bind this text.`));
    }
  }

  // First-party correctness: the pinned snapshot and the ID-keyed solver must still agree.
  const attestation = verifyFirstPartyAmcAttestation(candidate, target.source.sourceQuestionHash);
  if (!attestation.ok) blockers.push(blocker("attestation_failed", `${id}: ${attestation.message}`));

  // Taxonomy: resolve through id/alias only, then check year, subject, strand and style.
  const entry = skillTaxonomyRegistry.resolve(candidate.metadata.skill ?? "");
  if (!entry) {
    blockers.push(blocker("taxonomy_skill_unresolvable", `${id}: skill '${candidate.metadata.skill}' matches no taxonomy id or alias.`));
  } else {
    facts.taxonomyEntryId = entry.id;
    for (const issue of checkTaxonomy(candidate)) {
      blockers.push(blocker("taxonomy_mismatch", `${id}: ${issue.code}: ${issue.message}`));
    }
    // `checkTaxonomy` ignores the question type, so a skill can resolve and agree on year, subject,
    // strand and style yet be unusable for this interaction type. `validateBlueprint` rejects that
    // later as an opaque "unbuildable"; name it here so it cannot read as taxonomy-ready.
    if (!entry.recommendedQuestionTypes.includes(candidate.type)) {
      blockers.push(
        blocker(
          "question_type_not_recommended",
          `${id}: taxonomy entry '${entry.id}' recommends ${entry.recommendedQuestionTypes.join(", ")}, not '${candidate.type}'; this needs a reviewed taxonomy change.`,
        ),
      );
    }
  }

  // Blueprint: must be derivable, and an existing file must equal the derived one exactly.
  try {
    const derived = amcIntakeBlueprint(candidate);
    facts.blueprintId = derived.id;
    const onDisk = world.blueprintsOnDisk.get(derived.id);
    if (onDisk === undefined) facts.blueprint = "would_create";
    else if (isDeepStrictEqual(onDisk, JSON.parse(JSON.stringify(derived)))) facts.blueprint = "matches_disk";
    else blockers.push(blocker("blueprint_stale", `${id}: blueprint ${derived.id} already exists on disk but differs from the one derived from the current draft; it is never overwritten.`));
  } catch (error) {
    blockers.push(blocker("blueprint_unbuildable", `${id}: ${(error as Error).message.split("\n")[0]}`));
  }

  // Never duplicate or overwrite anything already ingested or published.
  if (world.servedBankIds.has(id) || world.publishedManifestIds.has(id)) {
    blockers.push(blocker("already_published", `${id} already has a published manifest or served-bank entry.`));
  }
  const present = world.factoryPaths.get(id) ?? [];
  if (present.length > 0) {
    blockers.push(blocker("already_ingested", `${id} already has question-factory files: ${present.join(", ")}.`));
  }

  // Existing exclusions stay in force until a separately authorised governed change lifts them.
  if (world.exclusions[id]) {
    blockers.push(blocker("excluded_from_review", `${id} is excluded in code (${world.exclusions[id]}).`));
  }

  // Approval gate: a current, exact-revision human approval must exist before intake.
  const approval = world.approvals.get(id);
  if (approval === undefined) {
    blockers.push(blocker("approval_missing", `${id} has no human approval record for this revision.`));
  } else {
    const checked = validateHumanApproval(approval, target.question, target.source.revision, target.sourceManifestHash);
    if (!checked.ok) blockers.push(blocker("approval_invalid", `${id}: approval does not bind this exact revision (${checked.reason}).`));
    else if (checked.approval.contentHash !== canonicalQuestionHash(target.question)) {
      blockers.push(blocker("approval_invalid", `${id}: approval content hash differs from the current content.`));
    }
  }

  return finish();
}

export interface PlannedWrite {
  readonly kind: "create_blueprint" | "create_inbox_file";
  readonly path: string;
  readonly content: string;
}

/**
 * Describes, without performing, what a later authorised intake would create.
 * Fails closed: it throws unless every requested question is ready, so a
 * caller can never obtain a write plan for a blocked question. The plan never
 * includes staging, publication, approval or manifest writes.
 */
export function describeFinalSevenWrites(world: IntakeWorld, report: IntakeReport): readonly PlannedWrite[] {
  if (!report.ready) throw new Error("Refusing to plan intake writes: the preflight reports blockers.");
  const writes: PlannedWrite[] = [];
  for (const result of report.results) {
    const raw = world.rawDrafts.get(result.questionId);
    const candidate = candidateQuestionSchema.parse(raw);
    if (result.facts.blueprint === "would_create") {
      const blueprint = amcIntakeBlueprint(candidate);
      writes.push({
        kind: "create_blueprint",
        path: `content/question-factory/blueprints/${blueprint.id}.json`,
        content: JSON.stringify(blueprint, null, 2) + "\n",
      });
    }
    writes.push({
      kind: "create_inbox_file",
      path: `content/question-factory/inbox/amc-reviewed/${result.questionId}/${result.questionId}.json`,
      content: JSON.stringify(candidate, null, 2) + "\n",
    });
  }
  return writes;
}

async function readJson(file: string): Promise<unknown | undefined> {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

async function walk(directory: string, base: string, skip: ReadonlySet<string>, out: string[]): Promise<void> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
  for (const entry of entries) {
    const relative = path.posix.join(base, entry.name);
    if (entry.isDirectory()) {
      if (!skip.has(relative)) await walk(path.join(directory, entry.name), relative, skip, out);
    } else out.push(relative);
  }
}

/** Reads the repository into an {@link IntakeWorld}. Read-only. */
export async function loadFinalSevenIntakeWorld(root = process.cwd(), ids: readonly string[] = FINAL_SEVEN_IDS): Promise<IntakeWorld> {
  const targets = await loadAmcReviewTargets(root);
  const rawDrafts = new Map<string, unknown>();
  for (const year of [3, 5] as const) {
    const packet = JSON.parse(await readFile(path.join(root, `content/roadmap-drafts/amc-y${year}-draft.json`), "utf8")) as { questions: { id: string }[] };
    for (const question of packet.questions) rawDrafts.set(question.id, question);
  }
  const registryRows: RegistryRow[] = [];
  for (const year of [3, 5] as const) {
    const rows = JSON.parse(await readFile(path.join(root, `content/review-sources/amc/y${year}.json`), "utf8")) as RegistryRow[];
    registryRows.push(...rows);
  }

  const blueprintsOnDisk = new Map<string, unknown>();
  for (const id of ids) {
    const blueprintId = `${id.replace("roadmap-", "")}-seed-001`;
    const found = await readJson(path.join(root, "content/question-factory/blueprints", `${blueprintId}.json`));
    if (found !== undefined) blueprintsOnDisk.set(blueprintId, found);
  }

  const factoryFiles: string[] = [];
  await walk(path.join(root, "content/question-factory"), "", new Set(["blueprints"]), factoryFiles);
  const factoryPaths = new Map<string, string[]>();
  for (const id of ids) factoryPaths.set(id, factoryFiles.filter((file) => file.includes(id)));

  const manifestFiles = await readdir(path.join(root, "content/question-factory/published-manifests"));
  const publishedManifestIds = new Set(manifestFiles.filter((name) => name.endsWith(".json")).map((name) => name.slice(0, -5)));

  const { amcPublishedQuestions } = await import("@/content/questions/generated/amc-index");
  const servedBankIds = new Set<string>(amcPublishedQuestions.map((question) => question.id));

  const approvals = new Map<string, unknown>();
  for (const id of ids) {
    const found = await readJson(path.join(root, "content/publication-approvals", `${id}.json`));
    if (found !== undefined) approvals.set(id, found);
  }

  return {
    targets,
    rawDrafts,
    registryRows,
    blueprintsOnDisk,
    factoryPaths,
    servedBankIds,
    publishedManifestIds,
    approvals,
    exclusions: AMC_EXCLUDED_FROM_REVIEW,
  };
}

export interface DraftReadiness {
  readonly questionId: string;
  readonly skill: string;
  readonly strand: string;
  readonly taxonomy: "ok" | "unresolvable" | "mismatch" | "question_type_incompatible";
  readonly blueprint: "ok" | "unbuildable";
  readonly detail: readonly string[];
}

/** Taxonomy and blueprint readiness of every draft. Pure and independent of publication status. */
export function evaluateAllDraftReadiness(world: IntakeWorld): readonly DraftReadiness[] {
  return world.targets.map((target) => {
    const raw = world.rawDrafts.get(target.question.id);
    const parsed = candidateQuestionSchema.safeParse(raw);
    if (!parsed.success) {
      return { questionId: target.question.id, skill: "", strand: "", taxonomy: "mismatch", blueprint: "unbuildable", detail: ["draft does not parse"] } as const;
    }
    const candidate = parsed.data;
    const detail: string[] = [];
    let taxonomy: DraftReadiness["taxonomy"] = "ok";
    const entry = skillTaxonomyRegistry.resolve(candidate.metadata.skill ?? "");
    if (!entry) {
      taxonomy = "unresolvable";
      detail.push(`skill '${candidate.metadata.skill}' matches no taxonomy id or alias`);
    } else {
      const issues = checkTaxonomy(candidate);
      if (issues.length > 0) {
        taxonomy = "mismatch";
        for (const issue of issues) detail.push(`${issue.code}: ${issue.message}`);
      } else if (!entry.recommendedQuestionTypes.includes(candidate.type)) {
        taxonomy = "question_type_incompatible";
        detail.push(`skill '${candidate.metadata.skill}' does not recommend question type '${candidate.type}'`);
      }
    }
    let blueprint: DraftReadiness["blueprint"] = "ok";
    try {
      amcIntakeBlueprint(candidate);
    } catch (error) {
      blueprint = "unbuildable";
      detail.push((error as Error).message.split("\n")[0]);
    }
    return { questionId: target.question.id, skill: candidate.metadata.skill ?? "", strand: candidate.metadata.strand, taxonomy, blueprint, detail };
  });
}
