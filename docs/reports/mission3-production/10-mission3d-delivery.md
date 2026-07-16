# Mission 3D — Originality and Difficulty Gates — Delivery Report

Status: **implemented, tested, and validated. Branch frozen for independent Codex audit. Not self-approved.**

Branch: `integration/governed-question-factory`. Implementation started at `59376b336fa86459617f5ea29afd11c84af25350c` (the plan's original-text commit), after the pre-implementation amendment landed at `c28b64a` (`docs: clarify Mission 3D plan before implementation`). Written against `docs/reports/mission3-production/09-mission3d-plan.md` (as amended by its own §0) — every acceptance criterion in that document's §11 is addressed below. `main` remains untouched, at `ba9575c572df050ab97244758ead22e5336dcd2c`; nothing has been merged.

---

## 1. Scope delivered

- `originality/` — a new gate module: pure token-3-gram-Jaccard similarity (`similarity.ts`), evidence/fingerprint builder (`evidence.ts`), the pure decision function (`verify-candidate-originality.ts`), cached-replay validation with corpus-drift detection (`validate-cached-replay.ts`), and repository orchestration (`orchestrate-originality-review.ts`).
- `difficulty/` — a new gate module: a deterministic structural-proxy estimator (`estimate-difficulty.ts`), evidence/fingerprint builder (`evidence.ts`), the pure decision function (`verify-candidate-difficulty.ts`), cached-replay validation (`validate-cached-replay.ts`), and repository orchestration (`orchestrate-difficulty-review.ts`).
- `config/mission3d-issue-codes.ts` — the closed issue-code catalogue for both gates, the single source of truth `originality/types.ts` and `difficulty/types.ts` import from (mirroring `revision/types.ts`'s `RevisionIssueCode` import convention, not `correctness/types.ts`'s older self-contained-catalogue convention).
- `pipeline/pipeline-stages.ts` — extended from 3 to 5 entries (`+originality`, `+difficulty`); `pipeline/pipeline-types.ts`'s `GateResult.gate` and `PipelineStage.name` unions widened to match. `pipeline/pipeline-runner.ts`'s control-flow loop is untouched — only its doc comment was corrected to describe the new stop point.
- `scripts/questions-pipeline.mts` — doc comment updated, and (a correction to the original plan text's "comment-only" claim — see §12's original text and this doc's §3a) the `exitCodeFor` success-state literal updated from `"semantic_review_passed"` to `"difficulty_review_passed"`.
- Nine new test files (§10) plus targeted, necessary updates to five pre-existing Mission 3C test files whose literal `"semantic_review_passed"` terminal-state assertions were made stale by the pipeline's legitimate extension (§3b).
- A pre-implementation plan amendment (`docs/reports/mission3-production/09-mission3d-plan.md` §0, commit `c28b64a`) closing six specification gaps before any code was written.

**Explicitly not built:** staging, publication, `questions:stage`/`questions:publish`, Supabase, any new CLI command, live provider adapters, production-bank content changes, PB1/PB2/PB3 ingestion, and any change to `workflow/states.ts`, `workflow/transitions.ts`, `revision/`, `review/`, `validation/`, or `correctness/`. All of the above remain out of scope for this mission, per the plan's §1d and the task's explicit exclusions — Mission 3E's responsibility, not this one's.

---

## 2. Pre-implementation plan amendment

Before any gate code was written, `09-mission3d-plan.md` was amended (§0 of that document, committed separately as `c28b64a`, ahead of the five gate-implementation commits) to pin the exact starting SHA and close six specification gaps the original plan text had left implicit: deterministic originality-corpus fingerprint and replay invalidation, the exact originality comparison algorithm/thresholds/classifications, measurable difficulty-assessment signals and the unsupported-review outcome, exact failure destinations and issue codes, and five-stage pipeline replay/resume behaviour. The implementation below matches that amended specification exactly; no further deviation was introduced during coding.

---

## 3. Precise implementation clarifications beyond the plan's literal text

### 3a. `exitCodeFor`'s success-state literal is a logic change, not a comment-only one

The original plan text (§7) asserted the CLI update would be "comment-only." During implementation this was found to be inaccurate: `scripts/questions-pipeline.mts`'s `exitCodeFor()` hardcodes the pipeline's success end-state as a literal string (`result.endState !== "semantic_review_passed"`), which is executable logic, not documentation. The amendment (plan §7, updated) already flagged this before implementation began; this delivery confirms the one-line fix was made exactly as specified, and no other CLI code path (`parseArgs`, argument shape, exit-code-for-refusal branches) changed.

### 3b. Five pre-existing Mission 3C test files required literal-state updates, not logic changes

Extending `PIPELINE_STAGES` from three entries to five is, by design, an additive change with real behavioural consequences for any test that previously asserted `"semantic_review_passed"` as a *terminal* state: it no longer is one. Five files needed updates: `pipeline-runner.test.ts`, `pipeline-runner-crash-safety.test.ts`, `mission3c-integration.test.ts`, `cli-questions-pipeline.test.ts`, and `pipeline-stages.test.ts` (the last already covered under §8 below). In every case the fix was to update the *expected terminal state* to reflect where the same fixture content now legitimately lands under the two new gates — never to weaken an assertion or change gate logic to make an old assertion pass. Two categories of change resulted:

- **Clean passes.** Fixtures using the `"What is 23 + 19?"`-shaped computable-arithmetic prompt (short, simple-vocabulary, declared `difficulty: "easy"`) now legitimately reach `difficulty_review_passed` — both new gates confirm cleanly (originality: distinct from the real production corpus; difficulty: the deterministic estimate for this short, simple text lands in the `easy` band, matching the declared blueprint difficulty). Assertions were updated from `"semantic_review_passed"` to `"difficulty_review_passed"`, and `gateResults` arrays extended to include the `originality`/`difficulty` entries.
- **A genuine, real difficulty mismatch.** The `semanticObjectiveCandidate()` fixture (prompt `"What is the main idea of the passage?"`, declared blueprint `difficulty: "medium"`) is short and vocabulary-simple; the deterministic estimator genuinely places it in the `easy` band, a real 0.5 deviation against the declared `medium` band (exceeding the `0.15` tolerance). This is not a test artefact — it is the difficulty gate correctly refusing to accept a declared-but-unsupported difficulty claim, exactly the governance behaviour PD-4 and this mission's §4b require ("do not silently accept author-declared difficulty"). Three assertions across two files were updated from `"semantic_review_passed"` to `"needs_revision"`, each with a comment explaining the real, deterministic cause (never silently changed without explanation).

No gate logic, threshold, or fixture *content* was altered to make these tests pass — only the expected terminal state, matching what the gates genuinely (and correctly) compute for that unchanged fixture content.

### 3c. `finalOutcomeFrom` — a correctness fix caught during implementation, not shipped as originally drafted

Both orchestrators' first draft mirrored `correctness/orchestrate-correctness-verification.ts`'s `outcomeFromResult` pattern, which recomputes the failure destination via `decideGateFailureOutcome` with a **hardcoded `revisionCount: 0`** when reconstructing an outcome label after persistence. This is harmless for `correctness/` (which only ever produces `hard_fail`/`uncertain` severities, neither of which is revision-count-sensitive), but originality's `structurally_similar` classification and difficulty's `mismatch` outcome are both genuine `soft_fail` severities — revision-count-sensitive by design. Reusing the hardcoded-`0` pattern would have risked reporting `needs_revision` as the outcome label even when the *real* revision count had already exhausted the budget and the actually-persisted transition was `rejected` — a label/state divergence bug. This was caught before any test was written against it (not found via a failing test) and fixed by replacing the pattern with `finalOutcomeFrom(result, candidateId, replayed, target)`, which always takes an **already-decided** target (the exact value just computed with the real revision count, or a value structurally guaranteed correct for the replay/terminal-reconstruction paths — see the function's own doc comment in each `orchestrate-*-review.ts`) rather than re-deriving it. Both orchestrators ship with this corrected pattern; no test in §10 exercises the specific divergence this would have caused, since it was fixed pre-emptively, but the revision-budget-exhaustion test (`difficulty-orchestration.test.ts`, "routes to rejected once the revision budget is exhausted") exercises the code path that would have been affected.

---

## 4. Originality gate (as delivered, matches the amended plan §4a/§5b exactly)

- **Algorithm.** Token 3-gram Jaccard similarity over normalised comparable text (`prompt` + `stimulus?.body` + joined `options[].text`, never `explanation`). Normalisation: Unicode NFKC → lower-case → strip non-`[a-z0-9\s]` → collapse whitespace → trim (`ORIGINALITY_NORMALISATION_VERSION = "1"`). Shingling/comparison: `ORIGINALITY_CHECKER_VERSION = "1"`.
- **Classification.** `distinct` (< 0.6, passes), `structurally_similar` (0.6–0.85, soft-fail → `needs_revision`/`rejected` by budget), `substantive_duplicate` (0.85–<1.0, hard-fail → `rejected` direct), `exact_duplicate` (= 1.0, hard-fail → `rejected` direct). A candidate whose own comparable text normalises to zero tokens is `uncertain` → `quarantined` (`originality_comparison_failed`), never silently passed.
- **Corpus.** The live `questionBank` (`@/content/questions/question-bank`), excluding the candidate's own id defensively. `corpusScope.corpusFingerprint = hashJson([...sorted corpus ids])`.
- **Corpus-drift replay.** `validate-cached-replay.ts` recomputes the current corpus fingerprint and refuses replay (`originality_corpus_drift_detected`, `replay_integrity_failure`, zero writes) on any mismatch, on either version tag (`checkerVersion`/`normalisationVersion`), or on the strict "verified, non-empty" `blueprintHash` guard (mirroring `correctness/validate-cached-replay.ts`'s own guard exactly).
- **Blueprint binding.** `blueprintHash` is resolved via `resolveBoundBlueprint` verbatim, purely for evidence binding — the similarity decision itself never reads blueprint content. Optional: a candidate with no declared `blueprintId` proceeds with `blueprintHash` absent (mirrors `correctness/`'s own leniency for the unblueprinted-manual-ingestion placeholder); a candidate that *declares* a blueprint id that fails to resolve refuses outright (`blueprint_unresolved`, zero writes).

## 5. Difficulty gate (as delivered, matches the amended plan §4b exactly)

- **Three deterministic signals**, computed from the candidate's own comparable text and explanation, never from `metadata.difficulty` (the author's own claim): reading load (word-count-normalised), vocabulary complexity (average stripped word length + long-word fraction), and a reasoning-step proxy (explanation sentence count). Combined into a single 0–1 score, banded into `easy`/`medium`/`challenging`.
- **`declaredDifficulty`** is always the resolved bound blueprint's own `difficulty` field (`resolveBoundBlueprint`, reused verbatim — never a second lookup), never the candidate's self-reported metadata.
- **Five typed outcomes**, matching the plan §4b table exactly: `confirmed` (passes), `mismatch` (soft-fail, real confident deviation), `insufficient_evidence` (confidence below `0.5`, quarantined), `stale_replay` (`difficulty_replay_drift_detected`, `replay_integrity_failure`), `invalid_blueprint` (`blueprint_unresolved`, a first-class outcome variant — not text embedded in a generic error, a deliberate strengthening over `correctness/`'s current shape, adopting `revision/`'s already-precedented structured pattern instead).
- **Blueprint binding is mandatory**, unlike originality's optional one: `declaredDifficulty` cannot exist without a resolved blueprint, so a missing or unresolvable `blueprintId` refuses outright before any evidence write.

---

## 6. Pipeline stage registry (as delivered, matches the amended plan §5a/§5d exactly)

`PIPELINE_STAGES` is exactly the 5-entry array `structural → correctness → semantic → originality → difficulty`, verified by `pipeline-stages.test.ts`'s exact-order assertion. `pipeline-runner.ts`'s control-flow loop received zero logic changes — confirmed by direct inspection (it reads only `stage.acceptsState`/`stage.run`/`.gate`/`.outcome`/`.endState` off whatever `PIPELINE_STAGES` contains) and by the full pre-existing Mission 3C test suite continuing to pass unmodified in its assertion *logic* (only expected terminal-state literals changed — §3b). Mid-pipeline resume (`mission3d-integration.test.ts`, "stage ordering and resume"), the hard stop at `difficulty_review_passed` (both `mission3d-integration.test.ts` and the pre-existing `cli-questions-pipeline.test.ts`), and crash recovery (both new orchestration test files, mirroring `orchestrateCorrectnessVerification`'s own documented partial-failure-recovery contract verbatim) are all explicitly tested.

---

## 7. Reuse discipline (as delivered)

Confirmed by direct inspection of every new file: `resolveBoundBlueprint` (`shared/bound-blueprint.ts`) is imported and called verbatim in both orchestrators — no second blueprint-lookup implementation exists anywhere in `originality/` or `difficulty/`. `decideGateFailureOutcome` (`workflow/policies.ts`) is the only severity→destination policy function called by either orchestrator — no new policy function was written. `hashJson` (`provenance/content-hash.ts`) is the only hashing primitive used for every fingerprint (`originalityFingerprint`, `difficultyFingerprint`, `corpusFingerprint`). The `writeReportIfAbsent`/`attemptUpdate`/`attemptMove` idempotent-persistence idiom is reused structurally (each gate defines its own ~15-line copy with its own report-shape's fingerprint field name, exactly matching the codebase's existing per-gate convention — `correctness/`, `validation/`, and now `originality/`/`difficulty/` each have their own copy, never a shared generic utility). `parseCandidateProvenance`/`parseCandidateQuestion` (`validation/`) are reused for both new gates' trust-boundary re-parse, never re-declared.

---

## 8. Test coverage and final aggregate

| File | Tests | Focus |
|---|---|---|
| `originality-similarity.test.ts` | 22 | Pure similarity metric: normalisation, tokenisation, shingling, exact Jaccard boundary values at 0.6 and 0.85, Unicode canonicalisation, determinism. |
| `originality-verify-candidate.test.ts` | 9 | Pure decision function: exact/substantive/structurally-similar/distinct classification, threshold-wiring proof, zero-token quarantine, malformed-provenance quarantine, empty-corpus pass, top-5 bounding, determinism. |
| `originality-orchestration.test.ts` | 16 | Real-repository orchestration against the live production corpus: fresh pass, exact-duplicate rejection (never consumes a revision slot), replay safety, corpus-drift replay refusal (fingerprint and version), crash recovery (update and move), lifecycle-state enforcement, not-found, missing-blueprint zero-progression, multi-candidate isolation, no staging/publication reach. |
| `difficulty-estimate.test.ts` | 17 | Pure estimator: exact boundary values for reading-load (20/60 words), vocabulary complexity, reasoning-step proxy, and confidence (the 4-word / 0.5 boundary); band-deviation arithmetic; determinism. |
| `difficulty-verify-candidate.test.ts` | 6 | Pure decision function: confirmed, mismatch, insufficient-evidence (unsupported), malformed-provenance quarantine, author-declared-difficulty-is-never-trusted, determinism. |
| `difficulty-orchestration.test.ts` | 16 | Real-repository orchestration: confirmed/mismatch/insufficient-evidence, revision-budget exhaustion, replay safety, estimator-version replay refusal, crash recovery, lifecycle-state enforcement, missing-blueprint zero-progression (both "no id declared" and "id doesn't resolve"), multi-candidate isolation, no staging/publication reach. |
| `mission3d-integration.test.ts` | 6 | Full production-path run via real `runManualIngestion` + `runPipeline`: all five stages in order ending at `difficulty_review_passed`; the hard stop (a second call halts with zero gate calls); a hard-duplicate-of-real-production-content rejection; mid-pipeline resume (one gate call, not five); multi-candidate isolation across a full batch; zero progression when the bound blueprint is deleted before the originality stage runs. |
| `mission3d-fixtures.ts` | — | Shared, non-test fixture helpers (blueprint/provenance/state seeding), mirroring `correctness-fixtures.ts`'s convention. |
| `pipeline-stages.test.ts` (extended, +1 net) | 5 | `PIPELINE_STAGES` is exactly the 5-entry array in exact order; unique `acceptsState` per stage; every stage exposes `run`/`preview`. |

**Aggregate: 92 tests in wholly new files, plus 1 net-new test in the extended `pipeline-stages.test.ts` = 93 new tests.** Full suite: **1735 tests across 84 files, all passing** (including the five pre-existing Mission 3C files updated per §3b, whose own test counts are unchanged — only their expected terminal-state literals were corrected).

---

## 9. Mandatory validation results

```
npm run typecheck        clean
npm run lint              clean
npm test                  1735/1735 passing (84 test files)
npm run validate:questions  100 production questions + 15 showcase fixtures, all valid
npm run check:answers     100/100 checked, 0 failures (58 warnings, pre-existing/unrelated)
npm run build              Next.js 16.2.10 production build: compiled successfully
npm run test:e2e           20/20 Playwright tests passing
npm audit --audit-level=moderate   exactly 2 moderate advisories (Next/PostCSS, pre-existing, unchanged)
git diff --check           clean
git status --short         only this mission's new/modified files; .vscode/ and design.md pre-existing and untouched
```

Residual state matches the plan's §9 expectation exactly: 100 production questions, 15 showcase fixtures, exactly two moderate advisories, `src/content/` untouched beyond read-only corpus access, zero `staged`/`published` call sites (confirmed by direct grep — the only match is a doc comment stating `"staged"` is not yet a legal `corpusScope.source` value), `main` untouched.

---

## 10. Residual technical debt and deferred items

- The four Mission 3C hardening follow-ups recorded in the plan's §10 were **not picked up** in this mission — left exactly as recorded, tracked separately, per the plan's own instruction not to fold them silently into new-gate commits.
- Originality's "corpus unreadable" defensive path (`originality_corpus_unreadable`, a `repository_error` outcome) has no dedicated unit test: the production corpus is a static, always-available in-repo import, so there is no realistic way to make it fail without dependency injection this mission's scope does not call for. The code path is a belt-and-braces refusal (`try`/`catch` around the corpus build), not an untested assumption of success.
- Staging, publication, and any comparison against a `"staged"` corpus source remain entirely Mission 3E's scope, as planned.

---

## Explicit statement

Implementation complete: both gates built, wired into the five-stage pipeline registry, fully tested, and validated against every mandatory command. Branch frozen for independent Codex audit. Approval has not been claimed.
