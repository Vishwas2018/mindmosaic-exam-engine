# Victorian Curriculum Crosswalk Corrections Applied

> **Branch**: `agy/crosswalk-apply`  
> **Base Commit**: `a8b5f40`  
> **Status**: Corrections Applied & Deduplicated

---

## 1. Summary of Corrections Applied

### Correction 1 — Stop the `VC2M5N09` and `VC2M3N04` Dumping Grounds

- **Problem in Phase 1**:
  - `VC2M5N09` (*Mathematical modelling in practical additive and multiplicative problem solving*) received 18 distinct skill tuples (133 raw questions), including basic place-value additions, circle properties, volume methods, scale lookups, and single-operation computations.
  - `VC2M3N04` (*Addition and subtraction with place-value partitioning*) received bar graph comparisons, data table sums, number line differences, and scale readings.
- **Actions Taken**:
  - **Grade 5 Re-routing**:
    - *Place value & adding powers of ten / digit constraints* $\rightarrow$ `VC2M5N01` (*Decimal place value, comparison and number-line positioning*).
    - *Parity, multiples & number properties* $\rightarrow$ `VC2M5N02` (*Factors, multiples and divisibility rules*).
    - *Evaluating expressions with order of operations* $\rightarrow$ `VC2M5A02` (*Solving unknown values in equations using operational properties*).
    - *Map scale & directional coordinates* $\rightarrow$ `VC2M5SP02` (*Grid coordinate systems and directional navigation*).
    - *Volume measurement method* $\rightarrow$ `VC2M5M01` (*Metric unit selection and precision*).
    - *Rounding* $\rightarrow$ `VC2M5N01`.
    - *Genuine multi-step operation in context* (`g5-icas-math-b01-014`) $\rightarrow$ Kept on `VC2M5N09` (now cleanly 1 distinct item).
    - *Parts of a circle* (`g5-nap-num-geo-003`) $\rightarrow$ Marked `no_match` (2D circle geometry is not a Level 5 descriptor).
    - *Pure 4-digit addition/subtraction without context* (`gen-num-add-00667`, `gen-num-sub-00668`, 76 raw items) $\rightarrow$ Marked `no_match` (single-operation arithmetic is Level 3/4 content; Level 5 arithmetic requires modelling context).
  - **Grade 3 Sanity Pass on `VC2M3N04`**:
    - *Bar graph & column graph differences* $\rightarrow$ `VC2M3ST02` (*Graphical representations and comparative data analysis*).
    - *Data table reading and addition* $\rightarrow$ `VC2M3ST01` (*Categorical and discrete data collection and frequency tables*).
    - *Number line differences* $\rightarrow$ `VC2M3N02` (*Reading, writing and ordering numbers on number lines*).
    - *Reading a scaled ruler/instrument* $\rightarrow$ `VC2M3M02` (*Measuring length, mass and capacity with scaled instruments*).
    - *Number pattern subtraction steps* $\rightarrow$ `VC2M3N09` (*Algorithms and decision sequences for number patterns*).
    - *Multi-step word problems (multiplication then subtraction)* $\rightarrow$ `VC2M3N08` (*Mathematical modelling in practical additive and financial contexts*).
    - *Comparing quantities ("how many more are needed")* $\rightarrow$ `VC2M3N08`.
    - *Pure 2- and 3-digit addition/subtraction with regrouping* $\rightarrow$ Retained on `VC2M3N04`.

---

### Correction 2 — Route Grammar Knowledge to the Language Strand

- **Problem in Phase 1**:
  - `VC2E3LY12` and `VC2E5LY11` (editing/proofreading) were overloaded with discrete grammar-knowledge items (identifying verbs, articles, prepositions, question words, homophones, plurals, verb tenses).
