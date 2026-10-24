# NUMERICAL-40-OWNER-REVIEW — 40-Question Review Pack & Decision Table

> **Notice:** This document contains independent AI-generated advisory analysis by Antigravity (Google DeepMind). It is **not qualified human approval** and conveys no authorization to publish or deploy.

## 1. Executive Summary & Section Status

- **Total Questions:** 40
- **Historical Machine Pipeline Status:** 26 ready for review, 14 blocked at difficulty gate.
- **Recomputed Verification:** 100% (40/40) keys independently verified by first-party hash-bound recompute or closed-language solvers.
- **Unambiguous Solutions:** 40 of 40 admit a single defensible answer under standard mathematical interpretations.
- **Australian Year 6 Curriculum Fit:** Aligned with Victorian Curriculum v2.0 Mathematics (Level 6 Number and Algebra / Measurement and Geometry), extending into competitive scholarship reasoning depth.
- **Publication Eligibility Today:** **0 of 40**. All 40 questions remain under the Phase 1 governance hold for unverified legacy origin. 2 candidate(s) are in the initial engineering scope of ADR-017 (adopted policy only; implementation unbuilt).

## 2. Difficulty Decision Table for Blocked Items

The difficulty gate enforces a tolerance of 0.15 against a text-length and reading-load estimator. The blocked items below require explicit owner decision.

| ID | Declared | Estimator | Independent Recommendation | Reason for Disagreement | Genuine Content Change Needed? | Owner Decision Alone Resolves? | Owner Decision (BLANK) |
|---|---|---|---|---|---|---|---|
| `scholarship-y6-nr-003` | `medium` | `easy` | **relabel_easy** (easy) | Differences 2,4,6,8 follow one familiar growing-difference rule; take the differences once, extend once. | No | Yes (relabel or confirm declared) | | 
| `scholarship-y6-nr-004` | `medium` | `easy` | **keep** (medium) | The first differences (3,2,5,7) do not suggest a rule, so the candidate has to abandon the default method and discover that each term is the sum of the previous two. | No | Yes (relabel or confirm declared) | | 
| `scholarship-y6-nr-005` | `medium` | `easy` | **relabel_easy** (easy) | Two interleaved strands each move by a constant 3. Splitting the sequence is the only idea and it is routine for this cohort. | No | Yes (relabel or confirm declared) | | 
| `scholarship-y6-nr-007` | `medium` | `easy` | **relabel_easy** (easy) | Differences 3,6,9,12 are the multiples of three; one level of differences and an obvious pattern. | No | Yes (relabel or confirm declared) | | 
| `scholarship-y6-nr-008` | `medium` | `easy` | **keep** (medium) | First differences 2,6,10,14 are not constant, so a second level of differences (constant 4) must be found before extending. | No | Yes (relabel or confirm declared) | | 
| `scholarship-y6-nr-009` | `medium` | `easy` | **keep** (medium) | Two interleaved strands with different steps (+3 and -4) and a position trap: the next term belongs to the first strand, and the other strand's next value (38) is offered as a distractor. Borderline easy. | No | Yes (relabel or confirm declared) | | 
| `scholarship-y6-nr-010` | `medium` | `easy` | **keep** (medium) | Additive recurrence (each term is the sum of the previous two). Visible from 3+4=7, but it is a non-linear idea that most Year 6 candidates have not met. Borderline easy. | No | Yes (relabel or confirm declared) | | 
| `scholarship-y6-nr-012` | `medium` | `easy` | **keep** (medium) | No rule is stated. The candidate must hypothesise and test an invariant (every row and column sums to 30) before the missing cell can be found. | No | Yes (relabel or confirm declared) | | 
| `scholarship-y6-nr-021` | `medium` | `easy` | **keep** (medium) | Heads-and-legs needs an assume-all-chickens correction or a systematic trial with two coupled constraints; a classic but not a one-step item. | No | Yes (relabel or confirm declared) | | 
| `scholarship-y6-nr-026` | `easy` | `medium` | **keep** (easy) | Five consecutive numbers: the middle term is the mean (27), so the largest is 29. One shortcut, one step. | No | Yes (relabel or confirm declared) | | 
| `scholarship-y6-nr-030` | `medium` | `easy` | **keep** (medium) | Halve the perimeter, then solve a sum-and-difference pair and report the length rather than the width. Short, but three linked steps. Borderline easy. | No | Yes (relabel or confirm declared) | | 
| `scholarship-y6-nr-031` | `challenging` | `medium` | **keep** (challenging) | Two coordinated constraints on the digits plus a quotient-and-remainder condition; the candidate has to build N = 7(t+u)+3 with t = u+3 and solve. Clearly the hardest item in the section. | No | Yes (relabel or confirm declared) | | 
| `scholarship-y6-nr-035` | `easy` | `medium` | **keep** (easy) | One unknown with direct relationships (M + M+4 + 2M = 44). The label is right; the estimator over-reads its word count. | No | Yes (relabel or confirm declared) | | 
| `scholarship-y6-nr-038` | `medium` | `easy` | **keep** (medium) | A short factor-pair search for sum 18 and product 72, then the difference. Borderline easy because the pair is found quickly. | No | Yes (relabel or confirm declared) | | 

## 3. Comprehensive 40-Question Detailed Analysis

### scholarship-y6-nr-001 (nr-number-series)

- **Prompt:** What number comes next in the sequence? 5, 11, 17, 23, 29, ?
- **Declared Key:** `e` (35)
- **Independent Solver Verification:** Closed-language solver (number_series): 35 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `easy` | Estimator `easy` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `e18ddd9625b44b4eedb5951cbc18c03c8de216e61930b0936a7276cb0f43cc81`
  - D2 (`factoryCandidateHash`): `e18ddd9625b44b4eedb5951cbc18c03c8de216e61930b0936a7276cb0f43cc81`
  - D3 (`publicationContentHash`): `8bf3c2012084099d8bf82df4677d86309330b84d2774e1e6bd1ccafcdadfb361`
- **Provenance & Admission Status:** Unknown original generation. Policy-eligible on condition under ADR-017.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-002 (nr-number-series)

- **Prompt:** What number comes next in the sequence? 4, 12, 36, 108, ?
- **Declared Key:** `c` (324)
- **Independent Solver Verification:** Closed-language solver (number_series): 324 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `easy` | Estimator `easy` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `ebe0bcbff00c49924da0d819347558a4a7e5d4ac97ad39969546e9424cd9c90e`
  - D2 (`factoryCandidateHash`): `ebe0bcbff00c49924da0d819347558a4a7e5d4ac97ad39969546e9424cd9c90e`
  - D3 (`publicationContentHash`): `1a35cc3b431591ae8fb4fc29bc234f10f03cec1a39c68be2225fe719b4077ead`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-003 (nr-number-series)

