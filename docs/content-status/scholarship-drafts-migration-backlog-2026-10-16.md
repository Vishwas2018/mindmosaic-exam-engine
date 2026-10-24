# Scholarship draft migration backlog - 16 October 2026

## Launch requirement

**Before scholarship goes live in February, the `scholarship-drafts` CI job must be made required by a repository administrator and must be green.** The current advisory status is temporary; it is not publication approval, a validator exception, or permission to serve these drafts.

## Current scope and isolation

Baseline: PR #52 content/validator head `e455f156`. No draft content, solver-verification code, or regression test is changed by this CI split. The five matrix orientations fixed on that baseline remain explicit, with their keys unchanged.

The [numerical](../../content/scholarship-drafts/scholarship-y6-numerical-reasoning-draft.json) and [verbal](../../content/scholarship-drafts/scholarship-y6-verbal-reasoning-draft.json) packets each carry `"draftOnly": true`. The exhaustive inspection covered 85 questions, found 20 solver-verification refusals, and measured zero draft-ID overlap with `publishedExamBank`. `getExamBank("practice")` serves a publication-gated subset of that published pool, not these draft packets. The validator runtime-reference guard also passed. Splitting the draft check therefore does not change live-eligible content or the publication gate.

## Complete item punch-list

The normal `npm run content:validate-scholarship-drafts` command stops at the first error. To collect every item refusal without bypassing validation, the unchanged exported `verifySolverMatch` was invoked once for each question with its matching `parameters[id]`, and each thrown diagnostic was captured. All other exported global checks (runtime-reference guard, BOM, mojibake, answer positions, compound words, and duplicate stems) also passed.

All 20 items below are in `content/scholarship-drafts/scholarship-y6-numerical-reasoning-draft.json`. The field column is relative to `parameters["<item id>"].solverParams`. Every listed issue has code `invalid_type`, expected `object`, and the exact validator message quoted below.

| Item ID | Rejected field paths | Exact reason at every listed path |
| --- | --- | --- |
| `scholarship-y6-nr-021` | `constraints[0]`, `constraints[1]` | `Invalid input: expected object, received string` |
| `scholarship-y6-nr-022` | `constraints[0]`, `constraints[1]` | `Invalid input: expected object, received string` |
| `scholarship-y6-nr-023` | `constraints[0]`, `constraints[1]` | `Invalid input: expected object, received string` |
| `scholarship-y6-nr-024` | `constraints[0]`, `constraints[1]` | `Invalid input: expected object, received string` |
| `scholarship-y6-nr-025` | `constraints[0]` | `Invalid input: expected object, received string` |
| `scholarship-y6-nr-026` | `constraints[0]` | `Invalid input: expected object, received string` |
| `scholarship-y6-nr-027` | `constraints[0]`, `constraints[1]` | `Invalid input: expected object, received string` |
| `scholarship-y6-nr-028` | `constraints[0]`, `constraints[1]` | `Invalid input: expected object, received string` |
| `scholarship-y6-nr-029` | `constraints[0]`, `constraints[1]` | `Invalid input: expected object, received string` |
| `scholarship-y6-nr-030` | `constraints[0]`, `constraints[1]` | `Invalid input: expected object, received string` |
| `scholarship-y6-nr-031` | `constraints[0]`, `constraints[1]`, `constraints[2]`, `constraints[3]` | `Invalid input: expected object, received string` |
| `scholarship-y6-nr-032` | `constraints[0]`, `constraints[1]` | `Invalid input: expected object, received string` |
| `scholarship-y6-nr-033` | `constraints[0]`, `constraints[1]`, `constraints[2]`, `constraints[3]` | `Invalid input: expected object, received string` |
| `scholarship-y6-nr-034` | `constraints[0]`, `constraints[1]` | `Invalid input: expected object, received string` |
| `scholarship-y6-nr-035` | `constraints[0]`, `constraints[1]`, `constraints[2]` | `Invalid input: expected object, received string` |
| `scholarship-y6-nr-036` | `constraints[0]` | `Invalid input: expected object, received string` |
| `scholarship-y6-nr-037` | `constraints[0]`, `constraints[1]`, `constraints[2]` | `Invalid input: expected object, received string` |
| `scholarship-y6-nr-038` | `constraints[0]`, `constraints[1]`, `constraints[2]`, `constraints[3]` | `Invalid input: expected object, received string` |
| `scholarship-y6-nr-039` | `constraints[0]` | `Invalid input: expected object, received string` |
| `scholarship-y6-nr-040` | `constraints[0]`, `constraints[1]`, `constraints[2]`, `constraints[3]`, `constraints[4]` | `Invalid input: expected object, received string` |

These are the full remaining rejected-item set: no number-matrix item remains refused after the five explicit-orientation fixes.

## Migration work and acceptance criteria

- Preserve the mathematical relationships in each original problem when migrating its solver data to a supported declarative representation. The current closed interpreter supports equality objects, not JavaScript expression strings; richer relationships need a separately reviewed implementation and tests if the existing language cannot represent them.
- Never execute the stored strings, substitute answer literals for the relationships, remove solver sidecars, or relax the fail-closed checks to clear this backlog.
- Re-run each solver independently and compare the computed result with the unchanged answer key. Any substantive content changes must follow the governed review and hash-binding route; this backlog grants no approval.
- Require the complete scholarship validator to pass, plus the strict solver regressions and the full required CI checks.
- Before scholarship launch, Vish must make `scholarship-drafts` required in branch protection. **Updated 2026-10-24:** the job-level `continue-on-error` was removed in `02a0b3ac`, so the job is already blocking in the workflow and no workflow edit remains outstanding. The only outstanding item is the branch-protection listing, which is a settings change — see `docs/reviews/legacy-content-provenance-phase2/phase2b-a0-branch-protection.md`.

## CI separation and required checks

Only `npm run content:validate-scholarship-drafts` moves from `core` into the separate `scholarship-drafts` job. The command and strict validator are unchanged. Job-level `continue-on-error: true` made this deferred draft check advisory at the time of writing; there was no step-level exception and none in `core`. **Superseded 2026-10-24:** `continue-on-error` was removed in `02a0b3ac` and `ci.yml` now contains none at any level, so the job is blocking in the workflow. It is still not listed as a required status check in branch protection, so a red run does not block a merge.

Read-only branch-protection inspection on 16 October 2026 returned required contexts `core`, `e2e`, `e2e-auth`, and `rls` (GitHub Actions app ID 15368). The branch-rules endpoint returned `[]`. Neither the scholarship command nor `scholarship-drafts` is required. The split needs no current administrator change; all four existing checks still must pass before merge. No branch-protection setting was changed.
