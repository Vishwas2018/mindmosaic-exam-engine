# Victorian Curriculum F–10 Version 2.0 (Levels 3 and 5) Manifest & Import Implementation Report

**Date:** 2026-08-28  
**Author:** Antigravity Agent  
**Branch:** `agy/curriculum-vic-l3-l5-manifest`  
**Base Commit:** `f6dda9117ca1f358f51a98712c431b1c956de444` (`agy/curriculum-catalogue-adapter-import-pipeline`)  
**Status:** Completed & Verified  

---

## 1. Executive Summary

This report documents the creation, validation, database application, and catalogue adapter verification of the authoritative, metadata-only import manifest for the **Victorian Curriculum F–10 Version 2.0** (Mathematics and English for **Level 3** and **Level 5**).

The manifest is authored in strict compliance with ADR-016 and the data-only boundaries of this task:
- **No code modifications:** All adapter, importer, manifest schema, contracts, migrations, and UI code remain byte-identical to base commit `f6dda9117ca1f358f51a98712c431b1c956de444`.
- **Strict Metadata-Only Licensing:** Every node enforces `officialTextAccess: "metadata_only"` and `officialText: undefined`. Zero official descriptive text, elaborations, or achievement standards from the Victorian Curriculum and Assessment Authority (VCAA) are stored or reproduced.
- **MindMosaic-Original Titles:** Every node title is written originally in MindMosaic's own words based on mathematical and linguistic concepts without copying VCAA prose.
- **Genuine Source Snapshots & Cryptographic Fingerprints:** Authoritative web snapshots from `f10.vcaa.vic.edu.au` were retrieved, saved byte-identically under `content/curriculum-sources/snapshots/`, and hashed to generate verifiable SHA-256 digests.
- **Exact Node Enumeration:** The VCAA source enumeration perfectly matches the required 104 nodes across all 6 Mathematics strands and 3 English strands for Levels 3 and 5.

---

## 2. Source Authority, Snapshot & Fingerprint Status

All source data was retrieved directly from the official VCAA Victorian Curriculum F–10 Version 2.0 portal (`https://f10.vcaa.vic.edu.au/`).

| Source Component | Source URL | Local Snapshot Path | SHA-256 Digest |
| :--- | :--- | :--- | :--- |
| **Portal Root** | `https://f10.vcaa.vic.edu.au/` | `content/curriculum-sources/snapshots/vcaa-f10-portal-root.html` | `e95cce0561224d133f8bddd0ed747e029ab4fd69e2d8319b37fb6343e5279c67` |
| **Copyright Statement** | `https://f10.vcaa.vic.edu.au/copyright-statement` | `content/curriculum-sources/snapshots/vcaa-f10-v2-copyright-statement.html` | `c6364c30bbc1ff0567a9a84e0d10260f5e1c51c3027c9d1b166e5eb822c9004d` |
| **Mathematics Curriculum** | `https://f10.vcaa.vic.edu.au/learning-areas/mathematics/curriculum` | `content/curriculum-sources/snapshots/vcaa-f10-v2-mathematics-curriculum.html` | `85d609caae81dd0e98e9f7b435a87fed05866553e49328698f303cf7e7f47e7c` |
| **English Curriculum** | `https://f10.vcaa.vic.edu.au/learning-areas/english/english/curriculum` | `content/curriculum-sources/snapshots/vcaa-f10-v2-english-curriculum.html` | `3489613d5fbe4fffa3232c5d57393f645bd9fda60eb0d920f6284db38e2af38e` |

---

## 3. Node Enumeration & Strand Split

The manifest contains exactly **104 nodes** (54 for Level 3, 50 for Level 5), with zero discrepancies between the VCAA source publication and the target counts.

### 3.1 Mathematics (48 nodes total)

#### Mathematics Level 3 (24 nodes)
- **Number (9 nodes):** `VC2M3N01`, `VC2M3N02`, `VC2M3N03`, `VC2M3N04`, `VC2M3N05`, `VC2M3N06`, `VC2M3N07`, `VC2M3N08`, `VC2M3N09`
- **Algebra (3 nodes):** `VC2M3A01`, `VC2M3A02`, `VC2M3A03`
- **Measurement (5 nodes):** `VC2M3M01`, `VC2M3M02`, `VC2M3M03`, `VC2M3M04`, `VC2M3M05`
- **Space (2 nodes):** `VC2M3SP01`, `VC2M3SP02`
- **Statistics (3 nodes):** `VC2M3ST01`, `VC2M3ST02`, `VC2M3ST03`
- **Probability (2 nodes):** `VC2M3P01`, `VC2M3P02`

