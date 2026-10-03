# Content Depth Generation Runbook & Reading Blueprint Audit

**Branch:** `content/depth-prep-and-reading-regroup`  
**Status:** Strategic Generation Runbook & Technical Audit (No Content Generation Performed)  
**Date:** October 2026  
**Audience:** Content Governance Board, Product Lead (Vish), Question Factory Operators  

---

## 1. Executive Summary & Verification of the Reading-Paper Claim

### 1.1 The September Audit Claim
The September 2026 Programme Readiness Audit asserted:
> *"NAPLAN Y3 Reading: Either relax the pattern constraint to `questionsPerStimulus: [3, 7]` (which immediately activates 19 existing passages with 62 approved questions) or author 1 additional question for 5–7 of the existing 3-question passages... immediately yields 19 valid selection units, easily satisfying the 39-question paper requirement ($6 \text{ passages} \times 6\text{–}7 \text{ questions}$)."*

### 1.2 Rigorous Technical & Mathematical Verification
We ran an exhaustive empirical test against the published bank (`getExamBank("published")`) using the exam selection engine (`selectPatternQuestions` in `src/features/exam-engine/exam-patterns/select-pattern-questions.ts`).

#### Findings for Year 3 (`naplan-y3-reading-full`):
* **Bank Composition:** The published bank contains **97 eligible questions** across **36 distinct stimuli**.
* **Stimulus Group Distribution:**
  * 16 stimuli have **1 question** (16 items) — *undersized, dropped whole*
  * 1 stimulus has **2 questions** (2 items) — *undersized, dropped whole*
  * 14 stimuli have **3 questions** (42 items)
  * 5 stimuli have **4 questions** (20 items)
  * **0 stimuli** have 5, 6, or 7 questions.
* **Under Current `questionsPerStimulus: [4, 7]`:**
  * Exactly 5 stimuli qualify (the 5 four-question passages = 20 questions).
  * The pattern requires `questionCount: 39` and `distinctStimuli: [6, 7]`.
  * With only 5 units available, the paper fails immediately (`insufficient_questions`).
* **Under Proposed `questionsPerStimulus: [3, 7]`:**
  * 19 stimuli qualify (14 three-question + 5 four-question passages = 62 questions).
  * **The Mathematical Impossibility:** The blueprint strictly constrains the paper to `distinctStimuli: [6, 7]` (6 to 7 passages).
    * If 7 stimuli of the maximum size (4 questions) are selected: $7 \times 4 = 28$ questions maximum.
    * If 6 stimuli are selected: $6 \times 4 = 24$ questions maximum.
    * Under `questionsPerStimulus: [3, 7]`, **no combination of 6 or 7 units from the bank can ever sum to 39**.
    * To reach 39 questions using only 3- and 4-question units requires between **10 and 13 distinct passages** (e.g. $9 \times 4 + 1 \times 3 = 39$ across 10 passages, or $13 \times 3 = 39$ across 13 passages).
    * Presenting 10–13 reading passages to a Year 3 student in a 45-minute exam violates official NAPLAN structure and cognitive load limits.
  * **Pass Rate:** Across 50 randomized seeds, **0/50 papers assembled successfully (0% pass rate)**.

#### Findings for Year 5 (`naplan-y5-reading-full`):
* **Bank Composition:** The published bank contains **106 eligible questions** across **18 distinct stimuli**.
* **Stimulus Group Distribution:**
  * 13 stimuli have **1 question** (13 items) — *undersized*
  * 1 stimulus has **2 questions** (2 items) — *undersized*
  * 1 stimulus has **7 questions** (7 items) — *valid*
  * 1 stimulus has **8 questions** (8 items) — *oversized ($> 7$), dropped whole*
  * 1 stimulus has **9 questions** (9 items) — *oversized ($> 7$), dropped whole*
  * 1 stimulus has **15 questions** (15 items) — *oversized ($> 7$), dropped whole*
* **Assembly Evaluation:**
  * Exactly **1 valid unit** (the 7-question stimulus) exists in the bank.
  * The pattern requires `questionCount: 39` and `distinctStimuli: [6, 6]`.
  * Assembling 39 questions across 6 distinct passages from a single 7-question passage is physically impossible.
  * Partitioning the oversized passages ($8 \to 4+4, 9 \to 4+5, 15 \to 5+5+5$) creates passage duplication (the same text shown multiple times in one paper), violating whole-group integrity.

