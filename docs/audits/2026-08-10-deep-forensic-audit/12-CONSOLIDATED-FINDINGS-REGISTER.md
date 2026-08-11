# Consolidated Findings Register

This is the canonical, deduplicated register. “Scope” uses the required product-scope classes. Confidence is independent of severity.

## Sortable register

| ID              | Sev | Domain                       | Evidence / confidence       | Scope                                   | Effort | Primary dependency                      |
| --------------- | --- | ---------------------------- | --------------------------- | --------------------------------------- | ------ | --------------------------------------- |
| MM-AUD-SEC-001  | P1  | Security/DB                  | Confirmed / High            | Implemented but defective or incomplete | L      | DB mutation-boundary design             |
| MM-AUD-SEC-002  | P1  | Authorisation/RLS            | Confirmed / High            | Implemented but defective or incomplete | M      | Teacher/enrolment authority model       |
| MM-AUD-SEC-003  | P1  | Auth/XSS                     | Strongly indicated / High   | Implemented but defective or incomplete | S      | Internal-URL validator                  |
| MM-AUD-DEP-001  | P1  | Dependencies                 | Confirmed / High            | Implemented but defective or incomplete | S      | Compatibility verification              |
| MM-AUD-TIME-001 | P1  | Assessment timing            | Confirmed / High            | Implemented but defective or incomplete | M      | Single deadline authority               |
| MM-AUD-FUNC-001 | P1  | Submission                   | Confirmed / High            | Implemented but defective or incomplete | M      | Idempotency contract                    |
| MM-AUD-FUNC-002 | P1  | Assignments                  | Confirmed / High            | Implemented but defective or incomplete | L      | Assignment/session model                |
| MM-AUD-FUNC-003 | P1  | Manual marking               | Confirmed / High            | Implemented but defective or incomplete | L      | Result-state model                      |
| MM-AUD-PROD-001 | P1  | Product truth                | Confirmed / High            | Contradictory or ambiguous scope        | S      | Approved positioning                    |
| MM-AUD-CONT-001 | P1  | Content governance           | Confirmed / High            | Documented current scope but missing    | L      | Publication manifest/review policy      |
| MM-AUD-PRIV-001 | P1  | Privacy/legal readiness      | Confirmed / High            | Contradictory or ambiguous scope        | L      | Specialist review + deletion operations |
| MM-AUD-SEC-004  | P2  | Authentication               | Confirmed / High            | Implemented but defective or incomplete | S      | Signup role policy                      |
| MM-AUD-SEC-005  | P2  | Web security                 | Confirmed / High            | Implemented but defective or incomplete | S      | Deployment header policy                |
| MM-AUD-DATA-001 | P2  | Persistence                  | Confirmed / High            | Implemented but defective or incomplete | M      | Compensating/transactional provisioning |
| MM-AUD-DATA-002 | P2  | Persistence                  | Confirmed / High            | Implemented but defective or incomplete | M      | Assignment RPC/transaction              |
| MM-AUD-DATA-003 | P2  | Data integrity               | Confirmed / High            | Implemented but defective or incomplete | L      | Cross-entity schema design              |
| MM-AUD-FUNC-004 | P2  | Session recovery             | Confirmed / High            | Implemented but defective or incomplete | S      | Query redesign                          |
| MM-AUD-CONT-002 | P2  | Content correctness gate     | Confirmed / High            | Implemented but defective or incomplete | M      | Heuristic redesign/gold set             |
| MM-AUD-PERF-001 | P2  | Performance/content exposure | Confirmed / High            | Implemented but defective or incomplete | M      | Guest scoring delivery design           |
| MM-AUD-PERF-002 | P2  | Performance                  | Confirmed / High            | Implemented but defective or incomplete | M      | Bundle analysis/splitting               |
| MM-AUD-CI-001   | P2  | Testing/CI                   | Confirmed / High            | Implemented but defective or incomplete | M      | Checker + suite liveness fixes          |
| MM-AUD-CI-002   | P2  | CI supply chain              | Confirmed / High            | Implemented but defective or incomplete | S      | Reviewed action SHAs                    |
| MM-AUD-DOC-001  | P2  | Documentation                | Confirmed / High            | Contradictory or ambiguous scope        | M      | Generated current-state facts           |
| MM-AUD-NAV-001  | P2  | Navigation governance        | Confirmed / High            | Contradictory or ambiguous scope        | S      | Product decision                        |
| MM-AUD-BILL-001 | P2  | Billing/product truth        | Confirmed / High            | Contradictory or ambiguous scope        | S      | Commercial/legal decision               |
| MM-AUD-SEO-001  | P2  | SEO                          | Confirmed / High            | Implemented but defective or incomplete | XS     | Sitemap policy                          |
| MM-AUD-OBS-001  | P2  | Observability                | Confirmed / High            | Documented current scope but missing    | L      | Privacy-safe telemetry design           |
| MM-AUD-AUTH-001 | P2  | Auth operations              | Strongly indicated / Medium | Implemented but defective or incomplete | M      | SMTP/deployment access                  |
| MM-AUD-OPS-001  | P3  | Operations                   | Confirmed / High            | Rejected, legacy or superseded          | S      | Product decision                        |
| MM-AUD-ARCH-001 | P3  | Roadmap architecture         | Confirmed / High            | Future scope — not a current defect     | M      | Owner-gated migration                   |

