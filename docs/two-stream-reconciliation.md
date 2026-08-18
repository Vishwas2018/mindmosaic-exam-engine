# Two-Stream Reconciliation: Phase 2 Cutover vs. Assessment Capability Expansion

> Status: analysis only. Read-only — produces no code or schema change, and does not
> decide anything. Written to lay out, with citations, what the product owner needs to
> weigh before either stream advances further.

## What this is

Two workstreams have been extending the same Postgres schema at the same time, in the
same working tree, without coordinating:

- **The Phase 2 cutover stream** — committed on `HEAD` through `3a69ee1`, closing Gate A
  items A10–A13 of `docs/phase2-cutover-readiness-checklist.md`.
- **The concurrent "assessment capability expansion" stream** — entirely untracked/unstaged
  in the same working tree: `docs/adr/014-media-options-groups-and-structured-responses.md`,
  `docs/NAPLAN_INTERACTION_FORMATS.md`, `supabase/migrations/20260818090000_naplan_interaction_answer_kinds.sql`,
  `supabase/migrations/20260820090000_assessment_capability_expansion.sql`, new renderers,
  part-based marking, media/item-group tables, and their tests.

One concrete collision between them is already recorded as Gate B item B5
(`docs/phase2-cutover-readiness-checklist.md:78`). This document is broader: it maps the
whole concurrent stream against the spec, enumerates every point where the two streams
touch, and lays out — without choosing — how a product owner might sequence them.

---

## 1. Scope — what the concurrent stream is actually building

### 1.1 Inventory

**Schema added** (`supabase/migrations/20260820090000_assessment_capability_expansion.sql`,
220 lines, additive-only per its own header comment at line 2):

| Object | Lines | What it is |
| --- | --- | --- |
| `assessment_families`, `programmes`, `programme_offerings` | 12–56 | Stable text-backed reference tables for "which assessment, which subject, which year, which locale" — seeded with 6 families and 6 programmes (all new: `australian_mathematics_competition`, `nsw_selective_high_school`, `nsw_opportunity_class`, `victorian_selective_entry`, `wa_aset`, `singapore_primary_mathematics`). **`programme_offerings` itself is seeded with zero rows** — the table exists, nothing populates or reads it yet. |
| `media_assets`, `media_asset_versions`, `media_asset_private_scripts`, `item_version_media` | 58–102 | Governed audio (image support is declared in ADR-014 but only audio columns/constraints are present: `kind = 'audio'` is a hard check at line 69). Versioned, content-addressed (`sha256` unique, line 83), immutable once published. Scripts/transcripts are a separate zero-privilege table (line 89, comment at line 217–218). |
| `item_groups`, `item_group_versions`, `item_group_version_stimuli`, `item_group_version_items` | 104–139 | Shared-stimulus multi-part items ("a passage with 5 questions") as an immutable, version-pinned group above the existing per-item `item_versions` row. |
| `assessment_session_items` gains `item_group_version_id`, `group_ordinal`, `part_label` | 141–149 | Nullable, additive; a check constraint (145–148) requires all three or none. No existing INSERT statement needs to change to stay valid. |
| `session_responses` gains `part_score_evidence` | 151–155 | Nullable jsonb, array-shaped. |
| `manual_marks` gains `part_id`, `rubric_version`; **`manual_marks_item_key` is dropped and recreated** with a different column set | 157–163 | See §2.1 — this is the regression already recorded as B5. |
| `grant update (part_score_evidence) on session_responses to mindmosaic_scoring` | 165 | See §2.2 — the second B5 regression. |
| `media_playback_events` | 167–174 | Minimal evidence table: session item, media version, play ordinal, timestamp. No transcript/response/prompt column (asserted by `src/tests/unit/assessment-capability-migration.test.ts:19-20`). |
| `reject_assessment_capability_version_update()` + 5 triggers | 180–196 | A second, simpler immutability trigger (unconditional `raise exception` on any UPDATE) applied to `media_asset_versions`, `media_asset_private_scripts`, `item_group_versions`, `item_group_version_stimuli`, `item_group_version_items`. Structurally identical in spirit to the `else` branch of `reject_content_version_update` (`supabase/migrations/20260812090000_runtime_content_projection.sql:278-281`), reimplemented as a new function rather than reused, because it applies to five tables `reject_content_version_update` has never named. |
| RLS + privilege posture | 198–220 | Every new table: RLS on, `revoke all` from `anon`/`authenticated` (198–215) — the same posture Phase 1/Phase 2 tables use. |
| `item_versions_answer_kind_known` widened again | 4–10 | `hot_text`, `matrix`, `structured` added to the already-widened set from `20260818090000` (see below). Third drop/recreate of this constraint across the two streams' history — Phase 2 never touches it. |