- **Prompt:** What number comes next in the sequence? 3, 5, 9, 15, 23, ?
- **Declared Key:** `b` (33)
- **Independent Solver Verification:** Closed-language solver (number_series): 33 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `easy` (confidence: 1.00) | Recommendation: `relabel_easy` - Differences 2,4,6,8 follow one familiar growing-difference rule; take the differences once, extend once.
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `aa6d1989a8adb73e088bd97e4904b5184e6f9eb56d1107f60d51b661ee4e835b`
  - D2 (`factoryCandidateHash`): `aa6d1989a8adb73e088bd97e4904b5184e6f9eb56d1107f60d51b661ee4e835b`
  - D3 (`publicationContentHash`): `0d16b7ad9ad6f236fec34b069f1022ccad2614b69d7efdef063d1196f2eb9272`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check, difficulty gate deviation.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-004 (nr-number-series)

- **Prompt:** What number comes next in the sequence? 2, 5, 7, 12, 19, ?
- **Declared Key:** `a` (31)
- **Independent Solver Verification:** Closed-language solver (number_series): 31 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `easy` (confidence: 1.00) | Recommendation: `keep` - The first differences (3,2,5,7) do not suggest a rule, so the candidate has to abandon the default method and discover that each term is the sum of the previous two.
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `b589c5a898429c1e9068aed016cfab00ebac6bd81b67bd2bcd479ad6e292c40e`
  - D2 (`factoryCandidateHash`): `b589c5a898429c1e9068aed016cfab00ebac6bd81b67bd2bcd479ad6e292c40e`
  - D3 (`publicationContentHash`): `2a45894a43f4a7be5193df8abcfe31546f4912ec509919bda65eb248f66198df`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check, difficulty gate deviation.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-005 (nr-number-series)

- **Prompt:** What number comes next in the alternating sequence? 2, 20, 5, 17, 8, 14, 11, ?
- **Declared Key:** `e` (11)
- **Independent Solver Verification:** Closed-language solver (number_series): 11 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `easy` (confidence: 1.00) | Recommendation: `relabel_easy` - Two interleaved strands each move by a constant 3. Splitting the sequence is the only idea and it is routine for this cohort.
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `343202f2defdf3f86b22b9bca70ea3385e9d2e28e3ae251f4bd2707f822a6045`
  - D2 (`factoryCandidateHash`): `343202f2defdf3f86b22b9bca70ea3385e9d2e28e3ae251f4bd2707f822a6045`
  - D3 (`publicationContentHash`): `2b0529a40d1f3f06ff1509b9e325ba6da183b6d7f9e1aba9a37fc1e44a34e755`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check, difficulty gate deviation.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-006 (nr-number-series)

- **Prompt:** What number comes next in the sequence? 80, 73, 66, 59, 52, ?
- **Declared Key:** `e` (45)
- **Independent Solver Verification:** Closed-language solver (number_series): 45 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `easy` | Estimator `easy` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `4225568d55c63b4a99bf795d15c6ed0d5f6983f2bcdce8fd1cb42ef1ddbaebb0`
  - D2 (`factoryCandidateHash`): `4225568d55c63b4a99bf795d15c6ed0d5f6983f2bcdce8fd1cb42ef1ddbaebb0`
  - D3 (`publicationContentHash`): `b8a203bed187e71ab86d029dff697a0b609ae8faaebdce73215389d5cb814fab`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-007 (nr-number-series)

- **Prompt:** What number comes next in the sequence? 4, 7, 13, 22, 34, ?
- **Declared Key:** `c` (49)
- **Independent Solver Verification:** Closed-language solver (number_series): 49 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `easy` (confidence: 1.00) | Recommendation: `relabel_easy` - Differences 3,6,9,12 are the multiples of three; one level of differences and an obvious pattern.
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `a17cf6174a1021cb9e656a51e4427b2b28539b5256bcf705330f9c61a86a5ebd`
  - D2 (`factoryCandidateHash`): `a17cf6174a1021cb9e656a51e4427b2b28539b5256bcf705330f9c61a86a5ebd`
  - D3 (`publicationContentHash`): `4ab54a8739b7d59a314b56b5b5819106a997e759bb827acbf979b6609f863a96`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check, difficulty gate deviation.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-008 (nr-number-series)

- **Prompt:** What number comes next in the sequence? 2, 4, 10, 20, 34, ?
- **Declared Key:** `d` (52)
- **Independent Solver Verification:** Closed-language solver (number_series): 52 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `easy` (confidence: 1.00) | Recommendation: `keep` - First differences 2,6,10,14 are not constant, so a second level of differences (constant 4) must be found before extending.
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `df11504d476587bb707d5676dba4a0db43cabcfb8e3813e4d5904b426e3a1a13`
  - D2 (`factoryCandidateHash`): `df11504d476587bb707d5676dba4a0db43cabcfb8e3813e4d5904b426e3a1a13`
  - D3 (`publicationContentHash`): `d0d259fe8d3378aea14e34f612b3f62d76c0b16dc864b798ea89d7c52b3bc8af`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check, difficulty gate deviation.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-009 (nr-number-series)

- **Prompt:** What number comes next in the alternating sequence? 10, 50, 13, 46, 16, 42, ?
- **Declared Key:** `c` (19)
- **Independent Solver Verification:** Closed-language solver (number_series): 19 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `easy` (confidence: 1.00) | Recommendation: `keep` - Two interleaved strands with different steps (+3 and -4) and a position trap: the next term belongs to the first strand, and the other strand's next value (38) is offered as a distractor. Borderline easy.
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `686274b92c266ff73b60f0dad8449e2bf08135e941fc30e581b7e4fa47e66e6f`
  - D2 (`factoryCandidateHash`): `686274b92c266ff73b60f0dad8449e2bf08135e941fc30e581b7e4fa47e66e6f`
  - D3 (`publicationContentHash`): `a31e3d7729b7bc03a503c5d976a2ad452c7f8c77aa5113af59c905b2c204e62d`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check, difficulty gate deviation.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-010 (nr-number-series)

