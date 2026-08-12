# MindMosaic Scalable Assessment Platform Specification

> Status: proposed
> Version: 1.1
> Date: 2026-08-12
> Target repository: `mindmosaic-exam-engine`
> Initial product scope: Years 3 and 5, NAPLAN-style and ICAS-style practice
> Expansion scope: Years 1–12 and additional assessment programmes without schema or engine forks

## 1. Purpose

This specification defines the maintainable and scalable target architecture for
MindMosaic's question bank, assessment configuration, exam delivery, adaptive
delivery, scoring, security, analytics, and year-level expansion.

The design evolves the current repository incrementally. It does not require a
greenfield rewrite, a microservice split, or a separate database schema for each
year, subject, or assessment family.

The core architectural flow is:

```text
Versioned taxonomy and authored content
  → governed publication pipeline
  → immutable Supabase runtime projection
  → version-pinned assessment delivery
  → server-authoritative scoring
  → append-only evidence
  → derived analytics and calibration
```

### 1.1 Version 1.1 corrections

This revision:

- Defines the cutover from the live `exam_sessions`, `exam_responses`,
  `exam_attempts`, and `essay_marks` tables and their hardened write RPCs.
- Aligns runtime publication with the question factory's authoritative
  `CANDIDATE_STATES`; it does not invent an `approved` state.
- Treats `src/features/taxonomy/year-registry.ts` as existing infrastructure,
  not work to recreate.
- Makes enemy-set handling conditional on defined conflicts while requiring an
  explicit enemy-set assessment for adaptive eligibility.
- Adds accessibility-sufficiency and child-data retention/erasure requirements.
- Defines the adaptive stage-completion response as the carrier of the next
  candidate allocation.

## 2. Normative language

The terms **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are
normative requirements.

- **MUST**: required for correctness, security, or historical integrity.
- **SHOULD**: the default unless an ADR records a justified exception.
- **MAY**: optional and safe to defer.

## 3. Goals

The platform MUST:

1. Support Years 1–12 without adding year-specific tables or application forks.
2. Support multiple subjects, assessment families, programmes, and locales through
   configuration and content.
3. Keep reusable question-bank content separate from assessment forms and sets.
4. Preserve the exact content, configuration, and algorithms used by every sitting.
5. Keep answer keys and private grading rules outside learner-accessible data paths.
6. Score signed-in assessment attempts on the server.
7. Support fixed-path exams now and multi-stage adaptive testing later.
8. Make content readiness measurable per blueprint cell and delivery route.
9. Prevent cross-user and cross-organization data access.
10. Permit analytics and calibration to evolve without mutating historical evidence.
11. Reuse the current question factory, publication manifests, renderer, scorers,
    migration registry, and server-authoritative exam flow.

## 4. Non-goals

The first implementation MUST NOT attempt to deliver all long-term intelligence
features at once.

The following are outside the foundation release unless separately approved:

- Microservice decomposition.
- A Turborepo conversion solely for architectural symmetry.
- Full item response theory.
- Automated psychometric claims without sufficient empirical data.
- Automatic concept repair, causal inference, or long-term learning orchestration.
- Institutional SSO and billing.
- Adaptive assessment for guests.
- A hard no-repeat guarantee for content pools that fail capacity gates.

## 5. Architectural principles

### 5.1 Modular monolith first

The application SHOULD remain a single Next.js deployment with clearly owned domain
modules. A domain MAY be extracted into a service only when independent deployment,
scaling, compliance, or team ownership produces a demonstrated benefit.

Required bounded domains are:

- Identity and authorization
- Taxonomy and curriculum
- Content authoring and publication
- Assessment configuration and blueprints
- Delivery engines
- Sessions and scoring
- Assignments
- Analytics and calibration

Each database table MUST have one owning domain and a documented set of authorized
write paths.

### 5.2 Configuration over branching

Years, subjects, assessment programmes, timing rules, blueprints, and delivery modes
MUST be represented as validated data. General UI and engine code MUST NOT contain
branches such as `if year === 3` except when implementing an explicitly documented
external assessment rule.

### 5.3 Immutable evidence

Anything required to reproduce a historical sitting MUST be immutable or snapshotted:

- Item content version
- Answer/grading version
- Stimulus version
- Assessment profile version
- Framework version
- Blueprint version
- Taxonomy version
- Engine algorithm version
- Scoring algorithm version
- Served order and routing decisions

Immutability is an integrity rule, not a permanent-retention mandate. When an
authorized erasure or retention-expiry process applies, the system MUST delete the
evidence or irreversibly sever its link to the child as defined in Section 17.5. It
MUST NOT rewrite the evidence into a different apparent historical fact.

### 5.4 Separate authored facts from measured estimates

Authored difficulty, empirical difficulty, discrimination, mastery, and predictions
are different concepts and MUST NOT overwrite one another.

### 5.5 Database constraints before convention

Important invariants MUST be protected by foreign keys, unique constraints, checks,
RLS, revoked privileges, or transactional functions. Application validation alone is
not sufficient.

## 6. Canonical product dimensions

### 6.1 Year level

Year level MUST be represented as:

```sql
smallint check (year_level between 1 and 12)
```

Year level MUST NOT be a UUID lookup where the only information is the number. A
display label such as "Year 5" is presentation derived from the number and locale.

The repository already implements the canonical product range in
`src/features/taxonomy/year-registry.ts` as `YEAR_LEVELS = [1..12]`. The same module's
`EXAM_STYLE_YEAR_LEVELS` is authoritative for valid assessment-style/year pairs:
NAPLAN-style Years 3, 5, 7, and 9; ICAS-style Years 2–12. Implementers MUST extend or
consume that registry rather than create another year matrix.

