# Mission 3C — Revision Workflow and Pipeline Runner — Delivery Report

Status: **implemented, tested, P1 finding remediated, frozen for independent Codex re-audit.** Not self-approved.

Branch: `integration/governed-question-factory`. Implementation baseline (approved PB1 taxonomy/provenance remediation) SHA `5827dd3dda5c9feab47117a00eb1b1644aca227d`. Stable `main` remains `ba9575c572df050ab97244758ead22e5336dcd2c`, untouched by this delivery.

Written against `docs/reports/mission3-production/05-mission3c-revision-pipeline.md` (the approved planning document, referenced throughout as "the plan"). This report records what was actually built, exactly one necessary file-placement deviation from the plan's literal file table, and the reasoning behind the small number of implementation-level design choices the plan left to be resolved during implementation (§19 of the plan).

---

## 1. Scope delivered

- `revision/` module (`src/features/question-factory/revision/`) — `ingestRevision`, `mintRevisionCandidateId`, `reviseIngestionInputSchema`, and the `ReviseIngestionInput`/`ReviseOutcome` contracts.
- Additive schema field: `CandidateProvenance.supersededBy?: SupersessionClaim` (`provenance/candidate-provenance.ts`).
- `pipeline/` module (`src/features/question-factory/pipeline/`) — `runPipeline`, the three-stage `PIPELINE_STAGES` registry (structural → correctness → semantic, each with both a mutating `run()` and a non-mutating `preview()` for dry-run), and the standalone `acquireBatchLock`/`releaseBatchLock` primitive.
- `config/mission3c-issue-codes.ts` — `REVISION_ISSUE_CODES`, `PIPELINE_ISSUE_CODES`, unioned `MISSION_3C_ISSUE_CODES`.
- `config/limits.ts` additions: `MAX_REVISION_NOTES` (15), `PIPELINE_LOCK_STALE_AGE_MS` (30 minutes).
- CLIs: `questions:revise` (`scripts/questions-revise.mts`) and `questions:pipeline` (`scripts/questions-pipeline.mts`), both registered in `package.json`.
- 12 new/extended test files, 150 new tests, all passing (§10 below has the full breakdown).
- Zero changes to `manual-ingestion/`, `scripts/questions-ingest.mts`, `workflow/states.ts`, `workflow/transitions.ts`, `storage/compartments.ts`, `storage/state-compartment-mapping.ts`, `storage/factory-repository.ts`, `src/content/`, or the production question bank.

**Explicitly not built** (out of scope per the plan and the PD-4-corrected Mission 3C boundary): originality gate, difficulty gate, staging, publication, CLI-catalogue completion (`questions:reconcile`, `questions:dedupe`), automatic pipeline-candidate discovery — all unconditionally Mission 3D/3E's.

---

## 2. The one necessary deviation from the plan's literal file table

**The plan's §6/§16 proposed `workflow/pipeline-runner.ts`, `workflow/pipeline-stages.ts`, `workflow/pipeline-types.ts`, `workflow/pipeline-batch-lock.ts` — nested inside `workflow/`.** This is not buildable without introducing a genuine circular import: the pipeline runner must call `orchestrateStructuralValidation` (`validation/`), `orchestrateCorrectnessVerification` (`correctness/`), and `attemptSemanticReviewTransition` (`review/`) — and **all three of those modules already import the `workflow/` barrel** (`applyTransition`, `decideGateFailureOutcome`, `CandidateState`, etc.). Placing the runner inside `workflow/` and re-exporting it from `workflow/index.ts` would make `workflow/index.ts` transitively import back into itself through `correctness/orchestrate-correctness-verification.ts` (and the other two) — a real ES-module cycle, not a hypothetical one.

**Resolution:** the four files live in a new, sibling top-level module, `src/features/question-factory/pipeline/`, at the same level as `workflow/`, `correctness/`, `review/`, `validation/` — none of which need to import from `pipeline/`, so there is no cycle risk. This directly mirrors the precedent Mission 3B itself established for the identical class of problem: `workflow/semantic-classification.ts` deliberately *duplicates* (rather than imports) `correctness/`'s `isUnsupportedInteractionCategory` specifically to avoid a `workflow → correctness → workflow` cycle, with a consistency test proving the two never drift. The pipeline runner's situation is the mirror image (a *new* module needing to call *into* three domains that already import `workflow/`), and the sibling-module placement is the equivalent fix.