- **Prompt:** What number comes next in the sequence? 3, 4, 7, 11, 18, 29, ?
- **Declared Key:** `a` (47)
- **Independent Solver Verification:** Closed-language solver (number_series): 47 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `easy` (confidence: 1.00) | Recommendation: `keep` - Additive recurrence (each term is the sum of the previous two). Visible from 3+4=7, but it is a non-linear idea that most Year 6 candidates have not met. Borderline easy.
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `2960635f437da748898e6356b57ef058134929b332d3fd3129893e2f39568e4c`
  - D2 (`factoryCandidateHash`): `2960635f437da748898e6356b57ef058134929b332d3fd3129893e2f39568e4c`
  - D3 (`publicationContentHash`): `b67302a5737b5536fe5b8e7a461b6d217b645fe006abe003352d23b2c93a3eac`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check, difficulty gate deviation.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-011 (nr-number-matrices)

- **Prompt:** Find the missing number (?) in the 3x3 grid: [ 4, 7, 11 ] [ 5, 8, 13 ] [ 6, 9, ? ]
- **Declared Key:** `d` (15)
- **Independent Solver Verification:** Closed-language solver (number_matrix): 15 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `medium` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `9aa85b6fc3f1b419aeceb062e7bfe036a1d7c951a2cf934373a79cbe53768036`
  - D2 (`factoryCandidateHash`): `9aa85b6fc3f1b419aeceb062e7bfe036a1d7c951a2cf934373a79cbe53768036`
  - D3 (`publicationContentHash`): `6cb52d3e8ce0ab45fef9d4d0ce6032f3c4d2aa6765fc8d6bacba299258e50973`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-012 (nr-number-matrices)

- **Prompt:** Find the missing number (?) in the 3x3 grid: [ 12, 8, 10 ] [ 7, 14, 9 ] [ 11, 8, ? ]
- **Declared Key:** `d` (11)
- **Independent Solver Verification:** Closed-language solver (number_matrix): 11 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `easy` (confidence: 1.00) | Recommendation: `keep` - No rule is stated. The candidate must hypothesise and test an invariant (every row and column sums to 30) before the missing cell can be found.
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `466bb9924438531954ce60f634f5b571b3b91f0201eabe1f0bcfcb96445b11e4`
  - D2 (`factoryCandidateHash`): `466bb9924438531954ce60f634f5b571b3b91f0201eabe1f0bcfcb96445b11e4`
  - D3 (`publicationContentHash`): `8ebc17bb31e12f41dafe7882eda35578f1220d489a0a66cae5c61d089ae34748`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check, difficulty gate deviation.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-013 (nr-number-matrices)

- **Prompt:** Find the missing number (?) in the 3x3 grid: [ 2, 5, 9 ] [ 3, 8, 14 ] [ 4, 6, ? ]
- **Declared Key:** `c` (14)
- **Independent Solver Verification:** Closed-language solver (number_matrix): 14 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `medium` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `fdf545cf2b88a8b6a31ac439a14de8ed2b7953623f6d74008adb9cf5ce4f3ce0`
  - D2 (`factoryCandidateHash`): `fdf545cf2b88a8b6a31ac439a14de8ed2b7953623f6d74008adb9cf5ce4f3ce0`
  - D3 (`publicationContentHash`): `a3142a304d5a7133108321517faed150ef0407c3cfe92b7c5741406002bbca2f`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-014 (nr-number-matrices)

- **Prompt:** Find the missing number (?) in the 3x3 grid: [ 15, 6, 8 ] [ 9, 11, 9 ] [ 5, 12, ? ]
- **Declared Key:** `e` (12)
- **Independent Solver Verification:** Closed-language solver (number_matrix): 12 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `medium` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `82c5c609de3cf32fabbd785c2f434c3da541d016cfa31b1a1b2b1eebb75b97ce`
  - D2 (`factoryCandidateHash`): `82c5c609de3cf32fabbd785c2f434c3da541d016cfa31b1a1b2b1eebb75b97ce`
  - D3 (`publicationContentHash`): `86ccedd8368315255cd836bb17ea8d20e785ef27b97fc86a7930ad5cae65f1b8`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-015 (nr-number-matrices)

- **Prompt:** Find the missing number (?) in the 3x3 grid: [ 3, 7, 11 ] [ 5, 9, 13 ] [ 4, 8, ? ]
- **Declared Key:** `b` (12)
- **Independent Solver Verification:** Closed-language solver (number_matrix): 12 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `easy` | Estimator `easy` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `c84a9ad08f752071474a53f463cb7457bdac8d9981d3c29ee35222d79d9f6a81`
  - D2 (`factoryCandidateHash`): `c84a9ad08f752071474a53f463cb7457bdac8d9981d3c29ee35222d79d9f6a81`
  - D3 (`publicationContentHash`): `678ba87aef3b694f37996590b4873835bd95ab601d94a2b20e2624c1ad58c64b`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-016 (nr-number-matrices)

- **Prompt:** Find the missing number (?) in the 3x3 grid: [ 7, 3, 11 ] [ 5, 4, 6 ] [ 6, 8, ? ]
- **Declared Key:** `d` (4)
- **Independent Solver Verification:** Closed-language solver (number_matrix): 4 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `medium` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `3585665c14cb96917e83e7cad9d88d40891d7658cfa44124c05b19a9e973f9a3`
  - D2 (`factoryCandidateHash`): `3585665c14cb96917e83e7cad9d88d40891d7658cfa44124c05b19a9e973f9a3`
  - D3 (`publicationContentHash`): `5cf95dd2309604cee68ef80a5686a13e0869d6cb45723fd55904339519d12424`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-017 (nr-number-matrices)

- **Prompt:** Find the missing number (?) in the 3x3 grid: [ 14, 10, 16 ] [ 8, 12, 20 ] [ 18, 18, ? ]
- **Declared Key:** `b` (4)
- **Independent Solver Verification:** Closed-language solver (number_matrix): 4 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `medium` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `d410f84933715db6c8751e1da584aadcdf2b21df7e3243c9eeb19af625d3da2d`
  - D2 (`factoryCandidateHash`): `d410f84933715db6c8751e1da584aadcdf2b21df7e3243c9eeb19af625d3da2d`
  - D3 (`publicationContentHash`): `955c36d32827f5954d0f5826687579fb4b41eda22ea20c22008c00028f9cbba3`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-018 (nr-number-matrices)

