# NUMERICAL-40-OWNER-REVIEW: internal owner pack and decision table

> **Internal, answer-bearing.** This pack contains keys, explanations and machine results. **Never send it to a reviewer.** Reviewers receive only `answer-blind/NUMERICAL-40-REVIEWER-PACKET.md` (packet SHA-256 `05ae601ba7ea72facca907310f7f7fb28aa7d8e286ebb9998eab0c6e4b9e3997`). This document is AI-generated advisory material. It is not qualified human review, not independent evidence for any gate, and conveys no authority to approve, publish or deploy.

**Audit status:** all machine key checks that exist passed; 0 failed. (A failed check aborts generation.)

## 1. Evidence summary (recomputed)

| Evidence dimension | verified | failed | not_established | Evidence reference |
|---|---:|---:|---:|---|
| Machine-verified arithmetic / closed-language result (20 first-party recompute, 20 closed-language solver) | 40 | 0 | 0 | scholarship-attestation.ts, solver-verification.ts |
| Stem-to-solver semantic verification | 0 | 0 | 40 | ADR-017 requirement 2: never performed |
| Independently checked answer uniqueness | 0 | 0 | 40 | no independent uniqueness record |
| Distractor quality | 0 | 0 | 40 | no distractor review record |
| Age and curriculum appropriateness | 0 | 0 | 40 | ADR-017 requirement 5: no reviewer engaged |
| Qualified human review | 0 | 0 | 40 | no qualified reviewer engaged |

A matching key and solver result establishes arithmetic consistency only. It does not establish that the stem was interpreted as intended, that no second reading exists, that the distractors are good, or that the item suits Year 6.

## 2. Status

- **Total questions:** 40
- **Committed pipeline buckets (status.json):** ready_for_review: 26; requires_revision_or_decision: 14
- **Publication eligibility today:** 0 of 40. Phase 1 fail-closed gates refuse legacy-import content.
- **ADR-017 scope (read from the owner adoption record):** 2 initial engineering candidate(s) (`scholarship-y6-nr-022`, `scholarship-y6-nr-023`); adopted policy only, implementation unbuilt. All other items have no adopted admission route.
- **Original generation:** not_established for every item (see section 4).

## 3. Difficulty decision table (declared label differs from estimator)

Advisory recommendations come from: Claude Sonnet 5.5 (Claude Code), written 2026-10-18 after independently solving every item and before reading the earlier 2026-10-17 assessment. That assessor is in the same provider family as the declared generator and is **not independent**.

| ID | Declared | Estimator | Advisory recommendation | Advisory rationale | Owner decision (BLANK) |
|---|---|---|---|---|---|
| `scholarship-y6-nr-003` | `medium` | `easy` | relabel_easy (easy) | Differences 2,4,6,8 follow one familiar growing-difference rule; take the differences once, extend once. | |
| `scholarship-y6-nr-004` | `medium` | `easy` | keep (medium) | The first differences (3,2,5,7) do not suggest a rule, so the candidate has to abandon the default method and discover that each term is the sum of the previous two. | |
| `scholarship-y6-nr-005` | `medium` | `easy` | relabel_easy (easy) | Two interleaved strands each move by a constant 3. Splitting the sequence is the only idea and it is routine for this cohort. | |
| `scholarship-y6-nr-007` | `medium` | `easy` | relabel_easy (easy) | Differences 3,6,9,12 are the multiples of three; one level of differences and an obvious pattern. | |
| `scholarship-y6-nr-008` | `medium` | `easy` | keep (medium) | First differences 2,6,10,14 are not constant, so a second level of differences (constant 4) must be found before extending. | |
| `scholarship-y6-nr-009` | `medium` | `easy` | keep (medium) | Two interleaved strands with different steps (+3 and -4) and a position trap: the next term belongs to the first strand, and the other strand's next value (38) is offered as a distractor. Borderline easy. | |
| `scholarship-y6-nr-010` | `medium` | `easy` | keep (medium) | Additive recurrence (each term is the sum of the previous two). Visible from 3+4=7, but it is a non-linear idea that most Year 6 candidates have not met. Borderline easy. | |
| `scholarship-y6-nr-012` | `medium` | `easy` | keep (medium) | No rule is stated. The candidate must hypothesise and test an invariant (every row and column sums to 30) before the missing cell can be found. | |
| `scholarship-y6-nr-021` | `medium` | `easy` | keep (medium) | Heads-and-legs needs an assume-all-chickens correction or a systematic trial with two coupled constraints; a classic but not a one-step item. | |
| `scholarship-y6-nr-026` | `easy` | `medium` | keep (easy) | Five consecutive numbers: the middle term is the mean (27), so the largest is 29. One shortcut, one step. | |
| `scholarship-y6-nr-030` | `medium` | `easy` | keep (medium) | Halve the perimeter, then solve a sum-and-difference pair and report the length rather than the width. Short, but three linked steps. Borderline easy. | |
| `scholarship-y6-nr-031` | `challenging` | `medium` | keep (challenging) | Two coordinated constraints on the digits plus a quotient-and-remainder condition; the candidate has to build N = 7(t+u)+3 with t = u+3 and solve. Clearly the hardest item in the section. | |
| `scholarship-y6-nr-035` | `easy` | `medium` | keep (easy) | One unknown with direct relationships (M + M+4 + 2M = 44). The label is right; the estimator over-reads its word count. | |
| `scholarship-y6-nr-038` | `medium` | `easy` | keep (medium) | A short factor-pair search for sum 18 and product 72, then the difference. Borderline easy because the pair is found quickly. | |

