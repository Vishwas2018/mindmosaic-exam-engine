# Governed Structural Validation Gate — Mission 2B

Status: **implemented**. This mission builds the first production gate after ingestion: a pure,
deterministic structural-validation function and a repository orchestration function that moves a
`generated` candidate to `structural_validation_passed` or `rejected` (`rejected/structural`). It
does not import the 302 harvested questions, does not modify the 100 production questions, and does
not implement correctness verification, originality/duplicate detection, difficulty estimation,
semantic AI review, staging, or publication — all of that remains explicitly out of scope for later
missions.

Code: `src/features/question-factory/validation/`. Tests:
`src/tests/unit/question-factory/structural-validation.test.ts` (pure validator, 69 tests),
`src/tests/unit/question-factory/structural-validation-orchestration.test.ts` (repository
orchestration, 8 tests), fixtures in `src/tests/unit/question-factory/structural-validation-fixtures.ts`.

## Architecture

```text
pure structural validator (validateCandidateStructure)
  → StructuralValidationResult { status: "passed" | "failed", issues, evidence }
  → lifecycle orchestration (orchestrateStructuralValidation)
  → transactional repository move (FactoryRepository.move)
```

`validateCandidateStructure` is deterministic and side-effect free: no I/O, no wall-clock reads
(`context.validatedAt` is caller-supplied), no randomness, no repository access. It takes a
generator-agnostic `QuestionFactoryCandidate` (`{ candidateId, state, question: unknown,
provenance: unknown, ingestion? }`) and a `StructuralValidationContext`, and returns structured
evidence either way — passing or failing.

`orchestrateStructuralValidation` is the only impure piece: it reads a `generated` candidate from
`FactoryRepository`, re-establishes trust in the raw JSON, calls the pure validator, stores the
evidence as a separate report record, and moves the candidate through `FactoryRepository.move()`.

### Files

| File | Responsibility |
|---|---|
| `types.ts` | `QuestionFactoryCandidate`, `StructuralValidationContext`/`Result`/`Issue`/`Evidence` contracts, closed issue-code and check-group enums |
| `schema-issue-classifier.ts` | Maps reused-schema Zod issue paths to the closed structural-validation issue-code catalogue |
| `candidate-checks.ts` | Candidate/provenance identity, lifecycle state, donor-trust-field, source-path, version, content-hash-binding, and staleness checks |
| `taxonomy-checks.ts` | Skill resolution and grade/subject/strand/exam-style cross-checks against `skillTaxonomyRegistry` |
| `registry-checks.ts` | Question/visual type membership against the renderer registries |
| `content-safety-checks.ts` | Unsafe-markup scanning (reused from ingestion) and deterministic alt-text answer-leakage detection |
| `production-schema-check.ts` | Maps a candidate into the authoritative production `questionSchema` shape and reuses its own `superRefine` cross-field checks |
| `scoring-compatibility-check.ts` | Builds a canonical response from the answer key and exercises the real `scoreQuestion` scoring contract |
| `evidence.ts` | Builds `StructuralValidationEvidence` plus its deterministic hash |
| `validate-candidate-structure.ts` | The pure public entry point — composes every check above |
| `orchestrate-structural-validation.ts` | Repository orchestration: read, re-validate freshness, run the pure validator, store evidence, transactionally move |
| `index.ts` | Narrow public export surface only |

## Public API

```typescript
validateCandidateStructure(
  candidate: QuestionFactoryCandidate,
  context: StructuralValidationContext,
): StructuralValidationResult

orchestrateStructuralValidation(
  candidateId: string,
  repository: FactoryRepository,
  options: OrchestrateStructuralValidationOptions,
): Promise<StructuralValidationOrchestrationOutcome>
```

`validation/index.ts` exports only these two functions, `STRUCTURAL_VALIDATOR_VERSION`, the closed
`STRUCTURAL_VALIDATION_ISSUE_CODES`/`STRUCTURAL_VALIDATION_CHECK_GROUPS` enums, and their supporting
types. Every individual check module (`candidate-checks.ts`, `taxonomy-checks.ts`,
`registry-checks.ts`, `content-safety-checks.ts`, `production-schema-check.ts`,
`scoring-compatibility-check.ts`, `schema-issue-classifier.ts`, `evidence.ts`) is internal — not
re-exported, importable by tests directly by file path, mirroring the convention Mission 2A's
`ingestion/index.ts` already established for `candidate-question.ts`.

## Authoritative contracts reused