- **Prompt:** Find the missing number (?) in the 3x3 grid: [ 6, 12, 18 ] [ 8, 16, 24 ] [ 5, 10, ? ]
- **Declared Key:** `c` (15)
- **Independent Solver Verification:** Closed-language solver (number_matrix): 15 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `easy` | Estimator `easy` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `152eb303fe1e01bf8bb67ddc13700ea7426a722c0e916eb578173176e3d74d42`
  - D2 (`factoryCandidateHash`): `152eb303fe1e01bf8bb67ddc13700ea7426a722c0e916eb578173176e3d74d42`
  - D3 (`publicationContentHash`): `36d3f33bd624d693d24fcb16cbd5c111e20ac51c0b27d525924fbc0787f6462f`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-019 (nr-number-matrices)

- **Prompt:** Find the missing number (?) in the 3x3 grid: [ 10, 14, 12 ] [ 15, 9, 12 ] [ 11, 13, ? ]
- **Declared Key:** `c` (12)
- **Independent Solver Verification:** Closed-language solver (number_matrix): 12 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `medium` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `877b7cb1f906ab4c0213418792c96098903136faaa0d12217b0d18dcbc623211`
  - D2 (`factoryCandidateHash`): `877b7cb1f906ab4c0213418792c96098903136faaa0d12217b0d18dcbc623211`
  - D3 (`publicationContentHash`): `e75acba4b348039dd0f7be0b876ad46960a4959ea7bced4663d90e9749a1ee42`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-020 (nr-number-matrices)

- **Prompt:** Find the missing number (?) in the 3x3 grid: [ 1, 8, 10 ] [ 4, 5, 13 ] [ 3, 7, ? ]
- **Declared Key:** `b` (13)
- **Independent Solver Verification:** Closed-language solver (number_matrix): 13 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `medium` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `b7ee0e222be41f3f728fd0402c6b553f90bec32bd00a1609d73bda814bed3f0a`
  - D2 (`factoryCandidateHash`): `b7ee0e222be41f3f728fd0402c6b553f90bec32bd00a1609d73bda814bed3f0a`
  - D3 (`publicationContentHash`): `1833e9216384c523076bd0f6ecb29450f105266cd98205410022f3a771927eb4`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-021 (nr-arithmetical-reasoning)

- **Prompt:** A farmer has chickens and sheep in a paddock. Together there are 24 heads and 68 legs. How many sheep are in the paddock?
- **Declared Key:** `a` (10)
- **Independent Solver Verification:** First-party hash-bound recompute: 10 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `easy` (confidence: 1.00) | Recommendation: `keep` - Heads-and-legs needs an assume-all-chickens correction or a systematic trial with two coupled constraints; a classic but not a one-step item.
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `23cac13d178516dcdaee5bb04d9baa338275212cb3b6b3be1a795b41ba6da68c`
  - D2 (`factoryCandidateHash`): `23cac13d178516dcdaee5bb04d9baa338275212cb3b6b3be1a795b41ba6da68c`
  - D3 (`publicationContentHash`): `a78f2dee38d3aba63ec86f26bae8e5d6e6cefec4438d65ea414d527fd4de4b1c`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check, difficulty gate deviation.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-022 (nr-arithmetical-reasoning)

- **Prompt:** Marcus is currently three times as old as his sister Chloe. In 8 years, Marcus will be twice as old as Chloe will be then. How old is Chloe now?
- **Declared Key:** `e` (8)
- **Independent Solver Verification:** First-party hash-bound recompute: 8 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `medium` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `8758ac61587d966b235e83cd18564b1e0fa577485306054052487189bc4fa7c2`
  - D2 (`factoryCandidateHash`): `8758ac61587d966b235e83cd18564b1e0fa577485306054052487189bc4fa7c2`
  - D3 (`publicationContentHash`): `a0c486d79ec7026022d01ac6ad5ee7cd3881f63557435af74aca4133ee1c1f85`
- **Provenance & Admission Status:** Unknown original generation. In initial engineering scope of ADR-017.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-023 (nr-arithmetical-reasoning)

- **Prompt:** At a school stationery shop, 3 notebooks and 2 pens cost $19. Meanwhile, 2 notebooks and 4 pens cost $18. How much does 1 notebook cost?
- **Declared Key:** `b` ($5)
- **Independent Solver Verification:** First-party hash-bound recompute: 5 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `medium` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `52d196a6d5d1829e7695bc8833a19c87bf7cfec3a65117138d83de3bf1473b03`
  - D2 (`factoryCandidateHash`): `52d196a6d5d1829e7695bc8833a19c87bf7cfec3a65117138d83de3bf1473b03`
  - D3 (`publicationContentHash`): `7b80d6a14c2af6e957b20fafa2053687edadf8171fcceff913e623a9eddc4f2c`
- **Provenance & Admission Status:** Unknown original generation. In initial engineering scope of ADR-017.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-024 (nr-arithmetical-reasoning)

- **Prompt:** A ribbon measuring 84 cm is cut into two pieces. One piece is 16 cm longer than the other. What is the length of the shorter piece in centimetres?
- **Declared Key:** `a` (34)
- **Independent Solver Verification:** First-party hash-bound recompute: 34 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `easy` | Estimator `easy` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `f9b321c87e287ac0248d0e195ec504876f1d30825dee70dfcc7ff88f83eb8158`
  - D2 (`factoryCandidateHash`): `f9b321c87e287ac0248d0e195ec504876f1d30825dee70dfcc7ff88f83eb8158`
  - D3 (`publicationContentHash`): `746caee7851825c94f6d1e464e76a57c70626d5e55e1cc86edec54aac8c99787`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-025 (nr-arithmetical-reasoning)

- **Prompt:** A bus starts its morning route carrying some passengers. At the first stop, 6 passengers get off and 10 get on. At the second stop, half the remaining passengers get off, leaving 18 passengers on board. How many passengers were originally on the bus?
- **Declared Key:** `b` (32)
- **Independent Solver Verification:** First-party hash-bound recompute: 32 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `medium` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `639a1e5280531952c3783b6d5ae511c5a16f79b3a62ade8b0c6a020a6ec85169`
  - D2 (`factoryCandidateHash`): `639a1e5280531952c3783b6d5ae511c5a16f79b3a62ade8b0c6a020a6ec85169`
  - D3 (`publicationContentHash`): `e7b344833769090ecc18a500c2725d6f20e9573c0ac7a5401738d469ef38f148`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-026 (nr-arithmetical-reasoning)

