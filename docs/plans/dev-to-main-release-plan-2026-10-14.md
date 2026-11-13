# dev → main release plan — 2026-10-14

**Status (15 Oct 2026): PRE-STAGED, NOT RELEASED.** Nothing has been applied to hosted, merged to `main` or deployed. Everything below was rehearsed against throwaway local Postgres only. Every step that changes hosted, merges, or deploys needs its own explicit go-ahead from the owner (marked **GO**). PR #53 (+ publication-evidence guard) was merged into **dev** on the owner's earlier decision: dev = `46c05531`.

---

## RUNBOOK (phone version): say "GO n" and I run exactly the one command

Run from the repo root in PowerShell. Scripts: `docs\plans\runbook\`. Each one stops on the first surprise.

**0. Before anything:** project is awake (checked 15 Oct: up since 20 Jul, connects in 1.3 s, ledger 47). Re-check the morning of: `psql` select 1. If it ever pauses: dashboard → Restore; I can't time the wake (the API token in `.env.local` is dead, 401).

**1. DUMP + PROVE RESTORE** (GO 1)
- Run: `.\docs\plans\runbook\dump-and-prove.ps1`
- Success: 5 files + sizes + SHA; `restore roles/schema-all/data-all : errors=0`; 11 lines `MATCH`; `OK: dump restores and matches hosted`.
- Rollback: none, read-only on hosted. Delete the folder. (If a user signs in mid-run, `users` md5 may differ: just re-run.)
- Pre-flight done: whole script run vs a local copy of the 47-state DB: 0 errors, 11/11 MATCH. Not yet run vs hosted: only the network leg (CLI dump over IPv6 worked 14 Oct; `psql.exe` worked 15 Oct).
- Stale-dump note: the 14 Oct dump has 6 users; hosted has **10** now. Never use it. Take this one.

**2. MIGRATION 9** (GO 2)
- Run: `.\docs\plans\runbook\apply-migration.ps1 -Which 9`
- Success: ledger 47 → 48; dry run lists exactly `20261005090000_…`; 14 × `PASS`, `FAILURES = 0`; snapshot users/profiles md5 unchanged.
- Rollback: `psql $env:SUPABASE_DB_URL -X -v ON_ERROR_STOP=1 -f docs\plans\rollback\rollback-9.sql` (refuses if either table has rows). Last resort: restore step 1 dump (§7.2 Tier 2).
- Pre-flight done: dry run + real `db push` + checks vs the local 47-state copy as non-superuser `postgres`; rollback restored all 11 hashes exactly.

**3. MIGRATION 10** (GO 3)
- Run: `.\docs\plans\runbook\apply-migration.ps1 -Which 10`
- Success: ledger 48 → 49; dry run lists exactly `20261013090000_…`; 21 × `PASS`, `FAILURES = 0`.
- Rollback: `… -f docs\plans\rollback\rollback-10.sql` (refuses if any writing row). Then 9 if wanted.
- Pre-flight done: same as 2; reverse 10 → reverse 9 returned to the original baseline hashes exactly.
- **WARNING: NOBODY RUNS ACCOUNT ERASURE between applying migration 10 and verifying it.** Erasure is the one irreversible operation in this release, and migration 10 changes it with behaviour that is untested. Do not call `erase_student`, and do not start any erasure request, until the verification below has passed on a restored copy. (Today nothing reachable calls it: it is revoked from public/anon/authenticated and the requester-verification flow is not built. This is a standing rule, not a prediction.)
- **Verification I WOULD have run (the classifier blocked it; run deliberately later, on a restored throwaway copy, never hosted first):**
  1. Restore the step 1 dump into a throwaway container (as `dump-and-prove.ps1`) and apply 9 then 10 as the non-superuser `postgres`.
  2. As a service-level role insert a disposable student (auth.users + profiles), one `exam_sessions` + `exam_attempts` row, one `assessment_sessions` row, and one `writing_attempts` row with one `writing_marks` and two `writing_mark_criteria`.
  3. Call `select public.erase_student('<student uuid>', 'rehearsal');` inside `begin; … rollback;` first. Expect `marksDeleted` to include the writing mark (1 more than before migration 10) and no error.
  4. Repeat with `commit`. Expect zero rows for that id in `writing_attempts`, `writing_marks`, `writing_mark_criteria`, `assessment_sessions`, `exam_sessions`, `exam_attempts`, `profiles`, `auth.users`; exactly one new `erasure_audit` row with `request_ref = 'rehearsal'`; the parent's profile and `writing_marks.marked_by` provenance intact (`created_by` set null).
  5. Confirm `has_function_privilege` is false for `anon` and `authenticated` on `erase_student` (privileges unchanged).

**4. PREVIEW CHECK** (GO 4; you in a browser, not a command)
- Preview: `https://mindmosaic-exam-engine-git-dev-vishwas2018s-projects.vercel.app` (dev `46c05531`; deployment READY, function 15.73 MB). It is behind Vercel SSO (302), so I can't call it; I did not create a bypass link.
- Check as the test child: practice shows Year 5; start practice returns items; `/api/student/onboarding/questions?year=5` → 5 items; `/api/exam/guest-bank` non-empty. Logs: no `Missing publication evidence`.
- **Phone/2-minute version (you click, I watch logs):**
  1. Open the preview URL above in a browser where you're signed in to Vercel (your own account; no bypass link needed). If it shows a Vercel login, sign in once and it redirects back.
  2. Open `<preview>/api/exam/guest-bank` → expect JSON with a long non-empty list. (Empty `[]` or a 500 = R1, stop.)
  3. Open `<preview>/login`, sign in as the **test child** (not a real child; this writes one real session row, R3).
  4. On `/student`, practice → pick **Year 5** → confirm it says Year 5, not another year.
  5. Start a practice session → expect questions to appear (not "no questions available").
  6. Open `<preview>/api/student/onboarding/questions?year=5` → expect 5 items.
  7. Tell me "preview OK" or what you saw. I then check the runtime logs for `Missing publication evidence` (expect none) and the session row.
