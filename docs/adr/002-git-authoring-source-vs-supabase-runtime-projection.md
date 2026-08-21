# ADR-002: Git is the authoring source of truth; Supabase holds a derived runtime projection

- **Status:** accepted
- **Date:** 2026-08-12
- **Spec:** §5.3 (immutable evidence), §7 (sources of truth), §9.7 (lifecycle dimensions), §21 Phase 1
- **Phase:** 0 (decision) / 1 (implementation)

## Context

Today there is exactly one content pipeline and it is entirely file-based.

Authoring happens in the question factory workspace at
`content/question-factory/`, whose compartments (`blueprints`, `generated`,
`staged`, `published-manifests`, `rejected`, `quarantined`, `archived`,
`reports`, `review-queue`) are enumerated in
`src/features/question-factory/storage/compartments.ts`. A candidate moves
through the closed state machine in `workflow/states.ts`:

```
blueprint_created → generated → structural_validation_passed →
correctness_check_passed → semantic_review_passed → originality_review_passed →
difficulty_review_passed → staged → published
```

with `needs_revision`, `rejected`, `quarantined` and `archived` as the
off-ramps. There is **no `approved` state and no `approvedBy` authority**;
sufficiency of review is carried by the manifest's own review chain
(`publication/manifest-schema.ts`) and its `CorrectnessBasis`
(`deterministic | independent_semantic_review`). `verifyReviewChain` makes that
chain tamper-evident, and manifest schema version 2 exists specifically so a
published question stays post-hoc auditable — version 1 manifests could not be
verified at all, which a 2026-07-30 audit discovered the hard way.

Publication is `assemble-published-bank.ts`: it reads every manifest in
`published-manifests`, refuses duplicate production IDs, and emits
`src/content/questions/generated/` (`generated-questions.ts`,
`batch-published.json`, `index.ts`) — TypeScript modules that are compiled into
the app. The runtime consequence is `publishedExamBank` in
`src/content/questions/practice-bank.ts`, and the only sanctioned reader is the
`server-only` gateway `src/server/exam-bank.ts`.

Supabase currently stores **no content at all**. It stores sessions, responses,
attempts, marks, profiles and billing. `exam_sessions.selected_question_ids`
holds bare string IDs that are resolved against the compiled bank at scoring
time (`src/app/api/exam/session/[id]/submit/route.ts:99-107`). That is the
weakness Phase 2 exists to fix: a historical sitting cannot be replayed after a
question is revised, because the ID does not pin a version.

Spec §7 requires that published content have **exactly one governed write path**
and forbids direct database editing and Git publication both mutating published
content.

## Decision

1. **Git is the authoring source of truth.** The question factory workspace and
   its publication manifests are authoritative for what has been authored,
   reviewed, and approved for publication. Every fact about *why* content is
   publishable — blueprint provenance, review chain, correctness basis,
   originality and difficulty evidence, revision history — lives there.

2. **Supabase holds a derived, immutable runtime projection.** From Phase 1,
   `items`, `item_versions`, `item_answer_versions`, `stimuli`,
   `stimulus_versions`, `item_scopes` and `item_skills` are populated *only* by
   projecting `published` manifests. The projection is a function of the
   manifests; it is never an independent record.

3. **The projection is one-directional and lossless in one specific sense.** It
   MUST carry content hashes, revisions, blueprint provenance, publication
   manifest ID and review evidence forward, so that a runtime row can be traced
   back to the exact manifest that produced it. It MUST NOT be the only copy of
   any of them.

4. **No second approval workflow may exist in Supabase.** The runtime MUST NOT
   introduce `in_review` or `approved` states. Runtime presence *is* the
   publication fact. Projection MUST verify that the source manifest corresponds
   to the factory's `published` state and passes the manifest schema and
   review-evidence rules, and MUST refuse otherwise. The mapping is exactly:

   | Factory candidate state | Runtime effect |
   | --- | --- |
   | `blueprint_created` … `staged` | no `item_versions` row |
   | `published` | insert the immutable item version, private answer version, manifest provenance and scope mappings |
   | `needs_revision`, `rejected`, `quarantined` | no `item_versions` row |
   | `archived` | no new version; a separate governed retirement operation MAY make an already-projected version unavailable for new allocation |