- **Prompt:** Five consecutive whole numbers have a sum of 135. What is the largest of these five numbers?
- **Declared Key:** `d` (29)
- **Independent Solver Verification:** First-party hash-bound recompute: 29 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `easy` | Estimator `medium` (confidence: 1.00) | Recommendation: `keep` - Five consecutive numbers: the middle term is the mean (27), so the largest is 29. One shortcut, one step.
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `1b34bd174e0b335a3cfbe54e8c7de1dd4e0ae72ef6c2b2b4233095fd58bdb1cc`
  - D2 (`factoryCandidateHash`): `1b34bd174e0b335a3cfbe54e8c7de1dd4e0ae72ef6c2b2b4233095fd58bdb1cc`
  - D3 (`publicationContentHash`): `a12c17dc244014d5b22865dd7aeba5646f4832d0961798ba506769254ab5a470`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check, difficulty gate deviation.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-027 (nr-arithmetical-reasoning)

- **Prompt:** A fruit stall sells apples for $2 each and mangoes for $5 each. Leo buys 12 pieces of fruit in total and pays $39. How many mangoes did Leo buy?
- **Declared Key:** `c` (5)
- **Independent Solver Verification:** First-party hash-bound recompute: 5 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `medium` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `98176c2e95e8057ac70c0bd3f5388810586ff2cfff0a2804b30bead33d0aff99`
  - D2 (`factoryCandidateHash`): `98176c2e95e8057ac70c0bd3f5388810586ff2cfff0a2804b30bead33d0aff99`
  - D3 (`publicationContentHash`): `2a0533cc460806bd7a62c3654102645bf781c8a5f5adad6aa15899e153addffa`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-028 (nr-arithmetical-reasoning)

- **Prompt:** Ethan has twice as many trading cards as Oliver. After Ethan gives 15 cards to Oliver, they both have an equal number of cards. How many cards did Ethan have originally?
- **Declared Key:** `b` (60)
- **Independent Solver Verification:** First-party hash-bound recompute: 60 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `medium` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `c7d739377dd7a37913421e847d95b31524fe8d30ebf02aba9c0789095f460169`
  - D2 (`factoryCandidateHash`): `c7d739377dd7a37913421e847d95b31524fe8d30ebf02aba9c0789095f460169`
  - D3 (`publicationContentHash`): `aafd044db112797f1440e855aa86569e370a38a9a49e78d3fc714a375c2d82ce`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-029 (nr-arithmetical-reasoning)

- **Prompt:** In a 30-question mathematics quiz, 4 marks are awarded for each correct answer and 1 mark is deducted for each incorrect answer. Grace attempted all 30 questions and scored 85 marks. How many questions did Grace answer correctly?
- **Declared Key:** `e` (23)
- **Independent Solver Verification:** First-party hash-bound recompute: 23 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `medium` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `6170e950d51288764bffde746fb175d301e1579ea974300d0e5ebfd9da65c6f2`
  - D2 (`factoryCandidateHash`): `6170e950d51288764bffde746fb175d301e1579ea974300d0e5ebfd9da65c6f2`
  - D3 (`publicationContentHash`): `dfe5aa88ec49aaed9229509dd911b4a3803b8ccdfd2b6de8a56d1cd7536ec4f5`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-030 (nr-arithmetical-reasoning)

- **Prompt:** A rectangular garden has a perimeter of 54 metres. The length is 7 metres longer than the width. What is the length of the garden in metres?
- **Declared Key:** `d` (17)
- **Independent Solver Verification:** First-party hash-bound recompute: 17 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `easy` (confidence: 1.00) | Recommendation: `keep` - Halve the perimeter, then solve a sum-and-difference pair and report the length rather than the width. Short, but three linked steps. Borderline easy.
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `3e3002ef682ac408bd08eabca82b8a420a910abc48a12cfd67f6632eff405628`
  - D2 (`factoryCandidateHash`): `3e3002ef682ac408bd08eabca82b8a420a910abc48a12cfd67f6632eff405628`
  - D3 (`publicationContentHash`): `fa9d1ff1691632eed84a8f42796dd73eb97aea97101b126f1e53f83d3ee5fab1`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check, difficulty gate deviation.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-031 (nr-logic-deduction-numbers)

- **Prompt:** A two-digit number N has a tens digit that is 3 greater than its units digit. When N is divided by the sum of its digits, the quotient is 7 and the remainder is 3. What is N?
- **Declared Key:** `a` (52)
- **Independent Solver Verification:** First-party hash-bound recompute: 52 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `challenging` | Estimator `medium` (confidence: 1.00) | Recommendation: `keep` - Two coordinated constraints on the digits plus a quotient-and-remainder condition; the candidate has to build N = 7(t+u)+3 with t = u+3 and solve. Clearly the hardest item in the section.
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `49d27c233955000f4e0e8711917b834be130ff53e7f6d8e639623d1d03d2a974`
  - D2 (`factoryCandidateHash`): `49d27c233955000f4e0e8711917b834be130ff53e7f6d8e639623d1d03d2a974`
  - D3 (`publicationContentHash`): `046b432518f0245c68496a3a1b1fdfe345c64a4026feafb59c31833bc607fe82`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check, difficulty gate deviation.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-032 (nr-logic-deduction-numbers)

- **Prompt:** In the sum AB + A = 52, AB is a two-digit number with tens digit A and units digit B, and A and B are different non-zero digits. What digit does B represent?
- **Declared Key:** `c` (8)
- **Independent Solver Verification:** First-party hash-bound recompute: 8 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `medium` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `c9e80b08a7f1f230606c8167a9d49a39eb2ad8d8a8e1fb242fb8d1e9233dee34`
  - D2 (`factoryCandidateHash`): `c9e80b08a7f1f230606c8167a9d49a39eb2ad8d8a8e1fb242fb8d1e9233dee34`
  - D3 (`publicationContentHash`): `cae9c74b3279a078afd99260499aa573e9520d9ef2b31acbd363825aab39dc49`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-033 (nr-logic-deduction-numbers)

- **Prompt:** A 3-digit number N has hundreds digit H, tens digit T, and units digit U. H is three times U, and T is 2 less than H. If the sum of all three digits is 12, what is N?
- **Declared Key:** `a` (642)
- **Independent Solver Verification:** First-party hash-bound recompute: 642 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `medium` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `62350d693a77f42c4b335f5b32bb10d410e0d3abc6936c05386598ae35acc15b`
  - D2 (`factoryCandidateHash`): `62350d693a77f42c4b335f5b32bb10d410e0d3abc6936c05386598ae35acc15b`
  - D3 (`publicationContentHash`): `9dd9a1557228bbc5cd66ba23a4b9a8f32227acfe4fe7e1929d0b02db42aa73a6`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-034 (nr-logic-deduction-numbers)

