# Mission 3D — Independent Audit Remediation Report

Status: **remediation implemented, tested, and validated. Branch frozen for independent Codex re-audit. Not self-approved.**

Branch: `integration/governed-question-factory`. Written against the independent audit report delivered for the Mission 3D range `59376b36fa86459617f5ea29afd11c84af25350c..89842cb0a71daebb747927f577de1e666beccbd7`, which returned **MISSION 3D REQUIRES REMEDIATION** on two confirmed findings (P1-1, P2-1) plus a git-hygiene anomaly. This document records the fix for all three.

---

## 1. Starting and final SHA

| | |
|---|---|
| Audited Mission 3D range | `59376b3` .. `89842cb` (unchanged, still the frozen, audited implementation) |
| Anomalous commit found on HEAD at audit time | `161aed793e708818fff0e23c13e570a0f0908d41` (`chore: add Roo Code repository instructions`) — unrelated to Mission 3D |
| Remediation started from | `89842cb0a71daebb747927f577de1e666beccbd7` (the audited tip, `161aed7` excluded) |
| **Final HEAD after remediation** | `0ee71630e1b0df484a27257a73e09b7ae1141240` (`test: cover Mission 3D evidence and replay remediation`) — the docs commit below lands on top of this |
| `main` | `ba9575c572df050ab97244758ead22e5336dcd2c` — unchanged, untouched, confirmed as merge-base of HEAD and `main` throughout |
| Local vs. `origin/integration/governed-question-factory` | Remote remains at `59376b3`; local is ahead, unpushed |

---

## 2. Git-history treatment of `161aed7`

Preserved, not discarded: `git branch chore/roo-code-instructions 161aed793e708818fff0e23c13e570a0f0908d41` before any remediation work began, then `git reset --hard 89842cb` on `integration/governed-question-factory` to return the working branch to the audited Mission 3D tip. No destructive rewrite — `161aed7`'s content (`.roorules`) remains fully reachable on its own branch for separate review/merge if wanted; only the mutable branch pointer of `integration/governed-question-factory` moved, and nothing had been pushed past `59376b3` so no shared/remote state was disturbed. `git diff --check` against the full remediated range is now clean (the prior failure was entirely attributable to `.roorules`' trailing whitespace, which is no longer on this branch).

---

## 3. Remediation commits

```
6a1c5a0 fix: require upstream evidence for originality and difficulty      (P1-1)
f1492e1 fix: align originality corpus fingerprint semantics                (P2-1)
0ee7163 test: cover Mission 3D evidence and replay remediation
<this commit> docs: record Mission 3D audit remediation
```

Commits 1–2 are source-only (the two `fix:` commits touch no test file); commit 3 is test-only. This was a deliberate split, not an artifact of convenience: commit 1's new upstream-evidence check and commit 2's corpus-fingerprint consistency fix are independently reviewable, and no *source* file needed both patches simultaneously to compile — `difficulty/orchestrate-difficulty-review.ts`'s reuse of `computeCurrentOriginalityCorpusFingerprint` only needed that function to be *exported and parameterised* (landed in commit 1), not yet self-exclusion-correct (landed in commit 2). Verified independently: after staging commit 1's exact file set, `git stash push --keep-index` was used to isolate that snapshot and confirm it type-checks standalone before committing.

---

## 4. Files changed

| File | Commit | Nature |
|---|---|---|
| `config/mission3d-issue-codes.ts` | 1 | +2 issue codes (one per gate) |
| `originality/validate-upstream-correctness-evidence.ts` | 1 | new |
| `originality/orchestrate-originality-review.ts` | 1, 2 | new outcome variant + check wiring (1); corpus-id self-exclusion fix (2) |
| `originality/validate-cached-replay.ts` | 1 | defensive malformed-shape guard |
| `originality/index.ts` | 1, 2 | export new validator/outcome (1); export `computeCurrentOriginalityCorpusIds` (2) |
| `difficulty/orchestrate-difficulty-review.ts` | 1 | reuses `validateCachedOriginalityReplay` as its own upstream check |
| `mission3d-fixtures.ts` | 3 | new legitimate-evidence seeding helpers |
| `originality-orchestration.test.ts`, `difficulty-orchestration.test.ts`, `pipeline-runner.test.ts`, `mission3d-integration.test.ts` | 3 | fixtures updated to plant genuine upstream evidence |
| `mission3d-remediation.test.ts` | 3 | new, 18 tests, the audit's full adversarial list |

