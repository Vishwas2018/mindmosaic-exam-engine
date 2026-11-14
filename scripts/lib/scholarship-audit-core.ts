/**
 * Scholarship Year 6 audit core: pure, deterministic derivations shared by the inventory generator, the owner-pack
 * generator and their tests.
 *
 * Design rules (PR #78 review corrections):
 *  - No wall-clock input. Every output is a pure function of the committed source bytes.
 *  - A field is only `verified` when a recomputation or a committed primary record establishes it. Anything that
 *    needs a qualified human, an external engine or a record that does not exist is `not_established`, with the
 *    missing source named. A solver match never implies semantic, uniqueness, distractor or age-fit verification.
 *  - A solver result is read only after its `ok` flag is checked. A failed computation is reported as `failed`.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { canonicalQuestionHash } from "../../src/features/content-governance/publication-integrity";
import { FACTORY_THRESHOLDS } from "../../src/features/question-factory/config";
import {
  isScholarshipAttestedItem,
  verifyFirstPartyScholarshipAttestation,
} from "../../src/features/question-factory/correctness/scholarship-attestation";
import {
  computeSolver,
  solverAnswerError,
  solverValueMatches,
} from "../../src/features/question-factory/correctness/solver-verification";
import { computeDifficultyDeviation, estimateDifficulty } from "../../src/features/question-factory/difficulty/estimate-difficulty";
import { candidateQuestionSchema } from "../../src/features/question-factory/ingestion/candidate-question";
import { hashContent, hashJson } from "../../src/features/question-factory/provenance/content-hash";
import { buildPublishedQuestion } from "../../src/features/question-factory/publication/build-published-question";

/* ------------------------------------------------------------------ types */

export type EvidenceStatus = "verified" | "failed" | "not_established";

export interface EvidenceField {
  readonly status: EvidenceStatus;
  /** Primary record, recomputation or policy clause that supports (or fails to support) the status. */
  readonly evidenceRef: string;
  readonly detail?: string;
  /** Named only when `status` is `not_established`: the artefact whose existence would establish the field. */
  readonly missingSource?: string;
}

export interface DraftQuestion {
  id: string;
  type?: string;
  prompt: string;
  stimulus?: { body?: string } & Record<string, unknown>;
  options: Array<{ id: string; text: string }>;
  visuals?: unknown[];
  explanation: string;
  answerKey: { kind?: string; optionId: string };
  metadata: { difficulty: string; skill: string } & Record<string, unknown>;
}

export interface DraftSidecar {
  solver?: string;
  ruleOrientation?: "row" | "column" | "diagonal";
  solverParams?: { ruleOrientation?: "row" | "column" | "diagonal" } & Record<string, unknown>;
  correctValue?: string | number;
}

export interface DraftFile {
  questions: DraftQuestion[];
  parameters?: Record<string, DraftSidecar>;
}

export interface SectionSpec {
  readonly key: "nr" | "maths" | "vr" | "rc";
  readonly file: string;
  readonly title: string;
  readonly judgement: boolean;
  readonly idPrefix: string;
}

export const DRAFTS_DIR = "content/scholarship-drafts";
export const REVIEW_DIR = "docs/reviews/scholarship-2026-10-18";

/** Fixed section order: it is the stable sort key for every generated artefact. */
export const SECTIONS: readonly SectionSpec[] = [
  { key: "nr", file: "scholarship-y6-numerical-reasoning-draft.json", title: "Numerical Reasoning", judgement: false, idPrefix: "scholarship-y6-nr-" },
  { key: "maths", file: "scholarship-y6-mathematics-draft.json", title: "Mathematics", judgement: false, idPrefix: "scholarship-y6-maths-" },
  { key: "vr", file: "scholarship-y6-verbal-reasoning-draft.json", title: "Verbal Reasoning", judgement: true, idPrefix: "scholarship-y6-vr-" },
  { key: "rc", file: "scholarship-y6-reading-draft.json", title: "Reading Comprehension", judgement: true, idPrefix: "scholarship-y6-rc-" },
];

export const SOURCE_PATHS = {
  adoptionRecord: "docs/reviews/legacy-content-provenance-phase2/owner-adoption-decision.md",
  adr017: "docs/adr/017-legacy-content-unknown-origin-eligibility.md",
  independencePolicy: "docs/REVIEW_INDEPENDENCE_POLICY.md",
  declaredProvenanceDoc: `${REVIEW_DIR}/CONTENT-REVIEW-FINDINGS.md`,
  identityPins: "src/features/question-factory/correctness/scholarship-identity-pins.json",
  revisedList: `${REVIEW_DIR}/revised-in-this-release.json`,
  difficultyRecommendations: `${REVIEW_DIR}/difficulty/difficulty-recommendations.json`,
  pipelineStatus: `${REVIEW_DIR}/status.json`,
  publishedManifestsDir: "content/question-factory/published-manifests",
  qualifiedReviewRecords: `${REVIEW_DIR}/qualified-review-records.json`,
  blindReview: (key: string) => `docs/content-status/scholarship-review-2026-10-16/blind-review-${key}.json`,
} as const;

export const DECLARED_GENERATOR_SENTENCE = "declared generator identity (Anthropic, `claude-sonnet-5`)";

export interface SourceReader {
  readText(relPath: string): string;
  exists(relPath: string): boolean;
  listDir(relPath: string): string[];
}

export const fsReader: SourceReader = {
  readText: (p) => readFileSync(p, "utf8"),
  exists: (p) => existsSync(p),
  listDir: (p) => (existsSync(p) ? readdirSync(p).sort() : []),
};

export function sha256Text(text: string): string {
  return hashContent(text);
}

export function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

export class AuditFailureError extends Error {
  constructor(
    message: string,
    readonly failures: readonly { id: string; reason: string }[],
  ) {
    super(message);
    this.name = "AuditFailureError";
  }
}

/* ------------------------------------------------------- machine key check */

export type MachineMethod = "first_party_recompute" | "closed_language_solver" | "none";

export interface MachineKeyCheck {
  readonly status: EvidenceStatus;
  readonly method: MachineMethod;
  readonly solver?: string;
  /** Present only when the computation succeeded. Never read from a failed result. */
  readonly computedValue?: string | number;
  /** Number of options whose text equals the computed value; the keyed option must be the only one. */
  readonly optionsMatchingComputedValue?: number;
  readonly failureCode?: string;
  readonly detail: string;
  readonly evidenceRef: string;
}

/**
 * Machine-verified arithmetic or closed-language result for one question.
 *
 * `verified` means exactly: an independently coded recomputation (or a closed-language solver driven by the draft's own
 * parameters) reproduces the stored key, and exactly one option text equals the computed value. It does NOT mean
 * the stem was interpreted correctly, that the answer is unique under every reading, or that the item suits the age band.
 */
