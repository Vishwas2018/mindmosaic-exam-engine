# Mission 3D — Governed-Authority Remediation Report

Status: **remediation implemented, tested, and validated. Branch frozen for independent Codex re-audit. Not self-approved.**

Branch: `claude/mission3d-third-remediation`, continuing from the third remediation's own docs commit `be6fb4fe`. Written against the residual blocker identified after the third remediation: the `cva-*` correctness-pass attestation and `sr-*` semantic-completion evidence records were, once written, *mutually consistent and correctly bound* — but nothing stopped a caller from minting a self-consistent pair from scratch and persisting it directly, because `buildCorrectnessAttestation`/`buildSemanticCompletionEvidence` were publicly exported and generic `repository.create("reports", ...)` would accept any well-formed record regardless of who called it. The third remediation closed "a report can be forged and passed off as genuine" (fingerprint self-consistency is not origin proof); it did not yet close "the attestation *itself* can be forged and persisted the same way." This report records the fix: a narrow, capability-gated repository boundary that makes the governed correctness/semantic orchestrators the only code in the application able to persist either family at all.

**Correction to the third remediation report**: that report's starting-SHA line already carries the full, correct hash `a1a9b3390e2fe7ae5993f5d70d459d8848f16240`. The abbreviated form `a1a9b333` that appeared in this assistant's own chat summary after that remediation was never written into any committed file — there is no repository artifact to correct.

---

## 1. Starting and final SHA

| | |
|---|---|
| Starting HEAD | `be6fb4fec3ec1437e8de613f98b99b487cad25f1` (`docs: record third Mission 3D audit remediation`) |
| **Final HEAD after this remediation** | `<this commit>` (`docs: record governed-authority Mission 3D remediation`), on top of the four commits below |
| Third remediation's own merge base | `a1a9b3390e2fe7ae5993f5d70d459d8848f16240` — unchanged, still the correct starting point for the whole branch |
| `main` | `ba9575c572df050ab97244758ead22e5336dcd2c` — unchanged, untouched throughout |
| `integration/governed-question-factory` | unchanged, untouched throughout |
| Local vs. `origin` | This branch does not exist on `origin`; local remains ahead by every commit on the branch (unpushed) |

---

## 2. Remediation commits

```
169b31b feat: reserve trusted report families and add governed evidence writer
4043f53 feat: wire correctness and semantic orchestrators to governed writers
ee6216a feat: remove public builder/write access to trusted evidence
c065e50 test: adversarial and regression coverage for the governed-authority boundary
<this commit> docs: record governed-authority Mission 3D remediation
```

Five commits, matching the required commit discipline exactly.

---

## 3. Files changed

| File | Commit | Nature |
|---|---|---|
| `storage/trusted-reports.ts` | 1 | new — `TRUSTED_REPORT_FAMILIES` (`cva-`, `sr-`), `isTrustedReportId`, `trustedReportFamilyOf` |
| `storage/governed-write-capability.ts` | 1 | new — `GovernedWriteCapability` (private constructor, `static issue`), `isValidGovernedWriteCapability`; never re-exported from `storage/index.ts` |
| `storage/factory-repository.ts` | 1 | `create()` gains an optional `trustedWriteCapability` parameter; `CreateFailureReason` gains `"trusted_family_reserved"` |
| `storage/fs-factory-repository.ts` | 1 | `create()` refuses any `reports`-compartment write under a reserved id unless the capability is valid for that exact family |
| `correctness/governed-attestation-writer.ts` | 1 | new — the sole production path able to persist `cva-*`; never exported from `correctness/index.ts` |
| `review/governed-semantic-evidence-writer.ts` | 1 | new — the sole production path able to persist `sr-*`; never exported from `review/index.ts` |
| `correctness/orchestrate-correctness-verification.ts` | 2 | replaces its inline `writeAttestationIfAbsent` + direct `buildCorrectnessAttestation` call with `writeCorrectnessAttestation` (the governed writer); behaviour and ordering unchanged |
| `review/orchestrate-semantic-review.ts` | 2 | replaces its inline `writeSemanticCompletionEvidenceIfAbsent` + direct `buildSemanticCompletionEvidence` call with `writeSemanticCompletionEvidence` (the governed writer); behaviour and ordering unchanged |
| `correctness/index.ts` | 3 | removes `buildCorrectnessAttestation` (and its input type) from the public barrel; keeps `buildCorrectnessAttestationId`, `computeCorrectnessAttestationFingerprint`, and the `CorrectnessPassAttestation` type (read/validation surface) |
| `review/index.ts` | 3 | removes `buildSemanticCompletionEvidence` (and its input type) from the public barrel; keeps `buildSemanticCompletionReportId`, `computeSemanticCompletionFingerprint`, and the `SemanticCompletionEvidence` type |
| `mission3d-fixtures.ts` | 3 | deletes `seedLegitimateCorrectnessAttestation`/`seedLegitimateSemanticCompletionEvidence` — both now structurally incapable of working, since generic `create()` refuses their target ids outright |
| `mission3d-remediation.test.ts` | 3 | rewrites the one test that depended on the deleted fixtures: restoring only the (still generic-writable) `sv-*`/`cv-*` pair by hand is now demonstrated as *insufficient on its own* — the refusal now correctly points at the missing attestation |
| `mission3d-third-remediation.test.ts` | 3 | updates one pre-existing test whose expected failure `reason` changed from `"duplicate_candidate"` to `"trusted_family_reserved"` (the capability gate is checked before the duplicate-id check), and adds a companion test exercising the governed writer's own append-only conflict logic directly |
| `mission3d-governed-authority.test.ts` | 4 | new — the full required adversarial and regression scenario list for this remediation |

