# Independent School Scholarship Practice (Edutest-style & ACER-compatible) — Family Scoping & Architecture Specification, Phase 0

**Status:** Investigation and specification only. **No code, schema, migration, taxonomy, or content changes have been made in this phase.**  
**Document author:** Antigravity (Google DeepMind agentic assistant)  
**Baseline date:** 13 October 2026  
**Target sitting date:** Saturday 13 February 2027 (Huntingtower 2028-entry scholarship examination, administered by Edutest)  
**Target usable practice milestone:** Mid-December 2026 (~9 weeks from baseline)  
**Git worktree:** Dedicated worktree at `C:/Users/vishw/Vish/Vish/.worktrees/scholarship-family-spec` on branch `docs/scholarship-family-spec`, branched from `origin/dev` at commit `aea1fcc2`. The primary checkout is completely untouched.

---

## 0. Copyright and Provider Naming — Non-Negotiable

Independent school scholarship test papers, examination questions, and practice tests are proprietary and copyrighted by their respective testing authorities: **Edutest Pty Ltd** and the **Australian Council for Educational Research Ltd (ACER)**. Commercial preparation books (such as those published by Spectrum Tuition, Five Senses Education, Hendersons Educational Services, or Exam Success) are similarly protected by copyright.

MindMosaic must produce **strictly original, scholarship-style practice** only:

1. **Zero ingestion or imitation:** Never ingest, store, reproduce, scrape, paraphrase, or imitate any past Edutest examination paper, ACER examination paper, official sample question, or commercial preparation workbook item.
2. **Strict prompt and rubric hygiene:** No prompt, generation instruction, system instruction, validation script, or review rubric in MindMosaic's content pipeline may reference, quote, upload, or direct an AI model to replicate or imitate specific real Edutest or ACER questions.
3. **Factual format boundaries only:** MindMosaic's design is strictly grounded in publicly disclosed structural facts published directly on provider and school websites: section titles, duration, broad reasoning domains, and public assessment criteria.
4. **Engineering assumptions for unreleased metrics:** Exact item counts per test section are not published by Edutest. MindMosaic **does not** infer item counts from leaked materials or proprietary tutoring papers. All section item counts in this specification are explicitly labelled as **engineering assumptions**, realistically calibrated to published 30-minute test limits.
5. **Origin tracking:** Every scholarship item authored for MindMosaic must carry `origin: "ai_generated"` (or `"human_authored"` / `"original_seed"`) and must pass the platform's independent content governance gates.
6. **Provider naming and trademark disclaimer:**
   - *Trademark context:* "Edutest" is a registered trademark of Edutest Pty Ltd (ACN 089 970 034). "ACER" is a registered trademark of the Australian Council for Educational Research Ltd.
   - *Legal principle (Australian law):* Under the *Trade Marks Act 1995* (Cth) s 122(1)(b), using a registered trademark in good faith to indicate the intended purpose, compatibility, or style of educational services is permitted provided it does not suggest sponsorship, affiliation, or endorsement.
   - *User-facing naming recommendation:* Use **"Scholarship-style practice (Edutest-style)"** for the primary track, paired with a mandatory, prominent disclaimer on the catalogue tile, onboarding modal, and test start screen:
     > *"MindMosaic scholarship practice is an original, independent educational preparation resource. It is not affiliated with, approved by, or endorsed by Edutest Pty Ltd, the Australian Council for Educational Research (ACER), or Huntingtower School."*
   - *Neutral fallback:* If the product owner prefers zero trademark exposure in marketing headers, use the neutral descriptor: **"Independent School Scholarship Practice (Format E)"** (with Format A reserved for ACER), while retaining the style notes in the syllabus description.

---

## 1. Why and When — The Huntingtower 2028 Target

### 1.1 The Learner Target
The student is currently in **Year 5** (as of October 2026) and will sit scholarship examinations early in **Year 6** (February 2027) competing for **Year 7 entry in 2028**. The primary target institution is **Huntingtower School** (Mount Waverley, Victoria), alongside peer Victorian independent schools.