export function machineKeyCheck(question: DraftQuestion, sidecar: DraftSidecar | undefined): MachineKeyCheck {
  const asQuestion = question as never;
  if (isScholarshipAttestedItem(asQuestion)) {
    const a = verifyFirstPartyScholarshipAttestation(asQuestion);
    const evidenceRef = "src/features/question-factory/correctness/scholarship-attestation.ts: verifyFirstPartyScholarshipAttestation";
    if (!a.ok) {
      return {
        status: "failed",
        method: "first_party_recompute",
        failureCode: a.error ?? "attestation_failed",
        detail: `first-party attestation failed: ${a.error ?? "unknown"}${a.message ? ` (${a.message})` : ""}`,
        evidenceRef,
      };
    }
    return {
      status: "verified",
      method: "first_party_recompute",
      computedValue: a.computedValue,
      optionsMatchingComputedValue: 1,
      detail: `first-party recompute = ${a.computedValue}; attestation requires exactly one matching option and it equals the stored key`,
      evidenceRef,
    };
  }

  const solverName = sidecar?.solver;
  if (solverName && solverName !== "arithmetical_reasoning") {
    const evidenceRef = "src/features/question-factory/correctness/solver-verification.ts: computeSolver";
    const orientation = sidecar.ruleOrientation ?? sidecar.solverParams?.ruleOrientation;
    const c = computeSolver({
      solver: solverName,
      solverParams: (sidecar.solverParams ?? {}) as Record<string, unknown>,
      ruleOrientation: orientation,
      correctValue: sidecar.correctValue,
    });
    // The `ok` flag is checked before `.value` is ever read.
    if (!c.ok) {
      return {
        status: "failed",
        method: "closed_language_solver",
        solver: solverName,
        failureCode: "solver_error",
        detail: `closed-language solver (${solverName}) failed: ${c.error}`,
        evidenceRef,
      };
    }
    const value = c.value;
    const mismatch = solverAnswerError(question as never, value);
    if (mismatch) {
      return {
        status: "failed",
        method: "closed_language_solver",
        solver: solverName,
        computedValue: value,
        failureCode: "key_mismatch",
        detail: `closed-language solver (${solverName}) computed ${value} but the stored key disagrees: ${mismatch}`,
        evidenceRef,
      };
    }
    const matching = question.options.filter((o) => solverValueMatches(value, o.text)).length;
    if (matching !== 1) {
      return {
        status: "failed",
        method: "closed_language_solver",
        solver: solverName,
        computedValue: value,
        optionsMatchingComputedValue: matching,
        failureCode: "option_match_not_unique",
        detail: `closed-language solver (${solverName}) computed ${value}; ${matching} options equal that value (exactly 1 required)`,
        evidenceRef,
      };
    }
    return {
      status: "verified",
      method: "closed_language_solver",
      solver: solverName,
      computedValue: value,
      optionsMatchingComputedValue: matching,
      detail: `closed-language solver (${solverName}) = ${value}; equals the stored key and exactly one option`,
      evidenceRef,
    };
  }

  return {
    status: "not_established",
    method: "none",
    detail: "no machine proof exists for this item; its correctness rests on human semantic judgement",
    evidenceRef: "no first-party recompute entry and no closed-language solver sidecar for this item",
  };
}

/* ----------------------------------------------------------- evidence set */

export interface QuestionEvidence {
  readonly machineVerifiedResult: MachineKeyCheck;
  readonly stemToSolverSemanticVerification: EvidenceField;
  readonly independentAnswerUniqueness: EvidenceField;
  readonly distractorQuality: EvidenceField;
  readonly ageCurriculumAppropriateness: EvidenceField;
  readonly qualifiedHumanReview: EvidenceField;
  /** Mechanical, recomputed observations only. They are not quality judgements. */
  readonly structuralObservations: {
    readonly optionCount: number;
    readonly allOptionTextsDistinct: boolean;
    readonly solverInternalUniquenessScope: string;
  };
}

const NO_QUALIFIED_RECORDS = SOURCE_PATHS.qualifiedReviewRecords;

/**
 * Builds the six evidence fields. Only `machineVerifiedResult` can ever be `verified` or `failed` here; the other five
 * are `not_established` unless a committed qualified-review record exists, and this tool refuses to interpret such a
 * record until its schema is separately adopted (it then reports `failed` rather than guessing).
 */
export function buildQuestionEvidence(
  question: DraftQuestion,
  sidecar: DraftSidecar | undefined,
  reader: SourceReader,
): QuestionEvidence {
  const machine = machineKeyCheck(question, sidecar);
  const texts = question.options.map((o) => o.text.trim());
  const recordsPresent = reader.exists(NO_QUALIFIED_RECORDS);
  const humanField = (requirement: string, what: string): EvidenceField =>
    recordsPresent
      ? {
          status: "failed",
          evidenceRef: NO_QUALIFIED_RECORDS,
          detail: `a qualified-review record file exists but its schema is not adopted; ${what} was not interpreted`,
        }
      : {
          status: "not_established",
          evidenceRef: requirement,
          missingSource: `${NO_QUALIFIED_RECORDS} (a named, qualified reviewer's record bound to this item's D2 hash)`,
        };
  return {
    machineVerifiedResult: machine,
    stemToSolverSemanticVerification: humanField(
      "ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate",
      "stem-to-solver verification",
    ),
    independentAnswerUniqueness: humanField(
      "no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model",
      "independent uniqueness",
    ),
    distractorQuality: humanField("no distractor-quality review recorded", "distractor quality"),
    ageCurriculumAppropriateness: humanField(
      "ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged",
      "age and curriculum appropriateness",
    ),
    qualifiedHumanReview: humanField(
      "ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded",
      "qualified human review",
    ),
    structuralObservations: {
      optionCount: texts.length,
      allOptionTextsDistinct: new Set(texts).size === texts.length,
      solverInternalUniquenessScope:
        "any solver 'unique' flag is scoped to the solver's declared variable domain and constraints, not to every reading of the stem",
    },
  };
}

/* -------------------------------------------------------- source loading */

export interface LoadedSection {
  readonly spec: SectionSpec;
  readonly relPath: string;
  readonly sha256: string;
  readonly data: DraftFile;
}

export function loadSections(reader: SourceReader): LoadedSection[] {
  return SECTIONS.map((spec) => {
    const relPath = `${DRAFTS_DIR}/${spec.file}`;
    const text = reader.readText(relPath);
    return { spec, relPath, sha256: sha256Text(text), data: JSON.parse(text) as DraftFile };
  });
}

export function assertUniqueStableIds(sections: readonly LoadedSection[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const s of sections) {
    for (const q of s.data.questions) {
      if (!q.id.startsWith(s.spec.idPrefix)) {
        throw new Error(`Question id '${q.id}' does not belong in section ${s.spec.key} (expected prefix '${s.spec.idPrefix}')`);
      }
      if (seen.has(q.id)) throw new Error(`Duplicate question id '${q.id}'`);
      seen.add(q.id);
      ordered.push(q.id);
    }
  }
  return ordered;
}

/* --------------------------------------------------- governance records */

export type AdmissionScope =
  | "adr017_initial_engineering_scope"
  | "adr017_conditional_policy_eligible"
  | "adr017_deferred"
  | "no_adopted_route"
  | "not_established";

export interface AdoptedScope {
  readonly parsed: boolean;
  readonly sourceRef: string;
  readonly byId: ReadonlyMap<string, AdmissionScope>;
  readonly problems: readonly string[];
}

const ID_IN_ROW = /`(?:scholarship-y6-)?((?:nr|maths|vr|rc)-\d{3})`/g;

function idsInText(text: string): string[] {
  return [...text.matchAll(ID_IN_ROW)].map((m) => `scholarship-y6-${m[1]}`);
}

/** Derives ADR-017 scope from the owner adoption record's own table rows, so the scope is read, not asserted. */
export function parseAdoptedScope(reader: SourceReader): AdoptedScope {
  const ref = `${SOURCE_PATHS.adoptionRecord} section 2 'What is adopted'`;
  const byId = new Map<string, AdmissionScope>();
  const problems: string[] = [];
  if (!reader.exists(SOURCE_PATHS.adoptionRecord)) {
    return { parsed: false, sourceRef: ref, byId, problems: [`missing source ${SOURCE_PATHS.adoptionRecord}`] };
  }
  const rows = reader.readText(SOURCE_PATHS.adoptionRecord).split(/\r?\n/);
  const rowStarting = (prefix: string) => rows.find((r) => r.startsWith(prefix));
  const initialRow = rowStarting("| Initial engineering scope |");
  const conditionalRow = rowStarting("| `nr-001` |");
  const deferredRow = rowStarting("| `vr-032` |");
  const classRow = rowStarting("| Class B");
  const assign = (row: string | undefined, label: string, column: "first" | "second", scope: AdmissionScope) => {
    if (!row) {
      problems.push(`adoption record row not found: ${label}`);
      return;
    }
    const firstColumnEnd = row.indexOf("|", 1);
    const cell = column === "first" ? row.slice(0, firstColumnEnd) : row.slice(firstColumnEnd + 1);
    const ids = idsInText(cell);
    if (ids.length === 0) problems.push(`no candidate ids parsed from adoption record row: ${label}`);
    for (const id of ids) byId.set(id, scope);
  };
  assign(initialRow, "initial engineering scope", "second", "adr017_initial_engineering_scope");
  assign(conditionalRow, "nr-001", "first", "adr017_conditional_policy_eligible");
  assign(deferredRow, "vr-032", "first", "adr017_deferred");
  assign(classRow, "class B/C", "first", "adr017_deferred");
  const initial = [...byId.values()].filter((v) => v === "adr017_initial_engineering_scope").length;
  if (initial !== 5) problems.push(`expected 5 initial-scope candidates in the adoption record, parsed ${initial}`);
  return { parsed: problems.length === 0, sourceRef: ref, byId, problems };
}

