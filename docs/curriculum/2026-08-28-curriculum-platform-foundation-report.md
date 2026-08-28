# Curriculum Platform Foundation — Implementation Report

Date: 2026-08-28

Branch: `codex/curriculum-platform-foundation`

Worktree: `C:\Users\vishw\Vish\Vish\mindmosaic-exam-engine-codex-curriculum`

## Outcome

This contribution establishes a versioned, evidence-gated Australian curriculum platform foundation without adding curriculum UI or importing official curriculum content. It keeps the national curriculum and each jurisdiction's curriculum as distinct immutable releases, models year/level/band/stage as separate applicability axes, and exposes a database-independent catalogue contract for later server-side adapters.

The parent-child API now accepts Years 1–12 and an optional paired jurisdiction/sector preference. Writes remain behind linked-parent authorization and use privileged server access; authenticated clients receive no direct grant to update the new preference columns.

## Architectural decisions

- Curriculum sources are retrieved snapshots with fingerprints and licence-evidence references, not mutable URL pointers.
- Releases are immutable, may supersede earlier releases, and must share their source's jurisdiction with a non-empty subset of its sectors.
- ACARA V9 national identity is distinct from VIC, NSW, WA, and future jurisdiction releases.
- Year, level, band, and stage are parallel applicability axes; no axis is treated as an alias for another.
- Crosswalk direction is explicit: `broader` and `narrower` describe the source relative to the target.
- Review history is append-only and constrained to `draft -> in_review -> approved|rejected`; approved and rejected are terminal.
- Official text may be stored only when matching immutable licence evidence permits storage. Catalogue display additionally requires display permission.
- Coverage is a separately computed product state and does not determine whether a curriculum node exists.
- Learner-facing curriculum access must go through a server-owned catalogue adapter. Authoritative tables have RLS enabled and no direct `anon` or `authenticated` access.
- Existing question-bank offerings project to `region: "global"` until a reviewed jurisdiction-specific mapping exists.

See `docs/adr/016-versioned-australian-curriculum-platform.md` for the decision record.

## Files changed

### Contracts and fixtures

- `src/features/curriculum/catalogue.ts`
- `src/features/curriculum/contracts.ts`
- `src/features/curriculum/index.ts`
- `src/features/curriculum/jurisdictions.ts`
- `src/features/curriculum/synthetic-fixtures.ts`
- `src/schemas/platform/common.ts`
- `src/features/content-projection/project-question.ts`

### Database and migration registry

- `supabase/migrations/20260827090000_curriculum_platform_foundation.sql`
- `scripts/migrations/registry.ts`

### Parent-child server boundary

- `src/features/auth/provision-child.ts`
- `src/app/api/parent/children/route.ts`
- `src/app/api/parent/children/[childId]/route.ts`

### Tests

- `src/tests/unit/curriculum-contracts.test.ts`
- `src/tests/unit/curriculum-migration.test.ts`
- `src/tests/unit/parent-child-patch-route.test.ts`
- `src/tests/unit/provision-child.test.ts`
- `src/tests/unit/parent-children-route.test.ts`
- `src/tests/unit/platform-contracts.test.ts`
- `src/tests/unit/content-projection.test.ts`
- `tests/rls/curriculum-platform.test.ts`

### Documentation

- `docs/adr/016-versioned-australian-curriculum-platform.md`
- `docs/curriculum/2026-08-28-curriculum-platform-foundation-report.md`

## Verification

| Check | Result |
| --- | --- |
| Focused curriculum, child API, migration, and platform contract tests | PASS — 6 files, 95 tests |
| Clean local database reset | PASS — curriculum migration applied |
| Focused curriculum RLS tests | PASS — 1 file, 9 tests |
| `npm run typecheck` | PASS — 0 errors |
| `npm run lint` | PASS — 0 errors, 0 warnings |
| Guarded full unit/component/filesystem suite (`npm run test:ci`) | PASS — 262 files, 4,925 tests; all concluded |
| Guarded full RLS suite (`npm run test:rls:ci`) | PASS — 29 files, 456 tests; all concluded |
| Production build (`npm run build -- --webpack`) | PASS — compiled, type checked, and generated 53 static pages |
| `git diff --check` | PASS |

The default Turbopack build could not run in this isolated worktree because `node_modules` is a junction to the existing dependency installation outside the worktree root. The supported Webpack builder was therefore used. Its first attempt reached compilation but the host's local certificate chain blocked existing Google Font downloads; rerunning with Node's `--use-system-ca` option completed successfully. Neither workaround changes source or production configuration.

The full unit suite was supplied non-secret Stripe test placeholders because the isolated worktree intentionally contains no `.env.local`. Tests did not use live Stripe credentials.

## Unresolved licensing and import questions

1. No real authority text, descriptors, codes, licence assertions, or source URLs are seeded. All fixtures use `SYN-*` identifiers and `example.invalid` URLs.
2. Each real authority/source release still needs a recorded licence review establishing whether MindMosaic may store official text, display it, or retain metadata only.
3. Importers must define canonical source retrieval, fingerprinting, release identity, duplicate handling, and failure recovery before authority data is ingested.
4. National-to-jurisdiction crosswalks require reviewed mapping evidence; they must not be inferred from matching labels alone.
5. Authority-specific publication and supersession dates must be sourced and reviewed during import, not guessed by application code.

## Remaining risks and next work

- The migration has been validated on a clean local database but has not been deployed to a remote environment. A deployment preflight should check existing `programme_offerings.region` values before adding the new constraint.
- `CurriculumCatalogue` is intentionally an interface; a server-only PostgreSQL adapter, importer, and permission-aware projection layer remain to be built.
- Parent/student UI does not yet expose the curriculum preference or catalogue. This contribution is backend foundation only.
- PATCHing profile details and resetting a PIN span separate Supabase Auth/database operations, so an Auth failure can occur after profile details are saved; the API reports that partial outcome explicitly. A later RPC/workflow can improve cross-system recovery but cannot make Supabase Auth and PostgreSQL one transaction.
- Local RLS results depend on the repository's Supabase test stack. Remote policy validation should be repeated in staging after deployment.
