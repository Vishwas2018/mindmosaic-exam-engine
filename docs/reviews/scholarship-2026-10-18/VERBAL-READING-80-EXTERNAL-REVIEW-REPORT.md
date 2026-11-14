# Verbal Reasoning & Reading: External Review Evidence, Status & Dependencies Report

> **Notice:** AI-generated advisory analysis. It is **not qualified human review**, is not independent evidence for any gate, and conveys no authorisation to approve, publish or deploy.

---

## 1. Executive Summary: The 80 Judgement Items

The 160-question Year 6 Scholarship programme contains 80 judgement-based items:
- **Verbal Reasoning:** 45 questions (`scholarship-y6-vr-001` through `scholarship-y6-vr-045`)
- **Reading Comprehension:** 35 questions (`scholarship-y6-rc-001` through `scholarship-y6-rc-035`)

Under `docs/REVIEW_INDEPENDENCE_POLICY.md` (§2), judgement-based content (`semantic_objective`) whose correctness cannot be established by a deterministic derivation requires a **different-provider independent review**:
> "For AI-generated judgement content... the reviewer must come from a **different provider** than the generator. Two models from one provider share training lineage, alignment tuning, and failure modes... Deterministically-computable content never reaches this rule."

**Original generation is not established for any of the 80 items.** The import workflow *declared* the generator as Anthropic `claude-sonnet-5` (`CONTENT-REVIEW-FINDINGS.md`), but that is a later documentation statement, not an execution record. A Git author, importer, `Co-Authored-By` trailer, historical declaration or reviewing model is not proof of the original generator. Under ADR-017 and `docs/REVIEW_INDEPENDENCE_POLICY.md`, independence cannot be evaluated for unknown-origin content: `independentReviewStatus: "not_established_unknown_origin"` is permanent, and null or `other/unknown` identities cannot satisfy the different-provider rule.

Consequently:

- A review by a Claude model remains advisory, and so does a review by any other provider.
- A new ChatGPT, Gemini or Qwen review does **not** automatically satisfy production-grade independence. It may be collected as **advisory evidence only**, subject to a separate policy decision on how such evidence is treated.
- No generator identity is to be assumed or entered in order to make a different-provider review qualify.

---

## 2. Inventory of Historical External Review Evidence & Current Standing

| Review Event | Reviewer / Model | Target Scope | Key Agreement | Fresh Session Claim | Binding Status Against Current Commits | Why It Does Not Qualify as Gate Evidence |
|---|---|---|---|---|---|---|
| **16–17 Oct First Pass & Sessions A–D** | Claude Opus 5.5 (`anthropic/claude-opus-5-5`) | VR 45, RC 35 | 80/80 match | Yes (subagent) | **Stale for 30 items** revised on 18–19 Oct | Same provider family as the *declared* generator, and the real generator is unverified, so independence is not evaluable. Advisory only. |
| **19 Oct External Advisory Review** | OpenAI `gpt-6.1-sol-wm` | Packet `79076070...` (VR 45, RC 35) | 80/80 match (66 PASS, 14 REVISE) | **`freshSession: false`** | **Stale for 32 items** remediated in commit `6b7d3339` | Failed the fresh-session requirement; no authenticated server envelope or request ID. The item-level response file is **not committed**, so per-item findings are `not_established` in the inventory. Advisory only. |
| **Local Probe** | `gemma:7b` (local Ollama) | 99 solver items | 28/99 agreement (failed) | N/A | Superseded | Error rate too high; not a qualified reviewer. |
| **Factory Pipeline Records** | None | All 80 items | None | None | Current | All 80 items sit quarantined in `content/question-factory/review-queue/` with empty review chains. |

---

## 3. Reading Comprehension Stimulus Dependencies & Shared Passages

Reading Comprehension consists of **four shared passages** across 35 dependent questions. Under repository standing rules, **no shared passage may be altered without updating and re-pinning every dependent question and its hash binding**.

The revision-history column summarises commit messages. It is a record of what the author changed and claimed, not independent verification of any cited source.

| Passage Title | Word Count | Theme / Style | Dependent Questions | Revision History & Verification |
|---|---|---|---|---|
| **The Mangrove Fringe** | 398 words | Environmental / Marine Ecology (Avicennia marina adaptations) | `rc-001` to `rc-009` (9 items) | Remediated in `71aa2cce` (pneumatophore lenticels corrected; factual accuracy re-verified against Duke 2006). Option lengths balanced in `7ba3dd89`. |
| **Architects of the Spinifex** | 412 words | Australian Desert Botany & Nanotechnology (*Triodia pungens*) | `rc-010` to `rc-018` (9 items) | Remediated in `6b7d3339`. Unsupported resin desiccation/herbivory claims removed; grounded strictly in Lazarides (1997), Gamage et al. (2012), and Barrett et al. (2017). Option balance adjusted in `7ba3dd89` and `9fc8285d`. |
| **In Defence of the Dark** | 425 words | Ecological Impact of Light Pollution (Phillip Island shearwaters, nocturnal wildlife) | `rc-019` to `rc-026` (8 items) | Remediated in `6b7d3339` and `403e7c58`. Grounded in Rodriguez et al. (2014); unverified star-count ("fewer than 30 stars") and absolute crime claims removed. Distractor overlaps eliminated. |
| **Charting the Roaring Forties** | 441 words | Maritime History & Navigation (Harrison H4 marine chronometer vs lunar distance) | `rc-027` to `rc-035` (9 items) | Remediated in `6b7d3339` and `e0f6a668`. Overstated salt-spray claims qualified against US Naval Institute historical documentation; option lengths balanced. |

