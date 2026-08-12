# ADR-003: Immutable item, answer and stimulus versioning

- **Status:** accepted
- **Date:** 2026-08-12
- **Spec:** §9.1–§9.5 (question-bank model), §5.3 (immutable evidence), §12.3 (session snapshot), §21 Phase 1–2
- **Phase:** 0 (decision) / 1–2 (implementation)

## Context

A question today is a single object in a compiled TypeScript module. Its ID is
its only identity: `exam_sessions.selected_question_ids` stores bare strings, and
`src/app/api/exam/session/[id]/submit/route.ts:99-107` resolves them against
whichever bank the running deployment happens to have compiled in.

The consequence is that **the meaning of a historical attempt changes when a
question is edited.** An attempt from March, replayed in August after a prompt
was reworded or a distractor fixed, scores against the August question. Nothing
records that the learner saw something else. The `result` jsonb in
`exam_attempts` preserves the score but not the stimulus that produced it, so
even a dispute cannot be adjudicated.

The factory already has most of the raw material. `fs-factory-repository.ts:809`
computes a SHA-256 `contentHash` over raw content; manifests carry `revision`,
`contentHash`, blueprint provenance and a verifiable review chain. What is
missing is that nothing downstream *pins* any of it.

Answer keys, rubrics and explanations are currently fields on the same question
object as the prompt. They are kept from the client by module boundaries —
`import "server-only"` on `src/server/exam-bank.ts`, plus an ESLint
`no-restricted-imports` rule on the content modules — and by
`toCandidateQuestions()`, which strips them before a session response is sent.
That works, and it works because there is no database to leak from. Once content
lands in Postgres, module boundaries stop being the boundary.

Shared passages exist but are duplicated: an ICAS reading passage used by six
questions is stored six times, so a typo fix is six edits that can drift.

## Decision

1. **`items` carries stable identity only.** UUID primary key, stable
   human-readable code, origin/provenance classification, created timestamp,
   optional retirement timestamp. Nothing that is a historical content snapshot
   belongs here. An `items` row is not versioned because it holds nothing that
   can meaningfully change.

2. **`item_versions` is immutable and holds all learner-visible content:** item
   ID and monotonic revision, question type, prompt/stem, options and
   interactions, structured visuals, accessibility data, estimated completion
   time, authored difficulty band, marks available, content schema version,
   content hash, publication manifest ID, publication timestamp.

   Changing prompt text, options, interaction rules, renderer-relevant content
   or explanation **MUST create a new version**. There is no `UPDATE` path on a
   projected `item_versions` row; the table MUST have no update or delete policy
   and `authenticated` MUST hold no write privilege on it (ADR-002 §5–6).

3. **Locale is a version axis, not a field.** A translated or locale-adapted
   question is a **distinct `item_version`**, scoped to the locale-specific
   programme offering via `item_scopes`. Content is **not** assumed
   locale-neutral. Concretely:
   - No `translations` map, `locale_variants` array, or per-locale column may
     store two locales' learner-visible content in one row.
   - Two locales MAY share an `items` row (it is recognisably the same question)
     and MUST NOT share an `item_versions` row.
   - A locale change produces a new content hash and a new revision, exactly as
     a prompt edit does.
   - Rationale: reading level, idiom, currency, units, name conventions and
     accessibility text are all locale-sensitive. A shared row would let
     `en-AU`-reviewed content be served as `en-GB` with no review evidence for
     what was actually shown. Per-locale versions make the review chain,
     content hash and publication decision per-locale, which is what they have
     to be to mean anything.