## Detailed findings — P1

### MM-AUD-SEC-001 — RLS permits direct writes to server-trusted assessment fields

- **Domain / severity / evidence:** Security and database; P1 High; Confirmed, high confidence.
- **Scope / affected:** Implemented but defective or incomplete; authenticated students and teachers; `exam_sessions`, `exam_attempts`, `assignment_students`, `essay_marks`; all signed-in programmes/years.
- **Evidence:** `supabase/migrations/20260718090000_phase0_roles_and_exam_schema.sql:331-362,407-415`; `20260719110000_essay_marking.sql:61-83`. Policies validate ownership relationships but not trusted columns. Supabase tables are exposed to `authenticated`; only `anon` is revoked.
- **Deterministic proof / observed:** A student-authorised direct PostgREST insert can choose session config/seed/IDs/expiry and can insert arbitrary `responses` plus arbitrary final `result`, never invoking `/api/exam/.../submit`. An authorised teacher can set arbitrary `max_marks` or attach an arbitrary visible attempt ID to an assignment row.
- **Expected / source:** Security/privacy/README claim selection and final scoring are server-authoritative and client input cannot change results; trusted fields must be writable only by controlled server/database functions.
- **Impact / root cause:** Learners can forge their own stored scores and corrupt analytics; teacher-side trusted fields can violate rubrics/assignment integrity. RLS is used as a row filter while PostgREST column mutation remains broad.
- **Recommendation / verification:** Revoke direct inserts/updates for trusted tables/columns; expose narrow transactional RPCs or a server-only service boundary; re-check role/ownership and recompute trusted values inside it. Add RLS tests that attempt each forged column using the browser `authenticated` role and prove denial while legitimate routes still succeed.
- **Effort / sequencing / related:** L; Phase 0 before trusting any stored result; coordinate `DATA-003`, `SEC-002`, `FUNC-001`.

### MM-AUD-SEC-002 — Any authenticated role can manufacture teacher access to a known student

- **Domain / severity / evidence:** Authorisation/RLS; P1 High; Confirmed, high confidence.
- **Scope / affected:** Implemented but defective or incomplete; all authenticated roles; classes, rosters, student profiles/sessions/attempts.
- **Evidence:** Phase-0 migration `:286-321` lets any authenticated identity create a class with itself as `teacher_id` and add a student to its own class. Helpers at `:145-175` derive teacher status from those rows without verifying `profiles.role='teacher'` or enrolment authority.
- **Proof / observed:** With a valid victim UUID, an authenticated parent/student can create a class, insert the victim membership, then satisfy teacher-read policies for that victim. No app route is required.
- **Expected / source:** Role/data docs and privacy policy limit class-student visibility to an actual teacher whose legitimate class contains that student.
- **Impact / root cause:** Cross-family child profile and assessment history disclosure/IDOR. “Teacher” is inferred from user-created relationship data.
- **Recommendation / verification:** Restrict class creation to pre-provisioned teachers; require controlled invite/enrolment or admin/school authority; prevent arbitrary student membership. Test every non-teacher role and unauthorised teacher against known and unknown UUIDs.
- **Effort / sequencing / related:** M; Phase 0; complete before wider accounts; related `SEC-001`, `SEC-004`.

### MM-AUD-SEC-003 — Unsanitised post-login destination reaches an executable router sink

- **Domain / severity / evidence:** Authentication/XSS; P1 High; Strongly indicated, high confidence; browser reproduction blocked.
- **Scope / affected:** Implemented but defective or incomplete; logged-out parent/teacher login at `/sign-in`.
- **Evidence:** `src/features/auth/components/SignInPanel.tsx:108,181,536` reads `next` and passes it directly to `router.push`/social flow. Next.js `useRouter` docs warn that untrusted `javascript:` URLs execute in page context.
- **Proof / observed:** Static data flow is direct and has no allow-list/relative-path parser. Safe reproduction: use a local fixture account, submit `/sign-in?next=javascript:...`, and observe whether code executes or navigation escapes.
- **Expected / source:** Only canonical same-origin internal paths should be accepted; otherwise use the role home.
- **Impact / root cause:** Post-auth XSS/open-redirect risk and credential-flow abuse. A URL query parameter is treated as trusted navigation.
- **Recommendation / verification:** Centralise strict internal-path validation (single leading slash, reject protocols, control chars and `//`) for password and OAuth paths. Add unit/E2E malicious-vector tests.
- **Effort / sequencing / related:** S; Phase 0; related `AUTH-001`.

