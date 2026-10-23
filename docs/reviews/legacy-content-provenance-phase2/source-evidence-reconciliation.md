# Corrected 12-item source and evidence reconciliation

**Status:** evidence record for the PROPOSED Phase 2a policy. No candidate is admitted, staged, published or approved.
**Source of truth:** PR #73 at `dcb60a80f3f6eabdb522b20202929d2e3f328a94` (read-only; unmodified by this PR).
**Machine output:** `source-evidence-reconciliation.json`, generated mechanically from committed bytes.
**Phase 1 preflight:** `docs/reviews/legacy-content-provenance-phase1/preflight-12.json`, manifest SHA-256 `13bdb8a4756cc123f18017555fef266c62ad523d3ca841cca655f5989e161dd6`.

---

## 1. Why this document replaces the first draft

The first Phase 2 candidate-impact analysis was withdrawn. It misstated the answer key for nine of the twelve candidates and misdescribed the content of two: it quoted `nr-023` with the equations `3N+2P=19, 2N+4P=26` yielding a $3 notebook, where the committed item reads `2N+4P=18` with the key `$5`; and it gave the `vr-016` answer as ROBUST, which is not among the options, where the committed key is `d`, ENERGETIC.

The underlying content was never wrong. The committed external review agrees with the committed answer key on all twelve candidates. The defect was confined to the withdrawn analysis, which restated evidence rather than deriving it.

This document is therefore generated, not written. Every value below is read from committed bytes by `reconcile.py`, which re-reads the four draft files, the review records, the Phase 1 preflight and the source register, and cross-checks them against the owner-supplied verified key mapping. No value is transcribed by hand.

## 2. Reconciliation result

| Check | Result |
|---|---|
| Candidates reconciled | 12 of 12 |
| Source key matches owner-supplied verified mapping | 12 of 12 |
| Committed review answer matches source key | 12 of 12 |
| Solver sidecar target option matches source key (where present) | 12 of 12 |
| `originalGeneration.status` is `unverified` | 12 of 12 |
| Phase 1 preflight status | PASS for 12 of 12 |
| **Inconsistencies reported** | **none** |

The reconciliation script reports inconsistencies rather than repairing them. It found none, so no source question was altered and none needed to be.

## 3. Per-candidate reconciliation

| ID | Skill | Key | Answer text | Difficulty | Review key | Agrees | Correctness route | Class |
|---|---|---|---|---|---|---|---|---|
| `vr-001` | `vr-analogies` | **e** | DISTANCE | medium | e | yes | none (deferred) | B/C deferred |
| `vr-016` | `vr-synonyms-antonyms` | **d** | ENERGETIC | easy | d | yes | none (deferred) | B/C deferred |
| `vr-032` | `vr-sentence-logic` | **c** | The garden sprinkler did not run this morning. | medium | c | yes | solver sidecar only | A |
| `nr-001` | `nr-number-series` | **e** | 35 | easy | e | yes | solver sidecar only | A |
| `nr-022` | `nr-arithmetical-reasoning` | **e** | 8 | medium | e | yes | first-party recompute | A |
| `nr-023` | `nr-arithmetical-reasoning` | **b** | $5 | medium | b | yes | first-party recompute | A |
| `rc-001` | `rc-authorial-craft` | **a** | To set a quiet, patient mood as the two cha... | medium | a | yes | none (deferred) | B/C deferred |
| `rc-002` | `rc-figurative-language` | **c** | formed a curved, sheltering frame above the... | medium | c | yes | none (deferred) | B/C deferred |
| `rc-003` | `rc-character-inference` | **e** | He knows the osprey's routine and how it fo... | medium | e | yes | none (deferred) | B/C deferred |
| `maths-004` | `maths-directed-numbers` | **b** | 2243 m | easy | b | yes | first-party recompute | A |
| `maths-007` | `maths-percentages` | **a** | $108 | medium | a | yes | first-party recompute | A |
| `maths-014` | `maths-ratios-rates` | **c** | 120 | medium | c | yes | first-party recompute | A |

| ID | rawQuestionHash | factoryCandidateHash | publicationContentHash | Transform | Preflight |
|---|---|---|---|---|---|
| `vr-001` | `a66d7ab60d61007d...` | `a66d7ab60d61007d...` | `b8623bd98bd4a104...` | none | PASS |
| `vr-016` | `3bc02a9b45da0f72...` | `3bc02a9b45da0f72...` | `c8d34424ad5a878a...` | none | PASS |
| `vr-032` | `743f6164cdd5d000...` | `583b895df7740bb2...` | `758d25fa7ee8c039...` | solver_sidecar | PASS |
| `nr-001` | `e18ddd9625b44b4e...` | `926a14bedf8c0e0a...` | `8bf3c2012084099d...` | solver_sidecar | PASS |
| `nr-022` | `8758ac61587d966b...` | `8758ac61587d966b...` | `a0c486d79ec70260...` | none | PASS |
| `nr-023` | `52d196a6d5d1829e...` | `52d196a6d5d1829e...` | `7b80d6a14c2af6e9...` | none | PASS |
| `rc-001` | `8d09cf53874fc518...` | `8d09cf53874fc518...` | `013845c94fc3b5a3...` | none | PASS |
| `rc-002` | `88ae673686bc79d6...` | `88ae673686bc79d6...` | `855026023be21529...` | none | PASS |
| `rc-003` | `39ae557efa78dfdd...` | `39ae557efa78dfdd...` | `d377c208e0c25574...` | none | PASS |
| `maths-004` | `8aeef3fbabe39264...` | `8aeef3fbabe39264...` | `2038c2ac1123bb31...` | none | PASS |
| `maths-007` | `93bfea7f835eaf40...` | `93bfea7f835eaf40...` | `938bf96f5c97c805...` | none | PASS |
| `maths-014` | `71d11fa2c35f6551...` | `71d11fa2c35f6551...` | `aeb211f7441a014a...` | none | PASS |

