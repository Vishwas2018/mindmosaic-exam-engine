# Phase 2a — deterministic legacy admission policy proposal

**Status:** PROPOSED, scope narrowed on owner direction of 2026-10-23. Documentation only. No code, schema, gate or question content is changed by this PR. The direction narrows what is proposed and sets what an independent reviewer should review; it is not adoption, and ADR-017 remains `PROPOSED`.

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
| `../../adr/017-legacy-content-unknown-origin-eligibility.md` | The governance decision. Status `PROPOSED`. |
| `../../spec/legacy-content-unknown-origin-policy.md` | The policy specification: scope, evidence, gates, invariants. |
| `source-evidence-reconciliation.md` | Corrected 12-item reconciliation, generated from committed bytes. |
| `source-evidence-reconciliation.json` | Machine output backing the above. |
| `solver-coverage.md` | Exact first-party recompute coverage and the missing bindings. |
| `schemas.md` | Proposed evidence shapes. Failure is representable; two controls deliberately unspecified. |
| `threat-model.md` | Threats, with every countermeasure marked built, proposed or not designed. |
| `gate-and-test-changes.md` | Engineering roadmap and adversarial test cases for a future PR. |
| `deferred-class-b-c-register.md` | What is held, what is missing, and the reopening conditions. Covers `vr-032` (section 1.1) as well as Class B and C. |
| `pr-73-migration-plan.md` | Sequence, blockers, and why a shortened sample is not authorised. |
| `decisions-for-owner.md` | Live decisions, blocked decisions, and what adoption does not authorise. |

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

No question content, answer key, difficulty value, hash or review record was altered by any of these corrections. Three facts surfaced during verification are recorded rather than repaired: the stale `targetPacket` filename in `review-summary.json` (section 2.2 of the reconciliation), the expected candidate-hash divergence on the two sidecar-bound items (section 2.3), and the weak prompt-to-solver binding on `nr-022` (`solver-coverage.md` section 3a.3).

## Verification

- `source-evidence-reconciliation.json` is generated mechanically from PR #73 at `dcb60a80` plus the Phase 1 preflight. It cross-checks source keys, review records, sidecar targets, preflight status and original-generation status, and reports inconsistencies rather than repairing them. It found none.
- Current code behaviour cited in `gate-and-test-changes.md` and `solver-coverage.md` was read from this branch, not assumed.
- Provider API outcomes are quoted from the execution records committed in PR #73.

## Constraints honoured

PR #73 is unmodified. All 12 questions, the shared reading passage, answer keys, difficulty values and hashes are preserved unchanged. `vr-001` and `nr-023` remain `medium`. The reconciled 12-question evidence is preserved and was not regenerated: no source evidence changed, so `source-evidence-reconciliation.md` and its JSON are byte-identical to the reviewed versions. No factory record is created; nothing is ingested, staged, published, deployed or approved. No PR is merged and this PR remains draft.
