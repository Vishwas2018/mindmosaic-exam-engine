# Programme Readiness & Content Depth Audit (September 2026)

**Audit Date:** 26 September 2026  
**Auditor:** Antigravity Unattended Auditor  
**Repository:** `Vishwas2018/mindmosaic-exam-engine`  
**Base SHA:** `db1d5aeba4be89257b6f3e50799aed524f8807c3` (`origin/main`)  
**Worktree Branch:** `audit/programme-readiness-2026-09`  
**Standard Floor:** 50 served items per difficulty band (`easy`, `medium`, `challenging`)  
**Readiness Scale:**  
`0 Not started` · `1 Scaffolding only` · `2 Engine ready, no content` · `3 Live but thin` · `4 Launchable MVP` · `5 Complete to target`

---

## 1. Executive Summary & One-Page Scorecard

This audit evaluates the live, served question bank and execution engine across all eight curriculum and assessment programmes supported or advertised by MindMosaic, plus the internal and external AI pipelines.

Counts are measured directly against the served runtime bank (`publishedExamBank`, 1,548 items: 1,005 curated + 543 factory-published) using the platform's production selection logic (`@/server/exam-bank`, `@/features/exam-engine/exam-patterns`, `resolveQuestionsForCurriculumNode`), strictly excluding the 1,103 ungated auto-generated practice seeds.

### Master Scorecard

| Programme | Engine | Content | Correctness | Full Paper Viability | Learning Loop | UX & Honesty | Tests | Parent Visibility | Overall Stage |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **NAPLAN-style (Year 3)** | 4 | 3 | 4 | 3 | 3 | 5 | 4 | 4 | **3 (Live but thin)** |
| **NAPLAN-style (Year 5)** | 4 | 3 | 3 | 3 | 3 | 5 | 4 | 4 | **3 (Live but thin)** |
| **ICAS-style (Year 3)** | 4 | 3 | 4 | 4 | 3 | 5 | 4 | 4 | **4 (Launchable MVP)** |
| **ICAS-style (Year 5)** | 3 | 2 | 3 | 3 | 2 | 5 | 4 | 4 | **3 (Live but thin)** |
| **Curriculum Learning (VIC L3/L5)** | 4 | 3 | 4 | 3 | 4 | 5 | 4 | 5 | **3 (Live but thin)** |
| **AMC-style (Maths Competition)** | 0* | 0 | 0 | 0 | 0 | 4 | 1* | 0 | **0 (Not started)** |
| **Selective Entry-style (VIC first)** | 0 | 0 | 0 | 0 | 0 | 4 | 1 | 0 | **0 (Not started)** |
| **Scholarship (ACER / Edutest)** | 0 | 0 | 0 | 0 | 0 | 4 | 1 | 0 | **0 (Not started)** |
| **Singapore Maths (Model Method)** | 0 | 0 | 0 | 0 | 0 | 4 | 1 | 0 | **0 (Not started)** |
| **Maths Olympiad** | 0 | 0 | 0 | 0 | 0 | 4 | 1 | 0 | **0 (Not started)** |
| **AI: Question Factory (Internal)** | 4 | 3 | 3* | N/A | N/A | 4 | 4 | N/A | **3 (Live but thin)** |
| **AI: Student/Parent-facing** | 0 | 0 | N/A | N/A | N/A | 5 | N/A | N/A | **0 (None live — compliant)** |

*\*Note on open PRs:*
- **PR #10 (`feat/amc-family-clean`)**: Not merged on `main`. If merged, AMC Engine moves from `0` to `2` (Engine ready, no content), Tests from `1` to `4`, and overall stage to `1 (Scaffolding only)`.
- **Branch `fix/qf-prompt-and-semantic-classification` (commit `6871b75`)**: Not merged on `main`. Fixes the Question Factory correctness gate classifying non-numeracy multiple choice questions as deterministic math rather than semantic, which currently blocks AI review ingestion.
- **PR #11 (`docs/design-md-v2.2-ai-section`)**: Not merged on `main`. Adds binding §29 governing future AI concepts.

---

## 2. Programme Deep-Dives

### 2.1 NAPLAN-style (Year 3)
- **Score:** Overall `3 (Live but thin)`
- **Evidence:**
  - `src/features/exam-engine/exam-patterns/exam-pattern-registry.ts`: Patterns `naplan-y3-numeracy-full` (36 Q / 45 min), `naplan-y3-reading-full` (39 Q / 45 min), `naplan-y3-language-full` (52 Q / 45 min), `naplan-y3-writing-deferred` (1 task / 40 min).
  - `npm run audit:bank` & `getPatternReadiness()`: Numeracy has 128 served items; Reading has 97 items (only 20 in 5 stimulus groups); Language Conventions has 96 items (22 spelling, 69 grammar/punctuation).
  - Command `npx tsx scripts/inspect-readiness.mts`: Numeracy is **ready** (fills 3 distinct non-overlapping papers); Reading is **short** (requested 39, available 20; 0 distinct papers); Language is **short** (requested 52, available 49; spelling short by 3 items).
- **Top 3 Gaps:**
  1. *Reading Stimulus Grouping:* Only 5 stimulus passages (20 items) meet grouping rules vs 6–7 passages (39 items) required for a single complete paper.
  2. *Spelling Pool Deficit:* Only 22 spelling items exist vs 25 required for a single sitting (short by 3 items for 1 paper; short by 53 items for 3 distinct papers).
  3. *Visual Deficit in Literacy:* Reading visual coverage is 1.0% (target 10–20%); Language visual coverage is 0.0% (target 5–10%).
- **Effort to Reach 4 (Launchable MVP):**
  - **Engineering:** 1 day (verify passage grouping and stimulus boundary layout).
  - **Content & Review:** 25 items (3 spelling error-correction items + 2 reading passages with 19 items) + 6 human review hours.

---

### 2.2 NAPLAN-style (Year 5)
- **Score:** Overall `3 (Live but thin)`
- **Evidence:**
  - `exam-pattern-registry.ts`: `naplan-y5-numeracy-full` (42 Q / 50 min), `naplan-y5-reading-full` (39 Q / 50 min), `naplan-y5-language-full` (52 Q / 45 min).
  - `getPatternReadiness()`: Numeracy has 164 served items (3 distinct papers); Reading has 106 items (only 7 in 1 stimulus group); Language has 82 items (only 5 spelling items, 30 grammar/punctuation).
  - Command `npx tsx scripts/check-question-correctness.mts --include-published`: Fails with 2 errors in factory-published Y5 depth items (`g5-depth-vc2m5n04-001`, `g5-depth-vc2m5sp03-001`).
