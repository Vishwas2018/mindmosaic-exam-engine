# Mission 3 — Implementation Contract: Generation, Review, Pipeline, Staging & Publication, CLI

Status: proposed contract, pending prerequisite-decision approval. Not an implementation record — no Mission 3 source code exists yet.

Branch: `integration/governed-question-factory`. Written against HEAD `65dac9d8584fbb8742d8ff22dde886d0dfdf9e20` ("docs: record Mission 2C approval"), the closed Mission 2C commit. Stable `main` remains `ba9575c572df050ab97244758ead22e5336dcd2c`, untouched by this document.

This contract follows the structure and cross-reference conventions of `design.md` (the Mission 1/2A/2B/2C architecture record) and the mission report convention under `docs/reports/mission2-production/`. It is the Mission-3-equivalent of both documents combined: an architecture record for work not yet built, plus the delivery/audit plan for building it safely.

---

## 1. Mission overview

**Business purpose.** The question factory exists to turn untrusted content (hand-authored, LLM-generated, or eventually harvested legacy material) into a small, trustworthy stream of publishable NAPLAN/ICAS-style practice questions, without ever letting an unverified claim — a donor's `status` field, a generator's own confidence, a reviewer's raw output — become a production fact. Missions 1–2C built the front half of that pipeline: blueprint planning, deterministic ingestion, structural validation, and correctness verification. Mission 3 builds the back half: it is the first mission that can actually create a candidate from nothing, get it independently reviewed by a second AI or human, revise it under a hard limit, run the whole gate sequence end-to-end in one pipeline execution, and — the highest-risk step in the whole factory — atomically write the result into the real production question bank the exam engine serves.

**Exact scope** (authoritative, restated verbatim from the mission brief; this document does not redefine it):

> Generation, external review, pipeline runner, staging/publishing, and CLI

Concretely: (1) provider-neutral generation and deterministic fixture generation; (2) manual/external prompt and ingestion workflows; (3) provider-neutral semantic review; (4) external independent-review prompt and ingestion workflows; (5) revision prompt and bounded revision processing; (6) full batch pipeline runner; (7) staging and atomic publication; (8) question-factory CLI commands; (9) reconciliation and dry-run behaviour.

**Dependencies on Missions 1 / 2A / 2B / 2C.** Mission 3 is additive, not a rewrite:

- **Mission 1** (`config/`, `shared/`, `taxonomy/`, `blueprints/`, `workflow/`) supplies the identifier shape, the taxonomy registry, the deterministic blueprint planner, and the 13-state lifecycle machine Mission 3 must drive end-to-end for the first time.
- **Mission 2A** (`ingestion/`) supplies the legacy-donor ingestion adapter and its trust-boundary pattern (discard donor claims, hard-code `generatorAdapter.class`, deterministic replay-safe candidate IDs). Mission 3's `questions:ingest` reuses this pattern for LLM/manual-external content rather than legacy donor content — same shape, different source.
- **Mission 2B** (`validation/`) supplies gate 1 (`structural_validation_passed`) and the production-schema/registry/content-safety checks Mission 3's generated and ingested candidates must pass before anything else runs.
- **Mission 2C** (`correctness/`) supplies gate 2 (`correctness_check_passed`), fully implemented but **not yet wired into `index.ts` or any production call site** (`design.md` §3.7, §6). Wiring it in is a Mission 3 prerequisite (§Prerequisite decisions, PD-1).
- All four supply the `provenance/` tamper-evident evidence primitives (`candidateProvenanceSchema`, `reviewRecordSchema`, `appendReviewRecord`/`verifyReviewChain`, `isProductionGradeIndependentReview`) that Mission 3's semantic-review and publication gates are contractually required to consume as-is, not reimplement.

**Inputs.** A blueprint batch (Mission 1 `planBlueprintBatch` output); zero or more generator adapters (deterministic fixture, manual/external file drops, and — documented only — a live-provider adapter); external reviewer output files dropped by a human copying an LLM's response; CLI invocations driving all of the above.

**Outputs.** Candidate records progressing through the 13-state lifecycle; tamper-evident evidence and review-chain records; a pipeline run report; a staged batch; on publication, exactly the files enumerated in `PUBLICATION_CONTROLLED_FILES` (`config/publication-file-registry.ts`) — nothing else.

**In-scope behaviours:** deterministic fixture generation; manual/external candidate ingestion; deterministic semantic-safety checks; external independent-review ingestion; bounded revision; full pipeline orchestration (structural → correctness → semantic → originality → difficulty → staged); atomic publication with full rollback; the complete `questions:*` CLI surface including dry-run and reconciliation.

