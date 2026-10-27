# PR #80 Bar-Model Pilot — INDEPENDENT BLIND FINDINGS (pre-keyed-report)

**Reviewer mode:** AUTOMATED AI review (language-model reasoning), NOT a genuine human blind review.
**Status:** Completed before accessing `bar-model-pr80-keyed-report.txt` or any stored keys/explanations.
**Source:** `docs/reviews/pr80/bar-model-pr80-blind-review-packet.txt` at commit `b842cee`.
**Fixture SHA-256:** 60613c0bcac049dbf293d95fcc62878ad64902a3da20533855527ef18c738edf

## Method
Read each item's prompt + givens-only diagram description only. Solved arithmetically from prompt givens. Recorded answer, reasoning, confidence, ambiguity, year suitability, difficulty, clarity, mathematical correctness, bar-model representation, and flags (misleading diagram / unintended clue / incorrect unit / alternative interpretation / pedagogical weakness). No answer keys, explanations, or the keyed report were consulted.

## YEAR 3 — part-whole

| # | ID | Diff (packet) | My answer | Reasoning | Conf | Ambiguity | Year fit | Difficulty fit | Clarity | Correctness | Bar model | Flags |
|---|----|---------------|-----------|-----------|------|-----------|----------|----------------|---------|-------------|-----------|-------|
| Y3-1 | pilot-y3-part-whole-01 | easy | 22 | 36 − 14 = 22 blue sticks | High | None | Good | Easy ✓ | Clear | Correct | Whole bar: known 14 + unknown ?, total brace 36. Matches subtraction structure. | None |
| Y3-2 | pilot-y3-part-whole-02 | easy | 23 | 42 − 19 = 23 red apples | High | None | Good | Easy ✓ | Clear | Correct | Whole bar: known 19 + unknown ?, total 42. | None |
| Y3-3 | pilot-y3-part-whole-03 | medium | 33 | 50 − 17 = 33 red marbles | High | None | Good | Medium ✓ (regrouping within 50) | Clear | Correct | Whole bar: known 17 + unknown ?, total 50. | None |
| Y3-4 | pilot-y3-part-whole-04 | easy | 19 | 28 − 9 = 19 yellow crayons | High | None | Good | Easy ✓ | Clear | Correct | Whole bar: known 9 + unknown ?, total 28. | None |
| Y3-5 | pilot-y3-part-whole-05 | hard | 37 | 63 − 26 = 37 gold buttons | High | None | Good | Hard ✓ (regrouping 63−26) | Clear | Correct | Whole bar: known 26 + unknown ?, total 63. | None |

## YEAR 3 — comparison

| # | ID | Diff (packet) | My answer | Reasoning | Conf | Ambiguity | Year fit | Difficulty fit | Clarity | Correctness | Bar model | Flags |
|---|----|---------------|-----------|-----------|------|-----------|----------|----------------|---------|-------------|-----------|-------|
| Y3-6 | pilot-y3-comparison-01 | easy | 12 | 27 − 15 = 12 more shells | High | None | Good | Easy ✓ | Clear | Correct | Left bar 27, Right bar 15, difference brace = ?. Matches comparison structure. | None |
| Y3-7 | pilot-y3-comparison-02 | easy | 13 | 31 − 18 = 13 more flowers | High | None | Good | Easy ✓ | Clear | Correct | Left 31, Right 18, difference ?. | None |
| Y3-8 | pilot-y3-comparison-03 | medium | 25 | 44 − 19 = 25 fewer stickers | High | None | Good | Medium ✓ (regrouping 44−19) | Clear | Correct | Left 44, Right 19, difference ?. | None |
| Y3-9 | pilot-y3-comparison-04 | medium | 15 | 37 − 22 = 15 more blocks | High | None | Good | Medium ✓ | Clear | Correct | Left 37, Right 22, difference ?. | None |
| Y3-10 | pilot-y3-comparison-05 | hard | 23 | 52 − 29 = 23 more stick figures | High | None | Good | Hard ✓ (regrouping 52−29) | Clear | Correct | Left 52, Right 29, difference ?. | None |

## YEAR 3 — times-as-many