### MM-AUD-DEP-001 — Production dependencies have current high-severity advisories

- **Domain / severity / evidence:** Dependencies; P1 High; Confirmed, high confidence.
- **Scope / affected:** Implemented but defective or incomplete; all deployed routes/builds.
- **Evidence:** `npm audit --json` reports three high-severity vulnerability groups (direct Next.js, transitive PostCSS and sharp/libvips). `package.json`/lock resolves Next `16.2.10`; Next's July 2026 security release says upgrade Active LTS to `16.2.11` for four high and five medium issues.
- **Proof / observed:** Deterministic audit exit 1. Reachability is certain for Next (the production framework); exploitability of each transitive advisory was not individually reproduced.
- **Expected / source:** Release dependencies should be on patched supported versions after compatibility validation.
- **Impact / root cause:** Known middleware/Server Action/SSRF/DoS classes remain in the release graph. Patch lag.
- **Recommendation / verification:** Review vendor advisories, update to the patched compatible line without broad unrelated upgrades, rerun all gates/audit and test affected routing/image/CSS paths.
- **Effort / sequencing / related:** S; Phase 0 after snapshotting compatibility; related `CI-002`.

### MM-AUD-TIME-001 — Submit uses a different timer algorithm from create and resume

- **Domain / severity / evidence:** Assessment timing; P1 High; Confirmed, high confidence.
- **Scope / affected:** Implemented but defective or incomplete; timed pattern sessions, all roles using signed-in exam simulations.
- **Evidence:** create `src/app/api/exam/session/route.ts:141` and active `.../active/route.ts:93` use `sessionDurationSeconds`; submit `.../[id]/submit/route.ts:10,107` uses `durationSecondsFor`.
- **Proof / observed:** For any pattern whose governed minutes differ from count-derived minutes, create/resume client deadline and submit finalisation deadline diverge. The submit comment promises mirrored client rules but calls the wrong authority.
- **Expected / source:** Exam pattern registry/comment requires all three routes to use pattern duration; timer expiry and elapsed time must share one server deadline.
- **Impact / root cause:** On-time work can be marked expired or late work accepted; elapsed time/reason can be wrong. Duplicated timing APIs.
- **Recommendation / verification:** Persist an authoritative deadline or call the same pattern-aware function everywhere. Boundary-test each pattern at deadline−1 ms, deadline and deadline+1 ms plus grace.
- **Effort / sequencing / related:** M; Phase 0/1; sequence before assignment integration; related `FUNC-001`.

### MM-AUD-FUNC-001 — Submission is collision-safe but not retry-idempotent

- **Domain / severity / evidence:** Functional/submission; P1 High; Confirmed, high confidence.
- **Scope / affected:** Implemented but defective or incomplete; signed-in exam submission, network failure and multi-tab states.
- **Evidence:** `submit/route.ts:70-75,125-143` returns `409 already_submitted` for pre-existing or race-winning attempts and never returns the stored result. Client scoring treats non-OK as failure and retains/retries an in-progress state.
- **Proof / observed:** Commit the first request, lose its HTTP response, retry the identical session: the only recoverable response is 409, not the committed result.
- **Expected / source:** Duplicate-submit protection should make retries safe and converge on the same final result.
- **Impact / root cause:** A successful learner can be stranded from results after an ordinary network ambiguity. Idempotency is modelled as rejection rather than result retrieval.
- **Recommendation / verification:** Return the immutable existing result/review projection for the owner (or implement an idempotency key/status endpoint). Add dropped-response and concurrent-request E2E tests.
- **Effort / sequencing / related:** M; Phase 1 after securing trusted writes; related `TIME-001`, `DATA-003`.

### MM-AUD-FUNC-002 — Teacher assignments cannot be started or completed by students

- **Domain / severity / evidence:** Functional/assignments; P1 High; Confirmed, high confidence.
- **Scope / affected:** Implemented but defective or incomplete; teachers/students; `/teacher/assignments*`, `/student/assignments`, assignment tables.
- **Evidence:** `AssignmentsView.tsx:20-25` explicitly says it is read-only with no Start action. Repository search finds no production writer for `assignment_students.status`, `attempt_id` or assignment-linked session creation.
- **Proof / observed:** Teacher can create an assignment; student sees a card and due date but has no action that creates the configured attempt or changes status.
- **Expected / source:** Current page copy says “Complete each one before its due date”; README/routes describe assignment tools.
- **Impact / root cause:** A promoted role workflow is unusable end to end and analytics cannot reflect completion. UI/data scaffolding shipped before the domain transition.
- **Recommendation / verification:** Define assignment→session identity, start/resume/submit transitions, due-date rules and transactional attempt linkage. Test teacher-create through student-complete and teacher-report.
- **Effort / sequencing / related:** L; Phase 1/2 after `SEC-001` and `DATA-003`; related `DATA-002`, `FUNC-003`.

