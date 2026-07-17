# Mission 3D — Third Independent Audit Remediation Report

Status: **remediation implemented, tested, and validated. Branch frozen for independent Codex re-audit. Not self-approved.**

Branch: `claude/mission3d-third-remediation`, forked from `integration/governed-question-factory` at the second remediation's own docs commit. Written against the verdict `MISSION 3D REQUIRES FURTHER REMEDIATION`: the second remediation's `validateUpstreamCorrectnessEvidence` authenticated a stored `cv-*` correctness-verification report's *internal self-consistency* (a recomputed `verificationFingerprint`) and its *superficial binding* (candidate id, content hash, blueprint hash, structural-fingerprint reference) to the candidate — but `verificationFingerprint` is a pure, publicly-documented function of the report's own visible fields (`correctness/evidence.ts`). Any caller who can read that file can hand-construct a report whose fingerprint recomputes correctly without the governed correctness workflow (`orchestrateCorrectnessVerification`) ever having run. The same structural gap existed one gate over: nothing durable distinguished a candidate whose semantic review genuinely completed (deterministic-skip or independent-review) from one whose `state` field was simply written directly — the deterministic-skip path in particular had no evidence trail of any kind. This document records the fix for both.

---

## 1. Starting and final SHA

| | |
|---|---|
| Starting HEAD | `a1a9b3390e2fe7ae5993f5d70d459d8848f16240` (`docs: record second Mission 3D audit remediation`) |
| **Final HEAD after this remediation** | `<this commit>` (`docs: record third Mission 3D audit remediation`), on top of the five commits below |
| `main` | `ba9575c572df050ab97244758ead22e5336dcd2c` — unchanged, untouched throughout |
| `integration/governed-question-factory` | unchanged, untouched throughout — this remediation lives entirely on its own branch/worktree, forked from the same commit |
| Local vs. `origin` | This branch does not exist on `origin`; local is ahead of the remote by every commit below (unpushed), mirroring the prior remediation's own end state |

---

## 2. Remediation commits

```
3f8159f feat: add correctness-pass attestation model and shared binding validator
2529487 feat: mint and re-verify correctness-pass attestation in orchestration
4cb2c02 feat: authenticate governed semantic-completion evidence
ea3955e feat: require attestation and semantic-completion evidence in originality
528149f test: adversarial and end-to-end coverage for correctness-pass attestation
<this commit> docs: record third Mission 3D audit remediation
```

Six commits, matching the required commit discipline exactly: (1) attestation model/storage/shared validation, (2) correctness orchestration and crash-safe replay integration, (3) semantic evidence authentication, (4) originality integration, (5) adversarial and end-to-end tests, (6) this report.

---

## 3. Files changed

| File | Commit | Nature |
|---|---|---|
| `correctness/attestation.ts` | 1 | new — the `CorrectnessPassAttestation` model, its fingerprint algorithm, and `buildCorrectnessAttestationId` |
| `correctness/validate-correctness-attestation-binding.ts` | 1 | new — the shared attestation authenticator, reused verbatim by correctness's own replay path and originality's upstream check |
| `correctness/index.ts` | 1 | exports the new model/validator and their types |
| `correctness/orchestrate-correctness-verification.ts` | 2 | mints the attestation on a fresh pass, strictly after the report write and strictly before the lifecycle transition; re-verifies it on cached `correctness_check_passed` replay |
| `review/semantic-completion-evidence.ts` | 3 | new — the `SemanticCompletionEvidence` model (`sr-*`), covering both `deterministic_skip` and `independent_review` completion paths |
| `review/validate-semantic-completion-evidence.ts` | 3 | new — the shared semantic-completion authenticator |
| `review/orchestrate-semantic-review.ts` | 3 | mints `sr-*` evidence on a fresh pass, strictly before the lifecycle transition; extracts `findIndependentReviewerRecordAtThreshold` (record-returning) from the existing boolean-only scan, behaviour-preserving |
| `review/index.ts` | 3 | exports the new model/validator and their types |
| `originality/orchestrate-originality-review.ts` | 4 | reads the candidate's `cva-*` attestation and `sr-*` semantic-completion evidence alongside the existing `cv-*`/`sv-*` reports, before any write |
| `originality/validate-upstream-correctness-evidence.ts` | 4 | requires a genuine, exactly-bound attestation and genuine semantic-completion evidence (recomputing the current classification fresh) before accepting `semantic_review_passed`; removes the now-subsumed inline `hasIndependentReviewerRecordAtThreshold` scan |
| `mission3d-fixtures.ts` | 4 | exports `seedGenerated`; adds `seedLegitimateCorrectnessAttestation`, `seedLegitimateSemanticCompletionEvidence`, and the new `seedAtSemanticReviewPassedViaIndependentReview` (a genuinely-derived-content-free real-chain helper for duplicate/non-arithmetic fixtures); narrows `seedAtSemanticReviewPassedWithFabricatedCorrectness` to adversarial-only use |
| `correctness-orchestration.test.ts`, `mission3d-integration.test.ts`, `mission3d-remediation.test.ts`, `originality-orchestration.test.ts`, `pipeline-runner.test.ts` | 4 | fixtures/assertions updated for the new attestation/evidence requirement; every fixture that previously fabricated a "genuine-shaped" correctness or semantic pass now drives the real orchestrators (`seedCorrectnessCheckPassed`, hard-duplicate seeding) |
| `mission3d-third-remediation.test.ts` | 5 | new — the full required adversarial and end-to-end scenario list |

