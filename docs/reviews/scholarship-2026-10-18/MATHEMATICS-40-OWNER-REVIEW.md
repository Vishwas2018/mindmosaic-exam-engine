# MATHEMATICS-40-OWNER-REVIEW: internal owner pack and decision table

> **Internal, answer-bearing.** This pack contains keys, explanations and machine results. **Never send it to a reviewer.** Reviewers receive only `answer-blind/MATHEMATICS-40-REVIEWER-PACKET.md` (packet SHA-256 `2c838e60801dc4d9fce7dfa5f0fb2ac29c54c80c33f871679d7051770de757d1`). This document is AI-generated advisory material. It is not qualified human review, not independent evidence for any gate, and conveys no authority to approve, publish or deploy.

**Audit status:** all machine key checks that exist passed; 0 failed. (A failed check aborts generation.)

## 1. Evidence summary (recomputed)

| Evidence dimension | verified | failed | not_established | Evidence reference |
|---|---:|---:|---:|---|
| Machine-verified arithmetic / closed-language result (40 first-party recompute, 0 closed-language solver) | 40 | 0 | 0 | scholarship-attestation.ts, solver-verification.ts |
| Stem-to-solver semantic verification | 0 | 0 | 40 | ADR-017 requirement 2: never performed |
| Independently checked answer uniqueness | 0 | 0 | 40 | no independent uniqueness record |
| Distractor quality | 0 | 0 | 40 | no distractor review record |
| Age and curriculum appropriateness | 0 | 0 | 40 | ADR-017 requirement 5: no reviewer engaged |
| Qualified human review | 0 | 0 | 40 | no qualified reviewer engaged |

A matching key and solver result establishes arithmetic consistency only. It does not establish that the stem was interpreted as intended, that no second reading exists, that the distractors are good, or that the item suits Year 6.

## 2. Status

- **Total questions:** 40
- **Committed pipeline buckets (status.json):** ready_for_review: 19; requires_revision_or_decision: 21
- **Publication eligibility today:** 0 of 40. Phase 1 fail-closed gates refuse legacy-import content.
- **ADR-017 scope (read from the owner adoption record):** 3 initial engineering candidate(s) (`scholarship-y6-maths-004`, `scholarship-y6-maths-007`, `scholarship-y6-maths-014`); adopted policy only, implementation unbuilt. All other items have no adopted admission route.
- **Original generation:** not_established for every item (see section 4).

## 3. Difficulty decision table (declared label differs from estimator)

Advisory recommendations come from documented assessor `Claude Sonnet 5.5 (Claude Code), written 2026-10-18 after independently solving every item and before reading the earlier 2026-10-17 assessment`. The historical generator declaration (`anthropic/claude-sonnet-5`) is unverified, and true original generation remains unknown. Under `docs/REVIEW_INDEPENDENCE_POLICY.md` and ADR-017, independence cannot be established against an unknown original generator. These recommendations remain advisory input and do not constitute production-grade independent evidence.

| ID | Declared | Estimator | Advisory recommendation | Advisory rationale | Owner decision (BLANK) |
|---|---|---|---|---|---|
| `scholarship-y6-maths-002` | `easy` | `medium` | keep (easy) | Three sequential signed changes with direction words. Several operations but one idea, so easy. | |
| `scholarship-y6-maths-003` | `medium` | `easy` | keep (medium) | A double negative inside a four-term expression; the sign handling, not the arithmetic, is the demand. | |
| `scholarship-y6-maths-008` | `easy` | `medium` | keep (easy) | Percentage difference (20%) of a total, or two simple percentages. Routine. | |
| `scholarship-y6-maths-010` | `easy` | `medium` | keep (easy) | Percentage increase on friendly numbers. The wrong-base trap (20%) is well known and is offered as a distractor. | |
| `scholarship-y6-maths-012` | `easy` | `medium` | keep (easy) | Share $72,000 in the ratio 2:3:4 and report the middle share. Standard. | |
| `scholarship-y6-maths-017` | `easy` | `medium` | keep (easy) | Ratio parts of a total with friendly numbers. | |
| `scholarship-y6-maths-019` | `easy` | `medium` | keep (easy) | Sum and difference of two ages with small numbers. | |
| `scholarship-y6-maths-020` | `medium` | `easy` | keep (medium) | Unknown on both sides of a given equation. Procedural, but collecting terms across the equals sign is above routine Year 6 work. | |
| `scholarship-y6-maths-021` | `medium` | `easy` | keep (medium) | Three consecutive odd numbers need either the mean shortcut (29, then +2) or x, x+2, x+4 set up and solved. The distractor 29 catches the slip. Borderline easy. | |
| `scholarship-y6-maths-022` | `medium` | `easy` | keep (medium) | Two linear conditions in two unknowns, solved by substitution or elimination. Arguably the hardest maths item in this group and could be argued up to challenging. | |
| `scholarship-y6-maths-023` | `medium` | `easy` | relabel_easy (easy) | Direct substitution; the only care needed is reading 2qr as a product and applying order of operations. | |
| `scholarship-y6-maths-025` | `medium` | `easy` | keep (medium) | A verbal description must be translated into 6n - 14 = 2n + 18, then solved with the unknown on both sides. | |
| `scholarship-y6-maths-026` | `medium` | `easy` | keep (medium) | Vertically opposite angles are equal, then an unknown-on-both-sides solve, then back-substitution to report the angle rather than x. | |
| `scholarship-y6-maths-027` | `medium` | `easy` | keep (medium) | All three angles must be expressed through one variable and summed to 180; the distractor 40 is the value of B, not A. | |
| `scholarship-y6-maths-029` | `medium` | `easy` | keep (medium) | Supplementary angles plus a careful translation of '36 less than three times'; the question asks for the smaller angle, so the other angle must be checked. | |
| `scholarship-y6-maths-031` | `easy` | `medium` | keep (easy) | Subtract one square area from another. | |
| `scholarship-y6-maths-032` | `medium` | `easy` | keep (medium) | Needs the polygon angle-sum rule or the exterior-angle idea, which is stretch content for Year 6; the arithmetic after that is easy. | |
| `scholarship-y6-maths-033` | `easy` | `medium` | keep (easy) | Complement probability as a percentage; the NOT in the stem is the only trap. | |
| `scholarship-y6-maths-035` | `medium` | `easy` | keep (medium) | Inclusion-exclusion (or a Venn diagram) to avoid double-counting the 7 who play both sports. | |
| `scholarship-y6-maths-037` | `easy` | `medium` | keep (easy) | A repeated change followed by one more; the result crosses zero but the arithmetic is two simple steps. | |
| `scholarship-y6-maths-039` | `medium` | `easy` | keep (medium) | Build a perimeter expression that counts the repeated side twice, collect terms, then solve for k. | |