#### Mathematics Level 5 (24 nodes)
- **Number (10 nodes):** `VC2M5N01`, `VC2M5N02`, `VC2M5N03`, `VC2M5N04`, `VC2M5N05`, `VC2M5N06`, `VC2M5N07`, `VC2M5N08`, `VC2M5N09`, `VC2M5N10`
- **Algebra (2 nodes):** `VC2M5A01`, `VC2M5A02`
- **Measurement (4 nodes):** `VC2M5M01`, `VC2M5M02`, `VC2M5M03`, `VC2M5M04`
- **Space (3 nodes):** `VC2M5SP01`, `VC2M5SP02`, `VC2M5SP03`
- **Statistics (3 nodes):** `VC2M5ST01`, `VC2M5ST02`, `VC2M5ST03`
- **Probability (2 nodes):** `VC2M5P01`, `VC2M5P02`

### 3.2 English (56 nodes total)

#### English Level 3 (30 nodes)
- **Language (12 nodes):**
  - *Language for interacting with others (2):* `VC2E3LA01`, `VC2E3LA02`
  - *Text structure and organisation (3):* `VC2E3LA03`, `VC2E3LA04`, `VC2E3LA05`
  - *Language for expressing and developing ideas (7):* `VC2E3LA06`, `VC2E3LA07`, `VC2E3LA08`, `VC2E3LA09`, `VC2E3LA10`, `VC2E3LA11`, `VC2E3LA12`
- **Literature (5 nodes):**
  - *Literature and contexts (1):* `VC2E3LE01`
  - *Engaging with and responding to literature (1):* `VC2E3LE02`
  - *Examining literature (2):* `VC2E3LE03`, `VC2E3LE04`
  - *Creating literature (1):* `VC2E3LE05`
- **Literacy (13 nodes):**
  - *Interacting with others (2):* `VC2E3LY01`, `VC2E3LY02`
  - *Phonic and word knowledge (4):* `VC2E3LY03`, `VC2E3LY04`, `VC2E3LY05`, `VC2E3LY06`
  - *Building fluency and making meaning (1):* `VC2E3LY07`
  - *Texts in context (1):* `VC2E3LY08`
  - *Analysing, interpreting and evaluating (2):* `VC2E3LY09`, `VC2E3LY10`
  - *Creating texts (3):* `VC2E3LY11`, `VC2E3LY12`, `VC2E3LY13`

#### English Level 5 (26 nodes)
- **Language (9 nodes):**
  - *Language for interacting with others (2):* `VC2E5LA01`, `VC2E5LA02`
  - *Text structure and organisation (2):* `VC2E5LA03`, `VC2E5LA04`
  - *Language for expressing and developing ideas (5):* `VC2E5LA05`, `VC2E5LA06`, `VC2E5LA07`, `VC2E5LA08`, `VC2E5LA09`
- **Literature (5 nodes):**
  - *Literature and contexts (1):* `VC2E5LE01`
  - *Engaging with and responding to literature (1):* `VC2E5LE02`
  - *Examining literature (2):* `VC2E5LE03`, `VC2E5LE04`
  - *Creating literature (1):* `VC2E5LE05`
- **Literacy (12 nodes):**
  - *Interacting with others (2):* `VC2E5LY01`, `VC2E5LY02`
  - *Phonic and word knowledge (3):* `VC2E5LY03`, `VC2E5LY04`, `VC2E5LY05`
  - *Building fluency and making meaning (1):* `VC2E5LY06`
  - *Texts in context (1):* `VC2E5LY07`
  - *Analysing, interpreting and evaluating (2):* `VC2E5LY08`, `VC2E5LY09`
  - *Creating texts (3):* `VC2E5LY10`, `VC2E5LY11`, `VC2E5LY12`

### 3.3 Summary Breakdown Table

| Learning Area | Level | Strands | Substrands Present | Node Count |
| :--- | :--- | :--- | :--- | :--- |
| **Mathematics** | Level 3 (Year 3) | Number (9), Algebra (3), Measurement (5), Space (2), Statistics (3), Probability (2) | N/A | **24** |
| **Mathematics** | Level 5 (Year 5) | Number (10), Algebra (2), Measurement (4), Space (3), Statistics (3), Probability (2) | N/A | **24** |
| **English** | Level 3 (Year 3) | Language (12), Literature (5), Literacy (13) | 10 sub-strands | **30** |
| **English** | Level 5 (Year 5) | Language (9), Literature (5), Literacy (12) | 10 sub-strands | **26** |
| **Total** | | | | **104** |

---

