# Curriculum Explorer Component Prototype

**Directory:** `prototypes/curriculum-explorer`  
**Purpose:** Standalone UI view-model and prototype contracts for the MindMosaic Parent Curriculum Explorer.  
**Audience:** Frontend Developers, UX Designers, and Codex Integration Engineers.

---

## 1. Component Architecture

The Curriculum Explorer is an interactive parent-facing component enabling parents to browse by Australian state/territory, school sector, curriculum level, and subject.

```
+-----------------------------------------------------------------------------------------------+
| CURRICULUM EXPLORER                                                                           |
| [ Jurisdiction: Victoria ▼ ]  [ Sector: Government ▼ ]  [ Level: Level 3 (Year 3) ▼ ]         |
| [ Subject: Mathematics (Victorian Curriculum V2.0) ▼ ]                                        |
+-----------------------------------------------------------------------------------------------+
| ℹ️  HOW VICTORIAN SCHOOLS TEACH THIS: Schools choose their own term sequence across the year. |
+-----------------------------------------------------------------------------------------------+
| STRANDS: [ Number (24 Qs) ]  [ Algebra (14 Qs) ]  [ Measurement (16 Qs) ]  [ Space (12 Qs) ]  |
+-----------------------------------------------------------------------------------------------+
| +-------------------------------------------------------------------------------------------+ |
| | [VC2M3N01] Understanding 4-Digit Numbers and Place Value          [ Ready to Practise ]   | |
| | In Plain English: Children learn how to read, write, and break apart 4-digit numbers...   | |
| | [⭐ 2 Home Activities]  [📚 VCAA Source: f10.vcaa.vic.edu.au]     [ Practise Skill (5 Qs) >]| |
| +-------------------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------------------+
```

---

## 2. Included Prototype Assets

1. **`mock-explorer-view.json`**: Pre-rendered client-ready view-model combining jurisdiction metadata, strand tabs, enriched parent cards, and practice action links.
2. **State Transition Demonstrations**: Verified JSON contracts for `covered`, `partial`, `empty`, `transitional`, `unavailable`, and `unverified`.

---

## 3. Integration Guidelines

*   Mark all data loaders with `import "server-only";` when fetching from Supabase or static JSON fixtures.
*   Validate all query outputs against `curriculumCatalogueResultSchema` from `src/features/curriculum/contracts.ts`.
*   Ensure zero mutation to assessment scoring boundaries.