Any remaining narrower year lists MUST be classified before removal:

- An obsolete duplicate, such as a stale exported constant, MUST be removed or
  derived from the registry.
- A deliberate availability or persistence gate MAY remain, but MUST be named and
  documented as such and MUST NOT claim to define the product's supported years.

### 6.2 Assessment family and programme

An **assessment family** is the broad external or internal model, for example:

- `naplan_style`
- `icas_style`
- `curriculum_practice`

A **programme** is a named product within a family, for example a NAPLAN-style
Numeracy practice programme or an ICAS-style Mathematics programme.

Assessment families and programmes SHOULD use stable text identifiers backed by
reference tables. Extensible business identifiers MUST NOT use PostgreSQL enums.

### 6.3 Programme offering

A programme offering is one valid administrable combination:

```text
programme × subject × year_level × locale/region
```

The database MUST enforce uniqueness for this combination. Validity and readiness
are separate:

- **Valid** means the assessment/subject/year combination exists.
- **Ready** means sufficient governed content exists for a specific delivery mode.

Publishing content MUST NOT make an invalid combination valid, and an empty content
pool MUST NOT make a valid assessment combination disappear from administrative
planning.

This valid-versus-ready split already exists in the repository: validity is derived
from `year-registry.ts` plus `subject-registry.ts`, while current readiness is computed
in the server-only `coverage.ts`. The database projection MUST preserve that semantic
split; it does not replace it with a second independently maintained rule set.

### 6.4 Subject

Subjects MUST use stable identifiers such as `numeracy`, `reading`, or
`language_conventions`. Display labels MAY vary by programme and locale.

Strands and skills MUST be scoped to the relevant taxonomy version and, where
required, assessment family. A shared subject MUST NOT permit an ICAS-only strand to
be attached to a NAPLAN-style item merely because both use the same subject ID.

## 7. Sources of truth

| Concern | Authoritative source |
| --- | --- |
| Authored taxonomy | Versioned, Zod-validated repository assets |
| Authored questions and reviews | Question factory and publication manifests |
| Published runtime content | Immutable Supabase projection |
| Assessment configuration | Versioned framework, blueprint, and profile rows |
| Sessions, responses, and results | Supabase operational tables |
| Analytics | Rebuildable projections from immutable evidence |
| Calibration | Versioned empirical calibration records |
| Learner availability | Valid offering plus delivery-mode readiness calculation |

Published content MUST have exactly one governed write path. Direct database editing
and Git-based publication MUST NOT both mutate published item content.

## 8. Taxonomy model

### 8.1 Required entities

- `taxonomy_versions`
- `taxonomy_nodes`
- `taxonomy_edges`
- `programme_taxonomy_nodes`

### 8.2 Nodes

Taxonomy nodes MUST have stable IDs and a level:

```text
domain → strand → skill → subskill
```

Nodes SHOULD contain stable slugs, display labels, descriptions, curriculum codes,
and applicable year ranges. Content MUST reference node IDs, not display labels.

### 8.3 Edges

The model MAY support hierarchy, prerequisite, related, and cross-domain edges.
Prerequisite edges MUST form a directed acyclic graph within a published taxonomy
version.

### 8.4 Versioning

Published taxonomy versions MUST be immutable. A replacement is authored as a draft,
validated, and published as a new version.

The initial implementation MAY block taxonomy replacement when downstream learner
data exists. A later implementation MAY add explicit node migration maps. It MUST NOT
silently rewrite historical session evidence.

## 9. Question-bank model

### 9.1 Stable item identity

`items` represents the stable identity of a question and SHOULD contain only fields
that are not a historical content snapshot:

- UUID primary key
- Stable human-readable code
- Origin/provenance classification
- Created timestamp
- Optional retirement timestamp

### 9.2 Immutable item versions

`item_versions` MUST store immutable learner-visible content:

- Item ID and monotonic revision
- Question type
- Prompt/stem
- Candidate options and interactions
- Structured visuals
- Accessibility data
- Estimated completion time
- Authored difficulty band
- Marks available
- Content schema version
- Content hash
- Publication manifest ID
- Publication timestamp

Changing prompt text, options, interaction rules, renderer-relevant content, or
explanation MUST create a new version.

### 9.3 Private answers

`item_answer_versions` MUST be separate from candidate content and MUST contain:

- Item-version reference
- Answer key
- Grading rules and tolerances
- Rubric where applicable
- Private explanation or marking guidance
- Grading schema version

The table MUST have no `anon` or `authenticated` privileges. Learners MUST receive a
sanitized candidate DTO generated by server-owned code.

The only runtime reader of `item_answer_versions` MUST be a narrowly scoped
`SECURITY DEFINER` scoring function with a fixed `search_path`. It MUST authorize the
caller, resolve only the answer versions allocated to that caller's session, and return
only scored outcomes—not answer rows. Publication/administration jobs may write through
separately audited server credentials, but general application server code MUST NOT
select answer rows directly. No general answer-read RPC or view may be granted to
`authenticated`.

### 9.4 Stimuli

Shared passages, data tables, audio, images, and other shared context MUST use:

- `stimuli`
- `stimulus_versions`

An item version MUST pin the stimulus version it uses. Multiple questions based on
the same passage MUST not duplicate the passage content.

### 9.5 Scope and skills

The following mappings MUST be normalized:

- `item_scopes(item_version_id, programme_offering_id)`
- `item_skills(item_version_id, taxonomy_node_id, role, weight)`
- `item_blueprint_cells(item_version_id, blueprint_cell_id)` where prebinding is used

Arrays such as `year_levels[]`, `exam_families[]`, or `skill_ids[]` SHOULD NOT be the
canonical relational model.