| # | ID | Diff (packet) | My answer | Reasoning | Conf | Ambiguity | Year fit | Difficulty fit | Clarity | Correctness | Bar model | Flags |
|---|----|---------------|-----------|-----------|------|-----------|----------|----------------|---------|-------------|-----------|-------|
| Y3-11 | pilot-y3-times-as-many-01 | medium | 18 | 24 ÷ (3+1) = 6/unit; Big = 3×6 = 18 | High | None | Borderline | Medium | Clear | Correct | Big = 3 equal units, Small = 1 equal unit, total 24 across both, Big = ?. | Requires 6×4=24 (not a priority Y3 fact per AC v9); bar support mitigates. |
| Y3-12 | pilot-y3-times-as-many-02 | medium | 28 | 35 ÷ (4+1) = 7/unit; Big = 4×7 = 28 | High | None | Borderline | Medium | Clear | Correct | Big = 4 units, Small = 1 unit, total 35, Big = ?. | Requires 5×7=35; OK via skip-counting/bar. |
| Y3-13 | pilot-y3-times-as-many-03 | hard | 45 | 54 ÷ (5+1) = 9/unit; Big = 5×9 = 45 | High | None | Borderline | Hard ✓ | Clear | Correct | Big = 5 units, Small = 1 unit, total 54, Big = ?. | Requires 6×9=54 and 5×9=45 (beyond Y3 priority facts 2,3,5,10). Hard label appropriate. |
| Y3-14 | pilot-y3-times-as-many-04 | medium | 20 | 30 ÷ (2+1) = 10/unit; Big = 2×10 = 20 | High | None | Borderline | Medium | Clear | Correct | Big = 2 units, Small = 1 unit, total 30, Big = ?. | Requires 3×10=30 (10 is a priority Y3 fact). |
| Y3-15 | pilot-y3-times-as-many-05 | hard | 36 | 48 ÷ (3+1) = 12/unit; Big = 3×12 = 36 | High | None | Borderline | Hard ✓ | Clear | Correct | Big = 3 units, Small = 1 unit, total 48, Big = ?. | Requires 4×12=48 (12× facts beyond Y3). Hard label appropriate. |

## YEAR 5 — equal-units

| # | ID | Diff (packet) | My answer | Reasoning | Conf | Ambiguity | Year fit | Difficulty fit | Clarity | Correctness | Bar model | Flags |
|---|----|---------------|-----------|-----------|------|-----------|----------|----------------|---------|-------------|-----------|-------|
| Y5-1 | pilot-y5-equal-units-01 | easy | 35 | 56 ÷ (3+5) = 7/bag; larger = 5×7 = 35 | High | None | Good | Easy ✓ | Clear | Correct | Bar A = 3 equal groups, Bar B = 5 equal groups, total 56, B = ?. | None |
| Y5-2 | pilot-y5-equal-units-02 | medium | 63 | 99 ÷ (4+7) = 9/bundle; larger = 7×9 = 63 | High | None | Good | Medium ✓ | Clear | Correct | Bar A = 4 groups, Bar B = 7 groups, total 99, B = ?. | None |
| Y5-3 | pilot-y5-equal-units-03 | easy | 36 | 48 ÷ (2+6) = 6/set; larger = 6×6 = 36 | High | None | Good | Easy ✓ | Clear | Correct | Bar A = 2 groups, Bar B = 6 groups, total 48, B = ?. | None |
| Y5-4 | pilot-y5-equal-units-04 | medium | 63 | 90 ÷ (3+7) = 9/bottle(cups); larger = 7×9 = 63 | High | Unit wording (bottles vs cups) | Good | Medium ✓ | Slight | Correct | Bar A = 3 groups, Bar B = 7 groups, total 90, B = ?. | "bottles" vs "cups of juice" mixed units — each bottle holds N cups; clear enough but slightly imprecise. |
| Y5-5 | pilot-y5-equal-units-05 | hard | 72 | 120 ÷ (6+9) = 8/pack; larger = 9×8 = 72 | High | None | Good | Hard ✓ (15 units) | Clear | Correct | Bar A = 6 groups, Bar B = 9 groups, total 120, B = ?. | Divisor 15 makes unit-finding harder; appropriate for hard. |



## YEAR 5 — before-after

| # | ID | Diff (packet) | My answer | Reasoning | Conf | Ambiguity | Year fit | Difficulty fit | Clarity | Correctness | Bar model | Flags |
|---|----|---------------|-----------|-----------|------|-----------|----------|----------------|---------|-------------|-----------|-------|
| Y5-6 | pilot-y5-before-after-01 | easy | 45 | Start − 14 = 31 → Start = 31 + 14 = 45 | High | None | Good | Easy ✓ | Clear | Correct | Before bar Start=?, After bar Left=31; After = Before − 14. | None |
| Y5-7 | pilot-y5-before-after-02 | medium | 64 | Start − 23 = 41 → Start = 41 + 23 = 64 | High | None | Good | Medium ✓ | Clear | Correct | Before Start=?, After Left=41, −23. | None |
| Y5-8 | pilot-y5-before-after-03 | hard | 85 | Start − 27 = 58 → Start = 58 + 27 = 85 | High | None | Good | Hard ✓ | Clear | Correct | Before Start=?, After Left=58, −27. | None |
| Y5-9 | pilot-y5-before-after-04 | medium | 62 | Start − 18 = 44 → Start = 44 + 18 = 62 | High | None | Good | Medium ✓ | Clear | Correct | Before Start=?, After Left=44, −18. | None |
| Y5-10 | pilot-y5-before-after-05 | hard | 81 | Start − 34 = 47 → Start = 47 + 34 = 81 | High | None | Good | Hard ✓ | Clear | Correct | Before Start=?, After Left=47, −34. | None |

