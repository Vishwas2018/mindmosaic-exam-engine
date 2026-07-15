# Mission 3B — Semantic and External Review

Status: implemented and tested; frozen for independent (Codex) read-only audit. Not self-approved.

Branch: `integration/governed-question-factory`. Starting SHA `af4ba37f699d9a0cbf1f065dffe8c6766bfa6638` (the approved Mission 3A baseline). Stable `main` remains `ba9575c572df050ab97244758ead22e5336dcd2c`, untouched by this work.

Written against `docs/reports/mission3-production/01-mission3-implementation-contract.md` §7-§9 and §20, and `02-prerequisite-decisions.md` PD-2/PD-8. This document records what was actually built, including where implementation had to resolve a genuine ambiguity in the contract text or discovered a cross-mission gap — it is not a restatement of the contract.

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

**Two design ambiguities in the contract text, resolved during implementation (both documented in code comments at their point of use, neither blocking):**

1. **Review-idempotency key storage.** The contract implies a `reviewId -> reviewResultFingerprint` mapping for replay/conflict detection, but `reviewRecordSchema` has no `reviewId` field. Resolved with a separate `reports`-compartment record (`rv-<hash(candidateId:reviewId)>`), mirroring how `correctness`/`structural` already keep out-of-band replay records — avoids further schema churn beyond what §9 explicitly authorises (`recommendedCorrections`).
2. **`insufficient_evidence` outcome semantics.** The contract's outcome table reads "No mutation; review recorded as result: 'warning' at most" — apparently self-contradictory. Read as parallel to the low-confidence/ambiguity rows in the same table: the chain **is** appended (a complete audit trail of every submission), with `result` downgraded from `"passed"` to `"warning"`; only the *lifecycle* transition is refused. Verified in `review-ingest.test.ts`.

---

## 5. Lifecycle and compartment transitions

No new states or compartments. Exercises the already-implemented `correctness_check_passed -> semantic_review_passed | needs_revision | rejected | quarantined` edges (`TRANSITION_TABLE`, unchanged). `semantic_review_passed` maps to the same `review-queue` compartment as `correctness_check_passed` (per `compartmentForState`), so a successful transition is a same-compartment `repository.update()` (content-hash-guarded), not a `move()` — mirroring the correctness gate's own pass-path persistence pattern. A missing-or-insufficient-evidence failure is a real `move()` to `quarantined`, per contract §3's explicit "nothing to revise yet, only a missing review" instruction — never `needs_revision` (the implemented `canAdvanceToSemanticReviewPassed`/`applyTransition` API gives no signal to distinguish "no review at all" from "review exists but insufficient," so both route identically, a documented simplification, not an oversight).

---

## 6. Evidence and replay design

Evidence is the candidate's own `provenance.reviewRecords` chain — no new evidence schema (per contract §19, reused as-is). Every append goes through `appendReviewRecord` (never hand-assembled); `evidenceBinding.reviewResultHash` is computed by a new small helper (`computeReviewResultHash`) since no such computation existed anywhere in the codebase before this. Replay:

- **Identical resubmission under the same `reviewId`**: idempotent — no second chain entry, `attemptSemanticReviewTransition` re-run to report current status, `replayed: true`.
- **Changed resubmission under the same `reviewId`**: refused (`review_id_conflict`), no mutation.
- **Already-advanced candidate**: `attemptSemanticReviewTransition` recognises `state === "semantic_review_passed"` and returns immediately, no re-derivation.
- **Chain integrity**: `verifyReviewChain` is re-run against the *existing* chain before any new append — a corrupted prior chain refuses the append (`review_chain_corrupt`) rather than silently building on top of it.

---

## 7. External review ingestion behaviour

`questions:review-ingest` takes one explicit `--response <file>` path — there is no review inbox directory/compartment (the contract defines none for 3B; `review-prompt`/`review-ingest` are both single-file operations, unlike `questions:ingest`'s directory scan). Full outcome table implemented and tested: `malformed_review_response`, `unknown_candidate`, `invalid_lifecycle_state_for_review`, `stale_review_revision`, `content_hash_mismatch`, `blueprint_hash_mismatch`, `review_prompt_reference_mismatch` (checked only when a stored `review-pack-<id>` report exists, mirroring `questions:ingest`'s own lenient `prompt_pack_reference_mismatch` precedent), `insufficient_evidence` (downgrade, not rejection), `unsupported_reviewer_identity`, `self_review_rejected`, `review_chain_limit_exceeded`, `review_chain_corrupt`, `review_id_conflict`, idempotent replay.

---

## 8. Conflict, quarantine, and crash-recovery behaviour

- **Conflict** (`review_id_conflict`): refused outright, no mutation — proven in both the library test and the CLI subprocess test.
- **Quarantine**: a semantic gate that cannot decide (no qualifying independent review) always quarantines, never guesses a pass and never rejects something not proven wrong.
- **Crash recovery**: unchanged from Mission 2B/2C — the append (`repository.update` with `expectedContentHash`) and the subsequent gate-attempt move both go through the same atomic, lock-guarded, content-hash-replay-safe `FsFactoryRepository` primitives already proven crash-safe by Mission 2B/2C's own test suites; Mission 3B introduces no new filesystem transaction shape.

