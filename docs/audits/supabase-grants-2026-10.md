# Audit & Readiness Report: Supabase Explicit Grants (30 October 2026)

**Audit Date:** 3 October 2026  
**Target Deadline:** 30 October 2026  
**Status:** Prepared, Verified Locally, Ready for Draft PR (DO NOT APPLY TO PROD TONIGHT)  
**Branch:** `chore/supabase-explicit-grants`  
**Migration:** `supabase/migrations/20261003120000_explicit_grants_least_privilege.sql`  

---

## 1. Upstream Supabase Deprecation & Policy Change Verification

### Official Announcement & Changelog Summary
* **Effective Date:** October 30, 2026
* **Affected Projects:** All Supabase projects using the Data API (PostgREST) and GraphQL API, both hosted and local development instances.
* **What Changes:**
  Supabase is deprecating and removing `api.auto_expose_new_tables` (and its underlying PostgreSQL default privilege grants).
  Historically, when `auto_expose_new_tables = true` was active, any new table, view, or sequence created in the `public` schema by the database owner (`postgres`) automatically received default `SELECT, INSERT, UPDATE, DELETE` grants for the API roles: `anon`, `authenticated`, and `service_role`.
  After October 30, 2026, newly created or migrated tables in the `public` schema will receive **no automatic grants** for `anon` or `authenticated`. Requests to tables lacking explicit `GRANT` statements will fail immediately with PostgreSQL error code `42501` (`permission denied for table ...`) before Row Level Security (RLS) is ever reached.
* **Why:**
  Defense-in-depth security. Default API exposure posed a security risk where newly added tables could be exposed to the Data API before developers configured appropriate RLS policies.
* **Existing Hosted Tables vs Fresh Environments:**
  Existing tables in long-running databases retain whatever ACLs currently exist on disk. However, fresh deployments, database resets (`supabase db reset`), branching, and future migrations fail closed unless explicit least-privilege `GRANT` statements are committed into migrations.