### MM-AUD-FUNC-003 — Teacher marks never update learner or parent outcomes

- **Domain / severity / evidence:** Functional/manual marking; P1 High; Confirmed, high confidence.
- **Scope / affected:** Implemented but defective or incomplete; essay students, parents, teachers, results and aggregates.
- **Evidence:** Only teacher marking modules query `essay_marks`; `src/app/results/page.tsx:388-389` and parent summary derive pending state from immutable result JSON. Global source search found no result-side mark join.
- **Proof / observed:** After an essay mark is stored, teacher queue shows marked but student/parent surfaces remain pending and objective-only forever.
- **Expected / source:** Current marking UI/terms promise stored mark and feedback as attempt history visible to authorised roles.
- **Impact / root cause:** Feedback loop is broken; parent insight and learner result are stale. Marks are modelled as an isolated side table without a composed result read model.
- **Recommendation / verification:** Define immutable objective result plus auditable manual-mark overlay/version; expose feedback and recalculated totals/status. Test submit→mark→remark→learner/parent/history/aggregate.
- **Effort / sequencing / related:** L; after trusted mark writes are secured; related `SEC-001`, `DATA-003`, `FUNC-002`.

### MM-AUD-PROD-001 — Primary marketing overstates currently live platform breadth

- **Domain / severity / evidence:** Product truth; P1 High; Confirmed, high confidence.
- **Scope / affected:** Contradictory or ambiguous scope; all public visitors/SEO; landing `/`.
- **Evidence:** `src/features/landing/content.ts:154,190-191,1379,1407` leads with primary/secondary, curriculum learning, AMC and selective-entry challenges. The accurate Years 3/5 live disclosure appears later at `:989`; catalogue marks wider programmes in development.
- **Proof / observed:** Static copy juxtaposes a broad present-tense hero with later roadmap qualification; actual live banks are Years 3/5 NAPLAN/ICAS only.
- **Expected / source:** Product baseline requires broader vision without making unavailable programmes/year levels appear usable.
- **Impact / root cause:** Misleading acquisition promise and trust loss. Vision copy is not separated from availability copy.
- **Recommendation / verification:** Put live scope in the hero/metadata and frame wider programmes explicitly as roadmap; user-test comprehension and assert current-live labels in copy tests.
- **Effort / sequencing / related:** S; Phase 0; related `DOC-001`, `NAV-001`, `BILL-001`.

### MM-AUD-CONT-001 — Live bank can bypass governed factory provenance and semantic review

- **Domain / severity / evidence:** Content governance; P1 High; Confirmed, high confidence.
- **Scope / affected:** Documented current scope but missing; all 965 current and future published questions.
- **Evidence:** Production `questionBank` directly imports hand-authored TS content; structure validation accepts it without factory lifecycle/hash/reviewer evidence. Default correctness: only 84 fully computable, 877 editorial-review; factory reports acknowledge retrospective review limitations.
- **Proof / observed:** A structurally valid question can be added to imported bank modules and pass validation without a publication manifest proving independent semantic/originality review.
- **Expected / source:** Content rules/factory governance require original, accurate, reviewed published content.
- **Impact / root cause:** Wrong, ambiguous or insufficiently original content can ship at scale despite strong factory machinery. Two publication paths have unequal gates.
- **Recommendation / verification:** Make a versioned provenance/review manifest mandatory for all bank assembly; fail publication for missing evidence; conduct stratified retrospective review. Test a direct unreviewed import is rejected.
- **Effort / sequencing / related:** L; Phase 1; related `CONT-002`, `DOC-001`.

### MM-AUD-PRIV-001 — Children's-data privacy and legal operations are not release-ready

- **Domain / severity / evidence:** Privacy/legal readiness; P1 High; Confirmed, high confidence.
- **Scope / affected:** Contradictory or ambiguous scope; student/parent/teacher accounts and all stored assessment data.
- **Evidence:** `src/app/privacy/page.tsx:117-145` admits no formal retention/account-deletion policy and personal-use phase; `src/app/terms/page.tsx:104-132` calls terms a non-final draft. Absolute RLS/scoring statements are contradicted by `SEC-001/002`.
- **Proof / observed:** Live legal routes explicitly state the missing controls. No deletion workflow/job was found.
- **Expected / source:** Before broader deployment, current copy itself promises formal retention/deletion and review; OAIC's current Code process targets child-accessed online services by 10 December 2026.
- **Impact / root cause:** Undefined lifecycle for children's data, misleading security statements and specialist-review gap. Product capability outpaced governance/operations.
- **Recommendation / verification:** Obtain Australian privacy/legal review; define retention, access, correction, deletion, incident and processor practices; implement/test deletion; correct security statements; do not activate paid/public child accounts until signed off.
- **Effort / sequencing / related:** L; Phase 0 policy decision then Phase 1 implementation; related `AUTH-001`, `OBS-001`, `SEC-001/002`.

