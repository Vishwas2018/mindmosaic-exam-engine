# Review-Chain P2 Boundary — Mandatory Pre-Mission-2-Production Follow-Up

Status: **fixed on `integration/governed-question-factory`, frozen for independent Codex
re-review.** The finding below (recorded on the fixture-preparation branch, where fixing it was
out of scope) has since been resolved by an isolated change to
`src/features/question-factory/provenance/evidence.ts` — see "Resolution" below. This document
keeps the original finding intact as the historical record and adds the resolution underneath it.
No Mission 2 structural-validation, correctness, originality, or difficulty implementation has
started; this is a provenance/evidence-layer fix only.

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

## Resolution (`integration/governed-question-factory`)

**Defect resolved:** `isProductionGradeIndependentReview()` no longer accepts a bare
`ReviewRecord`. It now takes a `VerifiedReviewChainEvidence` — the candidate's full,
append-order review chain, which record in that chain is being claimed as evidence, and the
hash the caller independently expects the chain to currently terminate at. Every check the
original finding asked for is now enforced, in this order:

1. `chain` is non-empty and passes `verifyReviewChain()` in full — any edited, deleted,
   reordered, or otherwise forged record anywhere in the chain fails here, before anything else
   is inspected.
2. `chain`'s last record's `reviewHash` must equal the caller-supplied
   `expectedTerminalReviewHash` — rejects a truncated, extended, or otherwise substituted chain
   that would still verify internally on its own.
3. `reviewHash` must identify a record that is actually an element of `chain` (never a hash
   borrowed from an unrelated chain), and that record's `candidateId` must match the current
   candidate's id — a fully valid, fully verified record that genuinely belongs to a *different*
   candidate's chain is rejected here, even though every hash check above it passed.
4. Reviewer independence, result, confidence threshold, evidence-reference presence, and
   ambiguity status — unchanged from before.
5. Evidence-binding freshness (`isReviewStillValid`) against the candidate's current content
   hash, blueprint hash, and revision — unchanged from before.

**Final API contract**

```ts
interface CandidateEvidenceSnapshot {
  readonly candidateId: string;   // now required — was previously absent from this check
  readonly contentHash: string;
  readonly blueprintHash: string;
  readonly revision: number;
}

interface VerifiedReviewChainEvidence {
  readonly chain: readonly ReviewRecord[];       // full reviewRecords[], append order, from trusted storage
  readonly reviewHash: string;                    // which record in chain is being claimed
  readonly expectedTerminalReviewHash: string;    // hash the caller expects chain to currently end at
}

function isProductionGradeIndependentReview(
  generatorIdentity: NormalisedIdentity,
  evidence: VerifiedReviewChainEvidence,
  current: CandidateEvidenceSnapshot,
  minimumConfidence: number,
): boolean;
```

There is now no way to construct a call that hands this function an isolated, directly
constructed `ReviewRecord` — `chain` and `reviewHash`/`expectedTerminalReviewHash` are all
required, and the claimed record must be a genuine element of a chain that independently passes
`verifyReviewChain()`. The fix reuses `verifyReviewChain()`, `REVIEW_CHAIN_GENESIS_HASH` (via
`verifyReviewChain`'s own genesis check), and `appendReviewRecord()` (used throughout the new
tests to build genuine chains) — no chain-validation logic was duplicated.

**Tests added** (`src/tests/unit/question-factory/provenance.test.ts`, new describe block
`"isProductionGradeIndependentReview: verified review-chain requirement"`, 19 tests): valid
single- and multi-record verified chains accepted; reviewer independence, confidence threshold,
evidence-reference, ambiguity, and result === `"passed"` rules all re-verified under the new
signature; stale candidate content hash, stale revision, and stale blueprint hash each rejected
individually; a directly constructed standalone record with fabricated hashes rejected (the
original defect, reproduced and closed); an arbitrary `previousReviewHash` rejected even when
`reviewHash` is self-consistent; an arbitrary `expectedTerminalReviewHash` rejected; a stale-but-
real (superseded) terminal hash rejected; a review record absent from the supplied chain
rejected; edited, deleted, and reordered chains each rejected; and a fully valid, fully verified
record genuinely belonging to a different candidate's chain rejected. All existing
`verifyReviewChain()` tamper-detection tests (`review-chain.test.ts`) and all other lifecycle,
provenance, and repository tests continue to pass unchanged.

**Remaining limitations for Codex review:**

- This fix bounds what a *pure function* can verify. `expectedTerminalReviewHash` protects
  against a caller receiving or holding a stale/wrong chain reference; it cannot, by itself,
  stop a caller that fabricates *both* `chain` and `expectedTerminalReviewHash` together from
  nothing. That residual trust boundary is a caller-discipline requirement, not a cryptographic
  one: real call sites must source `chain` and `expectedTerminalReviewHash` from the same trusted
  read of persisted candidate provenance (e.g. `CandidateProvenance.reviewRecords`), never
  construct either independently. No Mission 2/3 gate exists yet to be that real call site — this
  remains a pure provenance-layer primitive until one is built.
- No production call site was added in this change (per scope) — `isProductionGradeIndependentReview()`
  is still unused outside its own test file. Wiring a real Mission 2/3 gate to it, and to the
  trusted-storage read this fix now requires, remains future work.
