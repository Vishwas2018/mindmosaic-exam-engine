/**
 * The single source of truth for "has this migration actually been applied?"
 *
 * Why this file exists at all: for a long stretch this project had no
 * migration ledger of any kind. Four migrations had been applied by hand,
 * four had not, and nothing in the database could disagree with an
 * assumption — the drift was not merely unnoticed, it was unnoticeable. A
 * ledger alone would not have been enough either, because a ledger can be
 * baselined dishonestly: writing eight rows into a table proves only that
 * someone wrote eight rows.
 *
 * So each migration is paired here with SQL that checks whether the objects
 * it *declares* genuinely exist. `record` only writes a ledger row after its
 * checks pass, and `status` re-runs the same checks against the live
 * database on demand. A ledger row therefore means "verified present", not
 * "someone said so".
 *
 * Checks assert the objects a migration is uniquely responsible for — the
 * ones whose presence distinguishes "applied" from "not applied". They are
 * not a full schema diff, and are not meant to be.
 */

export interface MigrationCheck {
  /** Human-readable description of the object being asserted. */
  readonly describes: string;
  /** SQL returning a single row with a boolean column named `present`. */
  readonly sql: string;
}

export interface MigrationEntry {
  /** Timestamp prefix of the file in supabase/migrations, and the ledger key. */
  readonly version: string;
  /** The rest of the filename, without the .sql extension. */
  readonly name: string;
  readonly checks: readonly MigrationCheck[];
}

const tableExists = (table: string): MigrationCheck => ({
  describes: `table public.${table}`,
  sql: `select exists (
          select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relname = '${table}' and c.relkind in ('r','p')
        ) as present`,
});

const viewExists = (view: string): MigrationCheck => ({
  describes: `view public.${view}`,
  sql: `select exists (
          select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relname = '${view}' and c.relkind = 'v'
        ) as present`,
});

const functionExists = (fn: string): MigrationCheck => ({
  describes: `function public.${fn}()`,
  sql: `select exists (
          select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.proname = '${fn}'
        ) as present`,
});

const columnExists = (table: string, column: string): MigrationCheck => ({
  describes: `column public.${table}.${column}`,
  sql: `select exists (
          select 1 from information_schema.columns
          where table_schema = 'public' and table_name = '${table}' and column_name = '${column}'
        ) as present`,
});

const policyExists = (table: string, policy: string): MigrationCheck => ({
  describes: `policy "${policy}" on public.${table}`,
  sql: `select exists (
          select 1 from pg_policy where polrelid = 'public.${table}'::regclass
            and polname = '${policy}'
        ) as present`,
});

const constraintExists = (table: string, constraint: string): MigrationCheck => ({
  describes: `constraint ${constraint} on public.${table}`,
  sql: `select exists (
          select 1 from pg_constraint con join pg_class c on c.oid = con.conrelid
          join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relname = '${table}' and con.conname = '${constraint}'
        ) as present`,
});

const triggerExists = (schema: string, table: string, trigger: string): MigrationCheck => ({
  describes: `trigger ${trigger} on ${schema}.${table}`,
  sql: `select exists (
          select 1 from pg_trigger tg join pg_class c on c.oid = tg.tgrelid
          join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = '${schema}' and c.relname = '${table}'
            and tg.tgname = '${trigger}' and not tg.tgisinternal
        ) as present`,
});