### 1.3 Audit Conclusion & Action Taken
> [!IMPORTANT]
> **Zero Fabrication Policy Enforced:** The September audit claim is **DISPROVEN**. Widening `questionsPerStimulus` from `[4, 7]` to `[3, 7]` does **not** make full reading papers assemblable.
> 
> In accordance with repository standing rules, **`exam-pattern-registry.ts` has been left strictly UNCHANGED**. We refuse to fudge constraints, dilute assessment validity, or overload primary students with 13 passages. The only sound solution is generating fresh, authentic reading content with the correct question density.

---

## 2. Served-vs-Floor Capacity Gap Analysis

Capacity is evaluated against the governed standard: **50 items per capacity cell** (`family × yearLevel × subject × difficultyBand`), guaranteeing a minimum of 50 non-repeating adaptive sittings per cell.

### 2.1 Summary Metrics (Served Bank: 1,464 Items)
* **Total Evaluated Cells:** 114
* **Zero-Item Cells (Critical Deficit):** 78
* **Under-Capacity Cells (< 50 items):** 31
* **Met-Capacity Cells (≥ 50 items):** 5

---

### 2.2 Active Primary Programme Capacity Gaps (Years 3 & 5)

| Programme | Year | Subject | Difficulty Band | Served Count | Required Floor | Gap (Items Needed) | Status |
| :--- | :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **NAPLAN** | **3** | **Numeracy** | Easy | 77 | 50 | **0** | **Floor Met** |
| NAPLAN | 3 | Numeracy | Medium | 35 | 50 | **15** | Shortage |
| NAPLAN | 3 | Numeracy | Challenging | 16 | 50 | **34** | Severe Shortage |
| NAPLAN | 3 | Reading | Easy | 37 | 50 | **13** | Shortage |
| NAPLAN | 3 | Reading | Medium | 40 | 50 | **10** | Shortage |
| NAPLAN | 3 | Reading | Challenging | 20 | 50 | **30** | Severe Shortage |
| NAPLAN | 3 | Language | Easy | 49 | 50 | **1** | Near Floor |
| NAPLAN | 3 | Language | Medium | 32 | 50 | **18** | Shortage |
| NAPLAN | 3 | Language | Challenging | 15 | 50 | **35** | Severe Shortage |
| **NAPLAN** | **5** | **Numeracy** | Easy | 74 | 50 | **0** | **Floor Met** |
| NAPLAN | 5 | Numeracy | Medium | 85 | 50 | **0** | **Floor Met** |
| NAPLAN | 5 | Numeracy | Challenging | 5 | 50 | **45** | Critical Deficit |
| NAPLAN | 5 | Reading | Easy | 41 | 50 | **9** | Near Floor |
| NAPLAN | 5 | Reading | Medium | 59 | 50 | **0** | **Floor Met** |
| NAPLAN | 5 | Reading | Challenging | 6 | 50 | **44** | Critical Deficit |
| NAPLAN | 5 | Language | Easy | 45 | 50 | **5** | Near Floor |
| NAPLAN | 5 | Language | Medium | 30 | 50 | **20** | Shortage |
| NAPLAN | 5 | Language | Challenging | 7 | 50 | **43** | Critical Deficit |
| **ICAS** | **3** | **Science** | Easy | 30 | 50 | **20** | Shortage |
| ICAS | 3 | Science | Medium | 48 | 50 | **2** | Near Floor |
| ICAS | 3 | Science | Challenging | 21 | 50 | **29** | Shortage |
| ICAS | 3 | Digital Tech | Easy | 31 | 50 | **19** | Shortage |
| ICAS | 3 | Digital Tech | Medium | 43 | 50 | **7** | Near Floor |
| ICAS | 3 | Digital Tech | Challenging | 24 | 50 | **26** | Shortage |
| ICAS | 3 | Mathematics | Easy | 32 | 50 | **18** | Shortage |
| ICAS | 3 | Mathematics | Medium | 45 | 50 | **5** | Near Floor |
| ICAS | 3 | Mathematics | Challenging | 24 | 50 | **26** | Shortage |
| ICAS | 3 | Spelling | Easy | 28 | 50 | **22** | Shortage |
| ICAS | 3 | Spelling | Medium | 44 | 50 | **6** | Near Floor |
| ICAS | 3 | Spelling | Challenging | 26 | 50 | **24** | Shortage |
| **ICAS** | **5** | **Science** | Easy / Med / Chal | **0** | **150** | **150** | **ZERO SERVED (Quarantined)** |
| ICAS | 5 | Mathematics | Easy | 23 | 50 | **27** | Shortage |
| ICAS | 5 | Mathematics | Medium | 57 | 50 | **0** | **Floor Met** |
| ICAS | 5 | Mathematics | Challenging | 32 | 50 | **18** | Shortage |
| ICAS | 5 | Digital Tech | Easy | 11 | 50 | **39** | Severe Shortage |
| ICAS | 5 | Digital Tech | Medium | 16 | 50 | **34** | Severe Shortage |
| ICAS | 5 | Digital Tech | Challenging | 8 | 50 | **42** | Critical Deficit |
| ICAS | 5 | Spelling | Easy | 14 | 50 | **36** | Severe Shortage |
| ICAS | 5 | Spelling | Medium | 20 | 50 | **30** | Severe Shortage |
| ICAS | 5 | Spelling | Challenging | 11 | 50 | **39** | Critical Deficit |

