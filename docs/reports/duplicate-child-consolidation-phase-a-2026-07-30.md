# Duplicate "Child A" profile — Phase A diagnosis, 2026-07-30

**Read-only.** Every figure below is a `SELECT` against the live project. No
row was inserted, updated or deleted. No recommendation has been acted on.

## 1. Counts, confirmed independently

Recounted straight from the tables, not taken from the brief:

| Child | id | Grade | profile created | sessions | responses | attempts |
|---|---|---|---|---|---|---|
| Child A | `215a84d7` | 3 | 2026-07-26 10:45:43 | 0 | 0 | 0 |
| Child B | `2668f328` | 5 | 2026-07-26 10:46:02 | 1 | 0 | 0 |
| Child A | `9c8f1353` | 3 | 2026-07-26 10:51:02 | 2 | 2 | 2 |

Matches the brief exactly.

### Which auth user is which, and which one she actually uses

| id | Login alias | auth user created | **last_sign_in_at** |
|---|---|---|---|
| `215a84d7` | `childcode+REDACTED@…` | 2026-07-26 10:45:43 | **null — never signed in, not once** |
| `2668f328` | `childcode+REDACTED@…` | 2026-07-26 10:46:02 | 2026-07-26 10:46:58 |
| `9c8f1353` | `childcode+REDACTED@…` | 2026-07-26 10:51:02 | 2026-07-26 10:51:37 |

This settles it. `215a84d7` is not "the account she used first" — it is an
account that has **never been signed into**. Its login code `REDACTED` was
issued and never redeemed. The code she actually holds and uses is
`REDACTED` → `9c8f1353`. Her real work is on the profile she actually uses;
the duplicate is inert in every sense.

## 2. How the dashboard picks the default child

Two files, and it is **not** `created_at`:

- **`src/features/parent-dashboard/queries.ts:116-118`** — children are
  sorted by display name:
  ```ts
  .sort((a, b) =>
    (a.profile.displayName ?? "").localeCompare(b.profile.displayName ?? ""),
  );
  ```
- **`src/features/parent-dashboard/components/ParentDashboard.tsx:363`** —
  the selected child is simply the first one:
  ```ts
  const [activeIndex, setActiveIndex] = useState(0);
  ```

For two children *with the same name*, `localeCompare` returns `0`.
`Array.prototype.sort` is stable, so the tie is broken by whatever order the
rows arrived in — and they arrive from `queries.ts:83`'s
`.in("id", childIds)`, which carries **no `ORDER BY`**. The winner is
therefore whatever order Postgres happens to return, which nothing in the
code controls.

Reproduced against the live database with exactly that query shape:

```
DB order for .in('id', childIds), no ORDER BY:
  [0] Child A 215a84d7 grade 3
  [1] Child B 2668f328 grade 5
  [2] Child A 9c8f1353 grade 3

after the localeCompare sort (stable → ties keep DB order):
  [0] Child A 215a84d7   <-- useState(0) picks THIS
  [1] Child A 9c8f1353
  [2] Child B 2668f328
```

So the dashboard shows the empty duplicate, and reports "No exams from
Child A yet" while two completed attempts sit on the sibling row. Worth being
blunt about: this is not a stable wrong answer, it is an *arbitrary* one —
a vacuum, an index rebuild or a row rewrite could silently flip which Child A
is shown.

## 3. What consolidating would require, and cost

### Every table referencing a child profile

All 11 FK columns pointing at `profiles(id)`, all `ON DELETE CASCADE`:

| Table | Column | Relevant to a *student*? | Rows for `9c8f1353` |
|---|---|---|---|
| `parent_children` | `child_id` | yes | 1 |
| `class_students` | `student_id` | yes | 0 |
| `assignment_students` | `student_id` | yes | 0 |
| `exam_sessions` | `student_id` | yes | 2 |
| `exam_responses` | `student_id` | yes | 2 |
| `exam_attempts` | `student_id` | yes | 2 |
| `parent_children` | `parent_id` | no — parent side | — |
| `classes` | `teacher_id` | no — teacher | — |
| `assignments` | `created_by` | no — teacher | — |
| `essay_marks` | `marked_by` | no — teacher | — |
| `subscriptions` | `parent_id` | no — parent | — |

