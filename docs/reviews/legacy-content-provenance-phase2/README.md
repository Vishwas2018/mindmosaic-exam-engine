# Phase 2a — deterministic legacy admission policy proposal

**Status:** **ADOPTED** by explicit owner decision on 2026-10-24, against reviewed commit `206d0dd4`. Documentation only. No code, schema, gate or question content is changed by this PR.

Adoption is a **policy-design decision only**. It authorises design work and nothing else: no gate changes, no candidate admitted, no ingestion, staging, publication, deployment, release or merge. PR #75 remains **draft and unmerged**. Implementation, admission and release each need their own separate owner authorisation. The full record, including the exact scope of authorisation, the independent review evidence and the Phase 2b workstreams, is in `owner-adoption-decision.md`.

This directory holds the revised Phase 2 governance proposal for MindMosaic legacy content whose original generation is unverified. It replaces a first draft that was withdrawn (see below).

## What is proposed

One narrow admission route, `deterministic_legacy_admission`, for legacy candidates whose correct answer can be recomputed by a first-party algorithm from the stated prompt. It establishes **recomputed correctness and nothing else**. Authorship stays unverified, review independence stays unestablished, and neither is inferred from the other.

Policy eligibility and engineering scope are stated separately throughout, because they are decided separately:

| Tier | Candidates | Position |
|---|---|---|
| Initial engineering scope | `nr-022`, `nr-023`, `maths-004`, `maths-007`, `maths-014` | Policy-eligible and in scope. First-party recompute already exists and runs in CI; no solver work required. |
| Policy-eligible, out of scope | `nr-001` | Enters scope only after a genuine first-party registry entry **and** regression tests, separately reviewed. |
| Deferred, eligibility open | `vr-032` | Held until a non-numeric deterministic attestation category is separately justified and independently reviewed. |
| Deferred — Class B and C | `vr-001`, `vr-016`, `rc-001`, `rc-002`, `rc-003` and the shared passage | Held at the Phase 1 position. |

Everything outside the first tier is **DEFERRED** at the Phase 1 hold, with existing reviews preserved as advisory evidence. Nothing is retired, rewritten or altered.

Adopting the ADR authorises design work. It authorises no behaviour change. Every Phase 1 refusal stays active until a separate engineering change is reviewed, authorised and validated.

## Documents

| File | Purpose |
|---|---|
| `../../adr/017-legacy-content-unknown-origin-eligibility.md` | The governance decision. Status **`ADOPTED`** (2026-10-24). |
| `../../spec/legacy-content-unknown-origin-policy.md` | The policy specification: scope, evidence, gates, invariants. |
| `source-evidence-reconciliation.md` | Corrected 12-item reconciliation. Hand-written narrative over the JSON; its tables are transcribed, not generated. See its section 1. |
| `source-evidence-reconciliation.json` | Machine output backing the above. |
| `solver-coverage.md` | Exact first-party recompute coverage and the missing bindings. |
| `schemas.md` | Proposed evidence shapes. Failure is representable; two controls deliberately unspecified. |
| `threat-model.md` | Threats, with every countermeasure marked built, proposed or not designed. |
| `gate-and-test-changes.md` | Engineering roadmap and adversarial test cases for a future PR. |
| `deferred-class-b-c-register.md` | What is held, what is missing, and the reopening conditions. Covers `vr-032` (section 1.1) as well as Class B and C. |
| `pr-73-migration-plan.md` | Sequence, blockers, and why a shortened sample is not authorised. |
| `decisions-for-owner.md` | Live decisions, blocked decisions, and what adoption does not authorise. |
| `owner-adoption-decision.md` | **The adoption record**: decision, date, reviewed commit, exact authorisation scope, independent review evidence, P2 follow-ups and Phase 2b workstreams. |

## Withdrawn material

The first draft of this proposal (`candidate-impact-analysis.md`, and the broader-scope ADR and specification at commit `4ad31af2`) is **withdrawn**. An independent adversarial review found that the candidate-impact analysis misstated the answer key for nine of the twelve candidates and misdescribed the content of two — `nr-023` was quoted with the wrong second equation and a wrong answer, and `vr-016` with an answer that is not among its options.