5. **Published content MUST NOT be edited in the database.** No human, admin
   surface, SQL console workflow, or application code path may `UPDATE` learner-
   visible content on a projected row. Correcting a question means authoring a
   new revision in the factory and re-projecting (ADR-003). Retirement and
   availability flags are the only runtime-mutable properties, and they are
   *operational*, not content.

6. **Write credentials are separated by role.** Projection runs as an audited
   publication job under server credentials that hold `INSERT` on the content
   tables. Application server code holds no write privilege on them at all, and
   `anon`/`authenticated` hold neither read nor write on
   `item_answer_versions` (spec §9.3). This mirrors the pattern the exam write
   RPCs already established in `20260811090000`–`20260811093000`: the privilege,
   not just the policy, is the boundary.

7. **The compiled bank and the projection MUST be shadow-compared before the
   projection is trusted** (spec §21 Phase 1 exit gate). A divergence in count,
   ID set, or content hash blocks the phase. During Phase 1 the compiled bank
   remains authoritative for delivery; the projection is observed, not served.

8. **The guest flow keeps reading the compiled bank.** Guest practice is
   deliberately client-side with no account and no server scoring, and
   `/api/exam/guest-bank` serves the authoring bank on that documented
   trade-off. Phase 1 and 2 MUST preserve it and MUST NOT route guests through
   the projection.

## Consequences

- Content review, diffing and rollback stay in Git, where they already work.
  A bad publication is reverted by reverting a commit and re-projecting, not by
  hand-repairing rows.
- Every runtime content row is reproducible from the repository. Losing the
  Supabase content tables is recoverable by re-running the projection; losing
  the manifests is not, which is the correct asymmetry.
- Clause 5 forbids an "edit this question" admin screen for published content,
  permanently. That is a real product constraint and is intended: an editable
  published item makes historical replay a lie.
- Clause 6 means the publication job needs its own credential and audit trail —
  new operational work in Phase 1, not free.
- Two systems must agree, and clause 7's shadow comparison is the only thing
  that proves they do. It is not optional overhead; without it the projection is
  an unverified copy.
- `generated-questions.ts` is currently ~1 MB of compiled content and
  `/api/exam/guest-bank` serves ~5.3 MB of JSON across three overlapping banks.
  Phase 1 does not fix that, and clause 8 keeps it in place. It should be
  tracked separately as a delivery-size concern, not smuggled into this ADR.

## Alternatives considered

- **Supabase as the authoring source, with an editing UI.** Rejected: it would
  require rebuilding review chains, tamper evidence, blueprint provenance and
  the gate machine inside the database, and it makes clause 5 impossible. The
  factory already provides all of it, verifiably.
- **Dual write — publish to both Git and Supabase as peers.** Rejected by spec
  §7 and by the same reasoning §12.7 uses against dual-writing sessions: two
  authoritative records diverge, and neither can then be trusted to adjudicate.
- **Project every candidate state, and filter at query time.** Rejected: it puts
  unreviewed content one predicate away from a learner, and it creates a second
  place where "is this publishable" is decided. Only `published` is projected.
- **Keep resolving bare question IDs against the compiled bank forever.**
  Rejected: it is exactly why a revised question silently changes the meaning of
  an old attempt. Version pinning (ADR-003, Phase 2) is the point.
- **Store answer keys in the same table as candidate content, guarded by RLS.**
  Rejected by spec §9.3 and by this repository's own precedent — the
  `server-only` import guard on `src/server/exam-bank.ts` exists because a
  policy that can be added can be added wrongly. Separate table, no privileges,
  one narrow `SECURITY DEFINER` reader.

## Amendment A (2026-08-12, Phase 1): governed source, not governed manifest

Appended rather than edited, per this directory's append-only rule.

