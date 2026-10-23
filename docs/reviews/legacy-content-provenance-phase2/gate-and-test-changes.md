# Required engineering changes and adversarial test cases

**Status:** roadmap for a future, separately reviewed engineering PR. **Nothing here is implemented by this PR**, and no change described here is authorised by adopting ADR-017.

The current behaviour column below was read from this branch, which matches `dev` at `714ad641` for every file cited. The withdrawn draft described an allow-list and a solver directory that do not exist; this version was checked against the code.

---

## 1. Current state, verified

| Component | Path | Current behaviour |
|---|---|---|
| Independence predicate | `provenance/evidence.ts` | `isProductionGradeIndependentReview` returns `false` whenever generator identity is null, which is every `legacy_import` candidate |
| Staging | `staging/orchestrate-staging.ts` | Refuses all `kind: legacy_import` (`legacy_import_staging_refused`) |
| Manifest validation | `publication/manifest-schema.ts` | `PUBLISHABLE_GENERATOR_CLASSES` is `{ deterministic_fixture, manual_external, live_provider }`; absent, malformed or `legacy_import` attribution fails with `invalid_generator_attribution` |
| First-party recompute | `correctness/scholarship-attestation.ts` | Hash-bound, ignores candidate `solverParams`, fails closed; registries cover `nr-021…040` and `maths-001…040` |
| Legacy sidecar binding | `legacy-import/bindings.ts` | Hard-coded allow-list of exactly `scholarship-y6-vr-032` and `scholarship-y6-nr-001` |
| Import CLI | `scripts/questions-import-legacy.mts` | Intake transaction only; records remain ineligible |
| Generator classes | `provenance/generator.ts` | `live_provider` is marked "(future)" and has no adapter; `deterministic_fixture` is "never publishable to the real production bank"; `manual_external` is "untrusted external-LLM/hand-written content ingested via the inbox workflow" |

Two corrections to the withdrawn draft are recorded here so the error is not repeated: the publishable allow-list is **not** `curated_bank` / `synthetic_seed` / `model_generation`, and there is **no** `src/features/question-factory/solvers/` directory. The solvers live in `src/features/scholarship/solvers/` and `src/features/question-factory/correctness/`.

---

## 2. Prerequisites that gate all of the work below

Neither exists. Neither is designed by this PR. Work on sections 3 and 4 should not begin until both are separately designed, reviewed and merged.

1. **Approval authentication** — signer registry and its protection, canonical signed payload, artefact-to-commit binding, key lifecycle. Requires branch protection on `dev` that does not currently exist.
2. **Durable legacy-origin ledger** — tracked, tamper-evident state binding candidate hashes to their import transaction.

---

## 3. Proposed gate changes

### 3.1 New predicate; the existing one is not touched

`provenance/evidence.ts` gains a **separate** function. `isProductionGradeIndependentReview` is not modified and continues to return `false` for null generator identity.

```
hasDeterministicLegacyCorrectnessEvidence(candidate, bundle): CorrectnessEvidenceResult
```

It returns a correctness verdict only. It never returns, sets or implies an independence verdict, and callers must not treat its result as one. Candidates evaluated through it retain `independentReviewStatus: "not_established_unknown_origin"`.

### 3.2 Staging

`orchestrate-staging.ts` continues to refuse `kind: legacy_import` unless **all** hold: route is `deterministic_legacy_admission`; the bundle validates; `recompute.outcome` is `recomputed_match`; `originality.result.status` is `no_match_found`; the age-suitability verdict is `suitable`; every `boundContentHash` matches the candidate's current hashes; a verified ledger row exists; and the approval verifies against the authorised signer registry. Any failure refuses with the existing code.

### 3.3 Manifest validation

`manifest-schema.ts` keeps refusing the `legacy_import` adapter class. The PR #74 allow-list is not reopened.

Admitted candidates instead carry a distinct adapter class — working name `legacy_deterministic_admitted` — which is publishable only when accompanied by a verified ledger reference and a verified approval. The point is that an admitted manifest and an unadmitted one must differ by more than fields a single writer controls.

### 3.4 Solver registry

**The initial implementation adds no solver.** The five in-scope candidates — `nr-022`, `nr-023`, `maths-004`, `maths-007`, `maths-014` — are already covered by registered first-party entries. Section 3.1 to 3.3 is the whole of the first engineering change.

`nr-001` and `vr-032` are **not** part of it:

- `nr-001` is a later, separately reviewed change: add `nr-number-series` to `SCHOLARSHIP_ATTESTED_SKILLS` and an independent registry entry declaring its own givens and `solve`, plus the regression tests in section 4.8. It must not delegate to the candidate's sidecar `rule`.
- `vr-032` is deferred. The non-numeric attestation category it would need is not designed, not scheduled and not justified; see `deferred-class-b-c-register.md` section 1.1.

---

## 4. Adversarial test cases

A new suite, `src/tests/unit/question-factory/deterministic-legacy-admission.test.ts`. Each case states the attack and the required refusal. **Refusal cases are the specification**; the passing cases only confirm the route is reachable.