## 4. Provenance reconciliation

| Aspect | Status | Evidence |
|---|---|---|
| Verified original generation | not_established | no execution record (provider, model, prompt, hash, timestamp) exists |
| Historical declared generation | declared, unverified | docs/reviews/scholarship-2026-10-18/CONTENT-REVIEW-FINDINGS.md states `anthropic/claude-sonnet-5`; a documentation statement, not an execution record |
| Repository revision provenance | verified (40/40 D2 pins match) | all 40 items match recomputed D2 candidate hashes in src/features/question-factory/correctness/scholarship-identity-pins.json; D1/D2/D3 hashes recomputed; binds imported bytes, not original generation (unknown) |
| Independent reviewer identity and qualification | not_established | independence cannot be evaluated against an unknown original generator (ADR-017; REVIEW_INDEPENDENCE_POLICY) |

### Repository revision binding details for this section
- **Verified D2 identity pins:** 40 of 40 items match the recomputed D2 factory candidate hash in `src/features/question-factory/correctness/scholarship-identity-pins.json`.
- **Present but mismatched pins:** 0 of 40 items have identity pins in `src/features/question-factory/correctness/scholarship-identity-pins.json` that differ from recomputed D2 candidate hashes (binding not established; a mismatched pin cannot be described as verified repository-revision binding).
- **Missing pins:** 0 of 40 items have no entry in `src/features/question-factory/correctness/scholarship-identity-pins.json`.
- **Recomputed D1/D2/D3 source hashes:** D1 (raw JSON draft), D2 (factory candidate), and D3 (canonical published Question) hashes were successfully recomputed for all 40 items in this section.
- **Unknown original generation:** Identity pins bind imported candidate bytes only, not their author or generating model. Original generation remains unknown / not_established across all items.

A Git author or co-author trailer, an importer, a historical declaration or a reviewing model is not proof of the original generator.

## 5. Per-question evidence

### scholarship-y6-maths-001 (maths-directed-numbers)

- **Prompt:** At dawn in the Snowy Mountains, the temperature was -6°C. By midday, the temperature had risen by 14°C, but by midnight it fell by 11°C. What was the temperature at midnight?
- **Stored key:** `a` (-3°C)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = -3; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `easy` (confidence 1.00)
- **Hash bindings:** D1 `d2cc160575a84c0d2fa9cc661edc189c5fc7ce0d782e2f4cec66b294f59dfdb3`; D2 `d2cc160575a84c0d2fa9cc661edc189c5fc7ce0d782e2f4cec66b294f59dfdb3`; D3 `bd38902cffa962e8d6931f50b080c09707c0f822c671e09e58453a3804720978`; identity pin: `d2cc160575a84c0d2fa9cc661edc189c5fc7ce0d782e2f4cec66b294f59dfdb3` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-002 (maths-directed-numbers)

- **Prompt:** A research submarine cruises at a depth of 180 metres below sea level (-180 m). It ascends 65 metres, dives 45 metres deeper, and finally ascends 90 metres. What is the submarine's final depth relative to sea level?
- **Stored key:** `c` (-70 m)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = -70; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `medium` (confidence 1.00); advisory recommendation `keep` (Three sequential signed changes with direction words. Several operations but one idea, so easy.)
- **Hash bindings:** D1 `a5cdc9aa61465369939325da73f48c57d86392579689c9d66389db8cd5e828a7`; D2 `a5cdc9aa61465369939325da73f48c57d86392579689c9d66389db8cd5e828a7`; D3 `8fe5ce66ba40a670fa10e00fb9b04fe8979f0078385c04018fe465fd77abf405`; identity pin: `a5cdc9aa61465369939325da73f48c57d86392579689c9d66389db8cd5e828a7` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-003 (maths-directed-numbers)