---

## 3. Prerequisites for Content Generation

Before running any generator CLI (`npm run questions:generate-ai` or pipeline runner), the operator must ensure:

1. **Primary Generation Model Environment:**
   * `QF_AI_PROVIDER="gemini"`
   * `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) set with an active quota.
   * `QF_AI_GEMINI_MODEL`: Gemini has **no default fallback model** in the codebase. It must be explicitly set to a current GA model:
     ```env
     QF_AI_GEMINI_MODEL="gemini-1.5-pro"
     ```
2. **Mandatory Independent Reviewer Key:**
   * Per `docs/REVIEW_INDEPENDENCE_POLICY.md`, an AI generator cannot review its own work.
   * An independent, non-Gemini provider key is mandatory:
     * Either `ANTHROPIC_API_KEY` (uses `claude-3-5-sonnet` / `claude-sonnet-5`)
     * Or `OPENAI_API_KEY` (uses `gpt-4o`).
3. **Curriculum & Visual Standards Preflight:**
   * All science/math questions must comply with `docs/CONTENT_STANDARDS_SCIENCE.md` and `docs/VISUAL_SCHEMA.md`.
   * Visual assets must use deterministic JSON structure (`table`, `diagram_svg`, `geometry_shape`, `chart`). Unsanitized raw SVG is forbidden.
4. **Human Gate Readiness:**
   * Automated pipelines can only advance content to `staged` or `ready_for_final_review`.
   * A designated human reviewer (`approvedBy: "vish"`) must sign off before manifest creation.

---

## 4. Prioritised Generation Roadmap

Content generation should execute in the following ranked sequence:

### Priority 1: Year 3 NAPLAN Foundation (Get Y3 into Viable Exam Shape)
Year 3 has immediate marketing appeal for primary school parents.
1. **Y3 Reading Stimuli & Questions (Top Deficit):**
   * Author **6 new reading passages** with **6 to 7 questions each** (total ~40 items).
   * Ensure text complexity matches Grade 3 Lexile / AR levels (approx 200–400 words, narrative and informative texts).
   * This immediately activates `naplan-y3-reading-full` for assembly.
2. **Y3 Numeracy Challenging & Medium Bands:**
   * Generate 34 Challenging and 15 Medium questions focused on Measurement, Space, and Multi-Step Problem Solving.
3. **Y3 Language Conventions (Spelling & Grammar):**
   * Generate 35 Challenging and 18 Medium questions targeting phonemic spelling, irregular verbs, and punctuation.

### Priority 2: Year 5 NAPLAN Challenging Band Top-Up
Year 5 has healthy Easy and Medium banks, but severe Challenging band shortages (only 5 numeracy, 6 reading, 7 language).
* Generate **45 Challenging Numeracy items**.
* Generate **44 Challenging Reading items** (spread across high-order inference questions).
* Generate **43 Challenging Language items**.

### Priority 3: Year 5 ICAS Science Resurrection (Zero Generation Cost)
Revive 120 existing items from quarantine (see §5 below) to immediately take Year 5 Science from 0 to 120 served items.

### Priority 4: ICAS Digital Technologies & Spelling Bee
* Top up Y5 Digital Technologies (gap = 115 items across bands).
* Top up Y5 Spelling Bee (gap = 105 items).

---

## 5. Year 5 ICAS Science Resurrection Path

The quarantine compartment `content/manual-questions/_conflicts/` holds 5 historical Year 5 Science batches (200 total items).

### 5.1 Batch Triage & Defect Analysis

| Batch ID | Items | Review Status | Visuals | Audit Findings | Decision |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `icas-y5-science-b01` | 40 | `audited_reject` | 18/40 | 4 wrong answer keys (q012, q019, q022, q024), ambiguous "choose-two" options (q011), schema-invalid shapes (q032), invalid difficulty split. | **PERMANENTLY DISCARD** |
| `icas-y5-science-b02` | 40 | `audited_reject` | 23/40 | Rejected for wrong scientific classification (q023), ambiguous rationale (q024), and 23 leaky/misleading visuals. | **PERMANENTLY DISCARD** |
| `icas-y5-science-b03` | 40 | `gates_passed` | 0/40 | Clean question texts, passes schema and duplicate checks. Quarantined only for 0% visuals and lack of independent audit. | **REVIVE** |
| `icas-y5-science-b04` | 40 | `ready_for_final_review` | 0/40 | Passed Qwen blind cross-model re-audit with 0 errors/ambiguities. Quarantined only for 0% visuals. | **REVIVE** |
| `icas-y5-science-b05` | 40 | `ready_for_final_review` | 0/40 | Blind re-solved by Qwen with 0 audit flags. Quarantined for 0% visuals. | **REVIVE** |

### 5.2 The 5-Step Resurrection Recipe (Recovering 120 Items)

1. **Step 1: Visual Asset Attachment**
   * ICAS Science requires a **40–60% visual asset floor** (minimum 16 to 24 visuals per 40-item batch).
   * For batches `b03`, `b04`, and `b05`, author structured visual JSON (food webs, electrical circuits, experimental apparatus diagrams, bar charts) for 16–20 questions per batch.
2. **Step 2: Run Machine Quality Gates**
   * Execute:
     ```bash
     npm run questions:gate -- --batch icas-y5-science-b03
     npm run questions:gate -- --batch icas-y5-science-b04
     npm run questions:gate -- --batch icas-y5-science-b05
     ```
   * Confirm schema compliance, option text uniqueness, and position balance spread $\le 1$.
3. **Step 3: Independent Blind Cross-Model Re-Audit**
   * Run the independent reviewer CLI to produce modern per-item resolve sidecars:
     ```bash
     npm run questions:review-ai -- --batch icas-y5-science-b03 --provider anthropic
     npm run questions:review-ai -- --batch icas-y5-science-b04 --provider anthropic
     npm run questions:review-ai -- --batch icas-y5-science-b05 --provider anthropic
     ```
4. **Step 4: Promote to Staging**
   * Move clean files from `content/manual-questions/_conflicts/` to `content/manual-questions/grade-5/icas/icas-y5-science/`.
   * Update `content/manual-questions/BATCH-LOG.md` recording promotion from quarantine.
5. **Step 5: Human Review & Publication**
   * Human board review by Vish.
   * Publish manifest and inject into compiled bank:
     ```bash
     npm run questions:publish
     ```

---

## 6. Estimated API Cost & Runtime

To close the active primary gaps (approximately 450 items across Y3 and Y5):

| Step | Model Used | Tokens per Item | Cost per 1,000 Items | Total Est. Cost (450 Items) | Est. Runtime |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Generation** | Gemini 1.5 Pro | ~1,200 prompt + ~800 completion | ~$3.50 | ~$1.60 | ~35 minutes |
| **Machine Validation** | Local Node.js | 0 | $0.00 | $0.00 | ~1 minute |
| **Independent Review** | Claude 3.5 Sonnet | ~1,500 prompt + ~600 completion | ~$15.00 | ~$6.75 | ~45 minutes |
| **Visual Validation** | Local Zod | 0 | $0.00 | $0.00 | ~30 seconds |
| **Total** | | | | **~$8.35 USD** | **~1.5 hours** |

* **Conclusion:** Generation cost is negligible (~$8–$10 USD total) once API keys are configured. The governing bottleneck is **human review board approval** and **visual asset authoring**.
