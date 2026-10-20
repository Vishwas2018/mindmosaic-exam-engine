# Admin draft review

The existing `/admin` area contains analytics, content intelligence and operations. Interactive content review is now at **`/admin/review`**, linked from the admin home and navigation. On a local development server this is `http://localhost:3000/admin/review`; use the same path on the deployed application after deploying this branch.

## Access and setup

1. Apply `supabase/migrations/20261019100000_admin_draft_review_approvals.sql` using the normal migration workflow. It creates an append-only, admin-only review decision table with RLS. No approval is backfilled.
2. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` on the server. Missing configuration loads no drafts and disables approvals.
3. Sign in through `/sign-in` with an existing Supabase account whose `public.profiles.role` is `admin` and whose `access_revoked_at` is null. An authorised database operator must assign admin roles; public sign-up cannot grant this role. No new accounts or roles are provisioned by this change.
4. Open `/admin/review`. Signed-out users go to sign-in; other roles return to their role home. Revoked users are signed out. The loader and approval Server Action independently call the server role gate, rather than relying on the layout.

## Review workflow

The catalogue contains the exact four Year 6 Scholarship packets from 6b7d3339a9c04e3b3196b8e51fdf936be6293624: Verbal Reasoning (45), Numerical Reasoning (40), Reading (35), Mathematics (40). That release is integrated through fresh origin/dev (PR #65), retaining its governance history and artifacts. The older 16 October blind-review reports remain historical source material; they do not grant current independent-review status or approval.

Filter individual questions by section, authored difficulty, human approval/advisory recommendation, and question ID or prompt. Select **Complete draft papers** to try every item in a section packet, with persistent in-page answers and free navigation. These are untimed review previews of the complete draft packets. Filters never truncate a paper. Both modes reuse `ExamQuestion`, the question renderers and deterministic visual renderers. Reading passages remain embedded in the exact source questions. The current 160-question source set has no structured visuals; supported visuals are rendered if present, with the normal visual schema validation.

Submitting reveals the declared answer, worked explanation and marks. The independent reports expose reviewer answers, working, semantic/originality concerns, recommendations and difficulty conflicts. They are labelled historical advisory evidence, not current revision-bound verification or human approval. Existing solver/publication gates continue to apply to any eventual publication.

Approval requires three explicit human checks and the separate **Record my explicit approval** action. The server derives identity and time; the browser cannot supply `approvedBy`. It verifies the submitted content hash against freshly loaded source content before inserting. SHA-256 binds the complete raw question, including its embedded passage, options, key, explanation, visuals and metadata. Approval of another hash is never treated as approval of the current revision. Concurrent duplicate decisions cannot overwrite history.

These review decisions are **not publication evidence** and are not consumed by the publication gate. No action here sets content to approved/published, creates publication manifests, changes `approvedBy` in governed publication records, or bypasses human publication sign-off. A separate governed publication workflow is still required.

## Isolation and deployment

Drafts are read from a fixed private allowlist after server authentication, never imported into a client bundle or student bank. The runtime schema extension for Scholarship stays inside the review feature. The renderer accepts presentation metadata for drafts; student schemas, allocation, publication eligibility and public exam APIs are unchanged. Deployment tracing includes the private draft and evidence JSON only for the review route.

The runtime draft-reference guard permits only the exact server-only admin reader with its own admin role check, and rejects consumers of that reader outside the two review entrypoints. Scholarship draft validation uses the release's shared four-section schema and first-party solver verification. A passing structural/solver check never substitutes for external review, difficulty decisions or human publication approval.

Preview answers live only in React component state. There is no exam session creation, autosave, attempt submission, student progress update or analytics write. Reloading or leaving the page discards preview answers. The only write is an explicit human approval into `admin_draft_review_approvals`.

Review history is reported unavailable when its table cannot be read; approvals remain disabled until setup is complete. This change does not apply the migration to a remote database or deploy itself.

## Exact release identity and historical findings

`src/features/admin-review/release-identities.json` pins the source release commit, four complete packet SHA-256 values, and all 160 raw question hashes, candidate hashes and canonical publication-content hashes. The loader withholds a changed packet or an item whose governance identities disagree. Its displayed question is the validated source question, not a historical copy or a student-bank fallback.

The current release status report is shown separately, including its 45 ready-for-review, 35 revision/decision and 80 external-evidence statuses and difficulty gates. These statuses can be filtered independently of historical recommendations and human review decisions. All release governance records remain unchanged.

Historical findings identify their source revision and content hash. Of the 160 earlier question identities, 103 differ from the corrected release and are explicitly labelled superseded. Findings whose question hash still matches remain historical advisory evidence, not current external-review or approval evidence. Existing human review approvals also require an exact current question hash.

## Corrected integration verification — 19 October 2026

The original `scholarship-drafts` CI failure was a Zod rejection of Reading/Mathematics IDs by the stale VR/NR-only draft schema. Integrating the release restores its shared four-section schema, first-party solver/attestation support and blocking CI job. No solver checks, integrity checks, thresholds or CI gates were disabled or weakened.

- All four complete draft packets match `6b7d3339` byte-for-byte. All 160 displayed question identities match the release candidate/publication hashes. A separate raw Git-blob comparison verified 1,206 governance artifacts byte-for-byte, with zero differences.
- `content:validate-scholarship-drafts` passes for all 160 items, including schemas, solvers, option distributions, duplicate stems, encoding and runtime isolation.
- Focused admin/release/validator/external-review/registry tests: 49 passed, including changed-packet and stale-governance refusal.
- Complete guarded unit run: 358 files, 6,338 tests passed; all concluded, none failed. The final follow-up packet-tampering test is also covered by the 49-test focused run.
- Authenticated browser checks: 3 passed, including all 32 revised items' prompts/options/shared passages, the 45/35/80 current status filters, exact release identity, superseded finding labels, full-paper scoring, non-admin denial and no student API writes.
- Complete guarded RLS run on a new isolated local stack: 37 files, 585 passed and 2 expected failures; all 587 concluded, none failed. Other local stacks were not used or reset.
- Typecheck, lint, production build, question-bank validation, independent answer checks including published items, and ledger validation passed.

No human content approval or publication was recorded. No remote database migration or manual deployment was performed. The PR remains a draft and must not be merged until required CI is green.