- **Prompt:** Find the positive integer N such that when N is divided by 5 it leaves a remainder of 3, and when divided by 7 it leaves a remainder of 2, with N being less than 30.
- **Declared Key:** `b` (23)
- **Independent Solver Verification:** First-party hash-bound recompute: 23 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `medium` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `739a7b59e38f9cfb14fbe7528d878a6dc98c718da370fb221b4eb78a409629fa`
  - D2 (`factoryCandidateHash`): `739a7b59e38f9cfb14fbe7528d878a6dc98c718da370fb221b4eb78a409629fa`
  - D3 (`publicationContentHash`): `030bd02ca81eb3e2141bc0f012bee946640dc63d854676aca38a5e31cced91ae`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-035 (nr-arithmetical-reasoning)

- **Prompt:** Three friends, Jack, Maya, and Noah, have some marbles. Jack has 4 more marbles than Maya. Noah has twice as many marbles as Maya. Together they have 44 marbles. How many marbles does Maya have?
- **Declared Key:** `e` (10)
- **Independent Solver Verification:** First-party hash-bound recompute: 10 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `easy` | Estimator `medium` (confidence: 1.00) | Recommendation: `keep` - One unknown with direct relationships (M + M+4 + 2M = 44). The label is right; the estimator over-reads its word count.
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `c58bd61b366c4b318847781a3d9103a392ce161926c0471bfdc6df32e2ecac65`
  - D2 (`factoryCandidateHash`): `c58bd61b366c4b318847781a3d9103a392ce161926c0471bfdc6df32e2ecac65`
  - D3 (`publicationContentHash`): `37dc679a46e05d32eee4d647c7ea9cb083312c8aeda031503bb90c1b6efeed3c`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check, difficulty gate deviation.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-036 (nr-logic-deduction-numbers)

- **Prompt:** In the multiplication 4A × 3 = 138, 4A is a two-digit number with tens digit 4 and units digit A. What digit is A?
- **Declared Key:** `d` (6)
- **Independent Solver Verification:** First-party hash-bound recompute: 6 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `easy` | Estimator `easy` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `af2be8a0e09695dd4b47e5bc98478da7f95e87c82ecfd9dc56cff4c5a03cbca9`
  - D2 (`factoryCandidateHash`): `af2be8a0e09695dd4b47e5bc98478da7f95e87c82ecfd9dc56cff4c5a03cbca9`
  - D3 (`publicationContentHash`): `dc0b305e71b92a868f2ef58a3d7cf05a03bfea157576504cdc5b214c06a25acb`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-037 (nr-logic-deduction-numbers)

- **Prompt:** A two-digit number is prime. The product of its two digits is 18. What is the number?
- **Declared Key:** `e` (29)
- **Independent Solver Verification:** First-party hash-bound recompute: 29 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `easy` | Estimator `easy` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `83625886b17554ec1125d78f6806d72818f56242dd6fbdc43a2263bbc3290087`
  - D2 (`factoryCandidateHash`): `83625886b17554ec1125d78f6806d72818f56242dd6fbdc43a2263bbc3290087`
  - D3 (`publicationContentHash`): `fb29583af6fc47004779a88ed4371761bfd505a29562b27b88b3af07f31a8607`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-038 (nr-logic-deduction-numbers)

- **Prompt:** The product of two positive integers X and Y is 72, and their sum is 18 (with X > Y). What is their positive difference (D = X - Y)?
- **Declared Key:** `a` (6)
- **Independent Solver Verification:** First-party hash-bound recompute: 6 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `easy` (confidence: 1.00) | Recommendation: `keep` - A short factor-pair search for sum 18 and product 72, then the difference. Borderline easy because the pair is found quickly.
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `6db639755877e24f0f3bf248a3108afa07cbc3a7fa4c7b8a570958534fc4add8`
  - D2 (`factoryCandidateHash`): `6db639755877e24f0f3bf248a3108afa07cbc3a7fa4c7b8a570958534fc4add8`
  - D3 (`publicationContentHash`): `74ec825214db8a2ee7eead88385362ec76a32a5a6c1184511083998f5a1b3133`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check, difficulty gate deviation.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-039 (nr-logic-deduction-numbers)

- **Prompt:** In a magic triangle, there is a number at each of the three corners and one number halfway along each of the three sides. The two corner numbers and the middle number on each side add up to 20. The corner numbers are 5, 7 and 9. What is the sum of the three middle numbers?
- **Declared Key:** `d` (18)
- **Independent Solver Verification:** First-party hash-bound recompute: 18 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `medium` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `70f79c702f7d085692fd69f7fe94fb6e6b54d42f3313172f4cae5e5fc6f1e414`
  - D2 (`factoryCandidateHash`): `70f79c702f7d085692fd69f7fe94fb6e6b54d42f3313172f4cae5e5fc6f1e414`
  - D3 (`publicationContentHash`): `60ef88a846fd3bff2c94ee1e7552577928888030e684e0a5a5a8cc30fdd638f9`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

### scholarship-y6-nr-040 (nr-logic-deduction-numbers)

- **Prompt:** A 4-digit code C consists of the digits 1, 3, 5, and 8, each used exactly once. The code is an even number greater than 5000. What is the smallest possible code meeting these conditions?
- **Declared Key:** `a` (5138)
- **Independent Solver Verification:** First-party hash-bound recompute: 5138 (key matches)
- **Unambiguity & Interpretation Analysis:** Prompt has a unique mathematical solution. Distractors are plausible and distinct.
- **Year 6 Suitability:** Victorian Curriculum Level 6 aligned with scholarship extension depth.
- **Difficulty Metrics:** Declared `medium` | Estimator `medium` (confidence: 1.00)
- **Exact Hash Bindings:**
  - D1 (`rawQuestionHash`): `cbcd1a8cbc0d5d5ce3e23fa9d1863090933770be7e52821bf0d90fe337f77d5e`
  - D2 (`factoryCandidateHash`): `cbcd1a8cbc0d5d5ce3e23fa9d1863090933770be7e52821bf0d90fe337f77d5e`
  - D3 (`publicationContentHash`): `f6014a367c53ea9f91fd366e82f56e07e28799def2b4b8819c3d958ea8ff3270`