`factoryCandidateHash` differs from `rawQuestionHash` for exactly the two candidates carrying a solver-sidecar transformation (`vr-032`, `nr-001`), as Phase 1 recorded. Publication content is preserved across that enrichment.

## 4. Review evidence: classification and limits

The only completed external review of the sample is the manual ChatGPT pass. Its own summary record classifies it honestly, and this programme adopts that classification without upgrading it:

| Field | Recorded value |
|---|---|
| `evidenceType` | `manual_user_attested` |
| `provider` / `model` | `openai` / `chatgpt-unversioned` |
| `transport` | Manual out-of-band submission; missing authenticated server API envelope, HTTP headers, request ID and cryptographic transport bindings |
| `rawEvidenceSha256` | `331e7f8a54a9b9bf8ecf44e6cf9564ce143bcf8f537bdd455776dcf3d8701c15` |
| `targetPacketSha256` | `c82c57d77f099f326b187b37f1943a46b1b87dc5f5fe3addb3af9dbba18cd2bf` |
| Agreement with declared keys | 12 of 12 |

This is **advisory corroboration**. It is not an independent review under `docs/REVIEW_INDEPENDENCE_POLICY.md`, because the original generator identity is unknown and so independence cannot be evaluated at all.

`maths-014` carries a second, later review. Its first verdict was `REVISE`, on a genuine underspecification: the 5:3 ratio fixes the combined sprinter and distance-runner count, not necessarily total club membership, leaving options c, d and e defensible. The stem was closed in commit `45b6cdab` and the re-review returned `PASS` on key `c`. Both records are retained; the superseded verdict is not hidden.

## 5. Authenticated provider reviews: none exist

Every attempt to obtain an API-bound external review failed before producing a review. This is recorded because it determines what the policy can require.

| Attempt | Provider / model | Result |
|---|---|---|
| 1 | Google `gemini-2.5-pro` | `404` — model no longer available to new users |
| 2 | Google `gemini-3.1-pro-preview` | `402` `RESOURCE_EXHAUSTED` — prepayment credits depleted |
| 3 | OpenAI `gpt-5.4` | `429` `insufficient_quota` — credit balance exhausted |

The request packets themselves are sound: stateless, answer-withheld, hash-pinned (`packetSha256` `c82c57…`), with execution envelopes recorded. What is missing is funded API access, which is a procurement matter, not a policy one.

Accordingly, **no part of the Class A route depends on obtaining a provider API review.** The deferred Class B and C routes do depend on it, which is one reason they are deferred rather than scheduled.

## 6. Difficulty observations: recorded, not applied

The reviewer recorded a different difficulty from the author on two candidates. Both committed values are unchanged and remain `medium`.

| Candidate | Committed difficulty | Reviewer observation | Action |
|---|---|---|---|
| `scholarship-y6-vr-001` | `medium` (40 s) | `easy` | Recorded only. No change. |
| `scholarship-y6-nr-023` | `medium` (45 s) | `challenging` | Recorded only. No change. |

Three reasons these are not acted on here. The observation comes from the same manual review the policy elsewhere treats as advisory only. Editing difficulty metadata changes `factoryCandidateHash` and `publicationContentHash`, voiding every binding in section 3 and the pinned release identities. And the Phase 1 record is immutable: a change would be a new revision with new evidence, not an edit.

Any change requires explicit, separate owner instruction naming the candidate and the target value.

## 7. Original generation: unverified for all twelve

`docs/reviews/scholarship-sample-2026-10-22/provenance/source-register.json` classifies all twelve as `git_traceable_legacy_draft_original_generation_unverified`, with `provider`, `model`, `prompt`, `promptHash`, `generatedAt` and `candidateGenerationEvent` all null.

This is unchanged by Phase 2 and is not changed by admission. A candidate admitted under `deterministic_legacy_admission` still carries `originalGeneration.status: "unverified"` and `independentReviewStatus: "not_established_unknown_origin"`.

## 8. Reproducing this document

```sh
# from a worktree on this branch, with PR #73 fetched
python reconcile.py > docs/reviews/legacy-content-provenance-phase2/source-evidence-reconciliation.json
```

The script reads only `git show dcb60a80:<path>` and the committed Phase 1 preflight. It writes no factory record, contacts no network service and modifies no source question. Its `inconsistencies` array is the authoritative check: a non-empty array must be reported to the owner, never silently corrected.