export const MIGRATIONS: readonly MigrationEntry[] = [
  {
    version: "20260718090000",
    name: "phase0_roles_and_exam_schema",
    checks: [
      tableExists("profiles"),
      tableExists("parent_children"),
      tableExists("exam_sessions"),
      tableExists("exam_attempts"),
      tableExists("classes"),
      tableExists("class_students"),
      tableExists("assignments"),
      tableExists("assignment_students"),
      functionExists("handle_new_user"),
      functionExists("is_parent_of"),
      functionExists("is_teacher_of_student"),
      triggerExists("auth", "users", "on_auth_user_created"),
      policyExists("exam_sessions", "exam_sessions: student reads own"),
    ],
  },
  {
    version: "20260718120000",
    name: "admin_aggregate_views",
    checks: [
      functionExists("is_admin"),
      viewExists("admin_platform_totals"),
      viewExists("admin_weekly_activity"),
      viewExists("admin_score_distribution"),
      viewExists("admin_subject_performance"),
      viewExists("admin_skill_performance"),
      viewExists("admin_question_stats"),
    ],
  },
  {
    version: "20260719100000",
    name: "exam_responses",
    checks: [
      tableExists("exam_responses"),
      columnExists("exam_responses", "flagged_question_ids"),
      policyExists("exam_responses", "exam_responses: student reads own"),
    ],
  },
  {
    version: "20260719110000",
    name: "essay_marking",
    checks: [
      tableExists("essay_marks"),
      policyExists("essay_marks", "essay_marks: teacher marks own class students"),
    ],
  },
  {
    version: "20260720100000",
    name: "subscriptions",
    checks: [
      tableExists("subscriptions"),
      tableExists("subscription_events"),
      functionExists("create_parent_trial_subscription"),
      functionExists("has_active_access"),
      functionExists("current_parent_has_access"),
      triggerExists("public", "profiles", "on_parent_profile_created"),
      policyExists("subscriptions", "subscriptions: parent reads own"),
    ],
  },
  {
    version: "20260722100000",
    name: "exam_attempts_unique_session_id",
    checks: [
      constraintExists("exam_attempts", "exam_attempts_session_id_key"),
      {
        /* The migration drops this index as redundant, so its ABSENCE is
           part of what "applied" means — a check that only looked for the
           constraint would pass on a half-applied migration. */
        describes: "redundant index exam_attempts_session_id_idx is gone",
        sql: `select not exists (
                select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                where n.nspname = 'public' and c.relname = 'exam_attempts_session_id_idx'
                  and c.relkind = 'i'
              ) as present`,
      },
    ],
  },
  {
    version: "20260723090000",
    name: "stripe_webhook_transactional_apply",
    checks: [
      columnExists("subscription_events", "processed_at"),
      functionExists("apply_stripe_subscription_event"),
      {
        /* The function is security definer and writes tables no other role
           may write to, so the revoke is the point of the migration as much
           as the function is. */
        describes: "apply_stripe_subscription_event not executable by anon/authenticated",
        sql: `select not exists (
                select 1 from pg_proc p
                join pg_namespace n on n.oid = p.pronamespace
                left join lateral aclexplode(p.proacl) a on true
                where n.nspname = 'public'
                  and p.proname = 'apply_stripe_subscription_event'
                  and a.privilege_type = 'EXECUTE'
                  and a.grantee::regrole::text in ('anon', 'authenticated')
              ) as present`,
      },
    ],
  },
  {
    version: "20260724090000",
    name: "exam_sessions_student_role_gate",
    checks: [
      {
        /*
         * SUPERSEDED by 20260811091000, which drops the policy this
         * migration rewrote, and 20260811090000, which is where its role
         * gate now lives.
         *
         * The original check asserted the role predicate inside the
         * "exam_sessions: student creates own" WITH CHECK — presence of the
         * policy alone proved nothing, since the policy existed before this
         * migration too. That policy is now gone by design, so the old
         * check would report this migration as NOT APPLIED forever.
         *
         * What is asserted instead is the guarantee the migration was
         * responsible for, wherever it currently lives: a non-student
         * cannot cause an exam_sessions row to exist. That holds if the
         * original policy still carries the predicate (a database at this
         * migration's own point in history) OR if create_exam_session
         * carries it and the direct insert has been revoked (a database
         * that has moved on). Deliberately an OR, not a rewrite to the new
         * state only: both are correct databases, and this file has to be
         * able to tell either from one where the gate was never applied at
         * all.
         */
        describes:
          'role = student gate on exam_sessions insert (policy, or create_exam_session after 20260811091000)',
        sql: `select (
                coalesce(
                  (select pg_get_expr(polwithcheck, polrelid) ~ 'role = ''student'''
                   from pg_policy where polrelid = 'public.exam_sessions'::regclass
                     and polname = 'exam_sessions: student creates own'),
                  false)
                or coalesce(
                  (select pg_get_functiondef(p.oid) ~ 'role = ''student'''
                   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                   where n.nspname = 'public' and p.proname = 'create_exam_session'),
                  false)
              ) as present`,
      },
    ],
  },
  {
    version: "20260811090000",
    name: "exam_write_rpcs",
    checks: [
      functionExists("create_exam_session"),
      functionExists("record_exam_attempt"),
      {
        /* Unlike apply_stripe_subscription_event, these are meant to be
           called by the signed-in student — so the assertion is that
           authenticated CAN execute them. Without the explicit grant the
           routes fail closed, which is safe but is still drift. */
        describes: "create_exam_session/record_exam_attempt executable by authenticated",
        sql: `select count(distinct p.proname) = 2 as present
              from pg_proc p
              join pg_namespace n on n.oid = p.pronamespace
              join lateral aclexplode(p.proacl) a on true
              where n.nspname = 'public'
                and p.proname in ('create_exam_session', 'record_exam_attempt')
                and a.privilege_type = 'EXECUTE'
                and a.grantee::regrole::text = 'authenticated'`,
      },
      {
        /* The whole point of the definer path: neither function may be
           reachable by an unauthenticated caller. */
        describes: "create_exam_session/record_exam_attempt not executable by anon",
        sql: `select not exists (
                select 1 from pg_proc p
                join pg_namespace n on n.oid = p.pronamespace
                join lateral aclexplode(p.proacl) a on true
                where n.nspname = 'public'
                  and p.proname in ('create_exam_session', 'record_exam_attempt')
                  and a.privilege_type = 'EXECUTE'
                  and a.grantee::regrole::text in ('anon', 'public')
              ) as present`,
      },
    ],
  },
  {
    version: "20260811091000",
    name: "exam_writes_revoke_direct_insert",
    checks: [
      {
        /* The migration IS the absence of this privilege — there is no
           object to look for, so the check is the negative. */
        describes: "authenticated has no INSERT on exam_sessions or exam_attempts",
        sql: `select not exists (
                select 1
                from information_schema.role_table_grants
                where table_schema = 'public'
                  and table_name in ('exam_sessions', 'exam_attempts')
                  and grantee = 'authenticated'
                  and privilege_type = 'INSERT'
              ) as present`,
      },
      {
        describes: "the two dead insert policies are gone",
        sql: `select not exists (
                select 1 from pg_policy
                where polname in (
                  'exam_sessions: student creates own',
                  'exam_attempts: student submits own'
                )
              ) as present`,
      },
      {
        /* Reads must survive the revoke: without SELECT the resume, review,
           report and teacher/parent surfaces all break. */
        describes: "authenticated still has SELECT on exam_sessions and exam_attempts",
        sql: `select count(distinct table_name) = 2 as present
              from information_schema.role_table_grants
              where table_schema = 'public'
                and table_name in ('exam_sessions', 'exam_attempts')
                and grantee = 'authenticated'
                and privilege_type = 'SELECT'`,
      },
    ],
  },
  {
    version: "20260811092000",
    name: "exam_responses_locked_after_submit",
    checks: [
      functionExists("session_has_attempt"),
      {
        describes: "exam_responses insert/update policies both guard on session_has_attempt",
        sql: `select count(*) = 2 as present
              from pg_policy
              where polrelid = 'public.exam_responses'::regclass
                and polname in (
                  'exam_responses: student inserts own',
                  'exam_responses: student updates own'
                )
                and coalesce(pg_get_expr(polwithcheck, polrelid), '') ~ 'session_has_attempt'`,
      },
      {
        /* USING as well as WITH CHECK on the update policy: WITH CHECK
           alone would let the row be selected for update and only reject
           the new value, which is a different (and weaker) rule. */
        describes: "exam_responses update policy guards in USING too",
        sql: `select coalesce(
                (select pg_get_expr(polqual, polrelid) ~ 'session_has_attempt'
                 from pg_policy where polrelid = 'public.exam_responses'::regclass
                   and polname = 'exam_responses: student updates own'),
                false) as present`,
      },
    ],
  },
  {
    version: "20260811093000",
    name: "exam_tables_revoke_residual_writes",
    checks: [
      {
        /* TRUNCATE is the one RLS cannot cover, so its absence is the
           substance of this migration rather than a tidy-up. */
        describes: "authenticated has no TRUNCATE on the three exam tables",
        sql: `select not exists (
                select 1 from information_schema.role_table_grants
                where table_schema = 'public'
                  and table_name in ('exam_sessions', 'exam_attempts', 'exam_responses')
                  and grantee = 'authenticated'
                  and privilege_type = 'TRUNCATE'
              ) as present`,
      },
      {
        describes: "exam_sessions/exam_attempts are immutable to authenticated",
        sql: `select not exists (
                select 1 from information_schema.role_table_grants
                where table_schema = 'public'
                  and table_name in ('exam_sessions', 'exam_attempts')
                  and grantee = 'authenticated'
                  and privilege_type in ('UPDATE', 'DELETE')
              ) as present`,
      },
      {
        /* The deliberate exception: autosave upserts, so exam_responses
           must keep UPDATE. Asserted positively so a later over-broad
           revoke shows up as drift rather than as a silently broken
           autosave. */
        describes: "exam_responses still grants authenticated INSERT and UPDATE",
        sql: `select count(distinct privilege_type) = 2 as present
              from information_schema.role_table_grants
              where table_schema = 'public'
                and table_name = 'exam_responses'
                and grantee = 'authenticated'
                and privilege_type in ('INSERT', 'UPDATE')`,
      },
    ],
  },
  {
    version: "20260811094000",
    name: "classes_require_teacher_role",
    checks: [
      functionExists("caller_is_teacher"),
      functionExists("is_student_profile"),
      {
        /* Both class-write policies existed before this migration — what
           distinguishes applied from not applied is the role condition
           inside them, exactly as for 20260724090000. */
        describes: "classes insert/update policies require caller_is_teacher()",
        sql: `select count(*) = 2 as present
              from pg_policy
              where polrelid = 'public.classes'::regclass
                and polname in (
                  'classes: teacher creates own',
                  'classes: teacher updates own'
                )
                and coalesce(pg_get_expr(polwithcheck, polrelid), '') ~ 'caller_is_teacher'`,
      },
      {
        describes: "classes update policy carries the role condition in USING too",
        sql: `select coalesce(
                (select pg_get_expr(polqual, polrelid) ~ 'caller_is_teacher'
                 from pg_policy where polrelid = 'public.classes'::regclass
                   and polname = 'classes: teacher updates own'),
                false) as present`,
      },
      {
        describes: "class_students insert requires a teacher caller and a student target",
        sql: `select coalesce(
                (select pg_get_expr(polwithcheck, polrelid) ~ 'caller_is_teacher'
                    and pg_get_expr(polwithcheck, polrelid) ~ 'is_student_profile'
                 from pg_policy where polrelid = 'public.class_students'::regclass
                   and polname = 'class_students: teacher adds to own class'),
                false) as present`,
      },
      {
        /* The part that neutralises a class row forged before the policies
           were tightened. Without it the migration would only govern new
           writes, and a legacy row would keep conferring authority. */
        describes: "teaches_class/is_teacher_of_student require the class owner to be a teacher",
        sql: `select count(*) = 2 as present
              from pg_proc p
              join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public'
                and p.proname in ('teaches_class', 'is_teacher_of_student')
                and pg_get_functiondef(p.oid) ~ 'role = ''teacher'''`,
      },
    ],
  },
  {
    version: "20260812090000",
    name: "runtime_content_projection",
    checks: [
      tableExists("publication_manifests"),
      tableExists("items"),
      tableExists("stimuli"),
      tableExists("stimulus_versions"),
      tableExists("item_versions"),
      tableExists("item_answer_versions"),
      functionExists("reject_content_version_update"),
      triggerExists("public", "item_versions", "item_versions_immutable"),
      triggerExists("public", "item_answer_versions", "item_answer_versions_immutable"),
      triggerExists("public", "stimulus_versions", "stimulus_versions_immutable"),
      {
        /* The provenance decision, asserted as schema rather than trusted as
           intent (ADR-002 Amendment A): a NOT NULL here would mean the ~1,005
           curated Git-authored items could never be projected at all. */
        describes: "item_versions.publication_manifest_id is nullable",
        sql: `select coalesce(
                (select is_nullable = 'YES'
                 from information_schema.columns
                 where table_schema = 'public' and table_name = 'item_versions'
                   and column_name = 'publication_manifest_id'),
                false) as present`,
      },
      constraintExists("item_versions", "item_versions_manifest_matches_provenance"),
      {
        /* The dedupe guarantee of §9.4 and the identity check of ADR-003 §8.
           Both are uniqueness constraints, so their absence is exactly the
           difference between "applied" and "looks applied". */
        describes: "content-hash uniqueness on item_versions and stimulus_versions",
        sql: `select count(*) = 2 as present
              from pg_constraint con
              join pg_class c on c.oid = con.conrelid
              join pg_namespace n on n.oid = c.relnamespace
              where n.nspname = 'public'
                and con.conname in (
                  'item_versions_content_hash_key',
                  'stimulus_versions_content_hash_key'
                )`,
      },
      {
        /* Spec §9.3 / §17.1. The substance of this migration's security half:
           not "a restrictive policy exists" but "no privilege exists to police".
           Checked across every privilege type, so a future column-level or
           TRUNCATE re-grant fails the ledger. */
        describes: "anon/authenticated hold NO privileges on the six projection tables",
        sql: `select not exists (
                select 1 from information_schema.role_table_grants
                where table_schema = 'public'
                  and table_name in (
                    'publication_manifests', 'items', 'stimuli',
                    'stimulus_versions', 'item_versions', 'item_answer_versions'
                  )
                  and grantee in ('anon', 'authenticated')
              ) as present`,
      },
      {
        describes: "no column-level grant to anon/authenticated on item_answer_versions",
        sql: `select not exists (
                select 1 from information_schema.column_privileges
                where table_schema = 'public'
                  and table_name = 'item_answer_versions'
                  and grantee in ('anon', 'authenticated')
              ) as present`,
      },
      {
        describes: "RLS enabled on all six projection tables",
        sql: `select count(*) = 6 as present
              from pg_class c join pg_namespace n on n.oid = c.relnamespace
              where n.nspname = 'public' and c.relrowsecurity
                and c.relname in (
                  'publication_manifests', 'items', 'stimuli',
                  'stimulus_versions', 'item_versions', 'item_answer_versions'
                )`,
      },
      {
        /* Phase 1 grants no learner read path at all. Originally written as
           "no policy exists"; tightened in 20260812110000 to the property that
           was actually meant, because the scoring role legitimately needs
           policies on item_versions and item_answer_versions (spec §9.3.1) and
           RLS applies to it. What must never exist is a policy a learner can
           reach — one naming anon, authenticated, or PUBLIC. */
        describes: "no projection-table policy is reachable by anon, authenticated or PUBLIC",
        sql: `select not exists (
                select 1 from pg_policy p
                join pg_class c on c.oid = p.polrelid
                join pg_namespace n on n.oid = c.relnamespace
                where n.nspname = 'public'
                  and c.relname in (
                    'publication_manifests', 'items', 'stimuli',
                    'stimulus_versions', 'item_versions', 'item_answer_versions'
                  )
                  and (
                    0 = any(p.polroles)
                    or exists (
                      select 1 from unnest(p.polroles) as role_oid
                      join pg_roles r on r.oid = role_oid
                      where r.rolname in ('anon', 'authenticated')
                    )
                  )
              ) as present`,
      },
    ],
  },
  {
    version: "20260812100000",
    name: "assessment_session_model",
    checks: [
      tableExists("assessment_sessions"),
      tableExists("assessment_session_stages"),
      tableExists("assessment_session_items"),
      tableExists("session_responses"),
      tableExists("stage_transitions"),
      tableExists("assessment_results"),
      tableExists("manual_marks"),
      tableExists("outbox_events"),
      tableExists("idempotency_keys"),
      triggerExists("public", "assessment_session_items", "assessment_session_items_append_only"),
      triggerExists("public", "session_responses", "session_responses_terminal_lock"),
      triggerExists("public", "assessment_sessions", "assessment_sessions_transition_guard"),
      triggerExists("public", "assessment_results", "assessment_results_immutable"),
      {
        /* The §12.3 session snapshot. Checked as a set rather than one column
           at a time, because a snapshot missing one pin is not a partially
           applied migration — it is a session whose result cannot be
           reproduced, which is the whole point of the phase. */
        describes: "assessment_sessions pins all seven §12.3 versions",
        sql: `select count(*) = 7 as present
              from information_schema.columns
              where table_schema = 'public' and table_name = 'assessment_sessions'
                and column_name in (
                  'assessment_profile_version', 'framework_version', 'blueprint_version',
                  'taxonomy_version', 'engine_algorithm_version', 'scoring_algorithm_version',
                  'content_build_version'
                )`,
      },
      {
        /* The §12.4 ledger fields. Same reasoning: an exposure ledger missing
           forced_reuse_reason or exposure_window_depth silently stops being
           able to answer the questions §13 asks of it. */
        describes: "assessment_session_items records the full §12.4 ledger",
        sql: `select count(*) = 14 as present
              from information_schema.columns
              where table_schema = 'public' and table_name = 'assessment_session_items'
                and column_name in (
                  'global_ordinal', 'stage_number', 'within_stage_ordinal',
                  'item_id', 'item_version_id', 'content_hash',
                  'stimulus_id', 'stimulus_version_id', 'item_family_id',
                  'blueprint_cell_id', 'target_band', 'served_at',
                  'exposure_window_depth', 'forced_reuse_reason'
                )`,
      },
      constraintExists("assessment_sessions", "assessment_sessions_unversioned_only_from_legacy"),
      constraintExists("assessment_session_items", "assessment_session_items_forced_reuse_explained"),
      constraintExists("session_responses", "session_responses_manual_review_has_no_correctness"),
      constraintExists("assessment_results", "assessment_results_legacy_pair_complete"),
      {
        /* ADR-005 §1's structural half. Without the unique constraints a
           re-run of the backfill duplicates history, and "one session, one
           storage model" becomes a convention rather than a guarantee. */
        describes: "legacy source ids are unique on all three backfill targets",
        sql: `select count(*) = 3 as present
              from pg_constraint con
              join pg_class c on c.oid = con.conrelid
              join pg_namespace n on n.oid = c.relnamespace
              where n.nspname = 'public' and con.contype = 'u'
                and (c.relname, pg_get_constraintdef(con.oid)) in (
                  ('assessment_sessions', 'UNIQUE (legacy_session_id)'),
                  ('assessment_results',  'UNIQUE (legacy_attempt_id)'),
                  ('manual_marks',        'UNIQUE (legacy_essay_mark_id)')
                )`,
      },
      {
        /* The security half, stated the way 20260812090000 states it: not
           "a policy narrows the write" but "no write privilege exists to
           narrow". Covers TRUNCATE, which RLS cannot reach at all and which
           the repo audit found granted on all 17 pre-existing public tables
           (docs/adr/phase0-legacy-session-inventory.md §7). */
        describes: "anon/authenticated hold NO write privilege on any of the nine tables",
        sql: `select not exists (
                select 1 from information_schema.role_table_grants
                where table_schema = 'public'
                  and grantee in ('anon', 'authenticated')
                  and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
                  and table_name in (
                    'assessment_sessions', 'assessment_session_stages',
                    'assessment_session_items', 'session_responses',
                    'stage_transitions', 'assessment_results', 'manual_marks',
                    'outbox_events', 'idempotency_keys'
                  )
              ) as present`,
      },
      {
        /* SELECT is granted to exactly three tables and no others. The
           exposure ledger and the response rows are reached only through a
           definer function; a SELECT grant appearing on either would mean a
           direct learner read path was built (spec §17.1). */
        describes: "SELECT is granted to authenticated on exactly the three reader tables",
        /* ::text is not cosmetic — information_schema.table_name is a
           sql_identifier, so an uncast array_agg never equals a text[] and the
           check would fail for the wrong reason. */
        sql: `select coalesce(
                (select array_agg(distinct table_name::text order by table_name::text)
                   = array['assessment_results', 'assessment_sessions', 'manual_marks']
                 from information_schema.role_table_grants
                 where table_schema = 'public' and grantee = 'authenticated'
                   and privilege_type = 'SELECT'
                   and table_name in (
                     'assessment_sessions', 'assessment_session_stages',
                     'assessment_session_items', 'session_responses',
                     'stage_transitions', 'assessment_results', 'manual_marks',
                     'outbox_events', 'idempotency_keys'
                   )),
                false) as present`,
      },
      {
        describes: "RLS enabled on all nine session-model tables",
        sql: `select count(*) = 9 as present
              from pg_class c join pg_namespace n on n.oid = c.relnamespace
              where n.nspname = 'public' and c.relrowsecurity
                and c.relname in (
                  'assessment_sessions', 'assessment_session_stages',
                  'assessment_session_items', 'session_responses',
                  'stage_transitions', 'assessment_results', 'manual_marks',
                  'outbox_events', 'idempotency_keys'
                )`,
      },
      {
        /* Originally "no policy at all" on the six definer-only tables;
           tightened in 20260812110000 for the same reason as the Phase 1 check
           above. The scoring role needs read/write policies on
           assessment_session_items and session_responses, and RLS applies to
           it. The invariant that matters is that no policy names a role a
           learner can present. Stated as an absence over the catalogue rather
           than a list of known-bad names, so a policy added later is caught
           whatever it is called. */
        describes: "no session-model policy is reachable by anon, authenticated or PUBLIC",
        sql: `select not exists (
                select 1 from pg_policy p
                join pg_class c on c.oid = p.polrelid
                join pg_namespace n on n.oid = c.relnamespace
                where n.nspname = 'public'
                  and c.relname in (
                    'assessment_session_stages', 'assessment_session_items',
                    'session_responses', 'stage_transitions',
                    'outbox_events', 'idempotency_keys'
                  )
                  and (
                    0 = any(p.polroles)
                    or exists (
                      select 1 from unnest(p.polroles) as role_oid
                      join pg_roles r on r.oid = role_oid
                      where r.rolname in ('anon', 'authenticated')
                    )
                  )
              ) as present`,
      },
      policyExists("assessment_sessions", "assessment_sessions: student reads own"),
      policyExists("assessment_results", "assessment_results: teacher reads own class students"),
    ],
  },
  {
    version: "20260812110000",
    name: "scoring_role",
    checks: [
      {
        describes: "role mindmosaic_scoring exists",
        sql: `select exists (
                select 1 from pg_roles where rolname = 'mindmosaic_scoring'
              ) as present`,
      },
      {
        /* The attributes that make this role a narrow credential rather than a
           second service_role. NOBYPASSRLS is the one that matters most: with
           it, every policy below stops applying and the grant list stops being
           the boundary (spec §9.3.1, ADR-006 Amendment A). */
        describes: "mindmosaic_scoring is not super/createdb/createrole and cannot bypass RLS",
        sql: `select coalesce(
                (select not rolsuper and not rolcreatedb and not rolcreaterole
                    and not rolbypassrls and not rolreplication and not rolinherit
                 from pg_roles where rolname = 'mindmosaic_scoring'),
                false) as present`,
      },
      {
        /* Membership in either direction is a way to acquire privileges the
           grant sweep would not see. The dangerous direction is the scoring
           role inheriting someone else's rights, so that is asserted empty.
           (postgres holding admin membership *of* it is unavoidable — the
           creating superuser always does — and confers nothing postgres did
           not already have.) */
        describes: "mindmosaic_scoring is a member of no other role",
        sql: `select not exists (
                select 1 from pg_auth_members am
                join pg_roles member on member.oid = am.member
                where member.rolname = 'mindmosaic_scoring'
              ) as present`,
      },
      {
        /* THE least-privilege assertion. Not "it has what it needs" but "it has
           exactly this and nothing more", so a later `grant ... to
           mindmosaic_scoring` anywhere in the schema fails the ledger. Written
           as a set comparison for that reason. */
        describes: "mindmosaic_scoring holds exactly its six table-level grants",
        sql: `select coalesce(
                (select array_agg(distinct (table_name::text || ':' || privilege_type::text)
                                  order by (table_name::text || ':' || privilege_type::text))
                   = array[
                       'assessment_results:INSERT',
                       'assessment_session_items:SELECT',
                       'assessment_sessions:SELECT',
                       'item_answer_versions:SELECT',
                       'item_versions:SELECT',
                       'session_responses:SELECT'
                     ]
                 from information_schema.role_table_grants
                 where grantee = 'mindmosaic_scoring'),
                false) as present`,
      },
      {
        /* Column-level UPDATE, so the grant itself says which columns a score
           may touch. The role cannot rewrite response_value or move
           client_sequence, which is what stops "scoring" from being able to
           alter the evidence it scores. */
        describes: "mindmosaic_scoring holds exactly its eight column-level UPDATE grants",
        sql: `select coalesce(
                (select array_agg(distinct (table_name::text || '.' || column_name::text)
                                  order by (table_name::text || '.' || column_name::text))
                   = array[
                       'assessment_sessions.status',
                       'assessment_sessions.submitted_at',
                       'assessment_sessions.version',
                       'session_responses.available_marks',
                       'session_responses.awarded_marks',
                       'session_responses.is_correct',
                       'session_responses.score_status',
                       'session_responses.scored_at'
                     ]
                 from information_schema.column_privileges
                 where grantee = 'mindmosaic_scoring' and privilege_type = 'UPDATE'),
                false) as present`,
      },
      {
        /* Spec §9.3.1: the learner posture is unchanged, and this migration is
           where a reviewer should be able to see it re-asserted rather than
           inherited. */
        describes: "anon/authenticated still hold nothing on item_answer_versions",
        sql: `select not exists (
                select 1 from information_schema.role_table_grants
                where table_schema = 'public' and table_name = 'item_answer_versions'
                  and grantee in ('anon', 'authenticated')
              ) as present`,
      },
      {
        describes: "the scoring role's eight policies exist and name only it",
        sql: `select coalesce(
                (select count(*) = 8
                 from pg_policy p
                 join pg_class c on c.oid = p.polrelid
                 where p.polname like '%scoring role%'
                   /* ::text again — pg_roles.rolname is of type name, so an
                      uncast array_agg never equals a text[] and this would
                      fail for the wrong reason. */
                   and (select array_agg(r.rolname::text order by r.rolname::text)
                          from unnest(p.polroles) as role_oid
                          join pg_roles r on r.oid = role_oid)
                       = array['mindmosaic_scoring']),
                false) as present`,
      },
    ],
  },
  {
    version: "20260812120000",
    name: "assessment_session_create",
    checks: [
      tableExists("platform_flags"),
      functionExists("create_assessment_session"),
      functionExists("get_assessment_session"),
      {
        /* The switch itself, not merely the table. A deploy that created the
           table and never seeded the row would leave create_assessment_session
           permanently raising MM210 — safe, but not the state this migration
           declares. Its VALUE is deliberately not asserted: off is the shipped
           default, and a database mid-cutover legitimately has it on. */
        describes: "the target_session_model cutover flag row exists",
        sql: `select exists (
                select 1 from public.platform_flags where key = 'target_session_model'
              ) as present`,
      },
      {
        /* Spec §17.2. A definer function without a fixed search_path is a
           privilege-escalation primitive, so this is asserted rather than
           assumed for both. */
        describes: "both session functions are SECURITY DEFINER with a fixed search_path",
        sql: `select count(*) = 2 as present
              from pg_proc p
              join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public'
                and p.proname in ('create_assessment_session', 'get_assessment_session')
                and p.prosecdef
                and array_to_string(p.proconfig, ',') like '%search_path=%'`,
      },
      {
        describes: "both session functions are executable by authenticated",
        sql: `select count(distinct p.proname) = 2 as present
              from pg_proc p
              join pg_namespace n on n.oid = p.pronamespace
              join lateral aclexplode(p.proacl) a on true
              where n.nspname = 'public'
                and p.proname in ('create_assessment_session', 'get_assessment_session')
                and a.privilege_type = 'EXECUTE'
                and a.grantee::regrole::text = 'authenticated'`,
      },
      {
        describes: "neither session function is executable by anon or PUBLIC",
        sql: `select not exists (
                select 1 from pg_proc p
                join pg_namespace n on n.oid = p.pronamespace
                join lateral aclexplode(p.proacl) a on true
                where n.nspname = 'public'
                  and p.proname in ('create_assessment_session', 'get_assessment_session')
                  and a.privilege_type = 'EXECUTE'
                  and a.grantee::regrole::text in ('anon', 'public')
              ) as present`,
      },
      {
        /* The flag is only a control if the roles it gates cannot rewrite it.
           auto_expose_new_tables makes this worth asserting rather than
           assuming — see 20260812090000's header. */
        describes: "anon/authenticated hold nothing on platform_flags",
        sql: `select not exists (
                select 1 from information_schema.role_table_grants
                where table_schema = 'public' and table_name = 'platform_flags'
                  and grantee in ('anon', 'authenticated')
              ) as present`,
      },
      {
        /* §17.2 again, stated as an absence over the function body: the paper
           must not be a parameter. Asserted against the signature rather than
           the text, so a future overload taking an item array is caught even
           if it is written differently. */
        describes: "create_assessment_session takes no item-list parameter",
        sql: `select coalesce(
                (select pg_get_function_identity_arguments(p.oid)
                        = 'p_config jsonb, p_idempotency_key text'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'create_assessment_session'),
                false) as present`,
      },
    ],
  },
  {
    version: "20260812130000",
    name: "assessment_session_responses",
    checks: [
      functionExists("commit_assessment_responses"),
      {
        describes: "commit_assessment_responses is SECURITY DEFINER with a fixed search_path",
        sql: `select coalesce(
                (select p.prosecdef and array_to_string(p.proconfig, ',') like '%search_path=%'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'commit_assessment_responses'),
                false) as present`,
      },
      {
        /* §12.5, as a property of the signature: the response write accepts no
           correctness, score, marks or server-derived item-identity parameter.
           A parameter documented as ignored is one refactor away from being
           read, so the assertion is that it does not exist.

           This check was originally an equality against the exact three-argument
           list, and 20260816090000 — which adds the resume cursor and flag list
           ADR-005 Amendment A5 left unmodelled — made that equality false while
           leaving the property it was standing for entirely true. A check that
           fails on a later additive migration reports THIS migration as
           unapplied, which is a false alarm about the wrong thing. So it now
           asserts the property directly: none of the forbidden words appears in
           the argument list, whatever else has been added beside them. The exact
           signature is pinned in 20260816090000's own entry, where a change to
           it is a change to that migration's declared object. */
        describes: "commit_assessment_responses accepts no correctness or score parameter",
        sql: `select coalesce(
                (select pg_get_function_identity_arguments(p.oid)
                        !~ '(correct|score|mark|item_version|student|awarded)'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'commit_assessment_responses'),
                false) as present`,
      },
      {
        describes: "commit_assessment_responses executable by authenticated, not anon or PUBLIC",
        sql: `select (
                exists (
                  select 1 from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                  join lateral aclexplode(p.proacl) a on true
                  where n.nspname = 'public' and p.proname = 'commit_assessment_responses'
                    and a.privilege_type = 'EXECUTE'
                    and a.grantee::regrole::text = 'authenticated'
                )
                and not exists (
                  select 1 from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                  join lateral aclexplode(p.proacl) a on true
                  where n.nspname = 'public' and p.proname = 'commit_assessment_responses'
                    and a.privilege_type = 'EXECUTE'
                    and a.grantee::regrole::text in ('anon', 'public')
                )
              ) as present`,
      },
      {
        /* The scoring role must remain unable to bring a response into
           existence — it may only stamp one a learner actually submitted.
           Asserted here rather than only in 20260812110000 because THIS
           migration is the one that introduces a response writer, and that is
           where a reviewer should see the other one still denied. */
        describes: "the scoring role still holds no INSERT on session_responses",
        sql: `select not exists (
                select 1 from information_schema.role_table_grants
                where table_schema = 'public' and table_name = 'session_responses'
                  and grantee = 'mindmosaic_scoring' and privilege_type = 'INSERT'
              ) as present`,
      },
    ],
  },
  {
    version: "20260812140000",
    name: "legacy_content_classifier",
    checks: [
      functionExists("classify_legacy_session_content"),
      functionExists("legacy_result_is_mappable"),
      functionExists("legacy_backfill_pin"),
      {
        /* All three read exam_sessions and item_versions. A learner holds no
           privilege on the latter at all, and none of these is an application
           path. */
        describes: "no classifier function is executable by anon, authenticated or PUBLIC",
        sql: `select not exists (
                select 1 from pg_proc p
                join pg_namespace n on n.oid = p.pronamespace
                join lateral aclexplode(p.proacl) a on true
                where n.nspname = 'public'
                  and p.proname in (
                    'classify_legacy_session_content', 'legacy_result_is_mappable',
                    'legacy_backfill_pin'
                  )
                  and a.privilege_type = 'EXECUTE'
                  and a.grantee::regrole::text in ('anon', 'authenticated', 'public')
              ) as present`,
      },
      {
        /* ADR-005 §4: a backfilled sitting is pinned only on recorded evidence.
           Asserted against the body because the property is "it consults
           config.contentHashes", which no catalogue row records. A classifier
           that stopped looking would silently label everything unversioned —
           the right answer today, reached the wrong way, and undetectable the
           day a legacy row does carry hashes. */
        describes: "the classifier binds on recorded content hashes",
        sql: `select coalesce(
                (select pg_get_functiondef(p.oid) like '%contentHashes%'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'classify_legacy_session_content'),
                false) as present`,
      },
    ],
  },
  {
    version: "20260812150000",
    name: "backfill_legacy_sessions",
    checks: [
      functionExists("backfill_legacy_terminal_sessions"),
      {
        describes: "the backfill is SECURITY DEFINER with a fixed search_path",
        sql: `select coalesce(
                (select p.prosecdef and array_to_string(p.proconfig, ',') like '%search_path=%'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'backfill_legacy_terminal_sessions'),
                false) as present`,
      },
      {
        /* An operational step run with the deploy credential. No application
           path needs it, and a learner able to invoke it could materialise
           target rows at will. */
        describes: "the backfill is not executable by anon, authenticated or PUBLIC",
        sql: `select not exists (
                select 1 from pg_proc p
                join pg_namespace n on n.oid = p.pronamespace
                join lateral aclexplode(p.proacl) a on true
                where n.nspname = 'public'
                  and p.proname = 'backfill_legacy_terminal_sessions'
                  and a.privilege_type = 'EXECUTE'
                  and a.grantee::regrole::text in ('anon', 'authenticated', 'public')
              ) as present`,
      },
      {
        /* THE hard invariant of §12.7 step 3, asserted against the function body
           rather than trusted: the backfill READS the legacy tables. If it ever
           gains an INSERT, UPDATE, DELETE or TRUNCATE against one of them this
           fails. There is no catalogue fact that records "this function only
           reads that table", so the body is the only place to look. */
        describes: "the backfill contains no write against any legacy table",
        sql: `select coalesce(
                (select pg_get_functiondef(p.oid) !~*
                        '(insert\s+into|update|delete\s+from|truncate)\s+(public\.)?(exam_sessions|exam_attempts|exam_responses|essay_marks)'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'backfill_legacy_terminal_sessions'),
                false) as present`,
      },
    ],
  },
  {
    version: "20260812160000",
    name: "session_storage_model_cohort",
    checks: [
      tableExists("assessment_cutover_cohort"),
      columnExists("platform_flags", "cohort_mode"),
      columnExists("assessment_sessions", "storage_model"),
      functionExists("session_storage_model_for"),
      functionExists("session_storage_model_for_caller"),
      constraintExists("platform_flags", "platform_flags_cohort_mode_known"),
      constraintExists("assessment_sessions", "assessment_sessions_storage_model_is_target"),
      {
        /* ADR-006 Amendment C5: the mechanism ships wired and OFF. A migration
           that shipped an enabled flag or a populated cohort would route real
           learners onto a model step 7 cannot display yet. */
        describes: "the cutover ships disabled, unscoped and with an empty cohort",
        sql: `select coalesce(
                (select not f.enabled and f.cohort_mode = 'off'
                   and not exists (select 1 from public.assessment_cutover_cohort)
                 from public.platform_flags f where f.key = 'target_session_model'),
                false) as present`,
      },
      {
        /* The arbitrary-uuid predicate must stay ungranted: with it, a learner
           could ask "is this other child in the cutover cohort". Only the
           caller-scoped wrapper is theirs. */
        describes: "session_storage_model_for(uuid) is not executable by anon or authenticated",
        sql: `select not exists (
                select 1 from pg_proc p
                join pg_namespace n on n.oid = p.pronamespace
                join lateral aclexplode(p.proacl) a on true
                where n.nspname = 'public' and p.proname = 'session_storage_model_for'
                  and a.privilege_type = 'EXECUTE'
                  and a.grantee::regrole::text in ('anon', 'authenticated', 'public')
              ) as present`,
      },
      {
        describes: "session_storage_model_for_caller() is executable by authenticated, not anon",
        sql: `select (
                exists (
                  select 1 from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                  join lateral aclexplode(p.proacl) a on true
                  where n.nspname = 'public' and p.proname = 'session_storage_model_for_caller'
                    and a.privilege_type = 'EXECUTE'
                    and a.grantee::regrole::text = 'authenticated'
                )
                and not exists (
                  select 1 from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                  join lateral aclexplode(p.proacl) a on true
                  where n.nspname = 'public' and p.proname = 'session_storage_model_for_caller'
                    and a.privilege_type = 'EXECUTE'
                    and a.grantee::regrole::text in ('anon', 'public')
                )
              ) as present`,
      },
      {
        describes: "anon/authenticated hold nothing on assessment_cutover_cohort",
        sql: `select not exists (
                select 1 from information_schema.role_table_grants
                where table_schema = 'public' and table_name = 'assessment_cutover_cohort'
                  and grantee in ('anon', 'authenticated')
              ) as present`,
      },
      {
        /* §12.7 step 6's central invariant, as a property of the guard's body:
           "once created, a session never changes storage model". Asserted here
           because the check constraint alone would still permit the column to
           be widened later without anyone noticing the guard had never covered
           it. */
        describes: "the transition guard refuses a storage_model change",
        sql: `select coalesce(
                (select pg_get_functiondef(p.oid) like '%storage_model is fixed at creation%'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'enforce_assessment_session_transition'),
                false) as present`,
      },
      {
        /* The gate has to be IN the function, not only in the route (Amendment
           C1). If create_assessment_session stopped consulting the predicate,
           the cohort would become advisory and a direct PostgREST call would
           bypass it. */
        describes: "create_assessment_session routes through session_storage_model_for",
        sql: `select coalesce(
                (select pg_get_functiondef(p.oid) like '%session_storage_model_for(%'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'create_assessment_session'),
                false) as present`,
      },
    ],
  },
  {
    version: "20260814090000",
    name: "candidate_answer_kind",
    checks: [
      columnExists("item_versions", "answer_kind"),
      columnExists("item_versions", "source_strand"),
      columnExists("item_versions", "source_topic"),
      columnExists("item_versions", "source_tags"),
      columnExists("item_versions", "min_words"),
      columnExists("item_versions", "max_words"),
      constraintExists("item_versions", "item_versions_answer_kind_known"),
      {
        /* The point of the whole migration: a version-pinned paper is served
           from the candidate row, so no application-callable function needs to
           read an answer row for it (ADR-006 Amendment D, and the boundary
           Amendment A drew). If this stops being true, the least-privilege
           scoring role has been quietly worked around. */
        describes: "get_assessment_session serves answerKind without reading item_answer_versions",
        sql: `select coalesce(
                (select pg_get_functiondef(p.oid) like '%iv.answer_kind%'
                    and pg_get_functiondef(p.oid) not like '%item_answer_versions%'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'get_assessment_session'),
                false) as present`,
      },
      {
        /* An allocation with incomplete candidate metadata must be refused, not
           served with fields missing: the renderer dispatches on answerKind and
           would fall through to a default. */
        describes: "get_assessment_session refuses an item with incomplete candidate metadata",
        sql: `select coalesce(
                (select pg_get_functiondef(p.oid) like '%incomplete candidate metadata%'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'get_assessment_session'),
                false) as present`,
      },
      {
        /* The backfill's own postcondition, re-asserted against live data
           rather than trusted from the migration having run once: every
           answer-bearing item version has its discriminant, and it is the same
           one the key carries. */
        describes: "every answer-bearing item version carries the kind its key declares",
        sql: `select not exists (
                select 1 from public.item_versions v
                join public.item_answer_versions a on a.item_version_id = v.id
                where v.answer_kind is distinct from a.answer_key->>'kind'
              ) as present`,
      },
      {
        /* Read-side only. The step-7 content change must not have moved the
           learner-write boundary on the answer table by so much as a grant. */
        describes: "anon/authenticated still hold nothing on item_answer_versions",
        sql: `select not exists (
                select 1 from information_schema.role_table_grants
                where table_schema = 'public' and table_name = 'item_answer_versions'
                  and grantee in ('anon', 'authenticated')
              ) as present`,
      },
    ],
  },
  {
    version: "20260814100000",
    name: "assessment_session_resume_state",
    checks: [
      {
        describes: "get_assessment_session returns the sitter's own saved responses",
        sql: `select coalesce(
                (select pg_get_functiondef(p.oid) like '%session_responses%'
                    and pg_get_functiondef(p.oid) like '%''responses''%'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'get_assessment_session'),
                false) as present`,
      },
      {
        /* The response row also holds the scorer's output. A sitting in
           progress reading back its own correctness would be the exam telling
           the candidate the answers one question at a time (§17.1, §14.2). */
        describes: "get_assessment_session returns no correctness, status or marks",
        sql: `select coalesce(
                (select pg_get_functiondef(p.oid) not like '%score_status%'
                    and pg_get_functiondef(p.oid) not like '%is_correct%'
                    and pg_get_functiondef(p.oid) not like '%awarded_marks%'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'get_assessment_session'),
                false) as present`,
      },
      {
        /* Reading responses back through the definer reader must not have been
           accompanied by opening the table itself. */
        describes: "session_responses still has no anon/authenticated privileges",
        sql: `select not exists (
                select 1 from information_schema.role_table_grants
                where table_schema = 'public' and table_name = 'session_responses'
                  and grantee in ('anon', 'authenticated')
              ) as present`,
      },
      {
        /* The table's only policies are the scoring role's (20260812110000).
           A policy naming `authenticated`, `anon` or PUBLIC would mean a direct
           learner path had been built alongside the definer reader — which is
           how "reads go through one function" quietly stops being true. */
        describes: "no session_responses policy names a learner role",
        sql: `select not exists (
                select 1 from pg_policy p
                join pg_class c on c.oid = p.polrelid
                join pg_namespace n on n.oid = c.relnamespace
                where n.nspname = 'public' and c.relname = 'session_responses'
                  and (
                    p.polroles = '{0}'::oid[]
                    or exists (
                      select 1 from unnest(p.polroles) r
                      where r::regrole::text in ('anon', 'authenticated')
                    )
                  )
              ) as present`,
      },
    ],
  },
  {
    version: "20260815090000",
    name: "resolved_sittings",
    checks: [
      viewExists("resolved_sittings"),
      viewExists("visible_sittings"),
      viewExists("resolved_sitting_questions"),
      viewExists("visible_sitting_questions"),
      viewExists("resolved_manual_marks"),
      viewExists("visible_manual_marks"),
      {
        /* Per-question MARKS stay teacher-only. essay_marks has exactly one
           policy and 20260812100000 restated the rule for manual_marks: a
           student or parent predicate here would be a product change smuggled
           in as a migration. */
        describes: "visible_manual_marks is restricted to teachers alone",
        sql: `select coalesce(
                (select pg_get_viewdef('public.visible_manual_marks'::regclass) like '%is_teacher_of_student%'
                    and pg_get_viewdef('public.visible_manual_marks'::regclass) not like '%is_parent_of%'
                    and pg_get_viewdef('public.visible_manual_marks'::regclass) not like '%auth.uid()%'),
                false) as present`,
      },
      {
        /* THE de-duplication, asserted against the view's own text. Drop this
           predicate and every backfilled sitting is counted twice, in every
           consumer at once, with no error anywhere (ADR-005 Amendment A3). */
        describes: "resolved_sittings excludes backfill copies by legacy_session_id",
        sql: `select coalesce(
                (select pg_get_viewdef('public.resolved_sittings'::regclass)
                        like '%legacy_session_id IS NULL%'),
                false) as present`,
      },
      {
        /* The rule is shared; the access control is not. resolved_sittings sees
           both models whole, so a learner grant on it would be every child's
           results. Learners read visible_sittings; admins read the aggregates. */
        describes: "resolved_sittings and resolved_sitting_questions are granted to nobody",
        sql: `select not exists (
                select 1 from information_schema.role_table_grants
                where table_schema = 'public'
                  and table_name in ('resolved_sittings', 'resolved_sitting_questions')
                  and grantee in ('anon', 'authenticated', 'PUBLIC')
              ) as present`,
      },
      {
        describes: "visible_sittings is selectable by authenticated, not anon",
        sql: `select (
                exists (
                  select 1 from information_schema.role_table_grants
                  where table_schema = 'public' and table_name = 'visible_sittings'
                    and grantee = 'authenticated' and privilege_type = 'SELECT'
                )
                and not exists (
                  select 1 from information_schema.role_table_grants
                  where table_schema = 'public' and table_name = 'visible_sittings'
                    and grantee in ('anon', 'PUBLIC')
                )
              ) as present`,
      },
      {
        /* §17.3: the three disjuncts mirror the base tables' three SELECT
           policies through the same SECURITY DEFINER helpers. A broad predicate
           appearing here — an org-wide or role-wide disjunct — would be the
           permissive-OR trap the spec forbids. */
        describes: "visible_sittings restricts through the same three relationships as the base policies",
        sql: `select coalesce(
                (select pg_get_viewdef('public.visible_sittings'::regclass) like '%is_parent_of%'
                    and pg_get_viewdef('public.visible_sittings'::regclass) like '%is_teacher_of_student%'
                    and pg_get_viewdef('public.visible_sittings'::regclass) like '%auth.uid()%'),
                false) as present`,
      },
      {
        /* Strictly read-only. A writable view over two models would be a way to
           write one model's row through the other's name. */
        describes: "no resolution view is insertable, updatable or deletable",
        sql: `select not exists (
                select 1 from information_schema.views
                where table_schema = 'public'
                  and table_name in ('resolved_sittings', 'visible_sittings',
                                     'resolved_sitting_questions')
                  and (is_insertable_into = 'YES' or is_trigger_updatable = 'YES'
                       or is_trigger_deletable = 'YES' or is_trigger_insertable_into = 'YES')
              ) as present`,
      },
    ],
  },
  {
    version: "20260815100000",
    name: "admin_views_resolution_aware",
    checks: [
      {
        /* ADR-005 §7's grep-invisible dependency, closed. Each of the six must
           read the resolution rule rather than a legacy table, or the cutover
           leaves the admin dashboards silently reporting only legacy sittings. */
        describes: "no admin view still reads exam_attempts",
        sql: `select not exists (
                select 1 from pg_class c
                join pg_namespace n on n.oid = c.relnamespace
                where n.nspname = 'public' and c.relkind = 'v'
                  and c.relname in ('admin_platform_totals', 'admin_weekly_activity',
                                    'admin_score_distribution', 'admin_subject_performance',
                                    'admin_skill_performance', 'admin_question_stats')
                  and pg_get_viewdef(c.oid) like '%exam_attempts%'
              ) as present`,
      },
      {
        describes: "every admin view still gates on is_admin()",
        sql: `select not exists (
                select 1 from pg_class c
                join pg_namespace n on n.oid = c.relnamespace
                where n.nspname = 'public' and c.relkind = 'v'
                  and c.relname in ('admin_platform_totals', 'admin_weekly_activity',
                                    'admin_score_distribution', 'admin_subject_performance',
                                    'admin_skill_performance', 'admin_question_stats')
                  and pg_get_viewdef(c.oid) not like '%is_admin()%'
              ) as present`,
      },
      {
        describes: "every admin view keeps security_barrier",
        sql: `select not exists (
                select 1 from pg_class c
                join pg_namespace n on n.oid = c.relnamespace
                where n.nspname = 'public' and c.relkind = 'v'
                  and c.relname in ('admin_platform_totals', 'admin_weekly_activity',
                                    'admin_score_distribution', 'admin_subject_performance',
                                    'admin_skill_performance', 'admin_question_stats')
                  and coalesce(array_to_string(c.reloptions, ','), '') not like '%security_barrier%'
              ) as present`,
      },
      {
        describes: "no admin view is readable by anon",
        sql: `select not exists (
                select 1 from information_schema.role_table_grants
                where table_schema = 'public' and grantee in ('anon', 'PUBLIC')
                  and table_name in ('admin_platform_totals', 'admin_weekly_activity',
                                     'admin_score_distribution', 'admin_subject_performance',
                                     'admin_skill_performance', 'admin_question_stats')
              ) as present`,
      },
    ],
  },
  {
    version: "20260815110000",
    name: "erase_student_both_models",
    checks: [
      tableExists("erasure_audit"),
      functionExists("erase_student"),
      {
        /* The whole point: a child's data now spans two models, and an erasure
           that knew only the legacy tables would leave a complete linkable
           record in the model the platform is moving to (§17.5). */
        describes: "erase_student clears both storage models and the auth identity",
        sql: `select coalesce(
                (select pg_get_functiondef(p.oid) like '%assessment_sessions%'
                    and pg_get_functiondef(p.oid) like '%exam_sessions%'
                    and pg_get_functiondef(p.oid) like '%auth.users%'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'erase_student'),
                false) as present`,
      },
      {
        /* §17.5 step 1 is verifying the requester, and that flow does not exist.
           A grant here would put an unverified erasure one PostgREST call away
           from any signed-in user. */
        describes: "erase_student is executable by nobody",
        sql: `select not exists (
                select 1 from pg_proc p
                join pg_namespace n on n.oid = p.pronamespace
                join lateral aclexplode(p.proacl) a on true
                where n.nspname = 'public' and p.proname = 'erase_student'
                  and a.privilege_type = 'EXECUTE'
                  and a.grantee::regrole::text in ('anon', 'authenticated', 'public')
              ) as present`,
      },
      {
        describes: "the erasure audit is invisible to learners and holds no payload column",
        sql: `select (
                not exists (
                  select 1 from information_schema.role_table_grants
                  where table_schema = 'public' and table_name = 'erasure_audit'
                    and grantee in ('anon', 'authenticated')
                )
                and not exists (
                  select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'erasure_audit'
                    and column_name in ('display_name', 'email', 'result', 'responses', 'config')
                )
              ) as present`,
      },
    ],
  },
  {
    version: "20260816090000",
    name: "assessment_session_ui_state",
    checks: [
      tableExists("session_ui_state"),
      triggerExists("public", "session_ui_state", "session_ui_state_terminal_lock"),
      {
        /* The whole of A1, as a signature. The cursor and the flag list now have
           somewhere to be written from; without these two parameters the table
           exists and nothing can fill it. */
        describes: "commit_assessment_responses carries the resume cursor and flag list",
        sql: `select coalesce(
                (select pg_get_function_identity_arguments(p.oid)
                        = 'p_session_id uuid, p_responses jsonb, p_client_sequence bigint, '
                          || 'p_current_question_index integer, p_flagged_session_item_ids uuid[]'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'commit_assessment_responses'),
                false) as present`,
      },
      {
        /* Exactly one function of this name. The three-argument version was
           dropped rather than left beside the new one: two overloads of a write
           path is an ambiguity a caller resolves by accident, and every check
           above that uses a scalar subquery over `proname` would raise instead
           of failing cleanly. */
        describes: "commit_assessment_responses has exactly one overload",
        sql: `select (
                select count(*) = 1 from pg_proc p
                join pg_namespace n on n.oid = p.pronamespace
                where n.nspname = 'public' and p.proname = 'commit_assessment_responses'
              ) as present`,
      },
      {
        describes: "the flag list is validated against the session's own served-item ledger",
        sql: `select coalesce(
                (select pg_get_functiondef(p.oid) like '%assessment_session_items%'
                    and pg_get_functiondef(p.oid) like '%MM216%'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'commit_assessment_responses'),
                false) as present`,
      },
      {
        describes: "get_assessment_session returns the resume cursor and flags",
        sql: `select coalesce(
                (select pg_get_functiondef(p.oid) like '%currentQuestionIndex%'
                    and pg_get_functiondef(p.oid) like '%flaggedSessionItemIds%'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'get_assessment_session'),
                false) as present`,
      },
      {
        /* Same posture as session_responses: the sanctioned path is the definer
           pair, so the table itself is reachable by no learner-facing role. A
           grant here would be a direct write path to the learner's own resume
           state, which is one policy edit from a write path to somebody else's. */
        describes: "session_ui_state has no anon/authenticated privileges and no policy",
        sql: `select (
                not exists (
                  select 1 from information_schema.role_table_grants
                  where table_schema = 'public' and table_name = 'session_ui_state'
                    and grantee in ('anon', 'authenticated', 'PUBLIC')
                )
                and not exists (
                  select 1 from pg_policy p
                  join pg_class c on c.oid = p.polrelid
                  join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'session_ui_state'
                )
                and (
                  select c.relrowsecurity from pg_class c
                  join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'session_ui_state'
                )
              ) as present`,
      },
      {
        /* The scoring credential reads answer keys. Which questions a child
           found hard enough to flag is not part of that job, and a credential's
           blast radius is the set of things it can read (ADR-006 Amendment A). */
        describes: "the scoring role holds nothing on session_ui_state",
        sql: `select not exists (
                select 1 from information_schema.role_table_grants
                where table_schema = 'public' and table_name = 'session_ui_state'
                  and grantee = 'mindmosaic_scoring'
              ) as present`,
      },
    ],
  },
  {
    version: "20260816100000",
    name: "manual_marks_write_path",
    checks: [
      functionExists("record_manual_mark"),
      functionExists("get_manual_review_response"),
      {
        describes: "both marking functions are SECURITY DEFINER with a fixed search_path",
        sql: `select not exists (
                select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                where n.nspname = 'public'
                  and p.proname in ('record_manual_mark', 'get_manual_review_response')
                  and not (p.prosecdef and array_to_string(p.proconfig, ',') like '%search_path=%')
              ) as present`,
      },
      {
        /* §14.1, as a property of the signature: the request decides the mark
           and the feedback. It does not decide what the mark is OUT OF, who
           recorded it, or whose sitting it lands on — those are read from the
           pinned item version and from auth.uid(). A parameter that exists is a
           parameter that can be supplied. */
        describes: "record_manual_mark accepts no ceiling, marker or student parameter",
        sql: `select coalesce(
                (select pg_get_function_identity_arguments(p.oid)
                        = 'p_session_id uuid, p_session_item_id uuid, p_awarded_marks numeric, p_feedback text'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'record_manual_mark'),
                false) as present`,
      },
      {
        /* The ceiling comes from the ledger. Asserted against the function's own
           text because it is the single property an INSERT policy could not have
           expressed, and therefore the whole reason this is a function. */
        describes: "record_manual_mark reads max_marks from the pinned item version",
        sql: `select coalesce(
                (select pg_get_functiondef(p.oid) like '%item_versions%'
                    and pg_get_functiondef(p.oid) like '%marks_available%'
                    and pg_get_functiondef(p.oid) like '%is_teacher_of_student%'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'record_manual_mark'),
                false) as present`,
      },
      {
        /* ADR-006 Amendment D2: no application-callable function reads the
           answer table, and the rubric lives in it. The boundary is the role and
           the module, not the select list — so the assertion is that the table
           name does not appear in either function at all. */
        describes: "neither marking function names item_answer_versions",
        sql: `select not exists (
                select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                where n.nspname = 'public'
                  and p.proname in ('record_manual_mark', 'get_manual_review_response')
                  and pg_get_functiondef(p.oid) like '%item_answer_versions%'
              ) as present`,
      },
      {
        describes: "both marking functions are executable by authenticated, not anon or PUBLIC",
        sql: `select (
                not exists (
                  select 1 from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname in ('record_manual_mark', 'get_manual_review_response')
                    and not exists (
                      select 1 from aclexplode(p.proacl) a
                      where a.privilege_type = 'EXECUTE'
                        and a.grantee::regrole::text = 'authenticated'
                    )
                )
                and not exists (
                  select 1 from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                  join lateral aclexplode(p.proacl) a on true
                  where n.nspname = 'public'
                    and p.proname in ('record_manual_mark', 'get_manual_review_response')
                    and a.privilege_type = 'EXECUTE'
                    and a.grantee::regrole::text in ('anon', 'public')
                )
              ) as present`,
      },
      {
        /* The write is the function's alone. A direct INSERT or UPDATE grant on
           manual_marks would be a path on which the ceiling is whatever the
           request says — which is the whole thing this migration exists to
           prevent. SELECT stays, because the teacher's queue reads it. */
        describes: "manual_marks still grants learners no write and session_responses stays closed",
        sql: `select (
                not exists (
                  select 1 from information_schema.role_table_grants
                  where table_schema = 'public' and table_name = 'manual_marks'
                    and grantee in ('anon', 'authenticated')
                    and privilege_type <> 'SELECT'
                )
                and not exists (
                  select 1 from information_schema.role_table_grants
                  where table_schema = 'public' and table_name = 'session_responses'
                    and grantee in ('anon', 'authenticated')
                )
              ) as present`,
      },
    ],
  },
  {
    version: "20260816110000",
    name: "assignment_target_sitting_link",
    checks: [
      columnExists("assignment_students", "session_id"),
      constraintExists("assignment_students", "assignment_students_one_sitting_model"),
      functionExists("link_assessment_session_to_assignment"),
      {
        /* THE anti-double-count constraint, from the assignment's side. A row
           holding both ids would be one child credited with two sittings for one
           assignment, and a score lookup resolving both would report it twice —
           which is the exact failure the resolution rule exists to prevent one
           layer down. */
        describes: "a sitting is linked once, through one model",
        sql: `select coalesce(
                (select pg_get_constraintdef(con.oid) like '%attempt_id IS NULL%'
                    and pg_get_constraintdef(con.oid) like '%session_id IS NULL%'
                 from pg_constraint con join pg_class c on c.oid = con.conrelid
                 where c.relname = 'assignment_students'
                   and con.conname = 'assignment_students_one_sitting_model'),
                false) as present`,
      },
      {
        /* And from the sitting's side: one paper cannot answer two assignments. */
        describes: "assignment_students.session_id is unique where set",
        sql: `select exists (
                select 1 from pg_index i join pg_class c on c.oid = i.indexrelid
                where c.relname = 'assignment_students_session_once' and i.indisunique
              ) as present`,
      },
      {
        /* The narrowing that makes the linkage server-authoritative: the columns
           that already had a writer keep their grant, and the new one has
           exactly one writer. Same shape as profiles keeping `role` out of a
           user's reach. */
        describes: "authenticated may update status and attempt_id but not session_id",
        sql: `select (
                exists (
                  select 1 from information_schema.column_privileges
                  where table_schema = 'public' and table_name = 'assignment_students'
                    and grantee = 'authenticated' and privilege_type = 'UPDATE'
                    and column_name = 'status'
                )
                and not exists (
                  select 1 from information_schema.column_privileges
                  where table_schema = 'public' and table_name = 'assignment_students'
                    and grantee = 'authenticated' and privilege_type = 'UPDATE'
                    and column_name = 'session_id'
                )
              ) as present`,
      },
      {
        describes: "link_assessment_session_to_assignment is SECURITY DEFINER with a fixed search_path",
        sql: `select coalesce(
                (select p.prosecdef and array_to_string(p.proconfig, ',') like '%search_path=%'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'link_assessment_session_to_assignment'),
                false) as present`,
      },
      {
        /* Both identities are re-checked against auth.uid(), and a backfill copy
           is excluded — linking one would attribute a score to a row nothing
           reads while the legacy original stayed unlinked. */
        describes: "the link function re-derives the actor and excludes backfill copies",
        sql: `select coalesce(
                (select pg_get_functiondef(p.oid) like '%auth.uid()%'
                    and pg_get_functiondef(p.oid) like '%legacy_session_id is null%'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'link_assessment_session_to_assignment'),
                false) as present`,
      },
      {
        describes: "link_assessment_session_to_assignment is executable by authenticated, not anon or PUBLIC",
        sql: `select (
                exists (
                  select 1 from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                  join lateral aclexplode(p.proacl) a on true
                  where n.nspname = 'public' and p.proname = 'link_assessment_session_to_assignment'
                    and a.privilege_type = 'EXECUTE'
                    and a.grantee::regrole::text = 'authenticated'
                )
                and not exists (
                  select 1 from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                  join lateral aclexplode(p.proacl) a on true
                  where n.nspname = 'public' and p.proname = 'link_assessment_session_to_assignment'
                    and a.privilege_type = 'EXECUTE'
                    and a.grantee::regrole::text in ('anon', 'public')
                )
              ) as present`,
      },
      {
        /* The legacy path, asserted unchanged. attempt_id still references
           exam_attempts and still takes the writes it always did. */
        describes: "the legacy attempt_id linkage is untouched",
        sql: `select exists (
                select 1 from pg_constraint con
                join pg_class c on c.oid = con.conrelid
                join pg_class ref on ref.oid = con.confrelid
                where c.relname = 'assignment_students' and ref.relname = 'exam_attempts'
                  and con.contype = 'f'
              ) as present`,
      },
    ],
  },
  {
    version: "20260817090000",
    name: "erasure_requests",
    checks: [
      columnExists("profiles", "access_revoked_at"),
      tableExists("erasure_requests"),
      functionExists("request_student_erasure"),
      functionExists("cancel_student_erasure"),
      {
        /* Adding the column must not have handed authenticated a write path to
           it — 20260718090000's column-level grant lists display_name and
           year_level explicitly, and a plain `add column` does not extend
           that list, but this is exactly the kind of thing to assert rather
           than trust. */
        describes: "authenticated cannot write profiles.access_revoked_at directly",
        sql: `select not exists (
                select 1 from information_schema.column_privileges
                where table_schema = 'public' and table_name = 'profiles'
                  and grantee = 'authenticated' and privilege_type = 'UPDATE'
                  and column_name = 'access_revoked_at'
              ) as present`,
      },
      {
        describes: "at most one pending erasure request per student",
        sql: `select exists (
                select 1 from pg_index i join pg_class c on c.oid = i.indexrelid
                where c.relname = 'erasure_requests_one_pending_per_student' and i.indisunique
              ) as present`,
      },
      {
        /* student_id carries no FK, deliberately (the row must survive
           erase_student deleting the profile it names) — asserted so a later
           "helpful" add-constraint migration cannot reintroduce the ON DELETE
           RESTRICT trap ADR-005 §3 already produced once. */
        describes: "erasure_requests.student_id has no foreign key",
        sql: `select not exists (
                select 1
                from information_schema.table_constraints tc
                join information_schema.key_column_usage kcu
                  on kcu.constraint_name = tc.constraint_name
                 and kcu.table_schema = tc.table_schema
                where tc.table_schema = 'public' and tc.table_name = 'erasure_requests'
                  and tc.constraint_type = 'FOREIGN KEY'
                  and kcu.column_name = 'student_id'
              ) as present`,
      },
      {
        describes: "erasure_requests has RLS on, no anon/authenticated write privilege, admin-only read",
        sql: `select (
                (select relrowsecurity from pg_class where relname = 'erasure_requests')
                and not exists (
                  select 1 from information_schema.role_table_grants
                  where table_schema = 'public' and table_name = 'erasure_requests'
                    and grantee in ('anon', 'authenticated') and privilege_type <> 'SELECT'
                )
                and exists (
                  select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
                  where c.relname = 'erasure_requests' and pg_get_expr(p.polqual, p.polrelid) like '%is_admin%'
                )
              ) as present`,
      },
      {
        describes: "request/cancel are SECURITY DEFINER with a fixed search_path and admin-gated",
        sql: `select not exists (
                select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                where n.nspname = 'public'
                  and p.proname in ('request_student_erasure', 'cancel_student_erasure')
                  and not (
                    p.prosecdef
                    and array_to_string(p.proconfig, ',') like '%search_path=%'
                    and pg_get_functiondef(p.oid) like '%is_admin()%'
                  )
              ) as present`,
      },
      {
        /* The revocation, asserted against the request function's own text:
           the reversible flag, the GoTrue ban, and the session/refresh-token
           deletion, all three (ADR-012 §5). Not the destructive delete —
           erase_student is named nowhere in this migration. */
        describes: "request_student_erasure revokes access without naming erase_student",
        sql: `select coalesce(
                (select pg_get_functiondef(p.oid) like '%access_revoked_at%'
                    and pg_get_functiondef(p.oid) like '%banned_until%'
                    and pg_get_functiondef(p.oid) like '%auth.sessions%'
                    and pg_get_functiondef(p.oid) like '%auth.refresh_tokens%'
                    and pg_get_functiondef(p.oid) not like '%erase_student%'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'request_student_erasure'),
                false) as present`,
      },
      {
        describes: "cancel_student_erasure restores access and checks the window",
        sql: `select coalesce(
                (select pg_get_functiondef(p.oid) like '%access_revoked_at = null%'
                    and pg_get_functiondef(p.oid) like '%banned_until = null%'
                    and pg_get_functiondef(p.oid) like '%execute_after%'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'cancel_student_erasure'),
                false) as present`,
      },
      {
        describes: "request and cancel are executable by authenticated, not anon or PUBLIC",
        sql: `select (
                not exists (
                  select 1 from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname in ('request_student_erasure', 'cancel_student_erasure')
                    and not exists (
                      select 1 from aclexplode(p.proacl) a
                      where a.privilege_type = 'EXECUTE' and a.grantee::regrole::text = 'authenticated'
                    )
                )
                and not exists (
                  select 1 from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                  join lateral aclexplode(p.proacl) a on true
                  where n.nspname = 'public'
                    and p.proname in ('request_student_erasure', 'cancel_student_erasure')
                    and a.privilege_type = 'EXECUTE'
                    and a.grantee::regrole::text in ('anon', 'public')
                )
              ) as present`,
      },
    ],
  },
  {
    version: "20260817100000",
    name: "erasure_processor",
    checks: [
      functionExists("process_due_erasures"),
      functionExists("admin_trigger_due_erasures"),
      {
        /* THE invariant this whole item exists to protect: erase_student stays
           ungrantable to authenticated even now that something calls it. */
        describes: "erase_student is still executable by nobody",
        sql: `select not exists (
                select 1 from pg_proc p
                join pg_namespace n on n.oid = p.pronamespace
                join lateral aclexplode(p.proacl) a on true
                where n.nspname = 'public' and p.proname = 'erase_student'
                  and a.privilege_type = 'EXECUTE'
                  and a.grantee::regrole::text in ('anon', 'authenticated', 'public')
              ) as present`,
      },
      {
        /* process_due_erasures is the only path that ever names erase_student —
           re-verified here, next to the invariant above, so a reviewer sees
           both halves of "ungrantable, and reached only by ownership" in one
           place.

           The candidate set is materialized before pg_get_functiondef runs
           over it, and restricted to prokind = 'f' (ordinary functions).
           Without that, the planner is free to evaluate pg_get_functiondef
           against rows the namespace/prokind filter would otherwise have
           excluded before a join reorders things — which is not hypothetical:
           an inlined version of exactly this query raised "array_agg is an
           aggregate function" from ruleutils.c on this schema, because
           pg_get_functiondef refuses to reconstruct an aggregate's definition
           and the planner had not yet excluded aggregate rows when it called
           the function. `with ... as materialized` is the fence. */
        describes: "process_due_erasures is the only function naming erase_student",
        sql: `select (
                with candidates as materialized (
                  select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.prokind = 'f' and p.proname <> 'erase_student'
                )
                select count(*) from candidates c
                where pg_get_functiondef(c.oid) like '%erase_student%'
              ) = 1 as present`,
      },
      {
        describes: "both erasure-processor functions are SECURITY DEFINER with a fixed search_path",
        sql: `select not exists (
                select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                where n.nspname = 'public'
                  and p.proname in ('process_due_erasures', 'admin_trigger_due_erasures')
                  and not (p.prosecdef and array_to_string(p.proconfig, ',') like '%search_path=%')
              ) as present`,
      },
      {
        /* THE authorization boundary is a GRANT, not runtime introspection —
           see the migration header for why. process_due_erasures is granted to
           nobody at all, matching erase_student's own posture exactly. */
        describes: "process_due_erasures is executable by nobody",
        sql: `select not exists (
                select 1 from pg_proc p
                join pg_namespace n on n.oid = p.pronamespace
                join lateral aclexplode(p.proacl) a on true
                where n.nspname = 'public' and p.proname = 'process_due_erasures'
                  and a.privilege_type = 'EXECUTE'
                  and a.grantee::regrole::text in ('anon', 'authenticated', 'public')
              ) as present`,
      },
      {
        describes: "admin_trigger_due_erasures is is_admin()-gated and calls the worker",
        sql: `select coalesce(
                (select pg_get_functiondef(p.oid) like '%is_admin()%'
                    and pg_get_functiondef(p.oid) like '%process_due_erasures%'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'admin_trigger_due_erasures'),
                false) as present`,
      },
      {
        describes: "admin_trigger_due_erasures is executable by authenticated, not anon or PUBLIC",
        sql: `select (
                exists (
                  select 1 from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                  join lateral aclexplode(p.proacl) a on true
                  where n.nspname = 'public' and p.proname = 'admin_trigger_due_erasures'
                    and a.privilege_type = 'EXECUTE' and a.grantee::regrole::text = 'authenticated'
                )
                and not exists (
                  select 1 from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                  join lateral aclexplode(p.proacl) a on true
                  where n.nspname = 'public' and p.proname = 'admin_trigger_due_erasures'
                    and a.privilege_type = 'EXECUTE'
                    and a.grantee::regrole::text in ('anon', 'public')
                )
              ) as present`,
      },
      {
        /* Idempotent by construction: the selection predicate is status and a
           deadline, re-checked every run, with no separate "have I run before"
           flag to fall out of sync with the rows it describes. */
        describes: "process_due_erasures selects only pending, due requests",
        sql: `select coalesce(
                (select pg_get_functiondef(p.oid) like '%status = ''pending''%'
                    and pg_get_functiondef(p.oid) like '%execute_after <= now()%'
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'process_due_erasures'),
                false) as present`,
      },
    ],
  },
];

/** Reconstructs the migration's filename, so the registry can be checked against disk. */
export function fileNameFor(entry: MigrationEntry): string {
  return `${entry.version}_${entry.name}.sql`;
}