`supabase/migrations/20260818090000_naplan_interaction_answer_kinds.sql` (27 lines,
predates this session — already untracked when the cutover work started) does the first
widening: adds `hot_text`/`matrix` only (lines 5–14), metadata-only per its own header.

**Application code added/changed** (git diff against `HEAD`, `git status` for full file list):

- New question types and answer kinds in `src/schemas/question.schema.ts` (+516/-? lines):
  `hot_text`, `matrix_choice`, `structured_response` question types; `hot_text`, `matrix`,
  `structured` answer kinds; a `mediaAssetSchema` discriminated union (`governed_local` /
  `private_storage`); inline-gap and hot-text segment schemas; matrix row schemas.
- New renderers, registered additively in `question-renderer-registry.ts` (+6 lines) and
  `question-renderers/index.ts` (+3 lines): `HotTextRenderer.tsx`, `MatrixChoiceRenderer.tsx`,
  `StructuredResponseRenderer.tsx`, plus `region-position.ts` and `components/AudioStimulus.tsx`.
  `DragDropRenderer.tsx`/`LabelDiagramRenderer.tsx`/`MatchingRenderer.tsx` were substantially
  extended (+140/+77/+77 lines) for the new `inline_gap`/`graphic_gap`/`direct_placement`
  presentations `docs/NAPLAN_INTERACTION_FORMATS.md:15-19` describes.
- Scoring: `src/features/exam-engine/scoring/question-scorers.ts` gains `scoreHotText`,
  `scoreMatrixChoice`, `scoreStructuredResponse` and a `PartScoreEvidence` type (partId,
  status, earnedMarks, availableMarks, optional rubricVersion — **no answer text or answer
  key**, consistent with the existing §9.3.1 module-boundary guarantee). New
  `group-scoring.ts` (26 lines) is a pure aggregator over already-scored children — "child
  items remain the authoritative scoring units" (its own comment, line 12).
- `src/server/scoring/answer-access.ts` (+25/-6): adds `question-scorers.v2` to
  `SUPPORTED_SCORING_ALGORITHM_VERSIONS` (line 59) and a conditional `persistOutcomes` path
  that writes `part_score_evidence` when present — this is the code that needs the grant at
  migration line 165; it is not a stray grant.
- New `src/features/exam-engine/selection/adaptive-eligibility.ts` (41 lines): a pure,
  unwired fail-closed eligibility-predicate function (9 boolean/array facts in, `{eligible,
  reasons}` out). No caller in the diff. Phase-4-shaped (adaptive routing), same category as
  the already-flagged "Speculative Phase 4 / outbox tables" downstream item
  (`docs/phase2-cutover-readiness-checklist.md:91`).
- `src/schemas/platform/item-group-version.schema.ts` (44 lines): the Zod contract for a
  published item-group version, parallel in shape to `runtime-content-version.schema.ts`.
  Wired into `PLATFORM_VERSION_KINDS`/`platformVersionSchema` in
  `src/schemas/platform/index.ts` (+6 lines).