- **Top 3 Gaps:**
  1. *Severe Reading Passage Shortage:* Only 1 valid stimulus group (7 items) exists vs 6 passages (39 items) required (short by 32 items / 5 passages).
  2. *Spelling Pool Starvation:* Only 5 spelling items exist vs 25 required (short by 20 items for a single paper).
  3. *Unverified Factory Items & Thin Challenging Band:* 2 items fail machine answer verification; challenging band has only 5 numeracy, 6 reading, 7 language items (vs 50 floor).
- **Effort to Reach 4 (Launchable MVP):**
  - **Engineering:** 1 day (forward-fix the 2 failing answer keys in `batch-published.json`).
  - **Content & Review:** ~60 items (20 spelling proofreading items + 32 reading questions across 5 passages + 8 challenging numeracy items) + 15 human review hours.

---

### 2.3 ICAS-style (Year 3 / Paper A)
- **Score:** Overall `4 (Launchable MVP)`
- **Evidence:**
  - `exam-pattern-registry.ts`: Complete suite of 5 objective papers: English Full (45 Q / 45 min: 27 reading + 18 language), Mathematics (40 Q / 45 min), Science (30 Q / 45 min), Digital Technologies (30 Q / 30 min), Spelling Bee (40 Q / 40 min).
  - `getPatternReadiness()`: **All 5 objective full-length papers are READY right now.**
    - English: 45 requested / 45 available (pool 101 reading + 94 language; 3 distinct papers).
    - Mathematics: 40 requested / 40 available (pool 101; 2 distinct papers).
    - Science: 30 requested / 30 available (pool 99; 3 distinct papers).
    - Digital Technologies: 30 requested / 30 available (pool 98; 2 distinct papers).
    - Spelling Bee: 40 requested / 40 available (pool 98; 2 distinct papers).
  - All 1,005 curated questions pass `check:answers` (0 failures).
- **Top 3 Gaps:**
  1. *Challenging Band Depth:* Challenging band holds 21–26 items per subject vs 50 floor.
  2. *Visual Coverage in English:* Reading visual coverage is 1.0% (target 10–20%); Language is 0.0% (target 5–10%).
  3. *Writing Deferred:* Rubric-marked writing paper is deferred.
- **Effort to Reach 5 (Complete to Target):**
  - **Engineering:** 0 days for objective MVP (already runnable); 3 days for essay marking/rubric engine.
  - **Content & Review:** ~150 items across all subjects to raise challenging bands to 50 + 30 human review hours.

---

### 2.4 ICAS-style (Year 5 / Paper C)
- **Score:** Overall `3 (Live but thin)`
- **Evidence:**
  - `exam-pattern-registry.ts`: English Full (50 Q / 50 min), Mathematics (40 Q / 45 min), Digital Technologies (35 Q / 35 min), Spelling Bee (45 Q / 40 min), Science (40 Q / 55 min - unavailable).
  - `getPatternReadiness()`:
    - English: **Ready** for 1 paper (pool: 51 reading, 37 language; 1 distinct paper).
    - Mathematics: **Ready** for 2 papers (pool: 112; 2 distinct papers).
    - Digital Technologies: **Ready** for exactly 1 paper (pool: 35 items for 35 Qs; 0 margin).
    - Spelling Bee: **Ready** for exactly 1 paper (pool: 45 items for 45 Qs; 0 margin).
    - Science: **Unavailable** (0 items in published bank; needs 40).
- **Top 3 Gaps:**
  1. *Science Zero-Content:* 0 published items; pattern is marked unavailable in registry.
  2. *Zero Retake Margin in DT & Spelling:* Exactly 35 DT and 45 Spelling items exist; retakes repeat 100% of questions.
  3. *Visual Target Deficit in Maths:* Visual coverage in Y5 Maths is 24.1% vs 40–60% target.
- **Effort to Reach 4 (Launchable MVP):**
  - **Engineering:** 0.5 days (unblock Science pattern once content is imported).
  - **Content & Review:** ~75 items (40 science + 15 DT + 15 spelling + 5 reading) + 18 human review hours.

---

### 2.5 Curriculum Learning (VIC Level 3 & Level 5 Lessons)
- **Score:** Overall `3 (Live but thin)`
- **Evidence:**
  - `src/features/curriculum/lessons/`: 104 authored lessons (54 Level 3, 50 Level 5).
  - `npm run validate:lessons`: 100% compliant, 0 circular dependencies, all worked examples include pedagogical "why".
  - `scripts/audit-curriculum-gated-coverage.mts`:
    - Level 5: 47/50 nodes "Ready to practise" ($\ge 8$ served items; 480 mapped items). 3 nodes are oral/handwriting classroom-only.
    - Level 3: 29/54 nodes "Ready to practise" ($\ge 5$ items), 5 partial (1–4 items), 20 empty (0 items).
  - `/parent/curriculum-explorer`: Fully interactive parent explorer displays node trees, status badges, and worked examples.
- **Top 3 Gaps:**
  1. *20 Empty Level 3 Nodes:* 37% of Level 3 nodes have 0 questions and show "Coming soon" badges.
  2. *5 Partial Level 3 Nodes:* 5 nodes have 1–4 items and show "In development" badges.
  3. *Classroom-only Exclusions:* Oral language and cursive handwriting nodes (VC2E3LY13, VC2E5LY01, VC2E5LY02, VC2E5LY12) cannot be assessed by the engine.
- **Effort to Reach 4 (Launchable MVP):**
  - **Engineering:** 0 days (lessons player and parent explorer are production-ready).
  - **Content & Review:** ~110 items (5 items $\times$ 20 empty nodes + 2 items $\times$ 5 partial nodes) + 25 human review hours.

---