No file outside `src/features/question-factory/{correctness,originality,review}` and `src/tests/unit/question-factory/` was touched. No `.vscode/` or `design.md` exist in this worktree (never committed to the repo). The production question bank (`src/content/questions/`) has zero diff against the starting SHA. Staging, publication, Supabase, provider adapters, PB2, and Mission 3E were not touched.

---

## 4. The attestation and semantic-completion evidence models

### `CorrectnessPassAttestation` (`cva-*`, `correctness/attestation.ts`)

Canonically binds, per the required control:

- `candidateId`, `candidateContentHash`, `candidateRevision` — the candidate's identity;
- `blueprintHash` — unconditionally required (mandatory `blueprintId`, per the second remediation's own rule, carried forward);
- `structuralEvidenceFingerprint` — the *authenticated* upstream structural report's fingerprint, never a copied-in value;
- `correctnessOutcome` / `correctnessCapability` — exactly the two legitimate pass combinations (`passed`/`deterministically_verifiable`, `review_required`/`requires_independent_semantic_review`);
- `correctnessReportFingerprint` — the exact `cv-*` report's own `verificationFingerprint` this attestation is bound to;
- `verifierVersion`, `scorerVersion`, `schemaVersion`, `taxonomyVersion` — the correctness algorithm/configuration version;
- `attestationFingerprint` — the canonical hash over every field above (never `attestedAt`).

`validateCorrectnessAttestationBinding` (shared by `correctness/orchestrate-correctness-verification.ts`'s own cached-replay re-check and `originality/validate-upstream-correctness-evidence.ts`'s upstream check) proves: existence, well-formedness, candidate ownership, current content/revision/blueprint/structural-fingerprint binding, outcome/capability agreement with the live `cv-*` report, **exact equality between `attestation.correctnessReportFingerprint` and the report's own live `verificationFingerprint`** (the canonical "report is exactly bound to attestation" link), current version combination, and a recomputed `attestationFingerprint`.

Security property this closes: a `cv-*` report's own recomputed fingerprint proves only that the report is internally self-consistent — it says nothing about *origin*. The attestation is minted exactly once, only inside `orchestrateCorrectnessVerification`'s own pass path, and is never re-derivable from a report's content alone (unlike `verificationFingerprint`, `attestationFingerprint` is compared against a value written at the moment of a genuine pass and never recomputed from a tampered report's new content matching it retroactively). If an attacker edits a genuine report's content and recomputes a self-consistent `verificationFingerprint` for the tampered content, the attestation's frozen-at-mint-time `correctnessReportFingerprint` no longer matches — refused.

### `SemanticCompletionEvidence` (`sr-*`, `review/semantic-completion-evidence.ts`)

Binds candidate identity, `semanticClassification` (as it stood at minting), `completionPath` (`deterministic_skip` | `independent_review`), and — for the independent-review path only — `satisfyingReviewHash`, the specific chain record that satisfied the threshold. Minted only inside `attemptSemanticReviewTransition`'s own pass path, strictly before the lifecycle transition.

