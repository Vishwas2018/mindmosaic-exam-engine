# Platform roadmap implementation â€” 5 October 2026

## Scope and status

Worktree: `feat/programme-governance-roadmap`, based on freshly fetched
`origin/dev` at `cc50a9a1`. This is a reviewable implementation in progress,
not a release certification. No live migration, live projection, payment,
content approval, billing-enforcement change or deployment was performed.

MindMosaic supports family learning through original assessment practice,
curriculum lessons, student results and parent progress. Teacher and admin
routes exist; mock/session-only operations are not commercial launch claims.
Families remain the first paid audience, Year 3/5 the focus, AMC the first
expansion. Dedicated NAPLAN/ICAS writing papers remain deferred; four existing
writing tasks are manual-review practice.

## Implemented governance and readiness

- One canonical question comparison: Zod parsing/defaults followed by the
  existing deterministic JSON hash. Historical manifest fingerprints retain
  their original fact set and are not rewritten.
- Revision-bound human approval records include the exact private question
  snapshot, reviewer, review time, review attestations, canonical content hash,
  source-manifest hash and tamper-evident fingerprint. These are protected Git
  records, not cryptographic proof of a person's identity. They must be reviewed
  through the repository's human workflow.
- Publishing requires an explicit reviewer and review confirmation. Existing
  unsigned manifests cannot be replayed as approved publications.
- Assembly, projection planning, projection writes and the server bank reject
  missing or invalid approval. Invalid evidence and canonical source drift
  fail the inventory/CI checks. Assembly preserves its existing authoring
  snapshot when any manifest would be skipped, and loads external migration
  approvals rather than relying solely on embedded new-publication approvals.
- Public subject availability distinguishes full papers, reduced practice and
  unavailable subjects using the same runtime readiness used for selection.
- The new registered database migration stores approval privately, denies
  learner access, prevents modification, filters session allocation and guards
  session-item inserts and session reads. It creates no historical signatures.
- CI runs publication verification and the corrected bank inventory.

**Migration consequence:** all 1,548 historical questions are unsigned under
the new contract. The approved bank therefore contains **zero** questions.
This is a deliberate fail-closed result, and makes this branch unsuitable for
deployment until the content migration and required checks are complete.
The authored inventory and all 104 lessons remain intact.

The 61 previously reported content differences were schema-default differences:
all 543 factory snapshots match canonically, and their historical fingerprints
recompute. This resolves that comparison discrepancy without changing any
historical manifest or inferring approval.

## Human review migration

1. Run `npm run content:approval-queue`. It creates unsigned private packets in
   ignored `content/question-factory/reports/human-approval`; existing reviewer
   edits are never overwritten. The initial run prepared 1,548 packets.
2. Independently review correctness, originality and age appropriateness. A
   human completes their real identity/time and the review attestations only
   after that work. No bulk default identity or inferred historical signature
   is supported. Keep question snapshots unchanged; revise authoring material
   through its governed lifecycle when content needs correction.
3. Run `npm run content:record-approval -- --packet <reviewed-packet.json>`.
   Recording refuses changed snapshots, wrong revisions, wrong source hashes,
   empty reviewers, incomplete checks and existing approval records.
4. Review and commit the private approval records. Verify publication,
   inventory, lessons, selection and projection before deployment. Curated
   records preserve the current Git-authored snapshot; they do not invent
   historical author/reviewer identities.
5. Apply the registered migration and project approved content in a controlled
   environment. Verify the resulting database and rerun the complete CI suite.
   Do not deploy the application gate independently of its content migration.

See [approval contract and commands](../content/publication-approvals/README.md).

## Remaining content and release gates

Authored-bank capacity before approval, **not current learner availability**:

| Programme | Authored capability | Work remaining |
|---|---|---|
| NAPLAN Year 3 | Numeracy full; reading 20/39; language 49/52 | Reading passage groups and language deficits |
| NAPLAN Year 5 | Numeracy full; reading 7/39; language 32/52 | Reading passage groups and language deficits |
| ICAS Year 3 | Five objective subjects can fill full papers | Human review and retake-depth verification |
| ICAS Year 5 | English, maths, digital technologies, spelling full | Science and at least two non-overlapping papers per required subject |
| Curriculum | 104 authored lessons | Five approved questions per assessable Level 3 node; preserve classroom-only notices |
| AMC Year 3/5 | Patterns, weighted scoring and integer answers exist | Approved content, selection, scoring, results and parent reporting |
| Other expansion | Catalogue plans | Remain planned |

