---
name: database-review
description: Schema validation and migration impact assessment for MindMosaic Supabase.
metadata:
  version: '1.0.0'
user-invocable: true
argument-hint: "[migration-or-schema-change]"
license: Apache 2.0
---

# Database Review Skill

Use this skill to evaluate Supabase schema changes, migrations, and database design in MindMosaic.

## When to Invoke

- Reviewing new migration files in `supabase/migrations/`
- Assessing schema changes for RLS impact
- Evaluating query performance
- Checking database role assignments
- Reviewing attempt persistence design

## Core Principles

1. **RLS enforcement.** All data access must be protected by Row Level Security policies.
2. **Role-based access.** Four roles: student, parent, teacher, admin.
3. **Migration impact.** Assess how changes affect existing data and queries.
4. **Server-authoritative.** Scoring and attempt persistence happen server-side.
5. **No production access.** PROD Supabase is off-limits unconditionally (see `AGENTS.md`); approval never unlocks it. Hosted DEV migrations need explicit approval in the current conversation.

## Review Checklist

- [ ] RLS policies for all tables
- [ ] Role assignments correct
- [ ] Migration is backward compatible
- [ ] No data loss risk
- [ ] Query performance acceptable
- [ ] Attempt persistence is server-authoritative
- [ ] Parent-child access controls enforced

## Output Format

Return:
1. **Schema assessment** — pass/fail with findings
2. **RLS policy review** — gaps or over-permissive rules
3. **Migration impact** — breaking changes, data loss risk
4. **Performance concerns** — slow queries, missing indexes
5. **Remediation steps** — specific fixes needed

Do not apply database migrations without explicit approval.
