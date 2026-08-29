# Codex Platform Interface Recommendations (Curriculum Catalogue Engine)

**Document ID:** `DOC-CURR-006`  
**Effective Date / Version:** 28 August 2026 / Version 2.0 (Hardened)  
**Author:** Antigravity (Curriculum Research & Planning Pack)  
**Target Repository Branch:** `gemini/curriculum-catalogue-planning`  
**Audience:** Codex Foundation Platform Engineers & Database Architects

---

## 1. Architecture Boundaries & Clean Separation

The curriculum catalogue engine provides the structural spine connecting statutory authorities (ACARA, VCAA, NESA) to MindMosaic's internal question taxonomy and parent experience.

```
+---------------------------------------------------------------------------------------------------+
| STATUTORY SOURCES (ACARA, VCAA, NESA)                                                             |
+---------------------------------------------------------------------------------------------------+
                                         Γöé  (Verified Ingestion & Retained Snapshots)
                                         Γû╝
+---------------------------------------------------------------------------------------------------+
| DATABASE RUNTIME CONTRACTS (src/features/curriculum/contracts.ts)                                 |
| - curriculum_sources                                                                              |
| - curriculum_releases                                                                             |
| - curriculum_nodes                                                                                |
| - curriculum_applicability                                                                        |
| - curriculum_crosswalks                                                                           |
| - curriculum_taxonomy_alignments                                                                  |
+---------------------------------------------------------------------------------------------------+
                                         Γöé  (Read-Only Query Interface)
                                         Γû╝
+---------------------------------------------------------------------------------------------------+
| PRESENTATION LAYER: PARENT LEARNING HUB (/parent/curriculum-explorer)                             |
| - ParentCurriculumCard (Plain English summaries + Family Home Activities + VCAA links)             |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Production-Contract Gap & Provenance Hardening

> [!WARNING]
> **Source Snapshot Fingerprint Requirement:**  
> The Codex contract (`src/features/curriculum/contracts.ts`) specifies a 64-character SHA-256 `sourceFingerprint` on `CurriculumSource` and `CurriculumRelease`.
> 
> In production, **a SHA-256 fingerprint is valid only when computed directly from a retained on-disk byte-identical source snapshot file** (e.g. downloaded CSV, RDF/XML, or archived HTML snapshot). Fabricating valid-looking hex strings (or using the empty-file hash `e3b0c44...`) creates false provenance.
> 
> **Recommendation for Codex Ingestion Pipeline:**
> 1. Download and archive the official source snapshot into `content/curriculum-sources/snapshots/<sourceKey>-<date>.<ext>`.
> 2. Compute `crypto.createHash('sha256').update(snapshotBytes).digest('hex')`.
> 3. Store the actual computed digest in the database record alongside the snapshot file reference.
> 4. In research manifests where physical snapshots are not yet retained, explicitly mark fingerprinting as `null` or `pending_retrieval_snapshot`.

---

## 3. Database Schema Mapping & Supabase Tables

Normalized relational schema for Supabase:

1. `curriculum_sources` (`source_id`, `source_key`, `authority_code`, `authority_name`, `jurisdiction_code`, `school_sectors`, `title`, `source_url`, `retrieved_at`, `source_fingerprint`, `licence_json`)
2. `curriculum_releases` (`release_id`, `release_key`, `source_id`, `framework_scope`, `jurisdiction_code`, `title`, `version`, `effective_from`, `effective_to`, `published_at`, `supersedes_release_id`)
3. `curriculum_nodes` (`node_id`, `release_id`, `node_key`, `kind`, `parent_node_id`, `official_code`, `label`, `official_text_json`, `sort_order`)
4. `curriculum_applicability` (`applicability_id`, `node_id`, `release_id`, `jurisdiction_code`, `school_sectors`, `year_levels`, `level_codes`, `band_codes`, `stage_codes`)
5. `curriculum_crosswalks` (`crosswalk_id`, `source_node_id`, `target_node_id`, `relation`, `confidence`, `rationale`, `provenance_json`, `review_json`)
6. `parent_curriculum_cards` (`card_id`, `node_id`, `parent_title`, `learning_area`, `strand`, `sub_strand`, `what_students_learn`, `what_this_means`, `why_it_matters`, `home_activities_json`, `disclaimer_text`, `alignment_status`, `verified_by`, `verified_at`, `verification_source_url`)

---

## 4. Query Optimization & Security

1. **Pre-computed ISR / Cache:** Pre-render combined catalogue results per `(jurisdiction, sector, level, learningArea)` with a 24-hour cache.
2. **Server-Only Boundary:** Enforce `import "server-only";` on database catalogue adapters.
3. **Public Read Permissions:** Curriculum nodes and parent cards are read-accessible under public RLS policies; writes restricted to verified admin/operator roles.