- **Prompt:** Evaluate the following integer expression: (-12) - (-25) + (-8) - 14
- **Stored key:** `e` (-9)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = -9; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `keep` (A double negative inside a four-term expression; the sign handling, not the arithmetic, is the demand.)
- **Hash bindings:** D1 `a2854ae437999e46743f5d719498ee666bccc414eff33909af3ad503860ff3f5`; D2 `a2854ae437999e46743f5d719498ee666bccc414eff33909af3ad503860ff3f5`; D3 `e1e52b498998cdcad01ebe7b9a4a6027c00a405d683ca23931a09d3c9d2fca6a`; identity pin: `a2854ae437999e46743f5d719498ee666bccc414eff33909af3ad503860ff3f5` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-004 (maths-directed-numbers)

- **Prompt:** The summit of Mount Kosciuszko is 2228 metres above sea level. Lake Eyre is 15 metres below sea level (-15 m). What is the difference in elevation between the summit of Mount Kosciuszko and Lake Eyre?
- **Stored key:** `b` (2243 m)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 2243; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `easy` (confidence 1.00)
- **Hash bindings:** D1 `8aeef3fbabe39264200fbff733fc111ccb56f8761a003492374e611184d797d2`; D2 `8aeef3fbabe39264200fbff733fc111ccb56f8761a003492374e611184d797d2`; D3 `2038c2ac1123bb31d38da319a253789df86262c78e45635607ff96f54fee2c44`; identity pin: `8aeef3fbabe39264200fbff733fc111ccb56f8761a003492374e611184d797d2` (verified D2 match)
- **ADR-017 scope:** adr017_initial_engineering_scope
- **Owner decision:** [                     ]

### scholarship-y6-maths-005 (maths-directed-numbers)

- **Prompt:** A mining elevator descends from ground level (0 m) down a vertical mine shaft at a constant speed of 4 metres per second. What is the elevator's elevation relative to ground level after 45 seconds?
- **Stored key:** `d` (-180 m)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = -180; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `easy` (confidence 1.00)
- **Hash bindings:** D1 `15387fcecc4efab224874084d73972be51b9ec7dd04c33e6bcf95c6604353e47`; D2 `15387fcecc4efab224874084d73972be51b9ec7dd04c33e6bcf95c6604353e47`; D3 `6da51155cfae8f56b42a6c2e25c45218dd63a807cd179be13c2c0d272b5e0176`; identity pin: `15387fcecc4efab224874084d73972be51b9ec7dd04c33e6bcf95c6604353e47` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-006 (maths-fractions-decimals)

- **Prompt:** A rainwater tank with a total capacity of 1200 litres is 3/8 full. If 350 litres of water are pumped out for the garden, how many litres of water remain in the tank?
- **Stored key:** `c` (100 L)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 100; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `easy` (confidence 1.00)
- **Hash bindings:** D1 `c7a481ff000fec7cff83f9ccf7cd198ff0d102ac050284a48615aba6f2bdc447`; D2 `c7a481ff000fec7cff83f9ccf7cd198ff0d102ac050284a48615aba6f2bdc447`; D3 `ae0b957940c4ad851ad514ff6edbc556607ecc7daeba2d6f281c7b5c0dd2aafd`; identity pin: `c7a481ff000fec7cff83f9ccf7cd198ff0d102ac050284a48615aba6f2bdc447` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-007 (maths-percentages)

- **Prompt:** A sports jacket originally priced at $160 is discounted by 25% during a mid-year sale. At the checkout, loyalty club members receive an additional 10% discount off the sale price. How much does a club member pay for the jacket?
- **Stored key:** `a` ($108)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 108; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `93bfea7f835eaf40d2b37b34f8c63977d22fb51fec67dc421ba46fc8b8c97808`; D2 `93bfea7f835eaf40d2b37b34f8c63977d22fb51fec67dc421ba46fc8b8c97808`; D3 `938bf96f5c97c8059908514305b6c0d8c52ce95659699aa9f366ec3280e931ae`; identity pin: `93bfea7f835eaf40d2b37b34f8c63977d22fb51fec67dc421ba46fc8b8c97808` (verified D2 match)
- **ADR-017 scope:** adr017_initial_engineering_scope
- **Owner decision:** [                     ]

### scholarship-y6-maths-008 (maths-percentages)

- **Prompt:** In a school council election, 360 votes were cast. The winning candidate received 55% of the votes, while the second candidate received 35% of the votes. How many more votes did the winner receive than the second candidate?
- **Stored key:** `d` (72)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 72; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `medium` (confidence 1.00); advisory recommendation `keep` (Percentage difference (20%) of a total, or two simple percentages. Routine.)
- **Hash bindings:** D1 `d4e52e2901e353b3b1f0fc758fb77a72f36f52e707d876f98b89bab288135b8e`; D2 `d4e52e2901e353b3b1f0fc758fb77a72f36f52e707d876f98b89bab288135b8e`; D3 `cd383471ede01eb13e59cea25c8f687620fe493cf05d9a39582264c16bd3d68a`; identity pin: `d4e52e2901e353b3b1f0fc758fb77a72f36f52e707d876f98b89bab288135b8e` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-009 (maths-fractions-decimals)

