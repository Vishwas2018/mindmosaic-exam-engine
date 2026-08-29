# Parent Information Content Model & Schema Specification

**Document ID:** `DOC-CURR-003`  
**Effective Date / Version:** 28 August 2026 / Version 2.0 (Hardened)  
**Author:** Antigravity (Curriculum Research & Planning Pack)  
**Target Repository Branch:** `gemini/curriculum-catalogue-planning`  
**Scope:** Dedicated parent-facing presentation model, independent of internal assessment-runtime schemas (`CurriculumCatalogueResult`).

---

## 1. Purpose & Core Principles

This document specifies MindMosaic's **Parent Information Content Model**. It defines how curriculum concepts are translated into clear, jargon-free explanations, practical home activities, and transparent provenance records for Australian families.

### Guiding Pedagogical & Engineering Principles:
1. **Plain-English Clarity:** Translates statutory curriculum outcomes into clear, child-friendly explanations accessible to all parents.
2. **Actionable Home Activities:** Provides low-barrier, everyday activities (in the kitchen, car, shopping, or bedtime reading) that families can do together without turning home into a testing room.
3. **School Autonomy Respect:** Explicitly explains that curriculum authorities set year/level milestones, but **individual schools and teachers decide their own term sequencing** (Terms 1ΓÇô4).
4. **Honest Alignment & Practice Status:** Does not fabricate practice coverage. Nodes without verified active test items default to `unverified` or `empty` with zero question counts.
5. **Full 8 Learning Areas & Capabilities Support:** Uses extensible, stable identifiers covering all Australian and state learning areas and capabilities.

---

## 2. Formal Zod Schema: `ParentCurriculumCard`

Below is the verified Zod schema for the Parent Curriculum presentation model:

```typescript
import { z } from "zod";

/** Stable identifiers for all 8 Australian & Victorian learning areas */
export const parentLearningAreaSchema = z.enum([
  "english",
  "mathematics",
  "science",
  "humanities_and_social_sciences",
  "the_arts",
  "technologies",
  "health_and_physical_education",
  "languages",
  "critical_and_creative_thinking",
  "ethical_capability",
  "intercultural_capability",
  "personal_and_social_capability",
]);
export type ParentLearningArea = z.infer<typeof parentLearningAreaSchema>;

export const parentActivityContextSchema = z.enum([
  "kitchen",
  "shopping",
  "travel_car",
  "bedtime_reading",
  "outdoor",
  "general_tabletop",
]);

export const parentPracticeStatusSchema = z.enum([
  "covered",       // >= 5 verified active questions in MindMosaic bank
  "partial",       // 1-4 active questions in MindMosaic bank
  "empty",         // 0 active questions in MindMosaic bank
  "transitional",  // Framework undergoing syllabus reform (e.g. V1 -> V2)
  "unavailable",   // Classroom/oral assessment only, out of digital test scope
  "unverified",    // Alignment or practice bank mapping not yet verified
]);

export const parentCurriculumCardSchema = z.object({
  /** Official alphanumeric code from authority (e.g. VC2M3N01, MA2-RN-01, AC9M3N01) */
  officialCode: z.string().trim().min(1).max(80),
  
  /** Extensible stable learning area identifier */
  learningArea: parentLearningAreaSchema,
  
  /** Strand name */
  strand: z.string().trim().min(1).max(120),
  
  /** Sub-strand name (if applicable) */
  subStrand: z.string().trim().min(1).max(120).optional(),
  
  /** Parent-friendly skill title */
  parentTitle: z.string().trim().min(3).max(180),
  
  /** What students learn across the year/level/band */
  whatStudentsLearn: z.string().trim().min(20).max(2000),
  
  /** Plain-English conceptual explanation */
  whatThisMeans: z.string().trim().min(20).max(2000),
  
  /** Why this concept matters for future learning and everyday life */
  whyItMatters: z.string().trim().min(20).max(2000),
  
  /** Actionable everyday family activities */
  homeActivities: z.array(
    z.object({
      title: z.string().trim().min(2).max(120),
      description: z.string().trim().min(10).max(1000),
      context: parentActivityContextSchema,
      estimatedMinutes: z.number().int().min(1).max(60),
    })
  ).min(1).max(6),
  
  /** Practice readiness status (honest baseline) */
  practiceStatus: z.object({
    status: parentPracticeStatusSchema,
    availableQuestionCount: z.number().int().nonnegative(),
    recommendedDrillPath: z.string().nullable().optional(),
    statusExplanation: z.string().trim().min(5).max(500),
  }),
  
  /** Pedagogical alignment verification fields */
  alignmentStatus: z.enum(["unverified", "in_review", "verified"]),
  verifiedBy: z.string().trim().nullable(),
  verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD").nullable(),
  verificationSourceUrl: z.string().url(),
}).strict();

export type ParentCurriculumCard = z.infer<typeof parentCurriculumCardSchema>;
```

---

## 3. Dedicated Presentation Model vs Runtime Contract Separation

> [!IMPORTANT]
> The `ParentCurriculumCard` schema is a **dedicated presentation model** designed for client rendering in the Parent Learning Hub. It is distinct from the internal assessment-runtime `CurriculumCatalogueResult` defined in `src/features/curriculum/contracts.ts`.
> 
> - **Codex Assessment Runtime Contract (`CurriculumCatalogueResult`):** Normalised graph structure containing relational sources, releases, nodes, applicabilities, crosswalks, taxonomy alignments, and live computed coverage counts.
> - **Parent Presentation Model (`ParentCurriculumCard`):** Denormalised, consumer-friendly presentation payload containing plain-English descriptions, home activity cards, school sequencing notices, and outbound official verification links.

---

## 4. Baseline Practice Policy

To prevent any misleading coverage claims:
- All new research mock records default to:
  ```json
  "practiceStatus": {
    "status": "unverified",
    "availableQuestionCount": 0,
    "recommendedDrillPath": null,
    "statusExplanation": "Curriculum mapping documented; practice question availability has not yet been computed from the live MindMosaic content bank."
  },
  "alignmentStatus": "unverified",
  "verifiedBy": null,
  "verifiedAt": null
  ```
- Illustrative practice demonstrations (showing `covered`, `partial`, `empty`, etc.) are isolated strictly to synthetic fixtures in `content/curriculum-mocks/catalogue-states-fixtures.json` using synthetic identifiers (`SYNTH-*`).
