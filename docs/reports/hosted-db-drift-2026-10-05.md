# Hosted Database Migration Drift Report

- **Date:** 5 October 2026
- **Branch / Worktree:** `feat/programme-governance-roadmap`
- **Target Hosted Environment:** `uermhsptduikehuyceiz.supabase.co`
- **Inspection Mode:** Strictly read-only (`npm run migrations:status`). Zero mutation, zero deployment, zero schema changes applied to hosted Supabase.
- **Classification:** Belongs exclusively to Governance PR A.

---

## Executive Summary

A comprehensive, non-mutating inspection of the hosted Supabase database was conducted against the repository migration registry (`scripts/migrations/registry.ts` and `scripts/migrations/status.mts`).

- **Total Registered Migrations:** 48
- **Applied and Verified in Hosted Database:** 38
- **Not Applied to Hosted Database:** 10
- **Applied but Unrecorded in Ledger:** 0
- **Recorded in Ledger but Objects Absent ("Ledger Lies"):** 1 (`20260812110000_scoring_role`)
- **Unregistered Migration Files:** 0
- **Missing Files:** 0
- **Unknown Ledger Rows:** 0

### Explanation of the 10th Unapplied Migration

On the clean `origin/dev` baseline, exactly **9 migrations** were unapplied to the hosted environment.

On this PR branch (`feat/programme-governance-roadmap`), migration `20261005090000_revision_bound_publication_approvals.sql` was authored to implement the server-side, revision-bound publication governance and opt-in gate architecture. In accordance with the inviolable project rules (**never deploy, never touch hosted Supabase**), this migration has not been executed against the hosted database. Consequently, the measured count of unapplied migrations increased from 9 to **10**.

---

## Detailed Drift Inventory

### 1. Migrations Not Applied to Hosted Database (10)

| Version | Migration Name | Objects Status | Ledger Status | Root Cause & Context |
| :--- | :--- | :--- | :--- | :--- |
| `20260812110000` | `scoring_role` | 0/1 checks passing | **recorded** | Ghost row in ledger; role grants absent. Managed via bootstrap script. |
| `20260818090000` | `naplan_interaction_answer_kinds` | 0/1 checks passing | absent | Extended answer kinds (`hot_text`, `matrix`) pending staging cutover. |
| `20260820090000` | `assessment_capability_expansion` | 5/26 checks passing | absent | Multi-part items, media asset tables, manual marks composite keys. |
| `20260825090000` | `content_factory_phase1` | 0/16 checks passing | absent | Content factory batches, authoring revisions, validation triggers. |
| `20260827090000` | `curriculum_platform_foundation` | 2/19 checks passing | absent | Curriculum nodes, crosswalks, jurisdictions, and taxonomies. |
| `20260902090000` | `content_answer_writer_role` | 2/6 checks passing | absent | Least-privilege content answer writer role (`mindmosaic_content_answer_writer`). |
| `20260922100000` | `student_onboarding_preferences` | 0/4 checks passing | absent | Diagnostic timestamps and interest preferences columns on `profiles`. |
| `20260923090000` | `amc_programme_offerings` | 0/2 checks passing | absent | Australian Mathematics Competition subject and offerings seeds. |
| `20260923100000` | `amc_phase2_config_backfill` | 1/2 checks passing | absent | AMC blueprint versions and assessment profile pins. |
| `20261005090000` | `revision_bound_publication_approvals` | 0/3 checks passing | absent | **This PR's migration.** Revision-bound publication approvals table, opt-in gate switches, and session item guards. |

### 2. Discrepancy Detail for `20261005090000_revision_bound_publication_approvals`

The 3 verified checks declared for this migration are:
1. `private approval table has RLS and no learner privileges` (`public.publication_approvals`)
2. `private opt-in programme gate defaults to report mode` (`public.publication_gate_settings`)
3. `allocation and item inserts enforce approvals only for opted-in programmes; historical reads are unchanged` (`public.guard_approved_session_item()`)

None of these objects exist on hosted Supabase because deployment is restricted. Local PostgreSQL verification passed 100% of these checks and all companion RLS tests (33 test files, 510/510 assertions passing).

### 3. Ledger Ghost Row ("Ledger Lies"): `20260812110000_scoring_role`

The ledger `supabase_migrations.schema_migrations` contains an entry for `20260812110000`, but the database objects (specifically `mindmosaic_scoring` column-level UPDATE grants) are absent from the hosted instance. This represents historical drift that predated the migration registry verification tooling. It must remain untouched until an authorised infrastructure maintenance window.

---

## Safety & Governance Attestation

- **Hosted Database Untouched:** No DDL, DML, or administrative commands were executed against `db.uermhsptduikehuyceiz.supabase.co`.
- **Read-Only Verification:** `scripts/migrations/status.mts` was invoked exclusively in read-only inspection mode.
- **Fail-Closed Gate:** CI verification gates and local database tests remain fully green on isolated local instances (`supabase db reset`).
- **Release Isolation:** This migration drift report is contained solely in Governance PR A and does not contaminate content or landing copy pull requests.
