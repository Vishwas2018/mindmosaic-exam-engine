# Three-branch inventory — 2026-07-30

**Against:** `main` @ `e9b453d` · **Method:** read-only; dry-run merges on throwaway branches, aborted, never on `main`.
**Context:** `main` now carries P0-A (`f53b227`), P0-C (`55c0833`) and P0-B (`6913a8d`, `b1fe8db`), so each branch is read for overlap with the new gate-chain, independence and manifest-schema code.

| Branch | Ahead | Behind | Dry-run merge | Verdict |
|---|---|---|---|---|
| `claude/mission3d-third-remediation` | 16 | 228 | **clean** | **merge** (pre-approved; all conditions met) |
| `claude/mission2-fixture-prep` | 12 | 312 | 1 docs conflict | **owner decision** — recommend park |
| `feature/pb2-blueprint-binding` | 10 | 241 | **clean** | **owner decision** — recommend merge after third-remediation |

All three were authored 2026-07-12…17 and predate the entire Mission 3E staging/publication surface. Being 228–312 commits behind is expected, not a red flag on its own.

## Overlap with the new P0-A/B/C code — no file-level conflict

The 16 source files touched by P0-A/B/C were intersected with each branch's changed-file set:

| Branch | Files changed | Overlap with P0-A/B/C files |
|---|---|---|
| `claude/mission3d-third-remediation` | 32 | **0** |
| `claude/mission2-fixture-prep` | 11 | **0** |
| `feature/pb2-blueprint-binding` | 21 | **0** |

File-level disjointness is necessary but not sufficient, so the semantic surfaces were checked too — see the merge-risk findings below.

## `claude/mission3d-third-remediation` (+16) — completed, audited, merge-ready

Three delivery/remediation reports give it full lineage: `13-mission3d-third-audit-remediation.md`, `14-mission3d-governed-authority-remediation.md`, `15-mission3d-governed-authority-hardening.md`. This is completed audited work, not WIP.

Commits (2026-07-17), three coherent arcs:
- **Correctness-pass attestation** — `3f8159f` model + shared binding validator, `2529487` mint/re-verify in orchestration, `4cb2c02` authenticate governed semantic-completion evidence, `ea3955e` require attestation + semantic-completion evidence in originality, `528149f` adversarial/e2e coverage, `be6fb4f` report.
- **Governed authority** — `169b31b` trusted report families + governed evidence writer, `4043f53` wire correctness/semantic orchestrators to governed writers, `ee6216a` remove public builder/write access to trusted evidence, `c065e50` adversarial coverage, `adce3f7` report.
- **Hardening** — `972534f` reserve trusted families across create/move/update/remove, `105d38e` reusable trusted-family policy contract across two repository shapes, `f1601ee` lint + source-scan import boundary, `c91df6e` restaged tamper fixtures, `4bb05cc` report.

**Fast gate on the merge result** (run against `main` + this branch merged, not the bare 13-day-old branch — checking that out would strip the tracked `published-manifests/` from disk while the gitignored candidate compartments stayed gone):

- `typecheck` — clean
- `vitest src/tests/unit/question-factory/` — **84 files, 2037 tests, all passed** (`main` alone is 80/1953; the branch adds 4 files / 84 tests)
- `lint` — 0 errors, the 2 known `no-img-element` warnings
- dry-run merge — **clean, no conflicts**

### Merge-risk findings — flagged, not resolved

1. **Trusted-report write reservation vs. gate-chain reads.** The branch adds `storage/trusted-reports.ts` and `governed-write-capability.ts` and reserves the `sv-`/`cv-`/`og-`/`df-` report families across `create`/`move`/`update`/`remove`, removing public write access to trusted evidence. `gate-chain/verify-gate-chain.ts` **reads** those same families via `repository.read`. Reads are not reserved, and the merged suite is green — but the two features now co-own the same report namespace from opposite sides, and any future tightening that extends reservation to reads would break the gate chain silently. Worth a follow-up test asserting the gate chain can still read every trusted family after the merge.
2. **Originality now additionally requires correctness-pass attestation.** `ea3955e` makes originality demand attestation + semantic-completion evidence. `verifyUpstreamGateChain` independently requires a `passed`, freshly-bound originality report. These compose (both must hold) rather than conflict, and the direction is the same — more evidence required, not less. No action, but the two requirements are now layered and should be documented together when 3E and 3D docs are next reconciled.
3. **`orchestrate-semantic-review.ts` is modified on both sides in effect.** The branch changes it directly; P0-C changed `isProductionGradeIndependentReview`, which that file calls. Git merged them cleanly because the edits are in different regions, and the suite is green — but the semantic-review independence path is now the product of two independent changes and deserves a focused read before any further change lands on it.
4. **`mission3d-fixtures.ts` is modified by the branch**, and `publication.test.ts` on `main` now imports `seedLegitimateStructuralReport` / `seedLegitimateCorrectnessReport` from it (added when P0-A's stricter chain required a complete fixture). The merged suite passes, so the signatures still line up — noting it because a future change to those helpers now has two consumers with different expectations.

## `claude/mission2-fixture-prep` (+12) — recommend park

12 commits (2026-07-12), 11 files, +13,489 lines, entirely fixtures/docs: harvest inventory, template-family catalogue, a 32-pair labelled duplicate-calibration corpus, correctness-verifier coverage matrix, legacy-ingestion requirements, unsafe-content/publication safeguards report, and a 650-line fixture-integrity test.

Dry-run merge: **1 conflict**, add/add on `docs/reports/mission2-fixture-prep/05-review-chain-followup.md` — the same document exists on both sides. Trivially resolvable but it is a genuine content divergence, not a whitespace clash.

312 commits behind, and its value is calibration fixtures for work that has since been superseded by the 3D/3E pipeline. Recommend **park** unless the duplicate-calibration corpus is specifically wanted for originality tuning. Not pre-approved; owner decides.

## `feature/pb2-blueprint-binding` (+10) — recommend merge, after third-remediation

10 commits (2026-07-17), 21 files, +3,279. Adds a `binding/` module (binding manifest, canonical tuple, preflight, seed-blueprints CLI), a `--binding-manifest` ingest flag, and per-candidate blueprint binding at manual ingestion; then four hardening commits making preflight blueprint resolution strictly non-mutating.

Dry-run merge against current `main`: **clean**.

**Ordering risk:** it modifies `storage/factory-repository.ts`, `storage/fs-factory-repository.ts` and `storage/index.ts` — the *same three files* `third-remediation` modifies. Each merges cleanly against `main` **independently**; they were not dry-run merged against each other. Whichever lands second will meet a changed storage layer. Recommend merging `third-remediation` first (it is pre-approved and rewrites the repository's write contract), then re-running a fresh dry-run for pb2 against the updated `main` rather than trusting this result.

Not pre-approved; owner decides.

## Awaiting owner decision

- `claude/mission2-fixture-prep` — park (recommended) or resolve the one docs conflict and merge.
- `feature/pb2-blueprint-binding` — merge after third-remediation with a fresh dry-run, or park.