## Detailed findings — P2

### MM-AUD-SEC-004 — Public auth trigger accepts a self-asserted student role

- **Domain / severity / evidence:** Authentication; P2 Medium; Confirmed, high confidence.
- **Scope / affected:** Implemented but defective or incomplete; public signup and student identity governance.
- **Evidence/proof:** `20260718090000_phase0_roles_and_exam_schema.sql:105-110` maps raw user metadata role `student` or `parent`; public GoTrue signup can supply metadata without using the parent-only UI.
- **Observed vs expected:** A child/student profile can be self-provisioned, contrary to privacy/terms and `provisionChild` design. Role creation should be determined by trusted signup endpoints/triggers, not caller metadata.
- **Impact/root cause:** Bypasses parental provisioning assumptions and facilitates `SEC-001/002`; UI restriction was mistaken for identity policy.
- **Recommendation/test:** Default public signup to parent only; mint students through a trusted parent operation. Integration-test arbitrary role metadata and OAuth metadata.
- **Effort/dependencies/related:** S; sequence with `SEC-001/002`; related `AUTH-001`.

### MM-AUD-SEC-005 — Material browser security headers are absent

- **Domain / severity / evidence:** Web security; P2 Medium; Confirmed, high confidence.
- **Scope / affected:** Implemented but defective or incomplete; all local production responses/routes.
- **Evidence/proof:** `next.config.ts:3-5` has no headers; local production probe found no CSP, HSTS, X-Frame-Options/frame-ancestors, Referrer-Policy or Permissions-Policy.
- **Observed vs expected:** Framework defaults do not supply a defence-in-depth header policy. A child/account application should explicitly constrain scripts, framing, referrers and unused capabilities; HSTS may be deployment-owned.
- **Impact/root cause:** Greater impact from injection/clickjacking and deployment inconsistency. No application/deployment header contract.
- **Recommendation/test:** Define nonce/hash-compatible CSP and remaining headers at one owner; validate OAuth/Stripe/Supabase compatibility and probe preview/production.
- **Effort/dependencies/related:** S; after redirect fix; related `SEC-003`, `DEP-001`.

### MM-AUD-DATA-001 — Child provisioning leaves orphaned auth identities after partial failure

- **Domain / severity / evidence:** Persistence; P2 Medium; Confirmed, high confidence.
- **Scope / affected:** Implemented but defective or incomplete; parent/child provisioning, `auth.users`, profiles and links.
- **Evidence/proof:** `src/features/auth/provision-child.ts:240-324`, especially `:304-310`, explicitly accepts an orphan after create-user succeeds but profile/year/link fails.
- **Observed vs expected:** Parent receives failure while an inaccessible alias account may remain; retry can create another identity. Provisioning should commit or compensate as one operation.
- **Impact/root cause:** Orphan PII/credentials, confusing retries and deletion burden. Auth and DB writes cross systems without compensation.
- **Recommendation/test:** Add deterministic cleanup/reconciliation with idempotency key; failure-inject every post-create step and prove no orphan or safe resumability.
- **Effort/dependencies/related:** M; after role policy; related `PRIV-001`, `AUTH-001`.

### MM-AUD-DATA-002 — Assignment creation is not atomic

- **Domain / severity / evidence:** Persistence; P2 Medium; Confirmed, high confidence.
- **Scope / affected:** Implemented but defective or incomplete; teacher assignment creation and recipients.
- **Evidence/proof:** `src/app/api/teacher/assignments/route.ts:79-101` inserts assignment then recipient rows and performs only best-effort delete rollback.
- **Observed vs expected:** Recipient failure can leave a parent assignment if rollback also fails. Creation should atomically create parent and all valid recipients.
- **Impact/root cause:** Orphan/partial teacher work and misleading counts. Multi-table operation implemented through separate PostgREST requests.
- **Recommendation/test:** Use transactional RPC with locked roster validation; inject recipient/rollback failure and assert all-or-nothing.
- **Effort/dependencies/related:** M; align with `FUNC-002`, `SEC-001`.

### MM-AUD-DATA-003 — Cross-entity assessment invariants are not enforced