`validateSemanticCompletionEvidence` (used by originality's upstream check) never trusts the evidence's own self-declared classification: it recomputes `classifySemanticCategory` fresh from the candidate's *current* question content and refuses on any mismatch. For the independent-review path it re-verifies the declared `satisfyingReviewHash` against the candidate's live, chain-verified `reviewRecords` via `isProductionGradeIndependentReview` (reused verbatim, never a second implementation) — a fabricated or stale hash is refused even if the classification field is correct.

This closes the deterministic-skip gap explicitly: previously a `deterministically_computable` candidate's semantic-review completion left no evidence trail at all — lifecycle state alone was the only signal. Any candidate whose correctness capability legitimately requires semantic review (or whose content was edited post-completion to no longer match) is now refused regardless of which path it claims.

---

## 5. Transaction and replay behaviour

Both new records follow the codebase's existing append-only, fingerprint-based replay convention (`repository.create()`, never `update()`, on a matching fingerprint = safe no-op, differing = genuine conflict) — the same discipline `writeReportIfAbsent` already established, reused rather than reinvented.

**Write ordering** (both gates): pure verification → report write → new-evidence write → lifecycle transition write. This ordering is what makes both crash windows converge on retry without any special-cased recovery logic:

- **Crash after report, before attestation/evidence**: the lifecycle transition never ran, so the candidate is still at its pre-transition state. A retry re-enters the same orchestrator, re-runs the pure verification (identical inputs → identical fingerprint), finds the report already present (fingerprint match → no-op), and proceeds to mint the still-missing attestation/evidence.
- **Crash after attestation/evidence, before the transition**: a retry re-verifies, finds *both* the report and the attestation/evidence already present (both no-ops), and only the transition write is retried.
- **Duplicate/conflicting writes are refused**: `writeAttestationIfAbsent`/`writeSemanticCompletionEvidenceIfAbsent` treat a differing stored fingerprint as a hard conflict, never a silent overwrite; `repository.create()` itself refuses a second write to an existing key outright (`reason: "duplicate_candidate"`), independent of the fingerprint check.
- **Cached correctness replay remains valid**: a legitimate `correctness_check_passed` candidate's second `orchestrateCorrectnessVerification` call returns `passed`/`replayed: true` with zero additional writes — the attestation re-check is additive, not a re-derivation.
- **Multi-candidate isolation**: both records carry the candidate id internally and are re-checked against it independently of their storage key, exactly like every other evidence type in this codebase — a swapped-in attestation/evidence belonging to a different (even genuinely valid) candidate is refused with a message naming the real owner.
- **Originality refusal performs zero writes**: the attestation/evidence reads happen in the same read-only "gather upstream evidence" phase `orchestrate-originality-review.ts` already used for the `cv-*`/`sv-*` reports, strictly before `buildCorpus`/`verifyCandidateOriginality`/any write — a refusal returns before any `og-*` report, state change, or compartment move is attempted.

---

## 6. Adversarial test results

`mission3d-third-remediation.test.ts` — 25 tests, all run against a real `FsFactoryRepository`, never mocks, covering the required scenario list:

| # | Scenario | Result |
|---|---|---|
| 1 | Authentic structural evidence + directly fabricated correctness report (deterministic pass) | refused, zero writes |
| 2 | Copied authentic correctness fields (self-consistent `requires_independent_semantic_review` pass) without attestation | refused |
| 3a–d | Missing / wrong-report-binding / stale / duplicate attestation | refused / conflict at storage layer |
| 4 | Wrong candidate id | refused, names the real owner |
| 5 | Wrong content hash | refused |
| 6 | Wrong blueprint hash | refused |
| 7 | Wrong structural fingerprint | refused |
| 8 | Wrong revision | refused |
| 9 | Wrong correctness algorithm/config version (stale `verifierVersion`) | refused |
| 10 | Fabricated `semantic_review_passed` lifecycle state, no `sr-*` at all | refused |
| 11 / 11b | Semantic evidence with mismatched classification / fabricated `satisfyingReviewHash` | refused |
| 12 | Valid deterministic semantic completion | passed |
| 13 | Valid independent semantic-review completion | passed |
| 14 | Valid full real-orchestrator chain, idempotent replay | passed, replayed on second call |
| 15 | Crash after `cv-*` report, before `cva-*` attestation | fails closed, converges on retry |
| 16 | Crash after `cva-*` attestation, before the lifecycle transition | fails closed, converges on retry |
| 17 | Retry convergence — exactly one canonical report and attestation | confirmed both windows |
| 18 | Cached correctness replay remains valid | replayed, zero additional writes |
| 19 | Zero writes on originality refusal | confirmed |
| 20 | Multi-candidate isolation | victim refused, unaffected sibling still passes |
| 21 | Valid five-stage completion to `difficulty_review_passed` | all five gates pass in one `runPipeline` call |

Fixtures were converted from direct fabrication to real orchestrator execution wherever they stood in for a legitimately-passing candidate (`correctness-orchestration.test.ts`'s report count, `pipeline-runner.test.ts`'s `seedCorrectnessCheckPassed`, `originality-orchestration.test.ts` and `mission3d-integration.test.ts`'s hard-duplicate fixtures — now driven through real structural/correctness/independent-review orchestration via a `short_answer`/`text`-answer-key shape and a real `ingestExternalReview` call). Direct fabrication is retained only in `seedAtSemanticReviewPassedWithFabricatedCorrectness`, used exclusively by the explicitly-named rejection tests (1/2 above), and in the new suite's own hand-crafted, self-consistent-but-factually-wrong attestation/evidence overrides for tests 3–11 — never to stand in for a legitimate pass.

Existing coverage (re-verified against the new fixtures, unchanged behaviour): every first- and second-remediation adversarial scenario in `mission3d-remediation.test.ts` (30 tests), the full `originality-orchestration.test.ts` (16 tests) and `mission3d-integration.test.ts` (6 tests) suites, and `pipeline-runner.test.ts`'s full progression/crash-safety coverage (18 tests).

---

## 7. Full validation results

| Command | Result |
|---|---|
| `npm run typecheck` | clean |
| `npm run lint` | clean |
| `npm test` | 1790/1790 passed (86 files) |
| `npm run validate:questions` | all production questions and showcase fixtures valid |
| `npm run check:answers` | 100/100 questions checked, 0 failures |
| `npm run build` | succeeds (Next.js 16.2.10 / Turbopack) |
| `npm run test:e2e` | 20/20 passed |
| `npm audit --audit-level=moderate` | 2 moderate advisories (Next → postcss `GHSA-qx2v-qp2m-jg93`) — unchanged, pre-existing, fix requires a breaking Next downgrade |
| `git diff --check` | clean |

Production bank (`src/content/questions/`) byte-for-byte unchanged. `main` remains `ba9575c572df050ab97244758ead22e5336dcd2c`. `integration/governed-question-factory` remains untouched. No `.vscode/`/`design.md` exist in this worktree. This branch does not exist on `origin` (local ahead by six commits, unpushed).

---

## 8. Residual risks

- **Attestation/semantic-evidence forgery by an attacker with full source and repository write access remains possible in principle**: every check in this system (as in the first and second remediations before it) is tamper-evidence via public, deterministic hashing, not cryptographic signing against a secret held only by the governed workflow process. An attacker who can call `buildCorrectnessAttestation`/`buildSemanticCompletionEvidence` directly (both necessarily exported, since legitimate tests and any future caller need them) and who also fabricates a matching `cv-*`/`sr-*` pair, all internally self-consistent, is not detected by this or any prior remediation — this is a structural property of every evidence type in this codebase, not a gap unique to this fix. What this remediation adds is the requirement that *two independently-keyed, separately-written* records agree, closing the specific "one fabricated artifact suffices" gap the second audit found; it does not introduce out-of-band secret-holding infrastructure, which is out of scope for this codebase's existing conventions.
- **`difficulty/` still trusts `originality/validate-cached-replay.ts`'s own binding, not the full correctness/structural/attestation/semantic chain beneath it** — unchanged from the second remediation's own documented residual risk, and out of this remediation's scope (the required control names originality specifically, not difficulty).
- **`attemptSemanticReviewTransition`'s own cached-replay path** (`state === "semantic_review_passed"` at call time) still returns `passed`/`replayed: true` on lifecycle state alone, without re-checking its own `sr-*` evidence — deliberately out of scope: the required control's enforcement point is explicitly "before originality accepts `semantic_review_passed`," which this remediation satisfies at the originality boundary. Hardening the semantic-review gate's own replay path identically would be a reasonable follow-up but was not attempted here to keep the change scoped to the audited gap and avoid rippling into `review-ingest.ts`/`pipeline-stages.ts`'s consumption of `SemanticReviewOrchestrationOutcome`.

MISSION 3D THIRD REMEDIATION READY FOR CODEX RE-AUDIT
