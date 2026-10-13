# Roadmap draft revision verification - 13 October 2026

All 199 questions remain unsigned drafts. No human approval, independent originality certification, governed publication or runtime readiness is claimed. The earlier advisory review covers the superseded snapshots.

## Changes and commit order

Shared tooling comes first: `8e550483` adds automatic discovery of every root draft JSON, displayed answer-position checks, nested mojibake rejection and eleven regression tests; `3a864833` adds the independent AMC solver and CI wiring (B5).

| Task | Commit | Content |
| --- | --- | --- |
| B2 | `7ab59226` | Seeded option shuffles across all seven packets, with remapped option IDs and keys |
| B3 | `a8bee6b8` | Distinct Year 5 AMC structures and explanations |
| B4 | `47809f5f` | Year 3 AMC repairs, including genuine multi-step/reasoning items 026-030 |
| B6 | `a188eef6` | Diversified ICAS science contexts and plausible distractors |
| B7 | `429cb31c` | Twenty Year 3 spelling items, improved Year 5 spelling, shuffled choices, and repaired 006/008 distractors |
| B8 | `33ce58c7` | Grounded Year 3 whispering inference and calibrated reading difficulty |

The structural validator passed immediately before each of the six content commits. README and review documentation follow the content commits. Final packet bytes match the verified versions saved before commit reordering.

All seven draft packets are UTF-8 without a BOM. Zero U+00C3, U+00C2 or U+FFFD markers remain. Year 3 spelling 006 uses `crasch` rather than the valid word `crush`; 008 uses `cossy` rather than the valid US spelling `cozy`. Science contains zero occurrences of "All were equal". All 60 AMC answers match the independent code solvers, with exactly one matching option for each multiple-choice item.

## Displayed answer positions

AMC counts cover the 25 multiple-choice items in each packet; the five number-entry items have no option position. All other counts cover the entire packet. No letter exceeds 35%, and no forbidden repeating cycle occurs.

| Draft file | A | B | C | D | E | Multiple-choice total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `amc-y3-draft.json` | 5 | 7 | 4 | 4 | 5 | 25 |
| `amc-y5-draft.json` | 7 | 7 | 3 | 4 | 4 | 25 |
| `icas-y5-science-draft.json` | 9 | 13 | 14 | 4 | - | 40 |
| `naplan-y3-reading-draft.json` | 6 | 8 | 7 | 6 | - | 27 |
| `naplan-y3-spelling-draft.json` | 7 | 3 | 6 | 4 | - | 20 |
| `naplan-y5-reading-draft.json` | 8 | 7 | 7 | 10 | - | 32 |
| `naplan-y5-spelling-draft.json` | 5 | 5 | 6 | 4 | - | 20 |

## Final local verification

- Typecheck and lint passed; production build passed.
- Unit completeness guard: all 306 files reported, all 5,457 tests passed (`npm run test:ci -- --pool=threads --maxWorkers=2`, with the documented CI Stripe placeholders).
- RLS: all 32 files and all 499 assertions passed. Ran the unchanged tests on a fresh isolated local Supabase harness at ports 57321/57322, using a temporary ignored test configuration that restores local scoring/writer connection settings before each file. The JSON report was independently checked for complete file coverage and exclusively passed assertions.
- Guest Playwright: 170 passed (`npm run test:e2e`).
- Authenticated Playwright: 42 passed, 1 failed (`npm run test:e2e:auth`). Failure: `/student/assignments` with no attempts has horizontal overflow, at `e2e/helpers/screen-helpers.ts:146`. The original PR report already documented an assignments-overflow baseline failure. No runtime UI, production scoring, database migration or existing test assertions changed in this revision. This local result is not an all-green authenticated run.
- Draft preflight: 199 passed, including all seven position distributions and encoding checks.
- AMC solver: 60 checked, zero mismatches.
- Production question validation, published-inclusive answer check (zero failures), ledger consistency and `git diff --check` passed.

Initial local attempts encountered absent Docker/environment settings, stalled Windows forks, and a transient Next Google-font loader failure. The final outcomes above supersede those attempts; no assertions were weakened or disabled. The shared database was retained; a separate fresh harness resolved its contaminated-fixture failures.

GitHub CI must be green before merge. This revision updates PR #33 into `dev`; it does not merge or deploy production. Branch retention decisions are recorded in [the branch cleanup report](branch-cleanup-2026-10-13.md).
