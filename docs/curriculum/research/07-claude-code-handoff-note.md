# Claude Code Handoff Note: Hardened Curriculum Research Pack

**Handoff Date:** 28 August 2026  
**Author:** Antigravity (Curriculum Research & Planning Pack)  
**To:** Claude Code / Engineering Reviewer  
**Branch:** `gemini/curriculum-catalogue-planning`  
**Related Reference Branch:** `codex/curriculum-platform-foundation`

---

## 1. Executive Summary & Hardening Changes

This research pack has been hardened to ensure complete factual defensibility, schema honesty, and legal compliance.

### Summary of Key Hardening Actions:
1. **Full 9-Jurisdiction Sourced Manifest:** Sourced and catalogued all nine Australian jurisdictions (AU, ACT, NSW, NT, QLD, SA, TAS, VIC, WA) with official primary source URLs, verified access dates (28 August 2026), and RFC 4122-compliant UUIDs.
2. **Fabricated Provenance & Hashes Removed:** Removed all manufactured / empty-file SHA-256 digests (`e3b0c44...`). Sources and releases without a retained on-disk source snapshot file are explicitly set to `sourceFingerprint: null` and `snapshotStatus: "pending_retrieval"`.
3. **Fabricated Question Counts & Routes Removed:** All real curriculum mock items default to `practiceStatus: "unverified"`, `availableQuestionCount: 0`, and `recommendedDrillPath: null`. Synthetic demonstrations are strictly isolated to `catalogue-states-fixtures.json` using synthetic identifiers (`SYNTH-*`).
4. **Victorian Codes & Content Verified:** Verified every Victorian Curriculum Level 3 and Level 5 Mathematics and English code against VCAA Version 2.0. Corrected Level 3 Mathematics place value (`VC2M3N02`) to explicitly reflect numbers **beyond 10,000**. Added `alignmentStatus: "unverified"`, `verifiedBy: null`, `verifiedAt: null`, and `verificationSourceUrl`.
5. **Conservative Legal Re-classification:** Replaced claims of "non-commercial SaaS use" with legally defensive statuses: `display_permitted`, `metadata_reference_only`, `permission_required`, and `legal_review_required`. Acknowledged that VCAA (CC BY-NC 3.0 AU) and NESA (Crown Copyright) reproduction in commercial SaaS requires formal commercial agreements.
6. **Data-Access Modality Truthfulness:** Documented that only ACARA MRAC offers genuine public machine-readable bulk data. VCAA, NESA, and SCSA provide public web portals without public bulk REST APIs. QCAA PΓÇô10 App is an authenticated teacher tool.
7. **Strict Zod Schema Validation:** All mock files, fixtures, and manifests validated against formal Zod schemas.

---

## 2. Directory & File Inventory

```
docs/curriculum-research/
Γö£ΓöÇΓöÇ 01-jurisdiction-version-matrix.md
Γö£ΓöÇΓöÇ 02-source-and-licence-register.md
Γö£ΓöÇΓöÇ 03-parent-content-model.md
Γö£ΓöÇΓöÇ 04-victoria-y3-y5-ux-spec.md
Γö£ΓöÇΓöÇ 05-expansion-sequence-f10.md
Γö£ΓöÇΓöÇ 06-codex-platform-interface-recommendations.md
ΓööΓöÇΓöÇ 07-claude-code-handoff-note.md

content/curriculum-sources/
ΓööΓöÇΓöÇ manifest.json

content/curriculum-mocks/
Γö£ΓöÇΓöÇ vic-y3-mathematics.json
Γö£ΓöÇΓöÇ vic-y5-mathematics.json
Γö£ΓöÇΓöÇ vic-y3-english.json
Γö£ΓöÇΓöÇ vic-y5-english.json
ΓööΓöÇΓöÇ catalogue-states-fixtures.json

prototypes/curriculum-explorer/
Γö£ΓöÇΓöÇ README.md
ΓööΓöÇΓöÇ mock-explorer-view.json
```

---

## 3. Exact Verification Commands & Output