### 4.1 Evidence completeness

1. Bundle missing `recompute` — refused.
2. Bundle missing `originality` — refused.
3. Bundle missing `ageSuitability` — refused.
4. Bundle with no approval — refused. (Currently every bundle, by design.)
5. Bundle with no ledger reference — refused.

### 4.2 Recompute integrity

6. `recompute.outcome` is `key_mismatch` — refused.
7. `recompute.outcome` is `option_match_ambiguous` — refused.
8. `recompute.outcome` is `prompt_givens_mismatch` — refused.
9. `recompute.outcome` is `not_in_scope` — refused, and specifically `vr-032` and `nr-001` must refuse under today's registries.
10. `candidateLogicExecuted` is `true` — refused: evidence derived from the candidate's own `solverParams` is not independent recomputation.
11. Recompute bound to a hash that does not match the candidate's current content — refused as stale, not reused.
12. A genuine `recomputed_match` for `nr-022`, `nr-023`, `maths-004`, `maths-007`, `maths-014` — admitted as far as correctness, then refused for the missing approval.

### 4.3 Originality integrity

13. `matches_found` — refused.
14. `uncertain` — refused.
15. `inconclusive` (engine outage, rate limit) — refused. An unavailable engine is not a pass.
16. `rejected` — refused.
17. Originality bound to a different content hash — refused.
18. A record asserting zero risk or copyright clearance — rejected at schema level; the field does not exist.

### 4.4 Independence must not be inferred

19. A bundle with valid recompute must leave `isProductionGradeIndependentReview` returning `false`.
20. A bundle with valid recompute must not set `originalGeneration.status` to anything but `unverified`.
21. A bundle with valid recompute must not populate `provider`, `model`, `promptHash` or `event` in `originalGeneration` — all are pinned to `z.null()` by `originalGenerationUnverifiedSchema`. (The field is named `event` in the factory schema; `candidateGenerationEvent` is the PR #73 `source-register.json` key for the same fact, and the two must not be confused.)
22. Any attempt to record `independentReviewStatus` as established for a null-identity generator — refused.
23. Advisory review entries must not satisfy any admission requirement, regardless of count or agreement.

### 4.5 Route and attribution tampering

24. Route rewritten from `legacy_intake_pending` to `deterministic_legacy_admission` without a bundle — refused.
25. `kind` changed from `legacy_import` to `generated` with fabricated generation fields — refused at publication compilation.
26. `generatorAdapter.class` set to `legacy_import` in a publication manifest — still refused (PR #74 behaviour preserved).
27. `generatorAdapter.class` set to `legacy_deterministic_admitted` without a verified ledger row — refused.
28. Admitted manifest re-sealed with a recomputed fingerprint but no valid approval — refused.

### 4.6 Scope containment

Scope is a gate input, not a convention. The in-scope set is enumerated and checked before any evidence is read.

29. `nr-001` presented with a complete and otherwise valid deterministic bundle — refused as out of scope, for as long as it is out of scope. A bundle does not widen scope.
30. `vr-032` presented with a complete and otherwise valid deterministic bundle — refused as out of scope.
31. A Class B candidate (`vr-001`, `vr-016`) presented with a deterministic bundle — refused as out of scope.
32. A Class C candidate (`rc-001`, `rc-002`, `rc-003`) presented with a deterministic bundle — refused as out of scope.
33. Every one of the 12 sample candidates, in its current committed state, is refused at staging and publication. This is the regression that proves the Phase 1 hold is still intact.

### 4.7 Regression protection for existing behaviour

34. All 596 committed manifests continue to validate under the PR #74 allow-list.
35. The existing `legacy-manifest-tamper.test.ts` matrix continues to pass unchanged.

### 4.8 Regression tests required before `nr-001` enters scope

These are the owner's stated condition on `nr-001`, alongside the registry entry itself. They belong to that later change, not to the initial one.

36. The `nr-001` registry entry derives option `e` from its own declared givens (`5, 11, 17, 23, 29`) with the candidate's sidecar absent entirely — proving the recompute does not depend on it.
37. The entry refuses when the prompt's stated quantities differ from its declared givens (`prompt_givens_mismatch`).
38. The entry refuses when the content hash does not match (`content_hash_mismatch`).
39. The entry refuses, rather than guessing, when more than one option matches the computed value (`option_match_ambiguous`).
40. `candidateLogicExecuted` is `false` on every passing `nr-001` recompute; a path that reads `solverParams` or the sidecar `rule` fails the suite.
41. Adding the entry does not widen `isScholarshipAttestedItem` beyond `nr-number-series` — ids `nr-002`…`nr-020` remain out of scope and still refuse.
42. `vr-032` still refuses after the `nr-001` change lands.

## 5. CI

The new suite joins the existing `core` job. No CI workflow change is proposed in this PR, and none should be made until the suite exists.

Running `npm run questions:validate-ledger` against a ledger that has not been designed would be a check with nothing to check; it is added when the ledger lands, not before.