## 4. Provenance reconciliation (applies to every item here)

| Aspect | Status | Evidence |
|---|---|---|
| Verified original generation | not_established | no execution record (provider, model, prompt, hash, timestamp) exists |
| Historical declared generation | declared, unverified | docs/reviews/scholarship-2026-10-18/CONTENT-REVIEW-FINDINGS.md states `anthropic/claude-sonnet-5`; a documentation statement, not an execution record |
| Repository revision provenance | pinned candidate hash | src/features/question-factory/correctness/scholarship-identity-pins.json; identifies imported bytes, not their generator |
| Independent reviewer identity and qualification | not_established | independence cannot be evaluated while the generator is unverified (ADR-017; REVIEW_INDEPENDENCE_POLICY) |

A Git author or co-author trailer, an importer, a historical declaration or a reviewing model is not proof of the original generator.

## 5. Per-question evidence

### scholarship-y6-nr-001 (nr-number-series)

- **Prompt:** What number comes next in the sequence? 5, 11, 17, 23, 29, ?
- **Stored key:** `e` (35)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | closed-language solver (number_series) = 35; equals the stored key and exactly one option |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `easy` (confidence 1.00)
- **Hash bindings:** D1 `e18ddd9625b44b4eedb5951cbc18c03c8de216e61930b0936a7276cb0f43cc81`; D2 `e18ddd9625b44b4eedb5951cbc18c03c8de216e61930b0936a7276cb0f43cc81`; D3 `8bf3c2012084099d8bf82df4677d86309330b84d2774e1e6bd1ccafcdadfb361`
- **ADR-017 scope:** adr017_conditional_policy_eligible
- **Owner decision:** [                     ]

### scholarship-y6-nr-002 (nr-number-series)

- **Prompt:** What number comes next in the sequence? 4, 12, 36, 108, ?
- **Stored key:** `c` (324)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | closed-language solver (number_series) = 324; equals the stored key and exactly one option |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `easy` (confidence 1.00)
- **Hash bindings:** D1 `ebe0bcbff00c49924da0d819347558a4a7e5d4ac97ad39969546e9424cd9c90e`; D2 `ebe0bcbff00c49924da0d819347558a4a7e5d4ac97ad39969546e9424cd9c90e`; D3 `1a35cc3b431591ae8fb4fc29bc234f10f03cec1a39c68be2225fe719b4077ead`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-003 (nr-number-series)

- **Prompt:** What number comes next in the sequence? 3, 5, 9, 15, 23, ?
- **Stored key:** `b` (33)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | closed-language solver (number_series) = 33; equals the stored key and exactly one option |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `relabel_easy` (Differences 2,4,6,8 follow one familiar growing-difference rule; take the differences once, extend once.)
- **Hash bindings:** D1 `aa6d1989a8adb73e088bd97e4904b5184e6f9eb56d1107f60d51b661ee4e835b`; D2 `aa6d1989a8adb73e088bd97e4904b5184e6f9eb56d1107f60d51b661ee4e835b`; D3 `0d16b7ad9ad6f236fec34b069f1022ccad2614b69d7efdef063d1196f2eb9272`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-004 (nr-number-series)

- **Prompt:** What number comes next in the sequence? 2, 5, 7, 12, 19, ?
- **Stored key:** `a` (31)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | closed-language solver (number_series) = 31; equals the stored key and exactly one option |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `keep` (The first differences (3,2,5,7) do not suggest a rule, so the candidate has to abandon the default method and discover that each term is the sum of the previous two.)
- **Hash bindings:** D1 `b589c5a898429c1e9068aed016cfab00ebac6bd81b67bd2bcd479ad6e292c40e`; D2 `b589c5a898429c1e9068aed016cfab00ebac6bd81b67bd2bcd479ad6e292c40e`; D3 `2a45894a43f4a7be5193df8abcfe31546f4912ec509919bda65eb248f66198df`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-005 (nr-number-series)

