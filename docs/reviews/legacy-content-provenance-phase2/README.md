# Phase 2a — deterministic legacy admission policy proposal

**Status:** PROPOSED. Documentation only. No code, schema, gate or question content is changed by this PR.

This directory holds the revised Phase 2 governance proposal for MindMosaic legacy content whose original generation is unverified. It replaces a first draft that was withdrawn (see below).

## What is proposed

One narrow admission route, `deterministic_legacy_admission`, for legacy candidates whose correct answer can be recomputed by a first-party algorithm from the stated prompt. It establishes **recomputed correctness and nothing else**. Authorship stays unverified, review independence stays unestablished, and neither is inferred from the other.

Everything else — judgement-based verbal reasoning and the reading-comprehension passage and items — is **DEFERRED** at the Phase 1 hold, with existing reviews preserved as advisory evidence. Nothing is retired, rewritten or altered.

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
| `deferred-class-b-c-register.md` | What is held, what is missing, and the reopening conditions. |
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

## Verification

- `source-evidence-reconciliation.json` is generated mechanically from PR #73 at `dcb60a80` plus the Phase 1 preflight. It cross-checks source keys, review records, sidecar targets, preflight status and original-generation status, and reports inconsistencies rather than repairing them. It found none.
- Current code behaviour cited in `gate-and-test-changes.md` and `solver-coverage.md` was read from this branch, not assumed.
- Provider API outcomes are quoted from the execution records committed in PR #73.

## Constraints honoured

PR #73 is unmodified. No question content, answer key, explanation, passage, difficulty value or hash is changed. `vr-001` and `nr-023` remain `medium`. No factory record is created; nothing is ingested, staged, published, deployed or approved. No PR is merged and this PR remains draft.
