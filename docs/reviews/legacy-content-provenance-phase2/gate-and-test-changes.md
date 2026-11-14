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

1. **Approval authentication** — signer registry and its protection, canonical signed payload, artefact-to-commit binding, key lifecycle. Requires review-and-admin-enforcement branch protection on `dev` that does not currently exist: protection is enabled and does block force-pushes and deletion, but `required_approving_review_count` is 0 and `enforce_admins` is disabled, so it constrains no approval.
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

`orchestrate-staging.ts` continues to refuse `kind: legacy_import` unless **all** hold: route is `deterministic_legacy_admission`; the bundle validates; `recompute.outcome` is `recomputed_match`; **the editorial interpretation evidence is present and passes every condition in section 3.2.1**; `originality.result.status` is `no_match_found`; the age-suitability verdict is `suitable`; the **candidate and revision binding** verifies, meaning every component's `boundFactoryCandidateHash` equals the D2 hash the verifier recomputes and `binding.publicationContentHash` equals the D3 hash it derives via `buildPublishedQuestion` (`schemas.md` section 0); a verified ledger row exists; and the approval verifies against the authorised signer registry. Any failure refuses with the existing code.

#### 3.2.1 Editorial interpretation is a mandatory gate condition

**The gate fails closed on editorial evidence even when the first-party numerical recomputation passes.** A green recompute is a necessary input, never a sufficient one, and the gate must not be implementable in a way that lets the recompute stand in for this check. All of the following are required:

1. `editorialInterpretation` is present and schema-valid.
2. `candidateId` and `factoryRevision` equal the binding's.
3. `reviewedFactoryCandidateHash` equals the candidate's current **D2 factory-candidate hash** and the D2 hash the recompute ran against. **Corrected on finding H-1:** this previously said "publication content hash", which is D3 and is a different value for all five in-scope candidates; as written the condition could never be met. The verifier recomputes D2 as `hashJson(candidateQuestionSchema.parse(candidate))` and D3 as `canonicalQuestionHash(buildPublishedQuestion(candidate).question)`, and compares each to its own field.
4. `solverInterpretationPresented.solverIdentifier` and `.declaredGivens` match the values the gate reads from the **live registry**, not the values restated in the bundle.
5. `reviewerIdentity`, `reviewerRole` and `reviewerQualification` are present, and the role is one of the three permitted.
6. `promptToSolverAssumptions`, `exhaustiveness` and `ambiguity` are each `affirmed`. `uncertain` rejects exactly as `rejected` does.
7. `alternativeDefensibleAnswers.verdict` is `none_defensible`.

Any failure refuses. The refusal must be distinguishable in the result from a numeric failure, so that "the maths is right but nobody has read the stem" is legible rather than reported as a correctness error.

**Age-suitability remains a separate condition.** It is not merged into this one and does not satisfy it.

### 3.3 Manifest validation

`manifest-schema.ts` keeps refusing the `legacy_import` adapter class. The PR #74 allow-list is not reopened.

Admitted candidates instead carry a distinct adapter class — working name `legacy_deterministic_admitted` — which is publishable only when accompanied by a verified ledger reference and a verified approval. The point is that an admitted manifest and an unadmitted one must differ by more than fields a single writer controls.

### 3.4 Solver registry

**The initial implementation adds no solver.** The five in-scope candidates — `nr-022`, `nr-023`, `maths-004`, `maths-007`, `maths-014` — are already covered by registered first-party entries. Section 3.1 to 3.3 is the whole of the first engineering change.

That the solvers exist does **not** mean the five are close to admissible. None of them has an editorial interpretation record (section 3.2.1), because that requirement is new and has never been performed for any candidate; all five therefore refuse today at the editorial condition alone, before the two missing security prerequisites are even reached.

`nr-001` and `vr-032` are **not** part of it:

- `nr-001` is a later, separately reviewed change: add `nr-number-series` to `SCHOLARSHIP_ATTESTED_SKILLS` and an independent registry entry declaring its own givens and `solve`, plus the regression tests in section 4.8. It must not delegate to the candidate's sidecar `rule`.
- `vr-032` is deferred. The non-numeric attestation category it would need is not designed, not scheduled and not justified; see `deferred-class-b-c-register.md` section 1.1.

---

## 4. Adversarial test cases

A new suite, `src/tests/unit/question-factory/deterministic-legacy-admission.test.ts`. Each case states the attack and the required refusal. **Refusal cases are the specification**; the passing cases only confirm the route is reachable.

### 4.1 Evidence completeness