### 9.6 Item families and enemy sets

Generated variants, near-duplicates, and questions sharing a construction template
MUST support an `item_family_id`. Questions that must not appear together MAY be
linked through enemy-set membership.

Every item considered for adaptive eligibility MUST complete an enemy-set assessment:
it either records its applicable enemy-set memberships or records an explicit
`no_known_enemy_set` outcome with the assessment method/version. This avoids treating
missing metadata as proof that no conflict exists.

### 9.7 Lifecycle dimensions

The following MUST remain independent:

1. Factory candidate state: the authoritative `CANDIDATE_STATES` value retained in
   publication provenance.
2. Runtime publication fact: the immutable item version exists because a valid
   `published` manifest was projected.
3. Adaptive eligibility: `not_assessed`, `eligible`, `ineligible`, `suspended`.
4. Calibration status: `uncalibrated`, `provisional`, `calibrated`, `stale`.
5. Operational availability: active/retired for new allocation.

An item can be published but not adaptive-eligible. Manual-review questions MUST NOT
influence live adaptive routing.

The runtime projection MUST NOT introduce `in_review` or `approved`. The question
factory has no `approved` state or `approvedBy` authority; review sufficiency is
carried by the manifest's review chain and correctness basis.

The projection from factory state to runtime is explicit:

| Factory candidate state | Runtime effect |
| --- | --- |
| `blueprint_created` through `staged` | No runtime item-version row |
| `published` | Insert the immutable item version, private answer version, manifest provenance, and scope mappings |
| `needs_revision`, `rejected`, `quarantined` | No runtime item-version row |
| `archived` | No new runtime version; a separate governed retirement operation may make an already projected version unavailable for new allocation |

Publication projection MUST verify that the manifest corresponds to the factory's
`published` state and passes the manifest schema/review-evidence rules. Runtime
presence is therefore the publication fact; implementers MUST NOT create a second
approval workflow in Supabase.

Adaptive eligibility requires a separately versioned review that proves all of the
following:

- The item is immediately machine-scorable.
- Its question and visual renderers are supported for the delivery client.
- Its blueprint, item-family, stimulus, and enemy-set assessment metadata is complete.
- It has no unresolved correctness, originality, or content QA flags.
- The question is answerable from its accessible representation. Alt text, structured
  data, reading order, labels, instructions, and keyboard interaction MUST convey all
  information required to answer; mere presence of alt text is insufficient.
- The applicable peer pool and blueprint cells pass their capacity gates.

An accessibility-sufficiency failure MUST make the item adaptive-ineligible even when
the visual renderer works and a sighted learner could answer it.

### 9.8 Calibration

`item_calibrations` MUST be append-only and versioned by algorithm/model. A calibration
record SHOULD include:

- Item-version ID
- Population/cohort scope
- Algorithm and version
- Sample size
- Estimated difficulty
- Discrimination or other supported parameters
- Confidence/uncertainty
- Effective timestamp

Recalibration MUST NOT mutate item content.

## 10. Assessment configuration

### 10.1 Framework versions

A framework version defines delivery behavior shared by profiles:

- Delivery mode
- Navigation rules
- Timing rules
- Stage structure
- Submission rules
- Scoring policy
- Supported question types
- Tool permissions
- Adaptive routing rules where applicable

Configuration MAY use JSONB, but every version MUST have a discriminator, schema
version, and corresponding Zod validation. Unvalidated arbitrary JSON is forbidden.

### 10.2 Blueprint versions

A blueprint version defines what the assessment measures. Its normalized cells MUST
support queries by:

- Section or stage
- Subject
- Strand/skill
- Difficulty band
- Question type
- Cognitive demand
- Stimulus requirements
- Marks and item count
- Estimated time
- Machine/manual scoring eligibility

Every cell MUST define a count or proportion and explicit matching constraints.

### 10.3 Assessment profile versions

An assessment profile version combines:

- Programme offering
- Framework version
- Blueprint version
- Delivery mode
- Duration and operational constraints
- Scoring algorithm version
- Availability status

A session MUST reference the exact profile version, never a mutable "current" profile.

### 10.4 Forms and question sets

`assessment_forms` and `assessment_form_versions` represent curated assessments.
`assessment_form_items` MUST pin item-version IDs and record ordinal, section/stage,
marks override, and blueprint-cell assignment.

Publishing a form creates an immutable snapshot. Editing an item later MUST NOT alter
an already published form.

## 11. Delivery engines

### 11.1 Engine boundary

Engines MUST be pure TypeScript modules outside React components. An engine receives
validated configuration and state and returns decisions. It MUST NOT write directly to
the database.

The server orchestration layer owns transactions, authorization, persistence,
idempotency, and DTO sanitization.

The minimum engine contract SHOULD support:

```ts
interface AssessmentEngine<State, Event, Decision> {
  initialise(input: InitialiseInput): State;
  apply(state: State, event: Event): State;
  decide(state: State): Decision;
  canNavigate(state: State, target: NavigationTarget): boolean;
  shouldTerminate(state: State): boolean;
}
```

### 11.2 Fixed-path delivery

Fixed-path delivery MAY allocate all items at session creation. It MUST still persist
each served item as a version-pinned `assessment_session_items` row.

### 11.3 Adaptive MST delivery

The first adaptive implementation MUST use three-stage multi-stage testing rather than
item-level CAT:

1. Stage 1 uses a fixed blueprint and rotating equivalent routing forms.
2. Stage 2 band is selected from the sealed Stage 1 score.
3. Stage 3 band is selected from the sealed running score.

Adaptive delivery MUST be signed-in and server-authoritative. Guests remain on the
fixed local/demo path.

## 12. Session model