**Out-of-scope behaviours (explicit):** importing the 302+ harvested legacy questions from the external `_HARVEST` scratch directory (that is a distinct, not-yet-scheduled harvest-import effort — Mission 2A's adapter exists but has never been run against real harvest content, per `docs/reports/mission2-production/01-legacy-ingestion-adapter.md`); wiring a live LLM provider adapter (documented, not implemented — §4 "Live provider path"); building the isolated-test publication mode (`RepositoryMode.isolated_test` — reserved for Mission 4); parent/teacher dashboards, async job-queue consumers, or any UI work.

**Non-goals:** Mission 3 does not change the production `Question` schema, the renderer/visual registries, or the scoring engine — it is a producer that must conform to those, never a modifier of them. It does not change Mission 2C's correctness-verification logic beyond wiring it into a call site.

**Production-safety requirements (explicit statements required by the mission brief):**

- **Harvested questions are not automatically imported.** No Mission 3 command reads from `_HARVEST` or any harvest scratch path. `questions:ingest`'s inbox is a distinct, empty-by-default directory for manually curated LLM/human-authored candidates only.
- **Live provider adapters are documented but not implemented.** §4 "Live provider path" specifies the interface Mission 3 must leave room for; no Mission 3 increment instantiates it or holds credentials.
- **Deterministic fixture generators cannot publish in production mode.** `GeneratorClass.deterministic_fixture` (`provenance/generator.ts`) is refused by the publication gate under `RepositoryMode.production` unconditionally — this is a hard, non-configurable check, not a policy default (§13).
- **Manual-external candidates may publish only after completing every required gate.** `manual_external` provenance confers zero trust (`design.md` §5 trust-model table already establishes this for donor claims generally); it enters at `generated` and passes through the identical structural → correctness → semantic → originality → difficulty → staged sequence as any other class.
- **External review cannot bypass originality or difficulty gates.** `applyTransition`'s transition table (`workflow/transitions.ts`) has no edge from `semantic_review_passed` to `staged` — the only legal next state is `originality_review_passed`, and from there only `difficulty_review_passed`. A reviewer's approval is scoped to the `semantic_review_passed` transition and structurally cannot satisfy any other gate.

---

## 2. Delivery decomposition

Six sequential **technical increments** (implementation content areas). §26 groups these into five **audited sub-missions** (the actual branch/PR/Codex-review boundaries) — the two letterings intentionally differ in meaning; see the mapping table at the end of §26. Do not treat a "3A" here as the same unit as "Mission 3A" in §26.

### 3A — Generation and manual ingestion

- `QuestionGenerator` interface (provider-neutral; §4).
- `DeterministicFixtureGenerator` (reproducible, non-publishing; §4).
- Versioned prompt builder → `questions:prompt` (§5).
- `questions:ingest` (§6).
- Inbox transaction semantics (claim → parse → validate → commit-or-quarantine → clear).
- Malformed-input quarantine (reuses the repository's existing corrupted-JSON quarantine pattern, `storage/fs-factory-repository.ts`).
- `manual_external` provenance stamping, identical trust posture to Mission 2A's donor ingestion.

**Prerequisites:** PD-1 (wire `correctness/` into `index.ts` and a call site — needed by 3D, not 3A itself, but should land here since it touches the same barrel), PD-2 (semantic-classification assignment — needed starting 3B, decide the mechanism in 3A since it is set at blueprint/candidate-creation time).
**Source modules:** new `src/features/question-factory/generation/`, new `src/features/question-factory/ingestion-external/` (or extend `ingestion/` — see PD-3), `scripts/questions-prompt.mts`, `scripts/questions-ingest.mts`.
**Lifecycle transitions:** none new (this increment only ever produces `generated`-state candidates via `FactoryRepository.create`, the same terminal action Mission 2A's adapter already performs).
**Evidence generated:** `CandidateProvenance` records for generated/ingested candidates.
**Tests required:** three-identical-runs determinism for `DeterministicFixtureGenerator`; prompt-pack determinism; ingest happy path; malformed-JSON quarantine; duplicate-ingest replay; inbox-interruption recovery (see §24).
**Completion gate:** a fixture-generated and a manually-ingested candidate both reach `generated` state with valid, schema-passing provenance; `npm run typecheck && npm run lint && npm test` green.
**Independent Codex audit required before continuing:** **Yes** — this increment introduces the first new production call sites since Mission 2C closed, and establishes the inbox trust boundary every later gate depends on.

### 3B — Semantic review and external-review ingestion

- `Reviewer` contract (provider-neutral; §7).
- Deterministic semantic-safety reviewers (rule-based checks; §7).
- Fixture reviewer (deterministic, for test/CI use — never counts as independent evidence for real candidates; see §7).
- External review prompt → `questions:review-prompt` (§8).
- External review ingestion → `questions:review-ingest` (§9).
- Reviewer independence enforcement (`identitiesAreIndependent`, already implemented in `config/identity-normalisation.ts` — reused, not reimplemented).
- Review evidence binding (`reviewEvidenceBindingSchema`, `isReviewStillValid`, `appendReviewRecord` — all already implemented in `provenance/`, reused as-is).
- Confidence (`PRODUCTION_REVIEW_CONFIDENCE = 0.8`) and ambiguity (`ambiguityStatus !== "unresolved"`) handling, per `isProductionGradeIndependentReview`.

**Prerequisites:** 3A complete and audited; PD-2 resolved (semantic classification must exist on a candidate before the reviewer-availability gate in `canAdvanceToSemanticReviewPassed` can be evaluated).
**Source modules:** new `src/features/question-factory/review/`, `scripts/questions-review-prompt.mts`, `scripts/questions-review-ingest.mts`.
**Lifecycle transitions:** `correctness_check_passed → semantic_review_passed` (via `applyTransition`, using the already-implemented `canAdvanceToSemanticReviewPassed` gate), and the failure routes `→ needs_revision | rejected | quarantined` per `decideGateFailureOutcome`.
**Evidence generated:** `ReviewRecord` entries appended to `CandidateProvenance.reviewRecords` via `appendReviewRecord`.
**Tests required:** the full reviewer-independence matrix (§20, §24); stale/self/low-confidence/ambiguous review rejection; malformed-response handling; idempotent replay of an identical review under a reused review ID; rejection of a *changed* review under a reused review ID.
**Completion gate:** an ingested candidate reaches `semantic_review_passed` only via a genuinely independent, chain-verified review; every rejection path is exercised and produces the correct lifecycle outcome.
**Independent Codex audit required before continuing:** **Yes** — reviewer independence and evidence binding are the two properties a single silent bug could compromise across the entire remaining pipeline; this increment must be re-verified before pipeline/staging work builds on top of it.

### 3C — Revision workflow

- `questions:revision-prompt` (§10).
- New candidate revision (never in-place mutation).
- Parent-candidate relationship (`parentCandidateId`, already a field on `candidateProvenanceSchema`).
- New content hash per revision.
- Full pipeline rerun for the revised candidate (from `generated`, not from wherever the parent failed).
- Revision limit of two (`FACTORY_THRESHOLDS.MAX_REVISIONS = 2`, already enforced in `applyTransition`).
- Exhaustion rejection (`decideGateFailureOutcome`'s `soft_fail` branch, already implemented: `revisionCount < maxRevisions ? "needs_revision" : "rejected"`).

**Prerequisites:** 3B complete and audited (a revision must be able to re-enter semantic review).
**Source modules:** new `src/features/question-factory/revision/`, `scripts/questions-revision-prompt.mts`.
**Lifecycle transitions:** none new — a revision is a new candidate that re-enters at `generated` (via `create`, with `parentCandidateId` and `revision = parent.revision + 1` set), then runs the ordinary transition table.
**Evidence generated:** no new evidence schema; the new candidate's own `CandidateProvenance.revision`/`parentCandidateId` fields are the revision record.
**Tests required:** revision-prompt generation; revision re-ingestion; parent link integrity; new content hash; full pipeline rerun proof; revision 1 accepted; revision 2 accepted; revision 3 (limit exhaustion) rejected, never silently permitted.
**Completion gate:** a candidate that fails a gate twice is rejected on the third attempt with `revision_limit_exhausted`, never a fourth attempt.
**Independent Codex audit required before continuing:** No — bounded-revision logic is already implemented and tested at the `workflow/` layer (Mission 1); this increment is thin orchestration around an existing, already-audited primitive. Fold its audit into 3D's.

### 3D — Pipeline runner and staging

- Batch execution (`workflow/pipeline-runner.ts`; §11).
- Lifecycle progression through every remaining gate, including originality and difficulty (§12 — see PD-4, these gates do not exist as modules yet).
- Deterministic replay (three identical reruns → identical results).
- No candidate duplication on rerun.
- Staged-state eligibility per semantic classification (§12).
- Terminal-state guarantees (every processed candidate ends `staged` or in an allowed terminal state).

**Prerequisites:** 3A–3C complete and audited; PD-1 resolved (correctness must be a real pipeline stage, not just an implemented-but-unwired module); PD-4 resolved (originality/difficulty gate scope decision).
**Source modules:** `workflow/pipeline-runner.ts`, new `src/features/question-factory/originality/`, new `src/features/question-factory/difficulty/`.
**Lifecycle transitions:** `structural_validation_passed → correctness_check_passed`, `semantic_review_passed → originality_review_passed`, `originality_review_passed → difficulty_review_passed`, `difficulty_review_passed → staged` — the full remaining chain (§3).
**Evidence generated:** a `PipelineRunReport` (new schema, §11) plus per-gate evidence from the correctness/originality/difficulty gates.
**Tests required:** the full pipeline test list in §11 and §24 ("Pipeline" acceptance rows).
**Completion gate:** a batch of mixed-outcome candidates (some pass everything, some fail at each gate, one hits the revision limit) processes through a single `pipelineRunId` and every candidate lands in a documented terminal or `staged` state, reproducibly.
**Independent Codex audit required before continuing:** **Yes** — this is the first increment that can move a candidate all the way to `staged`, the last checkpoint before publication touches production files.

### 3E — Publication and rollback

- Publication eligibility (§13).
- Publication manifest.
- Generated batch JSON (`src/content/questions/generated/batch-<batchId>.json`).
- Static generated-bank loader (`src/content/questions/generated/index.ts` — does not exist yet).
- Generated contract (`question-bank-contract.generated.json` — does not exist yet).
- Summary (`question-bank-summary.ts` — exists today as a hand-maintained file; Mission 3 makes it a controlled, publication-rewritten file).
- Collision checks (production-ID collision, seed-bank collision).
- Atomic controlled-file transaction (§14).
- Full rollback (§14).
- Publication replay (§14).

**Prerequisites:** 3D complete and audited; PD-5 resolved (exact collision-detection and stable-production-ID minting rule); PD-6 resolved (whether `question-bank-summary.ts`, currently hand-authored prose, becomes fully machine-generated or partially preserved).
**Source modules:** new `src/features/question-factory/publication/`, `scripts/questions-stage.mts`, `scripts/questions-publish.mts`.
**Lifecycle transitions:** `staged → published`, `staged → rejected | quarantined` (late failure), `published → archived` (superseding a later republication of the same production ID — out of scope for Mission 3's first cut unless PD-6 says otherwise).
**Evidence generated:** publication manifest, rollback snapshot record, reconciliation record.
**Tests required:** the full "Publication" acceptance list in §24.
**Completion gate:** a staged batch publishes atomically into exactly the controlled-file set, `npm run validate:questions` and `npm run check:answers` both pass against the new bank, and a forced mid-publication failure rolls back to a byte-identical pre-publication state.
**Independent Codex audit required before continuing:** **Yes, mandatory** — this increment writes to the real production question bank. No exceptions to the audit gate.

### 3F — CLI and reconciliation

- Complete command catalogue (§16).
- Dry-run (§17).
- Reconciliation (§18).
- Exit codes, structured (JSON) output, non-interactive operation.

**Prerequisites:** 3A–3E complete (the CLI is a thin, non-interactive front end over the orchestrators already built; it adds no new domain logic beyond `questions:reconcile`'s inconsistency detection).
**Source modules:** `scripts/questions-*.mts` (consolidating/finishing the per-increment scripts already stubbed above), a shared `scripts/question-factory-cli/` argument-parsing and output-formatting helper.
**Lifecycle transitions:** none new.
**Evidence generated:** reconciliation report (§18, §19).
**Tests required:** the full "CLI" acceptance list in §24.
**Completion gate:** every command in §16's catalogue is invocable, documented, has a deterministic exit code, and dry-run/reconcile behave per §17/§18 under Windows paths and paths with spaces.
**Independent Codex audit required before continuing:** No — folds into 3E's audit as a single "staging, publication, CLI, reconciliation" sub-mission (see §26 mapping) since none of 3F's content is independently risky once 3E is approved.

### Recommendation

Given Mission 3's breadth (six increments touching generation, external-LLM trust boundaries, and — uniquely among all missions so far — real production-file writes) and its publication risk (an atomic multi-file transaction with rollback against the live question bank the exam engine serves), this document recommends **sequential audited sub-missions**, not one large delivery. See §26 for the exact five-sub-mission boundary and the reasoning against Option A.

---

## 3. Lifecycle contract

The 13-state machine is **already fully implemented** (`workflow/states.ts`, `workflow/transitions.ts`, `workflow/apply-transition.ts`, `workflow/policies.ts` — Mission 1). Mission 3 does not add states or change the transition table; it is the first mission to actually **exercise** every transition below in a production call site. One naming note: the mission brief's lifecycle skeleton uses `correctness_verification_passed`; the implemented type value is **`correctness_check_passed`** (`workflow/states.ts` line 5). This document uses the real code value throughout and flags the discrepancy here rather than silently renaming either.

| Starting state | Trigger | Required evidence | Destination | Physical compartment | Mutation | Replay behaviour |
|---|---|---|---|---|---|---|
| — | `questions:plan` / blueprint authoring | none | `blueprint_created` | `blueprints` | `FactoryRepository.create` | Re-running with the same deterministic planner inputs produces byte-identical blueprints (Mission 1 property, unchanged); re-`create`-ing an existing id fails `duplicate_candidate`, never overwrites. |
| `blueprint_created` | `questions:generate` (fixture) or `questions:ingest` (manual/external) | none (entry gate) | `generated` | `generated` | `create` | Deterministic-fixture candidate IDs and manual-ingest candidate IDs are both hash-derived from stable inputs (batch/blueprint/source content); re-running identical input is a no-op replay, a changed input at the same id is refused. |
| `generated` | `questions:validate` (structural gate) | `StructuralValidationEvidence` | `structural_validation_passed` → `needs_revision` → `rejected` → `quarantined` | `review-queue` (all four non-`generated` destinations except `rejected`, which goes to `rejected/structural`) | `update` (in-place; `structural_validation_passed` and `generated` are different compartments only the first time — see `storage/` §Compartments) | `writeReportIfAbsent` compares `validationFingerprint` (excludes `validatedAt`), so a retried structural check after a transient failure reuses the existing report rather than duplicating or erroring (already implemented, Mission 2B). |
| `structural_validation_passed` | `questions:check-answers` (correctness gate) | `CorrectnessVerificationEvidence`, bound to the structural evidence via `structuralEvidenceFingerprint` | `correctness_check_passed` → `needs_revision` → `rejected` → `quarantined` | `review-queue` → `rejected/correctness` on rejection | `update` | Same fingerprint-replay pattern as structural (Mission 2C, already implemented); additionally verified via `validate-cached-replay.ts`'s replay-integrity check — a stale or tampered cached correctness report is a hard failure (`replay_integrity_failure` orchestration outcome), never silently trusted. |
| `correctness_check_passed` | `questions:review-ingest` (semantic gate) | one chain-verified, independent `ReviewRecord` at/above `PRODUCTION_REVIEW_CONFIDENCE` (0.8) for `semantic_objective`/`manual_review_writing`; deterministic safety checks only for `deterministically_computable` | `semantic_review_passed` → `needs_revision` → `rejected` → `quarantined` | `review-queue` → `rejected/semantic` | `update` | Re-ingesting an identical review under the same review ID is an idempotent no-op; re-ingesting a *changed* review under a reused review ID is refused (`review_id_conflict`, §9). |
| `semantic_review_passed` | `questions:dedupe` (originality gate — new module, PD-4) | originality-check evidence (new schema, §12) | `originality_review_passed` → `needs_revision` → `rejected` → `quarantined` | `review-queue` → `rejected/originality` | `update` | Fingerprint-replay pattern, same as structural/correctness. |
| `originality_review_passed` | `questions:difficulty` (difficulty gate — new module, PD-4) | difficulty-check evidence (new schema, §12) | `difficulty_review_passed` → `needs_revision` → `rejected` → `quarantined` | `review-queue` → `rejected/difficulty` | `update` | Fingerprint-replay pattern, same as above. |
| `difficulty_review_passed` | `questions:stage` | all five upstream evidence records present, fresh, and bound to the current content hash/revision | `staged` → `rejected` → `quarantined` (no `needs_revision` — a staged-eligible candidate failing late is a hard stop, per `TRANSITION_TABLE`) | `staged` | `move` | `move` is idempotent (`replayed: true` on retry); staging never re-runs upstream gates, it only re-verifies their stored evidence is still valid (`isReviewStillValid` and the structural/correctness fingerprint equivalents). |
| `staged` | `questions:publish` | publication manifest, all staging evidence still fresh, no production-ID collision | `published` → `rejected` → `quarantined` | *(none — content leaves the factory workspace for `src/content/questions/generated/`; only the manifest remains, in `published-manifests`)* | atomic multi-file transaction (§14) — not a `FactoryRepository.move`, a purpose-built publication transaction over the controlled-file registry | Publishing the same `publicationId` twice with unchanged content is a safe no-op replay (manifest hash matches); publishing the same `publicationId` with *changed* content is refused (§14 "reused publication ID with different hashes"). |
| `published` | (supersession — reserved) | — | `archived` | `archived` | `move` (candidate-record bookkeeping only; the published production file is not touched by this transition) | Out of first-cut Mission 3 scope unless PD-6 decides otherwise; documented for completeness. |
| any of the five "…_passed" states, or `generated`/`structural_validation_passed`/`correctness_check_passed` | any gate, `soft_fail` severity, revision budget remaining | — | `needs_revision` | `review-queue` (terminal — the record itself never moves again; see below) | `update` | `needs_revision` is a `TERMINAL_STATE` for *this* candidate record. Revision is never an in-place retry: `questions:revision-prompt` + re-`questions:ingest` creates a **new** candidate (`parentCandidateId` set, `revision = parent.revision + 1`) that separately runs the full gate sequence from `generated`. Report-only re-checks of a `needs_revision` record must never silently flip its stored state — see the "no report-only transition" rule below. |
| any gate, `hard_fail` severity (or revision budget exhausted) | — | `rejected` | `rejected/<gate>` | `update`/`move` | Terminal (`rejected → archived` only, no re-entry). |
| any gate, `uncertain` severity (including missing/undecidable semantic classification, unsupported correctness category) | — | `quarantined` | `quarantined` | `move` | Terminal except `quarantined → archived`; a quarantined candidate is never auto-retried — it requires manual reconciliation (§18) to determine whether it should be re-ingested as a fresh candidate. |
| `rejected` / `quarantined` | `questions:reconcile` bulk-archive, or age-based housekeeping (CLI-triggered, never automatic) | — | `archived` | `archived` | `move` | Idempotent; archiving an already-archived candidate is a no-op. |

**Semantic-classification-specific paths.** `canAdvanceToSemanticReviewPassed` (`workflow/policies.ts`, already implemented) is the single gate function: `deterministically_computable` candidates advance on the deterministic safety checks that already ran to reach `correctness_check_passed` (no independent reviewer required); `semantic_objective` and `manual_review_writing` candidates **require** `hasIndependentReviewerRecordAtThreshold === true`, computed by feeding a `VerifiedReviewChainEvidence` through `isProductionGradeIndependentReview` — never a bare review record, never rule-based evidence alone.

**Missing independent reviewer.** No review ingested at all → the semantic gate cannot pass; `applyTransition(..., "semantic_review_passed", ...)` returns `ok: false, reason: "semantic_review_requires_independent_evidence"`. The orchestrator must route this to `quarantined` (per `decideGateFailureOutcome({severity: "uncertain", ...})`), not `needs_revision` — there is nothing to revise yet, only a missing review.

**Low confidence / unresolved ambiguity.** Both are checked inside `isProductionGradeIndependentReview` (`review.confidence >= minimumConfidence`, `review.ambiguityStatus !== "unresolved"`). Either failing means the review does not count as production-grade evidence — the gate behaves exactly as if no review existed (routes to `quarantined`, since the review *exists* but is insufficient, this is `soft_fail` if the reviewer's findings are correctable via revision, `uncertain` if the ambiguity itself is the problem; see §7 for the severity-classification rule).

**Revision required / revision limit exhausted.** Already fully enforced at the `workflow/` layer (§2, 3C) — `applyTransition` refuses `to === "needs_revision"` once `revisionCount >= maxRevisions`, forcing `rejected`.

**Fixture generator in production publication.** Refused unconditionally at the publication gate (§13) — `generatorAdapter.class === "deterministic_fixture"` under `RepositoryMode.production` is a hard `publication_refused_fixture_generator` failure, checked before any file I/O.

**Stale review / stale manifest.** A review whose `evidenceBinding` no longer matches the candidate's current `contentHash`/`blueprintHash`/`revision` is invalid (`isReviewStillValid` returns `false`) — staging must re-check this at staging time, not just trust the semantic-review-passed transition happened once. A manifest is stale the same way: publication recomputes the manifest hash from current staged content before trusting a cached manifest (§14 replay rules).

**Publication collision.** Two distinct candidates (or two publication attempts) resolving to the same stable production ID is refused (§13, §22) — never overwritten, never silently deduplicated by "last write wins."

**No report-only transition may leave the stored lifecycle state unchanged.** Every gate orchestrator's contract: calling it always either (a) performs a legal `applyTransition` and persists the new state, or (b) returns a structured failure/no-op result *without* calling `repository.update`/`move` at all. There is no third path where the orchestrator writes a "re-checked" report but leaves `state` untouched — the existing `writeReportIfAbsent` fingerprint-replay pattern (Mission 2B/2C) already satisfies this for retries of the *same* transition; Mission 3's new gates (semantic, originality, difficulty, staging, publication) must follow the identical pattern.

---

## 4. Generator contract

### `QuestionGenerator` interface (new, provider-neutral)

```ts
interface GenerationContext {
  readonly blueprint: Blueprint;             // Mission 1 blueprint record
  readonly blueprintHash: string;             // hashJson(blueprint), binds provenance
  readonly batchId: string;                   // factoryIdentifierSchema
  readonly pipelineRunId: string;             // factoryIdentifierSchema
  readonly promptVersion: string;             // FACTORY_VERSIONS.PROMPT_VERSION or a bump
  readonly generatorVersion: string;
  readonly seed?: string;                     // required for deterministic_fixture, forbidden for live_provider
}

interface GeneratedCandidateResult {
  readonly ok: true;
  readonly candidate: QuestionFactoryCandidate;   // pre-provenance content, matches validation/'s existing type
  readonly generatorAdapter: GeneratorAdapter;     // { class, identity } — provenance/generator.ts, reused
}

type GenerationFailureReason =
  | "unsupported_blueprint"       // blueprint subset this generator cannot produce
  | "resource_limit_exceeded"     // §21 bounds
  | "generation_timeout"          // live_provider only
  | "malformed_generator_output"; // generator produced non-parseable/invalid content

interface GenerationFailure {
  readonly ok: false;
  readonly reason: GenerationFailureReason;
  readonly message: string;   // bounded, §21
}

interface QuestionGenerator {
  readonly generatorClass: GeneratorClass;   // reuses provenance/generator.ts's GENERATOR_CLASSES
  generate(context: GenerationContext): Promise<GeneratedCandidateResult | GenerationFailure>;
}
```

The interface is intentionally symmetrical with `Reviewer` (§7) — neither is aware of the other's identity, and neither is trusted more because of what it is (a fixture generator, an external LLM, a human).

### Generator classes and publication eligibility

Reusing `provenance/generator.ts`'s already-implemented `GENERATOR_CLASSES`:

| Class | Produces candidates via | Publication eligible (production mode) |
|---|---|---|
| `deterministic_fixture` | `DeterministicFixtureGenerator`, in-process, no I/O beyond the repository | **Never.** Hard-refused by the publication gate regardless of how far the candidate progressed. |
| `manual_external` | `questions:ingest` reading a human-curated inbox file (an LLM's response pasted/saved by a person, or a hand-written candidate) | Yes, conditional on completing every gate (§12 matrix). |
| `live_provider` | A wired API adapter — **not implemented in Mission 3** | Documented only; not applicable until a future mission implements and audits the adapter. |

### `DeterministicFixtureGenerator`

- **Reproducibility contract:** given the same `(blueprint, blueprintHash, seed)`, produces byte-identical candidate content on every run, on every platform (reuses the existing CRLF/path-separator normalisation in `provenance/content-hash.ts` so Windows and POSIX runs hash identically).
- **Deterministic seed inputs:** `seed` is derived the same way Mission 1's blueprint planner avoids `Math.random` (`docs/ARCHITECTURE.md`'s FNV-1a → mulberry32 pattern) — `seed = hashJson({blueprintId, batchId, pipelineRunId})` by default, or an explicit caller-supplied seed for reproducing a specific prior run.
- **Supported blueprint subset:** a closed, explicitly enumerated set of question types the fixture generator can construct without any semantic judgement (e.g. `number_entry` arithmetic, `multiple_choice` with a closed deterministic option set) — the same subset Mission 2C's correctness verifier already classifies as `deterministically_verifiable`, so fixture-generated candidates are guaranteed correctness-gate-passable by construction.
- **Unsupported blueprint behaviour:** returns `{ok: false, reason: "unsupported_blueprint"}` — never a best-effort guess, never a silently degraded output.
- **Provenance identity:** `generatorAdapter = {class: "deterministic_fixture", identity: normaliseIdentityOrThrow("deterministic-fixture-generator")}` — the alias already exists in `IDENTITY_ALIAS_TABLE`.
- **Production publication refusal:** enforced at the publication gate (§13), not at generation time — a fixture candidate can legitimately reach `staged` (useful for pipeline/staging tests) but can never cross into `published` under `RepositoryMode.production`.
- **Tests across three identical runs:** required acceptance case (§24) — three separate process invocations with the same inputs must produce byte-identical candidate JSON and identical content hashes.

### Live provider path (documented, not implemented)

- **Adapter interface:** implements the same `QuestionGenerator` contract; internally wraps a specific provider's completion API.
- **Credentials boundary:** API keys/tokens are read from environment variables at the CLI entry point only, never logged, never embedded in any evidence record, generated file, or error message (§21 "no secrets in logs").
- **Timeout and retry expectations:** a bounded timeout (proposed default: 60s per generation call) and a bounded retry count (§21) with exponential backoff; exhausting retries is `generation_timeout`, not a silent empty result.
- **Response-size limits:** the same `MAX_PROMPT_LENGTH`/content bounds from `FACTORY_LIMITS` apply to what a live-provider response is allowed to claim as candidate content; oversized responses are `malformed_generator_output`.
- **Provider identity normalisation:** the returned provider/model identity string must resolve through `normaliseIdentity` (§20) exactly like any external reviewer identity — no live-provider candidate is ever exempt from the identity table.
- **Audit logging:** every live-provider call (not its content, its identity/timing/outcome) is logged for cost and reliability audit, consistent with `AGENTS.md`'s "no API keys in browser code" and general server-boundary discipline.
- **Prohibition on hidden trust:** a `live_provider` candidate receives **no** special trust over `manual_external` — it passes through the identical gate sequence, and its own output can never review itself (the identity-independence rule in §7/§20 applies uniformly).

---

## 5. Prompt-pack contract

`questions:prompt` (§16) produces a versioned generation prompt pack for a blueprint or blueprint batch — the artefact a human copies into an external LLM chat, or that a future `live_provider` adapter sends directly.

**Pack contents (required fields):**

- `blueprint` (the full Mission 1 blueprint record) and `blueprintHash` (`hashJson(blueprint)`).
- `batchId`, `promptVersion` (starts at `FACTORY_VERSIONS.PROMPT_VERSION = "v1"`; bumped whenever the template shape changes).
- Schema expectations: the exact response shape the generator must produce, expressed as a documented JSON structure matching `QuestionFactoryCandidate` (the same internal shape `validation/`'s `production-schema-check.ts` maps into the real `questionSchema`).
- A valid JSON example (one complete, realistic candidate matching the blueprint's declared `questionType`).
- **Australian English requirement**, stated explicitly (`locale: "en-AU"` per `questionMetadataSchema`, `docs/CONTENT_RULES.md`).
- **Originality constraints**: never reproduce or lightly reword NAPLAN/ICAS/textbook/commercial material (`AGENTS.md`, `docs/CONTENT_RULES.md` — restated verbatim in the pack, not paraphrased, so the instruction can't drift from the governing document).
- **Forbidden sources**: an explicit list mirroring `docs/CONTENT_RULES.md`'s originality section.
- **Structured visual JSON constraints**: visuals are data, never markup (`docs/ARCHITECTURE.md` "Visuals are data, not executable markup") — the pack states the visual-type catalogue (from `visual-renderer-registry.ts`'s 10 supported types) and forbids inline SVG/HTML.
- **Supported question types** and **supported visual types**: sourced from `ALLOWED_QUESTION_TYPES`/`ALLOWED_VISUAL_TYPES` (`config/allowed-types.ts`, already implemented, itself sourced from the renderer registries) — never hand-duplicated in the prompt-pack builder.
- **Marks, timing**: bounded per `FACTORY_LIMITS.BLUEPRINT_MIN_MARKS`/`MAX_MARKS` (1–20) and `..._ESTIMATED_TIME_SECONDS` (10–3600).
- **Answer-key requirements**: type-specific, matching the production schema's per-type answer-key shape.
- **Explanation requirements**: original, age-appropriate, addresses reasoning (`docs/CONTENT_RULES.md`).
- **Alt-text requirements**: every visual needs alt text; the alt text itself must not leak the answer (checked again independently at ingestion/structural-validation time — the prompt instruction does not substitute for the check).
- **Answer-leakage prohibition**: explicit — stems, alt text, and non-answer fields must never contain the answer.
- **Strict JSON-only response instruction**: the pack instructs the generator to return exactly one JSON object/array, no prose, no markdown fencing commentary outside the JSON.
- **Maximum response size**: stated in the pack (matches §21's `MAX_PROMPT_PACK_SIZE`/candidate-size bounds) so an external LLM is told the ceiling up front rather than discovering it via a later rejection.

**File naming:** `content/question-factory/reports/prompt-pack-<batchId>.json` (machine-readable) with an optional `.md`/plain-text rendering alongside for pasting into a chat UI — both derived from the same canonical data, never hand-diverging.

**Stdout behaviour:** `questions:prompt` writes the pack to disk and, in JSON output mode, prints `{promptPackPath, promptHash, batchId}` to stdout; in human mode, prints a short confirmation plus the path.

**Deterministic ordering / canonical serialisation:** the pack's blueprint-batch ordering follows the same round-robin, byte-identical-on-rerun ordering Mission 1's planner already guarantees (`design.md` §3.4); serialisation goes through `stableStringify` (`provenance/content-hash.ts`) so the same batch always produces the same file bytes.

**Prompt hash:** `promptHash = hashContent(stableStringify(pack))` — recorded in the pack itself and later stamped onto every candidate's `CandidateProvenance.promptVersion`/an added `promptHash` provenance field (see PD-7: whether `promptHash` needs to be added to `candidateProvenanceSchema`, since the currently implemented schema only has `promptVersion`).

**Replay semantics:** re-running `questions:prompt` for an unchanged blueprint batch produces a byte-identical pack and an identical `promptHash` — this is what lets ingestion later verify a candidate's declared prompt version/hash actually correspond to a pack that was really generated, not fabricated by the ingestion step itself.

---

## 6. Manual ingestion contract

`questions:ingest` — the Mission 3 sibling of Mission 2A's legacy-ingestion adapter, for LLM/manual-external candidates rather than legacy donor records.

- **Inbox path:** `content/question-factory/inbox/` (the existing `inbox` compartment, `storage/compartments.ts`, already reserved but unused until now).
- **Supported file formats:** JSON only (one candidate object, or a JSON array of candidates from one batch) — no CSV (that shape is legacy-donor-specific, Mission 2A's territory).
- **One candidate vs. arrays:** both accepted; an array is processed as an ordered batch, each element independently succeeding/failing/quarantining — one bad element never blocks the rest (mirrors Mission 2A's per-record independence).
- **Source identity flag:** every ingested candidate is stamped `generatorAdapter.class = "manual_external"`, `generatorAdapter.identity` taken from a required `declaredGeneratorIdentity` field in the input file and resolved through `normaliseIdentity` (§20) — an unresolvable identity is a hard ingestion failure, not a silent `"other"` fallback.
- **Batch ID / prompt version requirements:** every ingested file must declare `batchId` and `promptVersion` (and, per PD-7, `promptHash`) matching a prompt pack that was actually produced by `questions:prompt` — ingestion cross-checks this rather than trusting the declared values blindly.
- **Input limits:** file count per inbox scan, candidates per file, per-field sizes — all from `FACTORY_LIMITS`/§21.
- **Parse failure:** malformed JSON (unparseable) → quarantined immediately, original file preserved under a `.quarantine-reports/`-equivalent for the inbox (reuses the repository's existing corrupted-input quarantine pattern).
- **Malformed JSON quarantine:** the file is moved out of the active inbox scan path (never left to be re-picked-up and re-fail identically on every future ingest run) with a quarantine report explaining why.
- **Valid parse but structurally invalid candidate:** *not* quarantined at ingestion — it is created at `generated` and left for the structural-validation gate to reject with detailed, type-specific issue codes (Mission 2B already does this well; duplicating that logic in the ingestion step would let the two disagree).
- **Content hash / candidate ID / revision / parent candidate ID:** `candidateId` is deterministically derived (`"ing-" + hash(...)` pattern, mirroring Mission 2A) from `(sourcePath, batchId, promptVersion, indexInSource, sourceContentHash)`; `contentHash = hashJson(candidateContent)`; `revision = 0` for a first ingestion, or `parent.revision + 1` when the input declares a `parentCandidateId` (the revision-workflow path, §10).
- **Transaction order:** claim inbox file (rename to a `.processing` marker, preventing a concurrent ingest run from double-processing it) → parse → per-candidate validate-and-create → on full-file success, move the source file to a `processed/` subfolder (audit trail, never deleted) → clear the marker.
- **Inbox cleanup:** processed files are moved, never deleted, so a human can always see what was ingested and when.
- **Recovery after interruption:** a `.processing` marker found on the next `questions:ingest` run (or via `questions:reconcile`) is resolved the same way `FactoryRepository.reconcile()` resolves interrupted moves — check whether the candidates it would have created already exist (durable completion) and either finish (move the marker to `processed/`) or roll back (clear the marker, leave the source file for reprocessing).
- **Duplicate ingestion:** re-ingesting the same file content (same derived candidate IDs, same content hashes) is a safe no-op replay — `create` on an already-existing id with identical content succeeds as a replay; with *different* content at the same id it is refused (`duplicate_candidate`, the existing `CreateFailureReason`).
- **Reused file name:** irrelevant to identity — candidate IDs are content/batch-derived, not filename-derived, so dropping a differently-named file with identical content at the same batch/index is still correctly detected as the same or a genuine conflict.
- **Reused candidate ID:** covered by the duplicate-ingestion rule above; a reused ID with different declared content is always a hard refusal, never an overwrite.
- **Dry-run behaviour:** `--dry-run` runs the full parse/validate pipeline and reports exactly what would be created/quarantined, performing zero repository writes and leaving the inbox untouched (§17).

**Manual ingestion must** (restated, all already satisfied by the design above): apply `manual_external` provenance; normalise source identity through the shared identity table, never trust a raw declared string; never confer trust from any source label (there is no "verified" or "reviewed" flag anywhere on the input schema — donor-style status fields, if present in an input file, are ignored exactly as Mission 2A ignores them); enter only the `generated` state; use the standard downstream gates with no shortcut.

---

## 7. Semantic review contract

### `Reviewer` interface (new, provider-neutral)

```ts
interface ReviewContext {
  readonly candidate: QuestionFactoryCandidate;
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprintHash: string;
  readonly semanticClassification: SemanticClassification;
}

type ReviewOutcome =
  | { readonly kind: "record"; readonly draft: ReviewRecordDraft }   // pre-hash-chain draft; appendReviewRecord computes hashes
  | { readonly kind: "deferred"; readonly reason: "requires_independent_review" }; // deterministic reviewers hand off, never self-approve semantic content

interface Reviewer {
  readonly reviewerClass: "deterministic_rule" | "fixture" | "external_independent";
  review(context: ReviewContext): Promise<ReviewOutcome>;
}
```

### Deterministic semantic-safety checks

May detect (rule-based, no judgement call): ambiguity indicators (stem patterns known to read as ambiguous — reused phrasing detection, not semantic understanding); Australian English issues (US spelling patterns — `color`, `-ize` where `-ise` is expected, etc.); vocabulary load (reading-level word lists exceeding the target year level); reading load (stem/stimulus length thresholds); alt-text leakage (alt text containing the literal answer string — reuses the same check family as Mission 2B's `content-safety-checks.ts`); answer/explanation inconsistency (a cheap string-overlap check, distinct from and no substitute for Mission 2C's full independent re-derivation); missing rubric elements (a `short_answer`/`essay` candidate lacking any marking rubric text); age-unsuitable language (a denylist/heuristic pass, not a semantic judgement).

**They may not independently approve** `semantic_objective` or `manual_review_writing` candidates — `canAdvanceToSemanticReviewPassed` (already implemented) hard-codes this: only `deterministically_computable` can advance without `hasIndependentReviewerRecordAtThreshold`. A deterministic reviewer running against a `semantic_objective` candidate can only ever emit a `ReviewOutcome.deferred` or a `ReviewRecord` with `result: "warning"`/`"uncertain"` — it must never emit `result: "passed"` for these two classifications, and the orchestrator must reject (defensively, at the code-review level, not just by convention) any deterministic-reviewer output that claims otherwise.

### Independent semantic review

Requirements (all map directly onto the already-implemented `reviewRecordSchema` and `isProductionGradeIndependentReview`, §Mission-2C-facts above — Mission 3 does not extend this schema, it is the first mission to populate it from a real external source):

- **Reviewer identity:** `normalisedIdentitySchema`, resolved via `normaliseIdentity` from the reviewer's declared model/tool name — never a raw string.
- **Reviewer independence:** `identitiesAreIndependent(generatorIdentity, reviewerIdentity)` must be `true` (§20).
- **Confidence:** `0 ≤ confidence ≤ 1`; production-grade requires `≥ FACTORY_THRESHOLDS.PRODUCTION_REVIEW_CONFIDENCE (0.8)`.
- **Evidence:** `evidenceReferences.length > 0`, each entry ≤ `FACTORY_LIMITS.REVIEW_MAX_EVIDENCE_REFERENCE_LENGTH` (300 chars), ≤ `REVIEW_MAX_EVIDENCE_REFERENCES` (15) entries.
- **Ambiguity status:** `"none" | "resolved" | "unresolved"`; only the first two count toward production-grade evidence.
- **Review prompt version / hash:** `reviewPromptVersion` matches `FACTORY_VERSIONS.REVIEW_PROMPT_VERSION` (or a documented bump); `reviewPromptHash` matches the hash of the review pack actually issued (§8) — cross-checked at ingestion (§9), not merely recorded.
- **Candidate revision / content hash / blueprint hash:** the `reviewEvidenceBindingSchema` triple, checked against the candidate's *current* state at every consumption point (`isReviewStillValid`), not just at ingestion time.
- **Review result hash:** `reviewResultHash` inside the evidence binding, plus the outer `reviewHash`/`previousReviewHash` chain fields — computed only by `appendReviewRecord`, never hand-assembled.

**Reviewer approval is never inherited from generator output or generator metadata.** A generator cannot pre-populate, suggest, or default any field of a `ReviewRecord`; the review pipeline reads only the candidate's content and blueprint, never the generator's internal reasoning, confidence, or self-assessment (none of which exist as fields on `CandidateProvenance` in the first place — there is no `generatorConfidence` field to accidentally leak).

---

## 8. Review-prompt contract

`questions:review-prompt` produces the external review pack.

**Pack contents (required fields):** `candidateId`, `revision`; candidate content (the full renderable question, but see the bounded-inclusion rule below); `candidateContentHash`; `blueprint` and `blueprintHash`; `semanticClassification`; the applicable rubric (type-specific — matching the production schema's per-type shape, e.g. essay/short-answer marking criteria); answer and explanation, included **only** where the reviewer's task requires seeing them — for `manual_review_writing` (open-ended) content the reviewer needs the full rubric and any model answer; for `semantic_objective` content (already correctness-gate-passed, so the "objective" answer is already independently verified) the pack may omit the raw answer key to avoid biasing the reviewer's read of ambiguity, and instead ask the reviewer to state what they believe the answer is, for later cross-check (PD-8: exact inclusion policy per classification needs an explicit decision before 3B implementation — see Prerequisite decisions).

Also required: Australian English requirements; age-suitability criteria (year-level target from the blueprint); ambiguity criteria (what counts as "unresolved" — a closed rubric, not the reviewer's free judgement of the word); evidence-sufficiency criteria (how many/what kind of evidence references are required for a `"passed"` result); originality-warning requirements (the reviewer is asked to flag, not adjudicate, suspected reuse of copyrighted/official material — final originality determination stays with the dedicated originality gate, §12); confidence scale (0–1, with anchored descriptions at 0.2 intervals so different reviewers interpret the scale consistently); strict response schema (the exact JSON shape `questions:review-ingest` will parse — restated in the pack, not left implicit); `reviewPromptVersion`; `reviewPromptHash` (computed the same way as the generation prompt pack's `promptHash`, §5).

**Bounded inclusion rules (oversized-candidate protection):** the pack includes candidate content up to `FACTORY_LIMITS.MAX_STIMULUS_LENGTH` (8000 chars) and `MAX_OPTIONS_PER_QUESTION`/`MAX_VISUALS_PER_QUESTION` as already bounded by the production schema itself — since every candidate reaching the semantic-review stage already passed structural validation against `questionSchema`, it is already within these bounds by construction; the review-pack builder does not need its own separate truncation logic, only a defensive assertion that the bound still holds (fail closed with a structured error if it somehow doesn't, rather than silently emitting an oversized pack).

---

## 9. External review-ingestion contract

`questions:review-ingest` — the counterpart to `questions:prompt`/`questions:review-prompt`: parses a human-pasted external reviewer response and, if valid, calls `appendReviewRecord` and drives the `semantic_review_passed` transition.

**Validated fields (response schema):** `reviewId` (new — a stable id for *this* review submission, distinct from `candidateId`, used for idempotent-replay/conflict detection below); `candidateId`; `candidateRevision`; `candidateContentHash`; `blueprintHash`; reviewer `provider`, `modelId`, `modelFamily` (raw declared strings, resolved through `normaliseIdentity`); review `timestamp`; `result`; `confidence`; `findings`; `ambiguityStatus`; `evidenceReferences`; `recommendedCorrections` (new field, feeds the revision workflow's "reviewer findings" input, §10); `reviewPromptVersion`; `reviewPromptHash`; an explicit `reviewerIndependenceAcknowledged` flag is **not** trusted — independence is always recomputed server-side from the normalised identity, never taken from the input (a self-declared "I am independent" field would be exactly the kind of trust Mission 2's trust model forbids); `reviewResultFingerprint` — `hashJson` over the response's own content-bearing fields (excluding `timestamp`), computed by the ingestion step itself for comparison against a resubmission under the same `reviewId`, not supplied by the input.

**Outcomes:**

| Condition | Outcome | Lifecycle effect |
|---|---|---|
| Malformed JSON | `malformed_review_response` | No mutation; quarantine the raw input file for manual inspection. |
| Unknown `candidateId` | `unknown_candidate` | No mutation. |
| Stale `candidateRevision` (doesn't match current) | `stale_review_revision` | No mutation; caller must re-issue `questions:review-prompt` against the current revision. |
| `candidateContentHash` mismatch | `content_hash_mismatch` | No mutation — the candidate changed since the pack was issued. |
| `blueprintHash` mismatch | `blueprint_hash_mismatch` | No mutation. |
| Missing evidence (`evidenceReferences` empty on a `"passed"` result) | `insufficient_evidence` | No mutation; review recorded as `result: "warning"` at most, never `"passed"` — reviewers who assert `passed` without any evidence reference are treated as producing an incomplete review, not a valid negative. |
| Unsupported reviewer identity (no alias-table match) | `unsupported_reviewer_identity` | No mutation. |
| Self-review (identity equals generator identity) | `self_review_rejected` | No mutation — the review is discarded outright, not merely down-weighted. |
| Alias-equivalent self-review (different declared name, same normalised identity) | `self_review_rejected` (same code — §20 requires these to be indistinguishable in outcome) | No mutation. |
| Low confidence (`< PRODUCTION_REVIEW_CONFIDENCE`) | Recorded, but not production-grade | `appendReviewRecord` still appends it (the chain is a complete audit trail of every submitted review, not just the accepted ones) but `isProductionGradeIndependentReview` returns `false`, so the candidate cannot advance on this record alone. |
| Unresolved ambiguity | Same as low confidence | Recorded, non-advancing. |
| Duplicated review (same `reviewId`, identical `reviewResultFingerprint`) | Idempotent replay | No new chain entry; returns the existing outcome. |
| Changed review under reused `reviewId` (same `reviewId`, different `reviewResultFingerprint`) | `review_id_conflict` | No mutation — refused, never silently overwrites the earlier submission; caller must use a new `reviewId` for a genuinely different review. |
| Valid review replay (candidate already advanced from an earlier acceptance of this exact review) | Idempotent — `applyTransition`'s destination is already the current state | No mutation, success response reports `replayed: true`. |

**Accepted reviews may advance only to the next permitted gate.** `questions:review-ingest`'s only lifecycle action is attempting `applyTransition(current, "semantic_review_passed", ...)` — it has no code path that touches `originality_review_passed`, `difficulty_review_passed`, or `staged`. **They must never bypass originality or difficulty** — structurally guaranteed by the transition table having no such edge, restated here as an explicit contract clause because it is the property the mission brief calls out by name.

---

## 10. Revision workflow

`questions:revision-prompt` generates a targeted prompt for producing a corrected candidate, built from a `needs_revision` candidate's accumulated review findings.

- **Eligible starting state:** `needs_revision` only. Attempting revision-prompt generation against any other state is refused (`invalid_revision_source_state`).
- **Reviewer findings / required corrections:** sourced from the terminal `ReviewRecord.findings` and `recommendedCorrections` (§9) of the candidate that reached `needs_revision` — never re-derived or guessed, always the literal stored findings.
- **Unchanged blueprint constraints:** the revision prompt reuses the exact same `blueprintHash` as the parent — a revision corrects the candidate against the same blueprint, it never changes the target skill/type/marks out from under the reviewer's findings.
- **Parent candidate ID:** `parentCandidateId = <the needs_revision candidate's id>`, set on the new candidate's provenance.
- **Current revision / maximum revision:** the new candidate's `revision = parent.revision + 1`; `questions:revision-prompt` refuses to run at all once `parent.revision + 1 > FACTORY_THRESHOLDS.MAX_REVISIONS (2)` — i.e. a parent already at revision 2 cannot produce a revision-prompt for revision 3 (this is a second enforcement point, in addition to `applyTransition`'s own check, deliberately — fail closed as early as possible).
- **New candidate ID policy:** freshly minted (same deterministic-hash-derived scheme as ingestion, §6), never a mutation of the parent's ID — the parent record is untouched and remains queryable at its terminal `needs_revision` state forever.
- **New content hash:** the revised candidate's own `hashJson(content)` — necessarily different from the parent's (a revision with an *identical* content hash to its parent is a structural error, refused as `revision_no_material_change`).
- **Generator identity / prompt version:** the revision may be produced by the same or a different generator/human than the original — no constraint on identity here (only the *reviewer* identity independence rule applies, §7/§20); `promptVersion` is the version of the *revision* prompt template, tracked separately from the original generation prompt version.
- **Complete pipeline rerun:** the revised candidate enters at `generated` via ordinary `questions:ingest` (with `parentCandidateId` in its input) and runs the full gate sequence from the start — structural validation is not skipped, correctness is not skipped, semantic review is not carried over from the parent. A revision that happens to reintroduce the exact same defect must be caught by the same gates that caught it the first time, not exempted because "it was already reviewed once."

**Revision replaces, archives, or links to the previous candidate record?** **Links, never replaces or auto-archives.** The parent stays at `needs_revision` (a `TERMINAL_STATE`, per §3) permanently — it is not moved to `archived` automatically, because the audit trail must show the full lineage (original attempt → what was wrong → what changed) without a human having to reconstruct it from separate records. `questions:reconcile` (§18) may offer a bulk "archive superseded needs_revision records whose child reached `staged`/`published`" convenience action, but this is an explicit, reported, opt-in reconciliation action — never an automatic side effect of ingesting the revision.

**Terminal behaviour when revision count exceeds two.** Enforced twice: (1) `questions:revision-prompt` refuses to generate a prompt for a would-be revision 3 (above); (2) even if a caller somehow constructed and ingested a revision-3 candidate directly (bypassing the prompt step), that candidate's own gate failures would hit `applyTransition`'s `revision_limit_exhausted` check on its *own* `revisionCount` and be routed to `rejected`, never `needs_revision` — there is no path, at any layer, to a fourth attempt.

---

## 11. Pipeline runner contract

`workflow/pipeline-runner.ts` (new) — the orchestrator that drives a batch of candidates through every remaining gate in one call, replacing what would otherwise be five separate manual CLI invocations per candidate.

- **`pipelineRunId`:** a factory identifier, one per invocation, threaded through every evidence record produced during the run (`CorrectnessVerificationEvidence` etc. don't currently carry `pipelineRunId` directly, but `CandidateProvenance.pipelineRunId` does — the runner is responsible for ensuring every candidate it processes already carries the run's id, or, for candidates created mid-run e.g. via generation, stamping it at creation).
- **`batchId`:** groups candidates for staging/publication purposes (§12, §13) — normally one blueprint batch, but the runner accepts an explicit candidate-id list too (e.g. re-running just the revisions from a prior batch).
- **Deterministic candidate ordering:** candidates are processed in a stable sort (by `candidateId`, the identifier scheme already collision-resistant and deterministic) — never insertion order of a filesystem `list()` call, which is not guaranteed stable across platforms.
- **Stage order:** fixed — structural → correctness → semantic → originality → difficulty → stage-eligibility check. A candidate that fails at any stage stops progressing (routes to its failure outcome) and is excluded from later stages in *this* run; it does not block other candidates.
- **Stop conditions:** the runner completes when every candidate in the batch has reached a terminal state or `staged` — it does not "stop early" on the first failure (batch-level fail-fast is explicitly *not* the model, per the "one candidate failure does not corrupt another" invariant, §24).
- **Revision-loop handling:** the runner does **not** auto-generate revisions — reaching `needs_revision` ends that candidate's participation in *this* run; a human/generator must run `questions:revision-prompt` and re-ingest before a follow-up pipeline run picks up the new candidate. (Auto-looping generation→review→revision without a human in the loop is explicitly out of scope — see PD-9.)
- **Maximum revision count:** enforced upstream (§10), the runner itself does not duplicate this check but will correctly refuse to advance a candidate whose `revisionCount` is already exhausted, via the same `applyTransition` call every gate uses.
- **Terminal outcomes:** `staged | rejected | quarantined | needs_revision` per candidate (a `PipelineRunReport` row each).
- **Staged outcome:** distinct from "terminal" in the type system (`staged` is not in `TERMINAL_STATES`, §3) but is the run's success condition for a candidate — call out both explicitly per the mission brief's wording.
- **Per-candidate result:** `{candidateId, startState, endState, gateResults: readonly GateResult[], durationMs}` where `GateResult = {gate, outcome: "passed"|"failed"|"quarantined", evidenceFingerprint?}`.
- **Batch result (`PipelineRunReport`):** `{pipelineRunId, batchId, startedAt, completedAt, candidateResults: readonly PerCandidateResult[], summary: {staged, rejected, quarantined, needsRevision}}` — written to `content/question-factory/reports/pipeline-run-<pipelineRunId>.json`.
- **Dry-run:** runs every gate's pure decision function against current candidate state but skips all `repository.update`/`move` calls — produces an identical `PipelineRunReport` shape with every entry additionally flagged `simulated: true` (§17).
- **Retries:** a re-invocation of the runner with the same `pipelineRunId` against the same candidate set resumes rather than restarts — candidates already at a terminal/staged state from a prior partial run are skipped (reported as `replayed: true`), not reprocessed.
- **Replay:** the fingerprint-replay pattern already used by structural/correctness evidence extends uniformly to every new gate the runner drives (originality, difficulty) — no new replay mechanism, reuse of the existing one.
- **Partial failure:** one candidate's gate function throwing an unexpected exception is caught at the per-candidate boundary, recorded as a `repository_error`-class outcome for *that* candidate only, and the runner continues with the rest of the batch — never an uncaught exception that aborts the whole run mid-batch leaving some candidates in an ambiguous state.
- **Batch lock:** one `pipelineRunId` at a time may be actively running against a given `batchId` (a lock file under a new `.pipeline-locks/` sidecar, same ownership-token discipline as `storage/`'s existing candidate locks) — prevents two concurrent runner invocations from double-processing the same batch.
- **Candidate lock:** each individual gate transition still goes through `FactoryRepository.move`/`update`, which already serialises per-candidate (§existing `storage/` facts) — the runner does not need its own separate per-candidate lock, it inherits this from the repository layer.
- **Report generation:** the `PipelineRunReport` (above) plus, per the invariant below, is itself subject to the "stale reports cannot be reused" test (§24) — a report is only trusted if its own fingerprint (over `pipelineRunId` + the final state of every candidate it covers) still matches current repository state at read time.

**Required invariant:** *Every candidate processed by a completed pipeline run ends in an allowed terminal state or `staged`.* Enforced structurally: the runner's per-candidate loop only exits when the candidate's current state is in `TERMINAL_STATES ∪ {"staged"}` (or the run's iteration budget for that candidate — see `MAX_CANDIDATES_PER_PIPELINE_RUN`, §21 — is exhausted, which is itself reported as an explicit `run_incomplete` batch-level condition, never silently treated as success).

---

## 12. Staging contract

Entering `staged` requires **all** of: (a) the candidate is currently at `difficulty_review_passed`; (b) every upstream gate's evidence is present, fresh (fingerprint/binding still matches current content hash/revision/blueprint hash), and not itself in a failed state; (c) for `semantic_objective`/`manual_review_writing` candidates, the semantic-review evidence specifically passes the full `isProductionGradeIndependentReview` re-check (not just "a review exists") — staging re-verifies this itself rather than trusting that the earlier transition happening once is still true, because time may have passed and the candidate's content must not have silently drifted (it can't, in this codebase — candidate content is immutable after `generated` in the current design, but the re-check remains cheap insurance against a future change weakening that guarantee).

| Classification | Correctness | Independent semantic review | Originality | Difficulty | Staging eligible |
|---|---:|---:|---:|---:|---:|
| `deterministically_computable` | Required (`correctness_check_passed`, capability `deterministically_verifiable`) | Not required — deterministic safety checks only, per `canAdvanceToSemanticReviewPassed` | Required (originality gate, §PD-4) | Required (difficulty gate, §PD-4) | Conditional on correctness + originality + difficulty all passing; semantic gate auto-clears |
| `semantic_objective` | Required where applicable (capability may be `requires_independent_semantic_review` for the correctness dimension too — in which case correctness itself routes to `quarantined` rather than passing, and staging is blocked upstream) | **Required** — chain-verified, independent, ≥0.8 confidence, no unresolved ambiguity | Required | Required | Conditional on all four |
| `manual_review_writing` | Structural plus rubric checks only (no independent-derivation correctness check is meaningful for open-ended writing; correctness gate's `capability` classifies these `structurally_scoreable_only` or `requires_independent_semantic_review`) | **Required** | Required | Required | Conditional on all four |

Staging **fails closed** on any missing, stale, copied (§19/§22 — a review whose `reviewResultFingerprint` matches another candidate's, or whose hash-chain fails `verifyReviewChain`), mismatched (content/blueprint/revision), low-confidence, ambiguous, or self-reviewed evidence — any one of these routes the staging attempt to `rejected` (for the definite failures) or `quarantined` (for the "cannot decide" ones, e.g. a corrupted-but-not-obviously-forged chain), never a silent pass.

---

## 13. Publication contract

Publication is identified by a fresh `publicationId` (factory identifier) per attempt and must verify, before touching any file:

- Lifecycle state: candidate is at `staged`.
- Gate evidence: all five upstream evidence records present and internally consistent (§12).
- Evidence fingerprints: recomputed fresh from current stored content, not read from a cached summary field (§19 "all replay paths must recompute fingerprints before trust").
- Cross-report binding: correctness evidence's `structuralEvidenceFingerprint` still matches the stored structural report; semantic review's `evidenceBinding` still matches current content/blueprint/revision.
- Provenance: `CandidateProvenance` present, well-formed, `generatorAdapter.class !== "deterministic_fixture"` under `RepositoryMode.production` (hard refusal, §3).
- Reviewer independence: re-verified, not merely assumed from the stored `result: "passed"`.
- Revision: the candidate's `revision` is recorded in the manifest (traceability into the lineage, §10).
- Stable production ID: minted deterministically from `(blueprintId, skillId, batchId)` or similar stable inputs (exact formula: PD-5) — never from a random UUID, so re-publishing an unchanged candidate under a retried `publicationId` resolves to the *same* production ID rather than creating a duplicate-looking new one.
- Production collision: the stable production ID must not already exist in the current production bank (`src/content/questions/generated/` plus the hand-authored `src/content/questions/grade-{3,5}/` seed bank, §PD-5) under different content — an identical re-publication is a safe replay (below), a colliding *different* candidate is refused.
- Batch ID / publication ID: both recorded in the manifest.
- Manifest freshness: the manifest is built from a fresh read of every controlled file's current state (§14 step 3, "snapshot") — never assembled from stale in-memory state left over from a much earlier `questions:stage` call.
- Manifest hash / contract hash: `hashJson` over the manifest and over the regenerated `question-bank-contract.generated.json`, both recorded for later replay/reconciliation comparison.
- Schema validity: the published batch JSON validates against the real `questionSchema` (reuses `production-schema-check.ts`'s mapping, the same one structural validation already exercises — publication does not maintain a second, divergent schema check).
- Scoring validity: every published question round-trips through the real `scoreQuestion` without error (reuses the same wrapper `correctness/`'s evidence-builder already calls, `CORRECTNESS_SCORER_VERSION`).
- Correctness validity: the candidate's stored correctness evidence outcome is `"passed"` (never `"review_required"` — that outcome routes to `quarantined` upstream and can never reach `staged` in the first place, so this is a defensive re-check, not a new gate).
- Deduplication: the published batch contains no two candidates resolving to the same stable production ID within the batch itself (an intra-batch collision, distinct from the cross-bank collision check above).
- Controlled-file registry: publication touches only the files enumerated in `PUBLICATION_CONTROLLED_FILES` (`config/publication-file-registry.ts`, already implemented) — verified defensively (the transaction implementation should assert its own file list against the registry before writing, not merely be written correctly by convention).

**Controlled outputs** (paths exactly as declared in the existing registry; two do not exist on disk yet, flagged):

- `src/content/questions/generated/batch-<batchId>.json` — new, per-batch published-question JSON.
- `src/content/questions/generated/index.ts` — **does not exist yet.** Static loader/index that imports every `batch-*.json`, validates each through `questionSchema`, and re-exports a flat `readonly Question[]` for `src/content/questions/question-bank.ts` (the existing loader, already `src/content/questions/question-bank.ts`, itself re-exported by `src/content/question-bank.ts`) to concatenate alongside the hand-authored grade modules.
- `src/content/questions/question-bank-contract.generated.json` — **does not exist yet.** A machine-generated contract (question count, type/visual/subject distribution, hash of the full bank) that `scripts/validate-question-bank.mts` is expected to consume (per the file's own doc comment, "Consumed by scripts/validate-question-bank.mts; never edited by that script" — meaning Mission 3's publisher is the only writer, the validator only reads it). Exact contract shape: PD-10.
- `src/content/questions/question-bank-summary.ts` — exists today, hand-maintained prose matching `docs/QUESTION_BANK_SUMMARY.md`'s narrative. Becomes a controlled, publication-rewritten file (PD-6 decides how much of its current hand-written framing survives regeneration).
- Publication manifest — `content/question-factory/published-manifests/<publicationId>.json` (factory workspace, tracked, never gitignored, per the registry's own doc comment).

**The generated loader must:** be static (no dynamic `require`/`import()` of candidate-controlled paths — the set of `batch-*.json` files it imports is itself part of what publication writes, i.e. the loader's own import list is regenerated alongside the batches, not computed at runtime via directory scanning); contain no candidate-derived executable code (candidate content is data, imported as JSON, never `eval`'d or templated into `.ts` source); validate imported JSON through the authoritative production schema (`questionSchema`, the same schema `src/content/questions/question-bank.ts` already runs the hand-authored questions through via `validateQuestionBank`); avoid dynamic code generation (the publisher writes `.json` data files and one small, template-stable `.ts` loader whose *shape* never changes between publications, only its list of imports).

---

## 14. Publication transaction and rollback

**Before publication**, for every controlled file (from `PUBLICATION_CONTROLLED_FILES`) capture: repository-relative path; existence status (exists / does-not-exist-yet, e.g. `index.ts` and `question-bank-contract.generated.json` on the very first publication); file hash (`hashContent` over current bytes, for existing files); full byte content (the actual rollback source — held in memory/a temp snapshot dir for the duration of the transaction, not just the hash); directory existence (`src/content/questions/generated/` itself, which may not exist before the first publication); directory membership where required (the full current list of `batch-*.json` files, so a rollback can tell "this batch file is new, delete it" from "this batch file existed before, restore its prior bytes").

**Atomic publication protocol** (ten steps, as specified):

1. **Publication lock** — acquire a single global publication lock (§15) before any read of controlled-file state; refuse immediately (`publication_lock_held`) if another publication is in progress.
2. **Validation** — run every §13 check against current staged-candidate state. Any failure aborts here, before the snapshot step, so a failed validation never even opens a rollback window (nothing has been touched).
3. **Snapshot** — capture the "before" state described above for every controlled file, into a temp snapshot directory (e.g. `content/question-factory/.publication-tmp/<publicationId>/snapshot/`).
4. **Temporary outputs** — write every new/changed controlled file's *new* content into a temp staging area (e.g. `.publication-tmp/<publicationId>/output/`), never directly into the real controlled-file paths yet.
5. **Validation of temporary outputs** — re-run schema/scoring/contract validation against the *temp* files (not the eventual real ones) — catches a bug in the publisher itself before anything real is touched.
6. **Atomic replacement** — for each controlled file, `fs.rename` the temp output over the real path (rename is atomic on both POSIX and Windows NTFS within the same volume — the existing `storage/fs-factory-repository.ts` move implementation already relies on this same guarantee, reused here rather than reinvented).
7. **Post-write validation** — re-read every just-written real file and re-validate (defends against a rename that silently truncated/corrupted content on an unusual filesystem).
8. **Manifest finalisation** — write the publication manifest (§13) only after every controlled file's post-write validation passes.
9. **Success record** — mark the publication complete (clears the `.publication-tmp/<publicationId>/` working directory, releases the lock), moves the affected candidates `staged → published`.
10. **Rollback on any failure** at steps 2–8: restore every controlled file to its captured "before" snapshot, remove anything newly created, release the lock, write a bounded reconciliation record (§18/§19) explaining what was attempted and why it was rolled back — never leave the transaction half-applied.

**Rollback must:** restore previous files byte-for-byte (from the step-3 snapshot, not a re-derivation); restore deleted files (a controlled file the failed publication deleted is put back); remove newly created files (a controlled file that didn't exist pre-publication, e.g. a first-ever `index.ts`, is deleted again on rollback, not left as an orphan); restore directory state (if `generated/` itself was newly created for a first publication, rollback removes the directory too, once empty); remove temporary files (`.publication-tmp/<publicationId>/` is cleared); remove partial manifests (no `published-manifests/<publicationId>.json` survives a rolled-back attempt); restore contract and summary (`question-bank-contract.generated.json`/`question-bank-summary.ts` byte-restored like any other controlled file); retain a bounded reconciliation record (a small, size-capped `content/question-factory/reports/rollback-<publicationId>.json`, per §21's report-size bound — never the full before/after byte content, just hashes and a summary, so rollback records themselves cannot become an unbounded disk-growth vector).

**Safe replay for:**

- **Same batch, same publication ID, unchanged content:** step 2's validation recomputes the manifest hash, finds it identical to an already-successful publication's manifest, and returns success without repeating steps 3–9 (a true no-op replay).
- **Changed batch content under the same publication ID:** refused (`publication_id_reused_with_different_content`) — a `publicationId` is a one-time identity, not a mutable pointer.
- **Changed manifest** (something about the *manifest*, not the underlying candidates, differs on a retry — e.g. a code bug in manifest assembly between two attempts): treated the same as changed content — the manifest hash is part of what "unchanged" means.
- **Interrupted publication** (crash between steps 3–8): on the next `questions:publish`/`questions:reconcile` invocation, the `.publication-tmp/<publicationId>/` directory's presence is detected; since no success record (step 9) exists, it is always rolled back, never resumed forward — resuming a partially-applied production-file write is explicitly not supported (§15, §22).
- **Already-published identical content:** the stable-production-ID collision check (§13) recognises "same ID, same content hash" as a no-op, not a collision.
- **Reused publication ID with different hashes:** refused, as above — this is the one case that must never be treated as a replay.

---

## 15. Publication concurrency model

**Supported model: one publication at a time, globally**, extending the existing filesystem-repository locking model (`storage/fs-factory-repository.ts`'s `O_CREAT|O_EXCL` lock-file pattern) rather than inventing a new mechanism.

- **Lock ownership token:** `fs.open(publicationLockPath, "wx")`, payload `{publicationId, token: randomUUID(), acquiredAt}` — identical shape to the existing per-candidate lock payload.
- **Lock timeout:** a bounded max-wait (proposed default: matches or slightly exceeds the existing candidate-lock default of 5000ms, but publication transactions may reasonably need longer — proposed 30000ms, §21 PD).
- **No unsafe stale-lock stealing:** identical discipline to the existing repository lock — a lock is only released by the token that acquired it; there is no age-based "steal a lock older than N minutes" path, by design (same rationale as the accepted Mission 2C technical debt: "crashed-process repository locks require manual recovery").
- **Crashed-process recovery:** manual — `questions:reconcile` reports an abandoned publication lock (age beyond a sanity threshold, plus no matching in-progress `.publication-tmp/` activity) as a finding requiring explicit operator action (§18), never auto-clears it.
- **Manual reconciliation:** the operator runs `questions:reconcile --release-abandoned-publication-lock <publicationId>` (an explicit, named, auditable action — never a default reconcile behaviour) after confirming out-of-band that the crashed process is truly gone.
- **Unsupported distributed writers:** this model assumes a single filesystem, single machine, single writer process at a time — no distributed-lock coordination (e.g. no Redis/DB-backed lock) is in scope for Mission 3, consistent with the whole factory's filesystem-repository architecture.

**Interaction with candidate-level repository locks:** the publication lock is a *separate, coarser* lock layered on top of, not instead of, the existing per-candidate locks. The publication transaction still calls the repository's ordinary per-candidate `move`/`update` when it flips `staged → published` (step 9) — that call still goes through the candidate's own lock. The publication lock's purpose is different: it serialises the *controlled-file* transaction (§14), which spans many candidates and non-candidate files at once and has no natural single-candidate lock to hang off. A `questions:stage` call for one candidate and a `questions:publish` run for a *different* batch can proceed concurrently (they touch disjoint locks); two `questions:publish` invocations, or a `questions:publish` and a `questions:stage` for a candidate that publication is currently reading, are serialised — publication's step 1 lock acquisition additionally requires briefly touching every staged candidate it will publish, so `questions:stage` calls for *those specific* candidates are naturally excluded by the candidates' own locks during that window.

---

## 16. CLI contract

All commands are non-interactive, accept `--json` for structured stdout output (default: human-readable), never prompt, and exit non-zero on any failure (exit-code catalogue below the table).

| Command | Inputs | Outputs | Writes | Exit codes | Replay behaviour |
|---|---|---|---|---|---|
| `questions:plan` | coverage request (skill targets, counts) | blueprint batch summary | `blueprints` compartment | 0 ok / 2 validation / 1 internal | Deterministic replan of identical request is byte-identical; re-planning an existing `batchId` without `--force` is refused. |
| `questions:prompt` | `batchId` or blueprint id list | prompt pack path + hash | `reports/prompt-pack-*.json` | 0 / 2 / 1 | Deterministic (§5). |
| `questions:generate` | `batchId`, `--generator fixture` | generated candidate summary | `generated` compartment | 0 / 2 / 1 | Replay-safe (§4). |
| `questions:ingest` | inbox path (default `content/question-factory/inbox/`) | ingestion report (created/quarantined counts) | `generated` compartment, inbox `processed/`/quarantine | 0 ok / 3 partial (some quarantined) / 2 validation / 1 internal | Replay-safe (§6). |
| `questions:review-prompt` | `candidateId` | review pack path + hash | `reports/review-pack-*.json` | 0 / 4 not_found / 2 / 1 | Deterministic (§8). |
| `questions:review-ingest` | review-response file path | review outcome | `reviewRecords` append (candidate record rewrite), `semantic_review_passed` transition on success | 0 ok / 3 recorded-not-advancing (low confidence/ambiguous) / 5 conflict (`review_id_conflict`) / 2 validation / 1 internal | Idempotent replay; conflict refusal (§9). |
| `questions:revision-prompt` | `candidateId` (must be `needs_revision`) | revision prompt pack | `reports/revision-pack-*.json` | 0 / 4 not_found / 6 invalid_state / 7 revision_limit_exhausted / 1 internal | Deterministic (§10). |
| `questions:validate` | `candidateId` or `batchId` | structural validation report | `structural_validation_passed`/`rejected`/`needs_revision`/`quarantined` transition | 0 pass / 3 fail (reported, not a CLI crash) / 4 not_found / 1 internal | Fingerprint replay (existing Mission 2B behaviour). |
| `questions:check-answers` | `candidateId` or `batchId` | correctness verification report | `correctness_check_passed`/etc. transition | 0 / 3 / 4 / 1 | Fingerprint replay (existing Mission 2C behaviour). |
| `questions:review` | `candidateId`, `--reviewer deterministic` | deterministic semantic-safety report | append-only findings record (never a transition on its own for semantic/manual classes, §7) | 0 / 3 / 4 / 1 | Fingerprint replay. |
| `questions:dedupe` | `batchId` or `candidateId` | originality-check report | `originality_review_passed`/etc. transition | 0 / 3 / 4 / 1 | Fingerprint replay. |
| `questions:difficulty` | `batchId` or `candidateId` | difficulty-check report | `difficulty_review_passed`/etc. transition | 0 / 3 / 4 / 1 | Fingerprint replay. |
| `questions:stage` | `candidateId` or `batchId` | staging report | `staged` transition | 0 / 3 / 4 / 1 | `move` idempotent replay (§3, §12). |
| `questions:publish` | `batchId`, `publicationId` | publication manifest summary | controlled files (§13), `published` transition | 0 ok / 8 rolled_back / 9 lock_held / 2 / 1 | Publication replay (§14). |
| `questions:report` | `pipelineRunId` / `batchId` / `publicationId` | the corresponding stored report, re-rendered | none (read-only) | 0 / 4 not_found / 1 | Pure read; always safe to repeat. |
| `questions:pipeline` | `batchId` (or explicit candidate-id list) | `PipelineRunReport` | every gate transition it drives (§11) | 0 all_staged_or_terminal / 3 partial / 1 internal | §11 replay/retry rules. |
| `questions:dry-run` | any of the above sub-commands via `--dry-run` (a flag, not a separate command tree — restated as its own catalogue row per the mission brief's explicit listing) | identical report shape, `simulated: true` | none | 0 / 2 / 1 | Always safe, never persists (§17). |
| `questions:reconcile` | none (scans the whole workspace) or `--scope batchId` | reconciliation report | bounded, explicitly-scoped repairs only (§18) | 0 clean / 3 issues_found_and_reported / 10 issues_found_manual_action_required / 1 internal | Deterministic given current workspace state. |

**JSON output mode:** `--json` on every command emits one JSON object to stdout, no other stdout text — safe to pipe.
**Human-readable output mode:** default; concise summary lines plus a path to the full report file for detail.
**Non-interactive behaviour:** no command ever blocks on stdin; missing required arguments are a validation error (exit 2), never an interactive prompt.
**Error exit codes:** `0` success, `1` internal/unexpected error, `2` invalid arguments/validation, `3` partial success (some items in a batch failed/quarantined, the run itself completed), `4` not found, `5` conflict, `6` invalid state, `7` revision limit exhausted, `8` publication rolled back, `9` lock held/timeout, `10` reconciliation requires manual action. (Exact numeric assignments are a Mission 3 implementation detail to finalise in 3A, but the *categories* above are fixed by this contract so downstream tooling/CI can rely on them.)
**Partial success:** always distinguishable from total success via exit code 3 and a per-item breakdown in the report — a batch command never reports a blanket "success" when some items were quarantined.
**Dry-run:** §17.
**Maximum batch size:** `FACTORY_LIMITS.MAX_BATCH_SIZE` (200) / `MAX_CANDIDATES_PER_PIPELINE_RUN` (500) — a command exceeding these is refused up front (`batch_too_large`), never silently truncated.
**File limits:** inbox file count, prompt/review pack sizes — §21.
**Logging:** structured (one JSON line per event) to stderr; stdout reserved for the command's actual output contract above.
**No secrets in logs:** enforced by construction — no CLI command ever accepts or handles a live-provider credential in Mission 3 (§4, live provider is documented-only), so there is nothing to leak yet; this clause is a forward-looking constraint for whenever that adapter lands.
**Path safety:** every path argument is resolved against `getWorkspaceRoot()`/`getProductionQuestionsRoot()` (existing `config/paths.ts` helpers) and checked against the same `factoryIdentifierSchema`-derived traversal guard `storage/` already uses (`design.md` §3.2) — no command accepts an absolute or `..`-containing path fragment as a candidate/batch identifier.
**Windows compatibility:** all path joining goes through `node:path` (already the pattern throughout `config/paths.ts`, `config/publication-file-registry.ts`); file locking uses `O_CREAT|O_EXCL` (already verified atomic on Windows, `design.md`/repository facts above); content hashing already normalises CRLF and path separators (`provenance/content-hash.ts`) so identical logical content hashes identically regardless of checkout line-ending settings.

---

## 17. Dry-run contract

Dry-run exercises the complete pipeline (generation through publication) without any persistent production-bank write. Every orchestrator in Mission 3 accepts a `dryRun: boolean` context flag; when set, every call that would otherwise reach `FactoryRepository.create/move/update` or the publication transaction's steps 6–9 instead returns the result it *would* have produced, tagged `simulated: true`, without calling the underlying I/O.

**Tests must prove:**

- **Production files byte-identical:** a `questions:publish --dry-run` run followed by a hash comparison of every file in `PUBLICATION_CONTROLLED_FILES` shows zero change.
- **Controlled-file list unchanged:** no new files appear under `src/content/questions/generated/`.
- **Production count unchanged:** `questionBank.length` (the loader's live count) is identical before and after.
- **No manifests persist:** no new file under `content/question-factory/published-manifests/`.
- **No temporary publication files remain:** `.publication-tmp/` is empty (or, for a dry run, never created at all — dry-run should not even need the temp-staging steps, since step 4's "write to temp" is itself skipped in favour of an in-memory simulation).
- **Candidate repository behaviour follows the documented dry-run mode:** candidate records themselves are also unchanged — a dry-run pipeline run does not leave candidates sitting at `staged` that a real run would have advanced further, nor does it write partial evidence reports (evidence *computation* happens in memory for the report, but `writeReportIfAbsent`-style persistence is skipped).
- **Reports clearly indicate simulated outcomes:** every report row and the report's top-level object carry `simulated: true`; `questions:report` refuses to conflate a simulated report with a real one (distinct storage location, e.g. `reports/pipeline-run-<id>.simulated.json`, never the same path a real run would use).

---

## 18. Reconciliation contract

`questions:reconcile` — non-interactive, deterministic given current on-disk state (running it twice in a row with no intervening writes produces the identical report).

Detects: duplicate candidate locations (a candidate id physically present in two compartments — should be structurally impossible given `move`'s transaction discipline, but reconciliation checks anyway, as the disaster-recovery backstop); state/file mismatch (a candidate's stored `state` field disagrees with the compartment it's physically found in); missing reports (a candidate at `structural_validation_passed` or later with no corresponding stored evidence report); copied reports (two distinct candidates' evidence reports sharing an identical fingerprint where their content hashes differ — a sign of a report having been hand-copied rather than genuinely computed); stale fingerprints (an evidence report whose fingerprint, recomputed from current candidate content, no longer matches the stored fingerprint); orphaned inbox files (a `.processing` marker with no matching in-flight ingestion, per §6's interruption-recovery rule); orphaned temporary files (leftover `.publication-tmp/<publicationId>/` directories with no corresponding lock or in-progress record); abandoned locks (a `.locks/*.lock` or the publication lock older than a sanity threshold with no live owning process — detected heuristically, never auto-released, §15); partial publication (a `.publication-tmp/` directory present but no success record — always resolved as "should have been rolled back," §14); manifest/output mismatch (a `published-manifests/*.json` manifest whose recorded hashes don't match the current bytes of the files it claims to describe); contract mismatch (`question-bank-contract.generated.json`'s recorded counts/hash don't match the live loader's actual output).

For each inconsistency, the report classifies it as exactly one of:

- **Safe automatic repair** — e.g. finishing or rolling back a genuinely interrupted (but unambiguous) move/publication transaction, per the repository's existing `reconcile()` semantics extended to the publication-transaction case; performed automatically and reported.
- **Quarantine** — e.g. a state/file mismatch with no clear resolution direction; the affected candidate is moved to `quarantined` and the reconciliation report explains why.
- **Refusal / manual intervention** — e.g. an abandoned lock, a copied-report finding, a contract mismatch — reported with full detail but never auto-resolved, requiring an explicit follow-up CLI invocation naming the exact remediation (e.g. `--release-abandoned-publication-lock <id>`, per §15).

**Reconciliation evidence:** every reconciliation run produces a bounded (`§21`) `content/question-factory/reports/reconciliation-<timestamp-free-id>.json` record — identified by a content-derived id (hash of the findings), not a timestamp, so an unchanged reconcile run doesn't spam new report files.

---

## 19. Evidence and fingerprint model

Mission 3 evidence records, one row per producing stage:

| Stage | Schema (new unless noted) | Candidate binding | Batch binding | Publication binding | Prior-evidence references | Version fields | Fingerprint excludes |
|---|---|---|---|---|---|---|---|
| Generation | `CandidateProvenance` (existing) | `candidateId`, `contentHash` | `batchId` | — | — | `generatorVersion`, `promptVersion`, `schemaVersion`, `taxonomyVersion` | `generatedAt` (not itself fingerprinted today — PD-7 proposes adding a `generationFingerprint`) |
| Ingestion | `CandidateProvenance` (existing, `manual_external` path) | same | `batchId` | — | source file content hash | same | same |
| Semantic rule review | `ReviewRecord` (existing, `reviewerClass: "deterministic_rule"`) | `evidenceBinding` triple | — (candidate-scoped) | — | — | `reviewerVersion`, `reviewPromptVersion` | `reviewedAt` |
| External independent review | `ReviewRecord` (existing) | `evidenceBinding` triple | — | — | `previousReviewHash` (chain) | `reviewerVersion`, `reviewPromptVersion`, `reviewPromptHash` | `reviewedAt` |
| Revision | `CandidateProvenance.parentCandidateId`/`revision` (existing fields, no new schema) | new candidate's own binding | `batchId` (inherited) | — | parent's terminal `ReviewRecord` (referenced by id, not copied) | inherits parent's `promptVersion` lineage plus its own revision-prompt version | n/a (identity is the new content hash itself) |
| Pipeline run | `PipelineRunReport` (new, §11) | `candidateResults[].candidateId` | `pipelineRunId`, `batchId` | — | every gate's evidence fingerprint, by reference | — | `startedAt`/`completedAt` |
| Staging | `StagingEvidence` (new — `{candidateId, candidateRevision, candidateContentHash, upstreamFingerprints: {structural, correctness, semantic, originality, difficulty}, stagedAt, stagingFingerprint}`) | full | `batchId` | — | all five upstream fingerprints | gate versions inherited by reference | `stagedAt` |
| Publication | Publication manifest (new — §13/§14 contents) | list of `candidateId`s + their `StagingEvidence` fingerprints | `batchId` | `publicationId` | staging evidence fingerprints | `manifestVersion` | `publishedAt` |
| Rollback / reconciliation | Rollback record / reconciliation report (new, §14/§18) | affected candidate ids | affected `batchId`s | `publicationId` (rollback only) | the manifest/report that triggered it | — | timestamp field is present but excluded from any comparison fingerprint |

**Canonical fingerprint input:** every fingerprint follows the existing pattern (`computeStructuralValidationFingerprint`/`computeCorrectnessVerificationFingerprint`, §Mission-2C-facts) — `hashJson` over a plain object of identity-bearing fields, with the wall-clock timestamp field deliberately omitted from that object (not merely "present but ignored" — physically absent, so a future refactor can't accidentally fold it back in).

**Bounded issue summary:** every evidence record's issue/finding list is capped (`§21`) the same way `StructuralValidationEvidence.issueSummary` and `ReviewRecord.findings` already are.

**All replay paths must recompute fingerprints before trust.** Restated as the binding rule across every new gate (§3's "no report-only transition" clause plus §12's staging re-check plus §13's "recomputed fresh, not read from a cached summary field") — no Mission 3 code path is permitted to accept a stored fingerprint at face value without recomputing and comparing it against current content.

**No deterministic file name may be treated as identity proof.** A file named `batch-b001.json` claiming to be batch `b001`'s output is not, by itself, evidence of anything — every consumer (the loader, the validator, reconciliation) checks the file's *content* (its own declared `batchId`, its manifest-recorded hash) against the claim the filename makes, exactly the way `isProductionGradeIndependentReview` already refuses to trust a bare `ReviewRecord` by shape alone (§Mission-2C-facts, the defect that pattern was built to close).

---

## 20. Identity and independence model

Normalised identities only (`config/identity-normalisation.ts`, already implemented — Mission 3 does not extend the schema, only populates it from real external sources for the first time).

**Examples and pass/fail, against the existing `IDENTITY_ALIAS_TABLE`:**

| Generator declares | Reviewer declares | Normalised generator | Normalised reviewer | Independent? |
|---|---|---|---|---|
| `qwen-max` | `claude-sonnet-5` | `{qwen, qwen-max, qwen}` | `{anthropic, claude-sonnet-5, claude}` | **Pass** — different provider/modelId/modelFamily. |
| `claude-sonnet-5` | `qwen2.5` | `{anthropic, claude-sonnet-5, claude}` | `{qwen, qwen-max, qwen}` | **Pass.** |
| `claude` | `chatgpt` | `{anthropic, claude-sonnet-5, claude}` | `{openai, gpt-4, gpt}` | **Pass.** |
| `claude-sonnet-5` | `claude 3.5 Sonnet` | both resolve to `{anthropic, claude-sonnet-5, claude}` | same | **Fail** — same normalised identity despite different display strings; `self_review_rejected`. |
| `Sonnet-5` | `claude-sonnet-5` | same normalised identity | same | **Fail** — alias-equivalent self-review, same outcome code as the exact-string case (§9). |
| `claude-opus-4-8` | `claude-sonnet-5` | `{anthropic, claude-opus-4-8, claude}` | `{anthropic, claude-sonnet-5, claude}` | **Pass** — different `modelId` within the same family/provider is still independent, per the existing triple-comparison rule (`provider AND modelId AND modelFamily` must *all* match for non-independence). |
| `deterministic-fixture-generator` | `human` | `{other, deterministic-fixture-generator, fixture}` | `{human, human, human}` | **Pass** (though moot — fixture candidates never need production-grade semantic review to reach `staged` for `deterministically_computable` content, and can never publish regardless, §3/§13). |
| `some-new-model-xyz` (no alias-table entry) | anything | `normaliseIdentity` returns `undefined` | — | **Refused before independence is even checked** — `unsupported_reviewer_identity` (or the generator-side equivalent at ingestion). |

**Tests must cover** (mapped onto §24's "Reviewer independence" acceptance rows): provider aliases (`chatgpt`/`gpt-4`/`gpt-4o` all → the same normalised identity); model aliases (`opus`/`claude-opus-4-8`); model-family aliases (any two `claude-*` aliases within the same family but different `modelId` remain independent, per the row above — this is a *pass* case worth testing explicitly since it's easy to over-broaden the self-review check to the family level by mistake); interaction-mode differences (an `api`-mode and an `external_manual`-mode declaration of the *same* underlying model must still resolve to the same normalised identity and correctly fail as self-review — `interactionMode` is deliberately excluded from the independence comparison, per `identitiesAreIndependent`'s existing implementation, precisely so a generator can't dodge the self-review check by claiming a different interaction mode); same normalised identity under different display names (the two rows above); generator self-review (direct case); unsupported identity (no alias match, either side); missing identity fields (a response missing `provider`/`modelId`/`modelFamily` entirely fails `normalisedIdentitySchema` parsing before independence is even evaluated — a schema validation error, not a business-logic refusal).

---

## 21. Resource limits

Centralised in `FACTORY_LIMITS` (existing) plus new Mission 3 additions to the same frozen object — no gate/orchestrator/CLI command defines its own ad hoc bound.

| Limit | Value | Source |
|---|---|---|
| Prompt-pack size | ≤ `MAX_PROMPT_LENGTH` (2000) stem/prompt text; pack total capped at a new `MAX_PROMPT_PACK_BYTES` (proposed 50,000) | Existing + new |
| Reviewer-pack size | New `MAX_REVIEW_PACK_BYTES` (proposed 50,000), bounded by construction via `MAX_STIMULUS_LENGTH` etc. (§8) | New |
| Candidate JSON size | Bounded transitively by `MAX_STIMULUS_LENGTH` (8000), `MAX_OPTIONS_PER_QUESTION` (30), `MAX_VISUALS_PER_QUESTION` (6) | Existing |
| Review JSON size | New `MAX_REVIEW_RESPONSE_BYTES` (proposed 20,000) | New |
| Inbox file count | New `MAX_INBOX_FILES_PER_SCAN` (proposed 500) | New |
| Batch size | `MAX_BATCH_SIZE` (200) | Existing |
| Review findings count | `REVIEW_MAX_FINDINGS` (15) | Existing |
| Evidence-reference count | `REVIEW_MAX_EVIDENCE_REFERENCES` (15) | Existing |
| Recommended-correction count | New `MAX_RECOMMENDED_CORRECTIONS` (proposed 15, mirrors findings) | New |
| Message length | `MAX_ISSUE_MESSAGE_LENGTH` (300, from `correctness/config/correctness-limits.ts` — reused for the new gates rather than a fourth bound invented) | Existing |
| Report size | `MAX_REPORT_ENTRIES` (1000) | Existing |
| Publication batch size | `MAX_BATCH_SIZE` (200) — publication never exceeds what a single pipeline run could have staged | Existing |
| Controlled output size | New `MAX_GENERATED_BATCH_FILE_BYTES` (proposed 2,000,000 — generous headroom over 200 candidates at ~8KB stimulus each) | New |
| Revision count | `MAX_REVISIONS` (2) | Existing |
| Lock wait | Candidate lock: existing `DEFAULT_LOCK_MAX_WAIT_MS` (5000). Publication lock: new, proposed 30000 | Existing + new |
| Retry count | New `MAX_LIVE_PROVIDER_RETRIES` (proposed 3, live-provider-path only, documented not implemented) | New |
| Temporary-file count | New `MAX_PUBLICATION_TEMP_FILES` (bounded by `PUBLICATION_CONTROLLED_FILES`'s fixed key count — not actually variable, but asserted defensively) | New |

**Issue codes and boundary tests:** every limit above gets a dedicated issue code of the form `<domain>_limit_exceeded` (mirroring the existing `arithmetic_resource_limit_exceeded`/`fraction_resource_limit_exceeded`/`money_limit_exceeded` naming convention from `correctness/types.ts`) and a boundary test pair (`at limit → accepted`, `limit + 1 → refused with the exact code`) per §24/§23.

---

## 22. Failure and recovery matrix

| Failure | Observable state | Mutation permitted | Retry behaviour | Outcome | Issue code | Manual action |
|---|---|---|---|---|---|---|
| Malformed candidate JSON | Inbox file present, unparsed | Quarantine write only | Re-running ingest does not re-attempt the same quarantined file | `quarantined` (file-level, no candidate created) | `malformed_candidate_json` | Inspect quarantine report, fix and re-drop |
| Candidate ingestion interruption | `.processing` marker present | None until reconciled | `questions:reconcile` resolves per §6/§18 | resumes or rolls back | `interrupted_ingestion_transaction` | None if auto-resolved; else per report |
| Inbox clear failure | Source file un-movable to `processed/` (e.g. filesystem permission) | Candidates already created remain valid | Retry the move step alone (candidates are not re-created) | `ingestion_completed_cleanup_pending` | `inbox_cleanup_failed` | Manual filesystem check |
| Duplicate ingestion | Existing candidate at same id | None (no-op) or refusal if content differs | Safe to retry indefinitely | replay success / `duplicate_candidate` | `duplicate_candidate` | None if replay; investigate if refused |
| Malformed review JSON | Review response file present, unparsed | None | Re-submit corrected file under a new attempt | rejected at ingestion, no chain mutation | `malformed_review_response` | Fix and resubmit |
| Stale review | Candidate revision moved on | None | Re-issue `questions:review-prompt` against current revision | `stale_review_revision` | `stale_review_revision` | Re-run review workflow |
| Self-review | Reviewer identity == generator identity | Chain append refused | N/A | `self_review_rejected` | `self_review_rejected` | Obtain a genuinely independent reviewer |
| Low-confidence review | — | Chain append succeeds, non-advancing | Submit an additional/replacement review under a new `reviewId` | recorded, not production-grade | `review_confidence_below_threshold` | Seek a higher-confidence review or revise the candidate |
| Ambiguous review | — | Same as above | Same | recorded, not production-grade | `review_ambiguity_unresolved` | Resolve ambiguity (revision or clarifying review) |
| Revision ingestion failure | New candidate not created | None | Fix input, re-ingest | ingestion refusal (§6 outcomes) | per §6 | Fix and resubmit |
| Revision limit exhaustion | Parent at revision 2 | None (prompt generation itself refused) | N/A — no further revision path | `revision_limit_exhausted` | `revision_limit_exhausted` | Author a materially new candidate from scratch (new lineage) |
| Pipeline interruption | Some candidates mid-batch unprocessed | None beyond what individual gate transitions already committed | Re-run the same `pipelineRunId` — resumes (§11) | partial `PipelineRunReport`, resumable | `pipeline_run_interrupted` | None — rerun the command |
| Stage transition failure | Candidate remains at `difficulty_review_passed` | None (transaction aborted before `move`) | Retry `questions:stage` | staging refused, reported | per §12 failure reasons | Address the reported missing/stale evidence |
| Publication validation failure | No files touched | None | Fix underlying staged-candidate issue, retry | publication refused pre-snapshot | per §13 | Address reported check failure |
| Publication snapshot failure | Lock held, no writes yet | None | Retry after resolving the read failure (e.g. permissions) | publication aborted, lock released | `publication_snapshot_failed` | Filesystem investigation |
| Temporary write failure | Snapshot captured, temp write incomplete | Rollback (nothing real touched yet) | Retry whole publication | rolled back | `publication_temp_write_failed` | Investigate disk space/permissions |
| Final replacement failure | Some real files replaced, some not | Rollback restores all | Retry whole publication | rolled back | `publication_atomic_replace_failed` | Investigate; check for external file locks (e.g. AV scanner on Windows) |
| Post-publication validation failure | All files replaced, contents invalid | Rollback restores all | Retry whole publication (investigate publisher bug first) | rolled back | `publication_post_write_validation_failed` | Treat as a Mission 3 bug — do not just retry blindly |
| Rollback failure | Files in an inconsistent state | Best-effort continues restoring remaining files | Manual | `rollback_incomplete` — the single most severe possible outcome | `rollback_incomplete` | Immediate manual intervention; compare `.publication-tmp` snapshot against live files by hand |
| Lock timeout | No lock acquired | None | Retry after backoff | `lock_timeout` | `lock_timeout` | If persistent, check for an abandoned lock via reconcile |
| Stale / abandoned lock | Lock file present, owner process gone | None (never auto-stolen) | N/A | reported by reconcile | `abandoned_lock_detected` | Explicit `--release-abandoned-*-lock` command |
| Manifest mismatch | Manifest hash disagrees with live files | None (read-only detection) | N/A | reported | `manifest_mismatch` | Investigate — possible out-of-band file edit |
| Contract mismatch | `question-bank-contract.generated.json` disagrees with loader output | None | N/A | reported | `contract_mismatch` | Republish or manually regenerate contract |
| Controlled-file drift | A controlled file changed outside a publication transaction | None | N/A | reported | `controlled_file_drift` | Investigate — never auto-overwritten by reconcile |

---

## 23. Issue-code catalogue

Grouped by domain. Every code: stable identifier (snake_case, no candidate-derived values embedded — per the explicit constraint below), meaning, severity, lifecycle outcome, max message length (`FACTORY_LIMITS`'s message bound, currently 300 via `correctness-limits.ts`, reused), test obligation (at minimum one positive-boundary and one over-boundary test, per §21/§24).

- **Generation:** `unsupported_blueprint`, `generation_resource_limit_exceeded`, `generation_timeout`, `malformed_generator_output`.
- **Ingestion:** `malformed_candidate_json`, `duplicate_candidate` (existing, reused), `interrupted_ingestion_transaction`, `inbox_cleanup_failed`, `inbox_file_limit_exceeded`, `unresolvable_declared_generator_identity`, `prompt_pack_reference_mismatch` (declared `batchId`/`promptVersion` don't match a real issued pack).
- **Identity:** `unsupported_reviewer_identity`, `unsupported_generator_identity`, `missing_identity_fields`.
- **Review:** `malformed_review_response`, `unknown_candidate`, `stale_review_revision`, `content_hash_mismatch`, `blueprint_hash_mismatch`, `insufficient_evidence`, `self_review_rejected`, `review_confidence_below_threshold`, `review_ambiguity_unresolved`, `review_id_conflict`, `review_pack_reference_mismatch`.
- **Revision:** `invalid_revision_source_state`, `revision_limit_exhausted` (existing, reused), `revision_no_material_change`.
- **Pipeline:** `pipeline_run_interrupted`, `pipeline_batch_lock_held`, `pipeline_candidate_limit_exceeded`, `run_incomplete`.
- **Staging:** `staging_evidence_missing`, `staging_evidence_stale`, `staging_evidence_copied`, `staging_semantic_review_insufficient`.
- **Publication:** `publication_refused_fixture_generator`, `publication_production_id_collision`, `publication_intra_batch_collision`, `publication_id_reused_with_different_content`, `publication_snapshot_failed`, `publication_temp_write_failed`, `publication_atomic_replace_failed`, `publication_post_write_validation_failed`, `publication_lock_held`.
- **Rollback:** `rollback_incomplete`, `rollback_snapshot_missing`.
- **Reconciliation:** `abandoned_lock_detected`, `manifest_mismatch`, `contract_mismatch`, `controlled_file_drift`, `state_file_mismatch`, `duplicate_candidate_location`.
- **CLI:** `invalid_arguments`, `batch_too_large`, `path_traversal_rejected`.
- **Resource limits:** one `*_limit_exceeded` per §21 row (e.g. `prompt_pack_size_limit_exceeded`, `review_response_size_limit_exceeded`, `recommended_corrections_limit_exceeded`, `publication_temp_file_count_exceeded`).

**Do not encode candidate-derived values into issue-code names.** Every code above is a fixed enum member; any candidate-specific detail (which field, which value, which candidate id) lives in the associated `message`/`path`, never in the code string itself — this is the same discipline `STRUCTURAL_VALIDATION_ISSUE_CODES`/`CORRECTNESS_VERIFICATION_ISSUE_CODES` already follow (closed catalogues, no string interpolation into the code itself).

---

## 24. Test-first acceptance matrix

Minimum required cases (test names, not full specs — each becomes a `describe`/`it` in the corresponding Mission 3 test suite, mirroring the existing `src/tests/unit/question-factory/` layout):

**Generation and ingestion:** deterministic generation reproducibility (three identical runs, byte-identical output); prompt-pack determinism; ingest happy path; malformed JSON quarantine; missing field reaches structural rejection (not swallowed at ingestion); provenance completeness (every required `CandidateProvenance` field populated, none defaulted silently); duplicate ingest replay; inbox transaction recovery (interrupted `.processing` marker resolves correctly); full ingest-to-staging fixture flow (one deterministic-fixture candidate walked all the way to `staged` in a single test, proving the whole chain wires together).

**Reviewer independence:** Qwen-generated → Claude-reviewed (pass); Claude-generated → Qwen-reviewed (pass); Claude-generated → ChatGPT-reviewed (pass); same normalised identity rejected; aliases resolving to same identity rejected; unsupported reviewer identity; generator self-approval ignored (a deterministic reviewer's attempted `"passed"` on `semantic_objective` content never advances the candidate, §7).

**Review integrity:** stale review; wrong candidate ID; wrong revision; wrong content hash; wrong blueprint hash; wrong review prompt version; wrong review prompt hash; missing evidence; low confidence; unresolved ambiguity; malformed response; copied review (identical `reviewResultFingerprint` across two distinct candidates/reviews); idempotent replay; changed review under reused ID.

**Revision:** revision prompt generation; revision re-ingestion; parent link; new content hash; full pipeline rerun; revision one (accepted); revision two (accepted); limit exhaustion (revision three refused at both enforcement points, §10).

**Pipeline:** deterministic stage order; three identical reruns; no duplicate candidates; terminal-or-staged completion (the §11 invariant, directly tested); partial failure isolation (one candidate's induced error does not affect siblings in the same run); stale evidence rejection; no gate bypass (an attempt to hand-construct a transition skipping a required gate is refused by `applyTransition`'s table, tested at the orchestrator level too).

**Publication:** complete valid publish; fixture generator refusal; manual-external valid publish; missing evidence refusal; duplicate production ID; seed-bank collision (against the hand-authored `grade-{3,5}` modules, not just other generated batches); stale manifest; changed manifest; reused publication ID; changed content under reused batch ID; interrupted publication; successful replay; full rollback; byte-identical restoration; unchanged production count; unchanged contract after rollback; no temporary files (post-rollback and post-success); clean controlled-file Git state (a `git status --short` check in the test harness, confirming no publication side effect ever touches a file outside the registry).

**CLI:** every command exit code (§16's category list, one test per category per command at minimum); JSON output; human output; invalid arguments; missing files; dry-run; reconciliation; Windows paths (backslash-containing repo-relative paths resolve identically to forward-slash); paths with spaces; non-interactive execution (no test ever needs to supply stdin).

---

## 25. Audit contract

Mission 3 approval (per sub-mission, §26) requires:

- No P0 findings.
- No P1 findings.
- No material P2 findings affecting: publication integrity; rollback; evidence binding; reviewer independence; lifecycle integrity; replay; deterministic operation; production-bank safety; mandatory validation confidence.

P3 and non-material P2 findings enter the risk register (§27) rather than automatically reopening implementation. **Maximum one bounded remediation cycle per Mission 3 sub-mission**, unless a new P0/P1 is demonstrated during that remediation cycle itself (in which case a second cycle is warranted — the bound is "one cycle for the findings from the *first* audit," not an absolute cap regardless of what remediation uncovers).

**Sub-mission-specific audit emphasis** (in addition to the universal list above):

- **3A (generation/ingestion):** trust-boundary discipline (no donor/source label ever confers trust); deterministic-fixture reproducibility; inbox transaction safety.
- **3B (semantic/external review):** reviewer-independence correctness (the alias-table/triple-comparison logic, since it is already implemented and audited at the Mission 1 layer — 3B's audit focus is on *correct use* of it, not re-deriving it); evidence-binding staleness detection; the deterministic-vs-independent-reviewer authority boundary (§7's "may not independently approve").
- **3C+3D (revision, pipeline, staging):** the terminal-or-staged invariant; revision-limit enforcement at every layer; no gate-bypass path exists even for a maliciously-constructed candidate record.
- **3E+3F (publication, CLI, reconciliation):** the full ten-step transaction and rollback protocol, byte-for-byte; controlled-file registry enforcement; lock discipline; every CLI command's exit-code and non-interactive guarantees.

---

## 26. Recommended delivery strategy

### Option A — one large Mission 3 delivery

Rejected. Mission 3 is the first mission to (a) trust content from outside the repository's own deterministic generators for real, (b) run every remaining lifecycle gate for the first time in a production call site, and (c) write to the live production question bank. Bundling all of that into one audit means a single P0 finding in, say, the publication rollback protocol blocks review of the (much lower-risk, already largely reusing Mission-1-audited primitives) generation and ingestion work — and a reviewer auditing six increments at once is measurably more likely to miss a cross-cutting issue than five reviewers each auditing one bounded increment against an already-approved foundation. Nothing in the existing repository evidence supports treating Mission 3 as architecturally atomic — the six technical increments in §2 already have clean, one-directional dependencies (each needs only the ones before it), which is exactly the shape sequential sub-missions want.

### Option B — sequential Mission 3 sub-missions (recommended)

```text
Mission 3A — Generation and manual ingestion
Mission 3B — Semantic and external review
Mission 3C — Revision and pipeline runner
Mission 3D — Staging and publication transaction
Mission 3E — CLI completion and reconciliation
```

Mapping from §2's six content increments to these five audited sub-missions:

| Audited sub-mission | Contains content increment(s) |
|---|---|
| Mission 3A | 3A (Generation and manual ingestion) |
| Mission 3B | 3B (Semantic review and external-review ingestion) |
| Mission 3C | 3C (Revision workflow) + the pipeline-runner half of 3D (batch execution/replay, excluding staging-eligibility's dependency on originality/difficulty gates, which land here too since the runner needs them to reach `staged`) |
| Mission 3D | the staging half of 3D (staging contract, §12) + 3E (Publication and rollback) |
| Mission 3E | 3F (CLI and reconciliation) |

For each sub-mission:

**Mission 3A**
- Branch policy: new branch off `integration/governed-question-factory` at the commit this contract lands on (or directly on the integration branch if the team's existing convention — Mission 2A/2B/2C all landed directly on `integration/governed-question-factory` per `git log`, so 3A should follow suit unless the team decides otherwise).
- Starting SHA: the commit that lands this contract document.
- Exact implementation scope: §2 "3A" content list.
- Audit scope: §25 3A emphasis + universal list.
- Mandatory tests: §24 "Generation and ingestion".
- Exit criteria: §2 3A completion gate.
- Dependency on prior sub-mission approval: this contract document itself (no prior Mission 3 code to depend on).

**Mission 3B**
- Branch/starting SHA: continues from 3A's approved commit.
- Scope: §2 "3B".
- Audit scope: §25 3B emphasis + universal.
- Tests: §24 "Reviewer independence" + "Review integrity".
- Exit criteria: §2 3B completion gate.
- Depends on: Mission 3A approved.

**Mission 3C**
- Branch/starting SHA: continues from 3B's approved commit.
- Scope: §2 "3C" + pipeline-runner portion of "3D" (batch execution, replay, terminal-state invariant) + new originality/difficulty gate modules (PD-4).
- Audit scope: §25 3C+3D emphasis + universal.
- Tests: §24 "Revision" + "Pipeline".
- Exit criteria: a batch reaches `staged` end-to-end via the pipeline runner, reproducibly.
- Depends on: Mission 3B approved.

**Mission 3D**
- Branch/starting SHA: continues from 3C's approved commit.
- Scope: staging contract finalisation + §2 "3E" (Publication and rollback) in full.
- Audit scope: §25 3E+3F emphasis (publication/rollback half) + universal — **mandatory, no exceptions** (§2).
- Tests: §24 "Publication".
- Exit criteria: §2 3E completion gate (atomic publish + forced-failure rollback proof).
- Depends on: Mission 3C approved.

**Mission 3E**
- Branch/starting SHA: continues from 3D's approved commit.
- Scope: §2 "3F" (CLI and reconciliation) in full.
- Audit scope: §25 3E+3F emphasis (CLI/reconciliation half) + universal.
- Tests: §24 "CLI".
- Exit criteria: §2 3F completion gate.
- Depends on: Mission 3D approved.

No parallel execution is proposed at any point — each sub-mission's starting SHA is the previous sub-mission's approved commit, strictly sequential.

---

## 27. Risk register

| Risk | Likelihood | Impact | Mitigation | Blocking | Owner | Target sub-mission |
|---|---|---|---|---|---|---|
| External LLM output variability (inconsistent JSON shape across providers) | High | Medium | Strict-JSON-only prompt instruction (§5) + structural validation as the real backstop, never trust the prompt alone | No | 3A/3B implementer | 3A, 3B |
| Provider identity ambiguity (new model names not in the alias table) | High | Medium | `unsupported_*_identity` fails closed rather than guessing; alias table is a living, reviewed config file | No | 3B implementer | 3B |
| Reviewer self-approval | Low (structurally prevented) | Critical if it occurred | Existing, already-audited `identitiesAreIndependent`/`isProductionGradeIndependentReview` (§7, §20) | **Yes** — must be re-verified in 3B's audit | 3B implementer | 3B |
| Stale reviews (candidate changed after review) | Medium | High | `isReviewStillValid` re-check at every consumption point, not just at ingestion (§3, §12, §19) | Yes | 3B/3D implementer | 3B, 3D |
| Copied reviews (fingerprint reuse across candidates) | Low | High | Reconciliation detection (§18) + chain-verification (`verifyReviewChain`) | No (detective, not preventive — accept as a monitored risk) | 3B/3F implementer | 3B, 3E |
| Large prompt packs (unbounded pack growth from a large blueprint batch) | Medium | Low | §21 explicit byte bounds, `MAX_PROMPT_PACK_BYTES`/`MAX_REVIEW_PACK_BYTES` | No | 3A/3B implementer | 3A, 3B |
| Malformed external JSON (human paste errors) | High | Low | Quarantine, never crash; clear error messages (§6, §9, §22) | No | 3A/3B implementer | 3A, 3B |
| Revision loops (repeated failed revisions) | Medium | Low | Hard limit of 2, enforced twice (§10) | No | 3C implementer | 3C |
| Filesystem publication rollback failure | Low | **Critical** (production bank corruption) | Ten-step transaction protocol, snapshot-before-write, post-write validation (§14) | **Yes** | 3D implementer | 3D |
| Controlled-file drift (out-of-band edits to generated files) | Low | High | Reconciliation detection, never silent auto-repair (`controlled_file_drift`, §18/§22) | No (detective) | 3E implementer | 3D, 3E |
| Publication concurrency (two publishes racing) | Low | Critical if unmitigated | Global publication lock, ownership-token discipline (§15) | Yes | 3D implementer | 3D |
| Crashed locks (candidate or publication) | Medium | Medium | Never auto-stolen; explicit, named manual-release commands only (§15, §18) | No | 3D/3E implementer | 3D, 3E |
| Windows filesystem behaviour (rename semantics, path separators, locking) | Low (largely already proven by Mission 2B/2C's existing Windows-safe patterns) | High if it occurred | Reuse of already-verified `O_CREAT|O_EXCL` locking and CRLF/path normalisation (§14, §16) rather than new filesystem code | No | 3D implementer | 3D |
| Static loader safety (accidental dynamic code execution over candidate content) | Low | Critical | Explicit "no dynamic code generation" contract clause (§13), audited directly | Yes | 3D implementer | 3D |
| Generated-code injection (malicious content in a candidate stem/option surfacing as executable) | Low (structural validation + content-safety checks already screen this at gate 1) | Critical if it occurred | Reuse of Mission 2B's `content-safety-checks.ts`, never re-trust raw candidate content in the loader (§13) | Yes | 3D implementer | 3D |
| Production-ID collision | Medium | High | Explicit collision check against both generated and seed banks (§13), refusal not overwrite | Yes | 3D implementer | 3D |
| Incomplete rollback | Low | **Critical** | Post-write validation + `rollback_incomplete` as the most severe defined outcome, immediate manual-intervention path (§14, §22) | Yes | 3D implementer | 3D |
| E2E reliability (a published batch breaking `npm run test:e2e` against the live exam UI) | Medium | Medium | Publication validation step includes schema + scoring re-checks before any file is written (§13 step 2/5); full `npm run build && npm test && npm run test:e2e` required in the 3D exit criteria | No | 3D implementer | 3D |

---

## 28. Required outputs (index)

1. Mission 3 implementation contract — this document.
2. Recommended sub-mission decomposition — §2, §26.
3. Lifecycle transition table — §3.
4. Generator contract — §4.
5. Prompt and ingestion contracts — §5, §6.
6. Reviewer and external-review contracts — §7, §8, §9.
7. Revision contract — §10.
8. Pipeline-runner contract — §11.
9. Staging contract — §12.
10. Publication and rollback protocol — §13, §14, §15.
11. CLI contract — §16, §17, §18.
12. Evidence and fingerprint schemas — §19.
13. Identity and reviewer-independence matrix — §20.
14. Failure/recovery matrix — §22.
15. Issue-code catalogue — §23.
16. Test-first acceptance matrix — §24.
17. Codex audit checklist — §25.
18. Risk register — §27.
19. Explicit prerequisite decisions requiring approval — below.
20. Recommendation — below.

---

## Prerequisite decisions requiring approval

These are gaps between the existing implemented codebase and this contract's assumptions, identified during repository review (per the mission brief's instruction to "identify any required prerequisite extension, but do not implement it"). None are implemented by this document.

- **PD-1 — Wire `correctness/` into `index.ts` and a real call site.** Currently implemented, fully tested, but not re-exported from the domain barrel and not called anywhere outside its own tests (`design.md` §3.7, §6). Mission 3 (3A/3D) must do this; needs sign-off that the wiring itself (barrel export + pipeline-runner call site) is in scope for 3A rather than a separate micro-mission.
- **PD-2 — Where does `SemanticClassification` come from?** The type and gating logic exist (`workflow/states.ts`, `workflow/policies.ts`) but nothing in the codebase currently assigns a `SemanticClassification` to any blueprint or candidate. Recommended: add an explicit, required `semanticClassification` field to the Mission 1 blueprint schema, assigned deterministically at blueprint-authoring time from a fixed question-type-to-classification table (e.g. closed-form arithmetic → `deterministically_computable`; `short_answer`/`essay` → `manual_review_writing`; everything else with a single correct-but-context-dependent answer → `semantic_objective`), carried immutably into `CandidateProvenance` at generation/ingestion time. Needs approval before 3A, since ingestion (3A) is the first place a value must be stamped.
- **PD-3 — New `ingestion-external/` module, or extend `ingestion/`?** Mission 2A's `ingestion/` is scoped to legacy-donor shapes (`legacy-shapes.ts`, CSV parsing) with a hard-coded `manual_external` class and a distinct trust-boundary narrative. Recommended: a new sibling module reusing shared pieces (`content-hash.ts`, `candidateProvenanceSchema`) rather than overloading `ingestion/`'s donor-specific parsing logic — keeps Mission 2A's already-approved code untouched, satisfying the "do not modify Mission 2C implementation" constraint's spirit for 2A/2B too.
- **PD-4 — Are originality and difficulty gates literal Mission 3 deliverables?** The top-level scope summary doesn't name them, but the required lifecycle table, staging matrix, and CLI catalogue (`questions:dedupe`, `questions:difficulty`) all assume they exist and produce real evidence. `FACTORY_THRESHOLDS` already defines the relevant numbers (`NEAR_DUPLICATE_SIMILARITY`, `STRUCTURALLY_SIMILAR_SIMILARITY`, `DIFFICULTY_MATCH_TOLERANCE`, `MIN_DIFFICULTY_ESTIMATE_CONFIDENCE`) but no module implements the checks. Recommended: yes, in scope, as deterministic policy gates built on the existing thresholds (originality via text-similarity against the current production+staged corpus; difficulty via declared-vs-estimated comparison) — minimal but real, not a stub that always passes. Needs explicit approval since it's the single largest undocumented scope item.
- **PD-5 — Stable production-ID minting and collision-detection formula.** Not specified anywhere in the existing codebase (production `Question.id` values are currently manually assigned in the hand-authored `grade-{3,5}` modules). Recommended formula and exact collision universe (generated-only vs. generated+seed) need explicit sign-off before 3D.
- **PD-6 — How much of `question-bank-summary.ts` becomes machine-generated?** It exists today as hand-maintained prose (81 lines) matching `docs/QUESTION_BANK_SUMMARY.md`'s narrative voice. Fully regenerating it risks losing that narrative quality; partially regenerating it (data tables only, prose preserved) risks drift between the generated numbers and the surrounding hand-written claims. Needs a decision before 3D.
- **PD-7 — Does `candidateProvenanceSchema` need a `promptHash` field?** Currently only `promptVersion` exists. The review-evidence-binding pattern already includes a hash-level check (`reviewPromptHash`); the generation side lacks the equivalent. Recommended: add it, but this is a schema change to an existing Mission-1-owned type, so it needs explicit approval before 3A rather than being silently added.
- **PD-8 — Exact answer/rubric inclusion policy per semantic classification in the review pack (§8).** Proposed default given above; needs sign-off since getting it wrong either biases reviewers (over-inclusion) or starves them of what they need to judge ambiguity (under-inclusion).
- **PD-9 — Is any auto-loop (generate → review → revise) in scope, or is a human required in the loop at the revision boundary?** This document assumes a human is always required between `needs_revision` and the next `questions:revision-prompt`/`questions:ingest` cycle (no autonomous retry loop). Needs explicit confirmation, since an autonomous loop would materially change the pipeline-runner's contract (§11) and the risk profile of "revision loops" (§27).
- **PD-10 — Exact `question-bank-contract.generated.json` shape.** Only its path is currently reserved (`config/publication-file-registry.ts`); no consumer or shape exists. `scripts/validate-question-bank.mts` currently validates against whatever it validates against today (not reviewed field-by-field in this pass) — 3D needs to confirm the new contract file is additive to that script's checks, not a breaking replacement.

## Recommendation

```text
MISSION 3 DESIGN REQUIRES DECISIONS
```

The lifecycle, evidence, identity, and workflow contracts in this document rest directly on already-implemented, already-audited Mission 1/2A/2B/2C primitives and require no new decisions to proceed. However, ten concrete prerequisite decisions (PD-1 through PD-10 above) are open, and three of them — PD-2 (semantic classification assignment), PD-4 (originality/difficulty gate scope), and PD-5 (production-ID/collision formula) — block Mission 3A/3D implementation directly rather than being deferrable refinements. This document recommends resolving PD-1 through PD-10 explicitly (a short approval pass, not a redesign) before opening the Mission 3A branch.