## 4. Licensing and Content Integrity Notes

1. **Licence Details:** The VCAA publishes the Victorian Curriculum F–10 under the Creative Commons Attribution-NonCommercial 3.0 Australia licence (`CC BY-NC 3.0 AU`).
2. **Commercial Restriction & Metadata-Only Status:** Because MindMosaic provides commercial and subscription-supported educational services, CC BY-NC 3.0 AU does not grant automatic permission to store or display official VCAA text without an explicit commercial licence agreement from the VCAA Copyright Manager.
3. **Fail-Closed Enforcement:**
   - `licenceEvidence.permitsStorage` = `false`
   - `licenceEvidence.permitsDisplay` = `false`
   - `sources[0].licence.officialTextAccess` = `"metadata_only"`
   - `nodes[*].officialText` is completely omitted / undefined.
4. **Originality Guarantee:** All labels in `content/curriculum-imports/vic-f10-v2-l3-l5.json` were authored originally by MindMosaic to summarize mathematical and linguistic concepts without copying VCAA content-description text or elaborations.

---

## 5. Verification Command Logs & Exit Codes

### 5.1 CLI Manifest Validation (`--validate-only`)
```bash
npm run curriculum:import -- --manifest content/curriculum-imports/vic-f10-v2-l3-l5.json --validate-only
```
**Exit Code:** `0`  
**Output:**
```
> mindmosaic-exam-engine@0.1.0 curriculum:import
> tsx scripts/curriculum-import.mts --manifest content/curriculum-imports/vic-f10-v2-l3-l5.json --validate-only

Curriculum Import Report (validate_only):
Manifest: vic-f10-v2-l3-l5
Success:  YES
Duration: 8ms
Entities:
  - Evidence:         0 inserted, 1 skipped
  - Sources:          0 inserted, 1 skipped
  - Releases:         0 inserted, 1 skipped
  - Nodes:            0 inserted, 104 skipped
  - Applicabilities:  0 inserted, 104 skipped
  - Crosswalks:       0 inserted, 0 skipped
  - Alignments:       0 inserted, 0 skipped
  - Review Events:    0 inserted, 0 skipped
```

### 5.2 CLI Dry Run Simulation (`--dry-run`)
```bash
npm run curriculum:import -- --manifest content/curriculum-imports/vic-f10-v2-l3-l5.json --dry-run
```
**Exit Code:** `0`  
**Output:**
```
> mindmosaic-exam-engine@0.1.0 curriculum:import
> tsx scripts/curriculum-import.mts --manifest content/curriculum-imports/vic-f10-v2-l3-l5.json --dry-run

Curriculum Import Report (dry_run):
Manifest: vic-f10-v2-l3-l5
Success:  YES
Duration: 908ms
Entities:
  - Evidence:         1 inserted, 0 skipped
  - Sources:          1 inserted, 0 skipped
  - Releases:         1 inserted, 0 skipped
  - Nodes:            104 inserted, 0 skipped
  - Applicabilities:  104 inserted, 0 skipped
  - Crosswalks:       0 inserted, 0 skipped
  - Alignments:       0 inserted, 0 skipped
  - Review Events:    0 inserted, 0 skipped
```

### 5.3 Database Apply (`--apply`)
```bash
npm run curriculum:import -- --manifest content/curriculum-imports/vic-f10-v2-l3-l5.json --apply
```
**Exit Code:** `0`  
**Output:**
```
> mindmosaic-exam-engine@0.1.0 curriculum:import
> tsx scripts/curriculum-import.mts --manifest content/curriculum-imports/vic-f10-v2-l3-l5.json --apply

Curriculum Import Report (apply):
Manifest: vic-f10-v2-l3-l5
Success:  YES
Duration: 918ms
Entities:
  - Evidence:         1 inserted, 0 skipped
  - Sources:          1 inserted, 0 skipped
  - Releases:         1 inserted, 0 skipped
  - Nodes:            104 inserted, 0 skipped
  - Applicabilities:  104 inserted, 0 skipped
  - Crosswalks:       0 inserted, 0 skipped
  - Alignments:       0 inserted, 0 skipped
  - Review Events:    0 inserted, 0 skipped
```