- **Domain / severity / evidence:** Data integrity; P2 Medium; Confirmed, high confidence.
- **Scope / affected:** Implemented but defective or incomplete; sessions, attempts, assignments and essay marks.
- **Evidence/proof:** Schema has independent `student_id`/`session_id`, nullable assignment `attempt_id`, and caller-supplied manual `max_marks`; no composite FK/trigger enforces matching owners/config/question rubric.
- **Observed vs expected:** Direct authorised/service mistakes can create an attempt for a different session owner, attach another attempt to an assignment, or invent mark scale. Semantically related identifiers must agree.
- **Impact/root cause:** Corrupt reports, marks and ownership even when each FK exists. Domain invariants are route-only.
- **Recommendation/test:** Add composite keys/constraints or narrow transactional functions with assertions; property-test impossible combinations.
- **Effort/dependencies/related:** L; combine with `SEC-001`, `FUNC-002/003`.

### MM-AUD-FUNC-004 — Newest submitted session masks an older resumable session

- **Domain / severity / evidence:** Session recovery; P2 Medium; Confirmed, high confidence.
- **Scope / affected:** Implemented but defective or incomplete; signed-in students with multiple unexpired sessions.
- **Evidence/proof:** `active/route.ts:39-61` orders/limits sessions before checking whether the selected one has an attempt.
- **Observed vs expected:** If newest is submitted and older remains open, API returns 404. Query should return newest unexpired session with no attempt.
- **Impact/root cause:** Recoverable work becomes unreachable. Anti-join condition is implemented after `limit(1)`.
- **Recommendation/test:** Query via RPC/not-exists view or iterate safely; seed two sessions and prove correct resume.
- **Effort/dependencies/related:** S; related `FUNC-001`.

### MM-AUD-CONT-002 — Correctness checker fails correct live questions

- **Domain / severity / evidence:** Content correctness gate; P2 Medium; Confirmed, high confidence.
- **Scope / affected:** Implemented but defective or incomplete; four ICAS Year 3 numeracy/science questions and core CI.
- **Evidence/proof:** Both checker commands fail IDs `icas-y3-numeracy-db-016`, `...dc-015`, `icas-y3-science-da-009`, `...db-016`; manual derivation shows keys are correct and heuristics model the wrong relation.
- **Observed vs expected:** Gate reports maximum value/exact-half errors for greatest-change, more-than-half and friction questions. Independent checking must parse the asked operation or abstain, never demand a wrong key.
- **Impact/root cause:** CI is red and editors may “fix” correct content incorrectly. Keyword templates overgeneralise.
- **Recommendation/test:** Make templates operation-specific and fail to editorial review when semantics are unknown; build a gold set with positive/negative paraphrases.
- **Effort/dependencies/related:** M; before CI can gate; related `CONT-001`, `CI-001`.

### MM-AUD-PERF-001 — Guest bank ships a 5.08 MiB overlapping answer-key payload

- **Domain / severity / evidence:** Performance/content exposure; P2 Medium; Confirmed, high confidence.
- **Scope / affected:** Implemented but defective or incomplete; all guest sessions; `/api/exam/guest-bank`.
- **Evidence/proof:** Route returns `curated`, `published`, `practice` together (`route.ts:19-25`). Local production response was 5,326,950 bytes with one-year shared caching.
- **Observed vs expected:** Every guest downloads/parses overlapping banks and complete keys/explanations. Delivery should be scoped to selected questions/config, with a deliberate offline/scoring contract.
- **Impact/root cause:** Mobile startup/memory cost and easy wholesale scraping. Convenience API mirrors internal bank variants.
- **Recommendation/test:** Return one session/config projection, consider server scoring or signed/versioned compact assets, compress and set size/parse budgets.
- **Effort/dependencies/related:** M; preserve guest privacy; related `CONT-001`.

### MM-AUD-PERF-002 — Two routes exceed repository bundle budgets

- **Domain / severity / evidence:** Performance; P2 Medium; Confirmed, high confidence.
- **Scope / affected:** Implemented but defective or incomplete; `/results` and `/showcase`.
- **Evidence/proof:** `npm run check:bundle`: results 1,388 KB vs 1,350; showcase 1,359 KB vs 1,350. Exam is only 9 KB below its 1,420 KB exception.
- **Observed vs expected:** Gate exits nonzero; budgeted routes should stay below explicit thresholds.
- **Impact/root cause:** Higher download/parse cost; likely shared renderer/domain imports, exact chunk cause not yet profiled.
- **Recommendation/test:** Analyse chunks, lazy-load review/showcase renderers, avoid barrels, run budget in CI.
- **Effort/dependencies/related:** M; related `CI-001`.

### MM-AUD-CI-001 — Required release-gate stack cannot complete successfully at audited state