export interface BlindReviewRecord {
  readonly present: boolean;
  readonly reviewer?: string;
  readonly answer?: string;
  readonly claimedUnique?: boolean;
  readonly defensibleOptions?: readonly string[];
}

function loadBlindReviews(reader: SourceReader): Map<string, BlindReviewRecord & { reviewer: string }> {
  const out = new Map<string, BlindReviewRecord & { reviewer: string }>();
  for (const s of SECTIONS) {
    const p = SOURCE_PATHS.blindReview(s.key);
    if (!reader.exists(p)) continue;
    const doc = JSON.parse(reader.readText(p)) as {
      reviewer?: string;
      items?: Array<{ id: string; myAnswer?: string; uniqueAnswer?: boolean; defensibleOptions?: string[] }>;
    };
    for (const item of doc.items ?? []) {
      out.set(item.id, {
        present: true,
        reviewer: doc.reviewer ?? "unrecorded",
        answer: item.myAnswer,
        claimedUnique: item.uniqueAnswer,
        defensibleOptions: item.defensibleOptions,
      });
    }
  }
  return out;
}

/* -------------------------------------------------------------- inventory */

export interface InventoryOptions {
  readonly reader: SourceReader;
}

type Json = Record<string, unknown>;

function blockers(
  evidence: QuestionEvidence,
  scope: AdmissionScope,
  difficultyGate: string,
  judgement: boolean,
): string[] {
  const out: string[] = [];
  out.push("human_approval: not_established (no approval record exists)");
  out.push("provenance_hold: original generation not_established; Phase 1 legacy-import hold; ADR-017 admission route unimplemented");
  out.push("originality: not_established (no external originality assessment on file)");
  if (evidence.ageCurriculumAppropriateness.status !== "verified") out.push("age_curriculum: not_established");
  if (evidence.stemToSolverSemanticVerification.status !== "verified") out.push("stem_to_solver_semantic_check: not_established");
  if (evidence.machineVerifiedResult.status === "failed") out.push(`machine_key_check: FAILED (${evidence.machineVerifiedResult.failureCode})`);
  if (difficultyGate !== "passes") out.push(`difficulty_gate: ${difficultyGate}`);
  if (judgement) out.push("independent_review: not_established (generator unverified; independence cannot be evaluated; ADR-017 permanent)");
  if (scope === "no_adopted_route") out.push("admission_route: none adopted for this item");
  return out;
}

export interface InventoryResult {
  readonly document: Json;
  readonly failures: readonly { id: string; reason: string }[];
  readonly contradictions: readonly string[];
}