- **Provenance & Admission Status:** Unknown original generation. Outside initial engineering scope of ADR-017; requires owner scope expansion.
- **Publication Gate Blockers:** Blocked on human approval, unknown provenance hold, unassessed external originality, unperformed editorial stem-to-solver check.
- **Owner Decision:** [                     ]

## 4. Answer-Withheld Independent Review Packet

The following packet presents questions with options, preserving all required problem context while withholding the answer keys and explanations, suitable for blind qualified human review.

#### Item 1 (`scholarship-y6-nr-001`)

**Question:**
What number comes next in the sequence?
5, 11, 17, 23, 29, ?

**Options:**
- (a) 33
- (b) 34
- (c) 36
- (d) 37
- (e) 35

---

#### Item 2 (`scholarship-y6-nr-002`)

**Question:**
What number comes next in the sequence?
4, 12, 36, 108, ?

**Options:**
- (a) 216
- (b) 312
- (c) 324
- (d) 334
- (e) 432

---

#### Item 3 (`scholarship-y6-nr-003`)

**Question:**
What number comes next in the sequence?
3, 5, 9, 15, 23, ?

**Options:**
- (a) 31
- (b) 33
- (c) 32
- (d) 34
- (e) 35

---

#### Item 4 (`scholarship-y6-nr-004`)

**Question:**
What number comes next in the sequence?
2, 5, 7, 12, 19, ?

**Options:**
- (a) 31
- (b) 26
- (c) 29
- (d) 33
- (e) 35

---

#### Item 5 (`scholarship-y6-nr-005`)

**Question:**
What number comes next in the alternating sequence?
2, 20, 5, 17, 8, 14, 11, ?

**Options:**
- (a) 10
- (b) 12
- (c) 13
- (d) 14
- (e) 11

---

#### Item 6 (`scholarship-y6-nr-006`)

**Question:**
What number comes next in the sequence?
80, 73, 66, 59, 52, ?

**Options:**
- (a) 43
- (b) 44
- (c) 46
- (d) 47
- (e) 45

---

#### Item 7 (`scholarship-y6-nr-007`)

**Question:**
What number comes next in the sequence?
4, 7, 13, 22, 34, ?

**Options:**
- (a) 46
- (b) 47
- (c) 49
- (d) 48
- (e) 51

---

#### Item 8 (`scholarship-y6-nr-008`)

**Question:**
What number comes next in the sequence?
2, 4, 10, 20, 34, ?

**Options:**
- (a) 48
- (b) 50
- (c) 54
- (d) 52
- (e) 56

---

#### Item 9 (`scholarship-y6-nr-009`)

**Question:**
What number comes next in the alternating sequence?
10, 50, 13, 46, 16, 42, ?

**Options:**
- (a) 17
- (b) 18
- (c) 19
- (d) 20
- (e) 38

---

#### Item 10 (`scholarship-y6-nr-010`)

**Question:**
What number comes next in the sequence?
3, 4, 7, 11, 18, 29, ?

**Options:**
- (a) 47
- (b) 43
- (c) 45
- (d) 46
- (e) 48

---

#### Item 11 (`scholarship-y6-nr-011`)

**Question:**
Find the missing number (?) in the 3x3 grid:
[ 4, 7, 11 ]
[ 5, 8, 13 ]
[ 6, 9, ? ]

**Options:**
- (a) 14
- (b) 16
- (c) 17
- (d) 15
- (e) 18

---

#### Item 12 (`scholarship-y6-nr-012`)

**Question:**
Find the missing number (?) in the 3x3 grid:
[ 12, 8, 10 ]
[ 7, 14, 9 ]
[ 11, 8, ? ]

**Options:**
- (a) 9
- (b) 10
- (c) 12
- (d) 11
- (e) 13

---

#### Item 13 (`scholarship-y6-nr-013`)

**Question:**
Find the missing number (?) in the 3x3 grid:
[ 2, 5, 9 ]
[ 3, 8, 14 ]
[ 4, 6, ? ]

**Options:**
- (a) 12
- (b) 13
- (c) 14
- (d) 15
- (e) 16

---

#### Item 14 (`scholarship-y6-nr-014`)

**Question:**
Find the missing number (?) in the 3x3 grid:
[ 15, 6, 8 ]
[ 9, 11, 9 ]
[ 5, 12, ? ]

**Options:**
- (a) 10
- (b) 11
- (c) 13
- (d) 14
- (e) 12

---

#### Item 15 (`scholarship-y6-nr-015`)

**Question:**
Find the missing number (?) in the 3x3 grid:
[ 3, 7, 11 ]
[ 5, 9, 13 ]
[ 4, 8, ? ]

**Options:**
- (a) 10
- (b) 12
- (c) 11
- (d) 13
- (e) 14

---

#### Item 16 (`scholarship-y6-nr-016`)

**Question:**
Find the missing number (?) in the 3x3 grid:
[ 7, 3, 11 ]
[ 5, 4, 6 ]
[ 6, 8, ? ]

**Options:**
- (a) 12
- (b) 20
- (c) 2
- (d) 4
- (e) 8

---

#### Item 17 (`scholarship-y6-nr-017`)

**Question:**
Find the missing number (?) in the 3x3 grid:
[ 14, 10, 16 ]
[ 8, 12, 20 ]
[ 18, 18, ? ]

**Options:**
- (a) 2
- (b) 4
- (c) 6
- (d) 8
- (e) 10

---

#### Item 18 (`scholarship-y6-nr-018`)

**Question:**
Find the missing number (?) in the 3x3 grid:
[ 6, 12, 18 ]
[ 8, 16, 24 ]
[ 5, 10, ? ]

**Options:**
- (a) 12
- (b) 14
- (c) 15
- (d) 16
- (e) 20

---

#### Item 19 (`scholarship-y6-nr-019`)

**Question:**
Find the missing number (?) in the 3x3 grid:
[ 10, 14, 12 ]
[ 15, 9, 12 ]
[ 11, 13, ? ]

**Options:**
- (a) 10
- (b) 11
- (c) 12
- (d) 14
- (e) 15

---

#### Item 20 (`scholarship-y6-nr-020`)

**Question:**
Find the missing number (?) in the 3x3 grid:
[ 1, 8, 10 ]
[ 4, 5, 13 ]
[ 3, 7, ? ]

**Options:**
- (a) 11
- (b) 13
- (c) 12
- (d) 14
- (e) 15

---

#### Item 21 (`scholarship-y6-nr-021`)

**Question:**
A farmer has chickens and sheep in a paddock. Together there are 24 heads and 68 legs. How many sheep are in the paddock?

