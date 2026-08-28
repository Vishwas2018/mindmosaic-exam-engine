# MindMosaic Victorian Curriculum Crosswalk Analysis Report

> **Phase**: Phase 1 (Review-Gated Proposal)  
> **Status**: Complete — Awaiting Human Approval  
> **Branch**: `agy/crosswalk-analysis` (Isolated worktree)  
> **Target Manifest**: `vic-f10-v2-l3-l5` (`content/curriculum-imports/vic-f10-v2-l3-l5.json`)  
> **Curriculum Scope**: Victorian Curriculum F–10 Version 2.0 (Level 3 and Level 5 Mathematics and English — 104 Content Descriptors)

---

## 1. Executive Summary

This report delivers the complete taxonomy extraction, scoping analysis, and proposed Victorian Curriculum v2.0 crosswalk mapping for MindMosaic's question bank.

In accordance with strict review gates:
1. **Zero application code or schema modifications** were made in this run. No database records were written, and no files under `src/` were modified.
2. The entire active question bank (**2,396 questions**) was extracted and collapsed into **1,049 distinct `(grade, subject, strand, topic, skill)` taxonomy tuples**.
3. Every tuple was evaluated under strict curriculum constraints:
   - **Grade 3** skills map strictly to **Level 3** nodes (`VC2M3*`, `VC2E3*`).
   - **Grade 5** skills map strictly to **Level 5** nodes (`VC2M5*`, `VC2E5*`).
   - Non-scope subjects (**Science: 99 Qs**, **Digital Technologies: 133 Qs**, **Standalone ICAS Spelling: 143 Qs**) are strictly marked `out_of_scope` without artificial force-fitting.
4. **Coverage Projection**:
   - **In-Scope Bank Questions**: 2,021 (84.35%) across 716 distinct taxonomy tuples.
   - **Out-of-Scope Bank Questions**: 375 (15.65%) across 333 distinct taxonomy tuples.
   - **Curriculum Node Badges**: **48 Covered** (≥5 Qs), **13 Partial** (1–4 Qs), **43 Empty** (Real Content Gaps).

---

## 2. Discovery of the Node Coverage Mechanism (Step 2)

Before designing the crosswalk, the existing curriculum platform architecture was inspected in:
- `src/server/curriculum/manifest-schema.ts`
- `src/features/curriculum/contracts.ts`
- `src/server/curriculum/postgres-catalogue.ts`
- `src/server/curriculum/importer.ts`
- `supabase/migrations/20260827090000_curriculum_platform_foundation.sql`

### Existing Architectural Entity: `taxonomyAlignments`

The platform specifies a first-class, review-governed entity for linking MindMosaic taxonomy skills to curriculum nodes: `curriculumTaxonomyAlignmentSchema`.

```typescript
export const curriculumTaxonomyAlignmentSchema = z.object({
  schemaVersion: z.literal(1),
  alignmentId: uuidSchema,
  curriculumReleaseId: uuidSchema,  // "f2000000-0000-4000-8000-000000000003" (vic-f10-v2)
  curriculumNodeId: uuidSchema,     // UUID of the curriculum descriptor node
  taxonomyId: stableKeySchema,      // e.g. "mindmosaic"
  taxonomyVersion: z.string(),      // e.g. "1.0"
  taxonomyNodeId: stableKeySchema.nullable(), // stable skill identifier or string
  relation: z.enum(["exact", "equivalent", "broader", "narrower", "related", "unmapped"]),
  rationale: z.string(),
  provenance: z.object({
    alignedBy: z.string(),
    alignedAt: dateTimeSchema,
  }),
  review: z.object({
    status: z.enum(["draft", "in_review", "approved", "rejected"]),
    reviewedBy: z.string().optional(),
    reviewedAt: dateTimeSchema.optional(),
  }),
  supersedesAlignmentId: uuidSchema.optional(),
});
```

### How Node Coverage is Counted & Resolved

1. **Database & Importer Storage**:
   - Alignments are stored in `public.curriculum_taxonomy_alignments`.
   - The CLI importer (`scripts/curriculum-import.mts` and `src/server/curriculum/importer.ts`) imports approved `taxonomyAlignments` from the JSON manifest into Postgres with append-only review events in `public.curriculum_review_events`.

2. **Catalogue Resolution**:
   - In `src/server/curriculum/postgres-catalogue.ts`, `PostgresCurriculumCatalogue.query()` performs a join between `public.curriculum_nodes` and `public.curriculum_taxonomy_alignments`, aggregating alignments into `row.taxonomy_alignments`.
   - The `CoverageResolver` evaluates the node and its alignments to produce:
     ```typescript
     {
       status: count > 0 ? "partial" : "none", // or "covered" when >= 5
       supportingContentCount: count,
       policyId: "curriculum-coverage-v1",
       computedAt: new Date().toISOString()
     }
     ```

