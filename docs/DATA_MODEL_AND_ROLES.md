# Data Model and Roles

## Status

This document defines the target data model and access rules for the multi-role
product (student, parent, teacher, admin) being built in phases on top of the
existing local-practice exam engine. It is written *before* implementation so
that Supabase schema and RLS policies are designed deliberately rather than
grown ad hoc. Treat this as authoritative alongside
[Architecture](ARCHITECTURE.md) and
[Assessment security model](ASSESSMENT_SECURITY_MODEL.md).

## Roles

| Role | Can do |
| --- | --- |
| `guest` | Practise without an account. No persistence, no server-authoritative scoring (see security model). Matches the existing "guests allowed" decision — sign-in is never required to practise. |
| `student` | Everything a guest can do, plus: persisted attempt history, view their own results/progress, see assignments made to them, participate in engagement/gamification features. |
| `parent` | Linked to one or more `student` accounts (their children). Can view (read-only) their linked children's progress, results, and engagement data. Cannot see other families' data. Manages billing for the household. |
| `teacher` | Linked to one or more classes. Can view students within their own classes only, create assignments scoped to their classes, view class-level analytics. Cannot see students outside their classes, cannot see billing. |
| `admin` | Operator-level role (you, initially). Can view aggregate/product analytics. Should still not casually browse individual children's raw answers outside of a documented support workflow — see the privacy doc. |

A single Supabase Auth user has exactly one primary `role` on their `profiles`
row. A parent who is also a teacher is a later, explicit extension, not
assumed by the initial model.

## Core tables (Phase 0)

```
profiles
  id uuid primary key references auth.users(id)
  role text not null check (role in ('student','parent','teacher','admin'))
  display_name text
  year_level int              -- students only (3 or 5)
  created_at timestamptz default now()

parent_children
  parent_id uuid references profiles(id)
  child_id  uuid references profiles(id)
  primary key (parent_id, child_id)

classes
  id uuid primary key default gen_random_uuid()
  teacher_id uuid references profiles(id)
  name text not null
  year_level int
  created_at timestamptz default now()

class_students
  class_id uuid references classes(id)
  student_id uuid references profiles(id)
  primary key (class_id, student_id)

exam_sessions              -- one row per started, server-selected exam
  id uuid primary key default gen_random_uuid()
  student_id uuid references profiles(id)
  config jsonb not null       -- year level, exam style, subject, count, timing
  seed text not null
  selected_question_ids text[] not null   -- server-selected, never client-supplied
  created_at timestamptz default now()
  expires_at timestamptz not null

exam_attempts               -- one row per submitted result
  id uuid primary key default gen_random_uuid()
  session_id uuid references exam_sessions(id)
  student_id uuid references profiles(id)
  responses jsonb not null
  result jsonb not null       -- the full ExamResult, server-computed
  submitted_at timestamptz default now()

assignments                 -- teacher-created, Phase 3
  id uuid primary key default gen_random_uuid()
  class_id uuid references classes(id)
  created_by uuid references profiles(id)
  config jsonb not null
  due_at timestamptz
  created_at timestamptz default now()

assignment_students         -- Phase 3
  assignment_id uuid references assignments(id)
  student_id uuid references profiles(id)
  status text default 'assigned'  -- assigned | in_progress | submitted
  attempt_id uuid references exam_attempts(id)
  primary key (assignment_id, student_id)

essay_marks                 -- teacher marking of manual-review (essay) responses
  id uuid primary key default gen_random_uuid()
  attempt_id uuid references exam_attempts(id)
  question_id text not null   -- content-bank id; not a DB foreign key
  marked_by uuid references profiles(id)
  awarded_marks numeric not null
  max_marks numeric not null  -- captured from the question at mark time
  feedback text
  marked_at timestamptz default now()
  unique (attempt_id, question_id)
```

A row in `essay_marks` only ever exists once a teacher has recorded a mark
for that question on that attempt — "pending" is not a stored status, it is
the absence of a row for a question `exam_attempts.result` already flagged
`pendingManualReview` (see
`src/features/exam-engine/scoring/exam-report.ts`). See
`src/features/teacher/marking-queue.ts` for the pure derivation and
`src/features/teacher/marking-data.ts` for the read-side queries.

Billing tables are deferred to Phase 5 and documented separately once a
payment provider is chosen — see
[Privacy and billing guardrails](PRIVACY_AND_BILLING_GUARDRAILS.md).

## Row Level Security — the rule that must never be relaxed for convenience

Every table above holding student data gets RLS enabled, default-deny, with
explicit policies:

- A `student` can `select`/`insert` only rows where `student_id = auth.uid()`.
- A `parent` can `select` (never write) `exam_attempts`/`exam_sessions` rows
  where `student_id` is in their `parent_children` set.
- A `teacher` can `select` rows where `student_id` is in a class they teach
  (via `class_students` join), and can `insert`/`update` `assignments` only
  for their own `classes`.
- `admin` bypasses via a service-role key used **only** in server-side code,
  never shipped to the client, and never used to satisfy a routine per-user
  request — admin aggregate views should be pre-aggregated, not raw per-child
  row access, wherever the dashboard use case allows it.

No table holding a child's individual responses, scores, or answer keys is
ever readable by `anon`. RLS policies are the enforcement mechanism, not
application-layer checks alone — assume any client-side role check can be
bypassed and the database must hold the line.

## Why sessions and attempts are server rows, not client state

This is the schema half of the server-authoritative scoring change (see
[Assessment security model](ASSESSMENT_SECURITY_MODEL.md) for the full
rationale): `exam_sessions.selected_question_ids` is chosen server-side and
`exam_attempts.result` is computed server-side from the server's own copy of
the question bank. The client never receives an answer key before
submission, and nothing the client sends can change how its own attempt is
scored. This is also what makes parent/teacher/admin views trustworthy —
they're reading a server-computed result, not a client-reported one.
