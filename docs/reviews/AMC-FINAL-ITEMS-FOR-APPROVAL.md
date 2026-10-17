# AMC: the two items awaiting Vish's explicit approval (Year 3)

The other 55 AMC approvals are unchanged and still validate (exact content hash, revision, source hash; embedded record matches external record). Nothing below is approved or signed.

## roadmap-amc-y3-005 (final candidate)
**Prompt:** Ravi has 31 beads. He makes bracelets using 6 beads each. What is the smallest number of extra beads he needs so that all his beads make complete bracelets?
**Options:** a) 5  b) 1  c) 4  d) 2  e) 6   **Key:** a (5)
**Explanation:** The bead count leaves a remainder of one on division by six, so five more complete the last bracelet.
**Label / marks / time:** medium / 3 marks / 90 s. Skill: Divisibility and remainders.
**Changes from the version you approved:** (1) stem now says "the smallest number of extra beads" (without it 11, 17... also make complete bracelets); (2) distractor b changed 8 -> 1.

Distractor 8 -> 1, assessed on evidence rather than because a reviewer suggested it:
- 31 + 8 = 39 is not a multiple of 6, so 8 is wrong, but no common error produces 8; it was filler.
- 1 is the remainder of 31 / 6. Answering "1" is the classic slip of reporting the remainder instead of how many beads are missing. 31 + 1 = 32 is not a multiple of 6, so 1 is uniquely incorrect. 6 is plausible too (add a whole bracelet's worth).
- Other options: 4 (35 taken as next multiple), 2 (3s-table slip), 6 (a full bracelet). All distinct; only 5 gives 36.
- A fresh blind reviewer given the variant independently found each distractor's error, found no accidental second answer, and judged 1 "plausible and cannot be correct". Verdict: replace.

| Reviewer (all Claude Opus 5.5, fresh blind sessions, AI not human) | y3-005 |
|---|---|
| Review 1 (original packet) | REVISE: stem lacks "smallest"; label medium |
| Review 2 (revised stem) | wording sound; suggests b) 8 -> 1, optionally d) 2 -> 7 |
| Review 3 (variant with 1, labels withheld) | PASS: every distractor maps to a real error; d) 2 weakest but defensible |
d) 2 -> 7 (31 - 24) was not adopted: 7 is not a plausible error from the stem, and 2 already corresponds to a real slip.

## roadmap-amc-y3-016 (final candidate)
**Prompt:** Four plates each hold 6 apple pieces. Two more apple pieces are added to every plate. How many apple pieces are on the plates now?
**Options:** a) 30  b) 32  c) 24  d) 28  e) 26   **Key:** b (32)
**Explanation:** At first there are 4 x 6 = 24 pieces. Adding 2 pieces to each of 4 plates adds 8 more. Altogether there are 24 + 8 = 32 pieces.
**Label / marks / time:** easy (as you instructed) / 4 marks / 120 s. Skill: Apply equal groups in two steps. Content is unchanged; only the label differs from your last approval (medium).

Difficulty, from reasoning demand only: two steps (new amount per plate or total added, then multiply), small numbers, one Year 3 multiplication fact, and one real trap (26 = adding 2 once). It needs no new concept, no abstraction and no multi-concept combination.
| Reviewer | Label | Reasoning |
|---|---|---|
| Review 1 (labelled packet) | easy | single add-then-multiply step, no real trap; easier than y3-013 and y3-007 |
| Review 2 (labelled packet) | medium | two steps with a real trap (26); "easy" with 4 marks does not fit together |
| Review 3 (labels and marks withheld) | easy | only demand is reading "every plate"; no combined concepts |
**Recommendation: easy**, moderate confidence (two of three independent blind assessments, and my own read of the demand). If you prefer medium, the content is byte-identical to the item you already approved as medium, so that earlier approval is still valid for it and no new signature is needed (archived at `docs/reviews/amc-2026-10-17/superseded-before-independent-review/`; reinstating it is a deliberate step I will not take without your word).

**Marks are separate.** 4 marks is the positional tier AMC papers use (pattern tiers filter marks 3 / 4 / 5 / 6-10), not a difficulty statement, so I recommend leaving it at 4. Changing marks would move the item to another tier of the paper, and I have not done that to justify a label.

## What you decide
1. y3-005: approve the final candidate above (or revise).
2. y3-016: label easy (new approval) or medium (existing approval reinstated); marks stay 4.
After approval I record it through `content:record-approvals`, then ingest, pipeline, stage, publish and strict scoped assembly for these two.
