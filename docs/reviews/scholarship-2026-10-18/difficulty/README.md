# Difficulty: the 35 blocked items, and a separate policy proposal

Nothing in this folder changes a label, a gate or a threshold. The 35 labels are exactly as drafted.

## What is blocked, re-verified on 18 Oct

Running the current content through the real `questions:pipeline` (ingest, structural, correctness, semantic, originality, difficulty):

| Section | Candidates | Pass every gate | Stop at the difficulty gate |
|---|---|---|---|
| Numerical Reasoning | 40 | 26 | **14** |
| Mathematics | 40 | 19 | **21** |
| Verbal Reasoning | 45 | 0 | 0 reached: all 45 quarantine at the semantic gate (no different-provider review) |
| Reading | 35 | 0 | 0 reached: all 35 quarantine at the semantic gate |

The 35 are the same ids as before the remediation round. The earlier "26 and 19" figures were right. The gate run used the content as committed at `e0f6a668`; no NR or mathematics item has changed since. The 45 passing candidates were staged in this worktree's local factory workspace, which is git-ignored, so staging is not part of the PR and is reproduced by the commands in `RELEASE-PLAN.md`.

The estimator is also a problem for the two sections that have not reached the gate yet. Applying it to the current text, it would block **27 of 45 Verbal Reasoning** and **16 of 35 Reading** items, because it reads word count, reading load and a step-count proxy. `estimator-all-160.csv` has every item. The proposal below leaves those 43 blocking.

## Why the gate blocks them

`DIFFICULTY_MATCH_TOLERANCE` is 0.15 and every band is 0.5 apart, so any one-band disagreement fails. A short, hard number-pattern item and a long, easy word problem both fool a text-length estimator. It is a reasonable guard against a wildly mislabelled item and a poor judge of abstract reasoning.

## Item-by-item assessment

`difficulty-recommendations.json` and `blocked-35-recommendations.csv` give, for each of the 35: the declared label, the estimator's label, my label with confidence, the number of reasoning steps, a recommendation and a rationale. Marks were not used as a proxy for difficulty.

Summary of my assessment (Claude Sonnet 5.5, written before I read the 17 Oct assessment, and the same provider family as the author, so advisory):

- **Keep as labelled: 31 of 35.** The estimator is wrong for these: it counts words and reads short pattern or algebra items as easy and wordy easy items as medium.
- **Relabel to easy: 4 of 35** (`nr-003`, `nr-005`, `nr-007`, `maths-023`). Each is one familiar idea with a routine extension. The estimator happens to agree on these four, so a relabel would also clear the gate, but the reason to relabel is the item, not the estimator. This is Vish's decision; the sheets still show the current label.
- Borderline (low confidence, keep): `nr-009`, `nr-010`, `nr-030`, `nr-038`, `maths-021`, `maths-025`, `maths-026`, `maths-027`, `maths-039`.

`prior-opus-5-5-assessment-2026-10-17.json` is the earlier, independent Claude Opus 5.5 assessment (from `release/amc-incremental` at 05592364, kept for provenance). It differs from mine on 9 of the 35: it rates eight (`nr-008`, `nr-009`, `nr-010`, `nr-030`, `nr-038`, `maths-003`, `maths-020`, `maths-021`) easy where I say medium, and `nr-031` medium where I say challenging. Two same-family assessors disagreeing on 9 of 35 shows the labels here are judgement calls, which is exactly why a human, not the estimator, should settle them. For the 80 Verbal and Reading items the external reviewer's difficulty rating (part of the response schema) is the independent evidence.

## Policy proposal: advisory estimator for NR and Mathematics (NOT active, needs Vish's approval)

The proposal already exists as commit `194e34fe` on `proposal/scholarship-difficulty-advisory`:

- `isDifficultyAdvisory()` is true for AMC, and for `scholarship_style` + `numerical_reasoning` or `numeracy`.
- For those, a deviation or low confidence is recorded as a fingerprinted `review_required` warning and the item proceeds. Verbal Reasoning, Reading, NAPLAN and ICAS stay blocking.
- Structural, correctness (first-party recompute), semantic, originality, provenance and human-approval gates are untouched. Malformed input is still a hard failure.

What approving it would and would not do:

| | If approved | If not approved |
|---|---|---|
| 35 NR and mathematics items | Reach staging; Vish sees the estimator warning and the assessment above and decides each label | Stay blocked until relabelled (4 recommended) or revised |
| 43 Verbal and Reading items the estimator would block | **Unchanged: still blocked** | Same |
| Correctness, originality, semantic, approval gates | Unchanged | Unchanged |

Dependency: the proposal edits the advisory path that AMC's incremental release introduces (`982e6739` on the AMC branch, not on `dev`). It cannot be applied to `dev` until that lands, so it is **not** included in this PR. Nothing here activates it.

Recommendation: do not approve a policy change just to clear these 35. Settle the four recommended relabels, let Vish decide the nine borderline items, and revisit the policy only if the remaining blocked items are ones he agrees are correctly labelled.