- **Prompt:** A timber plank is 4.8 metres long. A carpenter cuts off three pieces each measuring 85 cm in length, and one piece measuring 1.25 metres in length. What is the length of the remaining timber plank in centimetres?
- **Stored key:** `e` (100 cm)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 100; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `43ed970e2723401cbc361d510ac90e8a8e976ee959c0dbf396cf7ffaa5809f07`; D2 `43ed970e2723401cbc361d510ac90e8a8e976ee959c0dbf396cf7ffaa5809f07`; D3 `769b0e8d8d69184f67c7f8f5b48094b95e28b999a661cd57067b4153dd2bbe46`; identity pin: `43ed970e2723401cbc361d510ac90e8a8e976ee959c0dbf396cf7ffaa5809f07` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-010 (maths-percentages)

- **Prompt:** A regional town's population was 12,000 residents in 2015. By 2025, the population had increased to 15,000 residents. What was the percentage increase in the town's population over this decade?
- **Stored key:** `b` (25%)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 25; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `medium` (confidence 1.00); advisory recommendation `keep` (Percentage increase on friendly numbers. The wrong-base trap (20%) is well known and is offered as a distractor.)
- **Hash bindings:** D1 `05e8ce28ec883c79b8e2ff8d0b854444d9d2d5f256eefd751b5632353a1174cd`; D2 `05e8ce28ec883c79b8e2ff8d0b854444d9d2d5f256eefd751b5632353a1174cd`; D3 `f62b4089d27aa6120e380f6802b1f3262ea0fe5569116f86f91a44fb1f7a4f8c`; identity pin: `05e8ce28ec883c79b8e2ff8d0b854444d9d2d5f256eefd751b5632353a1174cd` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-011 (maths-fractions-decimals)

- **Prompt:** A school library has 420 books in its science collection. Three-sevenths (3/7) of the books are about astronomy and one-quarter (1/4) of the books are about biology. No book is in both groups. How many books in the collection are about neither astronomy nor biology?
- **Stored key:** `e` (135)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 135; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `5090d2b6cbdfaf2fc6e1696ab5d4b91da6d51eb7398cf31c7769e9eac0893579`; D2 `5090d2b6cbdfaf2fc6e1696ab5d4b91da6d51eb7398cf31c7769e9eac0893579`; D3 `3e71627ff483c27f8e85e6535538036cd8b7edbcbdf2a51eba594d9f4a94172e`; identity pin: `5090d2b6cbdfaf2fc6e1696ab5d4b91da6d51eb7398cf31c7769e9eac0893579` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-012 (maths-ratios-rates)

- **Prompt:** A fundraiser raised $72,000, which is shared among three school projects (the library, the garden and the sports shed) in the ratio 2 : 3 : 4. How much money does the garden receive?
- **Stored key:** `b` ($24,000)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 24000; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `medium` (confidence 1.00); advisory recommendation `keep` (Share $72,000 in the ratio 2:3:4 and report the middle share. Standard.)
- **Hash bindings:** D1 `fe595783162e433ee95bac279c50311d29e7978cdb6d27a18432b02497df8bf6`; D2 `fe595783162e433ee95bac279c50311d29e7978cdb6d27a18432b02497df8bf6`; D3 `936254a1d8b234554fdbbe7013ab6da9bc21a2ea69a3af06409c1737d82dd656`; identity pin: `fe595783162e433ee95bac279c50311d29e7978cdb6d27a18432b02497df8bf6` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-013 (maths-ratios-rates)

- **Prompt:** A passenger train travels 210 kilometres in 75 minutes at a constant speed. How many kilometres will it travel in 100 minutes at the same speed?
- **Stored key:** `a` (280 km)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 280; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `6f541e8de6db5d61df76f2b7ce2bfec3b9bdbc7fd1a8081bddeba90725efbfcd`; D2 `6f541e8de6db5d61df76f2b7ce2bfec3b9bdbc7fd1a8081bddeba90725efbfcd`; D3 `685a78b1f890768599fe91d5008e00e753ba124d32c218fb9b695d6d4450beb8`; identity pin: `6f541e8de6db5d61df76f2b7ce2bfec3b9bdbc7fd1a8081bddeba90725efbfcd` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-014 (maths-ratios-rates)

- **Prompt:** In an athletics club, the ratio of sprinters to distance runners is 5 : 3. If there are 30 more sprinters than distance runners, how many athletes are in the club altogether?
- **Stored key:** `c` (120)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 120; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `bdc37a1c91a300bb560d7c16f32f0bee53832fb5003222896f98c2b7dc48cf6a`; D2 `bdc37a1c91a300bb560d7c16f32f0bee53832fb5003222896f98c2b7dc48cf6a`; D3 `607c2a62fc64fac38fec054588f4d059dc4a49da4cc430d598af009067d137bf`; identity pin: `bdc37a1c91a300bb560d7c16f32f0bee53832fb5003222896f98c2b7dc48cf6a` (verified D2 match)
- **ADR-017 scope:** adr017_initial_engineering_scope
- **Owner decision:** [                     ]

### scholarship-y6-maths-015 (maths-ratios-rates)