No file outside `src/features/question-factory/{originality,difficulty,config}` and `src/tests/unit/question-factory/` was touched. `.vscode/` and `design.md` remain untracked and untouched throughout (confirmed via `git status --short` before and after every commit).

---

## 5. Exact upstream-evidence validation rules (P1-1)

### Originality (`validateUpstreamCorrectnessEvidence`, new)

Before running fresh originality verification (`candidate.state === "semantic_review_passed"`), the orchestrator now reads the candidate's `cv-*` correctness report and requires, in order:

1. Candidate provenance parses; `candidateId` matches the record it's stored under.
2. The `cv-*` report exists (`originality_upstream_evidence_invalid` if not — zero writes).
3. The report's shape is well-formed (`result`/`result.evidence` are real objects — a defensive runtime guard, never a throw on corruption).
4. `report.candidateId` and `evidence.candidateId` both match the requested candidate (catches a wrong-candidate report).
5. The stored outcome is one of exactly two legitimate states — mirroring `correctness/orchestrate-correctness-verification.ts`'s own "passed_pending_semantic_review" contract verbatim: `status: "passed"` + `capability: "deterministically_verifiable"`, **or** `status: "review_required"` + `capability: "requires_independent_semantic_review"`.
6. `evidence.candidateRevision` / `evidence.candidateContentHash` match the candidate's *current* provenance (staleness).
7. `evidence.blueprintHash`, when the evidence declares one, strictly matches the candidate's current verified blueprint hash (an unblueprinted candidate that legitimately never had one is never vacuously rejected — see the file's own doc comment).
8. `schemaVersion` / `taxonomyVersion` / `verifierVersion` / `scorerVersion` are all current.
9. The correctness fingerprint recomputes identically (`computeCorrectnessVerificationFingerprint`, reused verbatim from `correctness/` — tamper detection).
10. If the legitimate outcome was the `requires_independent_semantic_review` branch, `hasIndependentReviewerRecordAtThreshold` (reused verbatim from `review/`) must independently confirm real, sufficient, independent reviewer evidence exists in the candidate's *current* `provenance.reviewRecords` — never trusted from the stored report alone.

Any single failure refuses with `upstream_evidence_invalid`, zero report writes, zero transitions.

### Difficulty (reuses `validateCachedOriginalityReplay` verbatim — no new validator)

Before running fresh difficulty verification (`candidate.state === "originality_review_passed"`), the orchestrator now reads the candidate's `og-*` originality report and calls originality's **own** cached-replay validator directly (imported from `originality/`), passing the difficulty candidate object (structurally and nominally the same `QuestionFactoryCandidate` type both modules re-export from `validation/`) and the current blueprint hash / live corpus fingerprint. This function already independently re-proves: candidate/report/evidence identity binding, revision/content-hash staleness, blueprint-hash binding, corpus-fingerprint currency, `checkerVersion`/`normalisationVersion` currency, stored-outcome legitimacy, and a recomputed originality fingerprint — exactly the same fact set difficulty needs, so no near-duplicate logic was written. Its `OriginalityIssue[]` result is adapted into `DifficultyIssue[]` under one umbrella code before being returned.

---

## 6. Issue codes and failure destinations (P1-1)

| Code | Gate | Outcome | Destination |
|---|---|---|---|
| `originality_upstream_evidence_invalid` | originality | `upstream_evidence_invalid` | refusal — zero report write, zero transition |
| `difficulty_upstream_evidence_invalid` | difficulty | `upstream_evidence_invalid` | refusal — zero report write, zero transition |

Both mirror `correctness/`'s existing `cached_replay_integrity_failure` "one code, many messages" convention deliberately — the distinguishing detail (missing / malformed / wrong-candidate / stale-content / stale-version / illegitimate-outcome / insufficient-reviewer-evidence) lives in each issue's `path`/`message`, never in a proliferation of near-duplicate codes. Both are first-class `OriginalityOrchestrationOutcome`/`DifficultyOrchestrationOutcome` variants (`{outcome, candidateId, issues}`), not text embedded in a generic error.

---

## 7. Corpus-fingerprint fix (P2-1)