- **C1.** Bundle missing `recompute` — refused.
- **C2.** Bundle missing `editorialInterpretation` — refused. Expanded in section 4.4a (**E1**–**E17**).
- **C3.** Bundle missing `originality` — refused.
- **C4.** Bundle missing `ageSuitability` — refused. Separate from **C2**; neither satisfies the other.
- **C5.** Bundle with no approval — refused. (Currently every bundle, by design.)
- **C6.** Bundle with no ledger reference — refused.

### 4.2 Recompute integrity

- **R1.** `recompute.outcome` is `key_mismatch` — refused.
- **R2.** `recompute.outcome` is `option_match_ambiguous` — refused.
- **R3.** `recompute.outcome` is `prompt_givens_mismatch` — refused.
- **R4.** `recompute.outcome` is `not_in_scope` — refused, and specifically `vr-032` and `nr-001` must refuse under today's registries.
- **R5.** `candidateLogicExecuted` is `true` — refused: evidence derived from the candidate's own `solverParams` is not independent recomputation.
- **R6.** Recompute bound to a hash that does not match the candidate's current content — refused as stale, not reused.
- **R7.** A genuine `recomputed_match` for `nr-022`, `nr-023`, `maths-004`, `maths-007`, `maths-014` — admitted as far as correctness, then refused for the missing approval.

### 4.3 Originality integrity

- **O1.** `matches_found` — refused.
- **O2.** `uncertain` — refused.
- **O3.** `inconclusive` (engine outage, rate limit) — refused. An unavailable engine is not a pass.
- **O4.** `rejected` — refused.
- **O5.** Originality bound to a different D2 factory-candidate hash — refused.
- **O6.** A record asserting zero risk or copyright clearance — rejected at schema level; the field does not exist.

### 4.4 Independence must not be inferred