- **Prompt:** Supermarket brand A sells 750 grams of cereal for $6.00. Brand B sells 1200 grams of cereal for $8.40. How many cents cheaper per 100 grams is brand B compared to brand A?
- **Stored key:** `d` (10 cents)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 10; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `ab12867e181e9ca7c626c72f29d1ff9d21be943f76b988df39a683cd060bbb3f`; D2 `ab12867e181e9ca7c626c72f29d1ff9d21be943f76b988df39a683cd060bbb3f`; D3 `6e479ea955331a78263616338ae36eb5b84341bd1715b1453093a0210c8b7d6d`; identity pin: `ab12867e181e9ca7c626c72f29d1ff9d21be943f76b988df39a683cd060bbb3f` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-016 (maths-ratios-rates)

- **Prompt:** It takes 6 painters exactly 12 days to paint a school hall. If 3 more painters of identical working speed join the team from the start, how many days will the larger team take to finish the job?
- **Stored key:** `d` (8 days)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 8; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `04e56433e0812fa6d68f745512c66a5d1097c5fc7986e8ca4bb2d399235060e0`; D2 `04e56433e0812fa6d68f745512c66a5d1097c5fc7986e8ca4bb2d399235060e0`; D3 `826b57efa2cc0a39d07892c6916cacfacad10166be93e5798392432be37eee78`; identity pin: `04e56433e0812fa6d68f745512c66a5d1097c5fc7986e8ca4bb2d399235060e0` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-017 (maths-ratios-rates)

- **Prompt:** Concrete is made by mixing cement, sand, and gravel in the ratio 1 : 2 : 3 by weight. If a construction site requires 2400 kilograms of concrete mix, how many kilograms of sand are needed?
- **Stored key:** `e` (800 kg)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 800; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `medium` (confidence 1.00); advisory recommendation `keep` (Ratio parts of a total with friendly numbers.)
- **Hash bindings:** D1 `50257c7923016a26b6a01069bca182e4b8789ab2710266fc38bfb4c464a2402f`; D2 `50257c7923016a26b6a01069bca182e4b8789ab2710266fc38bfb4c464a2402f`; D3 `37da83c941db6e6517e477afbf2d2466f27bdb340879b74932f97598fe13b269`; identity pin: `50257c7923016a26b6a01069bca182e4b8789ab2710266fc38bfb4c464a2402f` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-018 (maths-algebra)

- **Prompt:** Solve for x in the following linear equation: 4x + 19 = 71
- **Stored key:** `b` (13)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 13; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `easy` (confidence 1.00)
- **Hash bindings:** D1 `15b5fd7c6386cf484fb1e4e93bae493c9aa557b8e0bc5e2b98026ea06d830e28`; D2 `15b5fd7c6386cf484fb1e4e93bae493c9aa557b8e0bc5e2b98026ea06d830e28`; D3 `bbbebf4c7ee5c71c73e22e404f45e495137e398363b7af75734a568125408735`; identity pin: `15b5fd7c6386cf484fb1e4e93bae493c9aa557b8e0bc5e2b98026ea06d830e28` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-019 (maths-algebra)

- **Prompt:** Ethan is 4 years older than his sister Mia. The sum of their current ages is 32 years. How old is Ethan?
- **Stored key:** `a` (18 years old)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 18; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `medium` (confidence 1.00); advisory recommendation `keep` (Sum and difference of two ages with small numbers.)
- **Hash bindings:** D1 `310bfd823bb82d07fdb51fc73b7ba9aaa50195ccd2aa983d0803706420e1c7a3`; D2 `310bfd823bb82d07fdb51fc73b7ba9aaa50195ccd2aa983d0803706420e1c7a3`; D3 `aa503aab32af36b989749da1b1e6fa6171557b7fe2193502d319ec94ab5284bf`; identity pin: `310bfd823bb82d07fdb51fc73b7ba9aaa50195ccd2aa983d0803706420e1c7a3` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-020 (maths-algebra)

- **Prompt:** Solve for y in the following linear equation: 7y - 15 = 3y + 29
- **Stored key:** `c` (11)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 11; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `keep` (Unknown on both sides of a given equation. Procedural, but collecting terms across the equals sign is above routine Year 6 work.)
- **Hash bindings:** D1 `40a0d30bc1b0901927b23db59c50cd52733724530c93cedebc7506aafe99d160`; D2 `40a0d30bc1b0901927b23db59c50cd52733724530c93cedebc7506aafe99d160`; D3 `e9d1ab8a56a8a5dc476cb6a7a540ccc5c5c1de234350602af309392e16dce108`; identity pin: `40a0d30bc1b0901927b23db59c50cd52733724530c93cedebc7506aafe99d160` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-021 (maths-algebra)

- **Prompt:** The sum of three consecutive odd numbers is 87. What is the largest of these three numbers?
- **Stored key:** `b` (31)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 31; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `keep` (Three consecutive odd numbers need either the mean shortcut (29, then +2) or x, x+2, x+4 set up and solved. The distractor 29 catches the slip. Borderline easy.)
- **Hash bindings:** D1 `594bc49867ec31f791bbe61aa1da69df31f3990d68c880370d4d4f91c8584c6d`; D2 `594bc49867ec31f791bbe61aa1da69df31f3990d68c880370d4d4f91c8584c6d`; D3 `e2f92d99f40a2dd892ca8b6c4b9c57ac3b941e1567874e9bc45105134ddf27d3`; identity pin: `594bc49867ec31f791bbe61aa1da69df31f3990d68c880370d4d4f91c8584c6d` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-022 (maths-algebra)