/** Builds the full inventory document. Pure: output depends only on what `reader` returns. */
export function buildInventory({ reader }: InventoryOptions): InventoryResult {
  const sections = loadSections(reader);
  const orderedIds = assertUniqueStableIds(sections);

  const readJson = <T>(p: string): T | null => (reader.exists(p) ? (JSON.parse(reader.readText(p)) as T) : null);
  const revisedList = readJson<string[]>(SOURCE_PATHS.revisedList);
  const revised = new Set(revisedList ?? []);
  const recsDoc = readJson<{ assessor?: string; recommendations: Record<string, { recommendation: string; rationale: string; label?: string }> }>(
    SOURCE_PATHS.difficultyRecommendations,
  );
  const statusDoc = readJson<{ items: Array<{ id: string; bucket: string }> }>(SOURCE_PATHS.pipelineStatus);
  const statusById = new Map((statusDoc?.items ?? []).map((i) => [i.id, i.bucket]));
  const pins = readJson<Record<string, string>>(SOURCE_PATHS.identityPins);
  const blindReviews = loadBlindReviews(reader);
  const scope = parseAdoptedScope(reader);
  const declaredText = reader.exists(SOURCE_PATHS.declaredProvenanceDoc) ? reader.readText(SOURCE_PATHS.declaredProvenanceDoc) : "";
  const declarationFound = declaredText.includes(DECLARED_GENERATOR_SENTENCE);

  const manifestFiles = reader.listDir(SOURCE_PATHS.publishedManifestsDir).filter((f) => f.endsWith(".json"));
  const manifestText = manifestFiles.map((f) => reader.readText(`${SOURCE_PATHS.publishedManifestsDir}/${f}`)).join("\n");

  const failures: { id: string; reason: string }[] = [];
  const contradictions: string[] = [];
  const items: Json[] = [];

  for (const s of sections) {
    for (const q of s.data.questions) {
      const candidate = candidateQuestionSchema.parse(q);
      const built = buildPublishedQuestion(candidate);
      const d1 = hashJson(q);
      const d2 = hashJson(candidate);
      const d3 = built.ok ? canonicalQuestionHash(built.question) : null;
      const evidence = buildQuestionEvidence(q, s.data.parameters?.[q.id], reader);
      if (evidence.machineVerifiedResult.status === "failed") failures.push({ id: q.id, reason: evidence.machineVerifiedResult.detail });

      const est = estimateDifficulty({
        prompt: q.prompt,
        stimulusBody: q.stimulus?.body,
        optionTexts: q.options.map((o) => o.text),
        explanation: q.explanation,
      });
      const dev = computeDifficultyDeviation(est.estimatedDifficulty, q.metadata.difficulty as never);
      const gate =
        est.estimateConfidence < FACTORY_THRESHOLDS.MIN_DIFFICULTY_ESTIMATE_CONFIDENCE
          ? "blocked_low_confidence"
          : dev > FACTORY_THRESHOLDS.DIFFICULTY_MATCH_TOLERANCE
            ? "blocked_deviation"
            : "passes";

      const machineOk = evidence.machineVerifiedResult.status === "verified";
      const recomputedBucket = s.spec.judgement ? "awaiting_external_evidence" : gate !== "passes" || !machineOk ? "requires_revision_or_decision" : "ready_for_review";
      const recordedBucket = statusById.get(q.id) ?? null;
      if (recordedBucket !== null && recordedBucket !== recomputedBucket) {
        contradictions.push(`${q.id}: recomputed pipeline bucket '${recomputedBucket}' differs from committed status.json bucket '${recordedBucket}'`);
      }

      const admissionScope: AdmissionScope = scope.parsed ? (scope.byId.get(q.id) ?? "no_adopted_route") : "not_established";
      const pin = pins?.[q.id];
      const published = manifestText.includes(q.id);
      if (published) contradictions.push(`${q.id}: referenced by a committed published manifest, contradicting the 'unpublished' programme state`);

      const rec = recsDoc?.recommendations[q.id];
      const blind = blindReviews.get(q.id);
      const revisedAfterReview = revised.has(q.id);

      items.push({
        id: q.id,
        section: s.spec.key,
        sectionTitle: s.spec.title,
        sourceFile: s.relPath,
        recomputedSourceFacts: {
          sourceFileSha256: s.sha256,
          hashes: {
            d1_rawQuestionHash: d1,
            d2_factoryCandidateHash: d2,
            d3_publicationContentHash: d3,
            hashDomains: "D1: raw JSON draft; D2: factory candidate schema; D3: canonical published Question",
          },
          declaredDifficulty: q.metadata.difficulty,
          difficulty: {
            estimator: est.estimatedDifficulty,
            deviation: dev,
            confidence: est.estimateConfidence,
            gateVerdict: gate,
          },
          identityPin: pins
            ? { present: pin !== undefined, equalsD2: pin === d2, source: SOURCE_PATHS.identityPins }
            : { present: false, equalsD2: false, source: SOURCE_PATHS.identityPins, status: "not_established", missingSource: SOURCE_PATHS.identityPins },
        },
        evidence,
        provenance: {
          verifiedOriginalGeneration: {
            status: "not_established",
            evidenceRef: `${SOURCE_PATHS.adoptionRecord} section 2 and ${SOURCE_PATHS.adr017}: original generation remains unverified`,
            missingSource: "an original generation execution record (provider, model, prompt, promptHash, generatedAt)",
          },
          historicalDeclaredGeneration: declarationFound
            ? {
                status: "declared_unverified",
                declaredIdentity: "anthropic/claude-sonnet-5",
                declarationSource: SOURCE_PATHS.declaredProvenanceDoc,
                note: "A later documentation statement, not an execution record. A declaration, importer, Git author or co-author trailer is not proof of the original generator.",
              }
            : {
                status: "not_established",
                evidenceRef: SOURCE_PATHS.declaredProvenanceDoc,
                missingSource: `${SOURCE_PATHS.declaredProvenanceDoc} containing the declared-generator sentence`,
              },
          repositoryRevisionProvenance: {
            status: pins && pin !== undefined && pin === d2 ? "verified" : "not_established",
            note:
              pins && pin !== undefined && pin !== d2
                ? "A pin exists but differs from the recomputed D2 hash. Whether that is a different hash domain or a stale pin is not reconciled by this audit; the binding is therefore not established."
                : pins && pin === d2
                  ? "Pins the candidate content hash only. It says which bytes were imported, not who generated them."
                  : "No identity pin found for this item.",
            evidenceRef: SOURCE_PATHS.identityPins,
          },
          independentReviewerQualification: {
            status: "not_established",
            evidenceRef: `${SOURCE_PATHS.independencePolicy}; ${SOURCE_PATHS.adoptionRecord} section 2 (independentReviewStatus: not_established_unknown_origin is permanent)`,
            note: "Independence cannot be evaluated while the generator is unverified. Any different-provider review is advisory evidence only.",
          },
        },
        governanceRecords: {
          adr017AdmissionScope: { value: admissionScope, source: scope.sourceRef, parsed: scope.parsed },
          publishedInCommittedManifests: {
            status: published ? "failed" : "verified",
            detail: published ? "found in a committed published manifest" : `absent from all ${manifestFiles.length} committed published manifests`,
            limitation: "Proves absence from committed manifests only; says nothing about any database.",
            evidenceRef: SOURCE_PATHS.publishedManifestsDir,
          },
          humanApproval: {
            status: "not_established",
            evidenceRef: `${SOURCE_PATHS.adoptionRecord} section 2 requirement 6: authorised human approval control does not exist`,
            missingSource: "an authenticated human approval record bound to this item's D3 hash",
          },
        },
        policyDerivedAssessment: {
          publicationEligibility: "refused_by_phase1_fail_closed_gates",
          basis: `${SOURCE_PATHS.adoptionRecord} section 2: Phase 1 gates unchanged and refuse kind: legacy_import`,
          blockingRequirements: blockers(evidence, admissionScope, gate, s.spec.judgement),
        },
        historicalAdvisoryFindings: {
          pipelineBucket: { recorded: recordedBucket, recomputed: recomputedBucket, source: SOURCE_PATHS.pipelineStatus },
          sixteenOctBlindReview: blind
            ? {
                reviewer: blind.reviewer,
                reviewerAnswer: blind.answer ?? null,
                agreesWithStoredKey: blind.answer === q.answerKey.optionId,
                claimedUniqueAnswer: blind.claimedUnique ?? null,
                defensibleOptions: blind.defensibleOptions ?? [],
                source: SOURCE_PATHS.blindReview(s.spec.key),
                bindsCurrentRevision: "not_established",
                bindingNote: revisedAfterReview
                  ? "item revised after this review (listed in revised-in-this-release.json): review is stale"
                  : "the review record carries no content hash, so it cannot be bound to the current bytes",
                status: "advisory_model_generated",
              }
            : { status: "not_established", missingSource: SOURCE_PATHS.blindReview(s.spec.key) },
          difficultyAdvisory: rec
            ? {
                recommendation: rec.recommendation,
                rationale: rec.rationale,
                assessor: recsDoc?.assessor ? recsDoc.assessor.split(". ")[0] : "unrecorded",
                status: "advisory_same_provider_family_as_declared_generator",
                source: SOURCE_PATHS.difficultyRecommendations,
              }
            : { status: "not_established", missingSource: `${SOURCE_PATHS.difficultyRecommendations} (no entry for this id)` },
          nineteenOctOpenAiReview: {
            status: "not_established",
            evidenceRef: `${SOURCE_PATHS.declaredProvenanceDoc} (narrative only)`,
            missingSource: "the item-level response file for the 19 Oct external review; it is not committed",
          },
          revisedAfterEarlierReviews: revisedAfterReview,
        },
      });
    }
  }

  // Exact-ID uniqueness and ordering were asserted on load; assert the emitted order is that order.
  const emitted = items.map((i) => i.id as string);
  if (emitted.join("|") !== orderedIds.join("|")) throw new Error("Inventory item order diverged from source order");

  contradictions.push(...checkInventoryConsistency(items));

  const count = (pred: (i: Json) => boolean) => items.filter(pred).length;
  const bySection = (key: string, pred: (i: Json) => boolean) => count((i) => i.section === key && pred(i));
  const ev = (i: Json) => i.evidence as QuestionEvidence;
  const facts = (i: Json) => i.recomputedSourceFacts as { difficulty: { gateVerdict: string } };
  const scopeOf = (i: Json) => (i.governanceRecords as { adr017AdmissionScope: { value: AdmissionScope } }).adr017AdmissionScope.value;

  const missingEvidence = [
    { field: "qualified human review, stem-to-solver check, independent uniqueness, distractor quality, age/curriculum fit", missingSource: SOURCE_PATHS.qualifiedReviewRecords, affectedItems: items.length },
    { field: "verified original generation", missingSource: "original generation execution record (provider, model, prompt, promptHash, generatedAt)", affectedItems: items.length },
    { field: "human approval", missingSource: "authenticated approval record bound to D3 (control does not exist; ADR-017 Phase 2b)", affectedItems: items.length },
    { field: "19 Oct external review item-level responses", missingSource: "committed response file", affectedItems: count((i) => i.section === "vr" || i.section === "rc") },
    ...(recsDoc ? [] : [{ field: "difficulty advisory", missingSource: SOURCE_PATHS.difficultyRecommendations, affectedItems: items.length }]),
  ];

  const document: Json = {
    schemaVersion: 2,
    generation: {
      mode: "deterministic",
      clock: "none: no wall-clock value is read or written",
      note: "Output is a pure function of the committed source files below. Regenerate with `npx tsx scripts/generate-scholarship-inventory.mts`; verify without writing using `--check`.",
      sourceFiles: sections.map((s) => ({ path: s.relPath, sha256: s.sha256 })),
      governanceInputs: [
        SOURCE_PATHS.adoptionRecord,
        SOURCE_PATHS.revisedList,
        SOURCE_PATHS.difficultyRecommendations,
        SOURCE_PATHS.pipelineStatus,
        SOURCE_PATHS.identityPins,
        SOURCE_PATHS.declaredProvenanceDoc,
      ].map((p) => ({ path: p, sha256: reader.exists(p) ? sha256Text(reader.readText(p)) : "not_established: file missing" })),
    },
    fieldCategories: {
      recomputedSourceFacts: "recomputed from source bytes on every run",
      evidence: "per-question evidence statuses; only the machine result can be verified or failed",
      provenance: "verified generation, historical declaration, repository revision and reviewer qualification, kept separate",
      governanceRecords: "read from committed primary records",
      policyDerivedAssessment: "derived from adopted policy, not independently observed",
      historicalAdvisoryFindings: "model-generated advisory records; never admission evidence",
    },
    totalQuestions: items.length,
    summary: {
      itemsBySection: Object.fromEntries(SECTIONS.map((s) => [s.key, bySection(s.key, () => true)])),
      machineKeyCheck: {
        verified: count((i) => ev(i).machineVerifiedResult.status === "verified"),
        failed: count((i) => ev(i).machineVerifiedResult.status === "failed"),
        not_established: count((i) => ev(i).machineVerifiedResult.status === "not_established"),
        bySectionVerified: Object.fromEntries(SECTIONS.map((s) => [s.key, bySection(s.key, (i) => ev(i).machineVerifiedResult.status === "verified")])),
        byMethodVerified: {
          first_party_recompute: count((i) => ev(i).machineVerifiedResult.status === "verified" && ev(i).machineVerifiedResult.method === "first_party_recompute"),
          closed_language_solver: count((i) => ev(i).machineVerifiedResult.status === "verified" && ev(i).machineVerifiedResult.method === "closed_language_solver"),
        },
      },
      humanAndSemanticEvidence: {
        stemToSolverSemanticVerification_verified: count((i) => ev(i).stemToSolverSemanticVerification.status === "verified"),
        independentAnswerUniqueness_verified: count((i) => ev(i).independentAnswerUniqueness.status === "verified"),
        distractorQuality_verified: count((i) => ev(i).distractorQuality.status === "verified"),
        ageCurriculumAppropriateness_verified: count((i) => ev(i).ageCurriculumAppropriateness.status === "verified"),
        qualifiedHumanReview_verified: count((i) => ev(i).qualifiedHumanReview.status === "verified"),
        notEstablishedOfTotal: items.length,
      },
      provenance: {
        verifiedOriginalGeneration: 0,
        historicalDeclaredGenerationUnverified: count(
          (i) => (i.provenance as { historicalDeclaredGeneration: { status: string } }).historicalDeclaredGeneration.status === "declared_unverified",
        ),
        unknownOrInsufficientlyVerifiedGeneration: items.length,
        repositoryRevisionPinVerified: count(
          (i) => (i.provenance as { repositoryRevisionProvenance: { status: string } }).repositoryRevisionProvenance.status === "verified",
        ),
      },
      difficultyGate: {
        passes: count((i) => facts(i).difficulty.gateVerdict === "passes"),
        blocked: count((i) => facts(i).difficulty.gateVerdict !== "passes"),
        bySectionBlocked: Object.fromEntries(SECTIONS.map((s) => [s.key, bySection(s.key, (i) => facts(i).difficulty.gateVerdict !== "passes")])),
      },
      adr017Scope: {
        initialEngineeringScope: count((i) => scopeOf(i) === "adr017_initial_engineering_scope"),
        conditionalPolicyEligible: count((i) => scopeOf(i) === "adr017_conditional_policy_eligible"),
        deferred: count((i) => scopeOf(i) === "adr017_deferred"),
        noAdoptedRoute: count((i) => scopeOf(i) === "no_adopted_route"),
        notEstablished: count((i) => scopeOf(i) === "not_established"),
      },
      historicalPipelineBuckets: {
        ready_for_review: count((i) => (i.historicalAdvisoryFindings as { pipelineBucket: { recomputed: string } }).pipelineBucket.recomputed === "ready_for_review"),
        requires_revision_or_decision: count((i) => (i.historicalAdvisoryFindings as { pipelineBucket: { recomputed: string } }).pipelineBucket.recomputed === "requires_revision_or_decision"),
        awaiting_external_evidence: count((i) => (i.historicalAdvisoryFindings as { pipelineBucket: { recomputed: string } }).pipelineBucket.recomputed === "awaiting_external_evidence"),
      },
      governance: {
        humanApproved: 0,
        publishedInCommittedManifests: count((i) => (i.governanceRecords as { publishedInCommittedManifests: { status: string } }).publishedInCommittedManifests.status === "failed"),
      },
      staleAdvisoryReviews: { itemsRevisedAfterEarlierReviews: revised.size },
    },
    missingEvidence,
    contradictions: [...contradictions],
    auditStatus: failures.length === 0 && contradictions.length === 0 ? "consistent" : "FAILED",
    items,
  };
  return { document, failures, contradictions };
}