3. **Parent UI Badge Mapping**:
   - In `src/features/curriculum/parent-content/index.ts` (`resolveCoverageBadge`), the parent UI maps the count directly to user-facing badges:
     - $\ge 5$ questions $\rightarrow$ 🟢 **Ready to practise** (`covered`)
     - $1 - 4$ questions $\rightarrow$ 🟡 **In development** (`partial`)
     - $0$ questions $\rightarrow$ ⚪ **Coming soon** (`empty`)

### Phase 2 Implementation Plan

In Phase 2, after human review and approval of `skill-code-mapping.csv`:
1. Each approved mapped skill tuple will be converted into a deterministic `curriculumTaxonomyAlignmentSchema` entry in `content/curriculum-imports/vic-f10-v2-l3-l5.json`.
2. The manifest importer will be executed (`npx tsx scripts/curriculum-import.mts --manifest content/curriculum-imports/vic-f10-v2-l3-l5.json --apply`).
3. The parent curriculum explorer at `/parent/curriculum-explorer` will automatically reflect the live badge states without requiring any parallel schema or custom coverage tables.

---

## 3. Taxonomy Extraction & Methodology

### Bank Sources Extracted

The analysis extracted every active question across three repositories:
1. **Curated Production Bank** (`src/content/questions/question-bank.ts`): 1,005 questions across Grade 3 and Grade 5.
2. **Interactive Practice Seeds** (`src/content/questions/generated/generated-questions.ts`): 1,103 template-generated practice items.
3. **Factory Published Questions** (`src/content/questions/generated/batch-published.json`): 288 factory-governed published items.
- **Combined Active Universe**: **2,396 distinct questions**.

### Taxonomy Tuple Collapse

Each question carries metadata: `(yearLevel, metadata.subject, metadata.strand, metadata.topic, metadata.skill)`.
- Enumerate all distinct combinations $\rightarrow$ **1,049 unique tuples**.
- This collapses 2,396 question-level decisions into 1,049 reviewed mappings.

### Strict Scoping Rules Applied

- **Maths**: NAPLAN Numeracy and ICAS Mathematics map exclusively to Victorian Curriculum Mathematics nodes (`VC2M3*` for Grade 3, `VC2M5*` for Grade 5).
- **English**: NAPLAN Reading, NAPLAN Language Conventions, and ICAS English map exclusively to Victorian Curriculum English nodes (`VC2E3*` for Grade 3, `VC2E5*` for Grade 5).
- **Out of Scope**:
  - **Science** (99 questions): ICAS Science has distinct outcomes outside F–10 Mathematics & English. Marked `out_of_scope`.
  - **Digital Technologies** (133 questions): Digital Systems, Programming, Spreadsheets are part of the Victorian Digital Technologies curriculum, not Maths/English. Marked `out_of_scope`.
  - **Standalone ICAS Spelling** (143 questions): Authored under the ICAS Spelling assessment model. (Integrated spelling skills within NAPLAN Language Conventions remain in-scope for English). Marked `out_of_scope`.

---

## 4. Headline Numbers & Metrics

| Metric | Count | Details |
| :--- | :---: | :--- |
| **Total Questions Analyzed** | **2,396** | 100% of active bank |
| **Distinct Taxonomy Tuples** | **1,049** | Extracted from metadata |
| **In-Scope Tuples** | **716** | Maths & English Grade 3/5 |
| **Out-of-Scope Tuples** | **333** | Science, Digital Tech, Standalone ICAS Spelling |
| **High Confidence Mappings** | **1,026** | 97.8% unambiguous |
| **Medium Confidence Mappings** | **23** | 2.2% require human confirmation |
| **Low Confidence Mappings** | **0** | 0.0% unresolvable ambiguities |
| **Total Curriculum Nodes** | **104** | Victorian Curriculum v2.0 Level 3 & Level 5 |
| **Projected Covered Nodes (≥5 Qs)** | **48** | 46.15% |
| **Projected Partial Nodes (1–4 Qs)** | **13** | 12.50% |
| **Projected Empty Nodes (0 Qs)** | **43** | 41.35% (Real content gaps) |

---

## 5. Skills Requiring Review (Medium Confidence Analysis)

All 23 medium-confidence tuples have been sorted to the top of `skill-code-mapping.csv`. Below is the detailed rationale for these decisions:

### A. Grade 3 Measurement: Area vs Perimeter (`VC2M3M01`)
- **Tuples**: Grade 3 Numeracy $\rightarrow$ Measurement and Geometry $\rightarrow$ Area / Perimeter calculations (`g3-nap-num-geo-001`, `g3-nap-num-geo-002`, `g3-icas-num-measures-001`, etc.).
- **Decision Rationale**: In Victorian Curriculum v2.0 Level 3, `VC2M3M01` covers *Metric measurement unit selection and benchmark estimation*. Specific rectangular area formulas and perimeter algorithms are formalized in Level 4/5. Mapping Grade 3 perimeter/area questions to `VC2M3M01` represents the closest developmental benchmark, but warrants educator review.

