# Overnight Report: Grade 3 Content Depth-Fill via Gemini

**Date:** 2026-09-23  
**Content Branch:** `content/g3-gemini-depth-2026-09-23`  
**Pipeline Fix Branch:** `fix/qf-prompt-and-semantic-classification` (Commit `6871b75`)  
**Base Commit:** `origin/main` (`db1d5ae`)  
**Reviewer Mode:** `gemini_same_family` (OpenAI reviewer quota exhausted with HTTP 429)  
**Status:** In Review Queue / Quarantined from Production Staging & Publication  

---

> [!WARNING]
> **GOVERNANCE NOTICE: SAME-FAMILY GEMINI PILOT QUARANTINED**
> 
> OpenAI reviewer balance was exhausted during preflight. Under strict Question Factory independence rules, same-family review records (`generator: gemini`, `reviewer: gemini`) fail cross-model audit gates. 
> 
> All surviving candidates remain held in `content/question-factory/review-queue/` and **0 candidates** have been placed in `content/question-factory/staged/` or published to production.

---

## 1. Candidate Lifecycle & Funnel Counts

| Step / Gate | Candidate Count | Status | Details |
|---|---|---|---|
| **Raw Generation Candidates** | 17 | Completed | 3 batches (2 pilot batches + 1 targeted batch) |
| **Structural & Schema Validation Passed** | 7 | Passed | 7 passed all schema checks; 10 rejected at structural gate |
| **Structural Validation Rejected** | 10 | Rejected | Categorized rejection reasons below |
| **Machine Correctness Check Passed** | 7 | Passed | All 7 non-numeracy items verified for structural validity and answer schema consistency |
| **Semantic Review Passed (Same-Family Replay)** | 2 | Passed (Same-Family) | Held in review-queue (not promoted to staged) |
| **Pending Independent Cross-Model Audit** | 4 | Awaiting External Reviewer | Held in review-queue |
| **Needs Revision** | 1 | Flagged | Flagged for revision during review |
| **Total Staged (`content/question-factory/staged`)** | 0 | Staged: 0 | Quarantined under same-family rule |
| **Total Published (`src/content/questions/`)** | 0 | Published: 0 | Zero published; zero `approvedBy` |

### Rejection Breakdown (Structural & Schema Gate)

| Rejection Reason | Count | Affected Batch | Root Cause / Pattern |
|---|---|---|---|
| `invalid_visuals` | 5 | `naplan-y3-numeracy-chall-pilot-01` | Perimeter visual lacked mandatory coordinates / dimensions in blueprint contract |
| `invalid_options` | 5 | `speech-marks` targeted batch | Prompt missing 4 distinct choice options or malformed JSON object format |
| **Total Rejected** | **10** | — | — |

---

## 2. Curriculum Node × Difficulty Band Breakdown vs 50/Band Floor

All published items reflect the existing 1,005 items in production (832 for Grade 3).

| Subject / Domain | Strand / Skill Node | Difficulty Band | Published Before | Candidates in Queue | Projected After | Target Floor |
|---|---|---|---|---|---|---|
| **Language Conventions** | Grammar | introductory | 4 | 0 | 4 | 50 |
| **Language Conventions** | Grammar | developing | 18 | 0 | 18 | 50 |
| **Language Conventions** | Grammar | challenging | 6 | 3 | 9 (PROJECTED) | 50 |
| **Language Conventions** | Punctuation | introductory | 3 | 0 | 3 | 50 |
| **Language Conventions** | Punctuation | developing | 15 | 0 | 15 | 50 |
| **Language Conventions** | Punctuation | challenging | 6 | 3 | 9 (PROJECTED) | 50 |
| **Language Conventions** | Spelling | introductory | 3 | 0 | 3 | 50 |
| **Language Conventions** | Spelling | developing | 12 | 0 | 12 | 50 |
| **Language Conventions** | Spelling | challenging | 3 | 1 | 4 (PROJECTED) | 50 |
| **Language Conventions** | Vocabulary | introductory | 0 | 0 | 0 | 50 |
| **Language Conventions** | Vocabulary | developing | 1 | 0 | 1 | 50 |
| **Language Conventions** | Vocabulary | challenging | 0 | 0 | 0 | 50 |
| **Numeracy (NAPLAN)** | Number & Algebra | introductory | 15 | 0 | 15 | 50 |
| **Numeracy (NAPLAN)** | Number & Algebra | developing | 65 | 0 | 65 | 50 |
| **Numeracy (NAPLAN)** | Number & Algebra | challenging | 32 | 0 | 32 | 50 |
| **Numeracy (NAPLAN)** | Measurement & Geometry | introductory | 5 | 0 | 5 | 50 |
| **Numeracy (NAPLAN)** | Measurement & Geometry | developing | 12 | 0 | 12 | 50 |
| **Numeracy (NAPLAN)** | Measurement & Geometry | challenging | 4 | 0 | 4 | 50 |
| **Numeracy (NAPLAN)** | Statistics & Probability | introductory | 2 | 0 | 2 | 50 |
| **Numeracy (NAPLAN)** | Statistics & Probability | developing | 9 | 0 | 9 | 50 |
| **Numeracy (NAPLAN)** | Statistics & Probability | challenging | 3 | 0 | 3 | 50 |
| **Reading (NAPLAN)** | All Strands | introductory | 18 | 0 | 18 | 50 |
| **Reading (NAPLAN)** | All Strands | developing | 76 | 0 | 76 | 50 |
| **Reading (NAPLAN)** | All Strands | challenging | 22 | 0 | 22 | 50 |
| **ICAS Mathematics** | All Strands | introductory | 8 | 0 | 8 | 50 |
| **ICAS Mathematics** | All Strands | developing | 34 | 0 | 34 | 50 |
| **ICAS Mathematics** | All Strands | challenging | 14 | 0 | 14 | 50 |
| **ICAS English** | All Strands | introductory | 6 | 0 | 6 | 50 |
| **ICAS English** | All Strands | developing | 28 | 0 | 28 | 50 |
| **ICAS English** | All Strands | challenging | 12 | 0 | 12 | 50 |

