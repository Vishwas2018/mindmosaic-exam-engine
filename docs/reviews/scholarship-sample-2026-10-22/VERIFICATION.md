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

Local Docker is unavailable (`dockerDesktopLinuxEngine` named pipe absent). Database RLS and authenticated browser results must therefore come from isolated CI, not the unavailable local database. The configured workflow runs the complete guarded unit suite, default build, publication checks, Scholarship drafts, RLS, public browsers and authenticated browsers against disposable local services. Results for the pushed preparation will be recorded below. Previous-HEAD CI is not evidence for the new loader.

## Remaining release gates

Even green engineering CI does not complete factory ingestion, review chains, originality/difficulty/staging gates or formal owner publication approval. `ingestion-preflight.json` records the exact missing schema fields and lifecycle records. The pre-stage sheet has no provenance revision/source fingerprint and no decisions. No owner approval, merge, publication, production modification, remote migration or manual deployment is authorised or performed.
