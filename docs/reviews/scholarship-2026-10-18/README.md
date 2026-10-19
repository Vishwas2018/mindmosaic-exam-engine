# Scholarship Year 6: production release package (18 Oct 2026)

Status: **ready for Vish's review; nothing approved, nothing deployed.** No approval, signature or human check has been recorded by anyone for these 160 questions, no database was touched except an isolated local one, and no PR has been merged.

Start here, then open the sheets.

## Decision table

| Area | State | What Vish must do | Exact next action |
|---|---|---|---|
| Numerical Reasoning, 26 items | Pass every machine gate (structural, first-party recompute, semantic, originality, difficulty). Staged locally. | Review and sign | Open `review-sheets/review-sheet-scholarship-y6-nr.html`; fill `review-sheet-scholarship-y6-nr-blank.csv` for the `ready for review` rows |
| Mathematics, 19 items | Same | Review and sign | Same, `...-maths...` |
| NR 14 + Mathematics 21 items | Correct, but blocked at the difficulty gate | Decide each label, or approve the advisory policy | Read `difficulty/README.md`. Recommended: relabel `nr-003`, `nr-005`, `nr-007`, `maths-023` to easy; decide the nine borderline items; do not approve a policy merely to clear them |
| Verbal Reasoning, 45 items | Keys verified; no valid independent review; gate would also block 27 on difficulty | Run the different-provider review | `external-review/README.md`: paste `prompt-with-packet.txt` into a fresh ChatGPT/Gemini/Qwen session and bring back the JSON |
| Reading, 35 items | Same (16 estimator-blocked) | Same | Same |
| Written expression | Deferred; no prompt approved | Nothing now | Out of scope |
| Delivery code | Strict assembly, enforced serve-time approval, no partial papers, sign-in only, availability tied to content; tests below | Review the PR | Draft PR into `dev` (not yet published) |
| Database | Migration verified on an isolated fresh database; **production state not checked** | Run a read-only migration status check against production | `RELEASE-PLAN.md` section 4 |
| Production | On hold | Approve content, then separately authorise the rollout; owner merges `dev` to `main` | After all of the above |

## Content: counts and buckets

| Section | Items | Ready for Vish's review | Requires decision (difficulty gate) | Awaiting external evidence | Previously approved, valid evidence | Excluded |
|---|---|---|---|---|---|---|
| Numerical Reasoning | 40 | 26 | 14 | 0 | 0 | 0 |
| Mathematics | 40 | 19 | 21 | 0 | 0 | 0 |
| Verbal Reasoning | 45 | 0 | 0 | 45 | 0 | 0 |
| Reading | 35 | 0 | 0 | 35 | 0 | 0 |
| **Total** | **160** | **45** | **35** | **80** | **0** | **0** |

`status.json` lists every item with its bucket and reasons. 30 items were revised in this release (`revised-in-this-release.json`); any earlier Claude review of them is stale. The historical figures in the brief (26 / 14 and 19 / 21 staged and blocked, 45 and 35 awaiting review) were re-verified against current source and are correct.

Complete-paper feasibility: **no section has enough approvable items for a whole paper today** (NR 26 of 40, Mathematics 19 of 40, Verbal 0 of 45, Reading 0 of 35), so no paper would go live. See `RELEASE-PLAN.md` section 3 for what closes each gap.

## What is in this folder

| File | What it is |
|---|---|
| `CONTENT-REVIEW-FINDINGS.md` | Blind independent solve of all 160 (160 of 160 match), the four named concerns against current content, defects found and fixed, residual observations |
| `review-sheets/` | Per-section HTML (exact question, options, key, explanation, difficulty, estimator, bucket) and a blank approval CSV per section. The CSV rows bind the canonical published-content hash and revision 0 that `questions:publish` checks. Earlier sheets bound a different hash and revision 1 and could not have been used to publish |
| `difficulty/` | The 35 blocked items item by item, the estimator verdict for all 160, the earlier assessment kept for provenance, and the separate (inactive) policy proposal |
| `external-review/` | Answer-withheld packet, exact prompt with the packet hash, response schema, and the instructions |
| `difficulty/difficulty-decision-sheet.csv` / `.html` | One row per item (all 160): declared label, estimator label, whether the gate would block it, an advisory label with rationale, the earlier Opus label, and blank cells for the external reviewer and for Vish. 78 items would be blocked today. Regenerate with `npx tsx scripts/scholarship-difficulty-decision-sheet.mts` |
| `status.json`, `revised-in-this-release.json` | Machine-readable state |
| `RLS-FLAKINESS.md`, `CROSS-STACK-ACCESS.md`, `evidence/` | The two RLS failure modes (one fixed, one a native worker crash characterised and made loud), the earlier access to another local database stack: what is confirmed and what is not |
| `BRANCH-PROTECTION.md` | The one setting only the repository owner can change |
| `HANDOFF.md` | Four separate statuses and the remaining blockers |
| `RELEASE-PLAN.md` | Scope, dependencies, migration status, availability, deployment, monitoring and rollback |
| `TEST-RESULTS.md` | Every check run, with results and exact rerun commands |

Regenerate everything (hashes included) after any content change with `npx tsx scripts/scholarship-release-package.mts`; `src/tests/unit/scholarship-release-package.test.ts` fails if the package is stale.

## What was built and fixed (beyond content)

- **Strict scholarship assembly**: only scholarship manifests are assembled; each needs exactly one valid, revision-bound human approval, a scholarship pool id, an approver that is not a model or tool, and an independent answer recompute for attested items; orphan approvals refuse the whole assembly; other programmes' manifests are untouched.
- **Serve-time enforcement**: `selectServedQuestions` only looked at an explicit switch map, so the scholarship default of "enforce" never applied and an assembled-but-unapproved scholarship item would have been served. Fixed.
- **Reading could not be sat at all**: the paper filtered for `multiple_choice` while the items are `reading_comprehension`, and it had no whole-passage rule. Fixed.
- **No partial papers**: a shorter module cannot be drawn for scholarship papers even if requested; written expression stays deferred.
- **Answer secrecy**: scholarship papers are signed-in only and never appear in the public guest bank; custom-length and mixed draws that would include scholarship are refused; Confidence Mode (which puts every explanation in the browser) is not offered on these papers.
- **Honest labelling**: the papers were tagged "official length and time" although the 45 / 40 / 35 / 40 counts and 30-minute limits are our own. Now tagged internal, with a plain-language disclosure.
- **Catalogue**: a scholarship program turns live only when its whole paper can be drawn from approved content, not at a 30-item threshold; a test pins the coupling.
- Tools: `questions:assemble-scholarship`, `questions:requeue-for-review` (moves quarantined judgement candidates back for external review; records nothing), `scripts/verify-scholarship-external-review.mts` (read-only check of a returned review).