### 12.1 Existing operational baseline

The repository already has a live and recently hardened session model:

- `exam_sessions` stores server-selected fixed question IDs and configuration.
- `exam_responses` stores mutable autosave responses until submission.
- `exam_attempts` stores the immutable submitted responses and server-computed result.
- `essay_marks` stores teacher marks against submitted attempts.
- `create_exam_session(...)` and `record_exam_attempt(...)` are fixed-`search_path`
  security-definer functions.
- The `20260811*` migrations revoke direct session/attempt writes, prevent response
  changes after submission, and harden the related RLS/role boundaries.

These tables and functions remain authoritative through Phases 0 and 1. They MUST NOT
be bypassed, weakened, or casually replaced while they serve existing sessions.

### 12.2 Target entities

- `assessment_sessions`
- `assessment_session_stages`
- `assessment_session_items`
- `session_responses`
- `stage_transitions`
- `assessment_results`
- `outbox_events`

These are the target version-pinned model, not an indefinitely parallel second source
of truth. Section 12.7 defines the mandatory cutover and retirement path.

### 12.3 Session snapshot

An assessment session MUST pin:

- Student ID
- Organization/context where applicable
- Assessment-profile version
- Framework version
- Blueprint version
- Taxonomy version
- Engine algorithm version
- Scoring algorithm version
- Content publication/build version
- Delivery mode
- Seed and server-owned form identifiers
- Lifecycle status and optimistic-lock version

### 12.4 Served-item ledger

`assessment_session_items` MUST record:

- Session ID
- Global ordinal
- Stage and within-stage ordinal
- Item and item-version IDs
- Content hash
- Stimulus and stimulus-version IDs
- Item-family ID
- Blueprint-cell ID
- Target band
- Routing/allocation decision
- Seed/form identifier
- Served timestamp
- Exposure window depth
- Forced-reuse reason, if any

This is the served-order record and the authoritative exposure ledger.

### 12.5 Responses

Each response MUST reference the exact served session item. Client-provided
correctness, score, difficulty, skill, or content identity MUST be ignored.

Objective correctness and marks MUST be computed on the server using the pinned answer
version. Manual-review responses MUST be stored without fabricated correctness.

### 12.6 Stage sealing

An adaptive stage transition MUST be a single atomic and idempotent operation that:

1. Locks the session.
2. Verifies ownership, status, expected version, and expected current stage.
3. Persists the final stage responses.
4. Seals the stage so its responses cannot be altered.
5. Scores the sealed stage on the server.
6. Records routing inputs, algorithm version, and routing decision.
7. Allocates and persists the next testlet.
8. Writes an outbox event where downstream work is required.
9. Returns the sealed-stage result and the next stage's sanitized candidate allocation,
   or the final-session state when no stage remains.
10. Returns that same stored result and allocation when the same idempotency key is
    retried; it MUST NOT select again.

Concurrent transitions MUST NOT allocate multiple next stages.

### 12.7 Existing-table cutover and retirement

Migration MUST use a cohort-gated expand–backfill–cutover–contract sequence. It MUST
NOT dual-write the same session to both models because that would create two
authoritative records that can diverge.

1. **Inventory and freeze the contract.** Document every current reader/writer of
   `exam_sessions`, `exam_responses`, `exam_attempts`, and `essay_marks`, including
   route handlers, reporting, assignment linkage, marking, RLS policies, triggers,
   constraints, and the two write RPCs.
2. **Expand.** Add the target tables, new RLS policies, verification-registry entries,
   and version-pinned replacement RPCs without changing legacy traffic.
3. **Backfill historical terminal data.** Map `exam_sessions` to
   `assessment_sessions`, `exam_attempts` to `assessment_results`, `exam_responses` or
   the attempt response snapshot to `session_responses`, and `essay_marks` to
   `manual_marks`. Each target row MUST carry its legacy source ID under a unique
   constraint so the backfill is idempotent.
4. **Classify content identity.** Create `assessment_session_items` only when each
   legacy question ID can be bound to an exact imported item revision/content hash.
   Unprovable legacy rows MUST be labelled `legacy_unversioned`; they may preserve the
   original JSON result for history but MUST NOT be recomputed or represented as
   reproducibly version-pinned.
5. **Shadow verification.** Compare ownership, timestamps, item order, responses,
   results, manual marks, and row counts. Any unexplained mismatch blocks cutover.
6. **Cut over new sessions only.** A server-side feature flag chooses the storage model
   for a newly created session. Once created, a session never changes storage model.
   Existing active legacy sessions continue through `create_exam_session`,
   `exam_responses`, and `record_exam_attempt` until submitted or expired.
7. **Dispatch reads by identity.** During the transition, server read services resolve
   the new model first and the legacy model second, or use a reviewed read-only union
   view. Clients MUST NOT independently query both and merge results.
8. **Move dependent workflows.** Results/history, assignment linkage, teacher marking,
   exports, deletion workflows, and analytics MUST be verified on the target model
   before their legacy readers are removed.
9. **Close legacy writes.** After no active legacy session remains and every application
   writer uses the target RPCs, revoke execution on obsolete write RPCs and revoke the
   remaining learner writes to `exam_responses`. Keep legacy tables read-only during a
   defined observation window.
10. **Contract.** Retire compatibility reads and archive or drop legacy tables only
    after backfill/reconciliation reports pass, rollback artifacts exist, the retention
    and erasure policy is honored, and an ADR authorizes the destructive migration.

Rollback before Step 9 routes new sessions back to the legacy model. Sessions already
created in the target model remain there and complete through the target path; rollback
MUST NOT copy live sessions between models.

### 12.8 Session lifecycle

The supported lifecycle SHOULD be:

```text
created → active ↔ interrupted → submitted → processed
                           ↘ abandoned
```

Allowed transitions MUST be enforced by server-owned functions. A submitted or
abandoned session is terminal for learner writes.

## 13. Exposure control and content capacity

### 13.1 Exposure keys

Exposure MUST be evaluated across:

- Item identity/version
- Stimulus/passage identity
- Item-family/template identity
- Enemy-set membership where the adaptive-eligibility assessment defines one

Question-ID-only exclusion is insufficient.

### 13.2 Best-effort and hard guarantees

The initial target is no repeated content across 50 sittings of the same subject where
capacity permits.

- If all capacity gates pass, the configured no-repeat window MAY be advertised as a
  guarantee.
- Otherwise selection is explicitly best-effort.
- Forced reuse MUST select the oldest eligible exposure first and record why reuse was
  necessary.

### 13.3 Capacity cells

Capacity MUST be measured by:

```text
family × programme × year × subject × route × stage × band × blueprint cell
```

Subject-wide totals such as "1,000 Numeracy questions" MUST NOT be used as the sole
readiness criterion.

### 13.4 Capacity simulator

Before enabling a delivery mode, a deterministic simulator MUST attempt to construct
the configured number of consecutive sittings for every reachable route while
respecting:

- Blueprint counts
- Skill and strand distributions
- Difficulty bands
- Stimulus grouping
- Defined enemy sets and explicit `no_known_enemy_set` assessments
- Machine-scoring restrictions
- Multi-key exposure windows
- Equivalent-form constraints

A cohort is adaptive-ready only when every reachable route passes.

## 14. Scoring and reporting

### 14.1 Server authority

Signed-in scoring MUST occur on the server. Learners MUST NOT directly insert or update:

- Correctness
- Marks earned
- Total scores
- Scaled scores
- Bands
- Completion state

### 14.2 Determinism

Given the same pinned content versions, responses, framework version, and scoring
algorithm version, scoring MUST produce the same result.

### 14.3 Manual review

Manual-review items MUST be excluded from objective percentage denominators until
marked. A blank manual item is unanswered, not pending review.

### 14.4 Adaptive reporting

Raw percentages from different adaptive routes MUST NOT be presented as directly
comparable. Until empirical scaling is validated, the product MUST either:

- Isolate adaptive pilot results from ordinary history and mastery comparisons; or
- Use a documented, route-adjusted provisional score clearly labelled as provisional.

The platform MUST NOT claim NAPLAN-equivalent measurement quality without validated
calibration and linking evidence.

## 15. Analytics and learning evidence

### 15.1 Evidence first

Committed responses and session-item snapshots are canonical evidence. Analytics
tables are rebuildable projections, not competing sources of truth.

### 15.2 Append-only events

An append-only event stream MAY be introduced for meaningful domain events such as:

- Item served
- Response committed
- Stage sealed
- Route selected
- Session submitted
- Manual mark recorded

Large duplicated payloads and private answer data MUST NOT be copied into events.

### 15.3 Incremental analytics

Initial analytics SHOULD include:

- Attempt and completion counts
- Correct rate by item version and cohort
- Distractor distribution
- Time-to-answer distribution
- Manual-review rate
- Content exposure
- Blueprint coverage
- Item-quality flags

Mastery, prediction, repair, and orchestration MUST be introduced as versioned
algorithms after evidence quality is established.

## 16. Identity, organizations, and roles

### 16.1 Current scope

The existing parent/student/class model MAY remain during the assessment-foundation
phases.

### 16.2 Institutional expansion

When school or tutor tenancy becomes active, use:

- `organizations`
- `organization_memberships`
- `parent_student_links`
- `class_groups`
- `class_memberships`

A user MAY hold multiple roles across multiple organizations. A single
`user_profile.tenant_id` and single global role MUST NOT be the long-term model.

### 16.3 Authorization

Authorization MUST derive from current database relationships. JWT claims MAY cache
coarse platform facts but MUST NOT be the sole authority for mutable membership or
multi-organization access.

## 17. Security and RLS

### 17.1 Content security

- Private answer tables MUST have RLS enabled and no learner-facing policies.
- Learners MUST NOT receive a queryable copy of the protected published bank.
- Learners MAY fetch only candidate content allocated to their accessible session.
- Review content MAY be returned only after final submission is durably recorded.

### 17.2 Write security

- Direct learner writes to authoritative session/result tables MUST be revoked where
  integrity depends on server orchestration.
- Security-definer functions MUST set a fixed `search_path`.
- Such functions MUST derive the actor from `auth.uid()` and independently re-check
  role, ownership, session state, and expiry.
- Client-provided user IDs, item IDs, scores, correctness, or allocation metadata MUST
  NOT be trusted.

### 17.3 RLS policy construction

Each policy MUST contain a complete authorization predicate. A broad tenant policy
MUST NOT be combined with narrower ownership policies under permissive `OR` semantics.

Every organization-scoped table MUST be covered by automated two-organization
isolation tests.

### 17.4 Logging

Logs MUST NOT contain:

- Raw learner responses where unnecessary
- Answer keys
- Full question stems
- Passwords or tokens
- Payment secrets
- Sensitive child profile data

Every request SHOULD carry a trace ID and structured error code.

### 17.5 Children's data retention, erasure, and de-identification

Before production use, the product owner MUST approve and publish a data schedule that
identifies the purpose, owner, retention period, and erasure behavior for every table
containing children's personal information, responses, telemetry, or derived profiles.
"Retain forever" is not an acceptable default.

The foundation defaults are:

| Data class | Default retention/action |
| --- | --- |
| Active child profile and identifiable assessment history | Retain while the account is active and the data is needed to provide the service; review after 24 months without learner activity |
| Response autosave/checkpoint buffers | Delete within 30 days after a terminal submission, abandonment, or expiry once the durable response/result exists |
| Fine-grained interaction telemetry | Retain for at most 12 months, then delete or irreversibly aggregate/de-identify |
| Application and security logs | Retain for at most 90 days unless an active security investigation places a documented legal hold |
| Idempotency records and transient job payloads | Delete after their retry/audit window, normally 24 hours to 30 days depending on purpose |
| Verified account closure or erasure request | Remove or irreversibly de-identify in primary systems within 30 days after any documented recovery grace period; encrypted backups MUST age out within 90 days |

These periods are MindMosaic product defaults, not a claim that Australian law
prescribes one universal schedule. The approved schedule MUST be reviewed against the
actual purposes, contracts, and legal obligations before launch. It implements the
OAIC APP 11 principle that personal information no longer needed should be destroyed or
de-identified, including copies held in archives or backups: [OAIC APP 11 guidance](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information).

The erasure workflow MUST:

1. Verify the requesting parent/guardian or otherwise authorized actor.
2. Revoke access immediately when closure takes effect.
3. Delete direct identifiers and child-authored free text, or irreversibly de-identify
   records that may lawfully and legitimately remain for aggregate statistics.
4. Remove links from sessions, responses, results, marks, assignments, analytics,
   exports, caches, outbox/job payloads, and search indexes.
5. Prevent re-identification by deleting the mapping key; replacing a child ID with a
   stable reversible pseudonym is not erasure.
6. Retain aggregate statistics only when they cannot reasonably identify the child and
   satisfy the approved minimum-cohort rule.
7. Record completion in a minimal erasure audit that contains no deleted response or
   profile payload.

Database deletion and de-identification behavior MUST be designed before foreign-key
actions are selected. Immutable evidence remains immutable while retained; erasure
deletes it or irreversibly severs identity rather than editing answers or scores into
different values. Legal holds or statutory retention exceptions MUST be documented,
time-bounded, access-restricted, and reviewed by the responsible privacy owner.

## 18. API contracts

All request and response bodies MUST be validated with Zod. Candidate-question DTOs
MUST structurally omit private answer and explanation fields.

Write endpoints that can be safely retried MUST accept an idempotency key. Reusing a
key with a different request hash MUST fail.

The minimum signed-in delivery API SHOULD include:

```text
POST /api/assessment/sessions
GET  /api/assessment/sessions/:id
PUT  /api/assessment/sessions/:id/responses
POST /api/assessment/sessions/:id/stages/:stage/complete
POST /api/assessment/sessions/:id/submit
GET  /api/assessment/sessions/:id/result
```

`POST /api/assessment/sessions/:id/stages/:stage/complete` is both the seal and advance
operation. A successful non-final response MUST contain:

- The sealed stage number and immutable stage score/result summary.
- The recorded routing decision and algorithm version.
- The next stage identifier and sanitized candidate items in served order.
- The new session version and timing/navigation metadata.

A final-stage response MUST contain the final-stage result and a terminal indication,
with no next allocation. Replaying the same idempotency key MUST return the same stored
response body. Clients MUST NOT perform a second "select next stage" request.

Fixed and adaptive delivery SHOULD share candidate, response, result, error, and
authorization contracts. Delivery-specific behavior belongs behind the engine and
framework boundary.

## 19. Migrations and operations

### 19.1 Migration discipline

Every schema change MUST:

1. Use a timestamped SQL migration in `supabase/migrations`.
2. Add a corresponding verification entry to `scripts/migrations/registry.ts`.
3. Include at least one check that fails when the migration is absent or incomplete.
4. Include RLS and privilege tests for affected tables.
5. Be safe to apply to an existing environment.

A standalone `schema.sql` MUST NOT bypass the repository migration process.

### 19.2 Backward-compatible rollout

Runtime migrations SHOULD follow expand–migrate–contract:

1. Add new structures without removing old reads.
2. Backfill and verify hashes/counts.
3. Dual-read or shadow-compare.
4. Cut over one flow behind a feature flag.
5. Observe and rollback if necessary.
6. Remove obsolete structures only in a later migration.

### 19.3 Partitioning and queues

Partitioning MUST be justified by observed row counts, query plans, retention needs,
and operational ownership. It SHOULD NOT be introduced merely because a table may be
large eventually.

An outbox and worker queue SHOULD be introduced when there is a real asynchronous
consumer. Empty future-facing tables and scheduled no-op jobs SHOULD NOT be deployed.

## 20. Scalability requirements

### 20.1 Scale drivers

Years and subjects are not the primary scaling risk. Session items, responses,
telemetry, and analytics events are.

The design MUST optimize first for:

- Indexed session ownership and status lookup
- Ordered session-item retrieval
- Idempotent response commits
- Exposure lookup by student and scope
- Item statistics by version and cohort
- Blueprint-cell capacity queries

### 20.2 Indexing

Indexes MUST be justified by real query shapes. At minimum, expect indexes for:

- Active session by student
- Session items by session and ordinal
- Responses by session item
- Exposure by student, programme/subject, and served time
- Published item scopes by offering and availability
- Item skills and blueprint cells
- Pending outbox events

### 20.3 Performance budgets

Initial service objectives SHOULD be:

| Operation | p95 objective |
| --- | ---: |
| Candidate item/stage delivery | 500 ms |
| Fixed session creation | 1,000 ms |
| Response autosave | 500 ms |
| Adaptive stage transition | 2,000 ms |
| Final objective scoring | 3,000 ms |
| Standard dashboard load | 2,000 ms |

Budgets MUST be verified under a stated load model rather than assumed.