- **`questionSchema`** (`@/schemas/question.schema`) — the production question contract. The
  candidate is mapped into this schema's exact shape (`production-schema-check.ts`) and its own
  `superRefine` is exercised unmodified: unique option/visual ids, answer-key/type compatibility,
  interaction/answer-key consistency (fill-blank, dropdown, matching, ordering, drag-drop, label
  diagram), hotspot region references, and the reading-comprehension stimulus requirement. This is
  the single source of truth for every one of those rules — none of them is reimplemented by hand.
- **`visualSchema`** (`@/schemas/visual.schema`) — reused transitively through `questionSchema` and
  directly through `candidateQuestionSchema`. Enforces chart/table/number-line/geometry/coordinate-
  grid/hotspot structural bounds and rejects raw SVG (visuals are a discriminated union of
  structured element data; there is no raw-SVG-string field to populate).
- **`candidateQuestionSchema`** (Mission 2A, `ingestion/candidate-question.ts`) — reused as a
  defence-in-depth re-check on the raw, untrusted `question` blob a repository read returns. Per
  the mission brief, this schema remains adapter-preflight only; it is never treated as the
  structural authority — that role belongs to `questionSchema` above.
- **`questionRendererRegistry`** / **`visualRendererRegistry`** (`@/features/exam-engine/*-renderers`)
  — the authoritative source `config/allowed-types.ts` already draws `ALLOWED_QUESTION_TYPES`/
  `ALLOWED_VISUAL_TYPES` from. Checked directly (`registry-checks.ts`), not merely via the schema's
  own enum, so a future drift between the schema and the renderers is caught structurally.
- **`skillTaxonomyRegistry`** (`taxonomy/registry.ts`) — resolves `metadata.skill` through id-or-
  declared-alias only, never fuzzy/semantic matching, exactly as the registry's own contract
  guarantees.
- **`scoreQuestion`** / **`scoreResponse`** (`@/features/exam-engine/scoring`) — the real scoring
  contract. A canonical response is built directly from the answer key and scored for real.
- **`candidateProvenanceSchema`**, **`hashJson`**, **`FACTORY_VERSIONS`** (`../provenance`,
  `../config`) — reused unmodified for provenance re-validation, content-hash recomputation, and
  schema/taxonomy version comparison.
- **`FactoryRepository`**, **`compartmentForState`** (`../storage`) — reused unmodified for every
  repository read/move; no direct filesystem access anywhere in this module.
- **`applyTransition`**, **`decideGateFailureOutcome`** (`../workflow`) — reused unmodified for the
  lifecycle transition and gate-failure-outcome decision.

No competing production question schema was created.

## Structural checks implemented