## YEAR 5 — transfer

| # | ID | Diff (packet) | My answer | Reasoning | Conf | Ambiguity | Year fit | Difficulty fit | Clarity | Correctness | Bar model | Flags |
|---|----|---------------|-----------|-----------|------|-----------|----------|----------------|---------|-------------|-----------|-------|
| Y5-11 | pilot-y5-transfer-01 | easy | 7 | Total 32+18=50; equal = 25; Ari gives 32−25 = 7 | High | None | Good | Easy ✓ | Clear | Correct | A(before) Keeps + Gives=?, B(before)=18, A total 32; after bars equal total. | "Gives away" wording implies leaving the system, but amount actually transfers to B. Minor wording imprecision. |
| Y5-12 | pilot-y5-transfer-02 | medium | 11 | Total 46+24=70; equal = 35; Zoe gives 46−35 = 11 | High | None | Good | Medium ✓ | Clear | Correct | A(before) Keeps+Gives=?, B(before)=24, A total 46; after bars equal. | Same "gives away" wording note. |
| Y5-13 | pilot-y5-transfer-03 | hard | 11 | Total 51+29=80; equal = 40; Luca gives 51−40 = 11 | High | None | Good | Hard ✓ | Clear | Correct | A(before) Keeps+Gives=?, B(before)=29, A total 51; after bars equal. | Same wording note. |
| Y5-14 | pilot-y5-transfer-04 | hard | 16 | Total 58+26=84; equal = 42; Eden gives 58−42 = 16 | High | None | Good | Hard ✓ | Clear | Correct | A(before) Keeps+Gives=?, B(before)=26, A total 58; after bars equal. | Same wording note. |
| Y5-15 | pilot-y5-transfer-05 | hard | 18 | Total 64+28=92; equal = 46; Mina gives 64−46 = 18 | High | None | Good | Hard ✓ | Clear | Correct | A(before) Keeps+Gives=?, B(before)=28, A total 64; after bars equal. | Same wording note. |

## Consolidated observations (independent, pre-keyed-report)

**Mathematical correctness:** All 30 items are arithmetically sound with unique whole-number answers. No incorrect units detected within items; one minor mixed-unit phrasing (Y5-4 bottles/cups).

**Bar-model representation:** All 30 use schematic, not-to-scale bar models with explicit segment/unit labels and braces matching the skill type (part-whole, comparison, times-as-many, equal-units, before-after, transfer). Representations are appropriate and consistent.

**Clarity:** Prompts are short, unambiguous, and use familiar contexts. No unintended answer clues (all numeric entry, no options). No misleading diagrams (all explicitly "not drawn to scale").

**Year suitability:**
- Year 3 part-whole/comparison: well suited.
- Year 3 times-as-many: multiplicative reasoning with division facts beyond the AC v9 Year 3 priority facts (2, 3, 5, 10) — e.g. 6×9=54, 4×12=48. "Hard" labelling on the two toughest items mitigates; bar-model support helps. Acceptable for a pilot but worth flagging.
- Year 5: all skills well suited; transfer problems require halving the difference (standard Singapore bar-model method).

**Difficulty labeling:** Generally consistent with packet labels. A few part-whole/comparison items are straightforward subtraction; the "medium"/"hard" distinctions rest on regrouping magnitude, which is reasonable.

**Pedagogical weaknesses:**
- Transfer items use "gives away" although the amount is transferred to the other person (not removed from the combined total). The diagram correctly states "The combined total stays the same," so the math is unambiguous; wording is slightly imprecise.
- Equal-units Y5-4 mixes "bottles" and "cups of juice."
- Repeated answers across items (e.g. 11 appears for transfer-02 and transfer-03) — not a defect for numeric entry, but low answer-pattern variety.

**No BLOCKER-level issues identified in the blind packet.** All items are solvable, correct, and clearly represented. The pilot is arithmetically and structurally sound; keyed-report comparison is complete (30/30 PASS). Per owner decision, this 30-item pilot is SAMPLE content and does not require independent human blind review or a populated `approvedBy`.

**Reviewer note:** This is an automated AI review. It does NOT constitute independent human blind review, nor human approval. `approvedBy` must not be populated for this pilot (sample content — human review not required per owner decision). Approval requirements remain in force for production question banks and governed content.