- **Prompt:** At a fruit market, 3 apples and 2 mangoes cost $12. At the same prices, 1 apple and 4 mangoes cost $14. What is the cost of a single mango?
- **Stored key:** `d` ($3)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 3; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `keep` (Two linear conditions in two unknowns, solved by substitution or elimination. Arguably the hardest maths item in this group and could be argued up to challenging.)
- **Hash bindings:** D1 `a7c7efcf9b11137befd8e691d82953dfdee2b49572560573d857574c1e0e4ccb`; D2 `a7c7efcf9b11137befd8e691d82953dfdee2b49572560573d857574c1e0e4ccb`; D3 `5bd8080c117a4b322162ace732bd9864d03998025089cdcf934b7e0a14141a35`; identity pin: `a7c7efcf9b11137befd8e691d82953dfdee2b49572560573d857574c1e0e4ccb` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-023 (maths-algebra)

- **Prompt:** If p = 5, q = 3 and r = 4, what is the value of 3p + 2qr - 7?
- **Stored key:** `c` (32)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 32; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `relabel_easy` (Direct substitution; the only care needed is reading 2qr as a product and applying order of operations.)
- **Hash bindings:** D1 `060c779e02ff33688a3abb776c696850955d0cc899b5e9b4c509f89800b3d793`; D2 `060c779e02ff33688a3abb776c696850955d0cc899b5e9b4c509f89800b3d793`; D3 `75cdf5f3a0db40581b2a2334e3c48460ba3b1506dd4d0884265974f2aecc2160`; identity pin: `060c779e02ff33688a3abb776c696850955d0cc899b5e9b4c509f89800b3d793` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-024 (maths-algebra)

- **Prompt:** Solve for w in the equation: (2w + 5) / 3 = 11
- **Stored key:** `e` (14)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 14; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `easy` (confidence 1.00)
- **Hash bindings:** D1 `e7fdc00b4617573cb4759ca7a5dbef14c2de909b34cf57e2f5b3f6aa7493851e`; D2 `e7fdc00b4617573cb4759ca7a5dbef14c2de909b34cf57e2f5b3f6aa7493851e`; D3 `72715a793cbcaded6bf734c7a0f5b3c71b181d6b54707e715f92d9fb4763928b`; identity pin: `e7fdc00b4617573cb4759ca7a5dbef14c2de909b34cf57e2f5b3f6aa7493851e` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-025 (maths-algebra)

- **Prompt:** When a mystery number is multiplied by 6 and then decreased by 14, the result equals 18 more than twice the number. What is the mystery number?
- **Stored key:** `a` (8)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 8; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `keep` (A verbal description must be translated into 6n - 14 = 2n + 18, then solved with the unknown on both sides.)
- **Hash bindings:** D1 `54b91b9ffb8d44c409378440e70b3f9d1bf5177cb0ba90678a7081789c0bf20f`; D2 `54b91b9ffb8d44c409378440e70b3f9d1bf5177cb0ba90678a7081789c0bf20f`; D3 `3b5702e11d171e05efcc2ccef4f50ec5c74902b101165d88454efccc54ad0b35`; identity pin: `54b91b9ffb8d44c409378440e70b3f9d1bf5177cb0ba90678a7081789c0bf20f` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-026 (maths-geometry)

- **Prompt:** Two straight lines intersect. A pair of vertically opposite angles measure (3x + 15)° and (5x - 25)°. What is the size of each of these angles in degrees?
- **Stored key:** `a` (75°)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 75; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `keep` (Vertically opposite angles are equal, then an unknown-on-both-sides solve, then back-substitution to report the angle rather than x.)
- **Hash bindings:** D1 `bf46facbee1764cc2d353242367859c52e80b06ac096fdcb53a4e26174cb30dc`; D2 `bf46facbee1764cc2d353242367859c52e80b06ac096fdcb53a4e26174cb30dc`; D3 `f2e648502a171816739d12ec3fa9e363d5fd1ebbe9fa4b99b4a3cd4891b9c776`; identity pin: `bf46facbee1764cc2d353242367859c52e80b06ac096fdcb53a4e26174cb30dc` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-027 (maths-geometry)

- **Prompt:** In triangle ABC, angle A is twice angle B, and angle C is 20° larger than angle B. What is the measure of angle A in degrees?
- **Stored key:** `e` (80°)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 80; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `keep` (All three angles must be expressed through one variable and summed to 180; the distractor 40 is the value of B, not A.)
- **Hash bindings:** D1 `106b175e5e37e22b1bf60c4248b2d79afb3dbfe7dbeef0018fb2da685926d678`; D2 `106b175e5e37e22b1bf60c4248b2d79afb3dbfe7dbeef0018fb2da685926d678`; D3 `30367bbc8e0bb6f43cfe6fad610b12f9adf4f87c8859d7ff89fa59a560443e22`; identity pin: `106b175e5e37e22b1bf60c4248b2d79afb3dbfe7dbeef0018fb2da685926d678` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-028 (maths-geometry)

- **Prompt:** A rectangular sports court has a perimeter of 96 metres. Its length is 12 metres longer than its width. What is the area of the court in square metres?
- **Stored key:** `d` (540 m²)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 540; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `5a2b91dbd5d863d6a1cc0587e12c8fd031dc06b10bda0c7cf7ca02483985db22`; D2 `5a2b91dbd5d863d6a1cc0587e12c8fd031dc06b10bda0c7cf7ca02483985db22`; D3 `5d74690d6ab4ec6fe71fb777b8bbf218f0af6569b177a1667084525cb4344254`; identity pin: `5a2b91dbd5d863d6a1cc0587e12c8fd031dc06b10bda0c7cf7ca02483985db22` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-029 (maths-geometry)

