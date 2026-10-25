# AMC final seven: authorised taxonomy changes

**Status:** draft implementation of three owner decisions. **No approval is recorded; nothing is ingested, staged, approved, published or released.** `y3-014`, `y5-006` and `y5-028` keep their code exclusions, and all seven questions still lack a human approval record.

Baseline: `origin/dev` `a9db90d7` (the PR #79 merge). Options and evidence: `intake-preflight.md` sections 2 and 2.1.

## Owner decisions applied

| Decision | Change |
|---|---|
| `y5-006` Option A | New Year 5 entry `amc.use-a-simple-scale` (alias "Use a simple scale", Measurement & Geometry, `multiple_choice`, `easy`). No id or alias collision; the registry's own validation passes. The question and its hashes are unchanged |
| `y5-028` Option C, remedy A | `number_entry` added to `recommendedQuestionTypes` of the existing `amc.systematic-counting` entry (no second entry). Draft metadata becomes Logic & Problem-Solving, "Systematic counting", still `number_entry` |
| `y3-016`, `y5-019` | Not touched. Their stale blueprints stay as they are until the label decisions are made |

## `y5-028` hashes (recomputed with `buildAmcReviewTarget`)

| | Before | After |
|---|---|---|
| Source | `5743cf39b78815a617fda04d161c6e38f5724ba490dcef28689faa4b3f1a298a` | `9211116d5f5fc502e48bdb7005bcb6a150ac5c2a017001245081b78e4f3b809b` |
| Content | `28a4e4cc067cbfc7f47ede048c804ff6bf234906c64924e8f8b89604d99af3ab` | `4ca0370da7e1bc2e6949ed4df1f4c1156175e7125028727e683da01f56747728` |
| Manifest | `1f5d27204b5909c21e4e39293bd8e805f8cc1f7e35c50f5c8dc24dfab5ed5ce2` | `f00249b651f4a93e2d4f87f359ff5111e8d8076000a19c5ff23c6d0e8f5f6592` |

These equal the Option C values predicted in `intake-preflight.md`. Re-pinned in three places: `content/review-sources/amc/y5.json` (source and content), `AMC_ATTESTED_CONTENT_HASHES` (via `scripts/amc-rebind-pins.mts`, derived, not typed) and `revision-loop-amc.csv` (content and manifest). The first-party solver still agrees with the key (60 checked, 0 mismatches).

## What did not change

Question text, options, keys, marks, difficulty and time for every question; the 53 served questions, manifests, approvals, bank and blueprints; the exclusion sets; `y5-006` hashes.

## Tests

The scenario tests that simulated these edits now start from a `revertAdoption` transform so the before/after evidence still runs, and a new block asserts the adopted state of the real repository. Two baseline assertions in the preflight test changed because the blockers they described are now fixed (taxonomy, blueprint, hash); the exclusion and approval assertions are unchanged.

Preflight result after the change: all 60 drafts are taxonomy and blueprint ready. Each of `y5-006` and `y5-028` is blocked only by `excluded_from_review` and `approval_missing`.
