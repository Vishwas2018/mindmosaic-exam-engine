# MindMosaic programme governance and roadmap

This change is prepared for a draft PR into `dev`. The clean comparison baseline is `cc50a9a1`; the split governance branch is based on the refreshed `origin/dev` after the landing Chapter 1 merge. No hosted migration, content approval, production deployment, payment call or billing-enforcement change was performed. The repository's PR integration may create an automatic preview deployment. See the [clean `dev` baseline](reports/baseline-dev-2026-10-05.md) and [hosted database drift](reports/hosted-db-drift-2026-10-05.md).

## Current serving and approval boundary

The bank contains 1,548 authored questions (1,005 curated, 543 factory-published). All programme publication switches are source-controlled and currently set to `report`. Report mode serves the existing bank as on `dev`, while `audit:bank`, `content:verify-publication` and `programmes:readiness` calculate approval coverage and fail on integrity problems. No historical item has a recorded revision-bound human approval; the approved count is therefore zero. Switching one programme to `enforce` will serve only its approved revisions, leaving other programmes in report mode. The TypeScript and database modes must pass `programmes:check-gates` together.

Factory manifest fingerprints remain historically reproducible. The comparison uses parsed question content and the shared canonical hash, resolving the 61 differences caused by schema defaults without rewriting a manifest. Approval evidence binds a named reviewer, recording time, all three explicit checks, the exact question snapshot and content hash, revision, source-manifest hash and fingerprint. Missing approval is reported; malformed or drifting evidence fails the integrity gate. Test-only approval helpers are import-blocked from production code.

The registered migration adds a private, immutable approval table and a private `publication_gate_settings` table with `enforced=false` by default. An empty settings table leaves allocation as on `dev`. Allocation and session-item insertion consult the item programme's switch; historical session reads keep the existing `get_assessment_session` function and remain readable without approvals. The migration has been tested locally but has not been applied to hosted Supabase.

## Human review workflow

1. Use `npm run content:review-sheet -- --programme <id> [--skill <skillId>] [--limit 25]` for existing content. It writes a private HTML question preview and matching CSV under the ignored `content/question-factory/reports/human-approval/` directory. Add `--candidate-ids <ids>` to preview staged factory candidates before publication.
2. A human independently reviews correctness, originality and age appropriateness. They write `yes` for each passed check, choose `approve`, `reject` or `revise`, and provide their full name. The sheet starts with blank checks and decisions; machine-computable answer status is information for review, not a substitute for sign-off.
3. For existing published content, run `npm run content:record-approvals -- --sheet <reviewed.csv> --reviewer "<full name>"`. The packet command `content:record-approval -- --packet <reviewed.json>` uses the same revision and check verifier. Batch validation rejects stale, incomplete or duplicate approvals before any write. Reject and revise rows create no approvals; an already recorded matching row is a no-op.
4. For staged candidates, run `npm run questions:publish -- --candidate-ids <ids> --sheet <reviewed.csv> --reviewer "<full name>"` or use one reviewed `--packet`. The old blanket confirmation flag is gone. The publisher verifies the staged revision and question hash, then records approval bound to the resulting manifest.
5. Commit actual reviewer-created approval records and rerun publication, projection and content checks. No approval is generated from authorship, an AI draft, a historical manifest or a test fixture.

## Content and release gates

| Programme | Authored capacity | Next gate |
| --- | --- | --- |
| NAPLAN-style Year 3 | Numeracy can fill three distinct papers; reading 20/39, language 49/52 | Original passage groups and spelling/grammar coverage, then independent review and approval |
| NAPLAN-style Year 5 | Numeracy can fill three distinct papers; reading 7/39, language 32/52 | Reading groups and language coverage, then review and approval |
| ICAS-style Year 3 | Five objective subjects can fill papers | Retake depth and reviewed approval |
| ICAS-style Year 5 | English, maths, digital technologies and spelling fill a first paper; science has no served items | Original science and a second disjoint paper where required |
| Curriculum | 104 validated lessons | At least five approved items per assessable Level 3 node; retain classroom-only notices |
| AMC-style Year 3/5 | Patterns, tiered marks and integer answers are implemented | Thirty original, reviewed, approved items per year plus scoring and reporting verification |

The separate roadmap-drafts PR contains 182 **unsigned** candidate items, outside runtime imports. Its structural simulation estimates future paper capacity; it does not establish independent correctness, originality, human approval or current availability. Dedicated writing papers remain deferred; the four existing tasks require manual review.

Families-first paid release still requires deployed migration and projection checks, parent signup → child linking → learning/practice → results → progress journeys, role isolation, deletion/retention checks, and test-environment checkout, signed webhook, trial, cancellation, payment-failure and inherited-child-access verification. Keep billing enforcement off until those gates pass. AMC follows the existing family offering; selective, scholarship, Singapore Maths and Olympiad remain planned.

`npm run programmes:readiness -- --release-gate` is an acceptance gate for content coverage, not a delivery date or commercial launch certificate. Add `--include-amc` when evaluating AMC. Approval review capacity determines when any programme can safely move from report to enforce mode.