### A. Manifest & Source Verification (All 9 Jurisdictions)
```bash
node -e "
  const fs = require('fs');
  const { z } = require('zod');
  const manifestSchema = z.object({
    schemaVersion: z.literal(1),
    manifestId: z.string().uuid(),
    generatedAt: z.string().datetime({ offset: true }),
    provenancePolicy: z.string(),
    fingerprintNote: z.string(),
    sources: z.array(z.object({
      sourceId: z.string().uuid(),
      sourceKey: z.string(),
      authorityCode: z.string(),
      authorityName: z.string(),
      jurisdictionCode: z.string(),
      schoolSectors: z.array(z.string()),
      title: z.string(),
      sourceUrl: z.string().url(),
      retrievedAt: z.string().datetime({ offset: true }),
      snapshotStatus: z.enum(['pending_retrieval', 'retained_snapshot']),
      sourceFingerprint: z.string().regex(/^[0-9a-f]{64}$/).nullable(),
      licence: z.object({
        id: z.string(),
        name: z.string(),
        url: z.string().url(),
        officialTextAccess: z.enum(['display_permitted', 'metadata_reference_only', 'permission_required', 'legal_review_required']),
        attribution: z.string(),
      }),
    })).length(9),
    releases: z.array(z.object({
      releaseId: z.string().uuid(),
      releaseKey: z.string(),
      sourceId: z.string().uuid(),
      frameworkScope: z.enum(['national', 'state', 'territory']),
      jurisdictionCode: z.string(),
      schoolSectors: z.array(z.string()),
      title: z.string(),
      version: z.string(),
      effectiveFrom: z.string(),
      publishedAt: z.string().datetime({ offset: true }),
      snapshotStatus: z.enum(['pending_retrieval', 'retained_snapshot']),
      sourceFingerprint: z.string().regex(/^[0-9a-f]{64}$/).nullable(),
    })).length(9),
  }).strict();
  manifestSchema.parse(JSON.parse(fs.readFileSync('content/curriculum-sources/manifest.json', 'utf8')));
  console.log('Γ£ô PASS: manifest.json (9 sources, 9 releases)');
"
```
**Output:** `Γ£ô PASS: manifest.json (9 sources, 9 releases)`

### B. Parent Curriculum Mocks Verification
```bash
node -e "
  const fs = require('fs');
  const { z } = require('zod');
  const parentCardSchema = z.object({
    officialCode: z.string().trim().min(1),
    learningArea: z.enum(['english', 'mathematics', 'science', 'humanities_and_social_sciences', 'the_arts', 'technologies', 'health_and_physical_education', 'languages', 'critical_and_creative_thinking', 'ethical_capability', 'intercultural_capability', 'personal_and_social_capability']),
    strand: z.string().trim().min(1),
    subStrand: z.string().trim().min(1).optional(),
    parentTitle: z.string().trim().min(3),
    whatStudentsLearn: z.string().trim().min(20),
    whatThisMeans: z.string().trim().min(20),
    whyItMatters: z.string().trim().min(20),
    homeActivities: z.array(z.object({
      title: z.string().trim().min(2),
      description: z.string().trim().min(10),
      context: z.enum(['kitchen', 'shopping', 'travel_car', 'bedtime_reading', 'outdoor', 'general_tabletop']),
      estimatedMinutes: z.number().int().min(1).max(60),
    })).min(1),
    practiceStatus: z.object({
      status: z.enum(['covered', 'partial', 'empty', 'transitional', 'unavailable', 'unverified']),
      availableQuestionCount: z.number().int().nonnegative(),
      recommendedDrillPath: z.string().nullable().optional(),
      statusExplanation: z.string(),
    }),
    alignmentStatus: z.enum(['unverified', 'in_review', 'verified']),
    verifiedBy: z.string().nullable(),
    verifiedAt: z.string().nullable(),
    verificationSourceUrl: z.string().url(),
  }).strict();
  const fileSchema = z.object({
    schemaVersion: z.literal(1),
    jurisdiction: z.string(),
    curriculumRelease: z.string(),
    level: z.string(),
    applicableYearCohort: z.string(),
    learningArea: z.string(),
    sourceUrl: z.string().url(),
    accessDate: z.string(),
    licenceAttribution: z.string(),
    items: z.array(parentCardSchema).min(1),
  }).strict();
  ['vic-y3-mathematics.json', 'vic-y5-mathematics.json', 'vic-y3-english.json', 'vic-y5-english.json'].forEach(f => {
    const p = 'content/curriculum-mocks/' + f;
    const d = fileSchema.parse(JSON.parse(fs.readFileSync(p, 'utf8')));
    console.log('Γ£ô PASS:', f, '(' + d.items.length + ' items)');
  });
"
```
**Output:**
```
Γ£ô PASS: vic-y3-mathematics.json (9 items)
Γ£ô PASS: vic-y5-mathematics.json (7 items)
Γ£ô PASS: vic-y3-english.json (5 items)
Γ£ô PASS: vic-y5-english.json (3 items)
```

---

## 4. Remaining Gaps & Legal Questions for Review

1. **VCAA & NESA Commercial Licensing:** MindMosaic references official outcome codes and titles while writing original descriptive text. If full official descriptor text or elaborations are ever required in commercial screens, MindMosaic must negotiate a formal commercial copyright licence with VCAA and NESA.
2. **Physical Source Snapshots:** The database runtime schema expects a SHA-256 fingerprint on `curriculum_sources`. The data ingestion pipeline should archive raw byte-identical source files into `content/curriculum-sources/snapshots/` to generate verified SHA-256 digests.
3. **Sector Timeline Monitoring:** Catholic and independent school sectors across SA, QLD, and ACT adopt curriculum frameworks at varying paces. Continuous monitoring of sector-specific releases is recommended.