4. **`item_answer_versions` is a separate table** holding the item-version
   reference, answer key, grading rules and tolerances, rubric, private
   explanation or marking guidance, and grading schema version.
   - It MUST have **no `anon` or `authenticated` privileges** — not "no policy";
     no privilege. RLS default-deny is a second layer, not the layer.
   - Its only runtime reader MUST be a narrowly scoped `SECURITY DEFINER`
     scoring function with a fixed `search_path`, which authorizes the caller,
     resolves only the answer versions allocated to that caller's session, and
     returns scored outcomes — never answer rows.
   - No general answer-read RPC or view may be granted to `authenticated`.
   - Learners receive a sanitized candidate DTO produced by server-owned code,
     the direct successor of today's `toCandidateQuestions()`.

5. **`stimuli` / `stimulus_versions` hold shared passages, data tables, audio
   and images.** An `item_version` MUST pin the exact `stimulus_version` it
   uses. Multiple questions on one passage MUST NOT duplicate its content.
   A stimulus edit creates a new stimulus version and therefore new item
   versions for every item that adopts it — adoption is explicit, never
   implicit.

6. **Scope and skills are normalized, not arrays.** `item_scopes(item_version_id,
   programme_offering_id)` and `item_skills(item_version_id, taxonomy_node_id,
   role, weight)`. `year_levels[]`, `exam_families[]` and `skill_ids[]` MUST NOT
   be the canonical relational model — they cannot express the locale axis of
   clause 3, cannot be foreign-keyed, and cannot be indexed for the queries
   Phase 3 blueprints need.

7. **Sessions pin item-version IDs, never item IDs.** From Phase 2,
   `assessment_session_items` records the exact `item_version_id` served.
   Replaying a historical sitting MUST reproduce the original content and the
   original score. Legacy rows whose question ID cannot be bound to an exact
   imported revision and content hash MUST be labelled `legacy_unversioned`;
   they may keep their original JSON result for history but MUST NOT be
   recomputed or presented as reproducibly version-pinned (spec §12.7 step 4).

8. **Content hash is the identity check.** A projected version's hash MUST match
   its source manifest's. Two versions with the same hash under the same item
   are the same content and MUST NOT both be created.

9. **Lifecycle dimensions stay independent** (spec §9.7). Factory candidate
   state, runtime publication fact, adaptive eligibility, calibration status and
   operational availability are five separate facts on separate schedules. An
   item can be published and not adaptive-eligible. Recalibration MUST NOT
   mutate item content. Retirement MUST NOT delete a version — an attempt that
   used it must still resolve.

## Consequences

- Historical replay becomes correct, which is the whole point. A version-pinned
  sitting replays identically after a revision (spec §21 Phase 2 exit gate).
- Storage grows: every edit is a row, every locale is a row. This is intended
  and is cheap relative to the alternative.
- Clause 3 means a locale launch is a content programme, not a translation
  table. Honest, and more expensive than it first looks. Better to know now.
- Clause 4 makes the scoring function a genuine chokepoint. It must be written
  once, carefully, with the same discipline as `create_exam_session` /
  `record_exam_attempt` in `20260811090000` — which is the working local
  precedent for "the privilege, not the policy, is the boundary".
- Clause 7 forces an honest label on legacy data. Some historical attempts will
  be permanently `legacy_unversioned`. Marking them is better than a backfill
  that guesses which revision a learner saw.
- Clause 5 means fixing a typo in a shared passage touches every item using it.
  Explicit adoption makes that visible and reviewable instead of silent.
- Today's `server-only` + ESLint module guards remain necessary for the compiled
  bank throughout Phases 1–2, because it stays authoritative for delivery until
  cutover. Two boundaries coexist during the transition.

## Alternatives considered

- **Mutable items with an audit/history table.** Rejected: the live row stays
  the one the scorer reads, so a replay still uses current content unless every
  reader remembers to consult history. Immutability makes the correct behaviour
  the default rather than the disciplined one.
- **Version only when "meaningful" content changes; allow typo fixes in place.**
  Rejected: "meaningful" is a judgement made at edit time by someone who cannot
  see the downstream consequence, and a distractor typo can change which option
  is defensible. Any learner-visible change is a version.