- **Actions Taken**:
  - **Grade 3 Re-routing**:
    - *Articles, prepositions, question words, connectives, complete sentences vs fragments, word order, negatives, subject-verb agreement* $\rightarrow$ `VC2E3LA06` (*Clause structures and grammatical relationships in sentences*).
    - *Identifying verbs & action verbs* $\rightarrow$ `VC2E3LA07` (*Verb processes for actions, feelings, thoughts and states*).
    - *Verb tense consistency* $\rightarrow$ `VC2E3LA08` (*Tense consistency and temporal anchoring of verbs*).
    - *Retained on `VC2E3LY12`*: Only genuine editing and proofreading items (e.g. judging whether a sentence uses correct grammar, correcting end punctuation, capital letters in proper nouns, punctuating direct speech).
  - **Grade 5 Re-routing**:
    - *Homophones & etymology* $\rightarrow$ `VC2E5LY04` (*Word etymology, Greek and Latin roots and advanced spelling generalizations*).
    - *Plurals & suffix shifts* $\rightarrow$ `VC2E5LY05` (*Irregular plurals and grammatical shifts caused by suffixation*).
    - *Articles & expanded noun groups* $\rightarrow$ `VC2E5LA06` (*Expanded noun groups for detailed description and precision*).
    - *Verb tense & complex clause structures* $\rightarrow$ `VC2E5LA05` (*Complex sentence structures with dependent and independent clauses*).
    - *Retained on `VC2E5LY11`*: `VC2E5LY11` now honestly has 0 items (⚪ **Coming soon**) because the active bank does not yet contain whole-passage collaborative proofreading tasks for Grade 5.

---

### Correction 3 — Content-Hash Deduplication Before Counting

- **Problem in Phase 1**:
  - Template-generated variants (e.g. 13 homophones items, 38 addition items) inflated raw counts, masking the true breadth of distinct questions.
- **Actions Taken**:
  - Questions are deduplicated by content hash and template family prior to computing node coverage.
  - The coverage badge threshold ($\ge 5$ for `covered`, $1 - 4$ for `partial`, $0$ for `empty`) is evaluated strictly against the deduplicated distinct question count.

---

## 2. Before vs After Totals

### Overall Badge Status Across All 104 Curriculum Nodes

| Badge State | Phase 1 (Raw Inflated) | Phase 2 (Corrected & Deduplicated) | Shift Rationale |
| :--- | :---: | :---: | :--- |
| 🟢 **Covered ($\ge 5$ Qs)** | **48** (46.15%) | **48** (46.15%) | Precision routing balanced across legitimate nodes |
| 🟡 **Partial ($1 - 4$ Qs)** | **13** (12.50%) | **15** (14.42%) | Descriptors like N09, A01, A02 now honestly show true partial counts |
| ⚪ **Empty ($0$ Qs)** | **43** (41.35%) | **41** (39.42%) | Language grammar nodes now properly covered; LY11 honestly empty |
| **Total Nodes** | **104** (100.0%) | **104** (100.0%) | Authoritative Victorian Curriculum v2.0 L3 & L5 |

### Breakdown by Subject & Level

| Level & Subject | Phase 1 Covered | Phase 2 Covered | Phase 1 Partial | Phase 2 Partial | Phase 1 Empty | Phase 2 Empty | Total |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Mathematics Level 3** | 18 | **17** | 4 | **2** | 2 | **5** | 24 |
| **Mathematics Level 5** | 15 | **11** | 4 | **7** | 5 | **6** | 24 |
| **English Level 3** | 10 | **13** | 2 | **3** | 18 | **14** | 30 |
| **English Level 5** | 5 | **7** | 3 | **3** | 18 | **16** | 26 |
| **Total** | **48** | **48** | **13** | **15** | **43** | **41** | **104** |

---

## 3. List of Items Marked `no_match` (Honest Exclusions)

The following 15 distinct skill tuples (81 raw questions) were deliberately marked `no_match` rather than force-fitted into unsuitable nodes:

1. `[5] numeracy > Measurement and geometry > Parts of a circle > Naming parts of a circle` (1 Q, `g5-nap-num-geo-003`) — 2D circle geometry is not part of Level 5 Space descriptors.
2. `[5] numeracy > Number and Algebra > Addition > Addition` (38 Qs, `gen-num-add-00667`) — Pure 4-digit addition computation without problem-solving context.
3. `[5] numeracy > Number and Algebra > Subtraction > Subtraction` (38 Qs, `gen-num-sub-00668`) — Pure 4-digit subtraction computation without problem-solving context.
4. `[5] language_conventions > Syntax > Sentence structure > Sentence combining` (1 Q, `g5-icas-lang-synt-002`) — General sentence combining without specified conjunction/clause focus.
5. `[5] language_conventions > Conventions of language > General grammar review` (1 Q, `man-g5-lan-review-001`) — Generic mixed diagnostic item.
6. `[3] numeracy > General > Mixed arithmetic test item` (2 Qs) — Composite multi-skill diagnostic questions.

*Honest-empty beats wrongly-covered.*
