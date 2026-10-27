# Bar-model pilot — human blind review tracking

**PR #80 (draft, targeting `dev`):** `feat/bar-modelling-30-question-pilot` at commit `10cc1d93b4726c096c2ca673c54602ef704a71f3`
**Pilot:** 30 original Singapore Maths bar-model draft items (Year 3 × 15, Year 5 × 15)
**Fixture source:** `src/content/visual-fixtures/bar-model/index.ts`
**Fixture source SHA-256:** `bf61bfde5a39945804b74b9fbbd1ac53f4af8c919aebc161d576b4fbb431776e` (verified identical in the blind packet, text packet and keyed report artifacts)

## Reviewer (to be completed by the human reviewer — do not pre-fill)

Reviewer name: ____________________
Review date: ____________________

## Review packets

| Artifact | Path | Contents |
|---|---|---|
| Blind reviewer packet (HTML) | `docs/reviews/pr80/bar-model-pr80-blind-review-packet.html` | All 30 items: ID, year, skill, difficulty, unit, prompt, unsolved bar diagram, givens-only description, per-item review fields. No answer keys or explanations. |
| Blind text reference | `docs/reviews/pr80/bar-model-pr80-blind-review-packet.txt` | Same 30 items, givens-only diagram descriptions; deterministic rendering of the committed fixture SHA. No answer keys or explanations. |
| Keyed answers + worked explanations (RESTRICTED) | `docs/reviews/pr80/bar-model-pr80-keyed-report.txt` | Independent cross-check vs stored keys and model solver. Open **only after** all 30 blind assessments are complete. |
| PR evidence | `docs/reviews/pr80/bar-model-pr80-evidence.md` | CI results, alignment examination, remaining approval requirements. |

## Instructions for the human reviewer

1. Work through the blind packet items 01–30 in order. Do **not** open the keyed report until every blind assessment below is complete.
2. For each item, independently calculate the answer from the prompt and bar diagram and record it in the HTML packet's "Your independently calculated answer" field.
3. Rate each item: confidence (1–5), ambiguity (none/minor/major), difficulty appropriateness (too easy/about right/too hard), diagram accuracy (accurate/minor issue/major issue); note suggested corrections where applicable.
4. After the blind pass, open the keyed report, compare your answers, record discrepancies, and mark each item's resolution status (open / resolved / revision required) and final decision (approve as drafted / approve with revision / reject).
5. Sign and date the sign-off block. This document records an independent human review only — no AI-attested approval is claimed. `approvedBy` in the PR evidence remains blank until the owner records genuine human sign-off.

## Question-level findings (30 items)

| # | Question ID | Year | Skill | Difficulty | Unit | Independent answer (reviewer) | Reviewer findings | Resolution status | Final decision |
|---|-------------|------|-------|------------|------|-------------------------------|-------------------|-------------------|----------------|
| 1 | pilot-y3-part-whole-01 | 3 | part-whole | easy | sticks | | | | |
| 2 | pilot-y3-comparison-01 | 3 | comparison | easy | shells | | | | |
| 3 | pilot-y3-times-as-many-01 | 3 | times-as-many | medium | tokens | | | | |
| 4 | pilot-y3-part-whole-02 | 3 | part-whole | easy | apples | | | | |
| 5 | pilot-y3-comparison-02 | 3 | comparison | easy | flowers | | | | |
| 6 | pilot-y3-times-as-many-02 | 3 | times-as-many | medium | books | | | | |
| 7 | pilot-y3-part-whole-03 | 3 | part-whole | medium | marbles | | | | |
| 8 | pilot-y3-comparison-03 | 3 | comparison | medium | stickers | | | | |
| 9 | pilot-y3-times-as-many-03 | 3 | times-as-many | hard | cards | | | | |
| 10 | pilot-y3-part-whole-04 | 3 | part-whole | easy | crayons | | | | |
| 11 | pilot-y3-comparison-04 | 3 | comparison | medium | blocks | | | | |
| 12 | pilot-y3-times-as-many-04 | 3 | times-as-many | medium | pencils | | | | |
| 13 | pilot-y3-part-whole-05 | 3 | part-whole | hard | buttons | | | | |
| 14 | pilot-y3-comparison-05 | 3 | comparison | hard | stick figures | | | | |
| 15 | pilot-y3-times-as-many-05 | 3 | times-as-many | hard | bears | | | | |
| 16 | pilot-y5-equal-units-01 | 5 | equal-units | easy | biscuits | | | | |
| 17 | pilot-y5-before-after-01 | 5 | before-after | easy | beans | | | | |
| 18 | pilot-y5-transfer-01 | 5 | transfer | easy | stickers | | | | |
| 19 | pilot-y5-equal-units-02 | 5 | equal-units | medium | coins | | | | |
| 20 | pilot-y5-before-after-02 | 5 | before-after | medium | marbles | | | | |
| 21 | pilot-y5-transfer-02 | 5 | transfer | medium | tokens | | | | |
| 22 | pilot-y5-equal-units-03 | 5 | equal-units | easy | sticks | | | | |
| 23 | pilot-y5-before-after-03 | 5 | before-after | hard | pencils | | | | |
| 24 | pilot-y5-transfer-03 | 5 | transfer | hard | marbles | | | | |
| 25 | pilot-y5-equal-units-04 | 5 | equal-units | medium | cups | | | | |
| 26 | pilot-y5-before-after-04 | 5 | before-after | medium | stickers | | | | |
| 27 | pilot-y5-transfer-04 | 5 | transfer | hard | buttons | | | | |
| 28 | pilot-y5-equal-units-05 | 5 | equal-units | hard | sweets | | | | |
| 29 | pilot-y5-before-after-05 | 5 | before-after | hard | lollies | | | | |
| 30 | pilot-y5-transfer-05 | 5 | transfer | hard | cards | | | | |

## Reviewer sign-off

Reviewer name: ____________________   Signature: ____________________   Date: ____________________

Items reviewed: ____ / 30    Items requiring revision: ____    Items rejected: ____

Overall decision: ____________________

## Notes

- This tracking document deliberately contains no answer keys. Keys are in `bar-model-pr80-keyed-report.txt` (restricted review artifact).
- `approvedBy` is not populated here or in the PR evidence; the owner populates it only after genuine independent human sign-off is recorded.
- PR #80 remains draft. No merge, deployment, content publication, or human approval has been performed.