- **Answer keys as columns on `item_versions`, protected by column privileges
  and RLS.** Rejected by spec §9.3. Column-level grants are easy to widen by
  accident, `select *` is everywhere, and a single mistaken policy exposes the
  key. A separate table with zero privileges fails safe.
- **Locale as a column, content assumed neutral** (see ADR-001 §5). Rejected:
  cheaper only until the first genuinely locale-sensitive item, by which point
  unreviewed content has shipped.
- **Denormalized `skill_ids[]` / `year_levels[]` arrays for query speed.**
  Rejected by spec §9.5. Postgres GIN indexes make arrays fast enough to be
  tempting, but they cannot carry the `role`/`weight` of a skill mapping, cannot
  be foreign-keyed to a versioned taxonomy node, and put referential integrity
  in application code.
- **Backfill a best-guess revision for legacy attempts** so everything looks
  version-pinned. Rejected: it manufactures evidence. `legacy_unversioned` is
  the honest label.

## Amendment A (2026-08-12, Phase 1): provenance class on every version

Appended rather than edited, per this directory's append-only rule. See
[ADR-002 Amendment A](002-git-authoring-source-vs-supabase-runtime-projection.md)
for the full reasoning; this records the consequences for the versioning model.

A1. Clause 2's required field list gains **`provenance_class`**
    (`factory_manifest` | `curated_git_authored`), and **`publication_manifest
    ID` becomes nullable** — the ~1,005 curated items are Git-authored and have
    no manifest. A check constraint keeps the pair consistent in both
    directions.

A2. Clause 8 ("content hash is the identity check") is unaffected and becomes
    more load-bearing, not less: for a curated item the content hash *is* the
    whole provenance link, since there is no manifest to compare against. Both
    halves are hashed with the factory's own `hashJson` (stable key order,
    newline-normalised) so curated and factory hashes are directly comparable
    and a single global uniqueness constraint covers both. Measured across the
    real bank: 1,293 items, 1,293 distinct hashes, no collisions.

A3. Clause 6 (normalized scope and skills) is **deferred to Phase 1b**, with the
    interim `source_*` scalar columns described in ADR-002 Amendment B. The
    prohibition on arrays as the canonical model is unchanged.

A4. Clause 5 (stimuli) is implemented in Phase 1 and is where the model earns
    its keep immediately. Measured: 237 questions embed a stimulus, but only 85
    are distinct — 54 are shared, the largest by 15 questions. The projection
    deduplicates by stimulus content hash and pins `stimulus_version_id`, so a
    passage that was stored 15 times is stored once.

A5. Clause 2's immutability is enforced by **privilege, policy and trigger**.
    `anon` and `authenticated` hold no privileges at all (including `TRUNCATE` —
    the gap `20260811093000` recorded as outstanding for the other public
    tables); RLS is enabled with no policies; and a `BEFORE UPDATE` trigger
    raises on any change to a learner-visible column. The trigger exists because
    the projection job itself runs as a privileged role, so revoking learner
    privileges alone would not stop an in-place content edit.

## Verification

- A replay test: score a pinned historical session, revise the item, re-score,
  assert identical output (spec §25.7).
- A privilege test asserting `anon`/`authenticated` hold **no** privileges on
  `item_answer_versions`, and that no view or RPC exposes answer rows —
  modelled on `tests/rls/exam-responses.test.ts` and the
  `20260811093000` residual-privilege checks in `scripts/migrations/registry.ts`.
- An immutability test: `UPDATE`/`DELETE` against `item_versions` as
  `authenticated` affects zero rows *and* is refused at the privilege level.
- A projection test: identical content hash ⇒ no duplicate version; differing
  locale ⇒ separate version rows sharing one `items` row (clause 3).
- A contract test on the candidate DTO asserting no answer key, rubric or
  private explanation can appear in it — the successor to the existing
  `toCandidateQuestions()` coverage.
