# Admin Workspace: Phase A discovery and gap analysis

11 November 2026, Australia/Sydney. **Discovery only. No application code, credentials, database, deployment, hosted settings or existing PR was changed.**

The approved [Claude Admin Workspace](https://claude.ai/artifact/RmoM5xtuZoj4dHNLzRqbg1) is accessible. Its **27 artboards are completely inventoried** in [INVENTORY.md](INVENTORY.md), with exact source snapshots and browser-read text, controls and destinations in [evidence](evidence/). The design is suitable for phased implementation, but several pictured operations need new authenticated backend contracts and policy decisions. A visually complete shell must not imply that those operations exist.

## Baseline and isolation

- Freshly fetched `origin/dev`: `17d8be2fcf81ab456980b24a65d4da0bc38950b2`.
- Discovery worktree: `C:/tmp/wt-admin-discovery-20261111`.
- Discovery branch: `docs/admin-workspace-discovery-20261111`.
- The worktree started clean. Changes here are discovery documents and reference evidence only. No dependency installation or application server was needed.
- The primary checkout has existing unrelated changes and remains untouched. Student PR #109, Parent PRs #106/#107, Auth PRs #93/#94 and their worktrees were not changed during this Admin task.
- No Supabase connection was opened. SQL/RLS findings below describe repository migrations, **not verified deployed policies**. DEV `mfglzabnayacssgertat` is the only project eligible for a later explicitly authorized integration. PROD `uermhsptduikehuyceiz` is prohibited; no production connection or configuration was inspected or changed.

## What the design specifies

Nine journeys: Overview, Question library, Question review, Human approval, Paper review, Publication, Writing review, Support and Activity history. There are two dedicated 834px tablet artboards and four essential 390px mobile artboards; the remaining screens and state boards are authored at 1440px, with a 1480px governance map. See the complete inventory rather than assuming that every screen has a separate mobile design.

The defining visual and workflow rule is three distinct layers: **blue agent review, purple human approval, teal publication**. Machine checks and AI recommendations inform people; they never sign off. Approval names a person and an exact immutable revision; publication is a subsequent operation that must validate that identity again. States distinguish empty queues from no filter matches, stale evidence from current findings, and confirmed writes from failed or uncertain writes.

The canvas explicitly labels all names, counts, question IDs, timestamps and hashes as illustrative. Its 96/18/9 queues, 142 questions, 1,548 served, 53 approved and 96.7%-unapproved claim are **not verified live metrics** and must not appear as operational data. A real read must return a value, an honest unavailable state, or an explained empty result.

### Visual contract and reusable UI

`docs/design.md` v2.2 remains the canonical token contract. The canvas uses a light/ivory content surface, white navigation and cards, purple selection, quiet borders, Geist UI and Instrument Sans headings. Preserve the fixed brand asset via `MindMosaicLogo`, rather than re-typesetting the logo from exported spans. The three workflow colours need semantic tokens with icon and text labels; never encode approval only by colour.

Reusable primitives exist under `src/components/ui`: Button, Input, Select, Textarea, Card, Badge, Modal, ConfirmDialog, ToastProvider, Skeleton, EmptyState, ErrorState and PermissionDenied. `src/features/admin-analytics/components/AdminShell.tsx` provides navigation and responsive shell mechanics, but its current dark sidebar and four-section information architecture do not match the new white review workspace. Reuse behavior and extract presentational pieces rather than transplanting an entire static design DOM into authenticated pages.

Reuse `ExamQuestion` and the deterministic question/visual renderers for the student-view question panel, existing review presentation adapters, the pure rubric/scoring functions, Zod contracts, governed approval/hash validators and readiness functions. Never inject arbitrary SVG from a design export. The chart in the design is reference artwork, not a new approved question or verified publication record.

## Existing Admin functionality

| Existing route/module | What actually exists | Retain or extend |
|---|---|---|
| `/admin` | An Admin tools hub linking Draft review, Analytics, Content Intelligence and Operations; wrapped by AdminShell | Replace the landing presentation with approved Overview only when its honest queue/read models exist. Preserve access to the existing tools. |
| `/admin/review` | Server-authenticated review catalogue of four pinned Year 6 Scholarship draft packets; filtered question review, full draft papers, declared keys/explanations, historical advisory findings and exact-source checks | Reuse loader security, renderer and hash validation. It is not a general NAPLAN/ICAS authoring library. |
| `approveDraft` Server Action | Validates all three explicit checks, reauthorizes Admin, reloads source, rejects changed content hash, inserts reviewer identity and DB timestamp | Reuse for the existing draft-review decision only. It does not publish or create publication approval evidence. |
| `/admin/analytics` | Server reads aggregate `admin_*` views for platform totals, activity, marks and subject/skill performance | Preserve this route and privacy boundary. Do not replace unavailable aggregates with design sample numbers. |
| `/admin/intelligence` | Aggregate item statistics, quality/coverage insights and server-side question presentation metadata | Preserve; useful input to review prioritization, but not a ready-made unified authoring library. |
| `/admin/operations` | Explicitly labelled mock job data; retries change React state and produce a local toast | Retain as an existing capability with its disclosure. Do not use it as a live agent-review queue. |
| Governance modules and CLI | Revision/hash approval validation, source manifests, publication-integrity checks, programme modes, governed content lifecycle | Reuse domain functions behind new narrow authenticated services. They are not existing web publish/unpublish endpoints. |
| Assessment/manual-marking model | Immutable item versions, pinned sittings, teacher-owned manual marking; separate linked-parent timed-writing marking | Reuse the integrity and scoring rules, but add an explicitly authorized redacted Admin workflow before exposing responses. |

Evidence: [Admin layout](../../src/app/admin/layout.tsx#L20), [draft loader](../../src/server/admin-review.ts#L82), [approval action](../../src/app/admin/review/actions.ts#L25), [review contracts](../../src/features/admin-review/contracts.ts#L64), [analytics loader](../../src/server/admin-analytics.ts#L21), [mock operations](../../src/app/admin/operations/page.tsx#L10), [draft-review documentation](../admin-draft-review.md).

The current shell exposes Analytics, Content Intelligence and Operations; the new design does not show where these tools go. **Do not remove their routes or make them unreachable.** Agree on an approved legacy-tools entry or shell extension before replacing navigation. Until then, retain their existing presentation and URLs.

## Route and component strategy

The exact artboard mapping, responsive dimensions and state coverage are in [INVENTORY.md](INVENTORY.md). Proposed routes are proposals, not existing API contracts:

| Journey | Proposed route | Main reusable/new components |
|---|---|---|
| Overview | `/admin` | AdminWorkspaceShell, GovernanceLegend, ReviewQueueCards, ReportSummary, ProgrammeGateSummary |
| Question library | `/admin/questions` | QuestionLibraryFilters, ActiveFilterChips, paginated QuestionLibraryTable, ReviewStatusLayers |
| Question review | `/admin/questions/[questionId]` | StudentQuestionPreview, AnswerAndExplanation, AgentFindings, RevisionMetadata, RevisionHistory |
| Human approval | `/admin/questions/[questionId]/approval` | RevisionBinding, HumanDecisionForm, StaleRevisionBlock, ExplicitApprovalConfirmation |
| Paper review | `/admin/papers/[paperId]` with a minimal index at `/admin/papers` if required for navigation | PinnedPaperSummary, OrderedPaperItems, PaperReadiness |
| Publication | `/admin/publication` with selected revision in validated route/query state | PublicationReadiness, ApprovalBinding, PublicationHistory, ProgrammeGateStatus, UnpublishConfirmation |
| Writing | `/admin/writing` and selected-response detail if the queue contract requires it | RedactedWritingResponse, RubricMarkForm adapter, PendingMarkState, ConfirmedMarkState |
| Support | `/admin/support` | FixedReasonReportList, AccountIssueList, PriorityReportPanel, PrivacyBoundaryNotice |
| Activity | `/admin/activity` | AuditFilters, paginated ActivityTable, ActorAndRevisionIdentity |

Create a general library adapter rather than widening `scholarshipReviewSchema` or changing student taxonomy. Keep `/admin/review` functional as the existing Scholarship tool during migration; an eventual redirect requires an equivalent route and regression evidence. Treat the reference/state boards as component specifications and test cases, not production routes filled with fictitious records.

For list navigation, use validated URL search parameters and server-side pagination. Preserve filters and page position on Back. A bare source list in the browser is insufficient for a growing private question catalogue. The artboard shows six sample rows but does not specify a complete pagination control; confirm pagination copy/placement before implementing it. The tablet design keeps a sidebar at 834px while the reference note also proposes collapsing below about 900px: use the drawn 834px boards as the baseline and resolve that conflicting note explicitly.

## Backend gap analysis

| Capability | Reusable verified source | Missing contract or dependency |
|---|---|---|
| Overview queue counts | Review catalogue, publication eligibility, aggregate views | A trustworthy queue read model with defined statuses and freshness; separate failures per section. No current source for family-report counts or a redacted Admin writing queue. |
| General question search/filter/sort | Server-only `getExamBank`, taxonomy registries, current review filters | An Admin-only authoring repository including unpublished/rejected versions, not merely the student-served bank. Search, typed filters, stable sorting and bounded pagination. |
| Agent findings/currentness | ReviewEntry governance/findings; sourceContentHash and matchesCurrentRevision; factory review artefacts | A general revision-bound findings query and authenticated re-run command. A CLI/process for AI review is not a safe HTTP command queue. The operation needs idempotency, failure and authorization contracts. |
| Immutable authoring revision history | Runtime `item_versions`, source release identities, canonical publication hashes | A mapping between authoring revision number, raw draft hash, canonical publication hash, source-manifest hash and runtime version ID. Do not equate these different identities. Runtime immutability alone is not an authoring-history API. |
| Human decisions | Existing `approveDraft`, append-only draft-review table; `validateApprovalBatch`, approve/reject/revise classifications | A decision service tied to a durable immutable authoring revision, mandatory notes for rejection/revision, permission checks and a publication-evidence bridge approved by governance. Existing DB review decisions cannot silently become publication approvals. |
| Concurrent review | Fresh-hash refusal, append-only uniqueness | Presence/soft locks are new. Existing uniqueness is `(question_id, content_hash, approved_by)`, allowing two different people to approve the same revision. The design's globally single/idempotent decision needs a transaction/constraint or an explicit multi-review policy. |
| Paper readiness | Pattern readiness/eligibility, version-pinned assessments, existing complete Scholarship draft-paper review | A fixed-paper definition/version read model, ordered revision references, actual marks/duration, approval-aware availability and a deliberate stale-item adoption operation. A raw question count does not establish approved paper readiness. |
| Publish/unpublish | Publication-integrity functions, manifests and CLI publication lifecycle | No Admin HTTP publish/unpublish API at this baseline. Define durable job/operation acknowledgment, same-revision revalidation, audit event and propagation semantics. Source-controlled/cached deployment content cannot honestly promise instant unpublish through a client toggle. Preserve prior results and immutable versions. |
| Writing review | `/api/teacher/marking`, `record_manual_mark`, `get_manual_review_response`; linked-parent writing rubric services | Teacher API explicitly rejects non-teachers. Parent writing RPC has ownership constraints. Admin queue/read/mark authorization and marker-facing redaction are new; never use a service-role client to bypass ownership as a shortcut. Server owns rubric ceilings and marker identity. |
| Support | Existing authenticated erasure request/processor SQL and account workflows | No fixed-reason question-report ingestion/triage API or table found on `origin/dev`. The design's “built already” report-form assertion is not verified on this baseline. Need bounded report storage/read contracts and escalation policy. Account support must not become unrestricted student/family browsing. |
| Activity history | Approval rows, publication artefacts, manual marks, erasure audit sources | A unified append-only event projection with authorized reads, stable pagination, actor/type/hash/timestamp semantics, provenance and retention/redaction. Do not manufacture a human name for a machine action. |

Read-path references: [bank boundary](../../src/server/exam-bank.ts#L35), [publication evidence](../../src/server/publication-evidence.ts#L26), [approval verifier](../../src/features/content-governance/approval-verification.ts#L43), [manual marking route](../../src/app/api/teacher/marking/route.ts#L67), [writing mark route](../../src/app/api/writing/attempts/[id]/mark/route.ts#L7). No backend writes were performed to assess these capabilities.

## Security and authorization assessment

| Boundary | Repository evidence | Required treatment |
|---|---|---|
| Admin pages | Dynamic `/admin/layout.tsx` invokes `requireRole("admin")`. Signed-out/wrong-role/revoked profiles are redirected; revoked profiles are signed out. | Preserve. Layout is not sufficient for actions, loaders rendered concurrently, or direct API requests. |
| Unconfigured environment | `requireRole` returns `{ configured: false }` when Supabase is absent. Current draft loader returns no entries and action refuses a write. | Every new real-data loader/action must explicitly fail closed on `configured: false`. Never turn an unconfigured authenticated route into a fixture route. |
| Draft reads and decisions | Loader and Server Action independently reauthorize. Zod is strict. Source is a fixed private allowlist, not a path taken from query input. | Preserve before any filesystem read. Generalization must not introduce arbitrary paths or raw bank imports in client modules. |
| Approval identity and freshness | Browser supplies ID/hash/checks; action reloads source and derives identity from session. DB timestamp defaults to now. | Retain identity derivation; stronger immutable-version and concurrency contract needed for the new publication workflow. No editable reviewer name or accepted client timestamp. |
| Approval RLS | `admin_draft_review_approvals` enables RLS, grants only select/insert to authenticated, checks active Admin and `approved_by = auth.uid()`, and has no update/delete grant. | Preserve append-only history and unauthorized-role denial. Draft-review records remain distinct from publication records. |
| Aggregate privacy | Admin aggregate views are security-barrier owner-rights views gated by `is_admin()`; no individual child columns. | Keep aggregate access instead of querying raw profiles/attempts in dashboards. Bound small-cohort disclosure as required by policy. |
| Revocation at SQL boundary | The only repository definition of `is_admin()` checks ID and Admin role, not `access_revoked_at`; the application role gate and approval-table RLS do check revocation. | Add a negative test for direct revoked-Admin JWT access before extending SQL privileges. This is a source-level gap to investigate, not a claim that deployed RLS was tested or exploited. Coordinate with Auth work; do not change it in discovery. |
| Programme permissions | ProfileRole is student/parent/teacher/admin only. | Senior reviewer and per-programme approval rights require policy and data design. Prefer a scoped capability grant design after sign-off instead of casually widening shared signup/profile roles. |
| Marking/privacy | Teacher-of-student and linked-parent ownership are enforced by existing paths; raw writing may contain names inside the response. | New Admin capability plus redaction contract must precede real DEV marking. Hiding a student-name header does not redact identifying text within an essay. |
| Support/erasure | Admin-gated erasure request/cancel/process functions exist, with audit identities and timing windows. | Reuse only where the approved support feature needs them; do not add erasure execution controls absent from the design. Do not expose sensitive erasure rows through a generic support list. |
| Mutation safety | Existing marking checks origin; Server Actions have their own auth boundary. | Same-origin checks for new endpoints, strict schemas, bounded input, safe error messages, per-operation authorization, idempotency and explicit destructive confirmation. |
| Publication | Hash/integrity verification and programme report/enforce modes exist. | No AI approval. No synthetic preview can call a publication command. No change to programme modes or publication policy without owner authorization. |

References: [role gate](../../src/features/auth/require-role.ts#L48), [approval RLS](../../supabase/migrations/20261019100000_admin_draft_review_approvals.sql#L15), [SQL is_admin](../../supabase/migrations/20260718120000_admin_aggregate_views.sql#L23), [roles](../../src/features/auth/roles.ts#L9), [request origin](../../src/features/auth/require-origin.ts), [erasure request migration](../../supabase/migrations/20260817090000_erasure_requests.sql).

### Governance conflicts that require a decision

1. **Approved-only standing rule versus current report-mode serving.** The source's `PROGRAMME_PUBLICATION_MODES` is empty; Scholarship/Edutest default to enforce, other programmes to report. The design correctly exposes that fact but also draws “cannot publish without approval.” The repository standing rule requires published, valid manifest-backed content and human publication sign-off. Record and resolve this discrepancy with the owner; do not quietly change enforcement switches or claim report mode is human-verified. See [gate-config.ts:5](../../src/features/content-governance/gate-config.ts#L5).
2. **Approval meaning.** Canvas approval says eligible to publish. Current draft review explicitly says its decisions are not publication evidence. Decide the authorized bridge and durable source of truth before wiring the button.
3. **Reject/unpublish serving behavior.** The design says rejection prevents serving and unpublish acts immediately, yet source-controlled cached banks and report modes do not provide that mutable web guarantee. Define deactivation and propagation while preserving historical results; no fake success or local-only change in a real Admin route.
4. **Reviewer authority.** Decide who may approve which programmes, whether one or multiple reviewers are required, and how concurrent decisions behave.
5. **Support escalation and writing privacy.** Name the owner, response timing and action policy for distress reports; approve what a marker can read, what is redacted and what is retained. These decisions are explicitly marked open on the design boards.

The existing approval action requires explicit correctness, originality and age-appropriateness checks. The new design's decision form must preserve that human confirmation contract; do not silently populate literal `true` values just to satisfy the action schema. Resolve the presentation with the design owner before connecting real approval.

## Safe preview architecture for Phase C

Use a dedicated proposed `/dev/admin-preview` route tree, outside the authenticated `/admin` route tree. Keep synthetic fixtures out of real Admin loaders and do not replace `requireRole` with a fixture shortcut. The preview module should be development-only, explicitly opted in, loopback-host restricted, unavailable on hosted deployments, and refuse to start when Supabase or privileged database credentials are configured. A build must fail if fixture modules are imported by authenticated Admin pages/actions.

The fixture repository should expose only local read models and in-memory demonstrations. It must not import the Supabase clients, live bank loader, approval action, marking service or publication CLI. A simulated confirmation must explicitly say **preview simulation; no record written**, rather than naming a successful real operation. No credential fields are entered or modified for preview. Use original synthetic fixture questions and deterministic structured visuals; no real student/family records or official questions.

For later real DEV integration, use a separate authenticated process and an exact project allowlist for `mfglzabnayacssgertat`; reject PROD `uermhsptduikehuyceiz`. Never infer authorization from a URL being local. Record non-secret target identity, worktree/SHA/diff and active preview flags. Build previews into per-run output directories and never rebuild a directory while it is served. Browser and server-side checks must demonstrate zero database writes and zero Supabase requests in synthetic mode; browser logs alone cannot establish absence of server-to-server traffic.

This is a proposed architecture, not implemented or security-certified code.

## Recommended implementation phases and exit criteria

| Phase | Scope | Exit criterion |
|---|---|---|
| B0: decisions and contracts | Resolve governance conflicts, permission model, legacy-tools placement, library/page/read models, hash mapping, marking privacy and escalation | Written approved boundaries and typed contracts; no hidden backend assumptions |
| B1/C1: shell and isolated preview | White review shell, semantic status layers, reusable controls, nine synthetic journeys and all state boards | 1440/834/390 snapshots, keyboard and focus tests; preview cannot load credentials, call live services or leak fixtures into authenticated routes |
| B2: authenticated reads | General question catalogue/detail, current findings, real honest queue/gate counts; preserve old Admin tools and `/admin/review` | Admin/non-admin/revoked negative tests, URL filter/back navigation, stable pagination, per-section empty/error states; no fabricated metrics |
| B3: human decisions | Revision-bound approve/request changes/reject, mandatory notes, authorization, durable decision history | Stale/conflict/idempotency tests; named server-derived actor and revision; no publication side effect |
| B4: paper/readiness | Pinned paper definitions, item status/order/marks/duration, approved-content readiness | Fixed-paper revision tests and short/stale states; no silent replacement of pinned questions |
| B5: governed publication | Approved authorized service boundary, readiness rechecks, durable acknowledgement, unpublish confirmation and audit | No missing/stale approval admitted; preview cannot invoke it; existing results retained; owner-approved serving semantics |
| B6: writing/support/activity | Privacy-bounded queue and marking, fixed-reason triage/escalation, append-only activity projection | Ownership/permission/redaction tests and failed-save retention; genuine acknowledgments only |
| D: acceptance/regression | Full repository gates, Admin journeys and visual comparisons across states | All required checks green; existing analytics/intelligence/operations/review remain usable; owner review before any merge/deployment |

Do not conflate a successful HTTP response, passing unit tests or a complete static artboard with a functional Admin workflow. Test each operation's denied, stale, failed and confirmed paths separately.

### QA plan

Reuse and extend the existing Admin layout, draft-review loader/component tests, `tests/rls/admin-draft-review.test.ts`, approval/integrity/gate-mode suites, manual-marking/erasure RLS suites and `e2e/auth/admin-draft-review.spec.ts`. Existing tests are evidence of coverage intentions, not proof that a newly deployed database has the same policies.

Add tests for signed-out, student, parent, teacher, wrong capability and revoked Admin callers; spoofed reviewer/time/hash; stale content; concurrent and duplicate decisions; failed publication and marking acknowledgments; report-mode display honesty; fixture import boundaries; hosted/non-loopback/connected preview refusal; no live requests/writes in preview; keyboard operation, dialog initial/return focus and Escape; desktop/tablet/mobile layouts; loading versus empty versus unavailable; filter persistence and Back/Forward.

Phase D includes `npm run typecheck`, `npm run lint`, relevant/full unit and integration tests, Playwright Admin journeys, role-negative and RLS tests, visual comparisons and existing Admin regressions. Before any implementation PR submission, also run the complete AGENTS.md gate including build, questions validation/answers/ledger and both E2E suites. Do not weaken tests to accommodate the new UI.

## Draft PR/worktree strategy

This phase stays on the docs-only discovery branch. No PR was opened or modified. Suggested later implementation branch: `feat/admin-workspace-redesign`, in a new dedicated worktree from a freshly fetched and recorded `origin/dev`. Do not base it on the Student/Parent/Auth branches or copy their uncommitted changes.

Keep an implementation PR Draft against `dev`; use focused commits and describe which operations are real, simulated or deferred. Preserve screenshot/evidence files locally rather than committing generated screenshots. Split backend authorization/schema work from visual shell work where review size warrants it, with explicit dependencies. Coordinate shared shell/auth files rather than overwriting another active worktree. No merge to dev/main, production deployment, credentials change or production publication is authorized by this phase.

## Limits and outstanding work

- All 27 actual design source artboards and their browser-readable content were inspected. There is no missing design export blocking inventory. Screenshots are reference evidence only, not an implementation fidelity verdict.
- Some canvas captures were blank or retained the overview due to prototype-transition/render timing; these are segregated as unverified captures. Only visually checked screenshots are presented as examples. One canvas tab crashed and was reopened; exact source snapshots remain preserved.
- No real Admin session, live DEV database, RLS execution or current production deployment was inspected. No runtime/CI test suite was run for this documentation-only phase. Reported historic test totals in repository docs were not re-run or adopted as current results.
- No actual missing API was implemented, no migration was applied, no approval/mark/publication/report was submitted, and no Phase B work began.
- Phase A is complete. Implementation should begin only under a subsequent instruction and the resolved security/governance contracts above.