### Candidate and provenance
Valid candidate id (shape via `factoryIdentifierSchema`, binding via `checkCandidateIdBinding`),
positive/valid revision, batch id and pipeline run id present (both required, non-empty, in
`candidateProvenanceSchema`), blueprint id present (required in the same schema), content hash
matches the canonical current candidate content (`checkContentHashBinding` — recomputes `hashJson`
over the *parsed* candidate question, the same representation ingestion itself hashes), provenance
candidate binding is current (same check), schema/taxonomy version supported (`checkVersions`),
generator identity/class valid (`generatorAdapterSchema`, reused), source path sanitised where
present (`checkSourcePath`, reusing ingestion's own `isAbsoluteOrUnsafeSourcePath`), lifecycle state
is exactly `generated` (`checkLifecycleState`), no donor trust/status fields present
(`checkDonorTrustFields` — inspects the *raw*, pre-Zod-strip object, since
`candidateQuestionSchema` silently strips unrecognised keys rather than rejecting them).

### Taxonomy
Skill id resolves through `skillTaxonomyRegistry.resolve` (id or declared alias only — proven by
the "resolves a declared taxonomy alias" passing test, which deliberately uses an alias string, not
the canonical id); declared grade/subject/strand/exam style checked against the resolved entry; no
fuzzy semantic matching (the registry's own contract); unknown or ambiguous references fail — see
"Ambiguous taxonomy reference", below.

### Question type and interaction
Question type exists in the renderer registry; visual type exists in the visual registry; every
answer-key-shape/uniqueness/reference-resolution rule listed in "Authoritative contracts reused"
above, all delegated to `questionSchema`'s reused `superRefine`.

### Prompt, stimulus and explanation
Prompt non-empty and within limits; required stimulus present (reading-comprehension); unsupported/
oversized stimulus rejected; explanation present where the production schema requires it (always —
`explanation` is optional in the Mission 2A candidate schema but required in production, so a
candidate missing one now fails structurally, which is new, intentional strictness this gate adds);
no script/event-handler/iframe/`javascript:`/raw-SVG markup in `prompt`/`stimulus`/`explanation`
(`checkUnsafeMarkup`, reusing ingestion's own deterministic scanner); no answer leakage in visual alt
text (`checkAnswerLeakageInAltText`, deterministic literal-substring check, reusing ingestion's own
`altTextLeaksAnswer`). Australian English is documented policy, not machine-verified — no check
claims to verify it.

### Visuals
Visual type registry membership; every visual-schema bound (chart/table/number-line/geometry/
coordinate-grid dimension and finiteness checks, alt-text presence) via the reused `visualSchema`;
no raw SVG (schema-level guarantee, not a runtime scan); hotspot region references resolve *where
the question type reaches this check* — see "Known limitations".

### Marks and timing
Marks positive and within `[1, 20]`; expected time positive and within `[1, 3600]`s; `NaN`/infinity
rejected (`z.number()` rejects `NaN`, `.int()` rejects non-finite values including `Infinity`); a
candidate with no expected time at all is rejected, since the production schema requires it even
though Mission 2A's candidate schema leaves it optional.

### Scoring compatibility
`checkScoringCompatibility` builds the canonical correct response directly from the answer key (in
the exact shape each real scorer consumes) and calls the real `scoreQuestion`, asserting only that
the shape round-trips to `status: "correct"`. It never claims the declared answer is mathematically
or semantically correct — see "Known limitations" for why this check's failure branch is, by
construction, difficult to reach independently of the reused schema's own guarantees.

## Issue-code catalogue

`STRUCTURAL_VALIDATION_ISSUE_CODES` (`types.ts`) — 40 closed codes, grouped:

**Candidate/provenance:** `invalid_candidate_id`, `invalid_revision`, `missing_batch_id`,
`missing_pipeline_run_id`, `missing_blueprint_id`, `invalid_content_hash`, `content_hash_mismatch`,
`stale_content_hash`, `stale_revision`, `stale_blueprint_binding`, `unsupported_schema_version`,
`unsupported_taxonomy_version`, `invalid_generator_identity`, `invalid_generator_class`,
`unsanitised_source_path`, `invalid_lifecycle_state`, `donor_trust_field_present`,
`malformed_candidate_record`.

**Taxonomy:** `unknown_taxonomy_skill`, `ambiguous_taxonomy_reference`, `taxonomy_grade_mismatch`,
`taxonomy_subject_mismatch`, `taxonomy_strand_mismatch`, `taxonomy_exam_style_unsupported`.

**Registry membership:** `question_type_not_in_renderer_registry`,
`visual_type_not_in_visual_registry`.

**Production-schema-shaped (classified from reused Zod issues):** `invalid_options`,
`invalid_visuals`, `invalid_answer_key`, `invalid_interaction`, `missing_required_stimulus`,
`invalid_prompt`, `invalid_explanation`, `invalid_marks`, `invalid_expected_time`,
`unsupported_question_type`, `invalid_year_level`, `invalid_exam_style`,
`structural_schema_violation` (fallback).

**Content safety:** `unsafe_markup_detected`, `answer_leakage_in_alt_text`.

**Scoring:** `scoring_representation_failed`.

Each `StructuralValidationIssue` is `{ code, path, message, severity: "error" }`. `severity` is
always `"error"` — structural validation is a set of deterministic literal checks with no
"warning"/"uncertain" outcome (see "Lifecycle transitions" for how this drives the gate's
rejection policy).

### Content-hash mismatch vs. staleness — a deliberate distinction

`content_hash_mismatch` means the stored record is internally inconsistent (the question content no
longer hashes to its own recorded `provenance.contentHash` — the record was edited without
recomputing provenance). `stale_content_hash`/`stale_revision`/`stale_blueprint_binding` mean the
record is internally consistent but no longer matches what the *caller* expected from an earlier
read (`StructuralValidationContext.expectedContentHash`/`expectedRevision`/`expectedBlueprintId`).
This mirrors the evidence-binding pattern already used for review records
(`provenance/evidence.ts`'s `isReviewStillValid`).

### Ambiguous taxonomy reference — a deliberate interpretation

A candidate with **no declared skill at all** is rejected as `ambiguous_taxonomy_reference`: without
a skill, there is no single taxonomy entry to check grade/subject/strand/exam-style against, and
this validator never guesses which one was intended from the other fields. A candidate with a
declared-but-unresolvable skill (a genuinely unknown id, or a prose label that isn't a declared
alias) is `unknown_taxonomy_skill` instead — both are deterministic, testable, and never involve
fuzzy matching.

## Evidence model

```typescript
interface StructuralValidationEvidence {
  candidateId: string;
  candidateRevision: number;
  candidateContentHash: string;
  blueprintHash?: string; // only when a real blueprint record was read and hashed — "where applicable"
  validatorVersion: string;
  schemaVersion: string;
  taxonomyVersion: string;
  validatedAt: string;
  checksPerformed: readonly StructuralValidationCheckGroup[]; // fixed, data-independent list
  issueSummary: { errorCount: number; codes: readonly StructuralValidationIssueCode[] };
  evidenceHash: string; // hashJson over every field above
}
```

`blueprintHash` is never computed inside the pure validator (hashing the real blueprint record
requires a repository read, which only `orchestrateStructuralValidation` may perform); it is
supplied via context, and is simply absent when no real blueprint record exists — true for every
legacy-ingested candidate today, since Mission 2A gives those the fixed placeholder blueprint id
`legacy-ingestion-unblueprinted` with no corresponding blueprint record. No secrets, absolute local
paths, or donor trust claims appear anywhere in evidence. `evidenceHash` is deterministic
(`hashJson`, stable-key-order, LF-normalised) — proven by the "deterministic evidence hash" and
"hashes identically to a second independently-built candidate" tests.

## Lifecycle and repository behaviour

`orchestrateStructuralValidation`:

1. Reads the candidate from `generated`. If absent, checks for an existing evidence report (a prior
   run may have already moved it) and returns a replay outcome, or `not_found` if neither exists.
2. Re-establishes trust in the raw record (state check, then the full pure validator, which itself
   re-parses `question`/`provenance` against their schemas and recomputes the content-hash binding).
3. Runs `validateCandidateStructure`.
4. On pass, calls `applyTransition("generated", "structural_validation_passed", ...)` then
   `FactoryRepository.move(candidateId, "generated", "review-queue")`.
5. On failure, calls `decideGateFailureOutcome({ severity: "hard_fail", ... })` — always `"rejected"`
   for this gate, since every structural check is a deterministic literal rule with no "cannot
   decide" outcome — then moves to `rejected/structural`.
6. Stores validation evidence as a **separate report record** (compartment `reports`, deterministic
   id `sv-<sha256(candidateId)>`), not mutated into the candidate record itself:
   `FactoryRepository.move()` relocates a candidate's existing bytes unchanged (it has no in-place
   update operation), so evidence storage and candidate relocation are two records by construction.
7. Rejects stale/changed candidate content via `checkStaleness` inside the pure validator, driven by
   `options.expected` — proven by the "rejects a stale candidate" orchestration test.
8. Idempotent and replay-safe: a second call against an already-moved candidate finds the stored
   report and returns the same outcome without re-validating, re-moving, or duplicating the report
   (`writeReportIfAbsent` compares `evidenceHash` before ever calling `repository.create`).
9. Never skips later gates: the candidate lands in `review-queue`, exactly where
   `correctness_check_passed` and every later "passed" state also live — later gates still have
   their own work to do; this function only ever proves `structural_validation_passed`.
10. Never moves directly to correctness, review (semantic), staging, or publication states — by
    construction, the only `to` values this function ever passes to `applyTransition` are
    `"structural_validation_passed"` and the output of `decideGateFailureOutcome` (which, with
    `severity` fixed at `"hard_fail"`, only ever resolves to `"rejected"`). The shared
    `TRANSITION_TABLE` (`workflow/transitions.ts`, already covered by
    `workflow-transitions.test.ts`) additionally rejects any attempt to jump straight from
    `generated` to `correctness_check_passed` or beyond, as a second, independent guarantee.

## Rejection handling

Structural rejections land in `rejected/structural` — one of five dedicated per-gate compartments
already defined in `storage/compartments.ts` (`rejected/correctness`, `rejected/semantic`,
`rejected/originality`, `rejected/difficulty` are reserved for later missions; none of that code was
added here). This is distinct from Mission 2A's ingestion rejections, which never reach a
`FactoryRepository` compartment at all (a rejected `IngestionResult` is returned to the caller
without ever being written) — an ingestion rejection means "never became a candidate"; a structural
rejection means "became a `generated` candidate, then failed this gate."

## Deterministic guarantees

- No wall-clock reads inside the pure validator (`validatedAt` is caller-supplied).
- No randomness.
- No I/O inside the pure validator (`validateCandidateStructure` never touches `FactoryRepository`).
- Every check group runs unconditionally where its prerequisites hold — this is not a fail-fast
  validator; a single call surfaces every issue in one pass (proven throughout the test suite by
  issue arrays regularly containing more than one code).
- `checksPerformed` is a fixed, data-independent list (`STRUCTURAL_VALIDATION_CHECK_GROUPS`) — never
  varies between a passing and a failing run.
- `evidenceHash` is a pure function of the evidence's own other fields.
- Taxonomy/markup/leakage checks are literal, pattern- or table-based only — no semantic/AI/fuzzy
  matching anywhere in this module.

## Known limitations

- **`metadata.topic` is defaulted from `metadata.strand`.** The production `questionSchema` requires
  a `topic` field Mission 2A's `candidateQuestionSchema` never carries at all. Rather than
  universally failing every candidate on a field its only current input source cannot populate,
  `production-schema-check.ts`'s synthetic mapping defaults `topic` to `strand` — a documented,
  deterministic mapping-shape default for structural-check purposes only, never a claim about the
  question's real topic. A future generator that supplies a genuine `topic` will simply flow it
  through unchanged (`candidate.metadata.topic ?? candidate.metadata.strand` is not used precisely
  because `candidateQuestionSchema.metadata` has no `topic` field to check for yet — if that schema
  gains one, this mapping should switch to using it directly and drop the fallback).
- **Hotspot/label-diagram/essay/drag-drop question types cannot currently reach this gate.**
  Mission 2A's `candidateQuestionSchema.type` enum (`HARVEST_SUPPORTED_QUESTION_TYPES`) covers only
  10 of the 14 production question types; `essay`, `label_diagram`, `hotspot`, and `drag_drop` are
  absent because the only existing generator (legacy ingestion) never produces them. This gate's
  hotspot-region and label-diagram cross-checks are fully reused from `questionSchema` and will
  apply automatically the moment a generator capable of emitting these types exists — nothing here
  needs to change. Until then, structural-validation tests for those specific cross-checks are not
  reachable end-to-end and are not claimed.
- **Scoring-compatibility's failure branch is largely a tautology by construction.** Because
  `checkAgainstProductionSchema` already guarantees every answer-key reference resolves before
  `checkScoringCompatibility` ever runs, the canonical response it builds is, by construction, the
  literal correct answer — `scoreQuestion` returning anything other than `"correct"` would indicate
  a bug in `scoreQuestion` itself, not a structural defect in the candidate. This check remains
  valuable defence-in-depth (it genuinely exercises the real scoring contract, not a hand-rolled
  approximation of it) but its "known limitations" is that manufacturing an independent failing test
  for it, without mocking `scoreQuestion`, is not meaningfully possible — see the "evidence"/
  "passing cases" tests for its exercised-and-passing coverage instead.
- **Answer-leakage detection only covers option/text/number/boolean/fill-blank/dropdown answer
  kinds.** Matching, ordering, hotspot, drag-drop, and manual answer keys resolve to ids, not
  natural-language literals, so there is no meaningful substring to screen alt text against — same
  documented limitation Mission 2A's own ingestion adapter already carries for the identical reason.
- **Strand comparison is a normalised-label string match**, not a taxonomy-graph lookup — sufficient
  given the taxonomy registry's own alias-normalisation contract, but a strand typo that happens to
  normalise identically to the correct strand (extremely unlikely given `normalizeTaxonomyLabel`'s
  narrow scope) would not be caught.
- **No CLI or batch runner exists yet.** This mission implements the gate function and its tests
  only; a script that walks every `generated` candidate and calls `orchestrateStructuralValidation`
  per id is out of scope here.

## Confirmation: no harvested content imported, no production content touched

- The 302 harvested questions were **not** imported — every fixture in
  `structural-validation-fixtures.ts` and both test files is a small, hand-written synthetic object.
- `src/content/questions/` was not read, written, or referenced by any file in this mission.
- `npm run validate:questions` confirms the production bank remains exactly 100 questions and all
  are valid; `npm run check:answers` confirms 0 correctness failures — both re-run after this
  mission's changes, unchanged in outcome from before it.
- Every candidate this mission's tests move through `structural_validation_passed`/`rejected` is
  written only under a temporary, per-test `FsFactoryRepository` root (`mkdtemp`), never under
  `content/question-factory/` in the real repository working tree.
- No candidate produced or moved by this gate is ever created, moved, or observed at any lifecycle
  state other than `generated`, `structural_validation_passed`, or `rejected` — nothing in this
  module constructs, or is capable of constructing, `correctness_check_passed`,
  `semantic_review_passed`, `originality_review_passed`, `difficulty_review_passed`, `staged`, or
  `published`.
