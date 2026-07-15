# Mission 3B — Semantic and External Review

Status: implemented, tested, and **remediated against two independent audit STOP AND FIX verdicts** (round 1: two blocking P1 findings, no P0; round 2: one blocking P1 finding plus P2/P3 findings); frozen again for independent re-audit. Not self-approved.

Branch: `integration/governed-question-factory`. Starting SHA `af4ba37f699d9a0cbf1f065dffe8c6766bfa6638` (the approved Mission 3A baseline). Stable `main` remains `ba9575c572df050ab97244758ead22e5336dcd2c`, untouched by this work.

Written against `docs/reports/mission3-production/01-mission3-implementation-contract.md` §7-§9 and §20, and `02-prerequisite-decisions.md` PD-2/PD-8. This document records what was actually built, including where implementation had to resolve a genuine ambiguity in the contract text or discovered a cross-mission gap — it is not a restatement of the contract.

**P1 remediation round 1.** An independent audit of the first Mission 3B delivery (final SHA `c3ccc97358c1489df99ce886888fb5d70fb546c7`) returned **STOP AND FIX**: two blocking P1 findings, no P0. §13 and §14 below are sections describing exactly what was found and fixed. Every other section in this document that described the *original* (defective) behaviour has been updated in place to describe the corrected behaviour — this document does not retain a stale description of the pre-fix state anywhere; §13/§14 are where the *history* of the defect and its fix are recorded.