No file outside `src/features/question-factory/{correctness,originality,review,storage}` and `src/tests/unit/question-factory/` was touched. No `.vscode/`/`design.md` exist in this worktree. The production question bank (`src/content/questions/`) has zero diff against the branch's starting SHA. Staging, publication, Supabase, provider adapters, PB2, and Mission 3E were not touched. No CLI script (`scripts/*.mts`) referenced any of the affected builders — confirmed by a full-repository search before making any change.

---

## 4. Architecture

### Reserved trusted report families

`storage/trusted-reports.ts` names exactly two id prefixes — `cva-` (correctness-pass attestations) and `sr-` (semantic-completion evidence) — as reserved. `FsFactoryRepository.create()` refuses any write to the `reports` compartment under either prefix unless the caller presents a valid, matching `GovernedWriteCapability`. Every other write in the entire codebase (structural/correctness/originality reports, blueprints, candidate records, pipeline-run reports, and both trusted families' own *reads*) is completely unaffected — the check is scoped precisely to `compartment === "reports" && isTrustedReportId(id)`, and the capability parameter is a purely additive, optional fourth argument to `create()`, so no other caller's signature changed.

### `GovernedWriteCapability`

A private-constructor class (`storage/governed-write-capability.ts`) whose only instantiation point is its own `static issue()`. A module-private `WeakSet` additionally records every genuinely issued instance, so a capability-shaped object produced by bypassing TypeScript (`as unknown as GovernedWriteCapability`) still fails `isValidGovernedWriteCapability` — it was never added to the set. This module is never re-exported from `storage/index.ts`.

### The two governed writers

`correctness/governed-attestation-writer.ts` and `review/governed-semantic-evidence-writer.ts` are the only two call sites in the application that ever call `GovernedWriteCapability.issue(...)`. Each mints a capability scoped to exactly its own family, builds the record via the (now-internal) builder, and presents both to `repository.create()`. Neither module is exported from its feature's public barrel (`correctness/index.ts`, `review/index.ts`); each is imported only by its own gate's orchestration composition root (`orchestrate-correctness-verification.ts`, `orchestrate-semantic-review.ts`), in the same directory. Both retain the exact append-only, fingerprint-based conflict-safe replay discipline every other evidence write in this codebase already uses: a matching fingerprint on an existing record is a safe no-op; a differing one is a refused conflict.

### Trusted builders made internal

`buildCorrectnessAttestation`/`buildSemanticCompletionEvidence` (the record *minters*) are no longer exported from `correctness/index.ts`/`review/index.ts`. `buildCorrectnessAttestationId`/`buildSemanticCompletionReportId` (pure id/locator functions — knowing an id format grants no write access) and `computeCorrectnessAttestationFingerprint`/`computeSemanticCompletionFingerprint` plus the two record types (needed by `originality/validate-upstream-correctness-evidence.ts` to *read and validate* existing records) remain public, per "expose validation/read types only where necessary."

`update()` was deliberately left unrestricted for the `reports` compartment, including for trusted families — this remediation's own adversarial tests (`overwriteAttestation`/`overwriteSemanticEvidence` in `mission3d-third-remediation.test.ts`) rely on it to simulate post-hoc tampering of an *already-legitimately-minted* record, which is a materially different threat (caught by the third remediation's binding/fingerprint validation) from *minting new trusted evidence that never existed*, which is what this remediation's capability gate specifically targets. Only `create()` — the only operation that can bring a `cva-*`/`sr-*` record into existence in the first place — is gated.