/**
 * Detects contradictory claims inside one inventory: a successful status asserted without its prerequisite evidence.
 * Exported so tests can feed it deliberately inconsistent items.
 */
export function checkInventoryConsistency(items: readonly Json[]): string[] {
  const out: string[] = [];
  for (const i of items) {
    const id = String(i.id);
    const ev = i.evidence as QuestionEvidence | undefined;
    const prov = i.provenance as { verifiedOriginalGeneration?: { status?: string }; independentReviewerQualification?: { status?: string } } | undefined;
    const gov = i.governanceRecords as { humanApproval?: { status?: string } } | undefined;
    const policy = i.policyDerivedAssessment as { publicationEligibility?: string } | undefined;
    if (ev?.machineVerifiedResult.status === "verified" && ev.machineVerifiedResult.optionsMatchingComputedValue !== 1) {
      out.push(`${id}: machine result 'verified' without exactly one option equal to the computed value`);
    }
    if (ev?.machineVerifiedResult.status === "verified" && ev.machineVerifiedResult.computedValue === undefined) {
      out.push(`${id}: machine result 'verified' without a computed value`);
    }
    if (ev?.machineVerifiedResult.status === "failed" && ev.stemToSolverSemanticVerification.status === "verified") {
      out.push(`${id}: semantic verification 'verified' while the machine check failed`);
    }
    const humanVerified = [ev?.stemToSolverSemanticVerification, ev?.independentAnswerUniqueness, ev?.distractorQuality, ev?.ageCurriculumAppropriateness]
      .filter((f) => f?.status === "verified").length;
    if (humanVerified > 0 && ev?.qualifiedHumanReview.status !== "verified") {
      out.push(`${id}: a human-judgement field is 'verified' but no qualified human review is verified`);
    }
    if (prov?.independentReviewerQualification?.status === "verified" && prov.verifiedOriginalGeneration?.status !== "verified") {
      out.push(`${id}: independent reviewer 'verified' while original generation is not verified`);
    }
    if (policy?.publicationEligibility && !policy.publicationEligibility.startsWith("refused") && gov?.humanApproval?.status !== "verified") {
      out.push(`${id}: publication eligibility asserted without a verified human approval`);
    }
  }
  return out;
}

export function serialiseInventory(document: Json): string {
  return `${JSON.stringify(document, null, 2)}\n`;
}

/* ---------------------------------------------------- reviewer packets */

export interface PacketSection {
  readonly section: LoadedSection;
  readonly evidence: Map<string, QuestionEvidence>;
}

export function auditSection(section: LoadedSection, reader: SourceReader): PacketSection {
  const evidence = new Map<string, QuestionEvidence>();
  for (const q of section.data.questions) evidence.set(q.id, buildQuestionEvidence(q, section.data.parameters?.[q.id], reader));
  return { section, evidence };
}

