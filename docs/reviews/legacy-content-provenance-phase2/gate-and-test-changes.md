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

Per `solver-coverage.md`: add `nr-number-series` to `SCHOLARSHIP_ATTESTED_SKILLS` and an independent registry entry for `nr-001`. `vr-032` additionally needs a non-numeric deterministic attestation category, or it is deferred with Class B.

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
21. A bundle with valid recompute must not populate `provider`, `model`, `promptHash` or `candidateGenerationEvent`.
22. Any attempt to record `independentReviewStatus` as established for a null-identity generator — refused.
23. Advisory review entries must not satisfy any admission requirement, regardless of count or agreement.

### 4.5 Route and attribution tampering

24. Route rewritten from `legacy_intake_pending` to `deterministic_legacy_admission` without a bundle — refused.
25. `kind` changed from `legacy_import` to `generated` with fabricated generation fields — refused at publication compilation.
26. `generatorAdapter.class` set to `legacy_import` in a publication manifest — still refused (PR #74 behaviour preserved).
27. `generatorAdapter.class` set to `legacy_deterministic_admitted` without a verified ledger row — refused.
28. Admitted manifest re-sealed with a recomputed fingerprint but no valid approval — refused.

### 4.6 Scope containment

29. A Class B candidate (`vr-001`, `vr-016`) presented with a deterministic bundle — refused as out of scope.
30. A Class C candidate (`rc-001`, `rc-002`, `rc-003`) presented with a deterministic bundle — refused as out of scope.
31. Every one of the 12 sample candidates, in its current committed state, is refused at staging and publication. This is the regression that proves the Phase 1 hold is still intact.

### 4.7 Regression protection for existing behaviour

32. All 596 committed manifests continue to validate under the PR #74 allow-list.
33. The existing `legacy-manifest-tamper.test.ts` matrix continues to pass unchanged.

---

## 5. CI

The new suite joins the existing `core` job. No CI workflow change is proposed in this PR, and none should be made until the suite exists.

Running `npm run questions:validate-ledger` against a ledger that has not been designed would be a check with nothing to check; it is added when the ledger lands, not before.