- **Prompt:** What number comes next in the alternating sequence? 2, 20, 5, 17, 8, 14, 11, ?
- **Stored key:** `e` (11)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | closed-language solver (number_series) = 11; equals the stored key and exactly one option |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `relabel_easy` (Two interleaved strands each move by a constant 3. Splitting the sequence is the only idea and it is routine for this cohort.)
- **Hash bindings:** D1 `343202f2defdf3f86b22b9bca70ea3385e9d2e28e3ae251f4bd2707f822a6045`; D2 `343202f2defdf3f86b22b9bca70ea3385e9d2e28e3ae251f4bd2707f822a6045`; D3 `2b0529a40d1f3f06ff1509b9e325ba6da183b6d7f9e1aba9a37fc1e44a34e755`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-006 (nr-number-series)

- **Prompt:** What number comes next in the sequence? 80, 73, 66, 59, 52, ?
- **Stored key:** `e` (45)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | closed-language solver (number_series) = 45; equals the stored key and exactly one option |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `easy` (confidence 1.00)
- **Hash bindings:** D1 `4225568d55c63b4a99bf795d15c6ed0d5f6983f2bcdce8fd1cb42ef1ddbaebb0`; D2 `4225568d55c63b4a99bf795d15c6ed0d5f6983f2bcdce8fd1cb42ef1ddbaebb0`; D3 `b8a203bed187e71ab86d029dff697a0b609ae8faaebdce73215389d5cb814fab`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-007 (nr-number-series)

- **Prompt:** What number comes next in the sequence? 4, 7, 13, 22, 34, ?
- **Stored key:** `c` (49)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | closed-language solver (number_series) = 49; equals the stored key and exactly one option |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `relabel_easy` (Differences 3,6,9,12 are the multiples of three; one level of differences and an obvious pattern.)
- **Hash bindings:** D1 `a17cf6174a1021cb9e656a51e4427b2b28539b5256bcf705330f9c61a86a5ebd`; D2 `a17cf6174a1021cb9e656a51e4427b2b28539b5256bcf705330f9c61a86a5ebd`; D3 `4ab54a8739b7d59a314b56b5b5819106a997e759bb827acbf979b6609f863a96`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-008 (nr-number-series)

- **Prompt:** What number comes next in the sequence? 2, 4, 10, 20, 34, ?
- **Stored key:** `d` (52)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | closed-language solver (number_series) = 52; equals the stored key and exactly one option |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `keep` (First differences 2,6,10,14 are not constant, so a second level of differences (constant 4) must be found before extending.)
- **Hash bindings:** D1 `df11504d476587bb707d5676dba4a0db43cabcfb8e3813e4d5904b426e3a1a13`; D2 `df11504d476587bb707d5676dba4a0db43cabcfb8e3813e4d5904b426e3a1a13`; D3 `d0d259fe8d3378aea14e34f612b3f62d76c0b16dc864b798ea89d7c52b3bc8af`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-009 (nr-number-series)