---

## 9. CLI commands and subprocess coverage

| Command | Exit codes | Subprocess tests |
|---|---|---|
| `questions:review-prompt` | 0 ok / 2 invalid args or candidate / 4 not found / 5 output exists | `cli-questions-review-prompt.test.ts` (7 tests: help, missing arg, unrecognised flag, not-found, happy path + `--json` + written-file verification, conflict-without-`--force`, `--stdout`) |
| `questions:review-ingest` | 0 ok (advanced) / 2 invalid/malformed/self-review / 3 recorded-not-advancing / 4 not found / 5 conflict / 1 internal | `cli-questions-review-ingest.test.ts` (7 tests: help, missing arg, not-found, malformed JSON, happy path, reused-reviewId conflict, self-review rejection) |

Both are non-interactive, JSON-output-capable, and never prompt — matching the contract's universal CLI conventions (§16), reused unchanged from Mission 3A's own script conventions.

---

## 10. Unit and integration test coverage

62 new tests across 8 files:

- `workflow-semantic-classification.test.ts` (24) — PD-2's full per-type/per-kind table, fail-closed default, cross-check consistency with `correctness/`'s existing predicates.
- `review-deterministic-rule-reviewer.test.ts` (10) — every check, the never-"passed"-for-semantic-classes invariant, determinism.
- `review-fixture-reviewer.test.ts` (6) — schema validity, identity resolution/override, recommendedCorrections pass-through.
- `review-prompt-builder.test.ts` (6) — determinism, PD-8 inclusion policy per classification, size bound.
- `review-ingest.test.ts` (21) — the full reviewer-independence matrix and review-integrity matrix (§24 of the contract).
- `review-record-mission3b-fields.test.ts` (6) — additive-schema-field backward compatibility and tamper-evidence.
- `cli-questions-review-prompt.test.ts` (7), `cli-questions-review-ingest.test.ts` (7) — real `tsx` subprocess invocations, sandboxed via `MINDMOSAIC_QUESTION_FACTORY_ROOT`.
- `mission3b-integration.test.ts` (2) — full ingest-to-semantic-review-passed chains.

One pre-existing Mission 2B test (`structural-validation-orchestration.test.ts`, a Windows lock-file-contention race under full-parallel-suite load) flaked once and passed cleanly on immediate rerun in isolation and in the full suite; it does not touch any file this mission changed and is recorded here as an observed, not introduced, flake.

---

## 11. Discovered cross-mission finding (not a Mission 3B defect — recorded for the record)

Mission 2C's already-approved `orchestrateCorrectnessVerification` classifies **any** `semantic_objective`/`manual_review_writing`-classified candidate's correctness result as `review_required`, which its own `decideTransitionTarget` maps to `severity: "uncertain"`, which `decideGateFailureOutcome` always routes to `quarantined` — **unconditionally, regardless of revision count**. This is Mission 2C's own deliberate, already-tested design (`correctness-orchestration.test.ts`: *"quarantines a requires_independent_semantic_review candidate (reading comprehension), never rejects or passes it"*).

**Consequence:** under the real, current gate chain, a `semantic_objective`/`manual_review_writing` candidate can never reach `correctness_check_passed` at all — it is quarantined one gate earlier. Only `deterministically_computable` candidates can currently reach the state Mission 3B's semantic gate assumes as its entry precondition.

**What this means for Mission 3B:** the independent-review path (§7-§9) is implemented exactly per the contract's architecture and is fully exercised by tests that seed a candidate directly at `correctness_check_passed` (the only way to reach that state for these two classifications given the finding above) — this is not a workaround for a Mission 3B bug, it is the only way to test code whose real-world entry precondition is currently unreachable through the live gate chain. The `deterministically_computable` auto-clear path **is** exercised through the real, unmodified gate chain end-to-end (`mission3b-integration.test.ts`'s first test).

**Not fixed here:** per this mission's explicit instruction not to modify or reinterpret approved prior-mission behaviour absent a genuine blocking defect, and because this is arguably intentional (Mission 2C's own correctness-capability model treats "requires independent semantic review" as outside its remit and correctly declines to guess), Mission 2C's orchestrator was left untouched. Closing this gap — most likely by teaching the correctness gate (or a thin wrapper a future pipeline runner introduces) to route `review_required`/semantic content to `correctness_check_passed` rather than `quarantined`, when semantic review is a distinct, later gate — is recorded as residual technical debt for whichever future mission owns the pipeline runner (3C) or a correctness-gate refinement.

---

## 12. Self-review findings and fixes

A five-angle self-review (line-by-line correctness scan, removed-behaviour audit, cross-file caller/callee tracer, reuse/simplification, efficiency/altitude/conventions) ran against the full staged diff before commit. The removed-behaviour audit found nothing (this mission is almost entirely additive). The other four angles surfaced real findings; the following were fixed:

- **`classifySemanticCategory`'s `semantic_objective` branch depended on an unstated cross-file invariant.** It tested `answerKey.kind === "text"` alone, correct only because the production schema's `compatibleAnswerKinds` map happens to restrict `"text"` to `short_answer`/`reading_comprehension` (the latter already handled earlier). Fixed to explicitly test `type === "short_answer" && answerKey.kind === "text"`, matching `correctness/`'s own `isSemanticCategory` exactly and removing the silent dependency on an invariant enforced in an unrelated file (`workflow/semantic-classification.ts`).
- **`questions:review-ingest`'s exit code conflated a genuine internal error with an expected "recorded, not advancing" outcome.** A `repository_error` inside `gateOutcome` (the lifecycle-transition attempt failing after a successful review append) exited `3`, identical to the expected low-confidence/ambiguous/insufficient-evidence case — a caller checking only the exit code could mistake an operational failure for "just needs more review." Fixed: `repository_error` now exits `1` (`scripts/questions-review-ingest.mts`).
- **`hasIndependentReviewerRecordAtThreshold`'s doc comment overclaimed protection it cannot provide.** `expectedTerminalReviewHash` is derived from the same `chain` array being tested, making `isProductionGradeIndependentReview`'s truncated/substituted-chain check a no-op for this specific call site (not exploitable in practice — there is no substitution window within this function's single-read call, and the underlying primitive's other checks, chain-internal integrity, per-record identity binding, independence/confidence/evidence/ambiguity, still apply fully). Comment corrected to state this honestly (`review/orchestrate-semantic-review.ts`).
- **Two efficiency fixes, both zero-risk:** the not-found fallback's two sequential compartment reads (`rejected/semantic`, then `quarantined`) now run via `Promise.all` (mutually-exclusive compartments, safe to parallelise); `DeterministicRuleReviewer.runChecks` now derives `deriveAnswerTexts` once and shares it between `checkAltTextLeakage` and `checkAnswerExplanationConsistency` instead of computing it twice per review.

All four fixes were re-validated: `npm run typecheck`, `npm run lint`, and the full `question-factory` suite (1030/1030) all pass unchanged after the fixes.

## 13. Residual technical debt

- §11 above: the correctness-gate / semantic-gate boundary conflict for `semantic_objective`/`manual_review_writing` candidates.
- `review_prompt_reference_mismatch` is checked only when a stored `review-pack-<candidateId>` report exists (lenient-if-absent), mirroring `questions:ingest`'s existing `prompt_pack_reference_mismatch` precedent — a human reviewer working from an ad hoc pack copy is never blocked, at the cost of not being able to enforce the cross-check universally.
- The deterministic reviewer's check catalogue (unsafe markup, alt-text leakage, non-AU spelling, rubric completeness, answer/explanation overlap) is real but intentionally small, per the "rule-based, no judgement call" contract constraint (§7) — a future mission may extend it, following the same fixed-catalogue, versioned pattern (`DETERMINISTIC_REVIEW_CHECKS`).
- No `questions:review` (bare deterministic-reviewer) CLI command exists yet — the contract's own module-split places CLI-catalogue completion in 3E/3F; the underlying capability (`DeterministicRuleReviewer`, directly testable) is fully built and ready for that CLI to wrap.
- **Deferred from self-review (accepted, not fixed):** `DeterministicRuleReviewer`'s `deriveAnswerTexts`/`checkUnsafeMarkup` re-assemble the same small field-selection logic already present in `validation/content-safety-checks.ts` (the underlying detection primitives — `findUnsafeMarkupFields`, `altTextLeaksAnswer` — are properly shared; only the thin wrapper is duplicated); fixing this cleanly would require exporting a previously-module-private helper from Mission 2B's `validation/` barrel, judged out of proportion to the risk. `scripts/questions-review-prompt.mts`/`questions-review-ingest.mts` duplicate `scripts/questions-prompt.mts`/`questions-ingest.mts`'s CLI output-formatting shape (`emit`/`ResultPayload`) and write-output block — consistent with Mission 3A's existing one-script-per-command convention, a shared CLI helper is a reasonable future extraction but not attempted here. `readStringField` is a 3-line type guard duplicated across four files in the codebase (two pre-existing, two added by this diff) — same pattern, not newly introduced. `review/index.ts` exports several constants (`DETERMINISTIC_REVIEW_CHECKS`, `FIXTURE_REVIEWER_VERSION`, `buildReviewIdempotencyReportId`, etc.) not yet consumed outside their own module — intentional public surface for a future pipeline runner (3C) or reconciliation tooling (3E), not dead code.
- The independent-review-ingestion path (`ingestExternalReview`) performs its chain-append (`repository.update`) and its lifecycle-transition attempt (`attemptSemanticReviewTransition`) as two separate lock acquisitions rather than one atomic transaction. Every internal check fails safe (`expectedContentHash`/metadata-mismatch guards), so no data corruption is possible, but a concurrent mutator racing between the two steps could leave a candidate durably reviewed yet not advanced until a later call retries the gate — surfaced today only as a `repository_error` `gateOutcome` (now correctly exit-coded `1`, see §12) rather than an automatic retry.

---

## Explicit statement

Mission 3B implementation complete and branch frozen for independent Codex audit. Approval has not been claimed.