### 5.4 Adapter Query Verification Across Filters & Strands
Executed against live PostgreSQL database with `PostgresCurriculumCatalogue`:
```
=== 1. Total VIC catalogue query (with pagination) ===
Total VIC nodes reported in count: 104
Page 1 returned items: 100
Next cursor: PRESENT
Page 2 returned items: 4
Total retrieved items across pages: 104

=== 2. Filter by Level 3 (levelCodes: ['VIC-L3']) ===
Level 3 nodes: 54, items: 54

=== 3. Filter by Level 5 (levelCodes: ['VIC-L5']) ===
Level 5 nodes: 50, items: 50

=== 4. Filter by Year 3 (yearLevels: [3]) ===
Year 3 nodes: 54, items: 54

=== 5. Filter by Year 5 (yearLevels: [5]) ===
Year 5 nodes: 50, items: 50

=== 6. Strand Breakdown Verification ===
{
  "Math L3": {
    "Number": 9,
    "Algebra": 3,
    "Measurement": 5,
    "Space": 2,
    "Statistics": 3,
    "Probability": 2
  },
  "Math L5": {
    "Number": 10,
    "Algebra": 2,
    "Measurement": 4,
    "Space": 3,
    "Statistics": 3,
    "Probability": 2
  },
  "English L3": {
    "Language": 12,
    "Literature": 5,
    "Literacy": 13
  },
  "English L5": {
    "Language": 9,
    "Literature": 5,
    "Literacy": 12
  }
}

=== ALL ADAPTER QUERY CHECKS PASSED PERFECTLY ===
```

### 5.5 TypeScript Typecheck (`npm run typecheck`)
```bash
npm run typecheck
```
**Exit Code:** `0`  
**Output:**
```
> mindmosaic-exam-engine@0.1.0 typecheck
> tsc --noEmit
```

### 5.6 ESLint (`npm run lint`)
```bash
npm run lint
```
**Exit Code:** `0`  
**Output:**
```
> mindmosaic-exam-engine@0.1.0 lint
> eslint .
```

### 5.7 Guarded Full RLS Test Suite (`npm run test:rls:ci`)
```bash
npm run test:rls:ci
```
**Exit Code:** `0`  
**Output:**
```
 Test Files  30 passed (30)
      Tests  467 passed (467)
   Start at  22:28:11
   Duration  56.12s (transform 4.44s, setup 0ms, import 5.97s, tests 49.50s, environment 0ms)

JSON report written to C:/Users/vishw/AppData/Local/Temp/vitest-guard-skZfh0/report.json

Complete run (rls): 30 file(s), 467 test(s), all concluded, none failed.
```

### 5.8 Guarded Full Unit Test Suite (`npm run test:ci`)
```bash
npm run test:ci
```
**Exit Code:** `0`  
**Output:**
```
 Test Files  264 passed (264)
      Tests  4940 passed (4940)
   Start at  22:40:23
   Duration  518.22s (transform 28.61s, setup 159.89s, import 151.36s, tests 314.42s, environment 326.61s)

JSON report written to C:/Users/vishw/AppData/Local/Temp/vitest-guard-6zhSpu/report.json

Complete run (unit): 264 file(s), 4940 test(s), all concluded, none failed.
```

### 5.9 Next.js Production Build
```bash
npx next build --webpack
```
**Exit Code:** `0`  
**Output:**
```
✓ Compiled successfully in 54s
  Running TypeScript ...
  Finished TypeScript in 39.1s ...
  Collecting page data using 21 workers ...
✓ Generating static pages using 21 workers (53/53) in 2.4s
  Finalizing page optimization ...
  Collecting build traces ...
```

---

## 6. Code Immutability Verification

To ensure zero modifications to existing adapter, schema, contract, migration, or UI code, `git diff` against base commit `f6dda9117ca1f358f51a98712c431b1c956de444` was verified:

```bash
git diff f6dda9117ca1f358f51a98712c431b1c956de444 -- src/ features/ supabase/
```
**Result:** Empty diff (0 lines changed across all tracked source files). `src/features/curriculum/jurisdictions.ts` and all files in `src/server/curriculum/*.ts` remain byte-identical to `f6dda9117ca1f358f51a98712c431b1c956de444`.

---

## 7. Remaining Risks & Future Work

1. **Official Text Display Licensing:** If MindMosaic intends to display verbatim VCAA content descriptions in teacher or parent views in the future, explicit commercial licensing permission must be sought from the VCAA Copyright Manager. Until then, `officialTextAccess` remains safely locked to `metadata_only`.
2. **Crosswalk Ingestion:** AC9-to-VIC crosswalks and MindMosaic internal taxonomy alignments can be authored as separate reviewed import manifests using `curriculum_crosswalks` and `curriculum_taxonomy_alignments` without requiring changes to the underlying node identities established here.
3. **Levels F–2 and 4, 6–10 Ingestion:** Additional year levels (Foundation to Level 10) can be incrementally ingested using the same snapshot-backed metadata manifest structure.