**No contract, type shape, or stage-registry design changed as a result** — every interface (`PipelineRunRequest`, `PipelineRunReport`, `PerCandidateResult`, `GateResult`, `PipelineBatchLockRecord`, etc.) matches the plan exactly; only the directory changed. `src/features/question-factory/index.ts` gained `export * from "./pipeline";` alongside its existing `export * from "./workflow";`, so nothing about the public import surface (`@/features/question-factory`) changed either — `runPipeline` is importable exactly where a caller would expect it.

---

## 3. Precise implementation clarifications beyond the plan's literal text

The plan's §7a/§7b prose was accurate at the level of intent but under-specified two mechanics precisely enough to implement directly; both are documented here rather than silently resolved.

### 3a. The `revision_no_material_change` comparison strips `id` from both sides

The plan's literal formula ("`hashJson(input.revisedContent) === parent.provenance.contentHash`") would compare a hash of the *raw*, pre-mint revised content against the parent's *id-embedded, preflight-parsed* stored hash — two structurally different hashing bases that would almost never match even for byte-identical corrections, since the parent's stored `question.id` differs from whatever (if anything) `revisedContent.id` declares. `revision/revise.ts`'s actual check strips the `id` key from both the declared `revisedContent` and the parent's stored `question` before hashing and comparing — `id` is minted fresh per candidate (never trusted from caller-declared content, the same discipline `manual-ingestion/ingest.ts` already applies), so it must be excluded from a *content*-equivalence comparison. This preserves the check's full intent (reject a revision that isn't materially different) while making the formula actually correct.

### 3b. Dry-run previews are genuine, non-mutating pure-function calls — never a fabricated "passed" placeholder

The plan's pseudocode says a dry run should "compute the stage's pure decision only, do not call `repository.update`/`move`." Each of the three stages in `PIPELINE_STAGES` therefore exposes **both** a mutating `run()` (wraps the real orchestrator) and a non-mutating `preview()` (calls the exact same pure function the real orchestrator calls internally — `validateCandidateStructure`, `verifyCandidateCorrectness`, or `hasIndependentReviewerRecordAtThreshold` + `classifySemanticCategory` + `canAdvanceToSemanticReviewPassed` for the semantic stage, which has no separate "verify" step by design). A dry run previews **exactly one** stage — the first the candidate is currently eligible for — and stops; it never chains multiple simulated stages together, since a real run's second stage would depend on state the first stage never actually wrote. This was a deliberate, considered implementation choice: a placeholder `{outcome: "passed"}` for every dry-run stage would have been trivially simpler to write, but would violate the "never a placeholder or automatically passing review record" discipline that pervades this codebase's governance philosophy (explicitly stated for the originality/difficulty gates in PD-4, and implicitly the same standard everywhere else).

### 3c. `PipelineRunOutcome` is a typed discriminated union, not a bare `PipelineRunReport`

The plan's §7b type sketch showed `runPipeline` returning `PipelineRunReport` directly. In practice, a pre-flight, whole-batch refusal (invalid candidate list, batch lock unavailable) has no natural place inside that report shape — there is no candidate to attach the refusal to, and no sensible `runFingerprint`. `pipeline-types.ts` therefore defines `PipelineRunOutcome = {status: "completed", report: PipelineRunReport} | {status: "refused", issueCode: PipelineIssueCode, message: string}`, matching the exact discriminated-union convention every other orchestrator in this codebase already uses (`ReviseOutcome`, `ReviewIngestionOutcome`, `ManualIngestionRunOutcome`). `questions:pipeline`'s CLI and every test consume this typed union directly rather than string-parsing a report field.

---

## 4. Revision identity and supersession design (as delivered)

Exactly as specified in the plan (§7a, §10, §11) — no changes: a revision mints a **new**, deterministically-derived `rev-` prefixed candidate id, linked to the parent via `parentCandidateId`/`revision`, never mutating the parent's own record beyond a single additive `supersededBy` stamp. `SupersessionClaim` (`{candidateId, revisionRequestId, revisionFingerprint, claimedAt}`) is the parent-version-binding mechanism: at most one claim per parent, ever, evidence-verified via `expectedContentHash`-guarded `repository.update()` on the parent record itself — never a separate sidecar index, directly applying the Mission 3B P1-2 lesson.

**Eleven-step `ingestRevision` sequence** (`revision/revise.ts`, corrected by the §4a remediation below), in order: schema parse → parent read/state check → binding checks (`stale_revision_parent`) → `parentBlueprintHash` identity check (`revision_blueprint_mismatch`) → revised-content blueprint-compatibility check (`revision_blueprint_mismatch`, §4a) → revision-limit check → material-change check → author-identity check → claim resolution (`resolveClaim`) → parent-claim write (with one bounded contention retry) → child creation → outcome. Every rejection path performs zero mutation.

---

## 4a. Mission 3C P1 remediation — `revision_blueprint_mismatch` now also validates content compatibility

**Finding (independent Codex audit, post-delivery).** `revision/revise.ts` validated only that the caller-supplied `parentBlueprintHash` equalled the parent's currently-stored blueprint hash. It never verified that the *revised candidate content* remained compatible with the parent blueprint's immutable dimensions (cohort/year, subject, exam style, skill, question type) before creating the child candidate, writing it, and claiming the parent's `supersededBy` slot. A revision could therefore change the parent's cohort/subject/exam-style/skill/question-type while still declaring a correct, current `parentBlueprintHash` — the structural-validation gate that runs after the child already exists would eventually catch it, but only after a child candidate and a parent claim had already been durably written, which the finding correctly identified as unacceptable for a revision-boundary protection.

**Fix.** A new pure function, `checkRevisionBlueprintCompatibility` (`revision/blueprint-compatibility.ts`, exported from the `revision/` barrel), compares the revision's declared `yearLevel`, `metadata.subject`, `examStyle`, `metadata.skill` (resolved via `skillTaxonomyRegistry.resolve`, the same alias-resolution `validation/taxonomy-checks.ts`'s `checkTaxonomy` already uses), and `type` against the parent's bound `Blueprint` record's corresponding fields. It takes no repository/filesystem dependency, performs no I/O, and returns a deterministic, ordered list of mismatches. `ingestRevision` calls it immediately after the existing `parentBlueprintHash` equality check — reusing the same already-fetched, already-parsed blueprint record, no second repository read — and before the revision-limit, material-change, author-identity, and claim-resolution checks. Any mismatch rejects with the existing `revision_blueprint_mismatch` issue code (no new code was needed); the message lists every mismatched dimension by name. Zero mutation occurs on this path: no parent claim, no child record, no lifecycle or compartment change.