The underlying content was never wrong: the committed review record agrees with the committed answer key on all twelve. The defect was confined to the analysis, which restated evidence instead of deriving it. Under Standing Rule 9 (Zero Fabrication) that document could not stand, so it was replaced rather than patched, and the replacement is machine-generated from committed bytes.

Three further claims from the first draft are withdrawn as unsupported:

- That `isProductionGradeIndependentReview` should accept consensus evidence for unknown-origin content. It is not modified, and must not be.
- That plagiarism scanning establishes zero copyright risk. No tool here produces a legal determination.
- That clean-sheet re-authoring eliminates IP risk and yields full verifiable provenance. It does neither on current tooling: `live_provider` is unimplemented, and `manual_external` is defined in the repository as untrusted.

The threat model's claim that cross-provider agreement makes identical error "statistically improbable" is also withdrawn as unevidenced.

## Corrections from the first independent policy review

An independent policy review of `63ec92fe` returned REQUEST CHANGES with two P1 and two P2 findings. All four are addressed, and each correction is recorded in place rather than quietly applied, so the re-reviewer can check the specific claim that was wrong.

| Finding | What was wrong | Where the correction lives |
|---|---|---|
| **P1-1** | The threat model credited `knownCandidateProvenanceSchema` with three protections it does not have: a required `candidateGenerationEvent`, an integer `promptVersion`, and a 64-character hex `promptHash`. | `threat-model.md` T1 — corrected field-by-field against the real schema, with the privileged-writer fabrication and manifest re-sealing gap restated as an **open technical trust-boundary weakness** rather than a policy violation. |
| **P1-2** | T4 credited the first-party recompute with catching the `maths-014` ambiguity. The external advisory review caught it; the solver returned an identical clean result before and after the fix. | `threat-model.md` T4; a new mandatory editorial interpretation check in the specification (section 4.2 component 4), ADR-017 section 3 requirement 2, `schemas.md` section 4a, and a per-question review of the five in-scope items in `solver-coverage.md` section 3a. |
| **P2-1** | ADR-017 and T2 claimed that with two providers "at most one can share lineage", so "at least one lineage-independent review always survives". | ADR-017 alternatives, `threat-model.md` T2 — withdrawn. Two providers are stronger corroboration; they cannot guarantee lineage independence when the generator is unknown. Class B and C stay deferred and no bypass is introduced. |
| **P2-2** | The reconciliation presented the original review summary's aggregate packet hash as if it bound both historical review events, and did not distinguish `packet-reviewed-original.json` from the current `packet.json`. | `reconcile.py` and both regenerated outputs — two separately bound review events, each hash independently recomputed from committed bytes; `source-evidence-reconciliation.md` sections 2.1 to 2.3. |

### Corrections from the second independent policy review

A second independent review, of `eb83708f`, returned REQUEST CHANGES with one P1 and three P2 findings. All four are addressed.

| Finding | What was wrong | Where the correction lives |
|---|---|---|
| **P1** | `editorialInterpretationCheckSchema` existed in isolation but was absent from the assembled admission bundle and from the gate specification, so the mandatory check was unreachable in practice. | `schemas.md` section 9 — bundle member plus cross-binding refinements and a rule that the gate re-derives solver identity and givens from the live registry; `gate-and-test-changes.md` sections 3.2.1, 4.1, 4.4a and 4.4b; `pr-73-migration-plan.md` section 6.1. |
| **P2-1** | `solver-coverage.md` implied a content change could leave the checked hashes unchanged, conflating hash drift detection with fresh recomputation. | `solver-coverage.md` section 3a.3 — case A (mutation vs recorded hash → `content_hash_mismatch`, detected) separated from case B (mutation re-hashed → numeric path cannot see changed written relationships). |
| **P2-2** | ADR-017 and the specification described the manually submitted ChatGPT advisory review as a qualified human examination. | ADR-017 section 3; specification section 2; `threat-model.md` T4 — attributed to the `manual_user_attested` ChatGPT advisory review, with the qualified editorial check recorded as new, mandatory and **never yet performed**. |
| **P2-3** | This README claimed the reconciliation outputs were not regenerated and were byte-identical to the reviewed versions. True at `63ec92fe`, false from `eb83708f`. | "Reconciliation audit history" below — source evidence unchanged, generated output regenerated and reproducible but **not** byte-identical to what the first review saw. |