## 21. Implementation sequence

### Phase 0 — Governance and contracts

- Establish `docs/adr/` and record the decisions in Section 23.
- Adopt the existing `src/features/taxonomy/year-registry.ts` `YEAR_LEVELS` and
  `EXAM_STYLE_YEAR_LEVELS` as the code authority; add no replacement registry.
- Audit remaining narrow/duplicate year constants. Remove or derive only genuine
  duplicates; retain deliberately named content-availability or DB-persistence gates.
- Preserve the existing valid-sitting checks and server-only coverage readiness model,
  and add regression citations/tests rather than reimplementing them.
- Introduce stable taxonomy IDs and versioned taxonomy assets.
- Define Zod schemas for runtime content, framework, blueprint, and profile versions.
- Inventory the current `exam_*`/`essay_marks` tables, RLS, RPCs, and all readers and
  writers as required by Section 12.7.

Exit gate: the existing canonical sources for years, subjects, valid sittings, and
coverage readiness are documented and regression-tested; no competing source is
introduced; and the legacy-session dependency inventory is complete.

### Phase 1 — Immutable runtime content projection

- Add item, item-version, private-answer, stimulus, scope, and skill tables.
- Import current publication manifests.
- Project only factory `published` manifests; do not add an `approved` state or a
  second review workflow.
- Preserve content hashes, revisions, blueprint provenance, and review evidence.
- Shadow-compare the database projection with the compiled bank.

Exit gate: every published runtime item matches a governed manifest, and answer tables
are inaccessible to learner roles.

### Phase 2 — Version-pinned fixed sessions

- Keep the hardened legacy tables/RPCs authoritative until the target path is ready.
- Add normalized sessions, session items, responses, results, manual marks, new RLS,
  and version-pinned replacement RPCs.
- Backfill terminal legacy data idempotently with unique legacy-source IDs and classify
  unprovable content as `legacy_unversioned`.
- Shadow-verify counts, ownership, ordering, responses, results, and essay marks.
- Cut over newly created fixed sessions by server-side cohort feature flag; never
  dual-write a session or migrate an active session between models.
- Dispatch transition-period reads in server code, then migrate results, assignments,
  marking, exports, erasure, and analytics consumers.
- Drain active legacy sessions before revoking obsolete RPC execution and remaining
  `exam_responses` writes; retain read-only compatibility for an observation window.
- Preserve the guest flow.

Exit gate: the Section 12.7 reconciliation report is clean; a version-pinned historical
sitting replays identically after a question revision; legacy-unversioned rows remain
honestly labelled and are never recomputed; no active legacy session remains before
legacy writes are closed.

### Phase 3 — Forms, blueprints, and capacity

- Add immutable form and blueprint versions.
- Normalize blueprint cells.
- Build capacity reporting and the 50-sitting simulator.
- Make readiness delivery-mode-specific.

Exit gate: every advertised fixed assessment can be assembled and every adaptive
candidate cohort has a measured capacity report.

### Phase 4 — Adaptive MST pilot

- Add stage state and sealed responses.
- Add atomic/idempotent stage-transition RPCs.
- Add server-owned rotating forms and multi-key exposure.
- Require adaptive-eligibility reviews to pass accessibility sufficiency and complete
  the enemy-set assessment.
- Pilot only cohorts passing capacity gates.
- Isolate or provisionally scale adaptive reporting.

Exit gate: concurrency, retry, route, exposure, and replay test suites pass.

### Phase 5 — Analytics and calibration

- Add append-only evidence where needed.
- Build incremental item statistics.
- Introduce versioned calibration and mastery algorithms.
- Validate estimates before changing learner-facing claims.

### Phase 6 — Institutional tenancy

- Add organizations and scoped memberships.
- Migrate authorization through a dual-read period.
- Add school/tutor functionality only after isolation tests pass.

## 22. Proof obligations and acceptance tests

| Invariant | Enforcement | Required test |
| --- | --- | --- |
| Adding a new year requires no schema or engine fork | Generic programme offerings | Add a Year 7 fixture using configuration/content only |
| Existing year authority is reused | `year-registry.ts` plus subject/coverage registries | Existing tests reject NAPLAN-style Year 4 and no second year matrix is introduced |
| Legacy sessions have one controlled retirement path | Storage-model discriminator, unique legacy IDs, reconciliation, and drained writes | Backfill twice idempotently; compare every mapped row; complete one legacy and one target session during cutover; prove no dual-write |
| Historical content cannot drift | Immutable versions and pinned session items | Revise an item, then replay an old session |
| Published forms cannot drift | Form items pin item versions | Republish an item and compare the old form hash |
| Runtime publication mirrors the real factory | Manifest-validated projection from `published` only | Attempt to project every non-published `CANDIDATE_STATES` value; assert no runtime item version and no `approved` state exists |
| Learners cannot fetch answers | Private table privileges and candidate DTO | RLS test, API contract test, and client-bundle scan |
| Answers have one runtime read path | Fixed-`search_path` scoring definer returning outcomes only | Direct authenticated and general app-server reads fail; scoring succeeds only for versions allocated to the caller's session |
| Learners cannot forge scores | Server scoring and revoked writes | Attempt direct score/result insertion |
| Cross-user data cannot leak | Ownership-aware RLS | Two-student isolation suite |
| Cross-organization data cannot leak | Membership-aware RLS | Two-organization isolation suite |
| A stage routes exactly once | Lock, unique transition, idempotency key | Concurrent double-transition test |
| A retry returns the same next testlet | Stored transition result | Replay the same idempotency key |
| Scoring is reproducible | Pinned algorithms and content | Golden deterministic replay |
| Adaptive content is sufficient | Capacity simulator | Construct 50 sittings for every route |
| Adaptive items are accessibility-sufficient | Versioned eligibility review | Reject an item whose answer depends on visual information absent from its accessible representation |
| Adaptive conflict metadata is explicit | Enemy-set membership or versioned no-known-conflict assessment | Reject adaptive eligibility when the assessment is missing; enforce a defined enemy set in selection |
| Forced reuse is explainable | Allocation reason fields | Exhaust a test pool and verify oldest-first reuse |
| Manual responses do not pollute objective scores | Scoring contracts | Blank, answered, and marked essay cases |
| Taxonomy replacement preserves history | Version pinning | Publish a new taxonomy and resolve an old result |
| Child erasure does not falsify history or leave identity links | Retention schedule plus deletion/de-identification workflow | Erase a seeded child across operational, analytical, cache, job, export, and backup-tracking fixtures; prove no reversible link remains |
| Migrations cannot silently drift | Migration registry | Fresh apply plus live object verification |