**What did not change.** The `parentBlueprintHash` equality check itself (identity/staleness protection) is untouched and remains a required, independent check — the fix adds a second, narrower check, it does not replace the first. Existing replay/conflict precedence (replay → `revision_request_conflict` → `revision_parent_conflict` → `stale_revision_parent`) is unaffected, since the new check sits strictly earlier in the sequence than claim resolution and never interacts with `supersededBy`. No change to `pipeline/`, batch locking, semantic-review orchestration, lifecycle states/transitions, taxonomy data, or `src/content/`.

**Test coverage added** (`revision-ingest.test.ts`, `revision-ingest-crash-safety.test.ts`): year/cohort changed, subject changed, exam style changed, skill changed, question type changed, all five changed together, a compatible revision still succeeds, a wrong `parentBlueprintHash` is still refused even with compatible content, and two concurrent divergent-but-both-incompatible requests produce zero children and zero parent mutation. Every rejection test asserts the issue code, the absence of any `generated` child, and the parent's `state`/`contentHash`/`supersededBy` remaining exactly as seeded.

---

## 5. Revision replay/conflict behaviour (as delivered, matches plan §11 exactly)

| Scenario | Outcome |
|---|---|
| Identical `revisionRequestId` + identical fingerprint | Replay — `accepted, replayed: true`, no new mutation |
| Identical `revisionRequestId`, different fingerprint | `revision_request_conflict` |
| Different `revisionRequestId` against an already-claimed parent | `revision_parent_conflict` — refused regardless of content equality |
| Different `revisionRequestId`, no existing claim | First to durably land wins the claim; the loser re-reads and is re-evaluated against the row above |

