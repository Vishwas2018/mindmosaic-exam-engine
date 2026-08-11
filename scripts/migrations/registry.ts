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
];

/** Reconstructs the migration's filename, so the registry can be checked against disk. */
export function fileNameFor(entry: MigrationEntry): string {
  return `${entry.version}_${entry.name}.sql`;
}
