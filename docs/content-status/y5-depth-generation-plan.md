# Year 5 depth — generation plan

As of 16 Oct 2026. Verified against the bank selector and the roadmap-draft validator.

## Why Year 5, and which cells

The external blind cross-check found all 22 "too easy" items were Year 5, and the bank selector
shows Year 5 is the thinner year overall (634 vs Year 3's 914). Two distinct problems:

- **NAPLAN Year 5 reading** has volume (106) but a *quality* gap — mostly direct retrieval.
  Being handled by the calibration prompt already sent (passage 06, 7 items). Scale only after it
  validates.
- **ICAS Year 5** has a *volume* gap. These are the genuinely thin cells:

| Cell | Live now | Year 3 equivalent |
|---|---|---|
| ICAS Y5 reading | 51 | 101 |
| ICAS Y5 spelling | 45 | 98 |
| ICAS Y5 language conventions | 37 | 94 |

## Rule: calibrate, then scale

Every target gets a small calibration batch first. I validate it against the real gates and answer
every item blind. Only if the recipe holds do we run it again for volume. This is why the earlier
Year 5 reading run was 7 items, not 40 — a wrong recipe is caught after 7, not after a day's review.

## The batches

| # | Prompt | Target | Items | Destination file | Id range |
|---|---|---|---|---|---|
| 1 | (already sent) | NAPLAN Y5 reading, harder | 7 | `naplan-y5-reading-depth-draft.json` | `roadmap-naplan-y5-reading-06-q1..q7` |
| 2 | prompt-icas-y5-spelling | ICAS Y5 spelling | 10 | `icas-y5-spelling-draft.json` | `roadmap-icas-y5-spelling-001..010` |
| 3 | prompt-icas-y5-language | ICAS Y5 language conventions | 10 | `icas-y5-language-draft.json` | `roadmap-icas-y5-language-001..010` |
| 4 | prompt-icas-y5-reading | ICAS Y5 reading | 1 passage + 8 | `icas-y5-reading-draft.json` | `roadmap-icas-y5-reading-01-q1..q8` |

All destination files live in `content/roadmap-drafts/`. Each is a NEW file — never appended to an
existing draft, because the answer-position check is per file and the 52 Year 5 items already in
review must not be disturbed.

## Hard validator gates (verified in scripts/validate-roadmap-drafts.mts)

- `draftOnly: true` and a `questions` array, or the file is rejected outright.
- No `Ã`, `Â`, or U+FFFD anywhere — recursive scan, fails the whole file.
- Ids unique across EVERY file in the folder, not just within one.
- Answer positions ≤ 35% per file: in a 10-item file no letter may appear more than 3 times;
  in an 8-item file, no more than 2.
- No repeating answer cycle of length 2–5 over more than four comparisons.
- Filenames must not start with `amc-` (that prefix triggers the 30-item AMC rules).

## After generation

Each file: `npm run content:validate-roadmap-drafts`, then the normal chain — ingest, correctness
check, independent semantic review, your approval, publish. These queue BEHIND the 96 already in
review. Nothing here jumps the human-approval gate.
