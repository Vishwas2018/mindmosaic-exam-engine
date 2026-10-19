# Admin draft review

The existing `/admin` area contains analytics, content intelligence and operations. Interactive content review is now at **`/admin/review`**, linked from the admin home and navigation. On a local development server this is `http://localhost:3000/admin/review`; use the same path on the deployed application after deploying this branch.

## Access and setup

1. Apply `supabase/migrations/20261019100000_admin_draft_review_approvals.sql` using the normal migration workflow. It creates an append-only, admin-only review decision table with RLS. No approval is backfilled.
2. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` on the server. Missing configuration loads no drafts and disables approvals.
3. Sign in through `/sign-in` with an existing Supabase account whose `public.profiles.role` is `admin` and whose `access_revoked_at` is null. An authorised database operator must assign admin roles; public sign-up cannot grant this role. No new accounts or roles are provisioned by this change.
4. Open `/admin/review`. Signed-out users go to sign-in; other roles return to their role home. Revoked users are signed out. The loader and approval Server Action independently call the server role gate, rather than relying on the layout.

## Review workflow

The catalogue contains all four existing Year 6 Scholarship source packets: Verbal Reasoning (45), Numerical Reasoning (40), Reading (35), Mathematics (40). The two additional packets and four historical blind-review reports are carried over byte-for-byte from repository commit `ec9718eb` (`feat/scholarship-nr-attestation`). Existing VR/NR packets already match that commit. This adds existing content for review; it does not assert its correctness, originality, or publication readiness.

Filter individual questions by section, authored difficulty, human approval/advisory recommendation, and question ID or prompt. Select **Complete draft papers** to try every item in a section packet, with persistent in-page answers and free navigation. These are untimed review previews of the complete draft packets. Filters never truncate a paper. Both modes reuse `ExamQuestion`, the question renderers and deterministic visual renderers. Reading passages remain embedded in the exact source questions. The current 160-question source set has no structured visuals; supported visuals are rendered if present, with the normal visual schema validation.

Submitting reveals the declared answer, worked explanation and marks. The independent reports expose reviewer answers, working, semantic/originality concerns, recommendations and difficulty conflicts. They are labelled historical advisory evidence, not current revision-bound verification or human approval. Existing solver/publication gates continue to apply to any eventual publication.

Approval requires three explicit human checks and the separate **Record my explicit approval** action. The server derives identity and time; the browser cannot supply `approvedBy`. It verifies the submitted content hash against freshly loaded source content before inserting. SHA-256 binds the complete raw question, including its embedded passage, options, key, explanation, visuals and metadata. Approval of another hash is never treated as approval of the current revision. Concurrent duplicate decisions cannot overwrite history.

These review decisions are **not publication evidence** and are not consumed by the publication gate. No action here sets content to approved/published, creates publication manifests, changes `approvedBy` in governed publication records, or bypasses human publication sign-off. A separate governed publication workflow is still required.

## Isolation and deployment

Drafts are read from a fixed private allowlist after server authentication, never imported into a client bundle or student bank. The runtime schema extension for Scholarship stays inside the review feature. The renderer accepts presentation metadata for drafts; student schemas, allocation, publication eligibility and public exam APIs are unchanged. Deployment tracing includes the private draft and evidence JSON only for the review route.

The runtime draft-reference guard permits only the exact server-only admin reader with its own admin role check, and rejects consumers of that reader outside the two review entrypoints. The legacy Scholarship CLI remains a publication-readiness tool; review previews do not imply that its schema, solver or editorial checks pass for these drafts.

Preview answers live only in React component state. There is no exam session creation, autosave, attempt submission, student progress update or analytics write. Reloading or leaving the page discards preview answers. The only write is an explicit human approval into `admin_draft_review_approvals`.

Review history is reported unavailable when its table cannot be read; approvals remain disabled until setup is complete. This change does not apply the migration to a remote database or deploy itself.

## Verification (19 October 2026)

- Typecheck, lint, production build, question-bank validation, independent answer checks (`--include-published`) and publication-ledger validation passed. Node's system CA support was enabled for font downloads; TLS verification was retained.
- Full unit run: 342 files and 5,901 tests passed using the repository's CI Stripe placeholders and two workers. Follow-up tests covering the final review/import boundaries and migration registry: 22 passed.
- Full guest browser suite: all 235 tests passed against a production build.
- Focused authenticated browser checks: 2 passed, covering non-admin denial, all 160 questions, section counts, shared passages, complete-paper scoring, retained navigation answers, mobile overflow and absence of student API writes. Desktop and mobile captures were inspected; generated captures are not committed.
- Approval RLS checks: all 8 passed against local Postgres. Final full RLS run: 554 passed and 3 failures in the unchanged `tests/rls/resolution-rule.test.ts` aggregate-count assertions (actual 6 versus expected 4; actual 3 versus expected 1 in the shared local database). The new table's student-erasure dependency check passes.
- The full authenticated browser run had 53 passes and 2 failures: an existing completed-attempt `/student/engagement` overflow, and the admin navigation overflow fixed in this change. The subsequent focused review browser run passes both review tests; the unrelated student-page failure remains unresolved.
- The local approval migration was applied for development. No remote migration or deployment was performed, and the local review approval table was verified to contain zero decisions.

The branch must remain unmerged until the complete required CI suite is green.