## 23. Required ADRs

Implementation MUST begin with these decision records:

1. Canonical years, assessment families, programmes, and programme offerings.
2. Git authoring source versus Supabase runtime projection.
3. Immutable item/answer/stimulus versioning.
4. Framework, blueprint, profile, and form versioning.
5. Existing `exam_*`/`essay_marks` cutover, backfill, rollback, and retirement.
6. Normalized session-item and response model.
7. Fixed-path versus `adaptive_mst` delivery mode.
8. Adaptive stage transition and concurrency contract.
9. Exposure keys, enemy-set assessment, no-repeat window, and forced-reuse policy.
10. Capacity-gate and accessibility-sufficiency acceptance thresholds.
11. Adaptive reporting and calibration claims.
12. Children's data retention, erasure, de-identification, and legal-hold ownership.
13. Organization membership and RLS model before institutional launch.

## 24. Open decisions

These decisions are intentionally deferred to their ADRs:

- Items per adaptive stage.
- Stage routing thresholds.
- Banded versus numeric provisional ability during the pilot.
- Exact per-cell depth required for adaptive readiness.
- Whether provisional adaptive results are isolated or route-adjusted.
- When event-table row counts justify partitioning.
- When institutional requirements justify organization tenancy.

Until decided, the platform MUST default to fixed-path delivery and conservative
learner-facing claims.

## 25. Definition of done

A phase or feature is complete only when:

1. TypeScript strict-mode compilation passes.
2. Lint and unit tests pass.
3. A production build passes.
4. New database objects have migration-registry verification.
5. New scoped tables have RLS and privilege tests.
6. Security-sensitive DTOs have contract tests.
7. Versioning and replay behavior is tested.
8. Accessibility is retained for all new learner interactions.
9. Operational rollback or feature-disable behavior is documented.
10. Documentation and relevant ADRs are updated.
11. New child-data fields have a declared purpose, retention owner, expiry/deletion
    behavior, export behavior, and erasure test.

## Appendix A — Recommended table catalogue

This catalogue is directional. Exact DDL belongs in reviewed migrations.

### Global configuration and taxonomy

- `assessment_families`
- `subjects`
- `programmes`
- `programme_offerings`
- `taxonomy_versions`
- `taxonomy_nodes`
- `taxonomy_edges`
- `programme_taxonomy_nodes`
- `framework_versions`
- `blueprint_versions`
- `blueprint_cells`
- `assessment_profile_versions`

### Content

- `items`
- `item_versions`
- `item_answer_versions`
- `stimuli`
- `stimulus_versions`
- `item_scopes`
- `item_skills`
- `item_families`
- `enemy_sets`
- `enemy_set_items`
- `adaptive_eligibility_reviews`
- `item_calibrations`
- `publication_manifests`

### Forms and delivery

- `assessment_forms`
- `assessment_form_versions`
- `assessment_form_items`
- `assessment_sessions`
- `assessment_session_stages`
- `assessment_session_items`
- `session_responses`
- `stage_transitions`
- `assessment_results`

### Legacy operational tables during cutover

- `exam_sessions` — authoritative for legacy sessions until drained; then read-only
- `exam_responses` — legacy autosave path until drained; then writes revoked
- `exam_attempts` — immutable legacy submitted results during reconciliation/observation
- `essay_marks` — legacy manual marks until migrated and reconciled
- `create_exam_session(...)` — legacy creation RPC; execution revoked after drain
- `record_exam_attempt(...)` — legacy submission RPC; execution revoked after drain

These objects are migration inputs and temporary compatibility surfaces, not permanent
members of the target model.

### Operational and analytical

- `outbox_events`
- `idempotency_keys`
- `item_statistics`
- `capacity_reports`
- `manual_marks`

### Institutional expansion

- `organizations`
- `organization_memberships`
- `parent_student_links`
- `class_groups`
- `class_memberships`

## Appendix B — Explicitly rejected patterns

The following patterns are prohibited unless superseded by an ADR:

- A separate table or schema per year or subject.
- PostgreSQL enums for extensible assessment families or question types.
- Storing private answers inside learner-readable content JSON.
- Client insertion of correctness, marks, or final results.
- Mutable published question or form content.
- Resolving historical attempts through a mutable "current item" view.
- Using subject-wide item totals as the adaptive-readiness gate.
- Using question-ID-only exposure control.
- Treating structural difficulty estimation as psychometric calibration.
- Combining broad tenant and narrow ownership RLS policies without accounting for
  PostgreSQL policy composition.
- Storing one tenant and one global role per user as the institutional end state.
- Deploying speculative queues, partitions, or intelligence tables with no active
  producer and consumer.
- Executing a standalone schema script outside the repository migration registry.
