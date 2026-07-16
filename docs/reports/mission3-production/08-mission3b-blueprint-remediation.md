# Mission 3B Blueprint Remediation — Fail-Closed Bound-Blueprint Resolution

**Status: delivered.** Fixes the confirmed Mission 3B audit defect that blocked
Mission 3C approval: the correctness and semantic-review flows *failed open*
when a candidate's bound blueprint (or its hash) was missing or unreadable,
allowing the pipeline to progress through correctness verification or semantic
review without a verified blueprint.

## The defect

Four paths independently read the bound blueprint and silently proceeded when
it could not be resolved:

| Path | Fail-open behaviour |
|---|---|
| `correctness/orchestrate-correctness-verification.ts` | `blueprintHash` computed only `if (blueprintRecord !== undefined)` — missing/unreadable blueprint left it `undefined`, and both fresh verification and cached replay proceeded without a verified binding. |
| `correctness/validate-cached-replay.ts` | `evidence.blueprintHash !== context.blueprintHash` — with both sides `undefined` (blueprint deleted after the report was cached), the vacuous `undefined === undefined` match silently authorised the replay. |
| `review/review-ingest.ts` | The declared-vs-canonical hash comparison ran only `if (blueprintHash !== undefined)` — a missing blueprint *skipped the comparison entirely* and the review chain was appended with an unverifiable declared hash. |
| `review/orchestrate-semantic-review.ts` | Missing blueprint produced an **empty-string** hash, which can never match any chain record's (schema-required, non-empty) evidence-binding hash — so the gate concluded "no independent evidence" and **moved the candidate to quarantine**, a lifecycle/compartment decision made on an unverifiable binding. |

## The fix

### One shared fail-closed resolver

`src/features/question-factory/shared/bound-blueprint.ts` —
`resolveBoundBlueprint(blueprintId, repository)`. Originally introduced at the
revision boundary (Mission 3C third P1 remediation, `revision/revise.ts` now
delegates to it); this remediation makes it the single resolution authority
for the correctness and review flows as well. It enforces, in order:

1. the blueprint record exists (`kind: "missing"` otherwise — including
   storage-layer unreadable/corrupted files, which `FactoryRepository.read()`
   quarantines and reports as absent);
2. the record is readable and parseable (a throwing read → `kind: "invalid"`);
3. `blueprintSchema` conformance (`kind: "invalid"`);
4. the declared `skill` resolves via `skillTaxonomyRegistry.resolve`
   (`kind: "invalid"`);
5. the declared `questionType` has a registered renderer
   (`kind: "invalid"`);
6. a canonical hash is always available on success — `hashJson` over the raw
   stored record, always a non-empty string;
7. every caller then compares its candidate/evidence/review binding strictly
   against that canonical hash — `undefined`, `null` and empty values never
   match anything.

### Wiring (typed failures before any write)

- **Fresh correctness** (`orchestrate-correctness-verification.ts`): the
  resolver runs before either branch (fresh verification *or* cached replay).
  Failure → `repository_error` outcome naming the blueprint and failure kind.
  No evidence is persisted, no lifecycle transition, no compartment move.
- **Cached correctness replay** (`validate-cached-replay.ts`): the context
  hash must be a verified non-empty string (`blueprint_binding_unresolved`
  issue otherwise — new member of `CORRECTNESS_VERIFICATION_ISSUE_CODES`),
  and both the structural and correctness evidence hashes must strictly
  equal it. Absent/empty hashes on either side are rejections, never matches.
- **Review ingestion** (`review-ingest.ts`): the resolver runs immediately
  after the candidate read — before idempotency resolution, so **replays also
  fail closed** when the current blueprint can no longer be verified. Failure
  → rejected with `blueprint_binding_unresolved` (new member of
  `REVIEW_INGESTION_ISSUE_CODES`), before any chain append. The declared
  `input.blueprintHash` must then strictly equal the canonical hash
  (`blueprint_hash_mismatch` otherwise) — the comparison can no longer be
  skipped.
- **Semantic review** (`orchestrate-semantic-review.ts`): the resolver runs
  before evidence evaluation. Failure → `repository_error` outcome with no
  transition and **no quarantine move** (the previous wrong destination).

### Behaviour matrix

| Flow | Blueprint resolvable + binding matches | Unresolvable / mismatched |
|---|---|---|
| Fresh correctness | verify, persist evidence, transition | typed refusal, zero writes |
| Cached correctness replay | replay stored report, no re-derivation, no duplicate artefact | `replay_integrity_failure` / `repository_error`, zero writes |
| Review ingestion (fresh) | chain append + gate attempt | rejected pre-append, zero writes |
| Review ingestion (replay) | replay acknowledgement + gate attempt | rejected, zero writes |
| Semantic review | evidence evaluated, transition decided | typed refusal, no transition, no move |

## Tests

`src/tests/unit/question-factory/blueprint-binding-fail-closed.test.ts` — real
`FsFactoryRepository` over a temp directory, covering: missing blueprint;
unreadable/malformed-JSON blueprint (corrupted on the real filesystem);
schema-invalid blueprint; unresolvable taxonomy skill; renderer-unsupported
question type; replay after blueprint deletion; retry after valid blueprint
restoration (clean replay, no duplicate artefact); replay with a swapped
blueprint (hash mismatch); review ingestion with a deleted blueprint; review
ingestion with a mismatched declared hash; semantic review with a deleted
blueprint (**not** quarantined); and multi-candidate pipeline isolation (one
candidate's broken blueprint never blocks or contaminates another's clean
run). Every failure asserts zero writes: byte-identical candidate record (no
lifecycle progression, no chain append), byte-identical reports (no evidence,
no duplicate replay artefact), and empty terminal compartments (no move).

`correctness-validate-cached-replay.test.ts` adds direct unit coverage for the
absent-hash, empty-hash and evidence-without-hash rejections. Existing
fixtures were updated to seed real, resolvable blueprints (the old fixtures
deliberately relied on the fail-open behaviour), and
`passedStructuralEvidence` now threads `blueprintHash` into `buildEvidence`
so fixture fingerprints genuinely cover it.

The Mission 3C full-path pipeline and crash-recovery suites
(`pipeline-runner-crash-safety`, `mission3c-integration`, `pipeline-runner`,
`pipeline-stages`, `pipeline-batch-lock`) were re-run green after the change.

## Scope discipline

No changes to revision semantics (only its resolver was lifted to the shared
module), pipeline locking, lifecycle states, taxonomy, staging, publication,
or storage architecture. `src/content/` and the production bank are untouched.

## Validation

`npm run typecheck`, `npm run lint`, `npm test` (77 files / 1,642 tests),
`npm run validate:questions`, `npm run check:answers`, `npm run build`,
`npm run test:e2e` (20), `git diff --check` — all clean.
`npm audit --audit-level=moderate` reports only the two accepted, unchanged
moderate Next/PostCSS advisories.