- Run this AFTER steps 2–3 so the writing routes have their tables. It writes one real session row (R3).
- Rollback: none needed. Failure = R1 → stop, fix tracing on dev.
- Pre-flight done: build READY; guard test proves the approvals folder is in the bundle glob. The signed-in check itself is not done.

**5. PROMOTE** (GO 5)
- Run: `gh pr create --base main --head dev --title "Release: dev to main (2 migrations already applied)" --body-file docs\plans\release-pr-body.md` then, when `core`/`e2e`/`e2e-auth`/`rls` are green: `gh pr merge <n> --merge` (merge commit; no admin bypass).
- Success: P-1…P-10 in §4 P6.
- Rollback: `vercel rollback dpl_8MBkfHPm4KmuXoeKopoBpGPBU4tB --scope vishwas2018s-projects`, then `git revert -m 1 <merge>` PR. DB stays as is.
- Pre-flight done: `main` is an ancestor of dev (0 behind / 102 ahead, 308 files); `git merge-tree` clean; no open PR to main. Dev CI on `46c05531`: core (after one rerun of a `next/font/google` network flake), e2e, e2e-auth, rls all green. PR body: `docs/plans/release-pr-body.md`.

**Standing rule:** nothing in steps 1–5 touches hosted, `main` or Vercel without your individual "GO n" with you present. Reset SQL stays unrun.

**Not in this release:** PR #51 adds a **third** migration that **replaces `create_exam_session`**, the live hot path (signature-compatible). It ships as its **own release AFTER this promotion**, not folded in.