### 1.2 Public Test Facts (Verified and Cited)
- **School & Test Date:** Huntingtower's official scholarship portal explicitly states that its 2028-entry scholarship examination will be held on **Saturday 13 February 2027**. Applications open Monday 9 November 2026 and close Wednesday 3 February 2027.  
  *Citation:* [Huntingtower School Scholarships](https://www.huntingtower.vic.edu.au/enrolment/scholarships).
- **Test Administrator:** The examination is conducted on behalf of Huntingtower by **Edutest Pty Ltd**.  
  *Citation:* [Edutest Parents Information](https://www.edutest.com.au/parents/).

### 1.3 Timeline Constraints
- **Today's Date:** 13 October 2026.
- **Time to Examination:** 17 weeks and 4 days (123 days).
- **Target Usable Practice Milestone:** **Mid-December 2026** (~9 weeks from baseline).
- **Rationale:** The child completes Year 5 in December 2026. The 6-week summer holiday period (mid-December 2026 to late January 2027) is the critical window for focused practice without the competing fatigue of regular school terms. The practice engine must deliver genuine educational value before this holiday begins.

### 1.4 Multi-Provider Architecture (Edutest & ACER Shared Foundations)
While Huntingtower uses Edutest, numerous other Victorian independent schools (e.g. Haileybury, Scotch College, St Kevin's, Fintona) utilise the **ACER Scholarship Tests**.
- ACER Secondary Level 1 (Year 7 entry) tests **Written Expression**, **Humanities** (Reading & Comprehension), and **Mathematics**.
- ACER Primary Level (entry into Years 4–6) tests **Reading and Viewing**, **Mathematics**, and **Writing**.  
  *Citation:* [ACER Scholarship Tests Information](https://www.acer.org/au/scholarship).

The scholarship track must therefore be architected with reusable, shared skill primitives. The core mathematical reasoning, text comprehension, and writing rubrics established for Edutest must be directly reusable when ACER-style paper patterns are introduced later.

---

## 2. Public Format Facts & Test Section Overview

The following section definitions are compiled directly from the official provider public portals.

### 2.1 Edutest Format (Verified Public Facts)
*Source:* Edutest Parents Information portal (`https://www.edutest.com.au/parents/`).

| Test Section | Published Timing | Published Format | Published Skills & Scope |
|---|---|---|---|
| **Verbal Reasoning** | 30 minutes | Multiple choice | Capacity to think, reason, and solve problems with language: vocabulary, word relationships, classification, deduction. |
| **Numerical Reasoning** | 30 minutes | Multiple choice | Logical mathematical reasoning: number and letter series, matrices, arithmetical reasoning, deduction. |
| **Reading Comprehension** | 30 minutes | Multiple choice | Capacity to read and interpret meaning from written passages, correct sentences, punctuation, and contextual interpretation. |
| **Mathematics** | 30 minutes | Multiple choice | Curriculum-aligned mathematical knowledge: numbers, measurement, algebra, space, and data interpretation. |
| **Written Expression** | 15 minutes | Open-ended written response (no planning time) | Assessed on 6 public criteria: **punctuation, creativity, construction, grammar, spelling, and relevance** across diverse text types. |

### 2.2 ACER Format (Verified Public Facts)
*Source:* ACER Scholarship Tests portal (`https://www.acer.org/au/scholarship`).

- **Primary Level (Level P — Entry into Years 4, 5, or 6):** Reading and Viewing (multiple choice), Mathematics (multiple choice), and Writing (open-ended).
- **Secondary Level 1 (Entry into Year 7):** Written Expression (extended open-ended tasks), Humanities (multiple-choice comprehension of literary, historical, and scientific texts), and Mathematics (multiple choice).

### 2.3 Sizing Assumptions for Practice Papers (Transparent Engineering Models)
Because exact item counts per 30-minute section are not published, MindMosaic establishes the following evidence-based assumptions, calibrated to realistic pacing for Year 6 high-ability students:

| Section | Published Time | Pacing Rationale | Assumed Question Count | Assumed Seconds / Item |
|---|---|---|---|---|
| **Verbal Reasoning** | 30 min (1,800 s) | Rapid lexical and logical retrieval | **45 items** | 40.0 s |
| **Numerical Reasoning** | 30 min (1,800 s) | Multi-step pattern recognition & calculation | **40 items** | 45.0 s |
| **Reading Comprehension** | 30 min (1,800 s) | 4–5 stimulus passages (~300–450 words each) + questions | **35 items** (4 passages) | ~51.4 s (inc. reading) |
| **Mathematics** | 30 min (1,800 s) | Syllabus computation and worded problem solving | **40 items** | 45.0 s |
| **Written Expression** | 15 min (900 s) | Strict prompt writing; rapid ideation & execution | **1 prompt** | 900 s |

---

## 3. Current-State Codebase Investigation (Read-Only)

All findings below reflect the state of `origin/dev` at commit `aea1fcc2`. Exact path:line citations are provided.

### 3.1 The "Coming Soon" Catalogue Drift
A "Coming Soon" card for scholarship preparation already exists in the student UI, but the platform catalogue and routing are out of sync:
- **Student UI Definition:** `src/features/student/components/programmes/programme-catalog.ts:90-106` registers `slug: "scholarship-prep"`:
  ```ts
  // src/features/student/components/programmes/programme-catalog.ts:90-95
  {
    slug: "scholarship-prep",
    cardTitle: "Scholarship Prep",
    fullTitle: "Independent School Scholarship Preparation",
    scopeLabel: "Year 5–7 · Scholarship Entry",
    accent: "teal",
    ...
  ```
- **Catalogue Omission:** `src/features/catalogue/catalogue.ts:255-286` defines `COMING_SOON_PROGRAMS`. It contains `australian-maths-competition`, `maths-olympiad`, and `singapore-maths`, but completely omits both `scholarship-prep` and `selective-entry`!
- **Consequence:** Navigating to `/practice/scholarship-prep` fails or falls through because `catalogue.ts` has no matching record. The student dashboard and the public catalogue have drifted.

### 3.2 Database Authority & Assessment Families
In `supabase/migrations/20260822090000_programme_offering_authority.sql`:
- Lines 94–100 seed six reference assessment families:
  ```sql
  ('naplan_style', 'NAPLAN-style practice', ...),
  ('icas_style', 'ICAS-style practice', ...),
  ('curriculum_practice', 'Curriculum practice', ...),
  ('mathematics_competition', 'Mathematics competition practice', ...),
  ('selective_entry', 'Selective-entry practice', ...),
  ('singapore_curriculum', 'Singapore curriculum practice', ...)
  ```
  **There is no `scholarship_entry` family.**
- Lines 116–121 seed specific programmes under `selective_entry` (`nsw_selective_high_school`, `nsw_opportunity_class`, `victorian_selective_entry`, `wa_aset`).
- There are **zero** database records for independent school scholarship programmes or offerings.
- The session creation boundary in the same migration (`c_offering_families := array['naplan_style', 'icas_style']`, line 287) would reject any scholarship session without an explicit migration.

### 3.3 Year Level Registry
In `src/features/taxonomy/year-registry.ts`:
- Line 20: `export const YEAR_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;`.  
  **Year 6 is already a valid year level in the global platform scale.**
- Lines 38–45: `EXAM_STYLE_YEAR_LEVELS` restricts valid years per style:
  ```ts
  export const EXAM_STYLE_YEAR_LEVELS: Readonly<Record<ExamStyle, readonly YearLevel[]>> = {
    naplan_style: [3, 5, 7, 9],
    icas_style: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    amc_style: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  };
  ```
  It currently knows nothing of scholarship testing. Adding a new exam style requires registering valid years here.

### 3.4 Subject Registry Audit
In `src/features/taxonomy/subject-registry.ts`:
- The registry specifies 9 subjects: `numeracy`, `reading`, `writing`, `language_conventions`, `science`, `digital_technologies`, `spelling`, `critical_creative_thinking`, and `amc_mathematics`.
- **There is no `verbal_reasoning` subject.**
- **There is no `numerical_reasoning` subject.**
- `critical_creative_thinking` (lines 1421–1510) is restricted exclusively to `supportedExamStyles: ["icas_style"]` and focuses on philosophical inquiry and basic sequencing. It does not contain scholarship-calibrated verbal or numerical aptitude skills.

### 3.5 Existing Writing Tasks and Deferred Writing Patterns
- **Question Schema:** `src/schemas/question.schema.ts:17` defines question type `"essay"`. Lines 313–318 define `manualAnswerKeySchema`:
  ```ts
  const manualAnswerKeySchema = z.object({
    kind: z.literal("manual"),
    rubric: z.string().trim().min(10).max(3000),
    sampleResponse: z.string().trim().min(1).max(3000).optional(),
    minWords: z.number().int().positive().max(2000).optional(),
    maxWords: z.number().int().positive().max(5000).optional(),
  });
  ```
- **Renderer:** `src/features/exam-engine/question-renderers/EssayRenderer.tsx:1-63` provides a functional full-text textarea with dynamic word counting and an accessibility-annotated character counter. Line 57 currently renders a static badge `"Marked by a teacher"`.
- **Deferred Patterns:** `src/features/exam-engine/exam-patterns/exam-pattern-registry.ts:114-139` and lines 248–268 define NAPLAN and ICAS writing patterns (`naplan-y3-writing-deferred`, `naplan-y5-writing-deferred`, `icas-y3-writing-deferred`, `icas-y5-writing-deferred`). All are flagged `status: "deferred"` because automated scoring cannot mark essays and the student exam runner lacked a dedicated writing timer mode.

### 3.6 Programme Readiness Audit (September 2026 Baseline)
In `docs/audits/programme-readiness-2026-09.md §2.8`:
- **Current Score:** `0 (Not started)`.
- **Findings:**
  - `programme-catalog.ts`: "Coming Soon" card with scope label "Year 5–7 · Scholarship Entry".
  - Zero engine patterns, zero items in bank.
- **Top 3 Gaps:**
  1. *No Blueprints for ACER or Edutest Formats.*
  2. *No Higher-Order Reasoning Item Types.*
  3. *Zero Content.*
- **Estimated Effort:** Engineering: 5 days; Content & Review: 120 items + 35 review hours (at MVP scale).

### 3.7 The Server-Scoring Contract Trap
In `src/features/exam-engine/scoring/server-scoring-contract.ts`:
- Line 16 hardcodes:
  ```ts
  examStyle: z.enum(["naplan_style", "icas_style", "mixed"]),
  ```
- Lines 21–29 hardcode:
  ```ts
  subject: z.enum([
    "numeracy",
    "reading",
    "language",
    "science",
    "digital_technologies",
    "spelling",
    "mixed",
  ]),
  ```
- **The Trap:** Even if a new exam style or reasoning subject is added to `question.schema.ts` and `subject-registry.ts`, creating an exam session via the API will throw a runtime Zod validation error (`invalid_enum_value`) because `server-scoring-contract.ts` enforces its own independent, closed enums. This file must be updated in tandem.

---

## 4. Architecture Decisions & Coupled Touchpoints

### 4.1 Decision 1: ExamStyle Identity
- **Option A (Reuse `selective_entry`):** Treat scholarship tests under an umbrella `selective_style`.  
  *Critique:* Conflates state government selective school entry (e.g. Victoria's SEHS test, NSW Selective High School test, which have distinct section timings of 35–40 min, Thinking Skills, and statewide scaling) with independent school scholarship examinations.
- **Option B (New `scholarship_style`):** Introduce a clean `"scholarship_style"` literal into `ExamStyle`.  
  *Critique:* Cleanly isolates scholarship taxonomy, timers (30 min multiple choice, 15 min writing), and parent reporting.
- **Recommendation:** **Option B (`scholarship_style`).** High architectural fidelity; prevents test logic leakage across different assessment families.

### 4.2 Decision 2: Programme Family Identity
- **Option A (Fold into `assessment_families.selective_entry`):** Add Edutest/ACER programmes under the existing `selective_entry` table row.  
  *Critique:* Selective schools are publicly funded merit placements; independent scholarships are fee-remission awards with distinct commercial prep expectations.
- **Option B (New `assessment_families.scholarship_entry`):** Introduce a dedicated `scholarship_entry` family in the database authority table.  
  *Critique:* Mirrors the distinction already established between `curriculum_practice` and `mathematics_competition`.
- **Recommendation:** **Option B (`scholarship_entry`).** Creates clean authority boundaries in database migrations.

### 4.3 Decision 3: Year Level Support
- **Initial Scope:** **Year 6 only** (for Year 7 entry in 2028).
- **Expansion Scope (Year 4 Entry):** ACER Level P and Edutest Year 4 tests (for Year 5 entry) will be unlocked later. Supporting Year 4 entry will require adding Year 4 to `EXAM_STYLE_YEAR_LEVELS.scholarship_style` and authoring an Abstract/Non-Verbal Reasoning strand (which younger tests often substitute for complex numerical deduction).

### 4.4 Decision 4: Section-to-Subject & Pattern Mapping
How the 5 Edutest sections map to `SUBJECT_REGISTRY`:

| Edutest Section | MindMosaic Subject Strategy | Rationale |
|---|---|---|
| **Verbal Reasoning** | New dedicated subject: `verbal_reasoning` | Aptitude construct; distinct from curriculum English or reading. |
| **Numerical Reasoning** | New dedicated subject: `numerical_reasoning` | Aptitude construct; distinct from standard syllabus maths. |
| **Reading Comprehension** | Reuse existing subject: `reading` (add `scholarship_style` strands) | Directly reuses the existing reading stimulus passages and comprehension engine. |
| **Mathematics** | Reuse existing subject: `numeracy` (add `scholarship_style` strands) | Directly reuses mathematical schemas and visual renderers. |
| **Written Expression** | Reuse existing subject: `writing` (add `scholarship_style` strands) | Directly reuses the `essay` question type and `EssayRenderer`. |

### 4.5 Exhaustive List of Coupled Touchpoints
When building the scholarship track, the following 10 touchpoints must be updated together to maintain strict type safety and runtime execution:

1. `src/schemas/question.schema.ts`: Add `"scholarship_style"` to `EXAM_STYLES` (line 57).
2. `src/features/exam-engine/exam-patterns/exam-pattern.ts`: Add `"scholarship_style"` to `examPatternSchema.shape.examStyle` (line 33).
3. `src/features/taxonomy/year-registry.ts`: Add `scholarship_style: [6]` to `EXAM_STYLE_YEAR_LEVELS` (line 38).
4. `src/features/taxonomy/subject-registry.ts`: Add `verbal_reasoning` and `numerical_reasoning` subjects; append `"scholarship_style"` to `supportedExamStyles` on `reading`, `numeracy`, and `writing`.
5. `src/features/exam-engine/scoring/server-scoring-contract.ts`: Update `examSelectionConfigSchema.shape.examStyle` and `subject` enums.
6. `src/features/catalogue/catalogue.ts`: Add `"scholarship_style"` to `STYLE_LABELS` (line 320); register `scholarship-prep` in `PROGRAMS` / `COMING_SOON_PROGRAMS`.
7. `src/features/student/components/programmes/programme-catalog.ts`: Synchronise `scholarship-prep` metadata and links.
8. `supabase/migrations/`: Seed `scholarship_entry` family, `edutest_scholarship_prep` programme, subjects, and offering rows in `programme_offerings`.
9. `src/features/exam-engine/exam-patterns/exam-pattern-registry.ts`: Register the 5 Year 6 scholarship patterns.
10. `scripts/check-question-correctness.mts`: Add independent mathematical and linguistic solver routines for reasoning items.

---

## 5. Taxonomy Specification

### 5.1 Verbal Reasoning (Subject: `verbal_reasoning`, Style: `scholarship_style`, Year: 6)
All questions are 4-option or 5-option multiple choice, scored deterministically (1 mark each).

| Skill ID | Description | Question Type | Visual Needs | Algorithmic / Code Verification Strategy |
|---|---|---|---|---|
| `vr-analogies` | Word pair analogies ($A : B :: C : ?$) | `multiple_choice` | None (inline text) | Exact lexical relation tuple $(A, B, R)$ and $(C, D, R)$; verified against relational ontology / dictionary semantic ground truth. |
| `vr-classification` | Odd-one-out word classification | `multiple_choice` | None (inline text) | Set membership validation: 4 words share semantic category $C$; 1 word violates $C$. |
| `vr-synonyms-antonyms` | Advanced vocabulary in context & pair opposites | `multiple_choice` | None (inline text) | Direct lookup verification against Merriam-Webster / Macquarie lexical database. |
| `vr-word-relationships` | Double analogies and compound word relationships | `multiple_choice` | None (inline text) | Rule-based compound component check or verified word-connection rule. |
| `vr-sentence-logic` | Syllogistic deduction and conditional inferences | `multiple_choice` | None (inline text) | Propositional logic truth-table evaluation (premises $P_1, P_2 \models Q$). |
| `vr-letter-series` | Alphabetical sequences with regular step rules | `multiple_choice` | Monospaced text box | Modular arithmetic verifier: mapping letters to integers $(0\dots 25 \pmod{26})$ checking step recurrence $x_{n+1} = (x_n + \Delta_n) \pmod{26}$. |
| `vr-coded-words` | Simple substitution ciphers and decoding rules | `multiple_choice` | Monospaced text box | Bijective cipher function verification $f: \Sigma \to \Sigma$; verifier encodes target word to check candidate against `answerKey`. |

### 5.2 Numerical Reasoning (Subject: `numerical_reasoning`, Style: `scholarship_style`, Year: 6)
All questions are 4-option or 5-option multiple choice, scored deterministically (1 mark each).

| Skill ID | Description | Question Type | Visual Needs | Algorithmic / Code Verification Strategy |
|---|---|---|---|---|
| `nr-number-series` | Arithmetic, geometric, polynomial, and interleaved sequences | `multiple_choice` | None or `number_line` | Parameterised series solver: generator stores recurrence $f(n)$; code calculates $a_k$ independently and checks option match. |
| `nr-number-matrices` | $3 \times 3$ number grids with row/column algebraic relationships | `multiple_choice` | **`table` visual** ($3 \times 3$ grid with `?`) | Algebraic matrix verifier: row/column transformation rule $R_i$ or $C_j$ evaluated by code to solve for the missing cell. |
| `nr-arithmetical-reasoning` | Multi-step word problems requiring algebraic setup | `multiple_choice` | None or `table` | Linear equation solver: parameters $(p_1, \dots, p_k)$ evaluated by symbolic arithmetic solver. |
| `nr-logic-deduction-numbers` | Number puzzles, cryptarithms, and constraint satisfaction | `multiple_choice` | `table` or inline text | Finite domain constraint satisfaction solver (CSP) verifying unique integer solution. |

### 5.3 Reading Comprehension at Year 6 Level
- **Honest Evaluation of Year 5 Content Reuse:**
  - **Year 5 NAPLAN/ICAS content cannot be reused as scholarship practice.**
  - *Rationale:* Year 5 NAPLAN is calibrated to the middle-of-year national minimum-to-proficient benchmark (Lexile ~650–800L). Scholarship tests for Year 7 entry are competitive selection filters targeting the top 5–10% of candidates. Serving Year 5 questions gives a false sense of security and fails to prepare the student for the speed and complexity of scholarship passages.
  - *Warm-Up Role Only:* Year 5 content may only be used as an un-timed introductory diagnostic baseline ("Diagnostic Warm-Up"), never inside a scholarship practice simulation.
- **New Year 6 Scholarship Reading Requirements:**
  - **Passage Complexity:** Lexile 850L–1050L (high-school readiness).
  - **Text Types:** 19th/20th-century classic literature excerpts, persuasive speeches/editorials, nuanced historical non-fiction, and poetry/drama.
  - **Cognitive Demands:** Subtle tone analysis, rhetorical device identification, authorial intent, vocabulary in archaic or figurative context, and multi-text comparison.

### 5.4 Mathematics at Year 6 Level
- **Honest Evaluation of Year 5 Content Reuse:**
  - **Year 5 NAPLAN/ICAS mathematics is below target level.**
  - *Rationale:* Scholarship mathematics assesses advanced Year 6 and early Year 7 curriculum concepts under extreme time pressure (45 seconds per question).
- **New Year 6 Scholarship Mathematics Requirements:**
  - Negative integers and operations with directed numbers.
  - Multi-step fractions, decimals, and percentage increases/decreases (>100%).
  - Ratios, rates, and inverse proportions.
  - Basic algebraic expressions, substitution, and solving linear equations ($ax + b = c$).
  - Geometry: angles on intersecting lines, properties of quadrilaterals, composite area, and volume of triangular/rectangular prisms.
  - Probability: two-step chance experiments, tree diagrams, and Venn diagrams.

### 5.5 Written Expression (15-Minute Strict Engine & Parent Rubric)
- **Engine Rules:**
  - **Strict 15-Minute Countdown:** No planning screen or reading delay. As soon as the student starts, the 15-minute timer runs immediately, replicating Edutest examination conditions.
  - **Visual Word Count:** Live word counter with a recommended target range (150–250 words for 15 minutes).
  - **Prompt Bank:** 20 original prompts rotating across 5 genres:
    1. *Narrative (Creative):* A sudden discovery, an unexpected obstacle, or an evocative setting.
    2. *Persuasive (Argumentative):* Balanced debate on school or societal topics (e.g. "Should homework be banned?", "Is space exploration worth the cost?").
    3. *Descriptive:* Vivid sensory description of a dramatic location or character.
    4. *Personal Reflection / Discursive:* Exploring a theme or quotation (e.g. "A time when failure taught a lesson").
    5. *Informative / Expository:* Explaining a process or perspective clearly.
- **Parent-Marked Rubric (Zero AI Marking):**
  - **Strict Adherence to `docs/design.md §29`:** AI marking of children's creative writing is strictly prohibited. AI features remain unbuilt concepts and must never grade open-ended student work.
  - **Parent Rubric Interface:** After test completion, the parent is presented with a 6-criterion rubric corresponding to the publicly listed Edutest criteria:
    1. *Punctuation (1–5 marks):* Accurate sentence boundaries, commas, quotation marks, apostrophes.
    2. *Creativity & Ideas (1–5 marks):* Originality, engaging voice, depth of imagination.
    3. *Construction & Structure (1–5 marks):* Paragraphing, logical sequencing, strong beginning and ending.
    4. *Grammar & Sentence Variety (1–5 marks):* Correct tense, subject-verb agreement, complex sentence structures.
    5. *Spelling (1–5 marks):* High accuracy on common and challenging ambitious vocabulary.
    6. *Relevance to Prompt (1–5 marks):* Directly and purposefully addresses the assigned topic.
  - Total marks: 30 marks, scaled to percentage and percentile bands in the parent dashboard.

---

## 6. Exam Paper Patterns

MindMosaic will register 5 full-length practice patterns in `src/features/exam-engine/exam-patterns/exam-pattern-registry.ts`.

### 6.1 Paper Pattern Specifications

```ts
// 1. Verbal Reasoning Full Practice
{
  id: "scholarship-y6-verbal-reasoning-full",
  label: "Scholarship-style Year 6 Verbal Reasoning — Full-Length Practice",
  examStyle: "scholarship_style",
  yearLevel: 6,
  presentation: "full_length_practice",
  basis: "official_length_and_time",
  adaptations: ["tight_time_pressure"],
  questionCount: 45, // Labelled engineering assumption
  timeMinutes: 30,
  sources: [
    {
      id: "verbal-reasoning",
      programmeId: "scholarship-y6-verbal-reasoning",
      count: 45,
      filters: { typeIn: ["multiple_choice"] },
      display: "merged",
    },
  ],
}

// 2. Numerical Reasoning Full Practice
{
  id: "scholarship-y6-numerical-reasoning-full",
  label: "Scholarship-style Year 6 Numerical Reasoning — Full-Length Practice",
  examStyle: "scholarship_style",
  yearLevel: 6,
  presentation: "full_length_practice",
  basis: "official_length_and_time",
  adaptations: ["tight_time_pressure"],
  questionCount: 40, // Labelled engineering assumption
  timeMinutes: 30,
  sources: [
    {
      id: "numerical-reasoning",
      programmeId: "scholarship-y6-numerical-reasoning",
      count: 40,
      filters: { typeIn: ["multiple_choice"] },
      display: "merged",
    },
  ],
}

// 3. Reading Comprehension Full Practice
{
  id: "scholarship-y6-reading-full",
  label: "Scholarship-style Year 6 Reading Comprehension — Full-Length Practice",
  examStyle: "scholarship_style",
  yearLevel: 6,
  presentation: "full_length_practice",
  basis: "official_length_and_time",
  adaptations: ["tight_time_pressure"],
  questionCount: 35, // Labelled engineering assumption (4 passages)
  timeMinutes: 30,
  sources: [
    {
      id: "reading",
      programmeId: "scholarship-y6-reading",
      count: 35,
      filters: { typeIn: ["multiple_choice"] },
      display: "merged",
    },
  ],
}

// 4. Mathematics Full Practice
{
  id: "scholarship-y6-mathematics-full",
  label: "Scholarship-style Year 6 Mathematics — Full-Length Practice",
  examStyle: "scholarship_style",
  yearLevel: 6,
  presentation: "full_length_practice",
  basis: "official_length_and_time",
  adaptations: ["tight_time_pressure"],
  questionCount: 40, // Labelled engineering assumption
  timeMinutes: 30,
  sources: [
    {
      id: "mathematics",
      programmeId: "scholarship-y6-mathematics",
      count: 40,
      filters: { typeIn: ["multiple_choice"] },
      display: "merged",
    },
  ],
}

// 5. Written Expression Full Practice
{
  id: "scholarship-y6-written-expression-full",
  label: "Scholarship-style Year 6 Written Expression — Timed Practice",
  examStyle: "scholarship_style",
  yearLevel: 6,
  presentation: "full_length_practice",
  basis: "official_length_and_time",
  adaptations: ["no_planning_screen", "parent_marked_rubric"],
  questionCount: 1,
  timeMinutes: 15,
  sources: [
    {
      id: "writing",
      programmeId: "scholarship-y6-writing",
      count: 1,
      filters: { typeIn: ["essay"] },
      display: "merged",
    },
  ],
}
```

### 6.2 Shuffle & Retake Rules
- **Shuffle Rule:** Question presentation order is randomised using a deterministic Fisher-Yates shuffle seeded by the exam session ID. For Reading Comprehension, items linked to a specific stimulus passage remain grouped together; only the passage order and intra-passage question order are shuffled.
- **Retake Depth Policy:** To allow a student to take at least **3 complete, non-overlapping practice papers per section**, the question bank depth must support $3 \times \text{QuestionCount}$ unique items.

---

## 7. Content Plan & Review Workload

### 7.1 Required Bank Depth (3 Non-Overlapping Papers + Prompts)

| Section | Items / Paper | Target Papers | Target Bank Depth | Allocation by Strand / Sub-Skill |
|---|---|---|---|---|
| **Verbal Reasoning** | 45 | 3 | **135 items** | ~19–20 items across each of the 7 verbal skills (§5.1) |
| **Numerical Reasoning** | 40 | 3 | **120 items** | 30 items per skill across the 4 numerical skills (§5.2) |
| **Reading Comprehension** | 35 | 3 | **105 items** | 12 passages (~300–450 words each); ~8–9 items per passage |
| **Mathematics** | 40 | 3 | **120 items** | 20 items per strand across 6 maths strands (§5.4) |
| **Written Expression** | 1 | 20 sittings | **20 prompts** | 4 prompts per text type across the 5 genres (§5.5) |
| **Total Content Required** | — | — | **480 MC items + 20 prompts** (500 total) | High-speed, high-density academic bank |

### 7.2 Generation Pipeline Architecture
- Content is drafted using MindMosaic's automated Question Factory (`src/features/question-factory/`).
- **Automated Verification:** Every drafted reasoning question must have an independently computable solution verified by automated TypeScript solvers (e.g. arithmetic series solver, matrix rule evaluator, cipher decoder, and logic truth evaluator) before being presented for human review.
- **Human Approval Gate:** As required by `AGENTS.md` Standing Rule 8, no AI-generated item enters `_promoted/` or the live exam bank without human sign-off (`approvedBy`).

### 7.3 Review Workload Estimate for Parent Reviewer
The product owner is the sole human reviewer. The review effort is budgeted as follows:

| Item Type | Count | Expected Review Pace | Estimated Review Hours |
|---|---|---|---|
| Objective Multiple Choice (Reasoning & Maths) | 375 items | 1.5 minutes / item (review question, verify distractor rationale) | ~9.4 hours |
| Reading Passages & Items | 12 passages + 105 items | 15 minutes / passage set (read passage + check 8–9 items) | ~3.0 hours |
| Writing Prompts & Rubrics | 20 prompts | 4 minutes / prompt & rubric review | ~1.3 hours |
| Pre-Release End-to-End Paper Sittings | 5 test runs | 30 minutes / paper sitting verification | ~2.5 hours |
| **Total Human Review Workload** | — | — | **~16.2 hours** |

*Pacing recommendation:* Distributed over 4 weekend review sessions of ~4 hours each during November and December.

---

## 8. Phased Delivery Plan (Working Back from 13 February 2027)

```
Today (13 Oct) ───► Mid-Dec 2026 (Usable Practice) ───► Summer Holidays ───► 13 Feb 2027 (Exam)
  [Phase 0]            [Phases 1-3 Complete]                 [Phase 4]          [Phase 5: Peak]
```

### 8.1 Phase Breakdown & Key Dates

#### Phase 0: Investigation & Family Specification (Done)
- **Target Date:** 13 October 2026 (Today)
- **Deliverables:** `docs/content-status/scholarship-family-spec.md` (this document), draft PR opened into `dev`.
- **Learner Capability:** None (research and architecture contract only).
- **Effort:** Small (Docs only).

#### Phase 1: Core Architecture & Reasoning Engine Foundation
- **Window:** 14 October – 4 November 2026 (3 weeks)
- **Deliverables:**
  - Add `"scholarship_style"` across schemas, year registry, and `server-scoring-contract.ts`.
  - Add `verbal_reasoning` and `numerical_reasoning` subjects and strands to `subject-registry.ts`.
  - Database migration: seed `scholarship_entry` family, programmes, subjects, and `programme_offerings`.
  - Automated code verifiers for number series, letter series, matrices, and coded words in `scripts/check-question-correctness.mts`.
- **Testable Acceptance Criteria:** `npm run typecheck`, `npm test`, and `validateRegistry` pass with `"scholarship_style"` active; automated test generates and scores mock numerical series and matrix items deterministically.
- **Learner Capability:** None (backend infrastructure).
- **Effort:** Medium.

#### Phase 2: Reasoning Content Batch 1 (Reasoning MVP)
- **Window:** 5 November – 25 November 2026 (3 weeks)
- **Deliverables:**
  - Question Factory generation of Batch 1: 45 Verbal Reasoning items + 40 Numerical Reasoning items.
  - Automated solver verification pass.
  - Parent human review and `approvedBy` sign-off.
  - Register `scholarship-y6-verbal-reasoning-full` and `scholarship-y6-numerical-reasoning-full` patterns.
- **Testable Acceptance Criteria:** A student can sit a full 30-minute Verbal Reasoning test and 30-minute Numerical Reasoning test; questions score accurately against server contract.
- **Learner Capability:** **Child can practise full Verbal and Numerical Reasoning tests under real 30-minute timers.**
- **Effort:** Large (generation + review).

#### Phase 3: Reading, Maths & Written Expression MVP (**Mid-December Milestone**)
- **Window:** 26 November – 16 December 2026 (3 weeks)
- **Deliverables:**
  - Batch 1 generation & review: 35 Year 6 Reading items (4 passages), 40 Year 6 Maths items, and 10 Writing prompts.
  - Register `scholarship-y6-reading-full`, `scholarship-y6-mathematics-full`, and `scholarship-y6-written-expression-full` patterns.
  - Implement 15-minute strict writing timer in `EssayRenderer` with no planning screen.
  - Parent-marked 6-criterion rubric interface in exam report.
- **Testable Acceptance Criteria:** Complete 5-section exam suite available; 15-minute timer enforces strict cutoff; parent can enter rubric marks for writing and see aggregate composite score.
- **Learner Capability:** **MILESTONE ACHIEVED (16 Dec 2026): Child has a complete, working 5-section Edutest-style practice exam suite ready for the summer school holidays.**
- **Effort:** Large.

#### Phase 4: Full Bank Depth & 3x Retake Expansion
- **Window:** 17 December 2026 – 15 January 2027 (4 weeks)
- **Deliverables:**
  - Batch 2 & 3 content generation and review: expand bank to full target depth (135 Verbal, 120 Numerical, 105 Reading, 120 Maths, 20 Writing prompts).
  - Enable multi-sitting non-overlapping retake capability.
- **Testable Acceptance Criteria:** 3 consecutive sittings of any section share zero questions.
- **Learner Capability:** Child can sit multiple full-length mock exams without encountering repeated questions.
- **Effort:** Large.

#### Phase 5: Final Simulation & Exam-Day Readiness
- **Window:** 16 January – 10 February 2027 (3.5 weeks)
- **Deliverables:**
  - "Full Exam Day Simulation" battery (runs all 5 sections sequentially with short breaks, mimicking the 3-hour Saturday test morning).
  - Pacing analytics report showing seconds-per-question and question abandonment rates.
- **Testable Acceptance Criteria:** Full battery runs end-to-end; composite performance report generates correctly.
- **Learner Capability:** Child experiences authentic exam-day psychological and endurance conditioning prior to 13 February 2027.
- **Effort:** Medium.

---

## 9. Conflict Map with In-Flight Branches

Three major branches are currently active or awaiting merge in the repository. The following matrix tracks file touches and collision risks for the Phase 1 build.

### 9.1 Active Branches & Files Touched

| In-Flight Branch | Core Purpose | Files Touched |
|---|---|---|
| **`feat/programme-governance-roadmap`** | Publication governance, approval ledger, server exam bank | `src/server/exam-bank.ts`, `src/features/content-governance/*`, `scripts/check-publication-gates.mts`, `scripts/questions-publish.mts`, `scripts/check-question-correctness.mts`, `supabase/migrations/20261005090000_*` |
| **`content/roadmap-drafts-review`** | Unsigned draft preflight validation | `content/roadmap-drafts/*`, `scripts/validate-roadmap-drafts.mts`, `.github/workflows/ci.yml` |
| **`feat/bar-model-visual` (PR #45)** | Bar model visual schema and renderers | `src/schemas/visual.schema.ts`, `src/features/exam-engine/visual-renderers/*`, `scripts/validate-bar-models.mts` |

### 9.2 Overlap Analysis for Scholarship Build (Phase 1)

| Planned Scholarship Touchpoint | Overlaps With | Collision Risk | Mitigation / Recommended Sequencing |
|---|---|---|---|
| `src/schemas/question.schema.ts` | None of the three branches | Low | Clean edit. |
| `src/features/exam-engine/exam-patterns/*` | None | Low | Clean edit. |
| `src/features/taxonomy/*` | None | Low | Clean edit. |
| `src/features/exam-engine/scoring/server-scoring-contract.ts` | None | Low | Clean edit. |
| `scripts/check-question-correctness.mts` | `feat/programme-governance-roadmap` | **HIGH** | `programme-governance-roadmap` modifies `check-question-correctness.mts` significantly. Do not touch this script until PR #44 / governance merges to `dev`, OR branch off after merge. |
| `supabase/migrations/*` | `feat/programme-governance-roadmap` | Medium | New migration timestamp must be strictly ordered after `20261005090000`. |
| `src/server/exam-bank.ts` | `feat/programme-governance-roadmap` | **HIGH** | Governance branch changes runtime projection and exam bank loaders. Wait for governance merge before modifying bank assembly. |
| `src/schemas/visual.schema.ts` | `feat/bar-model-visual` (PR #45) | Medium | Scholarship track uses existing `table` and text renderers; does not require editing `visual.schema.ts`. Zero collision. |

### 9.3 Recommended Build Sequencing to Avoid Conflicts
1. **Merge Order:** Allow `feat/bar-model-visual` (PR #45) and `feat/programme-governance-roadmap` to merge into `dev` first.
2. **Branching Point:** Branch Phase 1 (`feat/scholarship-track-core`) strictly from the freshly updated `origin/dev` once governance lands.
3. **Draft Staging:** While governance is merging, draft content generation batches can be held in local JSON staging without touching runtime projection files.

---

## 10. Risks and Open Questions

1. **Pacing Stress & Speed Disparity (Risk):** 45 questions in 30 minutes (40 seconds/question) for Verbal Reasoning and 45 seconds/question for Numerical Reasoning creates intense cognitive pressure. If the child attempts this without graduated difficulty, it could lead to discouragement.  
   *Mitigation:* Provide an untimed "Confidence Mode" alongside the strict timed exam pattern.
2. **Reading Stimulus Depth & Intellectual Property (Risk):** Drafting original, high-quality Year 6 reading comprehension passages (historical, narrative, scientific) requires significant creative writing effort to avoid cliché while maintaining high Lexile difficulty.  
   *Mitigation:* Dedicate focused prompt engineering to generating authentic public-domain-style literature excerpts and historical essays.
3. **Machine Verification Limits in Verbal Reasoning (Risk):** While letter series and ciphers are 100% computable, verbal analogies and classification rely on semantic nuances that automated regex/rule engines can misinterpret.  
   *Mitigation:* Use strict lexical databases for automated pre-checks, but enforce mandatory human sign-off on every verbal analogy item.
4. **Parent Marking Friction in Writing (Risk):** If the parent finds marking a 6-criterion rubric tedious, writing practice might be skipped or completed without feedback.  
   *Mitigation:* Design a sleek, mobile-friendly 6-slider grading screen with clear descriptive anchors (e.g. "What 3/5 looks like") so marking takes under 3 minutes per essay.
5. **Absence of Strict Positional Difficulty Ramp in Selection Engine (Risk):** As noted in the AMC investigation, MindMosaic's selection engine draws items by filter and count, not by ordinal mark-ascending sequence. In Edutest, questions are broadly mixed or subtly ramped.  
   *Mitigation:* Because Edutest questions are unweighted (1 mark each across all positions), a randomized shuffle does not distort scoring validity the way it would in the AMC.
6. **ACER Format Variance (Open Question):** ACER uses 2 extended writing tasks (25 minutes each) and a combined "Humanities" section rather than separate Verbal and Reading sections.  
   *Mitigation:* Keep the underlying bank granular by skill so ACER-specific patterns can be assembled in the future without re-authoring content.
7. **Summer Holiday Review Availability (Risk):** The content plan requires ~16 hours of human review from the product owner between November and January. If review stalls, published bank depth will not reach the 3-paper retake target.  
   *Mitigation:* Prioritise 1 complete full paper per section for mid-December, deferring retake depth to early January.
8. **Student Handwriting vs Typing for Written Expression (Open Question):** Real Edutest exams may be administered either on computer or on paper depending on the school's testing centre setup. MindMosaic is digital.  
   *Mitigation:* Support on-screen typing with a printable prompt option so the child can also practice handwritten 15-minute essays.

---

## 11. Decisions Needed from the Product Owner

The following 5 decisions govern how Phase 1 will be built. Recommendations are provided for each:

### Decision 1: Exam Style & Architecture Isolation
Should scholarship testing be introduced as a new dedicated `scholarship_style` exam style, or folded into the existing `selective_entry` family?
- *Option A:* Fold into `selective_entry` (less schema duplication, but couples independent and state selective rules).
- *Option B (Recommended):* Create a dedicated `scholarship_style` and `scholarship_entry` family.
- **Recommendation:** **Option B.** Keeps independent scholarship timing, rubrics, and taxonomy cleanly separated from state selective school models.

### Decision 2: Descriptive Trademark vs Neutral Naming
Should the student-facing track use "Scholarship-style practice (Edutest-style)" with a legal disclaimer, or completely neutral phrasing?
- *Option A (Recommended):* Use **"Scholarship-style practice (Edutest-style)"** with the prominent non-endorsement disclaimer on all entry screens.
- *Option B:* Use neutral naming: **"Independent School Scholarship Practice (Format E)"**.
- **Recommendation:** **Option A.** Clearly communicates test relevance to the child and parent while remaining legally compliant under Australian nominative fair use principles.

### Decision 3: Mid-December Bank Depth Target
Should the mid-December 2026 milestone deliver **1 complete practice paper per section** (160 items + 10 writing prompts, ~6 review hours) or the **full 3-paper retake depth** (480 items + 20 prompts, ~16 review hours)?
- *Option A (Recommended):* **1 complete 5-section mock paper by mid-December** (MVP), expanding to 3-paper retake depth across the summer holidays in January.
- *Option B:* Full 3-paper depth by mid-December (requires intensive review workload in November).
- **Recommendation:** **Option A.** Guarantees a fully functional, usable end-to-end exam suite in the child's hands before holidays start, without risking reviewer burnout.

### Decision 4: Mode Selection — Timed Exam Only vs "Confidence Mode"
Should the practice engine only provide strict 30-minute / 15-minute timed simulations, or also offer an untimed "Skill Practice / Confidence Mode"?
- *Option A:* Strict timed exam simulations only (maximum fidelity to exam-day pressure).
- *Option B (Recommended):* Both: provide the official 30-minute timed simulation *and* an untimed "Untimed Practice" option reusing the same bank.
- **Recommendation:** **Option B.** Essential for high-ability Year 5 students transitioning into Year 6 reasoning. Practising tricky numerical matrices or verbal analogies without a countdown clock builds competence before applying the 40-second time squeeze.

### Decision 5: Written Expression Input Mode
Should Written Expression strictly require on-screen typing, or should it offer an official "Print Prompt & Paper" option for handwritten practice?
- *Option A:* On-screen typing only (in `EssayRenderer`).
- *Option B (Recommended):* Dual mode: on-screen typing as default, with a "Print Prompt & Ruled Sheet" button for authentic handwriting practice.
- **Recommendation:** **Option B.** Many independent schools require paper-based handwriting for the written expression component. Giving the child experience with physical pen-to-paper speed under a 15-minute timer is invaluable preparation.

---

*End of Phase 0 Specification.*