/** Throws unless every machine check is verified or honestly not_established; a failed check never reaches a report. */
export function assertNoMachineFailures(audit: PacketSection): void {
  const failures: { id: string; reason: string }[] = [];
  for (const [id, e] of audit.evidence) {
    if (e.machineVerifiedResult.status === "failed") failures.push({ id, reason: e.machineVerifiedResult.detail });
  }
  if (failures.length > 0) {
    throw new AuditFailureError(
      `${audit.section.spec.title}: ${failures.length} machine key check(s) FAILED; refusing to generate reports. ${failures.map((f) => `${f.id}: ${f.reason}`).join("; ")}`,
      failures,
    );
  }
}

const BLIND_FIELD_ROWS = [
  "My selected option",
  "Working / reasoning",
  "Any other defensible option(s)",
  "Is exactly one option correct? (yes / no)",
  "Ambiguity or interpretation concerns",
  "Distractor quality (good / weak, with notes)",
  "Suitable for a Year 6 scholarship candidate? (yes / no, with notes)",
  "Estimated difficulty (easy / medium / challenging)",
  "Recommendation (accept / revise / reject)",
] as const;

/** The only fields a reviewer is shown. Anything not listed here can never reach a blind packet. */
export function blindVisibleFields(q: DraftQuestion): Json {
  return {
    id: q.id,
    prompt: q.prompt,
    ...(q.stimulus ? { stimulus: q.stimulus } : {}),
    options: q.options.map((o) => ({ id: o.id, text: o.text })),
    ...(q.visuals && q.visuals.length > 0 ? { visuals: q.visuals } : {}),
  };
}

export const BLIND_HASH_LINE_PREFIX = "- **Packet SHA-256:** ";

export function blindItemHash(q: DraftQuestion): string {
  return hashJson(blindVisibleFields(q));
}

function renderBlindItem(q: DraftQuestion, index: number): string {
  let md = `### Item ${index + 1} of the packet: \`${q.id}\`\n\n`;
  md += `- Item content hash (over exactly the fields shown below): \`${blindItemHash(q)}\`\n\n`;
  md += `**Question**\n\n${q.prompt}\n\n`;
  if (q.stimulus) {
    md += `**Stimulus**\n\n${typeof q.stimulus.body === "string" ? q.stimulus.body : "```json\n" + JSON.stringify(q.stimulus, null, 2) + "\n```"}\n\n`;
  }
  md += `**Options**\n\n`;
  for (const o of q.options) md += `- (${o.id}) ${o.text}\n`;
  md += `\n`;
  if (q.visuals && q.visuals.length > 0) {
    md += `**Diagram / visual (structured data)**\n\n\`\`\`json\n${JSON.stringify(q.visuals, null, 2)}\n\`\`\`\n\n`;
  }
  md += `**Reviewer decision (complete every row)**\n\n| Field | Reviewer entry |\n|---|---|\n`;
  for (const row of BLIND_FIELD_ROWS) md += `| ${row} | |\n`;
  md += `\n---\n\n`;
  return md;
}

export interface BlindPacket {
  readonly text: string;
  readonly packetSha256: string;
  readonly itemCount: number;
  readonly sourceFile: string;
  readonly sourceFileSha256: string;
  readonly itemHashes: Record<string, string>;
}

/** Computes the packet hash over the text with the hash line removed, LF-normalised. */
export function packetHashOf(textWithHashLine: string): string {
  const withoutHashLine = textWithHashLine
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => !line.startsWith(BLIND_HASH_LINE_PREFIX))
    .join("\n");
  return hashContent(withoutHashLine);
}

export function buildBlindPacket(section: LoadedSection, packetId: string): BlindPacket {
  const { spec, relPath, sha256, data } = section;
  let body = `# ${spec.title}: answer-blind reviewer packet (Year 6 Scholarship)\n\n`;
  body += `> **Answer-blind.** This packet contains the complete question material only. Nothing that identifies or supports a particular choice is included, and no difficulty or skill labels are shown. Work each item independently from what is printed here.\n\n`;
  body += `## Binding\n\n`;
  body += `- **Packet ID:** \`${packetId}\`\n`;
  body += `- **Source file (bytes this packet was generated from):** \`${relPath}\`\n`;
  body += `- **Source file SHA-256 (LF-normalised):** \`${sha256}\`\n`;
  body += `- **Item count:** ${data.questions.length}\n`;
  body += `${BLIND_HASH_LINE_PREFIX}__PACKET_HASH__\n`;
  body += `- **Hash rule:** remove the line beginning \`Packet SHA-256\`, normalise line endings to LF, then SHA-256 the remaining text. A decision sheet that cites a different packet hash does not apply to this packet.\n\n`;
  body += `## Reviewer identity (reviewer completes)\n\n| Field | Entry |\n|---|---|\n`;
  for (const row of ["Reviewer name", "Qualification(s) and relevant experience", "Organisation / provider and model (if an AI reviewer)", "Fresh session with no prior context? (yes / no)", "Date and time of review", "Packet SHA-256 as received"]) {
    body += `| ${row} | |\n`;
  }
  body += `\nA reviewer's decisions are advisory input. They do not approve, publish or release any item.\n\n---\n\n`;
  data.questions.forEach((q, i) => {
    body += renderBlindItem(q, i);
  });
  const hash = packetHashOf(body.replace("__PACKET_HASH__", ""));
  const text = body.replace("__PACKET_HASH__", `\`${hash}\``);
  const itemHashes: Record<string, string> = {};
  for (const q of data.questions) itemHashes[q.id] = blindItemHash(q);
  return { text, packetSha256: hash, itemCount: data.questions.length, sourceFile: relPath, sourceFileSha256: sha256, itemHashes };
}

/** Terms that must never appear in a blind packet. Checked against the whole packet text. */
export const BLIND_FORBIDDEN_TERMS: readonly RegExp[] = [
  /answer[ -]?key/i,
  /answerkey/i,
  /correct (?:answer|option|choice)/i,
  /\bexplanation\b/i,
  /\bsolver\b/i,
  /recomput/i,
  /first-party/i,
  /machine[- ]verified/i,
  /matches? (?:the )?key/i,
  /\boptionId\b/,
  /\bdeclared (?:key|difficulty)\b/i,
  /\bproof\b/i,
];

export interface DisclosureFinding {
  readonly itemId: string | null;
  readonly kind: "forbidden_term" | "explanation_text" | "skill_label" | "key_marker";
  readonly detail: string;
}

/** Scans packet text for accidental disclosure against the full source questions. */
export function scanBlindPacketForDisclosure(text: string, questions: readonly DraftQuestion[]): DisclosureFinding[] {
  const findings: DisclosureFinding[] = [];
  // Question wording may legitimately contain a word such as "correct answer" (for example a marking-scheme stem). Only
  // lines that are NOT verbatim question material (prompt, stimulus, option lines) are checked against the forbidden terms.
  const visibleLines = new Set<string>();
  for (const q of questions) {
    const parts = [q.prompt, typeof q.stimulus?.body === "string" ? q.stimulus.body : ""];
    for (const part of parts) for (const line of part.split(/\r?\n/)) if (line.trim()) visibleLines.add(line.trim());
    for (const o of q.options) visibleLines.add(`- (${o.id}) ${o.text}`.trim());
  }
  for (const line of text.split(/\r?\n/)) {
    if (visibleLines.has(line.trim())) continue;
    for (const re of BLIND_FORBIDDEN_TERMS) {
      const m = re.exec(line);
      if (m) findings.push({ itemId: null, kind: "forbidden_term", detail: `matched ${re} at '${m[0]}' in scaffold line: ${line.trim().slice(0, 80)}` });
    }
  }
  const lowered = text.toLowerCase();
  for (const q of questions) {
    const explanation = q.explanation.trim();
    if (explanation.length > 0 && lowered.includes(explanation.toLowerCase())) {
      findings.push({ itemId: q.id, kind: "explanation_text", detail: "full explanation text present" });
    }
    for (const sentence of explanation.split(/(?<=[.!?])\s+/)) {
      const s = sentence.trim();
      if (s.length >= 28 && lowered.includes(s.toLowerCase())) {
        findings.push({ itemId: q.id, kind: "explanation_text", detail: `explanation sentence present: '${s.slice(0, 60)}'` });
      }
    }
    const skill = q.metadata.skill;
    if (skill && lowered.includes(skill.toLowerCase())) findings.push({ itemId: q.id, kind: "skill_label", detail: `skill label '${skill}' present` });
    const key = q.options.find((o) => o.id === q.answerKey.optionId);
    if (key) {
      const marker = new RegExp(`\\(${key.id}\\)[^\\n]*\\((?:correct|key|answer)\\)`, "i");
      if (marker.test(text)) findings.push({ itemId: q.id, kind: "key_marker", detail: "keyed option carries a marker" });
    }
  }
  return findings;
}