Verified directly: two concurrent identical requests → exactly one child, one `replayed: false` + one `replayed: true`; two concurrent divergent requests → exactly one accepted, the other `revision_parent_conflict`, never two children; a reused `revisionRequestId` with different content → `revision_request_conflict`.

---

## 6. Pipeline stage registry (as delivered, matches plan §7b/§2c exactly)

`PIPELINE_STAGES` contains **exactly three entries** — `structural` (`acceptsState: "generated"`), `correctness` (`acceptsState: "structural_validation_passed"`), `semantic` (`acceptsState: "correctness_check_passed"`) — verified by a dedicated test asserting the exact array shape and that no `originality`/`difficulty`/`staging`/`publication` name appears anywhere. Mission 3D extends this exact array; the runner's control-flow loop (`processCandidate` in `pipeline-runner.ts`) is entirely data-driven off it and needs zero changes to accommodate the two additional entries.

---

## 7. Explicit-list semantics (as delivered, matches plan §7b exactly)

`PipelineRunRequest.candidateIds` is a required, non-empty array in the type system — there is no optional/auto-discovery code path anywhere in `pipeline/`. Pre-flight, whole-batch refusals (checked before the batch lock is even attempted, before any candidate is touched): empty list (`invalid_arguments`), duplicate entries (`pipeline_duplicate_candidate_id`), over `FACTORY_LIMITS.MAX_CANDIDATES_PER_PIPELINE_RUN` (`pipeline_candidate_limit_exceeded`). Candidates are processed in exactly the order given — verified by a dedicated test seeding three candidates in one creation order and requesting them in a different order, asserting the report preserves the *requested* order.

---

## 8. Batch-lock design (as delivered, matches plan §7c/§8 exactly)

`.pipeline-locks/<batchId>.lock`, atomic `fs.open(path, "wx")` acquisition (the same `O_CREAT|O_EXCL` primitive `.locks/` already uses), `PipelineBatchLockRecord` carrying `batchId`, `pipelineRunId`, `batchFingerprint`, `ownerToken`, `ownerPid`, `acquiredAt`, `candidateIds`. Release only removes the lock when the presented `ownerToken` matches, called in a `finally` block wrapping the entire per-batch execution.

**Never auto-steals.** A held lock younger than `PIPELINE_LOCK_STALE_AGE_MS` (30 minutes) returns `pipeline_batch_lock_held`; an older or malformed one returns `pipeline_batch_lock_held_ambiguous`, carrying a typed diagnostic (`holder.pipelineRunId`/`ownerPid`/`acquiredAt`/`ageMs`/`candidateIds`) and the full manual recovery procedure embedded verbatim in the message. Directly tested: a lock file's bytes are asserted byte-identical before and after every refused acquisition attempt (young-held, aged-ambiguous, and malformed-content cases) — the lock is never deleted, overwritten, or reassigned by any code path.

**Operator manual recovery procedure** (embedded in every `pipeline_batch_lock_held_ambiguous` diagnostic message, reproduced here for the runbook):
1. Confirm no `questions:pipeline` process for this `batchId` is actually still running — the recorded `ownerPid` is informational only; never treat "not found" as proof of death (a PID can be reused) or "found" as proof of life for a different machine/container.
2. If genuinely abandoned, manually delete the lock file at `.pipeline-locks/<batchId>.lock` under the workspace root.
3. Re-invoke `questions:pipeline` — a fresh acquisition then succeeds normally.
4. If uncertain, do not delete the lock file — treat it as an operational incident and wait, or contact whoever owns the invocation recorded in the diagnostic.

No `--release-abandoned-lock` command exists in this delivery — explicitly deferred to Mission 3E's reconciliation tooling (alongside `.locks/`'s own identical, pre-existing gap), matching the plan's §4/§8 scope boundary exactly.