### Integrity Constraint: Shared Stimulus Hash Invariant
In `src/tests/unit/scholarship-release-package.test.ts` and `scholarship-draft-validator.test.ts`, tests enforce that every question belonging to a shared passage carries an identical stimulus object. If a passage is edited, all 8 or 9 dependent questions receive a new `rawQuestionHash` (D1), `factoryCandidateHash` (D2), and `publicationContentHash` (D3).

---

## 4. What is and is not established about the 80 items

An earlier version of this section asserted, item group by item group, that answers were unique, distractors defensible and evidence unambiguous. Those statements were not backed by any committed review record and have been removed. What the evidence supports is below.

| Question | Status | Evidence |
|---|---|---|
| Machine-verified closed-language result | `verified` for **19** of 45 Verbal Reasoning items (vr-027 to vr-045: 7 letter series, 6 coded words, 6 syllogisms, including the modus tollens item vr-032); `not_established` for the other 26 VR items and **all 35** Reading items | `scholarship-160-inventory.json` |
| Stem-to-solver semantic verification | `not_established` for all 80 | ADR-017 requirement 2, never performed |
| Independently checked answer uniqueness | `not_established` for all 80 | A solver's uniqueness is scoped to its own model, and Reading has no solver |
| Distractor quality | `not_established` for all 80 | No review record |
| Age and curriculum appropriateness | `not_established` for all 80 | No reviewer engaged |
| Qualified human review | `not_established` for all 80 | None recorded |

Historical, model-generated advisory records exist (the 16 Oct blind-review files and the 19 Oct review narrative). Their agreement with the stored keys is advisory only, is not bound to the current item bytes, and is stale for the items listed in `revised-in-this-release.json`.

`vr-032` is machine-verified by the closed-language syllogism solver but is **deferred** under ADR-017 pending a separate justification of a non-numeric deterministic attestation category. Machine verification does not change that.

Reading comprehension items depend on four shared passages; a unit test enforces an identical stimulus object across each passage's dependent questions, so editing a passage requires re-pinning every dependent item.

---
## 5. Difficulty Estimator Discrepancies (43 Conflicts)

The text-length and reading-load difficulty estimator creates **43 conflicts** across the 80 judgement items:
- **Verbal Reasoning:** **27 of 45 items** blocked by estimator deviation (`blocked_deviation`).
- **Reading Comprehension:** **16 of 35 items** blocked by estimator deviation (`blocked_deviation`).

### Analysis of the Defect in the Estimator
The estimator relies on word count, syllable complexity, and reading load proxies.
- In Verbal Reasoning, high-order reasoning puzzles (e.g., concise 15-word syllogisms or tight analogy pairs) are misclassified as `easy` due to brevity, while declared as `medium` or `challenging`.
- In Reading Comprehension, short-stem items asking deep authorial craft questions are misclassified as `easy`, while longer stems with simple factual retrieval are misclassified as `challenging`.

Under current publication gate settings, these 43 items would be rejected at the difficulty gate even after a qualifying external review.
**Resolution route:** the difficulty gate is resolved by the owner deciding each label, or by revising the item. A reviewer's difficulty estimate is advisory input to that decision, not an independent rating that clears the gate.

---

## 6. Obtaining advisory external review evidence

This protocol collects **advisory evidence**. Because the original generator is unverified, its outcome cannot establish production-grade independent review, and it does not unlock admission, ingestion or publication for any item. Whether and how advisory evidence of this kind counts is a separate policy question.

### Phase A: packet preparation (existing artefacts)
- Answer-withheld packet: `docs/reviews/scholarship-2026-10-18/external-review/packet.txt` with prompt `prompt-with-packet.txt`.
- Packet SHA-256 (recomputed on 2026-10-25 from the committed file): `5a0c90b426af617468a3958b64aeca7e2c653f526951db76072209f2faf12198`.
- Response schema: `docs/reviews/scholarship-2026-10-18/external-review/response-schema.json`.

### Phase B: attended review session (owner action)
1. Open a new, empty chat session with the chosen external provider.
2. Ensure no prior context, system prompts or answer keys are present.
3. Paste the contents of `prompt-with-packet.txt` and request JSON matching the schema, with `"freshSession": true`.
4. Save the returned JSON outside the repository.

### Phase C: what happens to the result
- The read-only verifier (`scripts/verify-scholarship-external-review.mts`) can check the packet hash, item coverage and answer agreement.
- The result is **advisory evidence**. It is not ingested into any factory review chain: the review-ingestion and revision routes refuse legacy-origin laundering (`docs/REVIEW_INDEPENDENCE_POLICY.md`, "Legacy imports with unverified original generation"), and no ingestion or pipeline command is offered here as a next step.
- Provider identity and session claims are self-reported by the reviewer unless an authenticated envelope exists; none does for the 19 Oct review.