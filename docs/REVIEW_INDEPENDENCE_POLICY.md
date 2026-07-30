# Review independence policy

**Status:** active · **Effective date:** 2026-07-30 (P0-C)
**Supersedes:** the single identity-triple rule as the *sole* independence test for judgement-based content.
**Origin:** `docs/reports/publication-288-posthoc-audit.md` §D3.

## Two rules, by content classification

Independence is always decided on the **normalised identity** (`config/identity-normalisation.ts`), never on a raw declared display name.

### 1. The identity-triple rule — `identitiesAreIndependent`

Two identities are independent when they differ in provider, model id, or model family. `interactionMode` is deliberately ignored.

Applies to: everything except semantic review of judgement-based content. Unchanged by this policy.

### 2. The different-provider rule — `identitiesAreIndependentForJudgementReview`

For **judgement-based** content — `semantic_objective` and `manual_review_writing`, the two classifications whose correctness no deterministic method can establish — independence additionally requires:

| Generator | Requirement on the reviewer |
|---|---|
| AI (`provider !== "human"`) | **A different provider.** A different model from the same provider is *not* independent. |
| Human (`provider === "human"`) | The identity-triple rule, unchanged. |

Enforced in `isProductionGradeIndependentReview` (`provenance/evidence.ts`), which is the single point every semantic-review adjudication passes through — `gate-chain/verify-gate-chain.ts` and `review/orchestrate-semantic-review.ts`.

## Why

For judgement-based content the reviewer's judgement *is* the correctness evidence; there is no deterministic derivation behind it. Two models from one provider share training lineage, alignment tuning, and failure modes, so one grading the other is not the independent check the governance model assumes. The triple rule accepted `anthropic/claude-sonnet-5` reviewed by `anthropic/claude-opus-4-8`; the 2026-07-30 audit found **30 published questions in exactly that shape**, and could not determine the reviewer at all for the other 226 because publication had consumed the review chains.

Human-generated content keeps the triple rule: a human author and a model reviewer already share no lineage, and requiring a different *provider* would forbid the ordinary, sound `human -> model` review while adding nothing.

Deterministically-computable content never reaches this rule — its correctness gate proves it outright and no semantic review is required.

## Consequences

- `claude-sonnet-5 -> claude-opus-4-8` on judgement content is a **FAIL** from 2026-07-30. Pinned in `src/tests/unit/question-factory/gate-chain.test.ts`.
- AI-generated judgement content needs an external, different-provider round-trip (e.g. ChatGPT or Qwen for Claude-generated content). Claude Code must never self-supply these reviews.
- The 132 published reading/language questions identified by the audit are under retroactive independent review against their published content hashes. Any that fails is removed from the published bank by forward-fix commit.

## Not retroactively enforced on already-published content

This policy gates *future* staging and publication. It does not by itself unpublish content that predates it — the 2026-07-30 owner verdict kept all 288 published while retroactive review runs. Removal decisions come from that review, not from this policy applied backwards.