- **Prompt:** What number comes next in the alternating sequence? 10, 50, 13, 46, 16, 42, ?
- **Stored key:** `c` (19)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | closed-language solver (number_series) = 19; equals the stored key and exactly one option |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `keep` (Two interleaved strands with different steps (+3 and -4) and a position trap: the next term belongs to the first strand, and the other strand's next value (38) is offered as a distractor. Borderline easy.)
- **Hash bindings:** D1 `686274b92c266ff73b60f0dad8449e2bf08135e941fc30e581b7e4fa47e66e6f`; D2 `686274b92c266ff73b60f0dad8449e2bf08135e941fc30e581b7e4fa47e66e6f`; D3 `a31e3d7729b7bc03a503c5d976a2ad452c7f8c77aa5113af59c905b2c204e62d`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-010 (nr-number-series)

- **Prompt:** What number comes next in the sequence? 3, 4, 7, 11, 18, 29, ?
- **Stored key:** `a` (47)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | closed-language solver (number_series) = 47; equals the stored key and exactly one option |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `keep` (Additive recurrence (each term is the sum of the previous two). Visible from 3+4=7, but it is a non-linear idea that most Year 6 candidates have not met. Borderline easy.)
- **Hash bindings:** D1 `2960635f437da748898e6356b57ef058134929b332d3fd3129893e2f39568e4c`; D2 `2960635f437da748898e6356b57ef058134929b332d3fd3129893e2f39568e4c`; D3 `b67302a5737b5536fe5b8e7a461b6d217b645fe006abe003352d23b2c93a3eac`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-011 (nr-number-matrices)

- **Prompt:** Find the missing number (?) in the 3x3 grid: [ 4, 7, 11 ] [ 5, 8, 13 ] [ 6, 9, ? ]
- **Stored key:** `d` (15)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | closed-language solver (number_matrix) = 15; equals the stored key and exactly one option |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `9aa85b6fc3f1b419aeceb062e7bfe036a1d7c951a2cf934373a79cbe53768036`; D2 `9aa85b6fc3f1b419aeceb062e7bfe036a1d7c951a2cf934373a79cbe53768036`; D3 `6cb52d3e8ce0ab45fef9d4d0ce6032f3c4d2aa6765fc8d6bacba299258e50973`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-012 (nr-number-matrices)

- **Prompt:** Find the missing number (?) in the 3x3 grid: [ 12, 8, 10 ] [ 7, 14, 9 ] [ 11, 8, ? ]
- **Stored key:** `d` (11)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | closed-language solver (number_matrix) = 11; equals the stored key and exactly one option |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `keep` (No rule is stated. The candidate must hypothesise and test an invariant (every row and column sums to 30) before the missing cell can be found.)
- **Hash bindings:** D1 `466bb9924438531954ce60f634f5b571b3b91f0201eabe1f0bcfcb96445b11e4`; D2 `466bb9924438531954ce60f634f5b571b3b91f0201eabe1f0bcfcb96445b11e4`; D3 `8ebc17bb31e12f41dafe7882eda35578f1220d489a0a66cae5c61d089ae34748`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-013 (nr-number-matrices)

- **Prompt:** Find the missing number (?) in the 3x3 grid: [ 2, 5, 9 ] [ 3, 8, 14 ] [ 4, 6, ? ]
- **Stored key:** `c` (14)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | closed-language solver (number_matrix) = 14; equals the stored key and exactly one option |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `fdf545cf2b88a8b6a31ac439a14de8ed2b7953623f6d74008adb9cf5ce4f3ce0`; D2 `fdf545cf2b88a8b6a31ac439a14de8ed2b7953623f6d74008adb9cf5ce4f3ce0`; D3 `a3142a304d5a7133108321517faed150ef0407c3cfe92b7c5741406002bbca2f`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-014 (nr-number-matrices)

- **Prompt:** Find the missing number (?) in the 3x3 grid: [ 15, 6, 8 ] [ 9, 11, 9 ] [ 5, 12, ? ]
- **Stored key:** `e` (12)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | closed-language solver (number_matrix) = 12; equals the stored key and exactly one option |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `82c5c609de3cf32fabbd785c2f434c3da541d016cfa31b1a1b2b1eebb75b97ce`; D2 `82c5c609de3cf32fabbd785c2f434c3da541d016cfa31b1a1b2b1eebb75b97ce`; D3 `86ccedd8368315255cd836bb17ea8d20e785ef27b97fc86a7930ad5cae65f1b8`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-015 (nr-number-matrices)

- **Prompt:** Find the missing number (?) in the 3x3 grid: [ 3, 7, 11 ] [ 5, 9, 13 ] [ 4, 8, ? ]
- **Stored key:** `b` (12)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | closed-language solver (number_matrix) = 12; equals the stored key and exactly one option |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `easy` (confidence 1.00)
- **Hash bindings:** D1 `c84a9ad08f752071474a53f463cb7457bdac8d9981d3c29ee35222d79d9f6a81`; D2 `c84a9ad08f752071474a53f463cb7457bdac8d9981d3c29ee35222d79d9f6a81`; D3 `678ba87aef3b694f37996590b4873835bd95ab601d94a2b20e2624c1ad58c64b`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-016 (nr-number-matrices)

- **Prompt:** Find the missing number (?) in the 3x3 grid: [ 7, 3, 11 ] [ 5, 4, 6 ] [ 6, 8, ? ]
- **Stored key:** `d` (4)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | closed-language solver (number_matrix) = 4; equals the stored key and exactly one option |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `3585665c14cb96917e83e7cad9d88d40891d7658cfa44124c05b19a9e973f9a3`; D2 `3585665c14cb96917e83e7cad9d88d40891d7658cfa44124c05b19a9e973f9a3`; D3 `5cf95dd2309604cee68ef80a5686a13e0869d6cb45723fd55904339519d12424`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-017 (nr-number-matrices)

- **Prompt:** Find the missing number (?) in the 3x3 grid: [ 14, 10, 16 ] [ 8, 12, 20 ] [ 18, 18, ? ]
- **Stored key:** `b` (4)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | closed-language solver (number_matrix) = 4; equals the stored key and exactly one option |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `d410f84933715db6c8751e1da584aadcdf2b21df7e3243c9eeb19af625d3da2d`; D2 `d410f84933715db6c8751e1da584aadcdf2b21df7e3243c9eeb19af625d3da2d`; D3 `955c36d32827f5954d0f5826687579fb4b41eda22ea20c22008c00028f9cbba3`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-018 (nr-number-matrices)

- **Prompt:** Find the missing number (?) in the 3x3 grid: [ 6, 12, 18 ] [ 8, 16, 24 ] [ 5, 10, ? ]
- **Stored key:** `c` (15)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | closed-language solver (number_matrix) = 15; equals the stored key and exactly one option |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `easy` (confidence 1.00)
- **Hash bindings:** D1 `152eb303fe1e01bf8bb67ddc13700ea7426a722c0e916eb578173176e3d74d42`; D2 `152eb303fe1e01bf8bb67ddc13700ea7426a722c0e916eb578173176e3d74d42`; D3 `36d3f33bd624d693d24fcb16cbd5c111e20ac51c0b27d525924fbc0787f6462f`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-019 (nr-number-matrices)

- **Prompt:** Find the missing number (?) in the 3x3 grid: [ 10, 14, 12 ] [ 15, 9, 12 ] [ 11, 13, ? ]
- **Stored key:** `c` (12)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | closed-language solver (number_matrix) = 12; equals the stored key and exactly one option |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `877b7cb1f906ab4c0213418792c96098903136faaa0d12217b0d18dcbc623211`; D2 `877b7cb1f906ab4c0213418792c96098903136faaa0d12217b0d18dcbc623211`; D3 `e75acba4b348039dd0f7be0b876ad46960a4959ea7bced4663d90e9749a1ee42`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-020 (nr-number-matrices)

- **Prompt:** Find the missing number (?) in the 3x3 grid: [ 1, 8, 10 ] [ 4, 5, 13 ] [ 3, 7, ? ]
- **Stored key:** `b` (13)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | closed-language solver (number_matrix) = 13; equals the stored key and exactly one option |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `b7ee0e222be41f3f728fd0402c6b553f90bec32bd00a1609d73bda814bed3f0a`; D2 `b7ee0e222be41f3f728fd0402c6b553f90bec32bd00a1609d73bda814bed3f0a`; D3 `1833e9216384c523076bd0f6ecb29450f105266cd98205410022f3a771927eb4`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-021 (nr-arithmetical-reasoning)

- **Prompt:** A farmer has chickens and sheep in a paddock. Together there are 24 heads and 68 legs. How many sheep are in the paddock?
- **Stored key:** `a` (10)
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
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `keep` (Heads-and-legs needs an assume-all-chickens correction or a systematic trial with two coupled constraints; a classic but not a one-step item.)
- **Hash bindings:** D1 `23cac13d178516dcdaee5bb04d9baa338275212cb3b6b3be1a795b41ba6da68c`; D2 `23cac13d178516dcdaee5bb04d9baa338275212cb3b6b3be1a795b41ba6da68c`; D3 `a78f2dee38d3aba63ec86f26bae8e5d6e6cefec4438d65ea414d527fd4de4b1c`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-022 (nr-arithmetical-reasoning)

- **Prompt:** Marcus is currently three times as old as his sister Chloe. In 8 years, Marcus will be twice as old as Chloe will be then. How old is Chloe now?
- **Stored key:** `e` (8)
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
- **Hash bindings:** D1 `8758ac61587d966b235e83cd18564b1e0fa577485306054052487189bc4fa7c2`; D2 `8758ac61587d966b235e83cd18564b1e0fa577485306054052487189bc4fa7c2`; D3 `a0c486d79ec7026022d01ac6ad5ee7cd3881f63557435af74aca4133ee1c1f85`
- **ADR-017 scope:** adr017_initial_engineering_scope
- **Owner decision:** [                     ]

### scholarship-y6-nr-023 (nr-arithmetical-reasoning)

- **Prompt:** At a school stationery shop, 3 notebooks and 2 pens cost $19. Meanwhile, 2 notebooks and 4 pens cost $18. How much does 1 notebook cost?
- **Stored key:** `b` ($5)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 5; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `52d196a6d5d1829e7695bc8833a19c87bf7cfec3a65117138d83de3bf1473b03`; D2 `52d196a6d5d1829e7695bc8833a19c87bf7cfec3a65117138d83de3bf1473b03`; D3 `7b80d6a14c2af6e957b20fafa2053687edadf8171fcceff913e623a9eddc4f2c`
- **ADR-017 scope:** adr017_initial_engineering_scope
- **Owner decision:** [                     ]

### scholarship-y6-nr-024 (nr-arithmetical-reasoning)

- **Prompt:** A ribbon measuring 84 cm is cut into two pieces. One piece is 16 cm longer than the other. What is the length of the shorter piece in centimetres?
- **Stored key:** `a` (34)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 34; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `easy` (confidence 1.00)
- **Hash bindings:** D1 `f9b321c87e287ac0248d0e195ec504876f1d30825dee70dfcc7ff88f83eb8158`; D2 `f9b321c87e287ac0248d0e195ec504876f1d30825dee70dfcc7ff88f83eb8158`; D3 `746caee7851825c94f6d1e464e76a57c70626d5e55e1cc86edec54aac8c99787`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-025 (nr-arithmetical-reasoning)

- **Prompt:** A bus starts its morning route carrying some passengers. At the first stop, 6 passengers get off and 10 get on. At the second stop, half the remaining passengers get off, leaving 18 passengers on board. How many passengers were originally on the bus?
- **Stored key:** `b` (32)
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
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `639a1e5280531952c3783b6d5ae511c5a16f79b3a62ade8b0c6a020a6ec85169`; D2 `639a1e5280531952c3783b6d5ae511c5a16f79b3a62ade8b0c6a020a6ec85169`; D3 `e7b344833769090ecc18a500c2725d6f20e9573c0ac7a5401738d469ef38f148`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-026 (nr-arithmetical-reasoning)

- **Prompt:** Five consecutive whole numbers have a sum of 135. What is the largest of these five numbers?
- **Stored key:** `d` (29)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 29; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `medium` (confidence 1.00); advisory recommendation `keep` (Five consecutive numbers: the middle term is the mean (27), so the largest is 29. One shortcut, one step.)
- **Hash bindings:** D1 `1b34bd174e0b335a3cfbe54e8c7de1dd4e0ae72ef6c2b2b4233095fd58bdb1cc`; D2 `1b34bd174e0b335a3cfbe54e8c7de1dd4e0ae72ef6c2b2b4233095fd58bdb1cc`; D3 `a12c17dc244014d5b22865dd7aeba5646f4832d0961798ba506769254ab5a470`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-027 (nr-arithmetical-reasoning)

- **Prompt:** A fruit stall sells apples for $2 each and mangoes for $5 each. Leo buys 12 pieces of fruit in total and pays $39. How many mangoes did Leo buy?
- **Stored key:** `c` (5)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 5; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `98176c2e95e8057ac70c0bd3f5388810586ff2cfff0a2804b30bead33d0aff99`; D2 `98176c2e95e8057ac70c0bd3f5388810586ff2cfff0a2804b30bead33d0aff99`; D3 `2a0533cc460806bd7a62c3654102645bf781c8a5f5adad6aa15899e153addffa`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-028 (nr-arithmetical-reasoning)

- **Prompt:** Ethan has twice as many trading cards as Oliver. After Ethan gives 15 cards to Oliver, they both have an equal number of cards. How many cards did Ethan have originally?
- **Stored key:** `b` (60)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 60; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `c7d739377dd7a37913421e847d95b31524fe8d30ebf02aba9c0789095f460169`; D2 `c7d739377dd7a37913421e847d95b31524fe8d30ebf02aba9c0789095f460169`; D3 `aafd044db112797f1440e855aa86569e370a38a9a49e78d3fc714a375c2d82ce`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-029 (nr-arithmetical-reasoning)

- **Prompt:** In a 30-question mathematics quiz, 4 marks are awarded for each correct answer and 1 mark is deducted for each incorrect answer. Grace attempted all 30 questions and scored 85 marks. How many questions did Grace answer correctly?
- **Stored key:** `e` (23)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 23; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `6170e950d51288764bffde746fb175d301e1579ea974300d0e5ebfd9da65c6f2`; D2 `6170e950d51288764bffde746fb175d301e1579ea974300d0e5ebfd9da65c6f2`; D3 `dfe5aa88ec49aaed9229509dd911b4a3803b8ccdfd2b6de8a56d1cd7536ec4f5`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-030 (nr-arithmetical-reasoning)

- **Prompt:** A rectangular garden has a perimeter of 54 metres. The length is 7 metres longer than the width. What is the length of the garden in metres?
- **Stored key:** `d` (17)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 17; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `keep` (Halve the perimeter, then solve a sum-and-difference pair and report the length rather than the width. Short, but three linked steps. Borderline easy.)
- **Hash bindings:** D1 `3e3002ef682ac408bd08eabca82b8a420a910abc48a12cfd67f6632eff405628`; D2 `3e3002ef682ac408bd08eabca82b8a420a910abc48a12cfd67f6632eff405628`; D3 `fa9d1ff1691632eed84a8f42796dd73eb97aea97101b126f1e53f83d3ee5fab1`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-031 (nr-logic-deduction-numbers)

- **Prompt:** A two-digit number N has a tens digit that is 3 greater than its units digit. When N is divided by the sum of its digits, the quotient is 7 and the remainder is 3. What is N?
- **Stored key:** `a` (52)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 52; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `challenging`, estimator `medium` (confidence 1.00); advisory recommendation `keep` (Two coordinated constraints on the digits plus a quotient-and-remainder condition; the candidate has to build N = 7(t+u)+3 with t = u+3 and solve. Clearly the hardest item in the section.)
- **Hash bindings:** D1 `49d27c233955000f4e0e8711917b834be130ff53e7f6d8e639623d1d03d2a974`; D2 `49d27c233955000f4e0e8711917b834be130ff53e7f6d8e639623d1d03d2a974`; D3 `046b432518f0245c68496a3a1b1fdfe345c64a4026feafb59c31833bc607fe82`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-032 (nr-logic-deduction-numbers)

- **Prompt:** In the sum AB + A = 52, AB is a two-digit number with tens digit A and units digit B, and A and B are different non-zero digits. What digit does B represent?
- **Stored key:** `c` (8)
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
- **Hash bindings:** D1 `c9e80b08a7f1f230606c8167a9d49a39eb2ad8d8a8e1fb242fb8d1e9233dee34`; D2 `c9e80b08a7f1f230606c8167a9d49a39eb2ad8d8a8e1fb242fb8d1e9233dee34`; D3 `cae9c74b3279a078afd99260499aa573e9520d9ef2b31acbd363825aab39dc49`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-033 (nr-logic-deduction-numbers)

- **Prompt:** A 3-digit number N has hundreds digit H, tens digit T, and units digit U. H is three times U, and T is 2 less than H. If the sum of all three digits is 12, what is N?
- **Stored key:** `a` (642)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 642; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `62350d693a77f42c4b335f5b32bb10d410e0d3abc6936c05386598ae35acc15b`; D2 `62350d693a77f42c4b335f5b32bb10d410e0d3abc6936c05386598ae35acc15b`; D3 `9dd9a1557228bbc5cd66ba23a4b9a8f32227acfe4fe7e1929d0b02db42aa73a6`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-034 (nr-logic-deduction-numbers)

- **Prompt:** Find the positive integer N such that when N is divided by 5 it leaves a remainder of 3, and when divided by 7 it leaves a remainder of 2, with N being less than 30.
- **Stored key:** `b` (23)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 23; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `739a7b59e38f9cfb14fbe7528d878a6dc98c718da370fb221b4eb78a409629fa`; D2 `739a7b59e38f9cfb14fbe7528d878a6dc98c718da370fb221b4eb78a409629fa`; D3 `030bd02ca81eb3e2141bc0f012bee946640dc63d854676aca38a5e31cced91ae`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-035 (nr-arithmetical-reasoning)

- **Prompt:** Three friends, Jack, Maya, and Noah, have some marbles. Jack has 4 more marbles than Maya. Noah has twice as many marbles as Maya. Together they have 44 marbles. How many marbles does Maya have?
- **Stored key:** `e` (10)
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
- **Difficulty:** declared `easy`, estimator `medium` (confidence 1.00); advisory recommendation `keep` (One unknown with direct relationships (M + M+4 + 2M = 44). The label is right; the estimator over-reads its word count.)
- **Hash bindings:** D1 `c58bd61b366c4b318847781a3d9103a392ce161926c0471bfdc6df32e2ecac65`; D2 `c58bd61b366c4b318847781a3d9103a392ce161926c0471bfdc6df32e2ecac65`; D3 `37dc679a46e05d32eee4d647c7ea9cb083312c8aeda031503bb90c1b6efeed3c`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-036 (nr-logic-deduction-numbers)

- **Prompt:** In the multiplication 4A × 3 = 138, 4A is a two-digit number with tens digit 4 and units digit A. What digit is A?
- **Stored key:** `d` (6)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 6; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `easy` (confidence 1.00)
- **Hash bindings:** D1 `af2be8a0e09695dd4b47e5bc98478da7f95e87c82ecfd9dc56cff4c5a03cbca9`; D2 `af2be8a0e09695dd4b47e5bc98478da7f95e87c82ecfd9dc56cff4c5a03cbca9`; D3 `dc0b305e71b92a868f2ef58a3d7cf05a03bfea157576504cdc5b214c06a25acb`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-037 (nr-logic-deduction-numbers)

- **Prompt:** A two-digit number is prime. The product of its two digits is 18. What is the number?
- **Stored key:** `e` (29)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 29; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `easy`, estimator `easy` (confidence 1.00)
- **Hash bindings:** D1 `83625886b17554ec1125d78f6806d72818f56242dd6fbdc43a2263bbc3290087`; D2 `83625886b17554ec1125d78f6806d72818f56242dd6fbdc43a2263bbc3290087`; D3 `fb29583af6fc47004779a88ed4371761bfd505a29562b27b88b3af07f31a8607`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-038 (nr-logic-deduction-numbers)

- **Prompt:** The product of two positive integers X and Y is 72, and their sum is 18 (with X > Y). What is their positive difference (D = X - Y)?
- **Stored key:** `a` (6)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 6; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `easy` (confidence 1.00); advisory recommendation `keep` (A short factor-pair search for sum 18 and product 72, then the difference. Borderline easy because the pair is found quickly.)
- **Hash bindings:** D1 `6db639755877e24f0f3bf248a3108afa07cbc3a7fa4c7b8a570958534fc4add8`; D2 `6db639755877e24f0f3bf248a3108afa07cbc3a7fa4c7b8a570958534fc4add8`; D3 `74ec825214db8a2ee7eead88385362ec76a32a5a6c1184511083998f5a1b3133`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-039 (nr-logic-deduction-numbers)

- **Prompt:** In a magic triangle, there is a number at each of the three corners and one number halfway along each of the three sides. The two corner numbers and the middle number on each side add up to 20. The corner numbers are 5, 7 and 9. What is the sum of the three middle numbers?
- **Stored key:** `d` (18)
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
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `70f79c702f7d085692fd69f7fe94fb6e6b54d42f3313172f4cae5e5fc6f1e414`; D2 `70f79c702f7d085692fd69f7fe94fb6e6b54d42f3313172f4cae5e5fc6f1e414`; D3 `60ef88a846fd3bff2c94ee1e7552577928888030e684e0a5a5a8cc30fdd638f9`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

### scholarship-y6-nr-040 (nr-logic-deduction-numbers)

- **Prompt:** A 4-digit code C consists of the digits 1, 3, 5, and 8, each used exactly once. The code is an even number greater than 5000. What is the smallest possible code meeting these conditions?
- **Stored key:** `a` (5138)
- **Evidence:**

| Dimension | Status | Evidence reference |
|---|---|---|
| Machine-verified result | verified | first-party recompute = 5138; attestation requires exactly one matching option and it equals the stored key |
| Stem-to-solver semantic verification | not_established | ADR-017 evidence requirement 2 (editorial interpretation check): never performed for any candidate |
| Independent answer uniqueness | not_established | no independent uniqueness check recorded; a solver's internal uniqueness is scoped to the solver's own model |
| Distractor quality | not_established | no distractor-quality review recorded |
| Age and curriculum appropriateness | not_established | ADR-017 evidence requirement 5 (age-suitability and curriculum check): no reviewer engaged |
| Qualified human review | not_established | ADR-017 owner adoption record: no qualified editorial reviewer engaged; none recorded |

- **Mechanical observations (not quality judgements):** 5 options; option texts all distinct.
- **Difficulty:** declared `medium`, estimator `medium` (confidence 1.00)
- **Hash bindings:** D1 `cbcd1a8cbc0d5d5ce3e23fa9d1863090933770be7e52821bf0d90fe337f77d5e`; D2 `cbcd1a8cbc0d5d5ce3e23fa9d1863090933770be7e52821bf0d90fe337f77d5e`; D3 `f6014a367c53ea9f91fd366e82f56e07e28799def2b4b8819c3d958ea8ff3270`
- **ADR-017 scope:** no_adopted_route
- **Owner decision:** [                     ]

## 6. Reviewer material

The answer-blind packet for this section is `answer-blind/NUMERICAL-40-REVIEWER-PACKET.md` (SHA-256 `05ae601ba7ea72facca907310f7f7fb28aa7d8e286ebb9998eab0c6e4b9e3997`). Its answer-key companion is held separately under `answer-key-companions/`.
