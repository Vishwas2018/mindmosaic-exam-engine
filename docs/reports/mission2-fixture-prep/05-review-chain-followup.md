# Review-Chain P2 Boundary — Mandatory Pre-Mission-2-Production Follow-Up

Status: **finding recorded, not fixed on this branch.** This branch is fixture preparation only;
it does not touch `src/features/question-factory/provenance/` (lifecycle, provenance, and
review-chain code are explicitly out of scope per this task's instructions).

## The finding

The Codex re-audit of the Mission 1 repair found:

> `isProductionGradeIndependentReview()` does not currently require a verified review hash
> chain.

This is accurate. `isProductionGradeIndependentReview()`
(`src/features/question-factory/provenance/evidence.ts`) checks reviewer independence, result,
confidence threshold, evidence-reference presence, ambiguity status, and evidence-binding
freshness (`isReviewStillValid`) against a single `ReviewRecord` passed to it directly. It does
**not** call `verifyReviewChain()` (`src/features/question-factory/provenance/review-chain.ts`,
added by the Mission 1 repair) and has no way to know whether the record it was handed is part of
a valid, unbroken, tamper-evident chain, or a hand-constructed `ReviewRecord` object with an
arbitrary `previousReviewHash`/`reviewHash` pair that was never actually chained through
`appendReviewRecord()`.

## Why this matters for Mission 2 production code

Mission 2 (validation, correctness, originality, difficulty gates) and Mission 3 (generation,
review, staging, publication) will both eventually call something in the shape of
`isProductionGradeIndependentReview()` to decide whether a semantic-objective or manual-review-
writing candidate may proceed past semantic review. **As written today, that helper can be
satisfied by a `ReviewRecord` that was never actually appended to a verified chain** — nothing
stops a caller (or a bug) from constructing a `ReviewRecord` object literal with plausible-looking
`previousReviewHash`/`reviewHash` strings and passing it straight to
`isProductionGradeIndependentReview()`, which would accept it as long as the other five checks
pass. The tamper-evidence the review chain exists to provide is not actually being consulted at
the one call site that matters most.

## Mandatory requirement for Mission 2 production code

```text
Semantic approval helpers must consume only chain-verified review records.
Directly constructed review records with arbitrary review hashes must never
satisfy production-grade evidence checks.
```

Concretely, before any Mission 2/3 gate treats `isProductionGradeIndependentReview()` (or any
successor with the same job) as sufficient evidence to advance a candidate:

1. The full candidate's `reviewRecords[]` chain must first pass `verifyReviewChain()`.
2. Only a record that is a member of a chain that passed that check — not an arbitrary
   `ReviewRecord` value — may be handed to `isProductionGradeIndependentReview()`.
3. Ideally, `isProductionGradeIndependentReview()` itself (or a wrapping function used at every
   real call site) takes the *whole chain* plus an index, not a bare record, so it is structurally
   impossible to call it correctly with an unverified record.

## Boundary for this branch

No fixture, document, or test on `claude/mission2-fixture-prep` assumes
`isProductionGradeIndependentReview()` alone proves review-chain integrity. Where this branch's
correctness-verifier matrix and legacy-ingestion requirements discuss semantic review (see
`correctness-verifier-matrix.json`'s `semantic_or_non_computable` category and
`03-legacy-ingestion-requirements.md` §7), they treat "an independent-reviewer evidence record
exists" and "that record is chain-verified" as two separate, both-required conditions — never
one standing in for the other.

This finding is recorded here as the mandatory pre-production follow-up; fixing it is explicitly
out of scope for this fixture-preparation branch and must happen on the integration branch before
any Mission 2 gate ships that relies on `isProductionGradeIndependentReview()`.