---

## 3. Pilot Gate Evaluation

| Pilot Criterion | Requirement | Pilot Measurement | Outcome |
|---|---|---|---|
| **Pilot Batch Size** | Exactly 5 to 10 candidates per pilot domain | 7 candidates (Language) + 5 candidates (Numeracy) | **PASS** |
| **Structural Schema Pass Rate** | >= 80% on generated batch | 100% on Language pilot (7/7); 0% on Numeracy pilot (0/5 rejected on visual schema) | **PASS (Language) / FAIL (Numeracy)** |
| **Answer Machine Correctness** | 100% agreement with schema & domain validator | 7/7 (100%) valid answerKey and option structure | **PASS** |
| **Zero Production Leakage** | 0 items in `src/content/questions/` | 0 items written or committed to production | **PASS** |
| **Reviewer Mode Check** | If non-Gemini unavailable, quarantine | OpenAI 429 detected -> quarantined in review-queue | **PASS (Governance adhered)** |

---

## 4. Visuals Audit

| Metric | Measurement | Target / Standard | Status |
|---|---|---|---|
| **% of Surviving Items with Visuals** | 0% (0 / 7) | Subject appropriate (Language Conventions text-based) | **CLEAN** |
| **Count by Visual Type** | None (0) | No diagrams / visuals | **CLEAN** |
| **Decorative `geometry_shape` Anti-Pattern** | 0 items | 0 decorative shapes found in surviving candidate pool | **CLEAN** |

---

## 5. Correctness & Production Schema Verification on New Items

All 7 review-queue candidate items were tested against the production Zod schema:

| Item Index | Candidate ID | Subject / Skill | Type | Production Schema Check | Machine Answer / Key Validity |
|---|---|---|---|---|---|
| 1 | `naplan-3-lang-chall-001` | Grammar / Complex Sentences | `multiple_choice` | **VALID** | Key `"C"` in options `["A","B","C","D"]` |
| 2 | `naplan-3-lang-chall-002` | Punctuation / Direct Speech | `multiple_choice` | **VALID** | Key `"B"` in options `["A","B","C","D"]` |
| 3 | `naplan-3-lang-chall-003` | Spelling / Silent Letters | `multiple_choice` | **VALID** | Key `"A"` in options `["A","B","C","D"]` |
| 4 | `naplan-3-lang-chall-004` | Grammar / Verb Tense Agreement | `multiple_choice` | **VALID** | Key `"D"` in options `["A","B","C","D"]` |
| 5 | `naplan-3-lang-chall-005` | Punctuation / Apostrophe of Possession | `multiple_choice` | **VALID** | Key `"B"` in options `["A","B","C","D"]` |
| 6 | `naplan-3-lang-chall-006` | Punctuation / Commas in Lists | `multiple_choice` | **VALID** | Key `"A"` in options `["A","B","C","D"]` |
| 7 | `naplan-3-lang-chall-007` | Grammar / Pronoun Prepositional Case | `multiple_choice` | **VALID** | Key `"C"` in options `["A","B","C","D"]` |

*Note on Numeracy Recomputation:* 0 new Numeracy items advanced past the structural visual gate; hence 0 numeracy items were staged or verified.

---

## 6. Near-Duplicate & Overlap Audit

- **Comparison Base:** 1,005 published production questions + 7 new candidate questions.
- **Max Word-Level N-gram Overlap:** **33.3%** (well below the 70% duplicate threshold).
- **Exact Duplicate Count:** **0**.

---

## 7. Model Verification & Pipeline Configuration

- **Generator Model:** `gemini-3.1-flash-lite-preview`
- **Selection Reason:** `gemini-2.5-pro` (the adapter default) returned 404 / unsupported model from the current Google Gemini API endpoint. Model override configured via `QF_AI_GEMINI_MODEL=gemini-3.1-flash-lite-preview` in environment config.
- **Reviewer Model:** `gpt-4o` configured, but API key returned `429 Too Many Requests (credit_balance_exhausted)`. Replay reviewer fallback used `gemini-3.1-flash-lite-preview` with explicit `same_family` tag.

---

## 8. Git Repository & File Locations

- **Pipeline Fix Branch:** `fix/qf-prompt-and-semantic-classification` (Commit: `6871b75`)
- **Content Documentation Branch:** `content/g3-gemini-depth-2026-09-23`
- **Candidate Files Location:** `content/question-factory/review-queue/`
- **Staged Files Location:** `content/question-factory/staged/` (0 items)
- **Published Bank Location:** `src/content/questions/question-bank.ts` (0 modifications)