Implementing Phase 1 surfaced a fact the original text assumed away: **only the
288 factory questions have publication manifests.** The ~1,005 curated questions
in `src/content/questions/question-bank.ts` have none and never did. They are
hand-authored in Git and governed by `scripts/validate-question-bank.mts` (plus
`check-question-correctness.mts` and the bank's own pinning tests), which is a
real governance chain — just not a manifest-shaped one.

Clause 2 above says the projection is populated "only by projecting `published`
manifests". Taken literally that would exclude 78% of the served bank, or force
a fabricated manifest for every curated item. Both are wrong: the first makes
the projection useless, the second manufactures provenance evidence, which is
exactly what ADR-003's `legacy_unversioned` reasoning refuses to do.

Accordingly:

A1. `item_versions.publication_manifest_id` **is nullable.**

A2. `item_versions.provenance_class` is a required discriminator with exactly
    two values today: `factory_manifest` and `curated_git_authored`. A database
    check constraint ties the two columns together — `factory_manifest` requires
    a manifest ID, `curated_git_authored` requires its absence — so "no
    manifest" can never be silently confused with "manifest not yet imported".

A3. The Phase 1 exit gate reads **"every published runtime item matches a
    governed SOURCE"** — a factory manifest *or* the Git-authored curated bank —
    not "a manifest". Clause 7's shadow comparison is unchanged in substance:
    count, ID set and content hash must agree with `publishedExamBank`.

A4. Clause 4's state mapping still governs the factory half in full. It does not
    apply to the curated half, which has no candidate state because it never
    passed through the factory.

**Review-evidence honesty.** All 288 manifests are `manifestSchemaVersion: 1`
and **not one carries a `reviewRecords` chain**, so `verifyReviewChain` cannot
run on any of them. Measured by the projection loader:

| `review_evidence_kind` | Manifests | Meaning |
| --- | ---: | --- |
| `verified_chain` | 0 | a chain `verifyReviewChain` accepts |
| `recovered_unverifiable` | 62 | `recoveredEvidence` rescued from ingest artefacts, each entry self-declaring `verifiability: "none"` |
| `none` | 226 | no recoverable evidence; the manifest declares `noChainRecovered` |

The 62 figure corroborates `publication/manifest-schema.ts`'s own account of
the 2026-07-30 audit — "could recover a reviewer identity for only 62 of them" —
from an independent code path, which is the strongest confirmation available
that the loader reads these manifests correctly.

So **226 of 288 factory-published items carry no recoverable review evidence at
all.** That is a pre-existing fact about content published before P0-B, not
something this phase introduces, and the projection's job is to record it
rather than round it off. `review_evidence_kind` is a required column with a
check constraint precisely so this cannot later be mistaken for "reviewed".

Clause 4's "passes the manifest schema and review-evidence rules" is therefore
satisfied *as far as the evidence allows*, verified using the factory's own
`validateManifestReviewEvidence` rather than a second implementation of the same
rules — 288 of 288 pass, because a legacy manifest is permitted to declare that
nothing was recoverable, but never permitted to be silent about it. When a v2
manifest is first published its kind becomes `verified_chain` and the chain is
checkable; the unit suite pins the current split so that transition is a
deliberate change rather than an unnoticed one.

## Amendment B (2026-08-12, Phase 1): `item_scopes` / `item_skills` deferred to Phase 1b

`item_scopes` requires `programme_offerings` and `item_skills` requires
`taxonomy_nodes`. Neither table exists, and Phase 0 did not create them —
"introduce stable taxonomy IDs and versioned taxonomy assets" (spec §21 Phase 0)
was not in the executed brief.

Building either "minimally" now would be worse than deferring. A stub
`programme_offerings` would become a second, independently maintained answer to
"is this combination valid", which ADR-001 §7 forbids: validity today derives
from `year-registry.ts` + `subject-registry.ts` in code. A stub `taxonomy_nodes`
would pre-empt spec §8's versioned taxonomy model. And creating foreign keys to
tables that do not exist is not possible in any case.

So Phase 1 ships **no `item_scopes` and no `item_skills`**, and creates no
foreign keys to absent tables. To keep the projection lossless, `item_versions`
carries the source scope facts as plain scalar columns — `source_year_level`,
`source_exam_style`, `source_subject`, `source_skill` — explicitly named
`source_*` because they are **the unresolved input to Phase 1b, not the scope
model**. ADR-003 §6's prohibition stands: these are not arrays, and they do not
become canonical. Phase 1b resolves them into `item_scopes(item_version_id,
programme_offering_id)` and `item_skills(...)` and the `source_*` columns are
dropped in that migration.

## Verification

- Phase 1 shadow comparison: projected row count, ID set and content hashes vs
  `publishedExamBank`. Any unexplained mismatch blocks the phase.
- A projection test MUST assert that a non-`published` manifest, and a manifest
  failing `verifyReviewChain`, both produce no runtime row.
- A privilege test MUST assert `anon` and `authenticated` hold no privileges on
  `item_answer_versions`, in the style of the existing
  `tests/rls/exam-responses.test.ts`.
- `src/tests/unit/stripe-server-only.test.ts` and
  `src/tests/unit/question-factory/governed-import-boundary.test.ts` are the
  precedents for source-scan enforcement of clause 6 in application code.

## Amendment C (2026-08-22, Gate A item A14): the spec text catches up to Amendment A

Appended rather than edited, per this directory's append-only rule.

**This amendment records no new engineering decision.** Amendment A above already
made the decision, at implementation time, on 2026-08-12: a second governed
source for published content, `curated_git_authored`, discriminated from
`factory_manifest` by `provenance_class`, enforced by the database check
constraints (`items_provenance_class_known`,
`item_versions_manifest_matches_provenance`) and proven by
`src/tests/unit/content-projection.test.ts` and
`src/tests/unit/platform-contracts.test.ts` since Phase 1 shipped.

What had not happened is that spec v1.2's own text — §7's sources-of-truth table,
§9.2's `item_versions` field list, §9.7's lifecycle-independence clauses, the
Phase 1 exit gate, and the §22 proof-obligation table — still read as if a
manifest were the only route to a published runtime item. External review #3
caught the contradiction between the accepted, implemented, tested ADR decision
and the un-amended top-level specification, and
`docs/phase2-cutover-readiness-checklist.md` tracked closing it as Gate A item
A14, filed as a "product-owner decision" because the checklist's own framing at
the time offered two options — bless the existing dual-provenance model in the
spec, or retroactively force the curated bank through the factory manifest
process it predates.

The second option was never a live one. Retrofitting 1,005 questions with
publication manifests they were never authored under would mean either
fabricating a review chain (a governance record where none exists — exactly what
Amendment A's own reasoning above refuses) or inventing a `manifestSchemaVersion:
1`-shaped stand-in whose `review_evidence_kind` would have to be manufactured
rather than measured, which is the identical mistake the `recovered_unverifiable`
/`none` accounting in Amendment A exists to prevent for the 288 manifests that
*do* exist. So A14 resolves as pure documentation reconciliation: spec v1.3
states the model this amendment already decided, with the two provenance classes
named as equally governed rather than one being an unblessed exception to the
other.

**Curated content MAY later be migrated through the review pipeline** — nothing
here forecloses building a retroactive manifest for some or all of the 1,005
curated questions, if a future product decision wants factory-grade review
evidence on them. That is a content-authoring investment, not a governance gap:
`curated_git_authored` content is validated and immutably projected today, which
is what §5.5's "database constraints before convention" and this ADR's own
governed-write-path requirement ask for. Migrating a curated item to
`factory_manifest` provenance would be a new `item_versions` row (a fresh
revision, per clause 2/8 above) authored through the factory, not a
reclassification of the existing one — provenance class is immutable, like
everything else on a published version.

### Verification

- Spec v1.3 §7/§9.2/§9.7/§21/§22 are amended to state the dual-provenance model
  that `items_provenance_class_known` and
  `item_versions_manifest_matches_provenance` already enforce, and cite this
  amendment and ADR-003 Amendment A at each amended section.
- No schema, RPC, or application code changed. The tests already listed under
  Amendment A's own review still hold: `src/tests/unit/content-projection.test.ts`
  and `src/tests/unit/platform-contracts.test.ts`.
- `docs/phase2-cutover-readiness-checklist.md` A14 is updated to **Done**,
  citing this amendment and the amended spec sections as closing evidence.