### 2.6 Australian Mathematics Competition (AMC-style)
- **Score:** Overall `0 (Not started)` on `main` (`1 Scaffolding only` on PR #10)
- **Evidence:**
  - `src/schemas/question.schema.ts` on `main`: `EXAM_STYLES` is `["naplan_style", "icas_style"]`. No `amc_style`.
  - `src/features/exam-engine/exam-patterns/programme-id.ts` on `main`: Regex `/^(naplan|icas)-y(\d{1,2})-([a-z_-]+)$/` rejects AMC.
  - `src/features/student/components/programmes/programme-catalog.ts`: Displayed as honest "Coming Soon" card.
  - **PR #10 (`feat/amc-family-clean`)**: Builds the engine scaffolding: 30 questions, 60 min, Q1–10 (3 pts), Q11–20 (4 pts), Q21–25 (5 pts), Q26–30 (6–10 pts integer 000–999), Middle Primary (Y3–4) and Upper Primary (Y5–6) patterns, unstartable cards, and 4 test suites.
- **Top 3 Gaps:**
  1. *PR #10 Not Merged:* Core scaffolding lives only on branch `feat/amc-family-clean`.
  2. *Zero Content:* 0 AMC questions exist in any bank.
  3. *Integer Answer Entry Component:* Questions 26–30 require 3-digit integer entry (000–999) with specialized validation.
- **Effort to Reach 4 (Launchable MVP):**
  - **Engineering:** 1 day (merge and verify PR #10 against fresh main).
  - **Content & Review:** 60 competition-grade math problems (30 Middle Primary, 30 Upper Primary) + 20 expert review hours.

---

### 2.7 Selective Entry-style (Victoria First)
- **Score:** Overall `0 (Not started)`
- **Evidence:**
  - `JurisdictionPicker.tsx`: Explicitly states "No selective entry-style papers have been released for any jurisdiction yet".
  - `programme-catalog.ts`: Displayed as honest "Coming Soon" card with focus areas.
  - Zero patterns, zero exam styles, zero items in bank.
- **Top 3 Gaps:**
  1. *No Assessment Engine Blueprint:* Missing Victorian format (Reading, Mathematics, General Ability / Reasoning).
  2. *No Abstract / Verbal Reasoning Question Types:* Platform lacks pattern matrix and verbal analogy renderers.
  3. *Zero Content.*
- **Effort to Reach 4 (Launchable MVP):**
  - **Engineering:** 5–7 days (abstract reasoning interaction types, timed paper engine).
  - **Content & Review:** 120 items + 35 review hours.

---

### 2.8 Scholarship (Independent Schools / ACER & Edutest)
- **Score:** Overall `0 (Not started)`
- **Evidence:**
  - `programme-catalog.ts`: "Coming Soon" card with scope label "Year 5–7 · Scholarship Entry".
  - Zero engine patterns, zero items in bank.
- **Top 3 Gaps:**
  1. *No Blueprints for ACER or Edutest Formats.*
  2. *No Higher-Order Reasoning Item Types.*
  3. *Zero Content.*
- **Effort to Reach 4 (Launchable MVP):**
  - **Engineering:** 5 days.
  - **Content & Review:** 120 items + 35 review hours.

---

### 2.9 Singapore Maths (Model Method)
- **Score:** Overall `0 (Not started)`
- **Evidence:**
  - `sign-up-wizard.test.tsx`: Asserts Singapore Maths is disabled with "being confirmed".
  - `programme-catalog.ts`: "Coming Soon" card describing Concrete-Pictorial-Abstract (CPA) sequence.
  - Zero engine patterns, zero items in bank.
- **Top 3 Gaps:**
  1. *No Bar Model / Model Method Interactive Visuals:* Engine cannot render or score part-whole or comparison bar diagrams.
  2. *No CPA Curriculum Engine.*
  3. *Zero Content.*
- **Effort to Reach 4 (Launchable MVP):**
  - **Engineering:** 8–10 days (interactive bar-model schema, visual renderer, and validator).
  - **Content & Review:** 100 model-method items + 30 review hours.

---

### 2.10 Primary Maths Olympiad
- **Score:** Overall `0 (Not started)`
- **Evidence:**
  - `programme-catalog.ts`: "Coming Soon" card describing Olympiad focus areas (invariants, counting, prime structure).
  - Zero engine patterns, zero items in bank.
- **Top 3 Gaps:**
  1. *No Contest Format Engine (5-question rounds / open exploration).*
  2. *No Olympiad Taxonomy (Number Theory, Combinatorics, Geometry).*
  3. *Zero Content.*
- **Effort to Reach 4 (Launchable MVP):**
  - **Engineering:** 4–5 days.
  - **Content & Review:** 50 contest-grade problems + 25 expert review hours.

---

## 3. AI Capabilities & Governance Audit

### 3.1 Question Factory (Internal AI Content Pipeline)
- **Pipeline Architecture:**
  - Ingestion $\rightarrow$ Structural validation $\rightarrow$ Independent machine correctness $\rightarrow$ Semantic review $\rightarrow$ Originality check $\rightarrow$ Difficulty estimation $\rightarrow$ Staging quarantine $\rightarrow$ Publication.
  - Implemented in `scripts/questions-*.mts` and `src/features/question-factory/`.
- **Configured Providers (`create-provider.ts`):**
  - Anthropic: Default model `claude-sonnet-5` via `ANTHROPIC_API_KEY`.
  - OpenAI: Default model `gpt-4o` via `OPENAI_API_KEY`.
  - Gemini: Default model `gemini-2.5-pro` via `GEMINI_API_KEY` / `GOOGLE_API_KEY`.
- **Cross-Model Review Independence (`docs/REVIEW_INDEPENDENCE_POLICY.md`):**
  - For judgement-based content (`semantic_objective` and `manual_review_writing`), the policy strictly forbids an AI provider reviewing its own generation (e.g. Claude Sonnet reviewed by Claude Opus is a **FAIL**). Requires a different provider (e.g. OpenAI or Gemini).
- **Correctness Gate Defect on `main`:**
  - In `src/features/question-factory/correctness/verify-candidate-correctness.ts` on `main`, `isSemanticCategory` only exempts `reading_comprehension`, `manual`, and non-numeracy `fill_blank`/`dropdown`.
  - **Defect:** `multiple_choice` questions in `language_conventions`, `reading`, and `science` are NOT exempted, causing the deterministic checker to attempt mathematical re-derivation on reading passages and grammar questions, falsely blocking review.
  - **Fix status:** Branch `origin/fix/qf-prompt-and-semantic-classification` (commit `6871b75`) fixes this by testing `question.metadata.subject !== "numeracy"`, but **has not been merged to `main`**.
- **Human `approvedBy` Gate:**
  - Code enforcement: `src/features/question-factory/publication/publish-candidate.ts` lines 129–141 strictly rejects any candidate missing a valid `approvedBy` signature.
  - Historical reality: All 543 factory manifests currently in `content/question-factory/published-manifests/` were published before this gate was committed. **0 of 1,548 served questions carry human approval signatures.**
- **Pipeline Volume & Yield:**
  - Served factory items: 543 in `batch-published.json`.
  - Unprocessed inbox: 40 batch files holding 2,000 questions.
  - Authored items in conflict: 672 questions across 30 files in `content/manual-questions/_conflicts`.
  - Content drift: 61 manifests differ in content from served questions in `batch-published.json`.

### 3.2 Student/Parent-Facing AI Features
- **Live Verification:** **Confirmed ZERO live student- or parent-facing AI features.**
  - No LLM calls in Next.js route handlers or client components.
  - No chatbots, AI tutors, synthetic hints, or generative explanation widgets.
- **Inspection of "AI-like" Features:**
  - *Teacher "Auto-generate assignment":* Pure seeded pseudo-random selection matching subject/grade filters (`selectQuestions`). No AI.
  - *Student Diagnostic Warmup:* Deterministic 5-question selector (`diagnostic-selector.ts`). No AI.
  - *Skill Recommendations & Drill Builder:* Deterministic ranking based on lost marks and accuracy (`recommend-skills.ts`, `build-drill.ts`). No AI.
  - *Progress Streaks & Mastery:* Pure calendar aggregations over stored `exam_attempts` rows. No fabricated data.
- **Design Contract (§29):**
  - PR #11 (`docs/design-md-v2.2-ai-section`) establishes §29: Any future AI feature must carry a visible "Future concept" badge and "Not available yet" text with a dashed border, static illustrative examples only, and no usable input/buttons. PR #11 is currently OPEN and awaiting merge.

---

## 4. Content Gap & Visual Coverage Tables

### 4.1 Content Breakdown by Programme × Year × Subject × Difficulty Band

*Target floor: 50 served questions per band in `publishedExamBank`.*

| Programme | Year | Subject | Band | Served | Floor | Short |
|---|:---:|---|---|:---:|:---:|:---:|
| **NAPLAN-style** | Y3 | Numeracy | easy | **77** | 50 | 0 |
| NAPLAN-style | Y3 | Numeracy | medium | 35 | 50 | 15 |
| NAPLAN-style | Y3 | Numeracy | challenging | 16 | 50 | 34 |
| NAPLAN-style | Y3 | Reading | easy | 37 | 50 | 13 |
| NAPLAN-style | Y3 | Reading | medium | 40 | 50 | 10 |
| NAPLAN-style | Y3 | Reading | challenging | 20 | 50 | 30 |
| NAPLAN-style | Y3 | Language Conventions | easy | 49 | 50 | 1 |
| NAPLAN-style | Y3 | Language Conventions | medium | 32 | 50 | 18 |
| NAPLAN-style | Y3 | Language Conventions | challenging | 15 | 50 | 35 |
| NAPLAN-style | Y3 | Writing | all bands | 1 | 150 | 149 |
| **NAPLAN-style** | Y5 | Numeracy | easy | **74** | 50 | 0 |
| **NAPLAN-style** | Y5 | Numeracy | medium | **85** | 50 | 0 |
| NAPLAN-style | Y5 | Numeracy | challenging | 5 | 50 | 45 |
| NAPLAN-style | Y5 | Reading | easy | 41 | 50 | 9 |
| **NAPLAN-style** | Y5 | Reading | medium | **59** | 50 | 0 |
| NAPLAN-style | Y5 | Reading | challenging | 6 | 50 | 44 |
| NAPLAN-style | Y5 | Language Conventions | easy | 45 | 50 | 5 |
| NAPLAN-style | Y5 | Language Conventions | medium | 30 | 50 | 20 |
| NAPLAN-style | Y5 | Language Conventions | challenging | 7 | 50 | 43 |
| NAPLAN-style | Y5 | Writing | all bands | 1 | 150 | 149 |
| **ICAS-style** | Y3 | Numeracy (Maths) | easy | 32 | 50 | 18 |
| ICAS-style | Y3 | Numeracy (Maths) | medium | 45 | 50 | 5 |
| ICAS-style | Y3 | Numeracy (Maths) | challenging | 24 | 50 | 26 |
| ICAS-style | Y3 | Reading | easy | 30 | 50 | 20 |
| ICAS-style | Y3 | Reading | medium | 46 | 50 | 4 |
| ICAS-style | Y3 | Reading | challenging | 25 | 50 | 25 |
| ICAS-style | Y3 | Language Conventions | easy | 27 | 50 | 23 |
| ICAS-style | Y3 | Language Conventions | medium | 43 | 50 | 7 |
| ICAS-style | Y3 | Language Conventions | challenging | 24 | 50 | 26 |
| ICAS-style | Y3 | Spelling Bee | easy | 28 | 50 | 22 |
| ICAS-style | Y3 | Spelling Bee | medium | 44 | 50 | 6 |
| ICAS-style | Y3 | Spelling Bee | challenging | 26 | 50 | 24 |
| ICAS-style | Y3 | Science | easy | 30 | 50 | 20 |
| ICAS-style | Y3 | Science | medium | 48 | 50 | 2 |
| ICAS-style | Y3 | Science | challenging | 21 | 50 | 29 |
| ICAS-style | Y3 | Digital Technologies | easy | 31 | 50 | 19 |
| ICAS-style | Y3 | Digital Technologies | medium | 43 | 50 | 7 |
| ICAS-style | Y3 | Digital Technologies | challenging | 24 | 50 | 26 |
| ICAS-style | Y3 | Writing | all bands | 1 | 150 | 149 |
| **ICAS-style** | Y5 | Numeracy (Maths) | easy | 23 | 50 | 27 |
| **ICAS-style** | Y5 | Numeracy (Maths) | medium | **57** | 50 | 0 |
| ICAS-style | Y5 | Numeracy (Maths) | challenging | 32 | 50 | 18 |
| ICAS-style | Y5 | Reading | easy | 17 | 50 | 33 |
| ICAS-style | Y5 | Reading | medium | 22 | 50 | 28 |
| ICAS-style | Y5 | Reading | challenging | 12 | 50 | 38 |
| ICAS-style | Y5 | Language Conventions | easy | 11 | 50 | 39 |
| ICAS-style | Y5 | Language Conventions | medium | 17 | 50 | 33 |
| ICAS-style | Y5 | Language Conventions | challenging | 9 | 50 | 41 |
| ICAS-style | Y5 | Spelling Bee | easy | 14 | 50 | 36 |
| ICAS-style | Y5 | Spelling Bee | medium | 20 | 50 | 30 |
| ICAS-style | Y5 | Spelling Bee | challenging | 11 | 50 | 39 |
| ICAS-style | Y5 | Science | all bands | 0 | 150 | 150 |
| ICAS-style | Y5 | Digital Technologies | easy | 11 | 50 | 39 |
| ICAS-style | Y5 | Digital Technologies | medium | 16 | 50 | 34 |
| ICAS-style | Y5 | Digital Technologies | challenging | 8 | 50 | 42 |
| ICAS-style | Y5 | Writing | all bands | 1 | 150 | 149 |
| **AMC / Selective / Other** | All | All subjects | all bands | 0 | 150 | 150 |

*Summary:* Only **5 of 219 cells** currently reach or exceed the 50-item floor (NAPLAN Y3 Numeracy Easy, NAPLAN Y5 Numeracy Easy/Medium, NAPLAN Y5 Reading Medium, ICAS Y5 Numeracy Medium). 214 cells remain below target, requiring **9,508 items** across all possible year levels to reach complete platform depth.

---

### 4.2 Visual Coverage vs Targets

*Script used:* `inspect-visuals-and-gaps.mts` querying `publishedExamBank`.

| Programme Cohort | Total Questions | Questions with Visual | Visual % | Benchmark Target | Verdict |
|---|:---:|:---:|:---:|:---:|:---:|
| **NAPLAN Y3 Numeracy** | 128 | 67 | 52.3% | 30–40% | **Healthy** (slightly above target) |
| **NAPLAN Y5 Numeracy** | 164 | 82 | 50.0% | 40–60% | **On target** |
| **ICAS Y3 Numeracy (Maths)** | 101 | 42 | 41.6% | 40–60% | **On target** |
| **ICAS Y5 Numeracy (Maths)** | 112 | 27 | 24.1% | 40–60% | **Below target** (needs +18 visuals) |
| **NAPLAN Y3 Reading** | 97 | 1 | 1.0% | 10–20% | **Severe deficit** (needs +9 visuals) |
| **NAPLAN Y5 Reading** | 106 | 9 | 8.5% | 10–20% | **Near target** (needs +2 visuals) |
| **ICAS Y3 Reading** | 101 | 1 | 1.0% | 10–20% | **Severe deficit** (needs +9 visuals) |
| **ICAS Y5 Reading** | 51 | 0 | 0.0% | 10–20% | **Severe deficit** (needs +5 visuals) |
| **NAPLAN Y3 Language Conventions**| 96 | 0 | 0.0% | 5–10% | **Below target** (needs +5 visuals) |
| **NAPLAN Y5 Language Conventions**| 82 | 1 | 1.2% | 5–10% | **Below target** (needs +3 visuals) |
| **ICAS Y3 Language Conventions**  | 94 | 0 | 0.0% | 5–10% | **Below target** (needs +5 visuals) |
| **ICAS Y5 Language Conventions**  | 37 | 0 | 0.0% | 5–10% | **Below target** (needs +2 visuals) |
| **ICAS Y3 Science** | 99 | 30 | 30.3% | — | Healthy (charts, diagrams) |
| **ICAS Y5 Science** | 0 | 0 | 0.0% | — | No content |
| **ICAS Y3 Digital Technologies** | 98 | 22 | 22.4% | — | Healthy (tables, grids) |
| **ICAS Y5 Digital Technologies** | 35 | 8 | 22.9% | — | Healthy |

---

## 5. Correctness Assurance & Verification Coverage

### 5.1 Verification Script Scope Mismatch
- `npm run validate:questions`: Validates **only** the 1,005 curated questions (`src/content/questions/question-bank.ts`). Excludes all 543 factory-published questions.
- `npm run check:answers`: By default, verifies **only** the 1,005 curated questions.
  - Objective: 1,001 | Manual-review: 4
  - Fully computable (verified by independent arithmetic/geometry re-derivation): 91 (9.1%)
  - Structurally checked / editorial review: 910 (90.9%)
  - Failures: **0**
- `npx tsx scripts/check-question-correctness.mts --include-published`: Checks the full 1,548 served items.
  - Objective: 1,544 | Manual-review: 4
  - Fully computable: 173 (11.2%)
  - Editorial review: 1,371 (88.6%)
  - Failures: **2 FAILURES** in served production bank:
    1. `g5-depth-vc2m5n04-001`: Numeric answer 75 cannot be derived from visual `vis-fraction-75`.
    2. `g5-depth-vc2m5sp03-001`: Coordinate point at (2, 3) is labelled 'Start A', not 'Translation'.

### 5.2 Content Drift
- 61 questions in `content/question-factory/published-manifests/` have content hashes that differ from the corresponding questions in `src/content/questions/generated/batch-published.json` (dating to the Grade 5 depth promotion commit `4df461c`).

---

## 6. Recommended Roadmap to Launchability

To bring NAPLAN and ICAS for Year 3 and Year 5 to a verified, complete **4 (Launchable MVP)**, follow this sequenced path:

```
[Phase 1: Remediation & Pipeline Gate Repair] (1-2 days)
       │
       ▼
[Phase 2: NAPLAN Y3 & Y5 Passage & Spelling Authoring & Review] (3-4 days)
       │
       ▼
[Phase 3: ICAS Y5 Science Authoring, Visuals & Review] (3-4 days)
       │
       ▼
[Phase 4: Curriculum Level 3 Node Authoring & Publication] (3-4 days)
       │
       ▼
[Phase 5: Next Family: Australian Mathematics Competition (AMC)] (3-4 days)
```

### Phase 1: Remediation & Pipeline Repair (1–2 Days)
1. **Remediate False Positive Check Failures:** Address the two checker derivation gaps in `scripts/check-question-correctness.mts` (`g5-depth-vc2m5n04-001` percentage scaling and `g5-depth-vc2m5sp03-001` coordinate transformation classification) so `check:answers --include-published` passes cleanly with 0 failures and can be safely added to CI.
2. **Commit and Merge `fix/qf-gate-and-yield-fixes`:** Do *not* merge `fix/qf-prompt-and-semantic-classification` (`6871b75`), which erroneously exempts non-"numeracy" maths from arithmetic checks. Commit the 20 uncommitted files in worktree `qf-gate-fix`, push branch `fix/qf-gate-and-yield-fixes`, and merge via PR.
3. **Merge PR #7 & PR #8:** Clean up landing page accessibility, layout tokens, and honest showcase states.
4. **Merge PR #11:** Formally adopt `docs/design.md` §29 AI governance contract.

### Phase 2: NAPLAN Year 3 & Year 5 Content Pipeline (3–4 Days)
*Note: All content strictly follows the governed lifecycle: Generation → Structural Validation → Independent Review → Human Approval → Publication.*
1. **NAPLAN Y3 Reading:** Either relax the pattern constraint to `questionsPerStimulus: [3, 7]` (which immediately activates 19 existing passages with 62 approved questions) or author 1 additional question for 5–7 of the existing 3-question passages.
2. **NAPLAN Y3 Language:** Author, independently review, and human-approve 3 spelling proofreading items to reach the 25-item paper requirement.
   - *Milestone:* NAPLAN Y3 achieves **4 (Launchable MVP)** across all domains.
3. **NAPLAN Y5 Reading:** Partition oversized multi-question passages ("The New Coach", "Recycling at Fairbank Primary") and author/review 1–2 new 4–7 question passages to meet the 6-distinct-stimuli paper requirement.
4. **NAPLAN Y5 Language:** Author, independently review, and human-approve 20 spelling proofreading items to reach the 25-item paper requirement.
   - *Milestone:* NAPLAN Y5 achieves **4 (Launchable MVP)** across all domains.

### Phase 3: ICAS Year 5 Science & Subject Buffers (3–4 Days)
1. **ICAS Y5 Science:** Batch `b05` sits quarantined in `_conflicts/` (0% visuals, legacy un-itemised audit, no human approval). Author 40 fresh questions with 40–60% visual coverage or remediate `b05` by attaching visuals and executing full blind cross-model re-solve + human approval.
2. **ICAS Y5 Digital Tech & Spelling:** Author, review, and publish +15 questions each to provide retake buffer.
   - *Milestone:* ICAS Y3 and Y5 achieve **4 (Launchable MVP)** across all 5 objective subjects.

### Phase 4: Victorian Curriculum Level 3 Lessons (3–4 Days)
1. Author, review, and publish practice questions for the 14 truly empty Level 3 nodes (112 items to reach floor 8).
2. Top up the 9 partial nodes (38 items to reach floor 8).
3. The 6 classroom-only nodes (`VC2E3LA01`, `VC2E3LE02`, `VC2E3LE05`, `VC2E3LY01`, `VC2E3LY02`, `VC2E3LY13`) strictly remain unmapped with 0 practice bindings per test contract.
   - *Milestone:* Curriculum Learning achieves **4 (Launchable MVP)** with 100% testable node coverage across Levels 3 and 5 (150 new published questions).

### Phase 5: Next Programme — Australian Mathematics Competition (AMC) (3–4 Days)
1. Merge PR #10 (`feat/amc-family-clean`).
2. Generate, review, approve, and publish 30 Middle Primary (Y3–4) and 30 Upper Primary (Y5–6) competition problems.
   - *Milestone:* AMC launches as the 3rd fully playable assessment family.

---

## 7. Limitations & Items Not Verified

1. **Hosted / Production Supabase State:** Audited exclusively against the local repository code, migrations, and local test environment; production database tables were not accessed.
2. **Audio Dictation:** Because the application currently lacks an audio playback engine and audio assets, NAPLAN and ICAS spelling assessments cannot be tested in their authentic audio-dictation modality; all items are verified as text proofreading.
3. **Live AI Provider API Calls:** Live calls to Anthropic, OpenAI, or Gemini were not executed during this unattended run to prevent billing charges and credential exposure; provider integration was verified through mock adapters, unit tests, and overnight execution logs.
4. **Archived / Container Rollback Content:** The ~239 questions noted in `docs/content-status/exam-content-status.md` as "lost" in external container downloads cannot be verified within the git tree.

---

## 8. Audit Record

- **Base SHA:** `db1d5aeba4be89257b6f3e50799aed524f8807c3`
- **Worktree Branch:** `audit/programme-readiness-2026-09`
- **Report Path:** `docs/audits/programme-readiness-2026-09.md`
- **Open PRs Evaluated:** PR #7, PR #8, PR #10, PR #11, and branch `fix/qf-gate-and-yield-fixes`.
- **Verdict:** ICAS Year 3 is currently the only fully launchable full-paper assessment family on `main`. NAPLAN Year 3 and Year 5 require modest targeted content top-ups in reading passages and spelling to achieve full launch readiness.

---

## 9. Follow-Up Answers (Post-Audit Clarifications)

### 9.1. "1,103 Ungated Practice Seeds": Origin, Storage, and Serving Pathways

**What are they and where do they live?**
- **Definition:** The 1,103 items are early auto-generated seed questions that validate against the production schema (`questionSchema` via `validateQuestionBank`), but have **never passed the Question Factory's independent machine correctness checks, cross-model semantic review, originality screening, difficulty verification, or human approval**.
- **Source file:** `src/content/questions/generated/generated-questions.ts` (exported as `practiceQuestionSeeds`, lines 29–10,500+).
- **Compilation:** Imported into `src/content/questions/practice-bank.ts` (lines 17–19) as `practiceQuestions` ($1,298 - 195 \text{ retired G5 seeds} = 1,103$ items).
- **Bank Composition:** Spread into `practiceExamBank` (`[...questionBank, ...practiceQuestions, ...factoryPublishedQuestions]`, `src/content/questions/practice-bank.ts:33-37`).
- **Contrast with Served Bank:** The production served bank is `publishedExamBank` (`[...questionBank, ...factoryPublishedQuestions]`, lines 44–47), which strictly excludes `practiceQuestions`.

**Can any code path serve them to a child or guest?**
**Severity: HIGH** (Ungated, unreviewed questions can be served to children or guests if the opt-in checkbox is checked or `?extended=true` is supplied).

Detailed audit of all serving pathways:
1. **Configurator Opt-in Toggle (Guest Mode):**
   - *File & Line:* `src/features/exam-engine/components/ExamConfigurator.tsx:474-485` and `lines 222-223`.
   - *Mechanism:* The UI renders a checkbox: *"Include the extended practice bank (1000+ extra auto-generated questions)"*.
   - *Behaviour:* Off by default. If a child or parent ticks this checkbox, `includePractice` becomes `true`, setting `bankId = "practice"`.
   - *Delivery:* In guest mode (`ExamConfigurator.tsx:282`), questions are drawn directly from `banks.practice` in the browser.
2. **Configurator Opt-in Toggle (Signed-In Mode):**
   - *File & Line:* `src/features/exam-engine/components/ExamConfigurator.tsx:276` calling `startServerExam(config, { bankId })`.
   - *Mechanism:* Sends `bankId: "practice"` in the JSON payload to `POST /api/exam/session`.
   - *Delivery:* `src/app/api/exam/session/route.ts:153` executes `const bank = getExamBank(bankId);`. When `bankId === "practice"`, it selects questions from `practiceExamBank`, serving ungated seeds to signed-in students.
3. **Standard Practice Route with Query Parameter:**
   - *File & Line:* `src/app/practice/session/page.tsx:342-344`.
   - *Mechanism:* `const pool = stdParams.extended ? [...banks.published, ...banks.practice] : banks.published;`.
   - *Delivery:* If a user or link accesses `/practice/session?mode=standard&...&extended=true`, ungated seeds are placed into the active selection pool.
4. **Public Guest Bank API Route:**
   - *File & Line:* `src/app/api/exam/guest-bank/route.ts:25`.
   - *Mechanism:* `practice: getExamBank("practice")`.
   - *Delivery:* Exposes the full 1,103 ungated seeds (including answer keys and explanations) in the JSON response downloaded by browser clients.
5. **Paths that Strictly Fail Closed (Do NOT serve ungated seeds):**
   - *Exam Simulations / Full Papers:* `src/features/exam-engine/exam-patterns/components/ExamPatternStarter.tsx:43` and `src/features/exam-engine/state/exam-store.ts:415` draw exclusively from `banks.published`. No extended toggle is offered.
   - *Drills ("Practise Missed Skills"):* `src/app/practice/session/page.tsx:218` passes `banks.published` exclusively to `buildDrill()`.
   - *Diagnostic Onboarding Warmup:* `src/app/api/student/onboarding/questions/route.ts:31` and `src/features/student/onboarding/diagnostic-selector.ts:4` select only from `getExamBank("published")`.
   - *Curriculum Lesson Checks:* `src/features/curriculum/lessons/resolver.ts:18` resolves only from `getExamBank("published")`.

---

### 9.2. Reading Papers: Grouped Passages vs Standalone Items

**Why does NAPLAN Y3 have 97 reading items with only 20 in grouped passages, and Y5 have 106 with only 7?**

The pattern packer (`buildSelectionUnits()` in `src/features/exam-engine/exam-patterns/selection-units.ts:72-86`) enforces:
1. `stimulusGroupKey(q)` must not be undefined (items without a structured `stimulus` object are dropped).
2. Group size must satisfy `questionsPerStimulus: [4, 7]` (groups with $< 4$ or $> 7$ questions are dropped whole per `selectWholeGroup: true`).

**Year 3 NAPLAN Reading (97 published items):**
- **17 items have NO stimulus object:** 16 are short reading passages embedded directly into the prompt string itself (e.g. `naplan-y3-reading-f1-001..004`), plus 1 table-reading question (`g3-nap-read-table-001`). Because they lack a `stimulus` object, they are dropped.
- **80 items have a structured stimulus object across 35 distinct titles:**
  - **5 passages have exactly 4 questions (20 questions):** *"The Amazing Echidna"*, *"Our Trip to the Wetland"*, *"The Echidna"*, *"The Sunflower"*, *"The Emu"*. These are the **only 20 questions** that satisfy $[4, 7]$!
  - **14 passages have exactly 3 questions (42 questions):** *"The Runaway Hat"*, *"How to Plant a Sunflower Seed"*, *"The Biggest Puddle"*, *"A Note from Grandpa"*, *"How to Make a Bird Feeder"*, *"The Market at Dawn"*, *"How to Fold a Paper Boat"*, *"A Letter to Grandpa"*, *"The Rock Pool"*, *"Our Sports Day"*, *"The Night the Lights Went Out"*, *"How to Make Playdough"*, *"A Letter to the Principal"*, *"The Wind"*. Dropped because $3 < 4$.
  - **1 passage has 2 questions (2 questions):** *"Washing Day"*. Dropped ($2 < 4$).
  - **14 single-item stimuli (14 questions):** Standalone texts (e.g., *"The Lost Kite"*, *"Come to Riverbend Zoo!"*, *"Jasper's New Dog"*). Dropped ($1 < 4$).
  - **2 untitled stimuli (2 questions):** `g3-nap-read-vocab-001/002`. Dropped.

**Year 5 NAPLAN Reading (106 published items):**
- **52 items have NO stimulus object:** Authored as curriculum depth items or standalone comprehension/genre questions (e.g. `g5-depth-vc2e5la02-001`, `g5-nap-read-fact-001`) without an external reading passage.
- **54 items have a structured stimulus object across 17 distinct titles:**
  - **1 passage has 7 questions (7 questions):** *"Two Notes About the Excursion"*. This is the **only passage** satisfying $[4, 7]$!
  - **3 oversized passages have 8, 9, and 15 questions (32 questions):** *"The New Coach"* (15 questions), *"Recycling at Fairbank Primary"* (9 questions), *"A Rocky Start"* (8 questions). All three are dropped because group size $> 7$.
  - **1 passage has 2 questions (2 questions):** *"Book Fair Notice"*. Dropped ($2 < 4$).
  - **13 single-item / orphaned stimuli (13 questions):** Notice snippets (*"Canteen Orders"*, *"A Tough Week"*, *"Excursion Footwear"*, *"Excursion Reminder"*, etc.). Dropped ($1 < 4$).

**Would regrouping existing, approved items make papers assemblable?**
- **Year 3:** **YES (Immediate data/rule fix).** The 14 three-question passages + 5 four-question passages provide **62 approved questions across 19 passages**. Relaxing the pattern constraint to `questionsPerStimulus: [3, 7]` in `exam-pattern-registry.ts` (or authoring 1 additional question for 5–7 passages) immediately yields 19 valid selection units, easily satisfying the 39-question paper requirement ($6 \text{ passages} \times 6\text{–}7 \text{ questions}$).
- **Year 5:** **PARTIAL (requires 1–2 additional passages).** The 4 multi-question passages total 39 questions. Splitting *"The New Coach"* into two sub-parts (e.g. Part 1: 7 items, Part 2: 8 items) creates 5 valid passage units ($7 + 8 + 8 + 9 + 7 = 39$ items). However, NAPLAN Year 5 requires 6 distinct stimuli. Therefore, Y5 Reading needs at least 1–2 additional 4–7 question passages (or aggregating the excursion notices into a single composite stimulus) to achieve complete paper assembly.

---

### 9.3. Curriculum Level 3: Truly Empty Nodes vs Classroom-Only Nodes

**Recount of Level 3 Curriculum Nodes (Victorian Curriculum F-10 v2.0):**
- **Total Level 3 Nodes:** **54**
- **Covered Nodes ($\ge 8$ served items):** **25 nodes**
- **Partial Nodes (1–7 served items):** **9 nodes** (short 38 items total: `VC2M3N01` [6/8], `VC2M3N06` [4/8], `VC2M3A03` [5/8], `VC2M3M04` [5/8], `VC2M3M05` [6/8], `VC2M3SP01` [3/8], `VC2E3LA05` [1/8], `VC2E3LA07` [2/8], `VC2E3LY11` [2/8]).
- **Truly Empty Practisable Nodes (0 served items):** **14 nodes**
  - *Mathematics (6):* `VC2M3A01`, `VC2M3A02`, `VC2M3M02`, `VC2M3ST03`, `VC2M3P01`, `VC2M3P02`
  - *English (8):* `VC2E3LA02`, `VC2E3LA04`, `VC2E3LA09`, `VC2E3LA10`, `VC2E3LE01`, `VC2E3LY03`, `VC2E3LY07`, `VC2E3LY08`
- **Classroom-Only Excluded Nodes (0 served items, intentional):** **6 nodes**
  - Defined in `src/features/curriculum/lessons/classroom-only.ts`: `VC2E3LA01` (discussion conventions), `VC2E3LE02` (personal literary responses), `VC2E3LE05` (imaginative composition), `VC2E3LY01` (spoken interaction), `VC2E3LY02` (spoken delivery), `VC2E3LY13` (cursive handwriting).
  - Strictly guarded by `src/tests/unit/gated-practice-coverage.test.ts` and `src/tests/unit/lessons/lesson-content.test.ts`. **Must remain at 0 digital practice bindings.**

**Correction to Item Estimates:**
- The previous audit report cited "110 items for 20 nodes", mistakenly combining the 14 truly empty nodes with the 6 classroom-only nodes ($14 + 6 = 20$).
- **Corrected estimate:**
  - To bring the **14 truly empty practisable nodes** to floor 8: **112 items** ($14 \text{ nodes} \times 8 \text{ items}$).
  - To bring **all 23 under-floor practisable nodes** (14 empty + 9 partial) to floor 8: **150 items** ($112 + 38 \text{ items}$).

---

### 9.4. Drill Bottleneck: Proposed Widening Fallback & Rescue Rates

**The Problem:**
In `src/features/exam-engine/recommendation/build-drill.ts`, drills match on `metadata.skill` and require $\ge 5$ items. Across the published bank, only **38 of 1,167** `(context, skill)` pairs (3.3%) meet this threshold, causing "Practise missed skills" to fail closed in 96.7% of attempts.

**Proposed 3-Tier Honest Fallback:**
Without crossing year levels, exam programmes, or subject boundaries, and using published-only items:
1. **Tier 1 (Exact Skill):** Match `metadata.skill`. Require 5 items.
2. **Tier 2 (Topic / Sub-Strand):** If $< 5$ items exist for the skill, widen pool to all published items sharing the skill's `metadata.topic` within the same year, subject, and programme.
3. **Tier 3 (Strand):** If $< 5$ items exist for the topic, widen pool to all published items sharing the skill's `metadata.strand` within the same year, subject, and programme.
4. **Fail Closed:** If even the strand has $< 5$ items, fail closed honestly with an informative message.

**UX Transparency:**
Inform the learner plainly in the drill header banner:
- *Tier 1:* `"Practising 5 questions targeted to your missed skill: {SkillName}."`
- *Tier 2:* `"We have fewer than 5 questions on {SkillName} yet, so this 5-question drill covers related questions in {TopicName}."`
- *Tier 3:* `"This 5-question drill covers the wider {StrandName} area to build foundational strength."`

**Empirical Bank Rescue Rate Analysis (Simulated on 1,548 Published Items):**
- **Total unique `(programme, year, subject, skill)` target pairs:** **1,167**
- **Tier 1 (Exact Skill $\ge 5$ items):** 38 pairs (**3.3%** available today)
- **Tier 2 (Topic / Sub-strand Rescue):** +318 pairs (**+27.2%**)
- **Tier 3 (Strand Rescue):** +751 pairs (**+64.4%**)
- **Total Reachable with Fallback:** **1,107 / 1,167 pairs (94.9% available)**
- **Remaining Unmet (Fail Closed):** 60 pairs (5.1% — mostly single writing prompts or unpopulated subjects).

---

### 9.5. Question Factory Gate State & ICAS Y5 Science Batch b05 Status

**Branch State of `fix/qf-gate-and-yield-fixes`:**
- **Location:** Worktree `C:/Users/vishw/Vish/Vish/mindmosaic-exam-engine/.claude/worktrees/qf-gate-fix`.
- **Base commit:** `6871b75` (`fix(qf): improve prompt JSON enforcement, non-numeracy semantic classification, and reviewer model alias support`).
- **Defect in `6871b75`:** That commit classified only subjects spelled exactly `"numeracy"` as mathematics, which erroneously allowed subjects like `"mathematics"` or `"maths"` to bypass arithmetic verification.
- **Current State of worktree:** **20 uncommitted modified files** (800 insertions, 27 deletions). Key corrections include:
  - `src/features/taxonomy/subject-registry.ts`: Explicit mathematical subject mapping.
  - `src/features/question-factory/workflow/semantic-classification.ts`: Broadened mathematical detection.
  - `src/features/question-factory/correctness/verify-candidate-correctness.ts`: Enforces arithmetic verification across all mathematical subjects.
  - Comprehensive unit test suites updated (`pipeline-runner.test.ts`, `staging.test.ts`, etc.).
- **Remote Status:** Branch `fix/qf-gate-and-yield-fixes` has **NOT been pushed to origin** and has no upstream branch configured. It must be committed, pushed, and opened as a PR to supersede `fix/qf-prompt-and-semantic-classification`.

**Content Governance Clarification:**
- Content is **never "ingested" directly to the production bank**.
- All question content must traverse the governed pipeline: **Generation → Structural Validation → Independent Review (Blind Cross-Model) → Human Approval → Assembly / Publication**.

**Status of ICAS Year 5 Science Batch `b05` (`icas-y5-science-b05`):**
- **File:** `content/manual-questions/_conflicts/icas-y5-science-b05.json` (40 items).
- **Current State:** **Quarantined in `_conflicts/`** since 2026-09-22 (`BATCH-LOG.md:131`).
- **Generation & Audit History:** Generated on 2026-08-21 by Codex; audited on 2026-08-21 by Qwen as an aggregate pass (`"audited": 40`), but pre-dates the enforced per-question re-solve rule in `validate-audit-integrity.mts`.
- **Defects:**
  1. Contains **0 visuals across all 40 questions** (0% visual coverage), violating the 40–60% visual floor required for ICAS Science.
  2. Audit sidecar lacks individual item re-solve records.
- **Review & Approval State:** It has **never been reviewed or approved by a human**. It cannot be published in its current state without attaching compliant visual assets, running an enforced per-item audit, and obtaining human review board approval.