## Correction from the hash-domain review

A targeted review of `816f12b7` identified one further defect, **H-1**, in the evidence contract.

**Confirmed, and blocking.** The `superRefine` proposed in `schemas.md` section 9 required the editorial record's hash to equal *both* `binding.publicationContentHash` and `recompute.boundContentHash`. Those are different domains: the attestation binds to the **factory candidate** hash, while `publicationContentHash` is the **published projection**. The two differ for all five in-scope candidates, so the pair of conditions was unsatisfiable and would have rejected every genuine bundle.

Independently reproduced with the repository's own `hashJson`, `candidateQuestionSchema`, `buildPublishedQuestion` and `canonicalQuestionHash`:

| Candidate | D2 factory candidate | D3 publication projection | Equal? |
|---|---|---|---|
| `nr-022` | `8758ac61587d966b…` | `a0c486d79ec70260…` | no |
| `nr-023` | `52d196a6d5d1829e…` | `7b80d6a14c2af6e9…` | no |
| `maths-004` | `8aeef3fbabe39264…` | `2038c2ac1123bb31…` | no |
| `maths-007` | `93bfea7f835eaf40…` | `938bf96f5c97c805…` | no |
| `maths-014` | `71d11fa2c35f6551…` | `aeb211f7441a014a…` | no |

Running the real attestation against each confirms the domain: `expectedContentHash = factoryCandidateHash` returns **ok**, and `expectedContentHash = publicationContentHash` returns **`content_hash_mismatch`**, for all five.

The fix makes every hash field domain-explicit (`boundFactoryCandidateHash`, `reviewedFactoryCandidateHash`), carries the D2 → D3 mapping as its own verified binding, and requires the verifier to recompute each hash rather than accept it. Details in `schemas.md` sections 0, 4b and 9.

## Corrections from the fourth independent review

An independent adversarial review of `3b56e157` confirmed the H-1 diagnosis and fix as correct and independently reproduced, and returned REQUEST CHANGES on one P1 and four P2 findings. All five are addressed.

| Finding | What was wrong | Where the correction lives |
|---|---|---|
| **R4-P1** | Case 18ae, the stated H-1 regression guard, described a bundle "missing editorial evidence" that nonetheless "passes the hash-domain checks". Impossible: `editorialInterpretation` is a required member, and Zod runs `superRefine` only after the base parse succeeds — so every hash-domain refinement would be skipped and the test would stay green if an unsatisfiable condition were reintroduced. The guard could not detect the defect it existed for. | `gate-and-test-changes.md` case **H9** — rewritten to be schema-complete and to assert `safeParse(...).success === true` with zero issues, with the gate refusing only on approval and ledger. |
| **R4-P2-A** | `schemas.md` section 0 called `publication/eligibility.ts` the **only** production call site supplying an expected hash. `correctness/derive-answer.ts:867` also does. | `schemas.md` section 0 — corrected to "only call site supplying an *externally recorded* expected hash"; `derive-answer.ts` passes `hashJson(question)` over the object under test, which binds nothing. D2 conclusion unaffected. |
| **R4-P2-B** | `publicationProjectionBindingSchema.recomputedByVerifier: z.literal(true)` was commented "a bundle author cannot assert it" — backwards, since the schema describes the submitted bundle, so it *required* the author to assert it. Also contradicted Rule 1. | `schemas.md` section 4b — field removed; whether the verifier recomputed is gate output, never bundle input. |
| **R4-P2-C** | "the bundle cannot currently validate into an admissible state" — but `z.never().optional()` accepts omission, so a complete bundle parses cleanly; the refusal comes from the gate. | `schemas.md` section 9 closing; `threat-model.md` T5. |
| **R4-P2-D** | `source-evidence-reconciliation.md` claimed "This document is therefore generated, not written… No value is transcribed by hand." False — `reconcile.py` emits only the JSON; the markdown is hand-transcribed. | Reconciliation sections 1 and 8; README documents and audit-history tables; `threat-model.md` T7, which now carries this as an **open instance of threat T7 itself**. The transcription was independently verified correct across all 12 rows of both tables at `3b56e157`. |