- **I1.** A bundle with valid recompute must leave `isProductionGradeIndependentReview` returning `false`.
- **I2.** A bundle with valid recompute must not set `originalGeneration.status` to anything but `unverified`.
- **I3.** A bundle with valid recompute must not populate `provider`, `model`, `promptHash` or `event` in `originalGeneration` — all are pinned to `z.null()` by `originalGenerationUnverifiedSchema`. (The field is named `event` in the factory schema; `candidateGenerationEvent` is the PR #73 `source-register.json` key for the same fact, and the two must not be confused.)
- **I4.** Any attempt to record `independentReviewStatus` as established for a null-identity generator — refused.
- **I5.** Advisory review entries must not satisfy any admission requirement, regardless of count or agreement.

### 4.4a Editorial interpretation evidence

The gate must refuse every case below **while the first-party numeric recompute returns a clean `recomputed_match`**. That precondition is the point of the section: each case isolates the editorial component from the arithmetic.

- **E1.** Bundle with no `editorialInterpretation` member — refused. (Currently every bundle.)
- **E2.** `reviewedFactoryCandidateHash` does not match the candidate's current D2 hash — refused as stale, not reused.
- **E3.** `candidateId` names a different candidate — refused. An editorial record must not be transferable between items.
- **E4.** `factoryRevision` names a different revision of the same candidate — refused.
- **E5.** `solverInterpretationPresented.solverIdentifier` differs from the solver the gate resolves from the live registry — refused.
- **E6.** `solverInterpretationPresented.declaredGivens` differ from the registry's declared givens — refused, including when the bundle's own `recompute` record was fabricated to agree with the editorial record. The gate resolves both from the registry, so a self-consistent pair of forged records still fails.
- **E7.** `reviewerIdentity` absent, empty or whitespace — refused.
- **E8.** `reviewerQualification` absent, or `reviewerRole` outside the permitted set — refused. An unqualified reviewer is not a weaker pass.
- **E9.** `promptToSolverAssumptions.verdict` is `rejected` — refused.
- **E10.** `exhaustiveness.verdict` is `rejected` — refused.
- **E11.** `ambiguity.verdict` is `rejected` — refused.
- **E12.** Any of the three is `uncertain` — refused. Uncertainty is not a soft pass.
- **E13.** `alternativeDefensibleAnswers.verdict` is `alternatives_defensible`, with `optionIds` populated — refused.
- **E14.** `alternativeDefensibleAnswers.verdict` is `uncertain` — refused.
- **E15.** **Numeric recompute PASS with editorial interpretation FAIL** — refused, and the refusal reason must identify the editorial component rather than reporting a correctness failure. This is the headline case: it is the `maths-014` shape, and a gate that admits here has reproduced the defect this whole route exists to avoid.
- **E16.** A passing recompute with an `ageSuitability` verdict of `suitable` but **no** editorial record — refused. Age-suitability does not satisfy requirement 2.
- **E17.** An advisory review agreeing with the key, offered in place of the editorial record — refused regardless of how many advisory entries agree.

### 4.4a-H Hash-domain integrity

Added on finding H-1. These cases exist because the three domains are easy to confuse and a confusion is silent: a D3 value in a D2 field looks like a well-formed 64-hex string. Each case must refuse with a message naming the domain error, not a generic mismatch.

- **H1.** `recompute.boundFactoryCandidateHash` carries the candidate's **D3** `publicationContentHash` — refused as a domain error, not as stale evidence.
- **H2.** `editorialInterpretation.reviewedFactoryCandidateHash` carries the D3 hash — refused as a domain error.
- **H3.** `originality.boundFactoryCandidateHash` or `ageSuitability.boundFactoryCandidateHash` carries the D3 hash — refused as a domain error.
- **H4.** A bundle in which **every** component consistently carries D3 instead of D2 — refused. Internal consistency is not validity; the verifier compares against independently recomputed values, so a uniformly wrong bundle fails uniformly.
- **H5.** `binding.publicationContentHash` does not equal `canonicalQuestionHash(buildPublishedQuestion(candidate).question)` — refused. The verifier derives D3; it must not read it from the source register.
- **H6.** `publicationProjection.factoryCandidateHash` does not equal `binding.factoryCandidateHash` — refused: the projection was run over a different candidate.
- **H7.** A bundle that carries any verifier-derived field as if it were an input — the verifier recomputes D2 and D3 itself and never lets a submitted value stand in for the recomputation. Submitting such a field must not short-circuit it. (The field is not part of the bundle schema; see `schemas.md` section 4b.)
- **H8.** A **solver_sidecar** candidate (`vr-032`, `nr-001`) where D1 equals D2 — refused as inconsistent with `transformation: "solver_sidecar"`, which must change the candidate hash. This case is out of initial scope today and must refuse on scope first; it is specified so the check exists when the scope question is reopened.
- **H9.** **Positive control — the H-1 regression guard.** This case must be written with care, because the obvious version of it does not work.

**Corrected on review finding R4-P1.** An earlier version of this case described a bundle "missing approval, ledger and editorial evidence" that nonetheless "passes the hash-domain checks". That is impossible. `editorialInterpretation` and `publicationProjection` are **required** members of `deterministicLegacyAdmissionBundleSchema`, and Zod runs `.superRefine` only after the base object parse succeeds. A bundle missing either one fails the base parse, so refinements (b), (b2), (f) and (g) — every condition H-1 concerns — never execute. The test would have asserted refusal, got refusal for the wrong reason, and stayed green even if an unsatisfiable hash condition were reintroduced. The one named guard against H-1 recurring could not detect it.

The case must therefore be **schema-complete**:

- Build, for each of the five in-scope candidates, a bundle in which every required member is present and fully populated: `binding` with D1, D2 and D3 set to the independently recomputed values; `recompute` with `outcome: "recomputed_match"`, `boundFactoryCandidateHash` = recomputed D2, and `solverIdentifier` and `givensReadFromPrompt` resolved from the live registry; `editorialInterpretation` with `reviewedFactoryCandidateHash` = recomputed D2, all three verdicts `affirmed`, `alternativeDefensibleAnswers: "none_defensible"`, and a named qualified reviewer; `publicationProjection` with the derived D3; `originality` `no_match_found`; `ageSuitability` `suitable`. `approval` and `ledgerEntryRef` are omitted, which the schema permits.
- Assert **`deterministicLegacyAdmissionBundleSchema.safeParse(bundle).success === true` with zero issues.** This assertion is what makes the case a hash-domain regression guard: if any hash condition is ever made unsatisfiable again, it fails here and names the offending path.
- Then assert that the candidate is still refused at the gate, and that the refusals come **only** from the approval and ledger conditions of section 3.2 — which live outside the schema and are unimplemented.

The negative "missing editorial record" case is already covered by **E1** and by section 4.1 item **C2**, and must not be conflated with this one.

### 4.4b `nr-022` regression: the word-only mutation

`nr-022` carries the weakest prompt-to-solver binding of the five in-scope candidates (`givens: [8]`; both ratios live in the solver — see `solver-coverage.md` section 3a.3). These two cases pin the behaviour that matters, and they are deliberately different.

**Case A — mutated stem checked against the previously recorded hash.**

- **N1.** Take committed `nr-022`, change "three times as old" to "four times as old" and change nothing else. Supply the **original D2** `expectedContentHash` (`8758ac61587d966b…`). `verifyFirstPartyScholarshipAttestation` must return **`content_hash_mismatch`**, and admission must refuse. This proves the hash binding does what it is for: prose is inside `hashJson(question)`, so a word-only edit is detected against a known-good revision.

**Case B — the same mutation, re-hashed, recomputed fresh.**

- **N2.** Take the same mutated stem, compute its **new D2** hash, and run the recompute against that. The recompute **may legitimately return `recomputed_match`**: the hash is self-consistent, the prompt still yields the digit set `{8}`, and the solver still evaluates its hard-coded `3 ×` relation. The test must assert this honestly rather than expecting a numeric failure that will not occur.

- **N3.** Admission for case B must nonetheless **refuse**, because no editorial interpretation record exists for the new revision. A new revision requires fresh editorial evidence; re-hashing and re-running the solver does not re-establish eligibility.

- **N4.** Admission for case B must **still refuse** when an editorial record is supplied that was bound to the *pre-mutation* revision — caught by **E2** and **E4**.

- **N5.** Case B with an editorial record genuinely bound to the mutated revision is admitted **only if** a qualified reviewer affirms all three judgements and returns `none_defensible` for the mutated stem's own key. The test must construct this outcome from the reviewer's recorded judgement, and **must not hard-code acceptance of any particular revised key**. Whether "four times as old" has a single defensible answer among the committed options, and which option that is, is the reviewer's determination to record — not a constant for this suite to assert. If no such affirmation is recorded, the expected result is refusal.

### 4.5 Route and attribution tampering

- **A1.** Route rewritten from `legacy_intake_pending` to `deterministic_legacy_admission` without a bundle — refused.
- **A2.** `kind` changed from `legacy_import` to `generated` with fabricated generation fields — refused at publication compilation.
- **A3.** `generatorAdapter.class` set to `legacy_import` in a publication manifest — still refused (PR #74 behaviour preserved).
- **A4.** `generatorAdapter.class` set to `legacy_deterministic_admitted` without a verified ledger row — refused.
- **A5.** Admitted manifest re-sealed with a recomputed fingerprint but no valid approval — refused.

### 4.6 Scope containment

Scope is a gate input, not a convention. The in-scope set is enumerated and checked before any evidence is read.

- **S1.** `nr-001` presented with a complete and otherwise valid deterministic bundle — refused as out of scope, for as long as it is out of scope. A bundle does not widen scope.
- **S2.** `vr-032` presented with a complete and otherwise valid deterministic bundle — refused as out of scope.
- **S3.** A Class B candidate (`vr-001`, `vr-016`) presented with a deterministic bundle — refused as out of scope.
- **S4.** A Class C candidate (`rc-001`, `rc-002`, `rc-003`) presented with a deterministic bundle — refused as out of scope.
- **S5.** Every one of the 12 sample candidates, in its current committed state, is refused at staging and publication. This is the regression that proves the Phase 1 hold is still intact.

### 4.7 Regression protection for existing behaviour

- **G1.** All 596 committed manifests continue to validate under the PR #74 allow-list.
- **G2.** The existing `legacy-manifest-tamper.test.ts` matrix continues to pass unchanged.

### 4.8 Regression tests required before `nr-001` enters scope

These are the owner's stated condition on `nr-001`, alongside the registry entry itself. They belong to that later change, not to the initial one.

- **X1.** The `nr-001` registry entry derives option `e` from its own declared givens (`5, 11, 17, 23, 29`) with the candidate's sidecar absent entirely — proving the recompute does not depend on it.
- **X2.** The entry refuses when the prompt's stated quantities differ from its declared givens (`prompt_givens_mismatch`).
- **X3.** The entry refuses when the content hash does not match (`content_hash_mismatch`).
- **X4.** The entry refuses, rather than guessing, when more than one option matches the computed value (`option_match_ambiguous`).
- **X5.** `candidateLogicExecuted` is `false` on every passing `nr-001` recompute; a path that reads `solverParams` or the sidecar `rule` fails the suite.
- **X6.** Adding the entry does not widen `isScholarshipAttestedItem` beyond `nr-number-series` — ids `nr-002`…`nr-020` remain out of scope and still refuse.
- **X7.** `vr-032` still refuses after the `nr-001` change lands.

## 5. CI

The new suite joins the existing `core` job. No CI workflow change is proposed in this PR, and none should be made until the suite exists.

Running `npm run questions:validate-ledger` against a ledger that has not been designed would be a check with nothing to check; it is added when the ledger lands, not before.
