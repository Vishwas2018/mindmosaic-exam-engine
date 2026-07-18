# Governed Question Factory — Architecture Design

Status: living document, tracks `integration/governed-question-factory`.

## 1. Purpose

The question factory is a governed pipeline that turns untrusted legacy exam
content into publishable, curriculum-aligned questions for the MindMosaic
exam engine. It never replaces `src/features/exam-engine/` — schemas,
renderers, and the scoring engine there remain the single source of truth;
the factory only produces candidates that are validated *against* them and,
once fully published, hands off unchanged output to exam-engine.

Design goals:

- **Untrusted by default.** Legacy donor metadata (approval status, review
  status, claimed correctness) carries zero authority. Every claim is
  independently re-derived or re-checked.
- **Deterministic and replay-safe.** Same input always produces the same
  output; retries after transient failures must not duplicate work or
  silently diverge.
- **Fail closed.** Ambiguous or undecidable outcomes are quarantined or
  rejected, never guessed or silently passed.
- **Auditable.** Every gate produces tamper-evident evidence tied to a
  content fingerprint, not a timestamp.

## 2. Pipeline shape

```
legacy donor data
      │
      ▼
 ingestion/            (Mission 2A) → state: generated
      │
      ▼
 validation/           (Mission 2B) → state: structural_validation_passed
      │  gate 1: structural validation
      ▼
 correctness/          (Mission 2C) → state: correctness_verification_passed
      │  gate 2: correctness verification         (implemented, not yet
      ▼                                             wired into index.ts)
 [semantic / originality / difficulty review]  → not yet implemented
      │
      ▼
 [staging → publication]                        → not yet implemented
```

Each stage is a **gate**: a pure decision function plus an impure
orchestrator that moves a candidate to its next lifecycle state (or to a
`rejected/<gate>` / `quarantined` state) via the repository. The gate
sequence is enforced independently in three places at once, so no single
bug can bypass it:

1. `workflow/transitions.ts` — the legal state-transition table.
2. Each orchestrator's own precondition check on the candidate's current
   state before running its gate logic.
3. `storage/` compartment mapping — physical location is derived from
   lifecycle state, not asserted by the caller.

## 3. Module map

```
src/features/question-factory/
├── index.ts        domain barrel (re-exports below; correctness/ and
│                    shared/ deliberately NOT re-exported — see §6)
├── config/          constants, schemas, thresholds — no logic
├── shared/          identifiers.ts — the id shape every module trusts
├── taxonomy/        curriculum skill registry
├── blueprints/       deterministic batch planning
├── ingestion/        Mission 2A — legacy donor → generated candidate
├── validation/        Mission 2B — gate 1 (structural)
├── correctness/       Mission 2C — gate 2 (correctness), not wired in yet
├── provenance/        tamper-evident audit trail primitives
├── storage/            repository abstraction over the workspace
└── workflow/           lifecycle state machine
```

### 3.1 `config/`