Reading capacity requires passage groups, not just a total question count.
Year 3 currently has five four-question groups: adding only 19 questions cannot
fill 39 within the seven-group maximum. One feasible authored target is four
new groups of 7, 7, 7 and 6, plus three existing four-question groups. Year 5
can add five groups of 7, 7, 6, 6 and 6 to its existing seven-question group.
All additions require original prose, independent review and human approval.

182 unsigned original AI drafts are prepared outside runtime imports:
60 AMC items (30 per year), 40 Year 5 ICAS science items and 23 spelling items
(three Year 3 and twenty Year 5), plus 59 reading questions across nine new
fictional passages (27 Year 3 and 32 Year 5), matching the passage-group constraints. They pass structural
preflight; no editorial/difficulty approval is claimed. See
[draft review instructions](../content/roadmap-drafts/README.md). The production selector fills all six NAPLAN full papers and Year 5 ICAS science
using authored material plus draft fixtures across three seeds. This is a private
capacity simulation, not approved availability. Review/publication of those
additions, ICAS retakes and Level 3 content completion remain outstanding.

Paid-release gates remain: parent signup/child linking/lesson/practice/results/
progress journey; deployed migrations and projection; role isolation; account
deletion and retention; checkout, signed webhook processing, trial expiry,
cancellation, payment failure and inherited child access in a test environment.
Billing enforcement must remain off until those checks pass. Guest practice
retains its documented low-stakes browser-scoring boundary.

Read-only inspection of the configured hosted database found nine older
migrations missing, plus the new migration not yet applied, and a scoring-role
ledger entry whose role was absent. No hosted database changes were made.
Deployment drift must be resolved before commercial release.

## Verification evidence

- Typecheck, lint and production build passed during implementation.
- New publication unit regressions: 15 passed; isolated database approval
  regressions: 7 passed, including unsigned allocation rejection, matching
  approval acceptance, mismatched hash rejection, private access, immutability
  and malformed evidence rejection.
- Question validation, published-answer checks, ledger consistency and all
  104 lesson validations passed. Answer verification remains limited: 175
  independently computable answers, 1,369 requiring editorial review.
- Source projection verification passed. Local database projection verification
  passed against the empty approved inventory; this does not verify hosted
  projection or prove a populated approved-bank journey.
- All migrations applied to an isolated local Supabase project. The latest
  evidence constraint was subsequently applied and tested there. The shared
  local stack and hosted database were not migrated by this work.
- Final full unit suite run: 5,376 passed, 63 failed; 17 failed files, 287 passed. Failures include
  historical bank/lesson availability assumptions, publisher confirmation,
  strict projection approval requirements and originality-review timeouts. CI-style
  fake Stripe credentials were used for the final local HMAC tests; no payment
  processor requests were made. These failures still require a complete green run.
- Full RLS run on the existing local stack: 494 passed, five failed (legacy
  unsigned bank availability and target scoring lifecycle). The new migration
  was tested separately in the isolated project. The final full RLS run on that
  freshly migrated isolated project had 291 passes, 211 failures and four skips.
  Legacy suites seed unsigned item versions and now fail at the approval
  boundary; their fixtures need explicit test approval evidence under the new
  contract, preserving all assertion logic. The seven dedicated approval
  regressions pass. No automatic production approval or gate bypass is allowed.
- Authenticated browser suite: 35 passed, eight failed. Assessment/diagnostic
  flows are blocked by the unsigned inventory; navigation, parent linking and
  redirect failures also remain unresolved. Guest browser suite: 130 passed, 42 failed (172 total), with the showcase
  enabled. Failures include practice/results assumptions requiring unsigned
  content, changed availability labels and unresolved route/navigation checks. No full CI green
  or deployed customer journey is claimed, and no PR/merge is submitted.
- Impeccable detection of the four changed availability surfaces passed. Desktop
  and mobile inspection found no horizontal overflow; a final copy/empty-state
  correction removed misleading availability legends and success colours. The
  corrected desktop/mobile rendering was inspected again with no overflow.

Graphify was refreshed locally with `--code-only --no-cluster --max-workers 2`:
2,357 scanned code files produced 7,499 nodes and 22,690 edges. No LLM extraction
or external content generation was used for the graph. It omits documents and
some JSON; current source and executable checks remain authoritative.

Completion order remains governance migration â†’ existing programme/content
completion â†’ families-first release verification â†’ approved AMC launch. Dates
depend on real content review capacity; counts and passing checks determine
readiness. `npm run programmes:readiness -- --release-gate` enforces full-paper,
retake and assessable Level 3 content targets; add `--include-amc` for expansion.
It currently fails, as required, and does not certify commercial readiness.