- **Prompt:** Two angles lie next to each other on a straight line. One angle is 36° less than three times the other angle. What is the measure of the smaller angle in degrees?
- **Stored key:** `b` (54°)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 54; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `keep` (Supplementary angles plus a careful translation of '36 less than three times'; the question asks for the smaller angle, so the other angle must be checked.)
- **Hash bindings:** D1 `457e0105ecabd7db7a926857f83571316d71d109e0be7837e00a3381d355dfce`; D2 `457e0105ecabd7db7a926857f83571316d71d109e0be7837e00a3381d355dfce`; D3 `75915d52a57d50c930a2af009289073ded92eb4a43aacfa36afbf1033e8cbf1f`; identity pin: `457e0105ecabd7db7a926857f83571316d71d109e0be7837e00a3381d355dfce` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-030 (maths-geometry)

- **Prompt:** A rectangular aquarium has a base measuring 80 cm by 50 cm and is 45 cm tall. If 120 litres of water are poured into the empty tank, to what height, in centimetres, does the water rise? (1 litre = 1000 cm³)
- **Stored key:** `c` (30 cm)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 30; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `1e16c4800ec67256612761787eb48049856938170646fe1afcfacf5833c81feb`; D2 `1e16c4800ec67256612761787eb48049856938170646fe1afcfacf5833c81feb`; D3 `ff2000ac085f80afd85bead02a4de15a15771cec61b61a55903641335bc289f1`; identity pin: `1e16c4800ec67256612761787eb48049856938170646fe1afcfacf5833c81feb` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-031 (maths-geometry)

- **Prompt:** A square park has side length 40 metres. A square pavilion of side length 12 metres is constructed in one corner, and the rest is planted with grass. What is the area of the grassed section in square metres?
- **Stored key:** `c` (1456 m²)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 1456; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `medium` (confidence 1.00); advisory recommendation `keep` (Subtract one square area from another.)
- **Hash bindings:** D1 `89698158de42d42429bca02414d63db5b2c5329a620075fe300111c0fdd38b40`; D2 `89698158de42d42429bca02414d63db5b2c5329a620075fe300111c0fdd38b40`; D3 `b00092e3692070df08400662dc098c86984e0ee67addab7fb74f2f462fe1263e`; identity pin: `89698158de42d42429bca02414d63db5b2c5329a620075fe300111c0fdd38b40` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-032 (maths-geometry)

- **Prompt:** What is the measure of each interior angle of a regular octagon (8-sided polygon) in degrees?
- **Stored key:** `b` (135°)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 135; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `keep` (Needs the polygon angle-sum rule or the exterior-angle idea, which is stretch content for Year 6; the arithmetic after that is easy.)
- **Hash bindings:** D1 `aeaafb5263ef09c95b13a06a48a71bb5d060dbf58ca7827968fbbb6c2cf2b615`; D2 `aeaafb5263ef09c95b13a06a48a71bb5d060dbf58ca7827968fbbb6c2cf2b615`; D3 `70f452f6ae098d1e5e9b11ebe41c08c337132eb52159698ca61482685e482861`; identity pin: `aeaafb5263ef09c95b13a06a48a71bb5d060dbf58ca7827968fbbb6c2cf2b615` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-033 (maths-probability)

- **Prompt:** A bag contains 7 red marbles, 9 blue marbles and 4 green marbles. One marble is taken from the bag without looking. What is the probability, as a percentage, that the marble is NOT green?
- **Stored key:** `e` (80%)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 80; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `medium` (confidence 1.00); advisory recommendation `keep` (Complement probability as a percentage; the NOT in the stem is the only trap.)
- **Hash bindings:** D1 `7d5025770d8bdf672e5570e60e3152c957ac3003914b36300f9d3640c45928ad`; D2 `7d5025770d8bdf672e5570e60e3152c957ac3003914b36300f9d3640c45928ad`; D3 `1e8d85cf6023f3d355c89cd5ddbdccd07bd875bc812bc6a833072237e55c22c8`; identity pin: `7d5025770d8bdf672e5570e60e3152c957ac3003914b36300f9d3640c45928ad` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-034 (maths-probability)

- **Prompt:** Two standard six-sided dice are rolled simultaneously. In how many of the 36 possible outcomes is the sum of the numbers equal to 7 or 8?
- **Stored key:** `d` (11 outcomes)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 11; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `33d54ed1309d85801a3ce44c97b614b4540acaf4d37b4c5b4aa2e6c621a4d885`; D2 `33d54ed1309d85801a3ce44c97b614b4540acaf4d37b4c5b4aa2e6c621a4d885`; D3 `0224354932316ad6b371ac1b382ba66c4322f65bd4544556d026568d1999b2ec`; identity pin: `33d54ed1309d85801a3ce44c97b614b4540acaf4d37b4c5b4aa2e6c621a4d885` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-035 (maths-probability)