**Options:**
- (a) 10
- (b) 8
- (c) 9
- (d) 12
- (e) 14

---

#### Item 22 (`scholarship-y6-nr-022`)

**Question:**
Marcus is currently three times as old as his sister Chloe. In 8 years, Marcus will be twice as old as Chloe will be then. How old is Chloe now?

**Options:**
- (a) 6
- (b) 7
- (c) 9
- (d) 10
- (e) 8

---

#### Item 23 (`scholarship-y6-nr-023`)

**Question:**
At a school stationery shop, 3 notebooks and 2 pens cost $19. Meanwhile, 2 notebooks and 4 pens cost $18. How much does 1 notebook cost?

**Options:**
- (a) $3
- (b) $5
- (c) $4
- (d) $6
- (e) $7

---

#### Item 24 (`scholarship-y6-nr-024`)

**Question:**
A ribbon measuring 84 cm is cut into two pieces. One piece is 16 cm longer than the other. What is the length of the shorter piece in centimetres?

**Options:**
- (a) 34
- (b) 32
- (c) 35
- (d) 36
- (e) 50

---

#### Item 25 (`scholarship-y6-nr-025`)

**Question:**
A bus starts its morning route carrying some passengers. At the first stop, 6 passengers get off and 10 get on. At the second stop, half the remaining passengers get off, leaving 18 passengers on board. How many passengers were originally on the bus?

**Options:**
- (a) 28
- (b) 32
- (c) 30
- (d) 34
- (e) 36

---

#### Item 26 (`scholarship-y6-nr-026`)

**Question:**
Five consecutive whole numbers have a sum of 135. What is the largest of these five numbers?

**Options:**
- (a) 27
- (b) 28
- (c) 30
- (d) 29
- (e) 31

---

#### Item 27 (`scholarship-y6-nr-027`)

**Question:**
A fruit stall sells apples for $2 each and mangoes for $5 each. Leo buys 12 pieces of fruit in total and pays $39. How many mangoes did Leo buy?

**Options:**
- (a) 4
- (b) 6
- (c) 5
- (d) 7
- (e) 8

---

#### Item 28 (`scholarship-y6-nr-028`)

**Question:**
Ethan has twice as many trading cards as Oliver. After Ethan gives 15 cards to Oliver, they both have an equal number of cards. How many cards did Ethan have originally?

**Options:**
- (a) 45
- (b) 60
- (c) 50
- (d) 55
- (e) 65

---

#### Item 29 (`scholarship-y6-nr-029`)

**Question:**
In a 30-question mathematics quiz, 4 marks are awarded for each correct answer and 1 mark is deducted for each incorrect answer. Grace attempted all 30 questions and scored 85 marks. How many questions did Grace answer correctly?

**Options:**
- (a) 20
- (b) 21
- (c) 22
- (d) 24
- (e) 23

---

#### Item 30 (`scholarship-y6-nr-030`)

**Question:**
A rectangular garden has a perimeter of 54 metres. The length is 7 metres longer than the width. What is the length of the garden in metres?

**Options:**
- (a) 10
- (b) 15
- (c) 18
- (d) 17
- (e) 20

---

#### Item 31 (`scholarship-y6-nr-031`)

**Question:**
A two-digit number N has a tens digit that is 3 greater than its units digit. When N is divided by the sum of its digits, the quotient is 7 and the remainder is 3. What is N?

**Options:**
- (a) 52
- (b) 41
- (c) 63
- (d) 74
- (e) 85

---

#### Item 32 (`scholarship-y6-nr-032`)

**Question:**
In the sum AB + A = 52, AB is a two-digit number with tens digit A and units digit B, and A and B are different non-zero digits. What digit does B represent?

**Options:**
- (a) 5
- (b) 6
- (c) 8
- (d) 7
- (e) 9

---

#### Item 33 (`scholarship-y6-nr-033`)

**Question:**
A 3-digit number N has hundreds digit H, tens digit T, and units digit U. H is three times U, and T is 2 less than H. If the sum of all three digits is 12, what is N?

**Options:**
- (a) 642
- (b) 624
- (c) 973
- (d) 318
- (e) 633

---

#### Item 34 (`scholarship-y6-nr-034`)

**Question:**
Find the positive integer N such that when N is divided by 5 it leaves a remainder of 3, and when divided by 7 it leaves a remainder of 2, with N being less than 30.

**Options:**
- (a) 13
- (b) 23
- (c) 16
- (d) 18
- (e) 28

---

#### Item 35 (`scholarship-y6-nr-035`)

**Question:**
Three friends, Jack, Maya, and Noah, have some marbles. Jack has 4 more marbles than Maya. Noah has twice as many marbles as Maya. Together they have 44 marbles. How many marbles does Maya have?

**Options:**
- (a) 8
- (b) 9
- (c) 11
- (d) 12
- (e) 10

---

#### Item 36 (`scholarship-y6-nr-036`)

**Question:**
In the multiplication 4A × 3 = 138, 4A is a two-digit number with tens digit 4 and units digit A. What digit is A?

**Options:**
- (a) 4
- (b) 5
- (c) 7
- (d) 6
- (e) 8

---

#### Item 37 (`scholarship-y6-nr-037`)

**Question:**
A two-digit number is prime. The product of its two digits is 18. What is the number?

**Options:**
- (a) 36
- (b) 92
- (c) 63
- (d) 39
- (e) 29

---

#### Item 38 (`scholarship-y6-nr-038`)

**Question:**
The product of two positive integers X and Y is 72, and their sum is 18 (with X > Y). What is their positive difference (D = X - Y)?

**Options:**
- (a) 6
- (b) 4
- (c) 5
- (d) 7
- (e) 8

---

#### Item 39 (`scholarship-y6-nr-039`)

**Question:**
In a magic triangle, there is a number at each of the three corners and one number halfway along each of the three sides. The two corner numbers and the middle number on each side add up to 20. The corner numbers are 5, 7 and 9. What is the sum of the three middle numbers?

**Options:**
- (a) 15
- (b) 16
- (c) 17
- (d) 18
- (e) 19

---

#### Item 40 (`scholarship-y6-nr-040`)

**Question:**
A 4-digit code C consists of the digits 1, 3, 5, and 8, each used exactly once. The code is an even number greater than 5000. What is the smallest possible code meeting these conditions?

**Options:**
- (a) 5138
- (b) 5318
- (c) 5183
- (d) 8135
- (e) 5381

---