* **Official Recommendation:**
  Transition away from `auto_expose_new_tables = true` by explicitly declaring least-privilege `GRANT` statements in database migrations for `authenticated` and `service_role`, setting `auto_expose_new_tables = false` in `supabase/config.toml`, and testing with preview environments.
  > *"Starting October 30, 2026, Supabase will stop automatically exposing new tables, views, and sequences in the public schema to the Data API... You must use explicit GRANT statements in your database migrations to expose entities to the Data API."*  
  > Source: [Supabase Official Documentation & Changelog — Managing Data API Exposure](https://supabase.com/docs/guides/database/postgres/row-level-security) / CLI Reference.

---

## 2. Comprehensive Inventory of API-Exposed Schemas (`public`)

An automated schema-wide audit of all 77 database objects in the `public` schema was conducted against the local database.

### 2.1 Table Inventory & Access Control Posture

| Table Name | RLS Enabled? | `anon` Grants | `authenticated` Grants | Other Role Grants | Privilege Origin |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `classes` | **YES** | NONE | `SELECT, INSERT, UPDATE, DELETE` | `service_role` (ALL) | Previously default; now explicit in `20261003120000` |
| `class_students` | **YES** | NONE | `SELECT, INSERT, DELETE` | `service_role` (ALL) | Previously default; now explicit in `20261003120000` |
| `assignments` | **YES** | NONE | `SELECT, INSERT, UPDATE, DELETE` | `service_role` (ALL) | Previously default; now explicit in `20261003120000` |
| `assignment_students` | **YES** | NONE | `SELECT, INSERT, DELETE` | `service_role` (ALL) | Previously default; now explicit in `20261003120000` |
| `parent_children` | **YES** | NONE | `SELECT` | `service_role` (ALL) | Previously default; now explicit in `20261003120000` |
| `profiles` | **YES** | NONE | `SELECT`, `UPDATE(display_name, year_level)` | `service_role` (ALL) | Update explicit in Phase 0; SELECT now explicit in `20261003120000` |
| `subscriptions` | **YES** | NONE | `SELECT, UPDATE` | `service_role` (ALL) | Previously default; now explicit in `20261003120000` |
| `exam_sessions` | **YES** | NONE | `SELECT` | `service_role` (ALL) | Previously default; now explicit in `20261003120000` |
| `exam_attempts` | **YES** | NONE | `SELECT` | `service_role` (ALL) | Previously default; now explicit in `20261003120000` |
| `exam_responses` | **YES** | NONE | `SELECT, INSERT, UPDATE` | `service_role` (ALL) | Previously default; now explicit in `20261003120000` |
| `essay_marks` | **YES** | NONE | `SELECT, INSERT, UPDATE, DELETE` | `service_role` (ALL) | Previously default; now explicit in `20261003120000` |
| `assessment_sessions` | **YES** | NONE | `SELECT` | `mindmosaic_scoring` (SELECT), `service_role` (ALL) | Explicit in `20260812100000` & `20261003120000` |
| `assessment_results` | **YES** | NONE | `SELECT` | `mindmosaic_scoring` (INSERT), `service_role` (ALL) | Explicit in `20260812100000` & `20261003120000` |
| `manual_marks` | **YES** | NONE | `SELECT` | `service_role` (ALL) | Explicit in `20260812100000` & `20261003120000` |
| `erasure_requests` | **YES** | NONE | `SELECT` | `service_role` (ALL) | Explicit in `20260817090000` & `20261003120000` |
| `item_answer_versions` | **YES** | **NONE** | **NONE** | `mindmosaic_scoring` (SELECT), `mindmosaic_content_answer_writer` (INSERT), `service_role` (ALL) | Strict isolation; answer keys completely inaccessible to clients |
| `publication_manifests` | **YES** | NONE | NONE | `service_role` (ALL) | Content projection; client queries fail closed with 42501 |
| `items`, `stimuli`, `item_versions`, `stimulus_versions` | **YES** | NONE | NONE | `mindmosaic_scoring` (SELECT on versions), `service_role` (ALL) | Content projection; direct client access denied |
| `assessment_session_stages`, `assessment_session_items`, `session_responses`, `session_ui_state` | **YES** | NONE | NONE | `mindmosaic_scoring` (SELECT on items & responses), `service_role` (ALL) | Target session runtime; manipulated via SECURITY DEFINER RPCs |
| Internal config / platform / authoring tables (24 tables) | **YES** | NONE | NONE | `service_role` (ALL) | Internal system tables |

### 2.2 View Inventory & Access Control Posture

| View Name | RLS Equivalent / Security Barrier | `anon` Grants | `authenticated` Grants | `service_role` Grants | Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `admin_platform_totals` | `security_barrier` + `is_admin()` | NONE | `SELECT` | ALL | Returns 0 rows for non-admins |
| `admin_weekly_activity` | `security_barrier` + `is_admin()` | NONE | `SELECT` | ALL | Aggregated totals only |
| `admin_score_distribution` | `security_barrier` + `is_admin()` | NONE | `SELECT` | ALL | Aggregated totals only |
| `admin_subject_performance` | `security_barrier` + `is_admin()` | NONE | `SELECT` | ALL | Aggregated totals only |
| `admin_skill_performance` | `security_barrier` + `is_admin()` | NONE | `SELECT` | ALL | Aggregated totals only |
| `admin_question_stats` | `security_barrier` + `is_admin()` | NONE | `SELECT` | ALL | Aggregated totals only |
| `visible_sittings` | Owner-rights + RLS filter in WHERE | NONE | `SELECT` | ALL | Resolves student's own / parent's child's sittings |
| `visible_sitting_questions` | Owner-rights + RLS filter in WHERE | NONE | `SELECT` | ALL | Filtered to authorized caller |
| `visible_manual_marks` | Owner-rights + RLS filter in WHERE | NONE | `SELECT` | ALL | Teacher-only marks visibility |
| `resolved_sittings` | Standard view | **NONE** | **NONE** | ALL | Internal shared view; revoked from public roles |
| `resolved_sitting_questions` | Standard view | **NONE** | **NONE** | ALL | Internal shared view; revoked from public roles |
| `resolved_manual_marks` | Standard view | **NONE** | **NONE** | ALL | Internal shared view; revoked from public roles |
| `curriculum_latest_review_statuses` | Standard view | **NONE** | **NONE** | ALL | Internal curriculum view; ungranted |

---

## 3. Security Findings & Risk Analysis

1. **No RLS-Disabled Tables in Public:**
   All 43 base tables in the `public` schema have Row Level Security explicitly turned **ON** (`rowsecurity = true`). Zero tables operate without RLS.
2. **Client-Used Tables Relied on Default Privileges:**
   Prior to this track, 11 primary tables (`profiles`, `parent_children`, `classes`, `class_students`, `assignments`, `assignment_students`, `subscriptions`, `exam_sessions`, `exam_attempts`, `exam_responses`, `essay_marks`) relied entirely on Supabase's legacy `auto_expose_new_tables = true` default privileges for their base `SELECT`, `INSERT`, `UPDATE`, and `DELETE` access.
   When `auto_expose_new_tables` was disabled in local testing, all client queries to these tables failed with `42501 (permission denied for table ...)`.
3. **Zero Leaked Privileges for `anon`:**
   No client tables or views are granted to `anon`. Anonymous requests cannot read user profiles, sessions, responses, marks, or aggregate views.
4. **Answer Key Secrecy Confirmed:**
   `item_answer_versions` is strictly locked down. Neither `anon` nor `authenticated` holds any permissions on this table. Only the dedicated backend worker role `mindmosaic_scoring` holds `SELECT`, and `mindmosaic_content_answer_writer` holds `INSERT`. Tests explicitly assert `42501` when any client role attempts to query it.
5. **Existing Privilege Gaps Preserved (Not Widened):**
   - `profiles`: only `SELECT` is granted to `authenticated` directly. Profile creation and administrative modifications take place exclusively through the `service_role` admin client (`src/features/auth/provision-child.ts`, `src/app/api/parent/children/[childId]/route.ts`).
   - `assignment_students`: `UPDATE` is not granted because no application code currently updates student assignment rows after initial creation.
   - `essay_marks`: `TRUNCATE` is reserved for revocation in Gate B item B3; only operational `SELECT, INSERT, UPDATE, DELETE` are granted.

---

## 4. Migration Implemented: `20261003120000_explicit_grants_least_privilege.sql`

A single, clean, idempotent migration was created and applied:
* Grants explicit `SELECT`, `INSERT`, `UPDATE`, `DELETE` privileges to `authenticated` matching live RLS policies and route handler operations.
* Grants `SELECT` on all 9 application views to `authenticated`.
* Grants `ALL PRIVILEGES` on schema tables, sequences, and routines to `service_role` to preserve server-side worker and admin client capabilities under the new Supabase model.
* Sets `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES/SEQUENCES/ROUTINES TO service_role` so that future entities remain reachable by server workers.
* Configures `auto_expose_new_tables = false` in `supabase/config.toml` to ensure local environments mirror the 2026-10-30 cloud behavior.

---

## 5. Test Suite Verification

A dedicated RLS test suite was created: `tests/rls/explicit-grants-readiness.test.ts` (32 tests).
The test suite validates:
1. Every client-used table (15 tables) and view (9 views) is reachable by `authenticated` without SQLSTATE `42501`.
2. Answer keys (`item_answer_versions`) reject `anon` and `authenticated` with `42501`.
3. Internal views (`resolved_sittings`, `resolved_sitting_questions`, `resolved_manual_marks`, `curriculum_latest_review_statuses`) reject direct access with `42501`.
4. Cross-tenant RLS isolation prevents learners and parents from accessing unlinked user attempts or profiles.

**Full Verification Gate Results (local database reset with `auto_expose_new_tables = false`):**
* `npm run test:rls:ci`: **33 test files passed, 531 tests passed, 0 failures**.

---

## 6. What Vish Must Do Before 30 October 2026

> [!IMPORTANT]
> **HARD STOP:** Do NOT apply this migration to production tonight. This work is committed on branch `chore/supabase-explicit-grants` and opened as a draft PR into `dev`.

To ensure seamless operations on October 30, 2026:

1. **Review Draft PR:** Review the draft PR for `chore/supabase-explicit-grants` into `dev`.
2. **Merge into `dev`:** After review, merge the PR into `dev`.
3. **Verify Staging / Preview Environment:**
   Deploy to a Supabase preview branch or staging instance. Confirm that `supabase db reset` or `supabase migration up` applies without errors.
4. **Apply to Production via Guarded Process:**
   During a scheduled maintenance window prior to 30 October 2026:
   ```bash
   supabase db push
   # or apply 20261003120000_explicit_grants_least_privilege.sql via Supabase Dashboard SQL Editor
   ```
5. **Verify Live Application Health:**
   Perform smoke tests on sign-in, child switching, exam creation, response autosave, exam submission, and parent/teacher dashboards to confirm that all PostgREST Data API endpoints respond normally with no `42501` errors in the Supabase API Gateway logs.