/* ---------------------------------------------------- answer-key companion */

export function buildAnswerKeyCompanion(section: LoadedSection, audit: PacketSection, packet: BlindPacket, packetFileName: string): string {
  const { spec, data } = section;
  let md = `# ${spec.title}: answer-key companion (CONTROLLED)\n\n`;
  md += `> **Controlled distribution.** This file is the answer key for \`${packetFileName}\`. It must never be given to a reviewer, pasted into a reviewer session or attached to a reviewer request before that reviewer's decisions are returned. Distribute only the packet file. Repository access is not an access control: this companion is committed so the owner can adjudicate returned decisions, not so reviewers can see it.\n\n`;
  md += `- **Paired packet:** \`${packetFileName}\`\n`;
  md += `- **Paired packet SHA-256:** \`${packet.packetSha256}\`\n`;
  md += `- **Source file SHA-256 (LF-normalised):** \`${section.sha256}\`\n\n`;
  md += `The machine column records only whether a recomputation reproduces the stored key. It does not establish interpretation, uniqueness, distractor quality or age-fit.\n\n`;
  md += `| Item | Stored key | Key option text | Machine result | Explanation (author's, unreviewed) |\n|---|---|---|---|---|\n`;
  for (const q of data.questions) {
    const m = audit.evidence.get(q.id)!.machineVerifiedResult;
    const text = q.options.find((o) => o.id === q.answerKey.optionId)?.text ?? "";
    md += `| \`${q.id}\` | ${q.answerKey.optionId} | ${text.replace(/\|/g, "\\|")} | ${m.status}: ${m.detail.replace(/\|/g, "\\|")} | ${q.explanation.replace(/\n/g, " ").replace(/\|/g, "\\|")} |\n`;
  }
  return md + "\n";
}

export function buildPacketManifest(
  entries: readonly { packetId: string; packetFile: string; companionFile: string; packet: BlindPacket }[],
): string {
  return `${JSON.stringify(
    {
      schemaVersion: 1,
      note: "Binds each answer-blind packet to the exact source bytes and packet hash. Contains no answer-revealing data. Not served by any runtime route and not part of any browser bundle.",
      packets: entries.map((e) => ({
        packetId: e.packetId,
        packetFile: e.packetFile,
        answerKeyCompanionFile: e.companionFile,
        packetSha256: e.packet.packetSha256,
        sourceFile: e.packet.sourceFile,
        sourceFileSha256: e.packet.sourceFileSha256,
        itemCount: e.packet.itemCount,
        itemHashes: e.packet.itemHashes,
      })),
    },
    null,
    2,
  )}\n`;
}

/* --------------------------------------------------------- owner packs */