`essay_marks` reaches a student only indirectly via `attempt_id`; she has 0.

### Does re-pointing need to cascade?

**Yes, and this is the trap.** `exam_attempts` and `exam_responses` each
carry their *own* denormalised `student_id` alongside `session_id`. Updating
`exam_sessions.student_id` alone would leave two attempts and two autosave
rows still pointing at the old profile — the dashboard reads
`exam_attempts.student_id` directly (`queries.ts:84-89`), so the work would
disappear from **both** children. All three tables must move in one
statement set, in one transaction.

### Constraint safety

No unique constraint anywhere involves `student_id`:

| Table | Constraint |
|---|---|
| `exam_sessions` | PK (`id`) |
| `exam_attempts` | PK (`id`) |
| `exam_responses` | PK (`session_id`) — note: keyed on session, not student |
| `parent_children` | PK (`parent_id`, `child_id`) |

So re-pointing violates no PK/unique constraint and no FK (both profiles
exist and are linked to the same parent). It is *mechanically* safe.

### Scoring / mastery aggregates

**None exist.** Scanned every column in every public table matching
`score|mastery|streak|total|count|progress|xp|level`; the only hits are
`profiles.year_level`, `classes.year_level` and `exam_sessions.expires_at`.
Every summary the parent dashboard shows is computed at read time in
`src/features/parent-dashboard/summary.ts` from the raw attempt rows.
Nothing is denormalised, so **nothing would need recomputation** after a
re-point.

### What re-pointing would still cost

The provenance model is the real objection. `exam_attempts.result` is a
server-computed record of *who sat which questions when*, and
`exam_sessions.student_id` is the identity the row was scored under.
Rewriting it makes the stored history say Child A-`215a84d7` sat exams at
10:52 and 11:03 on 26 July — when that account had, and still has, no
sign-in at all. It would be a quietly false record, and RLS would happily
serve it because RLS only checks `student_id = auth.uid()`.

### Is archiving simpler?

Yes on effort, but **"Archive" is not what the name suggests** and you
should know exactly what it does before choosing it:

`DELETE /api/parent/children/[childId]`
(`src/app/api/parent/children/[childId]/route.ts:133-137`) **deletes the
`parent_children` row**. There is no `archived` flag — the code comment says
so outright: *"requires no schema change (there is no archived-flag
column)"*.

Consequences:

- The child's auth user, profile, and all exam rows survive untouched. It is
  not a hard delete of the child.
- But the parent **loses RLS visibility** of that child: `is_parent_of()`
  stops matching, so every "parent reads linked children" policy stops
  returning their rows.
- It is described in the code as "reversible in principle" — and it is, but
  **there is no un-archive in the UI**. Restoring the link needs a
  service-role insert by hand.

For `215a84d7`, which has zero rows in every table, losing parent visibility
costs exactly nothing — there is nothing to lose visibility of. For any
child with data it would be a significant and not-obviously-reversible step.

## 4. Recommendation

**Option (a): archive the empty `215a84d7`, leave her work where it is, and
fix the default-selection logic.**

Reasoning:

1. **The duplicate has never been signed into.** `last_sign_in_at` is null.
   It is not a half-used account whose history needs preserving — it is an
   empty shell created by an accidental second submit. There is nothing on
   it to consolidate.
2. **Re-pointing (b) has all the risk and no benefit.** It would move 6 rows
   across 3 tables to land on the profile that is *less* correct: the one
   she has never used, whose login code was never redeemed. The direction of
   the merge is backwards — if anything were merged it should be *onto*
   `9c8f1353`, and since `215a84d7` has nothing, that merge is a no-op.
   The only thing (b) achieves is making the stored history claim an exam
   was sat by an account that has never logged in.