- **Domain / severity / evidence:** Testing/CI; P2 Medium; Confirmed, high confidence for local/declared CI.
- **Scope / affected:** Implemented but defective or incomplete; all releases.
- **Evidence/proof:** Core CI runs `check:answers` then `npm test`; checker deterministically exits 1. Full Vitest and Playwright did not complete within bounded local runs. Bundle gate fails but is absent from CI. CI comments call only core required; branch settings unverified.
- **Observed vs expected:** The audited commit cannot produce a fully green documented gate set. Required checks should be deterministic, bounded and risk-aligned.
- **Impact/root cause:** Releases are blocked, bypassed or based on partial signal. Checker defect, suite liveness and gate-policy drift.
- **Recommendation/test:** Fix checker, isolate hanging handles/files, add timeouts/sharding, require risk gates and archive reports; verify on clean CI twice.
- **Effort/dependencies/related:** M; depends `CONT-002`, `PERF-002`; related `CI-002`.

### MM-AUD-CI-002 — CI actions are mutable and token permissions are implicit

- **Domain / severity / evidence:** CI supply chain; P2 Medium; Confirmed, high confidence.
- **Scope / affected:** Implemented but defective or incomplete; `.github/workflows/ci.yml`.
- **Evidence/proof:** Actions use `actions/checkout@v4`, `setup-node@v4`, `supabase/setup-cli@v1`; no workflow/job `permissions` key. GitHub says a full SHA is the immutable action reference.
- **Observed vs expected:** Upstream tags can move and token scope inherits defaults. CI should pin reviewed revisions and declare least privilege.
- **Impact/root cause:** Build/secrets supply-chain exposure. Convenience version tags/default permissions.
- **Recommendation/test:** Pin full SHAs with version comments/Dependabot, set `permissions: contents: read`, grant exceptions only where needed, validate fork PR behavior.
- **Effort/dependencies/related:** S; review upstream SHAs; related `DEP-001`.

### MM-AUD-DOC-001 — Core documentation describes a much older product state

- **Domain / severity / evidence:** Documentation; P2 Medium; Confirmed, high confidence.
- **Scope / affected:** Contradictory or ambiguous scope; maintainers, reviewers and users.
- **Evidence/proof:** `README.md:3,137,141` says exactly 100 questions and autosave/assignments/reporting are future. Current validation reports 965; routes/data implement all three. Other summaries retain 100/288/388-era counts.
- **Observed vs expected:** Primary onboarding contradicts code/build. Current-state documents should be generated or updated with the same release.
- **Impact/root cause:** Incorrect architectural decisions, audits and onboarding. Status documents were not versioned/generated.
- **Recommendation/test:** Generate route/bank/type counts, mark historical reports, add doc assertions and a dated scope table.
- **Effort/dependencies/related:** M; after product/nav decisions; related `PROD-001`, `NAV-001`, `CONT-001`.

### MM-AUD-NAV-001 — Public navigation has two unreconciled governance contracts

- **Domain / severity / evidence:** Navigation governance; P2 Medium; Confirmed, high confidence.
- **Scope / affected:** Contradictory or ambiguous scope; public header/footer/auth entry points.
- **Evidence/proof:** Supplied map requires Practice→`/assessments`, Resources→`/help`, `/login`, `/signup`; implementation uses `/sign-in`, `/sign-up`, `/resources` and adds Learn/Exam Preparation. Current tests enforce implementation.
- **Observed vs expected:** Later implementation appears intentional but no single explicit supersession resolves the approved map.
- **Impact/root cause:** Inconsistent IA, analytics/SEO aliases and future regressions. Product decision lives in scattered code/comments.
- **Recommendation/test:** Approve one canonical route/navigation document; add redirects if renaming; derive nav/sitemap/tests from shared route definitions.
- **Effort/dependencies/related:** S; product owner decision; related `PROD-001`, `DOC-001`.

### MM-AUD-BILL-001 — Pricing availability copy contradicts its own source of truth

- **Domain / severity / evidence:** Billing/product truth; P2 Medium; Confirmed, high confidence.
- **Scope / affected:** Contradictory or ambiguous scope; landing plans, `/pricing`, `/billing`, parents.
- **Evidence/proof:** `landing/content.ts:750` says price is live/charged; `lib/billing/prices.ts:4,64-84` calls amounts placeholders and availability `roadmap`; terms/privacy say no payments yet. CTA correctly becomes Register interest.
- **Observed vs expected:** One section simultaneously advertises charged pricing and says it is not purchasable. All surfaces should derive truthful availability wording.
- **Impact/root cause:** Commercial trust/legal risk. CTA availability was centralised but intro/pending flags were not.
- **Recommendation/test:** Use availability-driven copy everywhere; only flip after real prices, refund terms and legal sign-off. Snapshot both roadmap/purchasable modes.
- **Effort/dependencies/related:** S; depends commercial/legal decision; related `PRIV-001`, `PROD-001`.