### B. Grade 3 Shape Geometry vs Spatial Mapping (`VC2M3SP02`)
- **Tuples**: Grade 3 Numeracy $\rightarrow$ 2D shape properties (sides, corners, symmetry) (`g3-nap-num-space-002`, `g3-icas-num-space-001`).
- **Decision Rationale**: Victorian v2.0 combines 3D objects into `VC2M3SP01` and 2D spatial positioning/mapping into `VC2M3SP02`. 2D shape identification has been mapped to `VC2M3SP02` (spatial geometry) as the best fit.

### C. Grade 3 General Arithmetic Fallbacks (`VC2M3N04`)
- **Tuples**: Practice items where the question prompt involves mixed multi-step arithmetic without an explicit single-operation tag.
- **Decision Rationale**: Mapped to `VC2M3N04` (place-value partitioning addition & subtraction) as the core computational foundation.

### D. Grade 5 Mathematical Problem Solving (`VC2M5N09`)
- **Tuples**: Grade 5 multi-step arithmetic word problems with multiple operations (`g5-icas-math-b01-014`, etc.).
- **Decision Rationale**: Mapped to `VC2M5N09` (*Mathematical modelling in practical additive and multiplicative problem solving*).

### E. Grade 3 & 5 General Language Conventions Mechanics (`VC2E3LY12` / `VC2E5LY11`)
- **Tuples**: Language conventions items testing composite sentence error-correction (e.g. `naplan-y3-language-f1-008`, `gen-lang-article-01081`).
- **Decision Rationale**: Mapped to the editing and proofreading descriptors (`VC2E3LY12` for L3, `VC2E5LY11` for L5).

---

## 6. Content Gap Analysis: Real Curriculum Nodes with No Active Content

Of the 104 Victorian Curriculum descriptors, **43 descriptors (41.35%)** have zero supporting items in the active question bank.

These gaps fall into three structural categories:

1. **Non-Exam Assessment Modalities (14 nodes)**:
   - *Oral Presentation & Active Listening*: `VC2E3LY01`, `VC2E3LY02`, `VC2E5LY01`, `VC2E5LY02`
   - *Collaborative Discussion & Social Register*: `VC2E3LA01`, `VC2E5LA01`
   - *Handwriting Legibility & Cursive Joins*: `VC2E3LY13`, `VC2E5LY12`
   - *Multimodal/Auditory Elements*: `VC2E3LA10`, `VC2E5LA07`
   - *Recommendation*: These descriptors assess physical/oral modalities that are outside the scope of written digital practice exams. In the Parent Explorer, these correctly display the honest ⚪ **Coming soon** badge with practical home activities.

2. **Extended Literary Analysis & Composition (14 nodes)**:
   - *Literature Personal Response & Historical Context*: `VC2E3LE01`, `VC2E3LE02`, `VC2E3LE05`, `VC2E5LE01`, `VC2E5LE02`, `VC2E5LE05`
   - *Complex Argument Construction & Genre Staging*: `VC2E5LA02`, `VC2E5LA03`, `VC2E5LA04`
   - *Recommendation*: Prime candidates for future Question Factory blueprint authoring (extended multi-paragraph reading and textual synthesis).

3. **Specialized Mathematical Topics (15 nodes)**:
   - *Mental Fact Families & Addition to 20*: `VC2M3A02`, `VC2M5A01`
   - *Physical Measurement Instruments*: `VC2M3M02` (reading scaled instruments)
   - *Chance & Experimental Probability*: `VC2M3P01`, `VC2M3P02`, `VC2M5P01`, `VC2M5P02` (coin tosses, repeated trials, sample spaces)
   - *Transformational Geometry*: `VC2M5SP03` (rotations, reflections, scale enlargement)
   - *Statistical Investigations*: `VC2M3ST03`, `VC2M5ST03`
   - *Recommendation*: Target these specific 15 mathematical nodes for Question Factory template generation in upcoming authoring cycles.

---

## 7. Review Gate Status & Next Steps

> [!IMPORTANT]
> **Phase 1 Complete — Gate Active**  
> This concludes Phase 1. All review artifacts are committed to branch `agy/crosswalk-analysis`.  
> No code changes, manifest edits, or database imports have been performed.

### Human Review Action Items:
1. Open `docs/curriculum/crosswalk/skill-code-mapping.csv` and inspect the top 23 rows (medium confidence).
2. Confirm or adjust the proposed Victorian Curriculum codes and rationales.
3. Review `docs/curriculum/crosswalk/projected-coverage.md` to verify expected coverage numbers.
4. Upon sign-off, trigger **Phase 2** to convert the approved crosswalk into `taxonomyAlignments` in `vic-f10-v2-l3-l5.json` and verify the parent explorer badges.
