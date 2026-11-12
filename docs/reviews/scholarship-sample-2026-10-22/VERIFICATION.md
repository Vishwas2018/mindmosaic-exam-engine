# Verification record — 22 October 2026

Initial local/remote HEAD: `16c5c1ddb22c30c325f8ef03f8845168a9b0fda8`; PR #73 confirmed draft. Work performed in the existing dedicated `feat/scholarship-y6-sample` worktree.

## Local preparation checks

- `npx tsx scripts/scholarship-preview-release.mts`: pass; all 160 source identities match immutable 45b6cdab packet bytes, all 12 advisory manifest hash pairs match 16c5c1d, intake sidecars preserve canonical publication content. No lifecycle, approval or publication writes.
- Six focused unit/component/integration files: **82 tests passed**, including admin role/secrecy, all 160 exact hashes, immutable historical identities, stale governance and packet tamper refusal, pre-stage worksheet rejection by publication validation, isolated amended-candidate ingestion, sample selection, scoring and session restrictions.
- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm run build -- --webpack`: pass; 65 static pages. The admin route trace includes the versioned status report and all four private packets. Webpack is used locally because dependencies are linked across worktrees; CI exercises the default build.
- `npm run content:validate-scholarship-drafts`: pass, all 160 drafts; schema, solvers, positions, stems, encoding and runtime isolation remain enforced.
- `npm run validate:questions`: pass.
- `npm run check:answers -- --include-published`: pass; 175 fully computable, 1,601 structurally checked, 1,422 editorial, 4 manual; 1,571 warnings, zero failures.
- `npm run questions:validate-ledger`: pass; 98 rows, 43 generated/audited events, 20 in-scope files.

One full local guarded unit run was interrupted after source edits made its snapshot obsolete. Running focused suites concurrently caused filesystem-bound test timeouts; the final focused run was isolated and passed all 82. These interrupted/failed development attempts are not represented as full-suite passes. No assertions, thresholds or timeouts were weakened.

Local Docker is unavailable (`dockerDesktopLinuxEngine` named pipe absent). Database RLS and authenticated browser results therefore come from isolated CI, not the unavailable local database. Previous-HEAD CI was not used as evidence for the new loader.

## Completed verification of preparation commit 3e204a47

- Local `npm run test:ci`: **371 files, 6,491 tests passed**, every test concluded, none failed.
- [Pull-request CI run 39693604531](https://github.com/Vishwas2018/mindmosaic-exam-engine/actions/runs/39693604531): all five jobs green — core, scholarship-drafts, RLS, public browsers and authenticated browsers. The default production build, typecheck, lint, all core validation/publication audits and guarded full unit suite passed. CI independently concluded all 6,491 unit tests.
- Public browsers: **243 passed** in that run.
- Authenticated browsers: **57 passed**, including role denial, current release identities, all 160 catalogue entries, full Reading preview and the 12-question sample's navigation/passages/scoring/explanations with no student API writes. Full Scholarship papers remain unavailable.
- Guarded RLS: **37 files, 585 passed and 2 expected failures**; all 587 concluded, none failed. Migration/object verification, publication gates, projection round trips and rollback-only cutover verification passed in the isolated database.
- [Push CI run 39693598727](https://github.com/Vishwas2018/mindmosaic-exam-engine/actions/runs/39693598727): also green. Its public-browser summary was 241 passed plus 2 flaky tests that passed the existing automatic retries (sign-in keyboard focus and review-filter contrast during the scan). The parallel PR run passed all 243. Neither assertions nor retry policies were changed.
- Vercel preview build: success. No manual deployment or production release was performed.
- Admin build tracing contains the new status report and all four private packets. The amended prompt is absent from static client JavaScript.
- The real intake script's `--only=<12 manifest IDs> --dry-run` validates all 12 candidates/blueprints without writing records. The preflight explicitly retains the distinct solver-enriched intake identities for VR-032/NR-001; this dry run is not ingestion or approval.
- Git comparison with 16c5c1d confirms no changes to the four question packets, historical identities/status/sheets, exact advisory manifest, previous raw reviews, existing publication approvals or real generated/review-queue/staged records.

The subsequent documentation-only commit records these results; it changes no source, content, hashes, decisions, tests or governance settings. No manual rerun of completed checks is needed for that documentation update; automatically triggered CI remains enabled.

## Remaining release gates

Even green engineering CI does not complete factory ingestion, review chains, originality/difficulty/staging gates or formal owner publication approval. `ingestion-preflight.json` records the exact missing schema fields and lifecycle records. The pre-stage sheet has no provenance revision/source fingerprint and no decisions. No owner approval, merge, publication, production modification, remote migration or manual deployment is authorised or performed.