---

## 9. Crash-recovery behaviour and the Mission 3B P2 debt closure

**Revision:** crash mid-claim (parent `update()` fails) → zero mutation, clean retry succeeds. Crash between claim and child creation (a thrown exception during `create()`, simulating an unhandled I/O failure) → the claim is durably visible on the parent, the child does not yet exist; a same-request retry self-heals (completes the child); a *different* concurrent request during that exact window is correctly refused with `revision_parent_conflict` — the claim alone is authoritative, never the child's mere existence. Both proven directly, including an explicit assertion that `generated` contains zero candidates in the crash window before the retry.

**Pipeline — Mission 3B P2 debt closure** (`pipeline-runner-crash-safety.test.ts`), the specific test the task called out, described exactly:
1. Real `runManualIngestion` (real ingestion, never a direct `repository.create` seed).
2. Real `orchestrateStructuralValidation` → `structural_validation_passed`.
3. Real `orchestrateCorrectnessVerification` → `passed_pending_semantic_review` → `correctness_check_passed`, the legitimate semantic-review prerequisite.
4. Real `ingestExternalReview`, with a fault injected specifically into the *second* `update()` call within that one invocation (the semantic-transition stamp) — the review-append write (the first `update()` call) is left to succeed and durably lands.
5. **Explicit proof of the append-before-failure property**: read directly from the real (non-wrapped) repository immediately after the injected failure — `state === "correctness_check_passed"`, `reviewRecords.length === 1`.
6. **Retry through `runPipeline`** (not a second direct `ingestExternalReview`/`attemptSemanticReviewTransition` call) against the real, no-longer-faulty repository — the semantic stage's `GateResult` reports a genuine `"passed"` outcome, not a repeat of the failure.
7. **No duplicate review append**: `reviewRecords.length` is still exactly `1` after the retry.
8. **Correct final state and compartment**: `state === "semantic_review_passed"`, readable from `review-queue`, never misrouted to `quarantined`/`rejected/semantic`.

A companion test proves the identical property at batch scale: one candidate's isolated semantic-transition fault does not affect a sibling candidate processed in the same `runPipeline` call, and a same-`pipelineRunId` retry completes only the missing candidate without duplicating its review.

This is the literal, concrete closure of the accepted Mission 3B P2 debt: *"crash-recovery fault injection does not itself traverse the complete ingestion, structural-validation and correctness pipeline."* It now does, end to end, through `runPipeline`'s own production entry point.

---

## 10. Test coverage and final aggregate

| File | Tests | Focus |
|---|---|---|
| `revision-identity.test.ts` | 5 | `mintRevisionCandidateId` determinism |
| `revision-ingest.test.ts` | 21 | Happy path, all binding/limit/identity rejections, replay, blueprint-compatibility rejections (§4a) |
| `revision-ingest-crash-safety.test.ts` | 6 | Crash windows, concurrent identical/divergent/incompatible, request conflict |
| `pipeline-stages.test.ts` | 4 | Registry shape, `acceptsState`, no originality/difficulty stub |
| `pipeline-batch-lock.test.ts` | 6 | Acquire/release, held/ambiguous/malformed classification, byte-identical-on-refusal |
| `pipeline-runner.test.ts` | 18 | Pre-flight refusals, full progression, ordering, isolation, replay, dry-run, legacy compatibility |
| `pipeline-runner-crash-safety.test.ts` | 2 | Mission 3B P2 debt closure, batch-level candidate isolation |
| `mission3c-integration.test.ts` | 2 | Full production-path revision cycle, five-candidate real-ingestion batch |
| `cli-questions-revise.test.ts` | 10 | Help, validation, eligibility, happy path, replay, both conflicts |
| `cli-questions-pipeline.test.ts` | 9 | Help, validation, happy path, partial, dry-run, lock conflict |
| `blueprint-planner.test.ts` (extended) | +15 | PB1 residual-debt negative planner coverage (§11) |
| `provenance.test.ts` (extended) | +3 | `supersededBy` legacy compatibility and schema validity |