---

## 5. Threat model

**Protected against, through every supported application and repository API:**

- Fabricating a `cva-*`/`sr-*` record via generic `repository.create()` — refused unconditionally, for every caller that does not present a valid capability, regardless of how well-formed or internally fingerprint-consistent the record is.
- Obtaining the capability through any public feature barrel (`correctness/index.ts`, `review/index.ts`, `originality/index.ts`, `storage/index.ts`) — none of them export the capability class, its issuance, or either governed writer.
- Constructing a capability-shaped object via TypeScript type assertion and presenting it to `create()` — the module-private `WeakSet` check rejects it: it was never actually issued.
- A fixture, test helper, or unrelated production module minting a "genuine-looking" trusted record to stand in for a real pass — no such helper exists any more (`seedLegitimateCorrectnessAttestation`/`seedLegitimateSemanticCompletionEvidence` were deleted because they can no longer function).
- A complete, internally self-consistent, hand-forged `cv-*` + `cva-*` + `sr-*` chain — the non-reserved `cv-*`/`sv-*` legs can still be forged (unchanged from prior remediations, and not the concern this one addresses), but the `cva-*`/`sr-*` legs cannot be persisted at all, so the chain is never complete through any supported API.

**Explicitly outside this application-level trust boundary** (per the task's own instruction, and consistent with every prior Mission 3D remediation's own scope):

- **Direct filesystem tampering** — writing a JSON file directly into the `reports/` directory on disk, bypassing `FsFactoryRepository` entirely, is indistinguishable from any other file on disk and is not something an in-process TypeScript capability check can observe or prevent.
- **Runtime memory compromise** — a caller with the ability to execute arbitrary code in the same process (e.g. prototype pollution, a compromised dependency) can, in principle, reach into `governed-write-capability.ts`'s module scope directly (its `WeakSet` and class are ordinary JS objects, not hidden by any OS-level or hardware boundary) and mint or forge state at will. No pure-JavaScript/TypeScript in-process mechanism defends against this.
- **Source-code modification** — a caller who edits `fs-factory-repository.ts`, `governed-write-capability.ts`, or either governed writer can simply remove the check. This is true of every other invariant in this codebase (every fingerprint check, every schema validator) and is not a gap specific to this remediation.
- **A deep import of an internal module's file path**, bypassing its feature's public barrel — TypeScript/ES modules have no caller-identity mechanism to prevent this, and this codebase's own established convention throughout (`correctness/index.ts`, `validation/index.ts`, `originality/index.ts` all document it explicitly) already treats "not barrel-exported" as the definition of "internal," with deep-importability by a determined reader accepted as the cost of that convention. This remediation does not change that convention or attempt to defeat it with new machinery; it only ensures the *dangerous* pieces (the capability issuance, the two writers) sit behind that same, already-accepted boundary rather than the fully public one they sat behind before.

**This remediation does not claim cryptographic authenticity.** No secret key, HMAC, or asymmetric signature is introduced anywhere in this change. Every check here is an in-process, application-level access-control primitive — tamper-evidence and origin-gating within the boundaries TypeScript's module and type systems can actually enforce, not a guarantee against a privileged or malicious runtime.

---

## 6. Adversarial and regression test results

`mission3d-governed-authority.test.ts` — 19 tests, all run against a real `FsFactoryRepository`, never mocks:

| Requirement | Result |
|---|---|
| Generic `create("reports", ...)` refuses `cva-*` | refused (`trusted_family_reserved`) |
| Generic `create("reports", ...)` refuses `sr-*` | refused (`trusted_family_reserved`) |
| A type-asserted, never-issued capability object is refused | refused |
| `correctness/index.ts` exports neither the builder, the writer, nor the capability | confirmed absent |
| `review/index.ts` exports neither the builder, the writer, nor the capability | confirmed absent |
| `storage/index.ts` exports neither the capability class nor its issuance | confirmed absent |
| `originality/index.ts` exports neither builder | confirmed absent |
| `mission3d-fixtures.ts` exports no trusted-evidence-minting helper | confirmed absent |
| A complete, self-consistent forged `cv-*`/`cva-*`/`sr-*` chain cannot be persisted | `cv-*` succeeds (not reserved), `cva-*`/`sr-*` both refused, originality still refuses |
| Direct `cv-*` creation does not mint a `cva-*` | confirmed |
| Direct lifecycle-state manipulation does not mint an `sr-*` | confirmed |
| Real correctness orchestration mints exactly one `cva-*` | confirmed |
| Real deterministic semantic orchestration mints exactly one `sr-*` (`deterministic_skip`) | confirmed |
| Real independent-review semantic orchestration mints exactly one `sr-*` (`independent_review`) | confirmed |
| Crash before `cva-*` durably lands converges to exactly one on retry | confirmed |
| Cached correctness replay remains a zero-write no-op | confirmed |
| Conflicting trusted records fail closed, even via the governed writer itself | confirmed for both families |
| Originality refusal remains zero-write | confirmed |
| Valid five-stage completion still reaches `difficulty_review_passed` | confirmed, with exactly one `cva-*` and one `sr-*` |

Existing coverage re-verified against the new capability boundary: the full third-remediation suite (`mission3d-third-remediation.test.ts`, 25 tests, one updated to the new failure `reason` and one new companion test for the governed writer's own conflict path), the full second/first-remediation suite (`mission3d-remediation.test.ts`, 30 tests, one rewritten to demonstrate the new, stronger invariant), and the complete unit suite (below).

---

## 7. Full validation results

| Command | Result |
|---|---|
| `npm run typecheck` | clean |
| `npm run lint` | clean |
| `npm test` | 1810/1810 passed (87 files); two tests (`fs-factory-repository.test.ts`'s Windows lock-file concurrency test, `originality-orchestration.test.ts`'s staging-negative-space test) intermittently failed only under full-parallel-suite load with `EPERM`/timeout errors unrelated to this change's logic, and passed cleanly (75/75) when the same two files were re-run in isolation immediately after — consistent with the pre-existing, previously-documented Windows file-lock flakiness noted in the second remediation report's own residual risks |
| `npm run validate:questions` | all production questions and showcase fixtures valid |
| `npm run check:answers` | 100/100 questions checked, 0 failures |
| `npm run build` | succeeds (Next.js 16.2.10 / Turbopack) |
| `npm run test:e2e` | 20/20 passed |
| `npm audit --audit-level=moderate` | 2 moderate advisories (Next → postcss `GHSA-qx2v-qp2m-jg93`) — unchanged, pre-existing, fix requires a breaking Next downgrade |
| `git diff --check` | clean |

Production bank (`src/content/questions/`) byte-for-byte unchanged. `main` remains `ba9575c572df050ab97244758ead22e5336dcd2c`. `integration/governed-question-factory` remains untouched. No `.vscode/`/`design.md` exist in this worktree. This branch does not exist on `origin` (local ahead, unpushed).

---

## 8. Residual risks

- **Runtime memory compromise and source-code modification remain able to defeat this boundary**, as stated in the threat model above — this is an inherent limit of any pure in-process TypeScript access-control mechanism, not a gap specific to this implementation. A future remediation that needs to close this would require out-of-process attestation (e.g. a signature over each record verifiable by a separate service holding the private key, or an append-only external ledger) — genuinely cryptographic infrastructure, deliberately out of scope here per the task's own instruction not to claim cryptographic authenticity.
- **`difficulty/` still trusts `originality/validate-cached-replay.ts`'s own binding, not the full correctness/structural/attestation/semantic chain beneath it** — unchanged from the second and third remediations' own documented residual risk, and out of this remediation's scope (the task's required architecture names correctness and semantic-review orchestration specifically, not difficulty).
- **`attemptSemanticReviewTransition`'s own cached-replay path** still returns `passed`/`replayed: true` on lifecycle state alone without re-checking its own `sr-*` evidence — unchanged from the third remediation's own documented residual risk; the enforcement point remains originality, as specified.
- **The pre-existing Windows file-lock concurrency flake** (`fs-factory-repository.test.ts`'s `update()` serialisation test, observed once during this remediation's full-suite run alongside an unrelated timeout in `originality-orchestration.test.ts`, both passing in isolation) is environmental, not logical, and was already documented as a known issue before this remediation began.

MISSION 3D GOVERNED-AUTHORITY REMEDIATION READY FOR FINAL CODEX RE-AUDIT