Pure constants and Zod schemas, consumed by every other module:
`FACTORY_CONFIG`/`factoryConfigSchema`, `FACTORY_LIMITS`,
`FACTORY_THRESHOLDS` (e.g. `MAX_REVISIONS`), `FACTORY_VERSIONS`
(`SCHEMA_VERSION`/`TAXONOMY_VERSION`), `ALLOWED_QUESTION_TYPES` /
`ALLOWED_VISUAL_TYPES` (sourced from exam-engine's renderer registries),
identity normalisation (`normaliseIdentity`, `identitiesAreIndependent`),
repository-mode enum, path constants, `PUBLICATION_CONTROLLED_FILES`.
No orchestration logic lives here.

### 3.2 `shared/`

Single file, `identifiers.ts`: `factoryIdentifierSchema`
(`^[a-z0-9]+(?:[-_][a-z0-9]+)*$`), the id shape used for every
factory-domain id (candidate, blueprint, batch, ...). `storage/`'s
filesystem path-traversal check is derived from this same schema, so
schema validity and filesystem safety cannot drift apart.

### 3.3 `taxonomy/`

Curriculum-skill registry gating all skill references.
`skillTaxonomyRegistry` is a frozen singleton that self-validates
`SKILL_TAXONOMY_ENTRIES` at module load (throws on invalid data) and
exposes `resolve(label)` / `resolveOrThrow` / `get(id)` / `list()`.
Resolution is **id-or-declared-alias only** — never fuzzy or semantic
matching — keyed through `normalizeTaxonomyLabel`. Consumed by
`blueprints/planner.ts` and `validation/taxonomy-checks.ts`.

### 3.4 `blueprints/`

Blueprint authoring/planning.

- `planBlueprintBatch(request: CoverageRequest): Blueprint[]` — deterministic
  batch planner. Two anti-bias measures: round-robin question/visual-type
  selection in taxonomy-entry-authored order, and round-robin entry
  interleaving instead of alphabetical blocks — so identical requests
  always produce byte-identical output.
- `validateBlueprint(...)` in `validate.ts`.

Imports `skillTaxonomyRegistry` from `taxonomy/`. `correctness/` later
reads blueprint records to bind a `blueprintHash` into its evidence.

### 3.5 `ingestion/` — Mission 2A

Deterministic, non-publishing adapter that converts untrusted legacy donor
records (harvest JSON, compiled arrays, review-queue wrappers, CSV rows)
into `generated`-state candidates.

Entry point: `ingestLegacyQuestions(request: IngestionRequest, repository: FactoryRepository): Promise<readonly IngestionResult[]>`

Pipeline: `parseDonorSource` (shape dispatch) → `normaliseLegacyQuestion` /
`normaliseCsvRow` → `candidateQuestionSchema.safeParse` (internal preflight
only, not re-exported) → `mintCandidateId` / `hashJson` →
`candidateProvenanceSchema` → `FactoryRepository.create("generated", ...)`.

Key sub-files:

| File | Responsibility |
|---|---|
| `legacy-shapes.ts` | donor shape schemas |
| `mappings.ts` | alias tables |
| `boolean-parsing.ts` | `parseStrictBoolean` — never JS truthiness |
| `canonicalise-id.ts` | trim → NFKC → lowercase, applied to every id/reference |
| `limits.ts` | bounded input sizes |
| `safety.ts` | unsafe-markup / alt-text-leakage scanning |
| `normalise.ts`, `csv-normalise.ts` | per-format field mapping |
| `parse.ts` | shape dispatch |
| `identity.ts`, `source-path.ts` | identity/source bookkeeping |

**Trust boundary:** every donor `status` / `approvalStatus` /
`reviewerStatus` field is discarded (warning-only);
`generatorAdapter.class` is hard-coded `"manual_external"`; output state is
always `"generated"` regardless of donor claims.

**Determinism / replay:**
`candidateId = "ing-" + hash(sourcePath, batchId, pipelineRunId, adapterVersion, indexInSource, sourceContentHash)`.
Re-ingesting identical input is a no-op replay; a changed input at the same
id is refused (`candidate_already_exists`).

Consumes: `storage/FactoryRepository`, `provenance/candidateProvenanceSchema`,
`config/FACTORY_VERSIONS`.

### 3.6 `validation/` — Mission 2B, gate 1

Pure structural validator plus repository orchestration, moving
`generated` → `structural_validation_passed` or `rejected/structural`.

- `validateCandidateStructure(candidate, context): StructuralValidationResult`
  — pure, no I/O / clock / randomness.
- `orchestrateStructuralValidation(candidateId, repository, options): Promise<StructuralValidationOrchestrationOutcome>`

Composed from `candidate-checks.ts`, `taxonomy-checks.ts`,
`registry-checks.ts`, `content-safety-checks.ts`,
`production-schema-check.ts` (maps the candidate into the real
`questionSchema` and reuses its `superRefine`),
`scoring-compatibility-check.ts` (exercises the real `scoreQuestion`),
`schema-issue-classifier.ts`, `evidence.ts`. 42 closed issue codes are
enumerated in `types.ts`.

**Evidence & replay safety:** `StructuralValidationEvidence` includes a
`validationFingerprint` — a `hashJson` over identity fields that
deliberately excludes `validatedAt`. `writeReportIfAbsent` compares
fingerprints, not timestamps, so a retry after a transient move failure
reuses the existing report instead of erroring or duplicating.

Reuses `applyTransition` / `decideGateFailureOutcome` from `workflow/`,
`FactoryRepository` / `compartmentForState` from `storage/`.

Downstream: `correctness/` imports `parseCandidateProvenance`,
`buildStructuralValidationReportId`, and `StoredStructuralValidationReport`
from this module.

### 3.7 `correctness/` — Mission 2C, gate 2

Second gate: verifies candidates already at
`structural_validation_passed`. **Implemented but not yet re-exported from
`index.ts`** — no production call site wires it in yet (pending Mission 3).

- `verifyCandidateCorrectness(candidate, context: CorrectnessVerificationContext): CorrectnessVerificationResult`
  — pure. Status is one of `passed` / `failed` / `review_required`;
  `capability` is one of `deterministically_verifiable` /
  `structurally_scoreable_only` / `requires_independent_semantic_review` /
  `unsupported`.
- `orchestrateCorrectnessVerification(candidateId, repository, options): Promise<CorrectnessOrchestrationOutcome>`

Independently re-derives the answer (never trusts the declared key) via
`derive-answer.ts`, compares it against the declared answer via
`canonical-response.ts` / `derived-value.ts`, cross-checks
`explanation-consistency.ts`, and scores both the declared and the derived
response through the real `scoreQuestion`.

Type-specific derivation helpers: `arithmetic-expression.ts`, `numeric.ts`,
`fraction-decimal.ts`, `money.ts`, `measurement.ts`, `visual-lookup.ts`.

Evidence (`evidence.ts`) carries a `verificationFingerprint` using the same
`validatedAt`-exclusion replay-safety pattern as structural validation.
Because every "passed" lifecycle state physically co-locates in the
`review-queue` compartment (see §3.9), orchestration here is
**evidence-first**: the stored report is authoritative regardless of
physical location, not the reverse.

Semantic/manual categories route to `quarantined` via
`decideGateFailureOutcome({ severity: "uncertain" })` — never silently
passed.

Imports heavily from `validation/` (`checkAgainstProductionSchema`,
`parseCandidateProvenance` / `parseCandidateQuestion`) and `workflow/`.

### 3.8 `provenance/`

Tamper-evident audit trail.

- `candidateProvenanceSchema`
- `hashJson` / `hashContent` / `stableStringify` (`content-hash.ts`) —
  normalises CRLF/CR→LF and path separators for Windows-determinism.
- `generatorAdapterSchema` / `GENERATOR_CLASSES` (`generator.ts`)
- `reviewRecordSchema` (`review-record.ts`)

**Review-chain gate/evidence pattern** (`review-chain.ts` + `evidence.ts`):

- `appendReviewRecord(chain, draft)` is the sole sanctioned way to add a
  hash-linked record (`previousReviewHash` / `reviewHash`, genesis
  sentinel `"genesis"`).
- `verifyReviewChain(records)` walks the chain, detecting edited /
  reordered / deleted records and localising each defect to its own index.
- `isProductionGradeIndependentReview(generatorIdentity, evidence: VerifiedReviewChainEvidence, current: CandidateEvidenceSnapshot, minimumConfidence): boolean`
  — recently hardened (`docs/reports/mission2-fixture-prep/05-review-chain-followup.md`)
  to require a full verified chain plus an `expectedTerminalReviewHash`,
  not a bare `ReviewRecord`. This closed a defect where a
  hand-constructed record with plausible-looking hashes could satisfy the
  check.

No production call site is wired to this yet — it remains a pure
primitive pending Mission 3. Rule going forward: **semantic approval
helpers must consume only chain-verified review records.**

### 3.9 `storage/`

Repository abstraction over the physical workspace.

`FactoryRepository` interface: `create`, `read`, `exists`, `remove`,
`list`, `move`, `reconcile`. `FsFactoryRepository` is the filesystem
implementation; the interface is shaped so a DB-backed implementation can
satisfy it later without touching callers.

`FACTORY_COMPARTMENTS` (`compartments.ts`): `blueprints`, `inbox`,
`generated`, `review-queue`, `staged`, `published-manifests`, five
`rejected/<gate>` compartments, `quarantined`, `archived`, `reports`.

`compartmentForState(state, rejectionGate?)` (`state-compartment-mapping.ts`)
maps lifecycle states onto compartments. **Five distinct "passed" states
all map to `review-queue`** — this is exactly why downstream gates must be
evidence-first for correct replay detection (see §3.7).

`move()` is a single logical transaction (atomic write → metadata update →
remove source) and is idempotent — a retry returns
`{ ok: true, replayed: true }`. On corrupted JSON it fails closed: the
artefact is quarantined, never silently overwritten.

### 3.10 `workflow/`

Lifecycle state machine.

- `CANDIDATE_STATES` — 13 states (`states.ts`).
- `TRANSITION_TABLE` / `isLegalTransition` / `getLegalNextStates`
  (`transitions.ts`).
- `applyTransition(from, to, context): TransitionResult`
  (`apply-transition.ts`) — the single entry point enforcing the
  transition table, the bounded-revision policy (`MAX_REVISIONS`), and the
  semantic-reviewer-availability gate *together*, so no caller can bypass
  one without the others.
- `decideGateFailureOutcome({ severity, revisionCount, maxRevisions }): "rejected" | "needs_revision" | "quarantined"`
  (`policies.ts`) — data-driven: `hard_fail` → rejected, `uncertain` →
  quarantined, `soft_fail` → revisable until the revision budget is
  exhausted.
- `canAdvanceToSemanticReviewPassed` enforces that semantic/manual-review
  content can never advance without independent-reviewer evidence at
  threshold.

Consumed by both `validation/` and `correctness/` orchestrators.

## 4. Cross-cutting design patterns

1. **Strict gate sequence, enforced three ways.** See §2 — the transition
   table, each orchestrator's precondition check, and compartment mapping
   all agree independently.
2. **Pure-function / impure-orchestrator split.** Every gate separates a
   deterministic, I/O-free decision function (`validateCandidateStructure`,
   `verifyCandidateCorrectness`) from an impure orchestrator that owns the
   wall-clock read and all repository I/O. The pure function is unit-tested
   without mocking time or the filesystem.
3. **Evidence objects with fingerprint-based replay safety.** Both gates
   produce an evidence record with a deterministic fingerprint that
   excludes the caller-supplied timestamp, enabling `writeReportIfAbsent`
   to distinguish "same result, retried later" from "genuine conflict."
4. **Fail-closed, quarantine over guessing.** Ambiguous or undecidable
   outcomes — `decideGateFailureOutcome({ severity: "uncertain" })`,
   ambiguous taxonomy/boolean/difficulty values — always route to
   `quarantined` or explicit rejection, never a silent pass or a guess.
5. **Tamper-evident hash chains.** The review-chain pattern
   (`appendReviewRecord` / `verifyReviewChain`) generalises to any
   append-only audit trail that needs forge-detection with fault
   localisation.
6. **Narrow public barrels.** Every subdirectory's `index.ts` deliberately
   exports a small public surface. Internal check/derivation modules are
   imported by file path only, from tests and sibling internals — an
   intentional convention, not an oversight.

## 5. Trust model summary

| Input | Trusted? | Handling |
|---|---|---|
| Donor `status` / `approvalStatus` / `reviewerStatus` | No | Discarded, warning-only |
| Donor declared answer key | No | Independently re-derived in `correctness/`, compared, never assumed correct |
| Donor claimed generator identity | No | Hard-coded to `manual_external` on ingest |
| Caller-supplied timestamps | No (for identity purposes) | Excluded from evidence fingerprints |
| Review records | Only if hash-chain-verified | `isProductionGradeIndependentReview` requires a full `VerifiedReviewChainEvidence`, not a bare record |

## 6. Current implementation status

- **Wired into `index.ts`:** `blueprints`, `config`, `ingestion`,
  `provenance`, `storage`, `taxonomy`, `validation`, `workflow`.
- **Implemented, not yet wired in:** `correctness/` (Mission 2C) and
  `shared/` (consumed internally by file import, not via the barrel).
  Wiring `correctness/` into the public barrel and into a production call
  site is tracked as a Mission 3 prerequisite.
- **Not yet implemented:** semantic/originality/difficulty review gate,
  staging, publication. The pipeline in §2 stops at
  `correctness_verification_passed`.

## 7. Related documents

- `docs/reports/mission2-fixture-prep/03-legacy-ingestion-requirements.md`
  — authoritative statement of the ingestion trust boundary.
- `docs/reports/mission2-fixture-prep/05-review-chain-followup.md` —
  records and resolves the review-chain tamper-evidence defect referenced
  in §3.8.
- `docs/reports/mission2-production/01-legacy-ingestion-adapter.md`,
  `02-structural-validation.md` — implementation-status detail for
  Mission 2A/2B.
- `src/tests/fixtures/question-factory/mission2-calibration/correctness-verifier-matrix.json`
  — 20-category requirements matrix grounding the `correctness/` gate
  design (5 categories have confirmed fixture gaps as of this writing).