Also addressed from the same review's non-blocking observations: a latent H-1-shaped hazard in refinement (d), where `sameNumbers` is order-sensitive while the attestation compares a set — both fields must be populated from the registry's `givens` array in declared order (`schemas.md` section 9); the `buildPublishedQuestion` discriminated result, which the verifier must fail closed on rather than dereference; ADR requirement 2 now names D2; the section 4 test cases are relabelled `C/R/O/I/E/H/N/A/S/G/X` to remove two numbering collisions; and the spec records that its component numbering differs from the ADR's.

No question content, answer key, difficulty value, hash or review record was altered by any of these corrections. Three facts surfaced during verification are recorded rather than repaired: the stale `targetPacket` filename in `review-summary.json` (section 2.2 of the reconciliation), the expected candidate-hash divergence on the two sidecar-bound items (section 2.3), and the weak prompt-to-solver binding on `nr-022` (`solver-coverage.md` section 3a.3).

## Verification

- `source-evidence-reconciliation.json` is generated mechanically from PR #73 at `dcb60a80` plus the Phase 1 preflight. It cross-checks source keys, review records, sidecar targets, preflight status and original-generation status, and reports inconsistencies rather than repairing them. It found none.
- Current code behaviour cited in `gate-and-test-changes.md` and `solver-coverage.md` was read from this branch, not assumed.
- Provider API outcomes are quoted from the execution records committed in PR #73.

## Constraints honoured

PR #73 is unmodified. All 12 questions, the shared reading passage, answer keys, difficulty values and hashes are preserved unchanged. `vr-001` and `nr-023` remain `medium`. No factory record is created; nothing is ingested, staged, published, deployed or approved. No PR is merged and this PR remains draft.

### Reconciliation audit history

**Correction (independent review P2-3).** This section previously stated that the reconciliation "was not regenerated" and that `source-evidence-reconciliation.md` and its JSON "are byte-identical to the reviewed versions". That was true when written, at `63ec92fe`, and **became false at `eb83708f`**, where both files were regenerated to address finding P2-2. The claim was not updated at the time. It is withdrawn and replaced below.

Two different things must be kept apart, and the withdrawn sentence ran them together:

| | Underlying source and review evidence | Generated reconciliation output |
|---|---|---|
| Files | PR #73 drafts, `external-review-chatgpt.json`, `external-review-maths-014.json` and its attestation, `review-summary.json`, `source-register.json`, the Phase 1 preflight | `source-evidence-reconciliation.json` (machine-generated). `source-evidence-reconciliation.md` is hand-written over it — see finding R4-P2-D |
| Status | **Unchanged.** Not modified, not regenerated, not re-derived, at any point in this programme. PR #73 remains at `dcb60a80`. | **Regenerated at `eb83708f`**, and again at the current HEAD if `reconcile.py` changes. |
| Why | They are the evidence. Changing them would destroy what is being reconciled. | `reconcile.py` was changed to split the two review events and add the preflight-vs-register cross-check. |

What is and is not verified about the regenerated output:

- **Verified.** Two consecutive runs of `reconcile.py` at a given commit produce byte-identical output, and re-running after commit leaves the working tree clean. This establishes *reproducibility at that commit*.
- **Verified.** The regenerated run reports the same substantive results as before: 12 of 12 source keys matching, 12 of 12 review answers agreeing, zero inconsistencies.
- **Not claimed.** That the regenerated files are byte-identical to the versions reviewed at `63ec92fe`. **They are not** — they carry new fields (`reviewEvents`, `packetFiles`, `crossSourceHashCheck`, per-item review bindings) that did not exist in the earlier output. Any reviewer comparing the two revisions should expect a substantial diff in the generated files and should read it as the P2-2 correction landing, not as evidence drift.

The honest summary: **the source evidence is unchanged; the generated reconciliation of it has been regenerated twice and is reproducible, but is not byte-identical to what the first review saw.**