- `src/schemas/platform/common.ts` (+8/-2): `ASSESSMENT_FAMILIES` widened from
  `[...EXAM_STYLES, "curriculum_practice"]` to add `mathematics_competition`,
  `selective_entry`, `singapore_curriculum` — matching the families seeded at migration
  lines 40–47. **`revisionSchema` itself (line 71, `z.number().int().positive()`) is
  untouched** — A12 depends on this and is unaffected.

**Tests added**: `src/tests/unit/assessment-capabilities.test.ts` (182 lines),
`src/tests/unit/assessment-capability-migration.test.ts` (43 lines, reads the migration
SQL as text and regex-asserts naming/RLS/uniqueness properties — it does not run the
migration against a live database), `src/tests/unit/naplan-interaction-contracts.test.ts`
(144 lines), `src/tests/components/audio-stimulus.test.tsx` (45 lines). **None of these
exercise `tests/rls/` against a live Postgres**, which is why B5's two regressions
(§2.1–2.2) were not caught before this session found them.

### 1.2 Mapped against the spec

`docs/spec/scalable-assessment-platform-spec-v1.md`'s own phase roadmap (§21, lines
1110–1152) assigns:

| Concurrent-stream piece | Spec section | Phase | Assessment |
| --- | --- | --- | --- |
| `assessment_families`, `programmes`, `programme_offerings` | §6.2–6.3 (lines 204–239) | **Phase 3** (§10.3 lists "programme offering" as one of five inputs to an assessment profile version, line 525; profile/blueprint/framework versions "do not exist yet" per every Phase 2 migration that pins them as text, e.g. `supabase/migrations/20260812160000_session_storage_model_cohort.sql:240-241`) | Building a real piece of Phase 3 ahead of the rest of Phase 3's chain. Not wired to anything live (empty table, no reader). |
| `item_scopes`/`item_skills` normalization this enables | §9.5 (lines 398–408), explicitly `item_scopes(item_version_id, **programme_offering_id**)` | Phase 3 | Not built yet — `programme_offerings` is a prerequisite for it, not the normalization itself. ADR-002 Amendment B's deferred ledger (referenced throughout Phase 1/2 migrations, e.g. `20260812090000_runtime_content_projection.sql:24-30`) is unaffected — `source_year_level`/`source_exam_style`/`source_subject` on `item_versions` remain the unresolved Phase 1b input either way. |
| Audio/media (`media_assets` → `media_asset_versions` → `item_version_media`) | §9.4 (lines 388–397) names `stimuli`/`stimulus_versions` as the model for "shared passages, data tables, **audio, images**, and other shared context" | Ambiguous | The concurrent stream built a **second, parallel** hierarchy for audio rather than extending `stimulus_versions`. This may be deliberate and justified — private-asset licensing, playback-event evidence, and accommodation-visibility scoping are needs `stimulus_versions` was never designed for — but the spec text as written names one model for this concern, and now there are two. Worth an explicit call: is `media_assets` a §9.4 implementation choice, or a fork of it? |
| `item_groups`/`item_group_versions` | Not named in the spec at all | New | Genuinely new domain, not a Phase 3/4 item on the existing roadmap. Closest existing concept is `stimulus_versions`' dedup, one level up (grouping *items*, not just a shared *passage*). |
| `structured_response` / part-based marking | Not named in the spec | New | Genuinely new scoring domain (`question-scorers.v2`, `PartScoreEvidence`). Extends `session_responses`/`manual_marks` rather than replacing anything Phase 2 built. |
| `hot_text`/`matrix_choice` interaction types, inline-gap/graphic-gap presentations | §9 implicitly (new `question_type`/`answer_kind` values) | New content, same model | Pure widening of an already-open vocabulary — `item_versions.question_type` is deliberately free text (`docs/NAPLAN_INTERACTION_FORMATS.md:48-51`, restated identically in the migration's own header comment), so this needed no Phase 2 schema change at all. |
| `adaptive-eligibility.ts` | §13 (Exposure control), Phase 4 | Phase 4-shaped, unwired | Same category as the already-flagged speculative Phase 4 tables. |

**Net scope read**: about a third of this stream (families/programmes/offerings) is
Phase-3-shaped work being built early and in isolation from the rest of Phase 3's chain;
about a third (media, item groups) is new capability with no clean prior spec slot; and
about a third (new interaction types, part-based marking) is additive widening of models
Phase 1/2 already built to be open-ended (free-text `question_type`, JSONB response
storage, nullable candidate columns). None of it is Phase 2 (§12) work, and none of it
was blocked by anything Gate A left open.

---

## 2. Collisions & overlaps

Every point where the two streams touch, in the order discovered.

### 2.1 `manual_marks_item_key` vs. `record_manual_mark`'s `ON CONFLICT` — **hard conflict, live regression**

- Committed (A2, `20260816100000_manual_marks_write_path.sql:149`):
  `on conflict (session_id, session_item_id) where session_item_id is not null`.
- Concurrent (`20260820090000_assessment_capability_expansion.sql:157-163`): drops that
  index and recreates it as `(session_id, session_item_id, part_id) nulls not distinct
  where session_item_id is not null` — a different column list.
- Postgres requires an `ON CONFLICT` target to match a constraint's column list and
  predicate exactly. It no longer does. Every `record_manual_mark` call now fails with
  `there is no unique or exclusion constraint matching the ON CONFLICT specification`.
- **Proof**: `tests/rls/manual-marks-write-path.test.ts` and
  `tests/rls/target-sitting-end-to-end.test.ts` step 8 — 385/385 RLS tests green with only
  the four committed Gate A migrations applied (verified this session via `git stash push
  -u` + fresh `supabase db reset`), 9 of them red the moment `20260820090000` is also
  applied.
- Already recorded as Gate B item B5 (`docs/phase2-cutover-readiness-checklist.md:78`).
- **Classification: hard conflict.** Not a design disagreement — the new migration simply
  never updated the one function whose contract it changed. Fixing it is mechanical
  (restate `record_manual_mark`'s `ON CONFLICT` against the new three-column index) and
  does not require choosing between the two streams' designs.

### 2.2 `grant update (part_score_evidence)` vs. A13's scoring-role allowlist — **hard conflict, but the grant is correct**

- A13 (`20260812110000_scoring_role.sql`, restated as a registry check at
  `scripts/migrations/registry.ts:768`) asserts `mindmosaic_scoring` holds **exactly** eight
  column-level UPDATE grants — a positive least-privilege allowlist, not a blocklist.
- The concurrent migration adds a ninth, real grant (line 165) for a real, load-bearing
  write: `src/server/scoring/answer-access.ts`'s `persistOutcomes` (diff at lines
  391-425ish) writes `part_score_evidence` whenever a scored outcome carries
  `partEvidence`, which `scoreStructuredResponse` (`question-scorers.ts`) always produces
  for a `structured` answer key.
- **Classification: hard conflict at the check level, not a design conflict.** The grant is
  not an accidental widening — the feature genuinely needs it — but A13's registry check
  was written before this grant existed and does not know about it, so it fails exactly as
  designed (an unexpected grant is exactly the drift `scripts/migrations/registry.ts`
  exists to catch — see its own header, lines 1–21). The fix is to extend the allowlist to
  nine grants, not to revoke the ninth.

### 2.3 `programme_offerings` vs. A11's inline canonical shim — **supersession candidate, not yet active**

- A11 (`supabase/migrations/20260821090000_target_selector_canonical_offering.sql`) hard-codes,
  inside `create_assessment_session`, the exact two lists spec §6.3 calls "valid":
  `naplan_style` → years `{3,5,7,9}`, `icas_style` → years `2-12` (mirroring
  `EXAM_STYLE_YEAR_LEVELS`, `src/features/taxonomy/year-registry.ts:38-43`), and the
  `language` → `language_conventions` subject mapping (mirroring
  `REGISTRY_SUBJECT_BY_FILTER`, `src/features/exam-engine/selection/selection-config.ts:130-137`).
  This is explicitly a SQL restatement of a TS source of truth, checked for drift by a
  registry test (`scripts/migrations/registry.ts:2094-2130`) rather than a live import,
  because Postgres cannot import TypeScript.
- The concurrent migration creates `programme_offerings` (lines 28–38): `unique
  (programme_id, subject_id, year_level, locale, region)` — the generalized, table-backed
  version of exactly the same concept spec §6.3 names: "A programme offering is one valid
  administrable combination... The database MUST enforce uniqueness for this combination"
  (`docs/spec/scalable-assessment-platform-spec-v1.md:220-226`).
- Spec §6.3 goes further, and this is the load-bearing sentence for this collision: *"This
  valid-versus-ready split already exists in the repository... The database projection MUST
  preserve that semantic split; **it does not replace it with a second independently
  maintained rule set**"* (lines 236–239). Phase 0's own exit gate says the same thing in
  general terms: *"no competing source is introduced"* (line 1107).
- **Today, there is no active runtime contradiction.** `programme_offerings` is seeded with
  zero rows (no `INSERT` for it anywhere in the migration); the six `programmes` rows
  seeded (lines 49–56) are all *new* programmes (Australian Maths Competition, NSW
  Selective, NSW Opportunity Class, Victorian Selective Entry, WA ASET, Singapore Primary
  Maths) — **none of them is a `naplan_style`/`icas_style` core-practice programme**, so
  nothing currently asks `programme_offerings` "is NAPLAN Year 4 valid" and nothing could
  give an answer if it did. `create_assessment_session` never reads `programme_offerings`
  (confirmed: it is absent from the migration and A11's function body).
- **Classification: supersession candidate, latent.** The spec designates exactly one
  canonical validity source per offering and explicitly warns against a second one. A11 is
  the tactical, in-schema-today answer for the two exam styles Gate A had to close now;
  `programme_offerings` is the strategic, general answer the spec anticipates. They do not
  conflict *yet* only because they cover disjoint programme sets. The moment someone seeds a
  `naplan_style`/`icas_style` programme into `programme_offerings` and wires anything to
  read it, this becomes two authorities for the same fact, in direct tension with spec
  §6.3's own instruction.

### 2.4 `item_versions_answer_kind_known` — **independent, no conflict**

- Widened three times across the two streams' history: the original 12-kind list
  (`20260812090000_runtime_content_projection.sql`), `hot_text`/`matrix` added
  (`20260818090000_naplan_interaction_answer_kinds.sql:5-14`), `structured` added
  (`20260820090000_assessment_capability_expansion.sql:4-10`). Phase 2's four committed
  migrations never touch this constraint.
- A10 (`20260819090000_item_versions_immutability_whole_row.sql`) freezes `item_versions`
  by computing `to_jsonb(new) - array['projected_at'] is distinct from to_jsonb(old) -
  array['projected_at']` — a whole-row diff, not a named column list. **This already
  generically covers `answer_kind` values of `hot_text`/`matrix`/`structured` and any other
  column the concurrent stream adds to `item_versions` itself**, with no further Gate A
  work required. This is the one place the two streams touch where A10's design choice
  (explicitly made *because* an explicit column list had already broken once, per that
  migration's own header) pays off for content neither stream anticipated when A10 was
  written.
- **Classification: independent.** No fix needed on either side.

### 2.5 `reject_content_version_update` vs. `reject_assessment_capability_version_update` — **independent, but a design-consistency note**

- The concurrent stream's new immutability trigger (migration lines 180–196) reimplements
  the *unconditional*-reject half of `reject_content_version_update`'s pattern
  (`supabase/migrations/20260812090000_runtime_content_projection.sql:278-281`, the `else`
  branch covering `stimulus_versions`/`item_answer_versions`) as a **new**, separately
  named function, for five tables that function has never covered.
- No functional conflict — different tables, no shared state — but it is now true that
  this schema enforces "immutable after publication" via two independently maintained
  functions with the same logic, rather than one shared helper extended to cover more
  tables. Not a blocker; worth naming so a future consolidation is a deliberate choice
  rather than a surprise.
- **Classification: independent.**

### 2.6 Group-delivered items via the un-group-aware `create_assessment_session` — **latent, not yet active**

- `create_assessment_session`'s allocation query (A11 migration, and unchanged from
  `20260812160000_session_storage_model_cohort.sql:369-378` before it) selects individually
  from `item_versions` with no awareness of `item_group_version_id`/`item_group_version_items`.
  If a factory- or curated-authored item with `answer_kind = 'structured'` (or any item that
  is a declared member of an `item_group_version`) is ever projected, this function could
  allocate it as a lone item — losing its shared stimulus, `part_label`, and
  `shared_instructions` context — because it never populates
  `assessment_session_items.item_group_version_id`/`group_ordinal`/`part_label`.
- **Not active today**: the concurrent migration seeds zero `item_group_versions` rows, and
  nothing in either stream currently projects group-authored content into `item_versions`.
- **Classification: latent, not yet active.** Flagged so it is not rediscovered as a
  surprise once group content actually exists.

### 2.7 `question-scorers.v2` vs. the pinned `question-scorers.v1` — **independent, a gap not a conflict**

- `src/server/scoring/answer-access.ts:59` now accepts both `question-scorers.v1` and
  `question-scorers.v2`. `create_assessment_session` (A11 migration, and every version
  before it back to `20260812120000_assessment_session_create.sql:134`) still hard-codes
  `c_scoring_version constant text := 'question-scorers.v1'` on every session it creates.
- Nothing pins a v2 session today, so nothing scores under v2 through the target path —
  the new scorer functions (`scoreHotText`, `scoreMatrixChoice`, `scoreStructuredResponse`)
  are reachable only by direct module import (e.g. from a test), not through
  `create_assessment_session` → `scoreAssessmentSession`.
- **Classification: independent gap.** Whoever wires group/part-based delivery into the
  target session model will need to decide when a session pins v1 vs. v2 — that decision
  does not exist yet on either side.

### 2.8 Provenance model expansion vs. A14 — **scope growth, not resolution**

- A14 (`docs/phase2-cutover-readiness-checklist.md:38`) is the open product-owner decision
  about whether curated content without a manifest should be blessed by spec or forced
  through the manifest process.
- The concurrent stream adds **two more provenance shapes** the eventual A14 decision would
  need to also cover: `media_asset_versions` uses `creator`/`licence`/`copyright_notice`
  (migration lines 74–82) — no `provenance_class`, no `publication_manifest_id`, no
  manifest concept at all; `item_group_versions` (lines 112–122) likewise carries no
  provenance discriminator. ADR-014's "Version governance" section (its own file, lines
  20–22) introduces factory schema `2`/prompt `v2` for new candidate work, but this governs
  *authoring*, not *whether a group or a media asset needs a manifest* — that question is
  simply not asked yet for either new table.
- **Classification: scope growth.** A14 is not resolved or contradicted by this stream; its
  answer, whenever it lands, will need a wider footprint than it had when A10–A13 closed.

### 2.9 A15 (config-pin reproducibility) — **no contact**

- Nothing in the concurrent stream touches `assessment_sessions`' text version pins
  (`phase2-unblueprinted.v1`, `phase2-untaxonomised.v1`) or proposes an alternative to them.
  ADR-014's schema-version bump is a factory/content-authoring version, a different axis
  from A15's session-config pins.
- **Classification: independent, no contact.**

---

## 3. Options

Four realistic sequencing/merge paths, with concrete cost and risk for each.

### (a) Capability-expansion rebases onto Phase 2 and fixes the B5 regressions

The concurrent stream's owner restates `record_manual_mark`'s `ON CONFLICT` against the
new `(session_id, session_item_id, part_id)` index shape, extends
`scripts/migrations/registry.ts:768`'s allowlist to nine grants, then re-applies
`20260818090000`/`20260820090000` on top of the four committed Gate A migrations.

- **Cost**: small and mechanical for §2.1/§2.2 — two functions, one test file. The
  `programme_offerings`-vs-A11 tension (§2.3) is not resolved by this path, only
  deferred, since it does not require any code change today (no active conflict yet).
- **Risk**: low for what it fixes. The deferred risk is that `programme_offerings` gets
  populated and wired *after* this rebase, without anyone revisiting §2.3 — the two
  streams would then diverge again, silently, exactly as they did this time.
- Fastest path to a green combined suite; does not force anyone to resolve the
  architectural question in §2.3.

### (b) Phase 2 pauses and the two streams merge into one Phase 2.5/3 plan

Stop advancing Gate A items past A10–A13, and jointly design how `programme_offerings`,
item groups, and media fit into the same session model A10–A13 just hardened — likely
retiring A11's inline SQL mirror in favor of reading `programme_offerings` directly, once
it is actually populated for `naplan_style`/`icas_style`.

- **Cost**: highest. Blocks A9 (HTTP wiring) and Gate A closure indefinitely while a joint
  design happens; the checklist's own stated purpose — "the single list of what must close
  before a real cohort is opened" (`docs/phase2-cutover-readiness-checklist.md:4-5`) —
  stalls.
- **Risk**: lowest *architecturally* (one canonical offering authority from the start,
  exactly what spec §6.3 asks for) but highest *schedule-wise*, and it throws away the
  "ship the interim, swap it later" value A11 was explicitly built to provide (its own
  migration header calls the SQL mirror an explicit restatement, checked for drift — a
  design that assumes a later swap, not a permanent fork).

### (c) Sequence one stream to completion before the other

Either (c1) finish Gate A (A9/A14/A15) and open a cohort before the capability-expansion
stream lands at all, or (c2) finish the capability-expansion stream's Phase-3-shaped pieces
(`programme_offerings` fully populated and wired) before touching A9.

- **Cost (c1)**: the capability stream's untracked work sits idle or gets rebased
  repeatedly against a moving Phase 2 `HEAD`; every rebase re-risks §2.1/§2.2-shaped
  regressions on tables Phase 2 also touches (`manual_marks`, `session_responses`,
  `assessment_session_items`).
- **Cost (c2)**: Gate A stays open longer than it needs to — A9/A14/A15 do not depend on
  anything in the capability stream (§5), so blocking them on it is not required by
  anything technical, only by sequencing choice.
- **Risk**: whichever stream goes second inherits a bigger, harder-to-review diff against
  the other's now-larger `HEAD`. Neither ordering is obviously safer than (a); both are
  slower.

### (d) Isolate into separate worktrees, integrate at a defined point

Each stream continues in its own git worktree (the mechanism this session already used —
`git stash push -u` to isolate the concurrent stream — is the manual version of this), with
an explicit, scheduled integration commit that runs the full RLS suite against the union of
both migration sets before either is considered "done."

- **Cost**: process overhead (someone owns the integration step; it cannot be skipped or it
  reproduces this exact situation). Requires the two migration timestamp sequences to be
  coordinated at integration time (both streams currently pick timestamps independently —
  `20260819090000`/`20260819100000`/`20260821090000` for Phase 2, `20260818090000`/
  `20260820090000` for capability expansion — which happened to interleave without a
  timestamp collision this time, by luck rather than by protocol).
- **Risk**: lowest for catching future B5-shaped regressions early, *if* the integration
  step actually runs the live RLS suite (§1.1 notes the capability stream's own tests do
  not) rather than only the two streams' independent unit suites.
- This is close to what already happened this session, retroactively: worktree isolation
  plus a manual reconciliation pass. Formalizing it going forward costs little beyond
  discipline.

---

## 4. Recommendation (for the product owner to weigh, not a decision made here)

Given the evidence in §2, the two regressions (§2.1, §2.2) are mechanical and
low-risk to fix regardless of which broader path is chosen — there is no version of events
where leaving `record_manual_mark` broken or leaving the scoring-role allowlist wrong is
the right call. **Option (a)'s first half — fix §2.1 and §2.2 — looks safe to do
immediately, independent of any larger sequencing decision**, because:

- Fixing `record_manual_mark`'s `ON CONFLICT` restates it against the concurrent stream's
  *own* new index shape (`(session_id, session_item_id, part_id) nulls not distinct`) —
  it does not require choosing between the streams' designs, since the new index shape is
  a strict generalization of the old one (adds a column, doesn't remove the fact the old
  index enforced).
- Extending the registry allowlist to nine grants is additive to a check that already
  exists for exactly this purpose (`scripts/migrations/registry.ts:768`, see its file
  header at lines 1–21: "a ledger row therefore means verified present").

**The harder question — §2.3, `programme_offerings` vs. A11 — is a real product/architecture
decision, and this document takes no position on it**, beyond observing that spec §6.3
(lines 236–239) already states a preference for one canonical offering authority. Three
shapes the eventual answer could take, for the product owner to pick from:

1. Leave A11's inline mirror as Gate A's permanent answer for `naplan_style`/`icas_style`,
   and let `programme_offerings` cover only the new programmes (competition/selective-entry/
   Singapore) it was actually seeded for — accepting two authorities for two disjoint
   programme sets, not one authority split in two.
2. Populate `programme_offerings` with `naplan_style`/`icas_style` rows and retire A11's
   inline SQL in a follow-up migration that makes `create_assessment_session` read the
   table instead — the swap A11's own design anticipates, done once `programme_offerings`
   is actually ready to be read from.
3. Treat this as confirmation that Phase 3's offering model should be pulled forward
   deliberately (option (b) in §3), rather than arrived at accidentally through two
   uncoordinated streams.

Whichever is chosen, it does not need to block fixing §2.1/§2.2 first — those are correct
under any of the three shapes above.

---

## 5. Impact on the open Gate A items (A9, A14, A15)

- **A9 (target create/autosave/submit/score/review over HTTP,
  `docs/phase2-cutover-readiness-checklist.md:33`)** — **can proceed now, unaffected.**
  Nothing in the concurrent stream touches any `src/app/api/**` route (confirmed: no route
  file appears in `git status`). A9's own scope (origin-aware HTTP routes, mapping public
  question IDs to session-item IDs) does not depend on `programme_offerings`, media, item
  groups, or part-based marking. The one thing worth flagging for whoever picks up A9: if
  it lands before §2.7 (the `question-scorers.v1`/`v2` gap) is resolved, the HTTP routes it
  wires will inherit `create_assessment_session`'s current permanent pin to v1 — correct
  today, but a decision someone will have to revisit once/if group or part-based content is
  ever routed through the target model.

- **A14 (manifest-gate reconciliation, line 38)** — **should wait, or explicitly scope
  itself to "as of A10–A13," not "forever."** §2.8 shows the concurrent stream is adding
  provenance shapes (media assets, item groups) that don't fit either side of A14's current
  curated-vs-manifest framing. Deciding A14 now, without accounting for those, risks a
  second reconciliation the moment media/group content needs a provenance answer. Not
  technically blocked — A14 could still close for `item_versions` alone — but a
  product-owner decision made in ignorance of a scope that is already growing under it.

- **A15 (config-pin reproducibility, line 39)** — **no contact, proceed on its own
  schedule.** §2.9: nothing in the concurrent stream reads, writes, or reasons about
  `assessment_sessions`' text version pins. A15's decision (accept text pins for a canary,
  or build immutable config-version rows now) is orthogonal to everything in this document.