- **Prompt:** In a class of 30 students, 18 play soccer, 15 play basketball, and 7 play both sports. How many students play neither soccer nor basketball?
- **Stored key:** `a` (4 students)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 4; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `keep` (Inclusion-exclusion (or a Venn diagram) to avoid double-counting the 7 who play both sports.)
- **Hash bindings:** D1 `8dda0cb3f375c3da54d52d71e6a9111d10c1ce5407b4eea3a0e12343fb16dc3c`; D2 `8dda0cb3f375c3da54d52d71e6a9111d10c1ce5407b4eea3a0e12343fb16dc3c`; D3 `f122069cbbf1923a9f57d11f901e74c19c639c033930852496bf36318f951d92`; identity pin: `8dda0cb3f375c3da54d52d71e6a9111d10c1ce5407b4eea3a0e12343fb16dc3c` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-036 (maths-ratios-rates)

- **Prompt:** A cyclist rides uphill for 18 kilometres at an average speed of 12 km/h, and returns along the same route at 36 km/h. What was the cyclist's total travel time in minutes?
- **Stored key:** `d` (120 minutes)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 120; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `f52fbc2ca46ae49b9a38d5a9d3bf66b56b914a54b37a963523452d37ea3f3b3c`; D2 `f52fbc2ca46ae49b9a38d5a9d3bf66b56b914a54b37a963523452d37ea3f3b3c`; D3 `57794d86c54280529348b01cf756c2c37653ddae0398548922b2e161f01da532`; identity pin: `f52fbc2ca46ae49b9a38d5a9d3bf66b56b914a54b37a963523452d37ea3f3b3c` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-037 (maths-directed-numbers)

- **Prompt:** An experimental chemical solution is initially at 24°C. A scientist cools the solution by 7°C per minute for 5 consecutive minutes, and then heats it by 3°C. What is the final temperature?
- **Stored key:** `a` (-8°C)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = -8; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `medium` (confidence 1.00); advisory recommendation `keep` (A repeated change followed by one more; the result crosses zero but the arithmetic is two simple steps.)
- **Hash bindings:** D1 `6a5f14750a832e07af7bd24af5e14fff29fc1f896767149f69f48ca04ee796ba`; D2 `6a5f14750a832e07af7bd24af5e14fff29fc1f896767149f69f48ca04ee796ba`; D3 `b3d387f2c67d91d4278be93cc12d7bed783fe22d13479da5e3fca610a3a41f48`; identity pin: `6a5f14750a832e07af7bd24af5e14fff29fc1f896767149f69f48ca04ee796ba` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-038 (maths-percentages)

- **Prompt:** A store adds 10% Goods and Services Tax (GST) to the price of each item. If a tablet costs $440 including GST, what was its price before GST was added?
- **Stored key:** `c` ($400)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 400; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `10d55104b92ad4ac3eb5e70f9a0ac4d2ff42ced3bfac929d5b4688a5db04aabc`; D2 `10d55104b92ad4ac3eb5e70f9a0ac4d2ff42ced3bfac929d5b4688a5db04aabc`; D3 `1cb39f559bec2f63643a5675da2edd7e8e26b5d1edd0720a4ca84e50352667af`; identity pin: `10d55104b92ad4ac3eb5e70f9a0ac4d2ff42ced3bfac929d5b4688a5db04aabc` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-039 (maths-algebra)

- **Prompt:** An isosceles triangle has two sides of length (2k + 3) cm and a third side of length (k + 5) cm. If the perimeter is 46 cm, what is the value of k?
- **Stored key:** `b` (7)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 7; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `keep` (Build a perimeter expression that counts the repeated side twice, collect terms, then solve for k.)
- **Hash bindings:** D1 `641dad2efbd8bee2e3742731b828e10f90f10e97f987ad2440d7b9c2479d6d56`; D2 `641dad2efbd8bee2e3742731b828e10f90f10e97f987ad2440d7b9c2479d6d56`; D3 `f46e6c82d3a9662e0815923051a3d9d9bcfa5f8b8e57fddc04f0e1b1d240b55d`; identity pin: `641dad2efbd8bee2e3742731b828e10f90f10e97f987ad2440d7b9c2479d6d56` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-maths-040 (maths-probability)

- **Prompt:** A student creates a 2-digit locker PIN where the first digit is from {2, 4, 6} and the second digit is from {1, 3, 5, 7, 9}. How many different 2-digit PIN codes can be formed?
- **Stored key:** `e` (15)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 15; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `easy` (confidence 1.00)
- **Hash bindings:** D1 `4a6367a26b93d5a1a95ba48b8f061a6732c2f53ad2ac627e7e789b215d05cad7`; D2 `4a6367a26b93d5a1a95ba48b8f061a6732c2f53ad2ac627e7e789b215d05cad7`; D3 `fe7f00330ab79896d80e8eeaebd8cef03a4f57fdff014d0f69a03e520eb03387`; identity pin: `4a6367a26b93d5a1a95ba48b8f061a6732c2f53ad2ac627e7e789b215d05cad7` (verified D2 match)
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

## 6. Reviewer material

The answer-blind packet for this section is `answer-blind/MATHEMATICS-40-REVIEWER-PACKET.md` (SHA-256 `2c838e60801dc4d9fce7dfa5f0fb2ac29c54c80c33f871679d7051770de757d1`). Its answer-key companion is held separately under `answer-key-companions/`.
