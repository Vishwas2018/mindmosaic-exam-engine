# Vihaan — Human-Readable Approval Package (Draft)

**Date:** 18 November 2026
**Worktree:** `C:/tmp/wt-vihaan-bank-agy-500`
**Branch:** `feat/vihaan-bank-agy-500` (from `origin/dev`, commit `003b102b`)
**Package status:** Draft — nothing approved, nothing published.

## 1. Approval status (current)

| Item | Value |
|---|---|
| Total questions in bank | 500 |
| Items with `status: "draft"` | 500 |
| Items with `approvedBy: null` | 500 (batch-level `approvedBy: null`; no per-item approver) |
| Items approved | 0 |
| Items published | 0 |
| Publication eligible | false |

Every batch file carries `"status": "draft"` and `"approvedBy": null`. Every question carries `"status": "draft"`. No question carries an `approvedBy` value. This package **cannot** be published as-is; human approval through the existing governed lifecycle is a mandatory prerequisite.

## 2. What is being submitted for human review

A complete, original, draft scholarship-preparation bank for an unofficial Huntingtower Year 7 scholarship-style examination:

- **Mathematics:** 120 (easy 20, medium 55, challenging 45)
- **Numerical Reasoning:** 120 (easy 18, medium 58, challenging 45)
- **Verbal Reasoning:** 120 (easy 18, medium 58, challenging 45)
- **Reading Comprehension:** 100 (easy 12, medium 40, challenging 48)
- **Written Expression:** 40 (easy 9, medium 14, challenging 17)

Organised as ten review units of 50 (`batch-01` … `batch-10`), plus the retained 20-item pilot (`vihaan-p01-###`). All 480 new items use `vihaan-agy-` prefixed IDs.

Each item includes: original prompt, four distinct options with one defensible key (MCQ), explanation, ≥2-step worked solution, subject/strand/skill/difficulty/marks/time-estimate metadata, topic tags, and (for numeric items) private arithmetic-check evidence. Writing tasks use the existing six-criterion human-assessed `scholarship-written-expression` rubric and carry no unique correct response.

## 3. Human reviewer obligations (all mandatory before approval)

1. Solve every MCQ blind to its key; confirm the key and justify rejection of each distractor.
2. Check every reading-comprehension key against passage evidence, including alternative interpretations.
3. Check every numerical solution against the actual stem (arithmeticCheck evidence is consistency evidence, not a semantic proof).
4. Confirm age suitability for an above-average Year 5/6 learner and Australian English usage.
5. Calibrate the authored difficulty labels and time estimates (they are editorial estimates, not psychometric).
6. Review originality (bounded internal screening only; no external corpus search).
7. Review visual-diagram clarity and numerical stem-to-solution grounding.
8. Assess writing tasks using the existing rubric; confirm writing taxonomy/blueprint onboarding is a separate governed prerequisite.
9. Record actual human identity and the exact approved revision through the existing authorised mechanisms; set `approvedBy` only there.

AI provenance and automated passes cannot populate `approvedBy` or grant publication eligibility.

## 4. Content governance and originality

- All 500 items are session-original; no official NAPLAN/ICAS/Edutest/Huntingtower question, passage or prompt was copied, adapted or fetched.
- Format reference used only: Edutest's public assessment descriptions (broad areas and writing modes), checked 16 November 2026.
- Answer material (keys, solutions, arithmetic evidence) is kept in private authoring/review fields — never in alt text, filenames or descriptive metadata.
- No arbitrary SVG; visuals use structured deterministic types only (max 2 per item).
- Bounded internal similarity screening passed (no exact or near-stem duplicates at Jaccard ≥ 0.82 against the internal corpus). This is not a worldwide originality or copyright certification.

## 5. ADR-017 position

ADR-017 is adopted policy/design only for a narrowly pinned legacy set; its admission route is not implemented or authorised here. These 500 session-authored drafts are not legacy candidates and have no factory clearance. No legacy refusals, review-independence rules, taxonomy registries, manifests, ledgers, publication approvals or production flags were relaxed. All `approvedBy` values remain null and all student-serving paths exclude these drafts.

## 6. What approval would change (future, not in this package)

On human sign-off, a governed reviewer would record `approvedBy` and the exact approved revision per item through the existing authorised mechanisms. Only then could items become publication-eligible and enter the intake/assembly/projection workflows. Until that happens:

- This package remains private draft content.
- No runtime consumer, publication manifest, database record or taxonomy registry may reference these items.
- No student route may serve these items.

## 7. Deliverables in this package

| File | Purpose |
|---|---|
| `content/vihaan-scholarship/expansion-500/batch-*.draft.json` | 480 new draft questions (10 batches of 50) |
| `content/vihaan-scholarship/pilot-01/draft.json` | 20 retained pilot questions (unchanged) |
| `content/vihaan-scholarship/expansion-500/consolidated-validation-report.json` | Machine validation report |
| `content/vihaan-scholarship/expansion-500/quality-coverage-report.json` | Consolidated coverage report |
| `docs/vihaan-scholarship/VALIDATION-REPORT.md` | Human-readable validation report |
| `docs/vihaan-scholarship/MOCK-EXAM-INVENTORY.md` | 100-item reserved mock inventory |
| `docs/vihaan-scholarship/APPROVAL-PACKAGE.md` | This document |

## 8. Bottom line

**Do not publish.** This is a complete, validated, on-distribution draft bank awaiting human review and approval. Automated checks pass; every numeric answer has been independently re-verified. The remaining gates are human: blind solving, semantic review, originality, age suitability, calibration, writing-rubric assessment and recorded `approvedBy`.
