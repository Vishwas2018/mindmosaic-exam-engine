# Mission 3D — Second Independent Audit Remediation Report

Status: **remediation implemented, tested, and validated. Branch frozen for independent Codex re-audit. Not self-approved.**

Branch: `integration/governed-question-factory`. Written against a second independent audit finding on the Mission 3D originality gate's upstream-evidence check, which found that `validateUpstreamCorrectnessEvidence` accepted incomplete or fabricated evidence: `evidence.blueprintHash` was optional even for a blueprint-bound candidate, the embedded `structuralEvidenceFingerprint` was trusted without loading and validating the structural-validation report it claimed to reference, and the remediation's own tests fabricated "valid" correctness reports directly rather than producing them through the real orchestrators. This document records the fix for all three.

---

## 1. Starting and final SHA

| | |
|---|---|
| Starting HEAD | `e34cee4264cc401704c3ee6b0dd6b3310cf2858b` (`docs: record Mission 3D audit remediation` — the first remediation's docs commit) |
| **Final HEAD after this remediation** | `<this commit>` (`docs: record second Mission 3D audit remediation`), on top of the two commits below |
| `main` | `ba9575c572df050ab97244758ead22e5336dcd2c` — unchanged, untouched throughout |
| Local vs. `origin/integration/governed-question-factory` | Remote remains behind; local is ahead, unpushed |

---

## 2. Remediation commits

```
32be47a fix: authenticate Mission 3D upstream evidence chain
8b161f2 test: reject fabricated Mission 3D upstream evidence
<this commit> docs: record second Mission 3D audit remediation
```

Source and test changes are split into separate commits, mirroring the first remediation's convention: commit 1 is the production authentication fix; commit 2 updates every fixture the new check makes stricter and adds the audit's adversarial scenario list.

---

## 3. Files changed

| File | Commit | Nature |
|---|---|---|
| `validation/validate-structural-evidence-binding.ts` | 1 | new — the shared structural-report authenticator |
| `validation/index.ts` | 1 | exports the new helper and its types |
| `correctness/validate-cached-replay.ts` | 1 | inline structural-report block replaced with a call to the shared helper (behaviour-preserving refactor, plus a new defensive malformed-report guard) |
| `originality/validate-upstream-correctness-evidence.ts` | 1 | unconditional blueprint-hash binding; structural report is now loaded and authenticated via the shared helper before its fingerprint is trusted |
| `originality/orchestrate-originality-review.ts` | 1 | reads the candidate's `sv-*` report and passes it into the upstream-evidence check |
| `mission3d-fixtures.ts` | 2 | `seedAtSemanticReviewPassed` now drives the real structural/correctness/semantic orchestrators; new `seedAtSemanticReviewPassedWithFabricatedCorrectness` and `seedLegitimateStructuralReport` helpers; `mission3dQuestion` made genuinely arithmetically derivable |
| `mission3d-integration.test.ts`, `originality-orchestration.test.ts`, `pipeline-runner.test.ts` | 2 | fixtures updated to plant a genuine `sv-*` report alongside every fabricated `cv-*` report |
| `mission3d-remediation.test.ts` | 2 | new adversarial coverage for the structural-chain and blueprint-hash gaps, plus a full-chain regression/idempotent-replay confirmation |

No file outside `src/features/question-factory/{validation,correctness,originality}` and `src/tests/unit/question-factory/` was touched. `.vscode/` and `design.md` remain untracked and untouched throughout. The production question bank (`src/content/questions/`) has zero diff against the starting SHA.

---

## 4. Exact structural / correctness / semantic authentication rules

### Blueprint binding (finding #1)

`candidateProvenanceSchema` makes `blueprintId` a mandatory field — every candidate whose provenance still parses has a bound blueprint, so there is no supported "legitimately unblueprinted" lifecycle case for a `semantic_review_passed` candidate. `validateUpstreamCorrectnessEvidence` now requires, unconditionally:

- `context.blueprintHash` (the orchestrator's freshly-resolved, verified current blueprint hash) is a non-empty string;
- `evidence.blueprintHash` is defined and non-empty;
- the two are strictly equal.

Any of these failing pushes an `originality_upstream_evidence_invalid` issue at `correctnessReport.evidence.blueprintHash`. A fabricated report that simply omits the field can no longer bypass the check by leaving it `undefined`.

### Structural evidence authentication (finding #2)

The new shared helper `validateStructuralEvidenceBinding` (`validation/validate-structural-evidence-binding.ts`) is the single implementation both `correctness/validate-cached-replay.ts` and `originality/validate-upstream-correctness-evidence.ts` call. Given the candidate's current identity facts and a stored `sv-*` report, it proves, collecting every failure rather than stopping at the first:

1. the report exists;
2. the report's shape is well-formed (`result`/`result.evidence` are real objects — never throws on a corrupted stored report);
3. `report.candidateId` and `evidence.candidateId` both match the requested candidate;
4. `evidence.outcome`/`result.status` are `"passed"`;
5. `evidence.candidateRevision` / `evidence.candidateContentHash` match the candidate's *current* provenance;
6. `evidence.blueprintHash` strictly matches the candidate's current verified blueprint hash;
7. `schemaVersion` / `taxonomyVersion` / `validatorVersion` are all current;
8. the structural fingerprint recomputes identically (`computeStructuralValidationFingerprint`, reused verbatim).

Originality then cross-checks that the correctness report's own `evidence.structuralEvidenceFingerprint` equals this *authenticated* report's fingerprint — never the copied-in value taken on trust. A stale, malformed, wrong-candidate, non-passing, or fabricated-with-no-real-report structural reference is refused; the check runs (and can independently flag a mismatch) whether or not the referenced structural report itself passed its own binding checks.

### Correctness evidence authentication

Unchanged from the first remediation, now composed with the above: report existence and unique resolvability, candidate ownership (wrapper and evidence), a legitimate outcome (`passed`/`deterministically_verifiable` or `review_required`/`requires_independent_semantic_review`), current revision/content-hash binding, current schema/taxonomy/verifier/scorer versions, and a recomputed `verificationFingerprint`. A self-consistent hand-fabricated `cv-*` report with no authentic structural evidence behind it now fails closed on the structural-authentication step before any of these even matter.

### Semantic evidence

Unchanged: for the `requires_independent_semantic_review` outcome, `hasIndependentReviewerRecordAtThreshold` (reused verbatim from `review/`) still independently confirms real, sufficient, chain-verified independent-reviewer evidence in the candidate's *current* `provenance.reviewRecords`.

---

## 5. Issue codes and zero-write destinations

Every failure mode above surfaces as the existing, unchanged `originality_upstream_evidence_invalid` umbrella code (no new issue code was introduced — the audit's instruction to prefer the existing stable refusal outcome over a proliferation of subcodes was followed), distinguished by `path`/`message`. The orchestration outcome is `{ outcome: "upstream_evidence_invalid", candidateId, issues }`. In every case:

- zero repository writes (no `og-*` report, no candidate-record update, no compartment move);
- the candidate remains exactly where it was (`semantic_review_passed`, in `review-queue`);
- a subsequent call with the evidence gap fixed (a genuine `sv-*` and/or `cv-*` report restored) succeeds and reaches `originality_review_passed` normally.

---

## 6. Adversarial test results

`mission3d-remediation.test.ts` adds the following scenarios (all pass, run against a real `FsFactoryRepository`, never mocks):

1. no `sv-*` report at all, `cv-*` declares no `structuralEvidenceFingerprint` — refused, zero writes.
2. no `sv-*` report at all, `cv-*` declares a fabricated fingerprint string — refused, zero writes (the "self-consistent hand-fabricated report" case).
3. malformed `sv-*` report (corrupted `result`/`evidence` shape) — refused, never throws.
4. `sv-*` report belonging to a different candidate — refused, message names the real owner.
5. `cv-*` referencing a *different, genuine* candidate's structural fingerprint (wrong structural reference) — refused at `correctnessReport.evidence.structuralEvidenceFingerprint`.
6. non-passing `sv-*` report outcome — refused.
7. stale structural content binding (candidate content hash drifted since the `sv-*` report was written) — refused.
8. tampered `sv-*` fingerprint (visible field edited, fingerprint not recomputed) — refused.
9. blueprint-bound candidate, `cv-*` omits `blueprintHash` entirely — refused.
10. blueprint-bound candidate, `cv-*` carries an empty-string `blueprintHash` — refused.
11. blueprint-bound candidate, `cv-*` carries a `blueprintHash` for the wrong blueprint — refused.
12. valid full chain (genuine `sv-*` + `cv-*`, real semantic transition) passes originality and replays idempotently on a second call.

Existing coverage (unchanged behaviour, re-verified against the new fixtures): forged-state refusal, missing/malformed/wrong-candidate/stale correctness-report scenarios, multi-candidate isolation, successful retry after evidence restoration (now restoring both the structural and correctness report), and the full five-stage `runPipeline` regression reaching `difficulty_review_passed`.

---

## 7. Full validation results

| Command | Result |
|---|---|
| `npm run typecheck` | clean |
| `npm run lint` | clean |
| `npm test` | 1765/1765 passed (85 files) |
| `npm run validate:questions` | all production questions and showcase fixtures valid |
| `npm run check:answers` | 100/100 questions checked, 0 failures |
| `npm run build` | succeeds (Next.js 16.2.10 / Turbopack) |
| `npm run test:e2e` | 20/20 passed |
| `npm audit --audit-level=moderate` | 2 moderate advisories (Next → postcss `GHSA-qx2v-qp2m-jg93`) — unchanged, pre-existing, fix requires a breaking Next downgrade |
| `git diff --check` | clean |

Production bank (`src/content/questions/`) byte-for-byte unchanged. `main` remains `ba9575c572df050ab97244758ead22e5336dcd2c`. `.vscode/` and `design.md` remain untracked and untouched.

---

## 8. Residual risks

- **Test-suite flake, unrelated to this change**: `review-ingest-crash-safety.test.ts`'s concurrency test occasionally fails under full-suite parallel load (a timing-sensitive dual-write race in `review-ingest.ts`, untouched by this remediation) but passes reliably in isolation; observed once during validation and not reproduced on rerun. Pre-existing, out of scope.
- **`difficulty/` still trusts `originality/validate-cached-replay.ts`'s own binding, not the full correctness/structural chain beneath it** — by design (documented in both modules): once a candidate reaches `originality_review_passed` through the now-hardened fresh-verification path, its `og-*` report is itself the trust anchor for every later gate, so re-deriving the entire upstream chain at every subsequent stage would be pure duplication. If a future gate needs to re-prove the full chain independently of originality's own report, it should compose `validateStructuralEvidenceBinding` and the correctness-evidence checks directly rather than re-trusting `og-*` alone.
- **Blueprint deletion between structural validation and originality** is already handled by the pre-existing `blueprint_unresolved` fail-closed path in the orchestrator (unchanged, re-verified by `mission3d-integration.test.ts`'s "zero progression on missing blueprint" test) — not a gap this remediation needed to touch.

MISSION 3D SECOND REMEDIATION READY FOR CODEX RE-AUDIT