export function renderOwnerPack(
  section: LoadedSection,
  audit: PacketSection,
  adoptedScope: AdoptedScope,
  statusBuckets: ReadonlyMap<string, string>,
  recs: Record<string, { recommendation: string; rationale: string; label?: string }>,
  assessor: string,
  packetFileName: string,
  packetSha256: string,
  docTitle: string,
  reader: SourceReader = fsReader,
): string {
  assertNoMachineFailures(audit);
  const { data } = section;
  const total = data.questions.length;
  const statuses = [...audit.evidence.values()];
  const verified = statuses.filter((e) => e.machineVerifiedResult.status === "verified").length;
  const notEst = statuses.filter((e) => e.machineVerifiedResult.status === "not_established").length;
  const firstParty = statuses.filter((e) => e.machineVerifiedResult.method === "first_party_recompute").length;
  const closed = statuses.filter((e) => e.machineVerifiedResult.method === "closed_language_solver").length;

  const pinsRaw = reader.readText(SOURCE_PATHS.identityPins);
  const pins = pinsRaw ? (JSON.parse(pinsRaw) as Record<string, string>) : null;

  let verifiedPins = 0;
  let mismatchedPins = 0;
  let missingPins = 0;
  for (const q of data.questions) {
    const candidate = candidateQuestionSchema.parse(q);
    const d2 = hashJson(candidate);
    const pin = pins?.[q.id];
    if (pins && pin !== undefined) {
      if (pin === d2) {
        verifiedPins++;
      } else {
        mismatchedPins++;
      }
    } else {
      missingPins++;
    }
  }

  const gateOf = (q: DraftQuestion) => {
    const est = estimateDifficulty({ prompt: q.prompt, stimulusBody: q.stimulus?.body, optionTexts: q.options.map((o) => o.text), explanation: q.explanation });
    const dev = computeDifficultyDeviation(est.estimatedDifficulty, q.metadata.difficulty as never);
    return { est, dev, blocked: est.estimatedDifficulty !== q.metadata.difficulty };
  };
  const blocked = data.questions.filter((q) => gateOf(q).blocked);
  const scopeIds = (s: AdmissionScope) => data.questions.filter((q) => adoptedScope.byId.get(q.id) === s).map((q) => q.id);
  const initial = scopeIds("adr017_initial_engineering_scope");

  let md = `# ${docTitle}: internal owner pack and decision table\n\n`;
  md += `> **Internal, answer-bearing.** This pack contains keys, explanations and machine results. **Never send it to a reviewer.** Reviewers receive only \`answer-blind/${packetFileName}\` (packet SHA-256 \`${packetSha256}\`). This document is AI-generated advisory material. It is not qualified human review, not independent evidence for any gate, and conveys no authority to approve, publish or deploy.\n\n`;
  md += `**Audit status:** ${notEst === 0 ? "all machine key checks that exist passed" : `${verified} machine checks passed, ${notEst} have no machine proof`}; 0 failed. (A failed check aborts generation.)\n\n`;
  md += `## 1. Evidence summary (recomputed)\n\n`;
  md += `| Evidence dimension | verified | failed | not_established | Evidence reference |\n|---|---:|---:|---:|---|\n`;
  md += `| Machine-verified arithmetic / closed-language result (${firstParty} first-party recompute, ${closed} closed-language solver) | ${verified} | 0 | ${notEst} | scholarship-attestation.ts, solver-verification.ts |\n`;
  for (const [label, ref] of [
    ["Stem-to-solver semantic verification", "ADR-017 requirement 2: never performed"],
    ["Independently checked answer uniqueness", "no independent uniqueness record"],
    ["Distractor quality", "no distractor review record"],
    ["Age and curriculum appropriateness", "ADR-017 requirement 5: no reviewer engaged"],
    ["Qualified human review", "no qualified reviewer engaged"],
  ] as const) {
    md += `| ${label} | 0 | 0 | ${total} | ${ref} |\n`;
  }
  md += `\nA matching key and solver result establishes arithmetic consistency only. It does not establish that the stem was interpreted as intended, that no second reading exists, that the distractors are good, or that the item suits Year 6.\n\n`;
  md += `## 2. Status\n\n`;
  md += `- **Total questions:** ${total}\n`;
  md += `- **Committed pipeline buckets (status.json):** ${[...new Set(data.questions.map((q) => statusBuckets.get(q.id) ?? "not_established"))].sort().map((b) => `${b}: ${data.questions.filter((q) => (statusBuckets.get(q.id) ?? "not_established") === b).length}`).join("; ")}\n`;
  md += `- **Publication eligibility today:** 0 of ${total}. Phase 1 fail-closed gates refuse legacy-import content.\n`;
  md += `- **ADR-017 scope (read from the owner adoption record):** ${initial.length} initial engineering candidate(s)${initial.length ? ` (${initial.map((i) => `\`${i}\``).join(", ")})` : ""}; adopted policy only, implementation unbuilt. All other items have no adopted admission route.\n`;
  md += `- **Original generation:** not_established for every item (see section 4).\n\n`;

  md += `## 3. Difficulty decision table (declared label differs from estimator)\n\n`;
  md += `Advisory recommendations come from documented assessor \`${assessor}\`. The historical generator declaration (\`anthropic/claude-sonnet-5\`) is unverified, and true original generation remains unknown. Under \`docs/REVIEW_INDEPENDENCE_POLICY.md\` and ADR-017, independence cannot be established against an unknown original generator. These recommendations remain advisory input and do not constitute production-grade independent evidence.\n\n`;
  md += `| ID | Declared | Estimator | Advisory recommendation | Advisory rationale | Owner decision (BLANK) |\n|---|---|---|---|---|---|\n`;
  for (const q of blocked) {
    const g = gateOf(q);
    const rec = recs[q.id];
    md += `| \`${q.id}\` | \`${q.metadata.difficulty}\` | \`${g.est.estimatedDifficulty}\` | ${rec ? `${rec.recommendation}${rec.label ? ` (${rec.label})` : ""}` : "not_established (no advisory entry)"} | ${rec ? rec.rationale.replace(/\|/g, "\\|") : "no advisory entry"} | |\n`;
  }

  const repoStatus =
    pins === null || missingPins === total
      ? "not_established"
      : mismatchedPins === 0 && missingPins === 0
        ? `verified (${verifiedPins}/${total} D2 pins match)`
        : `partially verified (${verifiedPins}/${total} verified, ${mismatchedPins} mismatched, ${missingPins} missing)`;

  const repoEvidence =
    pins === null
      ? `no identity pins found in ${SOURCE_PATHS.identityPins}`
      : mismatchedPins === 0 && missingPins === 0
        ? `all ${total} items match recomputed D2 candidate hashes in ${SOURCE_PATHS.identityPins}; D1/D2/D3 hashes recomputed; binds imported bytes, not original generation (unknown)`
        : `${verifiedPins} of ${total} match recomputed D2 hashes; ${mismatchedPins} pins present in ${SOURCE_PATHS.identityPins} differ from D2 (binding not established); ${missingPins} missing; D1/D2/D3 recomputed; binds imported bytes, not original generation (unknown)`;

  md += `\n## 4. Provenance reconciliation\n\n`;
  md += `| Aspect | Status | Evidence |\n|---|---|---|\n`;
  md += `| Verified original generation | not_established | no execution record (provider, model, prompt, hash, timestamp) exists |\n`;
  md += `| Historical declared generation | declared, unverified | ${SOURCE_PATHS.declaredProvenanceDoc} states \`anthropic/claude-sonnet-5\`; a documentation statement, not an execution record |\n`;
  md += `| Repository revision provenance | ${repoStatus} | ${repoEvidence} |\n`;
  md += `| Independent reviewer identity and qualification | not_established | independence cannot be evaluated against an unknown original generator (ADR-017; REVIEW_INDEPENDENCE_POLICY) |\n\n`;
  md += `### Repository revision binding details for this section\n`;
  md += `- **Verified D2 identity pins:** ${verifiedPins} of ${total} items match the recomputed D2 factory candidate hash in \`${SOURCE_PATHS.identityPins}\`.\n`;
  md += `- **Present but mismatched pins:** ${mismatchedPins} of ${total} items have identity pins in \`${SOURCE_PATHS.identityPins}\` that differ from recomputed D2 candidate hashes (binding not established; a mismatched pin cannot be described as verified repository-revision binding).\n`;
  md += `- **Missing pins:** ${missingPins} of ${total} items have no entry in \`${SOURCE_PATHS.identityPins}\`.\n`;
  md += `- **Recomputed D1/D2/D3 source hashes:** D1 (raw JSON draft), D2 (factory candidate), and D3 (canonical published Question) hashes were successfully recomputed for all ${total} items in this section.\n`;
  md += `- **Unknown original generation:** Identity pins bind imported candidate bytes only, not their author or generating model. Original generation remains unknown / not_established across all items.\n\n`;
  md += `A Git author or co-author trailer, an importer, a historical declaration or a reviewing model is not proof of the original generator.\n\n`;

  md += `## 5. Per-question evidence\n\n`;
  for (const q of data.questions) {
    const e = audit.evidence.get(q.id)!;
    const g = gateOf(q);
    const candidate = candidateQuestionSchema.parse(q);
    const built = buildPublishedQuestion(candidate);
    const d1 = hashJson(q);
    const d2 = hashJson(candidate);
    const d3 = built.ok ? canonicalQuestionHash(built.question) : null;
    const pin = pins?.[q.id];
    const pinNote =
      pins && pin !== undefined
        ? pin === d2
          ? `\`${pin}\` (verified D2 match)`
          : `\`${pin}\` (mismatched vs D2 \`${d2}\`; binding not established)`
        : "missing";
    const optText = q.options.find((o) => o.id === q.answerKey.optionId)?.text;
    const rec = recs[q.id];
    const scopeValue = adoptedScope.byId.get(q.id) ?? "no_adopted_route";
    md += `### ${q.id} (${q.metadata.skill})\n\n`;
    md += `- **Prompt:** ${q.prompt.replace(/\n/g, " ")}\n`;
    md += `- **Stored key:** \`${q.answerKey.optionId}\` (${optText})\n`;
    md += `- **Evidence:**\n\n| Dimension | Status | Evidence reference |\n|---|---|---|\n`;
    md += `| Machine-verified result | ${e.machineVerifiedResult.status} | ${e.machineVerifiedResult.detail.replace(/\|/g, "\\|")} |\n`;
    for (const [label, f] of [
      ["Stem-to-solver semantic verification", e.stemToSolverSemanticVerification],
      ["Independent answer uniqueness", e.independentAnswerUniqueness],
      ["Distractor quality", e.distractorQuality],
      ["Age and curriculum appropriateness", e.ageCurriculumAppropriateness],
      ["Qualified human review", e.qualifiedHumanReview],
    ] as const) {
      md += `| ${label} | ${f.status} | ${f.evidenceRef.replace(/\|/g, "\\|")} |\n`;
    }
    md += `\n- **Mechanical observations (not quality judgements):** ${e.structuralObservations.optionCount} options; option texts ${e.structuralObservations.allOptionTextsDistinct ? "all distinct" : "NOT all distinct"}.\n`;
    md += `- **Difficulty:** declared \`${q.metadata.difficulty}\`, estimator \`${g.est.estimatedDifficulty}\` (confidence ${g.est.estimateConfidence.toFixed(2)})${rec ? `; advisory recommendation \`${rec.recommendation}\` (${rec.rationale})` : ""}\n`;
    md += `- **Hash bindings:** D1 \`${d1}\`; D2 \`${d2}\`; D3 \`${d3}\`; identity pin: ${pinNote}\n`;
    md += `- **ADR-017 scope:** ${scopeValue}\n`;
    md += `- **Owner decision:** [                     ]\n\n`;
  }
  md += `## 6. Reviewer material\n\n`;
  md += `The answer-blind packet for this section is \`answer-blind/${packetFileName}\` (SHA-256 \`${packetSha256}\`). Its answer-key companion is held separately under \`answer-key-companions/\`.\n`;
  return md;
}
