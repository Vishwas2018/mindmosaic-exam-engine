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
        /* Presence of the policy proves nothing here — it existed before
           this migration too. What distinguishes applied from not applied is
           the role predicate inside its WITH CHECK. */
        describes: 'policy "exam_sessions: student creates own" gates on role = student',
        sql: `select coalesce(
                (select pg_get_expr(polwithcheck, polrelid) ~ 'role = ''student'''
                 from pg_policy where polrelid = 'public.exam_sessions'::regclass
                   and polname = 'exam_sessions: student creates own'),
                false) as present`,
      },
    ],
  },
];

/** Reconstructs the migration's filename, so the registry can be checked against disk. */
export function fileNameFor(entry: MigrationEntry): string {
  return `${entry.version}_${entry.name}.sql`;
}