**159 new tests, all passing** (150 from the original delivery + 9 added by the §4a P1 remediation: 8 in `revision-ingest.test.ts`, 1 in `revision-ingest-crash-safety.test.ts`). Full-suite aggregate at the P1 remediation's validation pass: **1570/1570 passing**, 76 test files, no failures. `review-ingest-crash-safety.test.ts` (a file this delivery does not touch) — previously noted as an intermittent Windows filesystem-lock-contention flake under full-parallel-suite load — passed cleanly in the full run and was additionally run 5 further times in isolation (8/8 passing every time), confirming the P1 remediation introduced no new shared-state or concurrency instability.

---

## 11. PB1 residual-debt negative planner tests

Per the task's explicit ask, `blueprint-planner.test.ts` gained 15 negative cases (one or two per PB1-touched taxonomy entry) proving each entry's year-level/exam-style exclusion is precise, not silently over-broad: e.g. `num.prod.chance.most-likely-outcome` (Year 5-only, `naplan_style`-only) correctly plans zero blueprints for Year 3 or for `icas_style`; `num.fractions.equivalent` (expanded to both exam styles, but still Year 5-only) correctly plans zero blueprints for Year 3. No taxonomy entry was modified — this is test-only coverage of the already-approved PB1 remediation.

---

## 12. CLI behaviour

**`questions:revise --request <file> [--json]`** — single JSON-file input (mirrors `questions:review-ingest`'s shape). Exit codes: `0` accepted (fresh or replay), `2` invalid arguments/malformed/stale-parent/blueprint-mismatch/limit-exhausted/no-material-change/unsupported-identity, `4` unknown parent, `5` conflict (`revision_request_conflict` or `revision_parent_conflict`), `1` internal error.

**`questions:pipeline --pipeline-run-id <id> --batch-id <id> --candidate-ids <id1,id2,...> [--dry-run] [--json]`** — `--candidate-ids` is mandatory; there is no discovery mode. Exit codes: `0` every requested candidate ended exactly at `semantic_review_passed`, `3` partial (anything else — expected, not a bug), `2` invalid arguments/duplicate ids/limit exceeded/run-id conflict, `9` batch lock held (ordinary or ambiguous), `1` internal error. A dry run's report is never persisted (it would otherwise collide with a later real run under the same `pipelineRunId`), and its `endState` always equals the candidate's starting state (a preview, never a real advance) — so a dry run of an otherwise-fully-passing candidate legitimately exits `3`, verified directly by a test.

---

## 13. Mandatory validation results

```text
npm run typecheck        clean
npm run lint              clean
npm test                  1570/1570 passing, 76 test files (P1 remediation validation pass; see §10)
npm run validate:questions  100 production questions, 15 showcase fixtures, all valid
npm run check:answers      100 total, 0 failures
npm run build              clean (Next.js 16.2.10, Turbopack)
npm run test:e2e           20/20 passing
npm audit --audit-level=moderate   2 moderate advisories (Next/PostCSS) — unchanged from the Mission 3B baseline
git diff --check           clean
```

Production bank (100 questions, 15 showcase fixtures) and `src/content/` confirmed byte-identical before and after this branch's diff.

---

## 14. Residual technical debt and deferred items

- No abandoned pipeline-batch-lock manual-release CLI (§8) — deferred to Mission 3E, matching `.locks/`'s own pre-existing, identical gap.
- Automatic pipeline-candidate discovery by compartment/batch scan — explicitly deferred, not scheduled to a specific future mission (plan §4/§15).
- `PIPELINE_LOCK_STALE_AGE_MS`'s exact value (30 minutes) is a reasonable default, not yet tuned against real batch-processing observations — plan §19 flagged this as a genuinely lower-stakes item safe to refine later without a re-plan.
- The `review-ingest-crash-safety.test.ts` concurrency flake (§10) is unrelated to this delivery but is now slightly more reproducible under the larger overall test suite's added parallel load; worth a future look at whether that specific test's `Promise.all` race needs a more deterministic coordination primitive, independent of Mission 3C.

---

## Explicit statement

Mission 3C implementation complete and branch frozen for independent Codex audit. Approval has not been claimed.