`computeCurrentOriginalityCorpusFingerprint` (replay time) and `buildCorpus` (fresh-verification time, feeding the evidence's own `corpusScope.corpusFingerprint`) previously used two independently-written filters: the former did not exclude the candidate's own id from the sorted production-bank id list, the latter did. In the edge case of a candidate id colliding with a real production-bank id, this caused a **false** `originality_corpus_drift_detected` refusal on the very next replay attempt, even with nothing actually changed.

Fix: both now derive from one shared `corpusIds(excludeCandidateId)` function — same self-exclusion rule, same sort, same id projection, same `hashJson` call — so the two can never disagree by construction. `computeCurrentOriginalityCorpusIds` is exported alongside the fingerprint function so real evidence builders (production code and test fixtures alike) can construct a `corpusScope` that is fingerprint-consistent without re-deriving the same filter by hand.

---

## 8. Adversarial test results

All 18 new tests in `mission3d-remediation.test.ts` pass against a real `FsFactoryRepository` (no mocks), covering the audit's exact required list:

| # | Scenario | Result |
|---|---|---|
| 1 | Forged `semantic_review_passed`, no upstream evidence | refused, `upstream_evidence_invalid`, zero writes |
| 2 | Forged `originality_review_passed`, no `og-*` report | refused, `upstream_evidence_invalid`, zero writes |
| 3 | Missing upstream report (explicit message assertions) | refused, both gates |
| 4 | Malformed report (`result` corrupted to a non-object) | refused, never throws, both gates |
| 5 | Wrong-candidate report (attacker's report copied onto victim's key) | refused, both gates |
| 6 | Stale candidate/content binding (contentHash / revision drift) | refused, both gates |
| 7 | Stale corpus/configuration binding (verifier version / corpus fingerprint) | refused, both gates |
| 8 | Successful retry after valid evidence restoration | refused → legitimate evidence planted → **passes** |
| 9 | Multi-candidate isolation | forged candidate refused; legitimate sibling unaffected |
| 10 | Candidate-id/production-id collision, unchanged replay | fresh pass, then **replay succeeds** (`replayed: true`), never corpus drift |
| 11 | Zero invalid writes on refusal | `review-queue` record and `reports` list byte-for-byte unchanged |
| 12 | Legitimate five-stage pipeline remains green | `runPipeline` reaches `difficulty_review_passed` in one call |

Cached replay, crash recovery, and idempotency for both gates' own terminal-state replay paths (unrelated to the P1-1 fresh-entry gap) were re-verified intact via the full pre-existing `originality-orchestration.test.ts`/`difficulty-orchestration.test.ts` suites, now updated to seed genuine upstream evidence rather than a bare state.

---

## 9. Full validation results

```
npm run typecheck            clean
npm run lint                  clean
npm test                      1753/1753 passing (85 files; +18 net new tests)
npm run validate:questions    100 production questions + 15 showcase fixtures, all valid
npm run check:answers         100/100 checked, 0 failures (58 pre-existing warnings)
npm run build                  Next.js 16.2.10 production build: compiled successfully
npm run test:e2e               20/20 Playwright tests passing
npm audit --audit-level=moderate   exactly 2 moderate advisories (Next/PostCSS), unchanged
git diff --check               clean
```

Production bank (`src/content/`) confirmed byte-for-byte unchanged against both the Mission 3D start point and `main` (`git diff --stat` empty both ways). `main` confirmed unchanged at `ba9575c572df050ab97244758ead22e5336dcd2c`. `.vscode/` and `design.md` confirmed untracked and untouched throughout.

---

## 10. Residual risks

Carried forward from the audit report, not addressed by this remediation (out of the bounded scope the audit and this remediation both define):

- Comparable-text scope for originality still excludes visual/structured/answer-bearing content (disclosed, spec-compliant per the approved plan, not a defect).
- The difficulty estimator still has no signal for visual/interactive complexity (disclosed structural-proxy limitation).
- The inherited, systemic content-mutation-without-provenance-update gap (a direct filesystem edit to `question` without updating `provenance.contentHash` bypasses replay detection) remains — confirmed present in `correctness/`'s own cached-replay validator too, pre-existing and out of this mission's scope.
- Windows test-suite flakiness under parallel execution for lock-based concurrency tests (unrelated to Mission 3D's own files) was observed once during validation and did not reproduce on retry.

No new residual risk was introduced by this remediation; P1-1 and P2-1 are fully closed as specified.

---

## Explicit statement

Both audit findings (P1-1, P2-1) are remediated, tested against real adversarial scenarios with a real filesystem repository, and validated against the full mandatory suite. The unrelated `161aed7` commit has been separated onto its own branch without discarding it. Branch frozen for independent Codex re-audit. Approval has not been claimed.