**P1/P2/P3 remediation round 2 (this revision).** A strict Codex re-audit of the round-1 delivery (frozen SHA `bedd8a62854cec096915902ea38370e84b2d518a`) returned **STOP AND FIX** again: one blocking P1 (duplicate `reviewId` values in a validly hashed chain were not rejected, so replay resolution's first-match behaviour could classify a chain using only one of several matching records) plus P2 (unpaired `reviewId`/`reviewResultFingerprint` persisted-record schema gap; missing direct regression coverage for the append/transition-recovery flow) and P3 (a stale correctness-orchestration comment) findings. §17 below is the full record of this round's fix.

---

## 1. Scope delivered

- PD-2: `classifySemanticCategory` (`workflow/semantic-classification.ts`) — pure, deterministic, candidate-derived `SemanticClassification`, a strict three-way refinement of `correctness/`'s existing two-way split. Deliberately duplicates (does not import) `correctness/`'s `isUnsupportedInteractionCategory` to avoid introducing a real module cycle (`workflow` is foundational to `correctness`), with a consistency test proving the two never drift.
- `Reviewer` provider-neutral contract (`review/types.ts`), symmetrical with `QuestionGenerator`.
- `DeterministicRuleReviewer` (`review/deterministic-rule-reviewer.ts`) — five real, deterministic, versioned checks (unsafe markup, alt-text answer leakage, non-Australian spelling, rubric/explanation completeness, answer/explanation string-overlap). Enforces, at the code level (not just by convention), that it never emits `result: "passed"` for `semantic_objective`/`manual_review_writing` content.
- `FixtureReviewer` (`review/fixture-reviewer.ts`) — deterministic, test/CI-only, caller-configured outcome; satisfies the identical `Reviewer` contract and identical independence/evidence checks as any other reviewer.
- `review/review-prompt-builder.ts` + `questions:review-prompt` CLI (`scripts/questions-review-prompt.mts`) — versioned, deterministic external review packs, PD-8 answer/rubric inclusion policy.
- `review/review-ingest.ts` + `questions:review-ingest` CLI (`scripts/questions-review-ingest.mts`) — external review-response parsing, identity resolution, independence/staleness/evidence checks, chain append, and lifecycle-transition attempt.
- `review/orchestrate-semantic-review.ts` — the shared `correctness_check_passed -> semantic_review_passed` gate-attempt orchestrator, reused by `review-ingest.ts` and directly testable/reusable by a future pipeline runner.
- Config: `config/mission3b-issue-codes.ts` (closed issue-code catalogue), three new `FACTORY_LIMITS` entries (`MAX_REVIEW_PACK_BYTES`, `MAX_REVIEW_RESPONSE_BYTES`, `MAX_RECOMMENDED_CORRECTIONS`).
- Additive schema fields: `reviewRecordSchema.recommendedCorrections` (optional), `reviewEvidenceBindingSchema.semanticClassification` (optional, diagnostic-only per PD-2). Both included in the review-chain tamper-evidence hash **only when present**, preserving the existing golden-vector hash test byte-for-byte.
- 62 new tests (unit + CLI-subprocess + integration), all passing; 1030/1030 tests green across the whole `question-factory` suite (one unrelated Windows lock-file race in a pre-existing Mission 2B test flaked once under full-parallel load and passed cleanly on immediate rerun — not caused by this work, see §10).

**Explicitly not built** (out of scope per the mission brief and the contract's sub-mission mapping): revision workflow, pipeline runner, originality/difficulty gates, staging, publication, reconciliation, live-provider adapters, harvested-content import, `questions:review`/`questions:dedupe`/other CLI-catalogue-completion commands (3E/3F), Supabase integration.

---

## 2. Architecture

```
workflow/semantic-classification.ts   PD-2: classifySemanticCategory (pure)
review/
  types.ts                           Reviewer / ReviewContext / ReviewOutcome contract
  deterministic-rule-reviewer.ts     DeterministicRuleReviewer (reviewerClass: "deterministic_rule")
  fixture-reviewer.ts                FixtureReviewer (reviewerClass: "fixture")
  review-result-hash.ts              computeReviewResultHash — evidenceBinding.reviewResultHash
  review-prompt-builder.ts           buildReviewPromptPack (pure) -> questions:review-prompt
  review-response-envelope.ts        parseReviewResponseText (size bound + JSON parse)
  review-ingest.ts                   reviewIngestionInputSchema + ingestExternalReview (impure orchestrator)
  orchestrate-semantic-review.ts     attemptSemanticReviewTransition (shared gate-attempt logic)
config/mission3b-issue-codes.ts      REVIEW_PROMPT_ISSUE_CODES / REVIEW_INGESTION_ISSUE_CODES / DETERMINISTIC_REVIEW_ISSUE_CODES
scripts/questions-review-prompt.mts  CLI
scripts/questions-review-ingest.mts  CLI
```

`review/` reuses, never reimplements: `identitiesAreIndependent`, `isProductionGradeIndependentReview`, `isReviewStillValid`, `appendReviewRecord`, `verifyReviewChain` (all Mission 1/2C, `provenance/`), `applyTransition`/`decideGateFailureOutcome`/`canAdvanceToSemanticReviewPassed` (Mission 1, `workflow/`), `parseCandidateProvenance`/`parseCandidateQuestion`/`checkAgainstProductionSchema` (Mission 2B, `validation/`), and the storage/locking/replay discipline of `FsFactoryRepository` (unchanged).

---

## 3. Reviewer-independence enforcement

Independence is decided exclusively by the already-implemented `identitiesAreIndependent` over the normalised `(provider, modelId, modelFamily)` triple — `review-ingest.ts` never adds a second independence check and never trusts a self-declared "I am independent" field (none exists in `reviewIngestionInputSchema`). Verified by the full matrix in `review-ingest.test.ts`:

| Generator | Reviewer | Result |
|---|---|---|
| qwen | claude | pass |
| claude | qwen | pass |
| claude | chatgpt | pass |
| claude | claude (exact match) | `self_review_rejected` |
| claude-sonnet-5 | "claude sonnet 5" (alias, same normalised identity) | `self_review_rejected` |
| claude-opus-4-8 | claude-sonnet-5 (same family, different modelId) | pass — independence is per-model, not per-family |
| claude | some-new-model-xyz (no alias-table entry) | `unsupported_reviewer_identity` |

A `DeterministicRuleReviewer` is defensively guarded (code-level assertion, not just convention) against ever emitting `result: "passed"` for `semantic_objective`/`manual_review_writing` content — the case the contract calls out by name (§7).

---

## 4. Semantic-review outcome model

`canAdvanceToSemanticReviewPassed(classification, hasIndependentReviewerRecordAtThreshold)` (Mission 1, unchanged) is the single gate function `attemptSemanticReviewTransition` calls:

- **`deterministically_computable`**: passes unconditionally — no independent review required. Verified end-to-end in `mission3b-integration.test.ts` with zero review records.
- **`semantic_objective` / `manual_review_writing`**: requires at least one record in the candidate's `provenance.reviewRecords` chain that satisfies `isProductionGradeIndependentReview` at `FACTORY_THRESHOLDS.PRODUCTION_REVIEW_CONFIDENCE` (0.8). `hasIndependentReviewerRecordAtThreshold` (`orchestrate-semantic-review.ts`) scans the whole chain — reusing the audited primitive per-record against the chain's fixed real terminal hash — rather than reimplementing chain verification.

**Both classifications now legitimately reach this gate's entry precondition (`correctness_check_passed`) through the real pipeline** — see §14 for the P1-1 correctness-gate routing fix that makes this possible; before that fix, only `deterministically_computable` candidates could ever arrive here.

**One design ambiguity in the contract text, resolved during implementation (documented in code comments at its point of use, non-blocking):**

- **`insufficient_evidence` outcome semantics.** The contract's outcome table reads "No mutation; review recorded as result: 'warning' at most" — apparently self-contradictory. Read as parallel to the low-confidence/ambiguity rows in the same table: the chain **is** appended (a complete audit trail of every submission), with `result` downgraded from `"passed"` to `"warning"`; only the *lifecycle* transition is refused. Verified in `review-ingest.test.ts`.

(A second ambiguity — where to store the `reviewId -> reviewResultFingerprint` idempotency mapping — was originally resolved with a separate sidecar report; that design was found to have a crash-safety defect and has been replaced. See §15.)

---

## 5. Lifecycle and compartment transitions

No new states or compartments. Exercises the already-implemented `correctness_check_passed -> semantic_review_passed | needs_revision | rejected | quarantined` edges (`TRANSITION_TABLE`, unchanged). `semantic_review_passed` maps to the same `review-queue` compartment as `correctness_check_passed` (per `compartmentForState`), so a successful transition is a same-compartment `repository.update()` (content-hash-guarded), not a `move()` — mirroring the correctness gate's own pass-path persistence pattern. A missing-or-insufficient-evidence failure is a real `move()` to `quarantined`, per contract §3's explicit "nothing to revise yet, only a missing review" instruction — never `needs_revision` (the implemented `canAdvanceToSemanticReviewPassed`/`applyTransition` API gives no signal to distinguish "no review at all" from "review exists but insufficient," so both route identically, a documented simplification, not an oversight).

---

## 6. Evidence and replay design

Evidence is the candidate's own `provenance.reviewRecords` chain — no new evidence schema (per contract §19, reused as-is). Every append goes through `appendReviewRecord` (never hand-assembled); `evidenceBinding.reviewResultHash` is computed by a new small helper (`computeReviewResultHash`) since no such computation existed anywhere in the codebase before this. **Idempotency identity (`reviewId`/`reviewResultFingerprint`) is now stamped directly onto the `ReviewRecord` itself** (P1-2, §15) rather than kept in a separate sidecar report. Replay:

- **Identical resubmission under the same `reviewId`**: idempotent — resolved by scanning the chain for a matching `reviewId` with an equal `reviewResultFingerprint`; no second chain entry, `attemptSemanticReviewTransition` re-run to report current status, `replayed: true`.
- **Changed resubmission under the same `reviewId`**: a chain match with a *different* `reviewResultFingerprint` is refused (`review_id_conflict`), no mutation.
- **Already-advanced candidate**: `attemptSemanticReviewTransition` recognises `state === "semantic_review_passed"` and returns immediately, no re-derivation.
- **Chain integrity**: `verifyReviewChain` is re-run against the *existing* chain before any new append (and before the `reviewId` scan trusts anything in it) — a corrupted prior chain refuses the append (`review_chain_corrupt`) rather than silently building on top of it, or silently trusting a forged `reviewId` claim.

---

## 7. External review ingestion behaviour

`questions:review-ingest` takes one explicit `--response <file>` path — there is no review inbox directory/compartment (the contract defines none for 3B; `review-prompt`/`review-ingest` are both single-file operations, unlike `questions:ingest`'s directory scan). Full outcome table implemented and tested: `malformed_review_response`, `unknown_candidate`, `invalid_lifecycle_state_for_review`, `stale_review_revision`, `content_hash_mismatch`, `blueprint_hash_mismatch`, `review_prompt_reference_mismatch` (checked only when a stored `review-pack-<id>` report exists, mirroring `questions:ingest`'s own lenient `prompt_pack_reference_mismatch` precedent), `insufficient_evidence` (downgrade, not rejection), `unsupported_reviewer_identity`, `self_review_rejected`, `review_chain_limit_exceeded`, `review_chain_corrupt`, `review_id_conflict`, idempotent replay.

---

## 8. Conflict, quarantine, and crash-recovery behaviour

- **Conflict** (`review_id_conflict`): refused outright, no mutation — proven in both the library test, the CLI subprocess test, and (post-P1-2) a genuine concurrent-submission test.
- **Quarantine**: a semantic gate that cannot decide (no qualifying independent review) always quarantines, never guesses a pass and never rejects something not proven wrong.
- **Crash recovery**: the review-chain append (`repository.update` with `expectedContentHash`) is, as of the P1-2 fix (§15), the *only* durable write `ingestExternalReview` performs before attempting the semantic-gate transition — there is no longer a second, separately-failable write to recover from. It goes through the same atomic, lock-guarded, content-hash-replay-safe `FsFactoryRepository` primitives already proven crash-safe by Mission 2B/2C's own test suites; Mission 3B introduces no new filesystem transaction shape.

---

## 9. CLI commands and subprocess coverage

| Command | Exit codes | Subprocess tests |
|---|---|---|
| `questions:review-prompt` | 0 ok / 2 invalid args or candidate / 4 not found / 5 output exists | `cli-questions-review-prompt.test.ts` (7 tests: help, missing arg, unrecognised flag, not-found, happy path + `--json` + written-file verification, conflict-without-`--force`, `--stdout`) |
| `questions:review-ingest` | 0 ok (advanced) / 2 invalid/malformed/self-review / 3 recorded-not-advancing / 4 not found / 5 conflict / 1 internal | `cli-questions-review-ingest.test.ts` (7 tests: help, missing arg, not-found, malformed JSON, happy path, reused-reviewId conflict, self-review rejection) |

Both are non-interactive, JSON-output-capable, and never prompt — matching the contract's universal CLI conventions (§16), reused unchanged from Mission 3A's own script conventions.

---

## 10. Unit and integration test coverage

Original delivery: 62 new tests across 8 files. This P1 remediation round adds/rewrites:

- `workflow-semantic-classification.test.ts` (24) — PD-2's full per-type/per-kind table, fail-closed default, cross-check consistency with `correctness/`'s existing predicates. Unchanged this round.
- `review-deterministic-rule-reviewer.test.ts` (10), `review-fixture-reviewer.test.ts` (6), `review-prompt-builder.test.ts` (6) — unchanged this round.
- `review-ingest.test.ts` (21) — the full reviewer-independence matrix and review-integrity matrix (§24 of the contract). Unchanged this round (all 21 still pass unmodified against the reworked idempotency logic).
- `review-record-mission3b-fields.test.ts` (6) — additive-schema-field backward compatibility and tamper-evidence. Unchanged.
- `cli-questions-review-prompt.test.ts` (7), `cli-questions-review-ingest.test.ts` (7) — real `tsx` subprocess invocations, sandboxed via `MINDMOSAIC_QUESTION_FACTORY_ROOT`. Unchanged.
- **`correctness-orchestration.test.ts`** (modified, +3 net tests) — the one test asserting the old (defective) quarantine-on-`requires_independent_semantic_review` behaviour was replaced with a `describe` block of 5 tests proving the corrected `passed_pending_semantic_review` routing (advance to `correctness_check_passed`, evidence outcome stays `review_required`, idempotent replay, no direct jump to later gates); the sibling `structurally_scoreable_only`-still-quarantines test is unchanged, proving the fix is precisely scoped.
- **`mission3b-integration.test.ts`** (rewritten: 2 → 10 tests) — every test now starts from `questions:ingest` behaviour, never a direct `repository.create` seed at `correctness_check_passed`. Covers: `deterministically_computable` auto-clear (unchanged real chain); `semantic_objective` reaching `correctness_check_passed` via `passed_pending_semantic_review`, then passing only with an independent review, and quarantining without one; the same three assertions for `manual_review_writing`; self-review rejection and stale-revision rejection against a legitimately-reached candidate; a genuinely-undecidable (`structurally_scoreable_only`) candidate still quarantining through the real ingest→structural→correctness chain.
- **`review-ingest-crash-safety.test.ts`** (new, 6 tests) — the P1-2 crash-window/concurrency/backward-compatibility regression suite (§15): failed-single-write recovery, identical-resubmission-after-failure, two genuinely concurrent identical submissions, two genuinely concurrent same-`reviewId`-different-content submissions, a legacy chain record with no `reviewId` field remaining valid and chainable, and tamper detection on `reviewId`/`reviewResultFingerprint`.

Full `question-factory` suite after this round: **1047/1047 passing** (up from 1030 before this remediation). Full repository suite: **1406+ passing** (see §12 validation results below for the exact re-run count). One pre-existing Mission 2B test (`structural-validation-orchestration.test.ts`, a Windows lock-file-contention race under full-parallel-suite load) flaked once during the original delivery and passed cleanly on immediate rerun in isolation and in the full suite; it does not touch any file this mission changed and is recorded here as an observed, not introduced, flake. It did not recur during this remediation round's validation runs.

---

## 11. Cross-mission reachability finding — status: FIXED (was §11's "discovered, not fixed"; see §14)

The original delivery of this mission discovered, documented, and deliberately **did not fix** a cross-mission gap: Mission 2C's `orchestrateCorrectnessVerification` classified *any* `semantic_objective`/`manual_review_writing`-classified candidate's correctness result as `review_required`, which its own `decideTransitionTarget` mapped to `severity: "uncertain"`, which `decideGateFailureOutcome` always routed to `quarantined` — unconditionally. That meant a `semantic_objective`/`manual_review_writing` candidate could never reach `correctness_check_passed` at all, making Mission 3B's independent-review path unreachable through the real pipeline (only testable by directly seeding the state).

An independent audit of that delivery correctly identified this as a **blocking P1 finding** (not acceptable residual debt, because it made the mission's core deliverable — independent semantic review — provably unreachable in production) and required a fix. §14 below is the full record of the correction actually made, its exact semantics, and the genuine full-chain tests now proving reachability.

---

## 12. Self-review findings and fixes

A five-angle self-review (line-by-line correctness scan, removed-behaviour audit, cross-file caller/callee tracer, reuse/simplification, efficiency/altitude/conventions) ran against the full staged diff before commit. The removed-behaviour audit found nothing (this mission is almost entirely additive). The other four angles surfaced real findings; the following were fixed:

- **`classifySemanticCategory`'s `semantic_objective` branch depended on an unstated cross-file invariant.** It tested `answerKey.kind === "text"` alone, correct only because the production schema's `compatibleAnswerKinds` map happens to restrict `"text"` to `short_answer`/`reading_comprehension` (the latter already handled earlier). Fixed to explicitly test `type === "short_answer" && answerKey.kind === "text"`, matching `correctness/`'s own `isSemanticCategory` exactly and removing the silent dependency on an invariant enforced in an unrelated file (`workflow/semantic-classification.ts`).
- **`questions:review-ingest`'s exit code conflated a genuine internal error with an expected "recorded, not advancing" outcome.** A `repository_error` inside `gateOutcome` (the lifecycle-transition attempt failing after a successful review append) exited `3`, identical to the expected low-confidence/ambiguous/insufficient-evidence case — a caller checking only the exit code could mistake an operational failure for "just needs more review." Fixed: `repository_error` now exits `1` (`scripts/questions-review-ingest.mts`).
- **`hasIndependentReviewerRecordAtThreshold`'s doc comment overclaimed protection it cannot provide.** `expectedTerminalReviewHash` is derived from the same `chain` array being tested, making `isProductionGradeIndependentReview`'s truncated/substituted-chain check a no-op for this specific call site (not exploitable in practice — there is no substitution window within this function's single-read call, and the underlying primitive's other checks, chain-internal integrity, per-record identity binding, independence/confidence/evidence/ambiguity, still apply fully). Comment corrected to state this honestly (`review/orchestrate-semantic-review.ts`).
- **Two efficiency fixes, both zero-risk:** the not-found fallback's two sequential compartment reads (`rejected/semantic`, then `quarantined`) now run via `Promise.all` (mutually-exclusive compartments, safe to parallelise); `DeterministicRuleReviewer.runChecks` now derives `deriveAnswerTexts` once and shares it between `checkAltTextLeakage` and `checkAnswerExplanationConsistency` instead of computing it twice per review.

All four fixes were re-validated: `npm run typecheck`, `npm run lint`, and the full `question-factory` suite (1030/1030) all pass unchanged after the fixes.

---

## 14. P1-1 remediation — correctness-gate routing correction (full detail)

**Root cause.** `correctness/orchestrate-correctness-verification.ts`'s `decideTransitionTarget` treated *any* `review_required` status as `severity: "uncertain"`, which `decideGateFailureOutcome` always maps to `quarantined`. `review_required` is produced by the pure `verifyCandidateCorrectness` for two genuinely different reasons, conflated by that one check:

1. **`capability: "structurally_scoreable_only"`** — a `deterministically_computable`-classified candidate (e.g. `number_entry`) whose prompt the deterministic derivation engine simply cannot resolve (no arithmetic expression to parse, an ambiguous chart tie, etc.). This is a genuine "the gate cannot decide" case — there is no semantic-review recourse for this classification, so quarantine is correct and unchanged by this fix.
2. **`capability: "requires_independent_semantic_review"`** — a `semantic_objective`/`manual_review_writing`-classified candidate (per `classifySemanticCategory`) for which no deterministic derivation is *meaningful at all*, and the declared answer/explanation raised no scoring contradiction. This is not "the gate cannot decide" — it is the gate correctly recognising that *this content class is entirely outside its remit*, and semantic review (Mission 3B) is the gate actually responsible for it. Routing this to `quarantined` made that gate unreachable in production.

**Correction.** `decideTransitionTarget` (and `outcomeFromResult`) now carve out exactly `status === "review_required" && capability === "requires_independent_semantic_review"` as a distinct, non-failure destination: `correctness_check_passed`. Every other `review_required`/`failed`/`unsupported` combination is completely unchanged — in particular, `status === "failed"` with capability `requires_independent_semantic_review` (the declared answer/explanation itself failed the real scoring engine — a genuine contradiction, not a missing derivation) still routes to `rejected`/`quarantined` exactly as before, since the new branch checks `status === "review_required"` specifically, never `"failed"`.

**Exact semantics of the corrected outcome (`CorrectnessOrchestrationOutcome["passed_pending_semantic_review"]`).** The gate completed with **no contradiction detected** — it is categorically *not* a machine-proven correctness claim (unlike `"passed"`), and *not* "the gate could not decide anything" (unlike `"quarantined"`). The persisted `CorrectnessVerificationEvidence.outcome` field is stamped `"review_required"` (never `"passed"`) specifically so a later reader — including a human auditor reading raw evidence records — can tell the two apart without needing this outcome label at all. No caller may treat `"passed_pending_semantic_review"` as equivalent to `"passed"`'s correctness claim.

**Safeguards preserved (all verified by the updated/added tests in §10):**
- Deterministic correctness checks for machine-verifiable candidates: entirely unchanged — `"passed"` still requires `capability: "deterministically_verifiable"` and a real, full-marks-scoring declared/derived match.
- Structural evidence binding: unchanged — `validate-cached-replay.ts`'s `validateCachedCorrectnessReplay` was updated to accept **exactly two** legitimate `correctness_check_passed` evidence shapes (the pre-existing deterministic pass, and the new pending-semantic-review pass), still rejecting anything else as a binding/replay-integrity failure.
- Unsupported-category handling: unchanged (`capability: "unsupported"` still always quarantines).
- Semantic-review independence requirements: untouched — the fix is entirely inside the correctness gate; the semantic gate (`review/orchestrate-semantic-review.ts`) is unmodified by this fix and still requires exactly the same independent-review evidence.
- Fail-safe quarantine for malformed/genuinely undecidable cases: unchanged — `structurally_scoreable_only` and `unsupported` still quarantine, proven by an unmodified sibling test and a new full-chain test (§10).
- No answer-correctness claim beyond what the gate established: enforced by keeping `evidence.outcome === "review_required"` (never `"passed"`) for the new case — see above.
- No direct bypass from `generated`/`structural_validation_passed` into semantic review: unaffected — the corrected candidate still passes through the real correctness gate and lands at `correctness_check_passed`, the same precondition the semantic gate has always required; nothing skips a gate.

**Files changed:** `correctness/orchestrate-correctness-verification.ts` (new outcome variant, `decideTransitionTarget`/`outcomeFromResult` branch), `correctness/validate-cached-replay.ts` (accept the second legitimate replay shape), `correctness-orchestration.test.ts` (one defective test replaced with 5 tests proving the corrected behaviour; sibling `structurally_scoreable_only` test unchanged), `mission3b-integration.test.ts` (rewritten, see §10).

---

## 15. P1-2 remediation — durable, chain-based review-idempotency (full detail)

**Root cause.** The original design appended the review record to the candidate's chain (`repository.update`, write #1) and then separately created a sidecar idempotency report (`repository.create` on a `rv-<hash>` key in the `reports` compartment, write #2). A crash, or any failure, between write #1 succeeding and write #2 completing left the review durably appended with no durable replay key — a resubmission under the same `reviewId` would then be treated as brand new, appending a second, duplicate chain entry.

**Correction — Option A (chain-resident idempotency), as preferred by the remediation brief.** `reviewRecordSchema` gained two additive optional fields, `reviewId` and `reviewResultFingerprint` (`provenance/review-record.ts`), included in the chain's tamper-evidence hash **only when present** (`provenance/review-chain.ts`) — so every pre-existing golden-vector/determinism test continues to pass unchanged. `ingestExternalReview` (`review/review-ingest.ts`) now resolves idempotency by scanning the candidate's own **chain-verified** `reviewRecords` for a record whose `reviewId` matches the submission's, before any binding check and before any mutation:

- No match → fresh submission, proceeds to the ordinary binding checks and append.
- Match with an equal `reviewResultFingerprint` → idempotent replay; the semantic-gate transition is re-attempted (itself replay-safe) so the caller always sees the current status, but **no second chain entry is ever written**.
- Match with a different `reviewResultFingerprint` → `review_id_conflict`, no mutation.

There is no separate sidecar report at all any more — not even as an optimisation. The chain append (`repository.update`, guarded by `expectedContentHash`) is now the **only** durable write this function performs before attempting the semantic-gate transition. This closes the crash window by construction rather than by making the two-write sequence "safer": there is only one write, so there is no window between two writes to be unsafe in.

**Durable idempotency source of truth.** The candidate's own `provenance.reviewRecords` chain — specifically, whichever record (if any) carries a matching `reviewId` — is authoritative. Nothing else is consulted.

**Concurrency behaviour (verified by `review-ingest-crash-safety.test.ts`, genuine `Promise.all` races against a real `FsFactoryRepository`, no sleeps/timing hacks):**
- **Two concurrent identical submissions:** both read the same starting chain and compute byte-identical new chain content; `FactoryRepository.update()`'s own content-hash idempotency (pre-existing, unmodified) means whichever writes first durably lands, and the second observes an identical stored hash and reports `replayed: true` — exactly one effective append, proven by asserting `reviewRecords.length === 1` after both resolve.
- **Two concurrent submissions under the same `reviewId` but different content:** both start from the same idempotency check (no match yet), so both attempt to append; the per-candidate lock inside `update()` serialises them, and the loser's `expectedContentHash` guard fails (`state_mismatch`) because the winner's differently-hashed write already landed. On that specific failure, `ingestExternalReview` re-reads the now-current chain and re-resolves idempotency against it — correctly finding the winner's record under the same `reviewId` with a different fingerprint, and reporting `review_id_conflict` (never a second chain entry, never an opaque internal error). A `state_mismatch` from some genuinely unrelated concurrent write is retried once (bounded — `MAX_APPEND_CONTENTION_RETRIES = 1`, never an unbounded loop) before giving up with `repository_error`.

**Crash-window regression tests** (`review-ingest-crash-safety.test.ts`, 6 tests, all using a fail-once `FactoryRepository` wrapper — no sleeps):
1. The single durable write fails → zero mutation → a fresh call (process-equivalent retry) completes cleanly with exactly one chain entry.
2. An identical resubmission after a prior failed attempt replays cleanly, never appending twice.
3. Two genuinely concurrent identical submissions → exactly one chain entry, one `replayed: false` + one `replayed: true`.
4. Two genuinely concurrent same-`reviewId`-different-content submissions → exactly one chain entry, one accepted + one `review_id_conflict`.
5. A legacy chain record with no `reviewId`/`reviewResultFingerprint` at all (constructed exactly as the pre-P1-2 code would have produced it) remains schema-valid, chain-verifiable, and is correctly never matched by any real `reviewId` scan — a brand-new submission appends cleanly after it.
6. Tampering with a stored record's `reviewId` or `reviewResultFingerprint` (bypassing `appendReviewRecord`) breaks `verifyReviewChain` — both fields are load-bearing tamper-evidence inputs, not decorative.

**Backward compatibility.** Both new fields are `.optional()` on `reviewRecordSchema`; a legacy record (no `reviewId`) parses, verifies, and chains exactly as before. The chain-hash payload includes each field only when present, so no previously-computed `reviewHash` for a record that never set them changes — proven by the pre-existing golden-vector test in `review-chain.test.ts` continuing to pass unmodified.

**Review-ingest ordering re-audit (explicit walkthrough, per the remediation brief's checklist) — current code satisfies every item:**
- Input validation (schema parse) occurs first, before any repository access.
- Candidate binding (state, then revision/content-hash/blueprint-hash) is checked against the record read at the top of this attempt.
- The review chain is verified (`verifyReviewChain`) inside `readEligibleCandidate`, before the `reviewId` scan and before any binding check.
- Idempotency/conflict detection (`resolveIdempotency`) runs immediately after chain verification, before every binding check and before the append.
- The append is guarded by `expectedContentHash` (`repository.update`'s stale-write guard).
- The semantic-gate transition (`attemptSemanticReviewTransition`) is only ever called after `updateResult.ok` is confirmed (both the fresh-append success path and the repository-level-replay path).
- A retry after the append succeeded but the gate-transition attempt failed never duplicates evidence: the `reviewId` scan finds the already-appended record with a matching fingerprint and takes the replay path.
- A retry after the append itself failed never leaves partial state: `update()` performs no disk write at all on failure (verified by test #1 above).
- No rejection path (malformed input, unknown candidate, invalid state, chain corrupt, conflict, stale revision, content/blueprint mismatch, prompt-pack mismatch, unsupported/self-review identity, chain-limit) ever reaches the append call.

**Files changed:** `provenance/review-record.ts` (two additive fields), `provenance/review-chain.ts` (conditional hash inclusion), `review/review-ingest.ts` (full idempotency-logic rewrite; `buildReviewIdempotencyReportId` and the sidecar report removed entirely), `review/index.ts` (barrel export removed), new `review-ingest-crash-safety.test.ts`.

---

## 16. Residual technical debt

- `review_prompt_reference_mismatch` is checked only when a stored `review-pack-<candidateId>` report exists (lenient-if-absent), mirroring `questions:ingest`'s existing `prompt_pack_reference_mismatch` precedent — a human reviewer working from an ad hoc pack copy is never blocked, at the cost of not being able to enforce the cross-check universally.
- The deterministic reviewer's check catalogue (unsafe markup, alt-text leakage, non-AU spelling, rubric completeness, answer/explanation overlap) is real but intentionally small, per the "rule-based, no judgement call" contract constraint (§7) — a future mission may extend it, following the same fixed-catalogue, versioned pattern (`DETERMINISTIC_REVIEW_CHECKS`).
- No `questions:review` (bare deterministic-reviewer) CLI command exists yet — the contract's own module-split places CLI-catalogue completion in 3E/3F; the underlying capability (`DeterministicRuleReviewer`, directly testable) is fully built and ready for that CLI to wrap.
- `DeterministicRuleReviewer`'s `deriveAnswerTexts`/`checkUnsafeMarkup` re-assemble the same small field-selection logic already present in `validation/content-safety-checks.ts` (the underlying detection primitives — `findUnsafeMarkupFields`, `altTextLeaksAnswer` — are properly shared; only the thin wrapper is duplicated); fixing this cleanly would require exporting a previously-module-private helper from Mission 2B's `validation/` barrel, judged out of proportion to the risk. `scripts/questions-review-prompt.mts`/`questions-review-ingest.mts` duplicate `scripts/questions-prompt.mts`/`questions-ingest.mts`'s CLI output-formatting shape (`emit`/`ResultPayload`) and write-output block — consistent with Mission 3A's existing one-script-per-command convention, a shared CLI helper is a reasonable future extraction but not attempted here. `readStringField` is a 3-line type guard duplicated across several files in the codebase — same pattern, not newly introduced.
- The bounded, single retry on an unrelated `state_mismatch` during append (§15) does not distinguish "genuinely unrelated concurrent write" from "a bug causing spurious contention" — in the extremely unlikely event of the latter, the caller sees a `repository_error` after one retry rather than a more specific diagnostic. Judged acceptable given the retry is bounded and the failure mode is fail-safe (no mutation, no duplication) either way.

---

## 17. P1/P2/P3 remediation round 2 — ambiguous review-replay chains (full detail)

**P1 root cause.** `verifyReviewChain()` (`provenance/review-chain.ts`) validated per-record hash linkage (`previousReviewHash`/`reviewHash`) but never checked `reviewId` uniqueness across the chain, while `review-ingest.ts`'s `resolveIdempotency`/`findByReviewId` used `Array.prototype.find`, which always resolves to the *first* matching record. A chain containing two validly-hashed records that happened to share one `reviewId` — however constructed (a bug, a hand-edited restore, a tampered backup) — would let idempotency/conflict resolution silently classify the submission using only the first of the two matching records, leaving the second's durable replay evidence unreachable by any real scan.

**P1 fix.** `verifyReviewChain` now tracks every non-`undefined` `reviewId` seen while walking the chain and reports a new issue code, `duplicate_review_id`, at the index of the second (and any later) occurrence — regardless of whether the two records' `reviewResultFingerprint` values match or conflict. This is enforced at the same trusted full-chain-verification boundary every caller already gates on before doing anything idempotency-sensitive: `review-ingest.ts`'s `readEligibleCandidate` (which every `ingestExternalReview` attempt calls before `resolveIdempotency` ever runs) and `provenance/evidence.ts`'s `isProductionGradeIndependentReview` (via its own `verifyReviewChain` call) both now fail closed on a duplicate-`reviewId` chain — `review_chain_corrupt`, no mutation, no replay resolution ever attempted against the ambiguous chain. No first-match or last-match fallback exists anywhere in the fix.

**P2-1 root cause.** `reviewRecordSchema` allowed `reviewId` and `reviewResultFingerprint` to be set independently — a persisted record with only one of the two (a partially-written record, or a hand-tampered one) parsed as schema-valid, even though the pair only means anything as a unit (a lone `reviewId` is replay-matchable with no fingerprint to disambiguate replay vs. conflict; a lone `reviewResultFingerprint` is orphaned with nothing to key it by).

**P2-1 fix.** A new schema, `persistedReviewRecordSchema` (`provenance/review-record.ts`), wraps `reviewRecordSchema` with a `.superRefine` enforcing that the two fields are both present or both absent, and is used wherever a persisted chain is parsed from trusted storage (`candidateProvenanceSchema.reviewRecords`, `provenance/candidate-provenance.ts`). `reviewRecordSchema` itself is left unrefined and unchanged, because Zod forbids `.omit()`/`.pick()` on a schema carrying refinements and `reviewRecordSchema` is deliberately reused with `.omit(...)` elsewhere for pre-append draft validation (`review-deterministic-rule-reviewer.test.ts`, `review-fixture-reviewer.test.ts`) — the invariant is enforced only at the persisted/full-chain boundary, never at the draft-construction boundary, which is where the schema is legitimately used to validate a record before its `previousReviewHash`/`reviewHash` even exist. Legacy records with neither field remain fully valid.

**P2-1 hash-integrity note.** `reviewHashPayload` (`provenance/review-chain.ts`) already included both fields in the chain hash whenever present (round-1 work, §15) — this round left that logic untouched; the paired-field check is a parse-time structural gate, not a hash change, so no existing `reviewHash` for any record changes.

**P2-2 (test coverage).** New deterministic, sleep-free regression tests, all reusing the existing hand-written fault-injection wrapper pattern (an object overriding only `update()`, delegating everything else to a real `FsFactoryRepository`) rather than a mocking library:
- `review-chain.test.ts`: duplicate `reviewId` with identical fingerprints, duplicate `reviewId` with conflicting fingerprints, distinct `reviewId`s across records (no false positive), multiple legacy records with no `reviewId` at all (absence never counted as a duplicate).
- `review-record-mission3b-fields.test.ts`: `persistedReviewRecordSchema` rejects `reviewId`-without-fingerprint, rejects `reviewResultFingerprint`-without-`reviewId`, accepts both present, accepts a legacy record with neither; `reviewRecordSchema` (unrefined) still accepts an unpaired field, proving the invariant is scoped to the persisted boundary only.
- `review-ingest.test.ts`: a stored chain hand-constructed with two validly-hashed records sharing one `reviewId` is rejected as `review_chain_corrupt` on ingestion under that exact `reviewId` — proving replay resolution is never reached for an ambiguous chain.
- `review-ingest-crash-safety.test.ts`: a new `buildUpdateFailingOnCall` wrapper (fails only the Nth `update()` call, unlike the existing `buildFailingUpdateRepo`, which fails the first N) lets the review-append write succeed while the immediately-following semantic-review-transition write is injected to fail. The test reads directly from the real (non-wrapped) repository between the two calls to prove the append landed durably (`reviewRecords.length === 1`, chain valid) while the lifecycle `state` stayed at `correctness_check_passed` — explicit proof the append happened before, and independently of, the injected transition failure. An identical retry against the real repository then reports `replayed: true`, appends nothing new (`reviewRecords.length` stays `1`), and completes the previously-failed transition (`gateOutcome.outcome === "passed"`, final `state === "semantic_review_passed"`, and the candidate confirmed never misrouted to `quarantined`/`rejected/semantic`). A sibling test proves a *conflicting* retry (same `reviewId`, different content) after the same partial-success setup still returns `review_id_conflict`, never a second append.

**P3 root cause and fix.** `correctness/orchestrate-correctness-verification.ts`'s `orchestrateCorrectnessVerification` doc comment grouped `requires_independent_semantic_review` together with `structurally_scoreable_only` under "review-required → quarantined" — stale text left over from before the round-1 P1-1 fix (§14), which the code itself had already corrected (`decideTransitionTarget`/`outcomeFromResult` route `requires_independent_semantic_review` with no contradiction to `passed_pending_semantic_review`/`correctness_check_passed`, never `quarantined`). The comment now enumerates all four real outcomes distinctly: deterministic correctness pass (`passed`); `passed_pending_semantic_review` (no contradiction, no deterministic derivation possible — advances to `correctness_check_passed`, not quarantined); unsupported/undecidable quarantine (`structurally_scoreable_only` / `unsupported` — `severity: "uncertain"`); correctness contradiction failure (`severity: "hard_fail"` — `rejected`). No behavioural change; comment-only.

**Files changed:** `provenance/review-chain.ts` (`duplicate_review_id` issue code + detection in `verifyReviewChain`), `provenance/review-record.ts` (`persistedReviewRecordSchema`), `provenance/candidate-provenance.ts` (uses `persistedReviewRecordSchema` for `reviewRecords`), `provenance/index.ts` (barrel export), `correctness/orchestrate-correctness-verification.ts` (P3 comment correction only), `review-chain.test.ts`, `review-record-mission3b-fields.test.ts`, `review-ingest.test.ts`, `review-ingest-crash-safety.test.ts` (new regression coverage).

**Validation.** `npm run typecheck`, `npm run lint`, `npm test` (1435/1435 passing, full repository suite), `npm run validate:questions` (100 production questions + 15 showcase fixtures, unchanged), `npm run check:answers`, `npm run build`, `npm run test:e2e` (20/20 passing), and `npm audit --audit-level=moderate` (unchanged residual state: two moderate Next/PostCSS advisories only) all pass against the fixed branch. `src/content/` and the 100-question production bank are untouched by this round.

---

## Explicit statement

Mission 3B P1/P2/P3 remediation (round 2) complete and branch frozen again for independent re-audit. Approval has not been claimed.