### MM-AUD-SEO-001 — Sitemap advertises an authenticated billing console

- **Domain / severity / evidence:** SEO; P2 Medium; Confirmed, high confidence.
- **Scope / affected:** Implemented but defective or incomplete; `/sitemap.xml`, `/billing`.
- **Evidence/proof:** `src/app/sitemap.ts:23` includes `/billing`; robots does not disallow it; build marks billing dynamic.
- **Observed vs expected:** Crawlers receive an account/role-dependent URL. Sitemap should contain canonical public discovery pages only.
- **Impact/root cause:** Low-quality indexed/auth responses and duplicate pricing intent. Public pricing and private billing were conflated.
- **Recommendation/test:** Remove billing from sitemap/disallow private prefix; keep `/pricing`; assert every sitemap URL is public 200 and indexable.
- **Effort/dependencies/related:** XS; related `BILL-001`.

### MM-AUD-OBS-001 — Critical operations lack structured, actionable observability

- **Domain / severity / evidence:** Observability; P2 Medium; Confirmed, high confidence.
- **Scope / affected:** Documented current scope but missing; auth, submit/timer/scoring, publication, Stripe and admin operations.
- **Evidence/proof:** Routes use isolated `console.error`; no correlation/request IDs, error service, health/readiness route or alert definitions were found. `/admin/operations` explicitly uses mock jobs.
- **Observed vs expected:** A failed submission or timer finalisation cannot be traced end-to-end from a privacy-safe event. Release-critical failures need structured diagnostics/alerts without raw child answers.
- **Impact/root cause:** Slow incident detection/recovery and unverifiable operational claims. Observability backend was deferred.
- **Recommendation/test:** Define redacted event schema, correlation IDs, health checks, metrics/SLO alerts and retention; chaos-test alert delivery in non-production.
- **Effort/dependencies/related:** L; privacy design first; related `PRIV-001`, `OPS-001`, `FUNC-001`.

### MM-AUD-AUTH-001 — Email confirmation/recovery readiness is not demonstrated

- **Domain / severity / evidence:** Auth operations; P2 Medium; Strongly indicated, medium confidence.
- **Scope / affected:** Implemented but defective or incomplete; parent signup/password recovery and deployment.
- **Evidence/proof:** Repository deployment guidance records missing custom SMTP and constrained reset/confirmation delivery; auth UI assumes links can be sent. Production settings were intentionally not accessed.
- **Observed vs expected:** Code path exists, but reliable multi-user email delivery is not evidenced. Production launch requires tested sender/domain/rate/recovery configuration.
- **Impact/root cause:** Parents may fail confirmation or account recovery. External auth configuration is outside reproducible code.
- **Recommendation/test:** Configure test/staging SMTP and redirects, verify first/repeated signup/reset/expiry across providers, document ownership/alerts. Confirm production separately under authorisation.
- **Effort/dependencies/related:** M; external deployment access; related `PRIV-001`, `SEC-003/004`.

## Detailed findings — P3

### MM-AUD-OPS-001 — Mock operations console remains in the product route tree

- **Domain / severity / evidence:** Operations; P3 Low; Confirmed, high confidence.
- **Scope / affected:** Rejected, legacy or superseded; admins; `/admin/operations`.
- **Evidence/proof:** Page comments and context pill state all jobs/retries are local mock data.
- **Observed vs expected:** It is honestly labelled, but has no live queue purpose. Production surfaces should be implemented, explicitly experimental, or excluded.
- **Impact/root cause:** Small maintenance/confusion burden; design mock retained as scaffold.
- **Recommendation/test:** Decide to remove/build-gate it or fund real backend; route test should reflect the decision.
- **Effort/dependencies/related:** S; product/observability decision; related `OBS-001`.

### MM-AUD-ARCH-001 — Year-level persistence is intentionally locked to 3/5

- **Domain / severity / evidence:** Roadmap architecture; P3 Low; Confirmed, high confidence.
- **Scope / affected:** Future scope — not a current defect; profiles/provisioning and Years 1–12 roadmap.
- **Evidence/proof:** schema `profiles.year_level` checks 3/5 (`phase0...sql:15`); `provision-child.ts:56-75,125-141` documents/blocks wider years; TypeScript registry accepts 1–12.
- **Observed vs expected:** Current users are correctly blocked from unavailable years, but roadmap activation requires migration. This should not be loosened before content/programmes are governed.
- **Impact/root cause:** Planned expansion has a known coordinated migration dependency, not an immediate user defect.
- **Recommendation/test:** At approved phase, migrate constraint/backfill/reporting and test every year; keep catalogue availability gates independent.
- **Effort/dependencies/related:** M; future product decision; related `PROD-001`, `DOC-001`.