**Known, accounted for (do not re-derive):** dev is **102 commits / 308 files ahead** of main (it was 99 / 302 before #53 + guard + merge; any older figure in this file is superseded). Exactly two migrations are missing from main (`20261005090000`, `20261013090000`).

**Risk wording (corrected 15 Oct; do NOT say "nothing live is touched"):**
- Migration 9 replaces `create_assessment_session`, which **no live caller reaches** (live sessions use `create_exam_session`).
- Migration 10 restates `erase_student` (account erasure). It is **live code but unreachable by any user today**: the function is revoked from public, anon and authenticated, and the requester-verification flow is not built. The new signature is identical to `20260815110000_erase_student_both_models.sql`, privileges are unchanged by `CREATE OR REPLACE`, and the header states exactly two additions (writing marks counted in `v_marks`; `delete from writing_attempts` before the sittings). **Its new behaviour is UNVERIFIED here**: the permission classifier blocked the test call on the throwaway copy.
- Both are otherwise additive (new tables/functions only).

**Data drift (D):** hosted has **10 auth users**; the 14 Oct dump had **6**. That is the concrete reason step 1's fresh dump is not a formality: the old dump would silently lose 4 accounts.

**Stale local checkout (F):** the local `main`/working tree is stale (dev `cc50a9a1`, dirty). Leave it alone. The scripts never use it: they fetch and build a throwaway detached worktree of `origin/main` (`C:\tmp\wt-rel-apply`) and copy the migration bytes from `origin/dev`. Do not pull, reset or clean the main checkout mid-release.

**R4 / T-1 replaced by a measurement (15 Oct):** `getQuestionById` searches `publishedExamBank`, not `servedBank()` (my earlier risk statement was inverted). Count of ids in `questionBank` (curated, 1,005) absent from `publishedExamBank` (1,548): **0**. No duplicate ids in either; 543 factory-only.

**Guard (E):** `content/publication-approvals/.gitkeep` + README do-not-remove note + `src/tests/unit/publication-approvals-anchor.test.ts` (resolves the trace glob the way Next does, `dot: true`; fails if it matches nothing; verified failing with both files removed). In dev via #53.

**Reset SQL (H):** unrun; header now says never executed, UPDATE path unverified.

---

Facts fixed by earlier work (not re-litigated here):

- Hosted Supabase (`uermhsptduikehuyceiz`) is on the **Free tier: no scheduled backups, no PITR**. A tested manual dump is the only safety net.
- Hosted ledger is at **47** migrations (`20260923100000` newest); main's 47 files and hosted now agree. Migrations 9 and 10 are **not** applied.
- Production = Vercel project `mindmosaic-exam-engine`, deployment `dpl_8MBkfHPm4KmuXoeKopoBpGPBU4tB` (**main @ `47c11ba8`**, READY since 2026-10-03). That deployment is the rollback target.
- Smoke test of main against migrated hosted passed (Year 5 → Year 5, onboarding completes, prompt does not return).
- `main` protection: required checks `core`, `e2e`, `e2e-auth`, `rls`; 0 required reviews; `strict: false`; admins not enforced (an admin *can* bypass — we will not).

---

## 0. Verdict and shape

| | |
|---|---|
| Promotion | `main` is a strict ancestor of `dev`: **0 behind, 102 ahead**, 308 files (+45,416 / −1,321; figures re-measured 15 Oct after #53; the 99 / 302 elsewhere in this file are the earlier numbers). A merge commit, no squash. |
| Database | Two migrations that add tables/functions (9: revision-bound publication approvals; 10: timed writing + parent marking). Each also **replaces one existing function**: 9 replaces `create_assessment_session` (no live caller reaches it); 10 restates `erase_student` (live code, unreachable by any user today, signature-compatible, new behaviour UNVERIFIED; see the step 3 warning). Not "nothing live is touched". |
| Order | **dump → migration 9 → verify → migration 10 → verify → preview check → merge → post-promotion checks.** Database first, because dev code needs the objects and Vercel deploys `main` the moment it merges. |
| Why DB-first is safe | Both migrations are additive and default to the old behaviour (see §2). `main`'s code keeps serving between steps, and Vercel-only rollback never needs a database rollback. |
| Biggest code-side risk | `getExamBank()` is now filtered by a publication gate that **fails closed to an empty bank** on any evidence problem (§2, R1). That is the "Year 5 session returns items" risk, and it is invisible to unit tests because it depends on Vercel file tracing. Hence the **preview check** (§6) before merge. |

---

## 1. Diff review: what 302 files actually change at runtime

Composition (files): `src/features` 101 (landing 54, writing 14, visuals 8, scholarship 8, question-factory 6, exam-engine 4, content-governance 3, parent-dashboard 2, content-projection 2), `src/tests` 44, `src/content` 26, `public/landing` 25, `src/app` 22, `content/roadmap-drafts` 18, `src/server` 6, scripts ≈ 20, `supabase/migrations` 2, `.github/workflows` 1.

**Not touched at all:** billing/Stripe, auth, Supabase client/server helpers, proxy/middleware. (Searched the full name list; the only match is `e2e/auth/writing-flow.spec.ts`.)

### Runtime-affecting changes (the ones that can break production)

1. `src/server/exam-bank.ts` — `getExamBank("practice" | "published" | "curated")` now returns `servedBank()`, built from `getPublicationEligibility()` (reads `content/publication-approvals/` and `content/question-factory/published-manifests/` from disk at runtime). With `PROGRAMME_PUBLICATION_MODES = {}` every programme is in **report mode**, so the served bank equals the published bank — *provided the evidence loads with zero problems.*
2. `getQuestionById()` now searches **only `publishedExamBank`** (it used to search the curated `questionBank` first). Anything that resolves a curated-only question id for an existing session would now get `undefined`.
3. `next.config.ts` — `outputFileTracingIncludes["/*"]` adds `content/question-factory/published-manifests/*.json` (544 files, 1.6 MB) and `content/publication-approvals/*` to **every** route's bundle; `images.formats = [avif, webp]`, `images.qualities = [75, 85]`.
4. New routes: `/api/writing/**` (5 handlers), `/student/writing`, `/parent/writing`, `/writing/{sit,mark,print}/**` (need migration 10), and `/dev/bar-model`, `/dev/writing` (preview-gated).
5. Landing rewrite (54 files) + `public/landing` assets + `Hero.tsx` deleted; `robots.ts` adds `/writing`.
6. CI gains validation steps (roadmap/scholarship drafts, bar-model, publication verify, `audit:bank`, `programmes:check-gates`).

### Risk register

| # | Finding | Evidence | Severity | Action |
|---|---|---|---|---|
| **R1** | `servedBank()` returns **`[]`** if the evidence loader reports *any* problem (`Missing publication evidence directory`, unreadable JSON, or `report.problems`). An empty bank means no questions served and the onboarding diagnostic fails (`selectDiagnosticQuestions` → 500). `content/publication-approvals/` contains only `README.md`, so it exists only because the glob traces that one file into each bundle. CI runs `next start` from a full checkout, which proves nothing about Vercel's tracing. | `src/server/exam-bank.ts`, `src/server/publication-evidence.ts`, `next.config.ts` | **High (silent)** | **Preview check §6** — exercise a Vercel *build* of dev against the migrated DB before merging. Post-promotion check P-3 repeats it on production. |
| **R2** | Env vars: **no variable is present on preview but missing in production.** Vercel holds exactly three (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), each a *single record* targeted at `preview,production`. The diff adds three env reads — `VERCEL_ENV`, `WRITING_PREVIEW_ENABLED`, `BAR_MODEL_PREVIEW_ENABLED` — all **fail closed in production** (`VERCEL_ENV === "production"` → off, regardless of the flag). Nothing new is required. | `vercel api …/env` (names/targets only); `src/features/{writing,visuals/bar-model}/preview-gate.ts` | Low | None. Do **not** set the two `*_PREVIEW_ENABLED` flags on Vercel. |
| R3 | **Preview and production share one set of credentials**, so dev preview deployments (including the one for PR #50) read and write the **production database**. Verified from the target lists; values are `sensitive` and unreadable. | env listing | Medium (pre-existing) | Keep in mind during §6: a preview session writes real rows. Use the test child only. Consider a separate Supabase project for previews (owner decision, §9). |
| R4 | `getQuestionById` change (item 2 above). Existing sessions on hosted may reference question ids that exist only in the curated bank. | `exam-bank.ts` diff | Medium | **Pre-merge task T-1:** with `tsx`, load hosted `exam_sessions.selected_question_ids` (read-only) and diff against `publishedExamBank` ids. Any id outside it is a regression candidate for in-flight marking/review. |
| R5 | **The live session path is the legacy one**, not the path migration 9 changes. `POST /api/exam/session` picks the bank in app code and calls `create_exam_session`; `create_assessment_session` (replaced by migration 9) is reachable only for target-cohort students, and the cohort is empty with the flag off (route comment, ADR-006 Amendment C5). | `src/app/api/exam/session/route.ts` | Informational — changes how we test | Year 5 check has two parts (§4.4): the live HTTP path, and structural proof of the replaced function. Do **not** enable the cohort or flag to "test" it on hosted. |
| R6 | Writing code ships before any prompt is approved (`content/publication-approvals/writing-prompts` empty; PR #47 notes no prompt approved, issue #49 for a DB check). Routes exist but have nothing to serve; they touch migration-10 tables when hit. | `src/app/api/writing/**` | Low once migration 10 is applied | Order ensures tables exist. Check P-5 confirms `/student/writing` degrades cleanly. |
| R7 | `images.qualities = [75, 85]`: any `next/image` quality outside that set errors/warns. | grep of `quality=` on dev: **none** outside {75, 85} | Low | None. |
| R8 | Bundle size from the all-routes trace include: +1.6 MB of manifests per function. | `git ls-tree -l` | Low | Watch the Vercel build output for function size; far under the 250 MB limit. |
| R9 | `metadataBase`, `sitemap.ts`, `robots.ts` point at `mindmosaic.app`, **not a live domain**. Not breaking, but og/sitemap URLs resolve to nothing. | `src/app/layout.tsx:77` | Low | **Draft PR #53** fixes all three using `VERCEL_PROJECT_PRODUCTION_URL` (no new env var). Merge #53 into dev *before* the release PR if approved. `hello@mindmosaic.app` mailbox existence is a separate owner question. |
| R10 | Admin bypass on `main` protection. | `enforce_admins: false` | Process | We do not use it. If a required check fails, we stop. |
| R11 | Draft/uncommitted local state in the working tree (`.github/agents/`, `scratch/`, landing photos…) is **not** in the diff and not part of this release. | `git status` | n/a | Release from a clean checkout/worktree, never from the dirty working tree. |

Deleted file: `src/features/landing/components/Hero.tsx` — CI `build` on dev is green, so no dangling import.

---

## 2. Why the migrations are safe to apply before the code ships

**Migration 9 `20261005090000_revision_bound_publication_approvals`** (466 lines)
- Creates `item_publication_approvals` and `publication_gate_settings` (RLS on, all privileges revoked from `public/anon/authenticated`), the trigger function `guard_approved_session_item` + trigger `approved_session_item` on `assessment_session_items`, an immutability trigger on approvals, and **`create or replace function create_assessment_session`**.
- The guard only blocks when a programme row in `publication_gate_settings` has `enforced = true`. **No rows ⇒ report mode for every programme.** Header: "No approval is backfilled or inferred."
- `create_assessment_session` is on the **non-live** target-model path (R5).

**Migration 10 `20261013090000_timed_writing_parent_marking`** (536 lines)
- Creates `writing_rubrics` (+ one seeded rubric row), `writing_attempts`, `writing_marks`, `writing_mark_criteria`, RLS policies, six `SECURITY DEFINER` functions (execute granted to `authenticated` only), and **`create or replace function erase_student`** (extended to cover writing rows).
- Nothing in `main` calls the new objects. `erase_student` keeps its signature but its body changes (two marked additions); it is live code that no user can reach today, and the new behaviour is unverified (step 3 warning).

Neither migration changes a table `main`'s code reads or writes. Therefore `main` keeps working with 9 and/or 10 applied, which is what makes DB-first and a Vercel-only rollback safe.

---

## 3. Preconditions (all must be true before the first **GO**)

- [ ] Dev CI green on the current dev head (it is: run on `0f8c3a4b`, all four jobs; `rls` needed one re-run for a Docker-networking flake on the runner, not a test failure).
- [ ] Decide on PR #53 (merge into dev first, or ship the release without it).
- [ ] Owner present, watching. The dump (P1) is taken the same session as the apply; a stale dump is not acceptable.
- [ ] Task **T-1** (R4 diff of session question ids vs. published bank) done and clean.
- [ ] Work happens from a clean checkout. For the apply, a throwaway worktree (see P2).
- [ ] `psql` 17.6 still reaches hosted read-only (`C:\Users\vishw\pgclient\pg17\pgsql\bin\psql.exe`); project not paused.
- [ ] Record the production rollback target: `dpl_8MBkfHPm4KmuXoeKopoBpGPBU4tB` (main @ `47c11ba8`).

---

## 4. Phased plan

### P1 — Verified restorable dump (before anything else) — **GO 1**

The existing dump in `C:\Users\vishw\mindmosaic-backups\hosted-2026-10-14\` is the **pre-migration-1–8** state. **Do not use it to undo 9/10**: restoring it would silently also undo migrations 1–8. A fresh dump is mandatory.

1. Dump hosted via the direct connection with the CLI (native `pg_dump` 17.6 fails against Supabase; the CLI works):
   `supabase db dump --db-url <hosted> -f …/schema-all.sql`, `--data-only -f …/data-all.sql`, `--role-only -f …/roles.sql`, plus the `public + supabase_migrations` pair, into a new dated folder **outside any git tree**, e.g. `C:\Users\vishw\mindmosaic-backups\hosted-<date>-pre-9-10\`.
2. Record file sizes and SHA-256 prefixes.
3. **Prove it restores**: throwaway local Postgres (`public.ecr.aws/supabase/postgres:17.6.1.141`), drop the stub `auth`/`storage` schemas first, restore as `supabase_admin`, then compare row counts and hashes to hosted (auth.users, profiles, ledger = 47). This is the same rehearsal already done once; the procedure is in `docs/reports/hosted-db-drift-2026-10-14.md` §14–§15.
4. **Rehearse both migrations and their reverse** on that restored copy as the non-superuser `postgres` role (hosted `postgres` is non-superuser, `CREATEROLE`, `BYPASSRLS`, DB owner — rehearsal must match). Confirm the reverse SQL (§7) returns the schema to identical hashes.
5. Take a **before-snapshot** of row counts for key tables (auth.users, profiles, parent_children, exam_sessions, exam_attempts, assessment_sessions, programme_offerings, assessment_profile_versions, blueprint_versions) and `publication_gate_settings` existence — used by every later check.

Gate: dump files present, sizes/hashes recorded, restore proven, rehearsal clean. **No go-ahead for P2 without this report.**

### P2 — Migration 9, alone — **GO 2**

`supabase db push --include-all` applies *every* pending file, so on a dev checkout it would apply 9 **and** 10 together. To apply one at a time:

1. Throwaway worktree of `origin/main` (47 files). Copy in **only** `20261005090000_revision_bound_publication_approvals.sql`, byte-exact (`cmd /c "git show origin/dev:supabase/migrations/… > file"`; verify size against `git cat-file -s`).
2. `supabase db push --include-all --dry-run --db-url <hosted>` must list **exactly one** migration (9). If it lists anything else, stop.
3. Owner says **GO 2**, then `supabase db push --include-all --yes --db-url <hosted>`.
4. Run the **M9 checks** (§5). Any failure: STOP, change nothing further, report the exact ledger state, wait. No restore without telling the owner first.

### P3 — Migration 10, alone — **GO 3** (separate go-ahead)

Same procedure; add only `20261013090000_timed_writing_parent_marking.sql` to the worktree; dry run must list exactly one; then apply; then **M10 checks** (§5) plus the shared checks.

### P4 — Preview check (before merge) — **GO 4**

R1 can only be proven on a Vercel build. A preview deployment of dev already exists per commit.
1. Take the preview URL for the dev head (or for the release PR once opened).
2. Owner signs in as the test child on the **preview** URL (we never type credentials).
3. Check: `/api/exam/session` returns `questions` of length > 0 for a Year 5 config; `/student/practice` shows "YEAR 5"; onboarding diagnostic loads questions (`/api/student/onboarding/questions?year=5` → 200 with 5 items); `/api/exam/guest-bank` non-empty.
4. Vercel runtime logs for that preview: no `Missing publication evidence directory` / `Unreadable publication evidence` problems. (If the app logs nothing for it, the 200-with-items result is the proof; an empty bank would show as 422 `insufficient_questions` or a 500 on the diagnostic.)
5. Note: preview writes to the production DB (R3). Use the test child; one real session row is expected.

Gate: all of 3 pass. If R1 materialises (empty bank on preview), **stop** — fix tracing on dev before any merge.

### P5 — Merge — **GO 5**

1. Open PR `dev → main` (not draft), title and body listing: the two migrations (already applied), the R-table, the check list, the rollback target. Link PR #50's report and this plan.
2. **Merge commit** (not squash/rebase) so the history stays bisectable and rollback is `git revert -m 1 <merge>`.
3. Required checks on the PR head: `core`, `e2e`, `e2e-auth`, `rls`, all green. A Docker-networking failure in `rls` (seen once on dev) is re-run, not waved through; any *test* failure stops the release.
4. Do **not** use the admin bypass. Vercel will auto-deploy `main`; watch the build (`vercel logs --environment production --branch main`, or the dashboard).

### P6 — Post-promotion checks (production)

Run immediately after the deployment is READY, with the owner signed in as the test child:

| # | Check | Pass |
|---|---|---|
| P-1 | Production deployment id changed; its commit is the merge commit; READY. | ✔ |
| P-2 | Year 5 session **creates and returns items**: `POST /api/exam/session` (via the UI "start practice" as the test child) → 200, `questions.length > 0`, year shown is 5. | ✔ |
| P-3 | Served-bank / tracing (R1): practice page lists Year 5 content; diagnostic questions request returns 5; no `insufficient_questions`. | ✔ |
| P-4 | **`publication_gate_settings` still empty**, `item_publication_approvals` empty, `programme_publication_modes` unchanged (`{}`): `select count(*) from public.publication_gate_settings` = 0. | ✔ |
| P-5 | `/student/writing` and `/writing/sit/…` degrade cleanly (no approved prompt) — no 500s. `/dev/*` and `/showcase` → 404 in production. | ✔ |
| P-6 | Sign out/in, reload 3 pages: no onboarding prompt (already proven; regression check). | ✔ |
| P-7 | Parent dashboard loads for the test parent (children list, no errors). | ✔ |
| P-8 | Vercel runtime logs for 15 min: no 5xx on `/api/exam/*`, `/api/student/*`, `/api/writing/*`. | ✔ |
| P-9 | Data unchanged vs before-snapshot, apart from the one expected test-session row. | ✔ |
| P-10 | `npm run migrations:status` against hosted: ledger 49, aligned with main's 49 files. | ✔ |

Any failure in P-2…P-4 is a **rollback trigger** (§7).

---

## 5. Named post-migration checks

All read-only. Run as `psql "$SUPABASE_DB_URL" -X -f <file>`, compare to the before-snapshot from P1.

### Shared (after both P2 and P3)
- **Ledger:** count = 48 after P2, 49 after P3; newest = `20261005090000` then `20261013090000`. `supabase migration list` shows both sides aligned.
- **`publication_gate_settings` is still empty:** `select count(*) from public.publication_gate_settings;` → **0**. (Also `item_publication_approvals` → 0.) This is the proof that nothing is enforced.
- **No grants leaked:** `has_table_privilege('anon'|'authenticated', 'public.publication_gate_settings'|'public.item_publication_approvals', 'select')` → false for all four; `relrowsecurity` true on both.
- **Data unchanged:** row counts for auth.users, profiles, parent_children, exam_sessions, exam_attempts, assessment_sessions, programme_offerings (active = 101), assessment_profile_versions (101), blueprint_versions (101) equal the before-snapshot; hash of `auth.users` unchanged.

### M9 (after P2)
- Tables, trigger `approved_session_item` on `assessment_session_items`, trigger `immutable_publication_approval` exist.
- `position('publication_gate_settings' in pg_get_functiondef('public.create_assessment_session(jsonb,text)'::regprocedure)) > 0` (replaced function carries the guard logic; the same assertion `programmes:check-gates` makes in CI).
- **Year 5 session — live path (legacy):** inside `begin … rollback`, as the test child via `request.jwt.claims`/`set local role authenticated`, call `public.create_exam_session(<year-5 config>, 'check-seed', array[<5 real Year 5 ids>], now()+interval '1 hour')` → returns a uuid, then `rollback`. Zero residue. (This function is unchanged by 9/10, so this proves "nothing regressed", not "the new gate works".)
- **Year 5 session — HTTP (the real proof):** deferred to P4/P-2, because "returns items" is app code, not SQL.
- **Replaced `create_assessment_session`:** structural only on hosted (cohort empty, flag off, so a call is refused by design — do not enable either to test). Functional proof is the `rls` CI job (`tests/rls/target-http-lifecycle.test.ts`) and the P1 local rehearsal.

### M10 (after P3)
- `writing_rubrics` (1 seeded row `scholarship-written-expression` v1), `writing_attempts`, `writing_marks`, `writing_mark_criteria` exist; RLS on all four; `writing_attempts` = 0 rows.
- The six `*_writing_*` functions: `has_function_privilege('authenticated', …, 'execute')` true, `anon` false.
- `erase_student` still exists with the same signature and its definition now mentions `writing_attempts`.
- `student_id`/FK integrity: all `writing_*` FKs resolve (no orphan constraints) — `select conname, convalidated from pg_constraint where conrelid::regclass::text like 'public.writing_%'` all validated.

---

## 6. Env-var summary for promotion (the "present on preview, missing on prod" question)

| Variable | Preview | Production | Used by dev diff | Verdict |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | ✔ (shared record) | ✔ (shared record) | existing | fine |
| `VERCEL_ENV` | auto-set by Vercel | auto-set | new read, fail-closed | fine |
| `WRITING_PREVIEW_ENABLED`, `BAR_MODEL_PREVIEW_ENABLED` | **not set** | not set | new, e2e escape hatches only | leave unset; production is forced off by `VERCEL_ENV` anyway |
| `SHOWCASE_ENABLED` | not set | not set | existing | `/showcase` stays 404 in production |
| `STRIPE_*`, `BILLING_ENFORCEMENT_ENABLED`, `CONTENT_ANSWER_WRITER_DB_URL`, `SCORING_DB_URL`, `QF_AI_*` etc. | not set | not set | read by **main too** | pre-existing; **not changed by this release** (billing/Stripe code is untouched). Note for the owner: production has no Stripe/billing config — unrelated to promotion. |

Conclusion: **no env var needs to be added before promotion.** The only way a variable could differ between dev preview and production here is `VERCEL_ENV`, which is set by Vercel itself and is the *safe* direction.

---

## 7. Rollback (Vercel **and** database)

Principle: **roll back code first, and leave the database alone unless the database itself is the problem.** Both migrations are additive, so `main @ 47c11ba8` runs fine on a DB with 9 and 10 applied.

### 7.1 Code (Vercel)
1. **Instant rollback** (seconds): Vercel dashboard → Deployments → `dpl_8MBkfHPm4KmuXoeKopoBpGPBU4tB` (main @ `47c11ba8`) → *Promote to Production* / `vercel rollback dpl_8MBkfHPm4KmuXoeKopoBpGPBU4tB --scope vishwas2018s-projects`. (Verify with P-1.)
2. **Make it stick:** `git revert -m 1 <merge-commit>` on a branch off `main`, PR into `main`, normal required checks. Without this the next push to `main` redeploys the bad code.
3. Re-run P-2, P-3, P-6 against the restored deployment.

### 7.2 Database — choose the smallest tier that works
**Tier 0 — leave it.** If the fault is code, do nothing to the DB (7.1 suffices).

**Tier 1 — reverse migration 10** (only if migration 10 is faulty; safe only while `writing_attempts` = 0, verified first — no prompt is approved, so no attempts can exist):
```
begin;
  -- guard: abort if any learner/marker data exists
  do $$ begin
    if (select count(*) from public.writing_attempts) > 0 or (select count(*) from public.writing_marks) > 0 then
      raise exception 'writing data exists; do not drop'; end if; end $$;
  drop function public.start_writing_attempt(text,text,integer), public.save_writing_draft(uuid,text),
       public.submit_writing_attempt(uuid,text,text), public.record_paper_writing_attempt(uuid,text,text,integer),
       public.mark_writing_attempt(uuid,text,integer,jsonb,jsonb,text),
       public.record_marked_paper_attempt(uuid,text,text,integer,text,integer,jsonb,jsonb /* exact signature from the file */);
  drop table public.writing_mark_criteria, public.writing_marks, public.writing_attempts, public.writing_rubrics;
  -- restore erase_student(...) body VERBATIM from the P1 fresh dump (schema-public-and-ledger.sql)
  delete from supabase_migrations.schema_migrations where version = '20261013090000';
commit;
```
**Tier 1b — reverse migration 9** (same shape): drop trigger `approved_session_item` and `immutable_publication_approval`, drop `guard_approved_session_item`, `deny_publication_approval_mutation`, tables `item_publication_approvals` and `publication_gate_settings`; restore `create_assessment_session(jsonb,text)` verbatim from the P1 dump; delete ledger row `20261005090000`. Guard first: both tables must be empty.

These statements are **a skeleton**. They must be generated against the real migration text and **rehearsed in P1 step 4** (the local copy must return to identical schema hashes) before the owner is asked for GO 2. Do not run an un-rehearsed rollback.

**Tier 2 — full restore from the P1 fresh dump.** Last resort (corruption, unexplained data change). Free tier, so this is the only copy: it loses everything written to hosted after the dump (new sessions/attempts, a changed password…). Procedure: `docs/reports/hosted-db-drift-2026-10-14.md` §14 and §15 (psql route; storage buckets must be removed via the Storage API, not SQL). Requires the owner's explicit decision and a statement of the data-loss window. **Never restore the 2026-10-14 pre-1–8 dump for this purpose.**

### 7.3 Decision table
| Symptom | Do |
|---|---|
| P-2/P-3 fail (no items, 422/500) | 7.1 only; then investigate R1 |
| Writing pages 500 | 7.1 only (or leave: pages are unreachable without an approved prompt) |
| Migration 9 or 10 check fails *before* merge | stop; report ledger; Tier 1/1b only with owner's say-so |
| Data differs from before-snapshot | stop everything; Tier 2 decision |
| Anything weird in auth/profiles | stop; do not touch; Tier 2 decision |

---

## 8. Things that are deliberately not in this release
- No gate enforcement: `PROGRAMME_PUBLICATION_MODES` stays `{}` and `publication_gate_settings` stays empty. Enabling enforcement is a separate, reviewed change.
- No approved writing prompt; no cohort/flag enabling for the target storage model.
- No Stripe/billing changes; no new env vars.
- The `mindmosaic.app` mail domain is untouched.

## 9. Owner decisions needed
1. **PR #53** (`metadataBase`/sitemap/robots): merge into dev before the release, or after?
2. **Separate Supabase project (or at least keys) for previews** (R3) — dev previews currently write to the production database.
3. Whether the production deployment should carry Stripe/billing config (not related to this release, noticed during the env audit).
4. Is the `hello@mindmosaic.app` mailbox real? (legal pages and `SUPPORT_EMAIL` use it.)
5. Free tier pausing (≈7 days low activity): a paused project makes P1–P3 fail at the first connection; confirm it is active the morning of the release.

## 10. Artifacts produced with this plan
- `docs/plans/reset-child-onboarding.sql` — reset one student's onboarding state (**written, not run**; ends in `ROLLBACK` until edited).
- Draft PR #53 — `metadataBase` fix (branch `fix/metadatabase-production-url`).
- Task list still to do before GO 1: T-1 (R4), rehearsed reverse SQL for 9 and 10 (P1 step 4), exact Year 5 config/ids for the rolled-back `create_exam_session` check.