3. **(c) alone is not enough.** Fixing the default would put her real work on
   screen, but leaves two identical "Child A · Grade 3" chips in the switcher
   forever, with no way for you to tell which is which. The duplicate-name
   guard I added earlier stops *new* ones; it does not tidy this.
4. Archiving is the one action here that is genuinely low-consequence,
   *because* the row set is empty — the usual objection to this archive
   implementation (silent loss of parent visibility) does not apply.

**Caveat I want on the record:** archiving deletes a `parent_children` row.
That is a deletion, and you told me not to delete your data. I read that as
protecting the children, the auth users and the attempts — none of which
this touches — but it is a `DELETE` and you should say yes to it explicitly
rather than have me infer consent. If you would rather not delete even the
link row, **(c) plus leaving both profiles** is a perfectly defensible
second choice and I can make the switcher disambiguate same-named children
(e.g. by showing the login code or last-used date) so the two chips are
tellable apart.

**Regardless of which you pick**, the default-selection fix is unconditional
and I will do it: prefer a child with results over a same-named sibling with
none, and give the sort a deterministic tiebreak so the answer stops being
arbitrary.

## 5. Child B's abandoned session — does it block him?

**No. It does not block him, and no fix is needed.** Three independent
reasons, all verified:

1. **The session is long expired.** Created 2026-07-26 10:47:48, expired
   2026-07-26 11:07:48 (a 20-minute lifetime). `expires_at > now()` is
   `false`. Today is 2026-07-30.
2. **The guard ignores expired sessions by design.**
   `preventDuplicateActiveSession` (`src/features/session-recovery/guard.ts:13`)
   returns `true` — new session allowed — as soon as `expiresAt` is in the
   past.
3. **The guard is client-side only, and the resume lookup already filters
   expired rows.** `preventDuplicateActiveSession` is called only from
   `useActiveSession.ts:46`; `GET /api/exam/session/active` filters
   `.gt("expires_at", nowIso)` (`active/route.ts:45`) so it returns
   `no_active_session` (404) for Child B; and `POST /api/exam/session`
   performs **no active-session check at all** — it inserts unconditionally
   (`session/route.ts:104-113`).

So an orphaned session could only ever lock someone out during its own
lifetime window, and Child B's closed four days ago. His row is simply a
record of an exam he opened and walked away from. Leaving it alone.

## 6. Which content she actually experienced

Answering the Phase C question early, because it changes how the results
should be read.

The three banks (`src/server/exam-bank.ts:26-33`):

| `bankId` | Composition | Size |
|---|---|---|
| `curated` | the governed 100 | 100 |
| `published` | curated 100 + factory-published | 388 |
| `practice` | curated 100 + **1103 ungated auto-generated seeds** + factory-published 288 | 1491 |

Both of Child A's sessions were configured `bankId = "practice"`. Attributing
every one of her 30 selected question ids to its source:

| Session | Bank | n | from curated 100 | from **ungated seeds** | from the published 288 |
|---|---|---|---|---|---|
| `0cf69ce7` | practice | 10 | 1 | **9** | **0** |
| `a87d2fe4` | practice | 20 | 1 | **19** | **0** |
| Child B `eacdff62` | curated | 10 | 10 | 0 | 0 |

**She saw neither the curated bank nor the newly published 288.** 28 of her
30 questions came from `practiceQuestions` — the auto-generated seed pool
that the code itself describes as *"reachable but ha[ving] never been
through the publication chain"* (`practice-bank.ts:41-44`). Zero questions
came from the 288.

That matters for what you wanted this evidence for. Her scores — 8/10 and
18/20 — are real, but they are evidence about **ungated generated content**,
not about the governed bank or the factory-published set. If the question
you are trying to answer is "do our questions work for an 8-year-old", this
sample does not answer it for the content you would actually ship.

## 7. Data touched

None. Phase A made no writes of any kind.
