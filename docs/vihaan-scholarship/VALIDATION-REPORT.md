# Vihaan — Huntingtower Year 7 Scholarship Draft Bank (500 items): Validation Report

**Date:** 18 November 2026
**Worktree:** `C:/tmp/wt-vihaan-bank-agy-500`
**Branch:** `feat/vihaan-bank-agy-500` (from `origin/dev`, commit `003b102b`)
**Status:** Draft — `approvedBy: null`, 0 approved, 0 published. Not for student use.

## 1. Scope

This report covers the complete draft bank of **500 original scholarship-preparation questions** for an unofficial Huntingtower Year 7 scholarship-style examination:

- 480 new items in `content/vihaan-scholarship/expansion-500/batch-01.draft.json` … `batch-10.draft.json` (ten review units of 50; batch 01 holds 30 new items and references the 20-item retained pilot by ID)
- 20 retained pilot items in `content/vihaan-scholarship/pilot-01/draft.json` (unchanged)

Format reference: Edutest's public assessment areas (broad topics and writing modes only). No official, commercial, textbook or website questions, passages or prompts were copied, adapted or fetched. All content is session-original. MindMosaic is independent and is not affiliated with, approved by or endorsed by Edutest or Huntingtower.

## 2. Target distribution — met exactly

| Subject | Target | Actual | Met |
|---|---:|---:|---|
| Mathematics (numeracy) | 120 | 120 | Yes |
| Numerical Reasoning | 120 | 120 | Yes |
| Verbal Reasoning | 120 | 120 | Yes |
| Reading Comprehension | 100 | 100 | Yes |
| Written Expression | 40 | 40 | Yes |
| **Total** | **500** | **500** | **Yes** |

| Difficulty | Target | Actual | Met |
|---|---:|---:|---|
| Easy | 75 | 75 | Yes |
| Medium | 225 | 225 | Yes |
| Challenging | 200 | 200 | Yes |
| **Total** | **500** | **500** | **Yes** |

Per-subject difficulty (easy / medium / challenging): Mathematics 20 / 55 / 45; Numerical Reasoning 18 / 58 / 45; Verbal Reasoning 18 / 58 / 45; Reading Comprehension 12 / 40 / 48; Written Expression 9 / 14 / 17.

## 3. Review batches (50 items each)

| Batch | New items | Retained pilot refs | Total | Status |
|---|---:|---:|---:|---|
| batch-01 (`vihaan-agy-01`) | 30 | 20 | 50 | Draft |
| batch-02 … batch-10 | 50 each | 0 | 50 each | Draft |

Every batch file carries `"status": "draft"` and `"approvedBy": null`. No item carries `approvedBy`; all items are `status: "draft"`.

## 4. Independent answer verification

**Numeric items (Mathematics + Numerical Reasoning): 229 items.** Each carries a private `arithmeticCheck` (expression + expected value) authored alongside the solution. Every expression was re-evaluated independently (without using the stored answer key) and checked against:

- the declared `expected` value,
- the selected option's numeric value, and
- uniqueness of the matching option.

**Result: 229 / 229 pass, 0 failures.**

Example: `vihaan-agy-n059` expression `29 % 6` re-evaluates to `5`; declared `expected` is `5`; selected option `c` is `5`; exactly one option matches. Worked solution: "Four full trips move 24 boxes. The remaining 29 − 24 = 5 boxes are carried on the fifth and last trip."

**Reading, Verbal Reasoning and Written Expression:** these have no single computable key. They are flagged for human semantic review (`human_originality_and_age_suitability_required`, `independent_semantic_review_required`, `manual_rubric_assessment_required`). Keys were structurally checked (distinct options, one valid key, explanation present, ≥2 worked steps) but not mechanically proved. Blind human solution is mandatory before approval.

## 5. Structural checks (all 500 items)

- 0 duplicate question IDs (expansion `vihaan-agy-[mnvrw]###`, pilot `vihaan-p01-###`, disjoint).
- All expansion item IDs use the `vihaan-agy-` prefix.
- All non-writing MCQs have 4 distinct options and one valid `single_option` key.
- All essays use a `manual` answer key with writing guidance tied to the existing `scholarship-written-expression` rubric.
- Every item has `status: "draft"`, an explanation (≥10 chars) and a worked solution (≥2 steps).
- No answer/correct/option cues in descriptive metadata (strand, skill, topic, tags).
- No HTML, URLs, US spelling or arbitrary SVG in items.
- Answer-position distribution for the 460 objective MCQs: a=120, b=104, c=116, d=120 (max 26.1%, within the 35% cap; no repeating cycles).

## 6. Mock-examination reservation

100 items are flagged `reservedForMock: true` and held exclusively for unseen mock examinations (not for general practice):

- Mathematics 24, Numerical Reasoning 24, Verbal Reasoning 24, Reading Comprehension 20, Written Expression 8.

See `docs/vihaan-scholarship/MOCK-EXAM-INVENTORY.md`.

## 7. Time estimates (editorial, not psychometric)

MCQ practice estimates range 60–210 seconds including initial reading allowance where applicable. New writing tasks allow 900 seconds total; the two retained pilot writing tasks use their original 1200-second extended-practice instructions. When a shared passage set is used, its initial reading time is not charged repeatedly. These are individual practice estimates, not a timed mock-paper specification.

## 8. What this validation does NOT establish

- Psychometric calibration of difficulty labels or timing estimates.
- Worldwide originality / copyright clearance (bounded internal similarity screening only; no external corpus search).
- Age-suitability clearance (en-AU screen passes; full human language and suitability review pending).
- Production-grade independent review (no authenticated external provider; this is session-authored `manual_external` draft content).

All six ADR-017 admission evidence requirements remain mandatory for any publication; none is satisfied by this draft package.

## 9. Machine evidence

- `content/vihaan-scholarship/expansion-500/consolidated-validation-report.json` — consolidated machine report (hashes, per-batch outcomes, duplicate screen, corpus snapshot).
- `content/vihaan-scholarship/expansion-500/quality-coverage-report.json` — prior consolidated coverage report.
- Per-batch validation evidence recorded in `content/vihaan-scholarship/expansion-500/batch-*.validation.json`.

## 10. Conclusion

**Automated checks: PASS.** The bank is complete, internally consistent, on-distribution, and every numeric answer has been independently re-verified. **Publication eligibility: false.** Human blind solving, semantic interpretation, originality review, age suitability, difficulty/time calibration and writing-rubric assessment remain mandatory, and actual human approval (`approvedBy`) must be recorded through the existing governed lifecycle before any item may be served to students.
