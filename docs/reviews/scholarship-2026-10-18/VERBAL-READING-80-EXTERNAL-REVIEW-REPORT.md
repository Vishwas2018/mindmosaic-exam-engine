# Verbal Reasoning & Reading: External Review Evidence, Status & Dependencies Report

> **Notice:** This document contains independent AI-generated advisory analysis by Antigravity (Google DeepMind). It is **not qualified human approval** and conveys no authorization to publish or deploy.

---

## 1. Executive Summary: The 80 Judgement Items

The 160-question Year 6 Scholarship programme contains 80 judgement-based items:
- **Verbal Reasoning:** 45 questions (`scholarship-y6-vr-001` through `scholarship-y6-vr-045`)
- **Reading Comprehension:** 35 questions (`scholarship-y6-rc-001` through `scholarship-y6-rc-035`)

Under `docs/REVIEW_INDEPENDENCE_POLICY.md` (§2), judgement-based content (`semantic_objective`) whose correctness cannot be established by a deterministic derivation requires a **different-provider independent review**:
> "For AI-generated judgement content... the reviewer must come from a **different provider** than the generator. Two models from one provider share training lineage, alignment tuning, and failure modes... Deterministically-computable content never reaches this rule."

Because all 160 items were generated in the Anthropic Claude family (`claude-sonnet-5`), no Anthropic model, local subagent, or internal Claude evaluation can supply qualifying independent review evidence.

---

## 2. Inventory of Historical External Review Evidence & Current Standing

| Review Event | Reviewer / Model | Target Scope | Key Agreement | Fresh Session Claim | Binding Status Against Current Commits | Why It Does Not Qualify as Gate Evidence |
|---|---|---|---|---|---|---|
| **16–17 Oct First Pass & Sessions A–D** | Claude Opus 5.5 (`anthropic/claude-opus-5-5`) | VR 45, RC 35 | 80/80 match | Yes (subagent) | **Stale for 30 items** revised on 18–19 Oct | **Same provider.** Anthropic model reviewing Anthropic generator violates `REVIEW_INDEPENDENCE_POLICY.md` §2. Advisory only. |
| **19 Oct External Advisory Review** | OpenAI `gpt-6.1-sol-wm` | Packet `79076070...` (VR 45, RC 35) | 80/80 match (66 PASS, 14 REVISE) | **`freshSession: false`** | **Stale for 32 items** remediated in commit `6b7d3339` | Explicitly failed the mandatory fresh-session requirement; no authenticated server envelope/request ID; advisory only. |
| **Local Probe** | `gemma:7b` (local Ollama) | 99 solver items | 28/99 agreement (failed) | N/A | Superseded | Error rate too high; not a qualified reviewer. |
| **Factory Pipeline Records** | None | All 80 items | None | None | Current | All 80 items sit quarantined in `content/question-factory/review-queue/` with empty review chains. |

---

## 3. Reading Comprehension Stimulus Dependencies & Shared Passages

Reading Comprehension consists of **four shared passages** across 35 dependent questions. Under repository standing rules, **no shared passage may be altered without updating and re-pinning every dependent question and its hash binding**.

| Passage Title | Word Count | Theme / Style | Dependent Questions | Revision History & Verification |
|---|---|---|---|---|
| **The Mangrove Fringe** | 398 words | Environmental / Marine Ecology (Avicennia marina adaptations) | `rc-001` to `rc-009` (9 items) | Remediated in `71aa2cce` (pneumatophore lenticels corrected; factual accuracy re-verified against Duke 2006). Option lengths balanced in `7ba3dd89`. |
| **Architects of the Spinifex** | 412 words | Australian Desert Botany & Nanotechnology (*Triodia pungens*) | `rc-010` to `rc-018` (9 items) | Remediated in `6b7d3339`. Unsupported resin desiccation/herbivory claims removed; grounded strictly in Lazarides (1997), Gamage et al. (2012), and Barrett et al. (2017). Option balance adjusted in `7ba3dd89` and `9fc8285d`. |
| **In Defence of the Dark** | 425 words | Ecological Impact of Light Pollution (Phillip Island shearwaters, nocturnal wildlife) | `rc-019` to `rc-026` (8 items) | Remediated in `6b7d3339` and `403e7c58`. Grounded in Rodriguez et al. (2014); unverified star-count ("fewer than 30 stars") and absolute crime claims removed. Distractor overlaps eliminated. |
| **Charting the Roaring Forties** | 441 words | Maritime History & Navigation (Harrison H4 marine chronometer vs lunar distance) | `rc-027` to `rc-035` (9 items) | Remediated in `6b7d3339` and `e0f6a668`. Overstated salt-spray claims qualified against US Naval Institute historical documentation; option lengths balanced. |

### Integrity Constraint: Shared Stimulus Hash Invariant
In `src/tests/unit/scholarship-release-package.test.ts` and `scholarship-draft-validator.test.ts`, tests enforce that every question belonging to a shared passage carries an identical stimulus object. If a passage is edited, all 8 or 9 dependent questions receive a new `rawQuestionHash` (D1), `factoryCandidateHash` (D2), and `publicationContentHash` (D3).

---

## 4. Answer Uniqueness & Defensible Distractors Audit

The 80 items were audited for answer uniqueness, potential second defensible interpretations, and distractor plausibility:

1. **Verbal Reasoning (45 items):**
   - **Synonyms & Antonyms (7 items):** All pairs have distinct dictionary senses; distractors represent adjacent semantic fields but not direct synonyms/antonyms.
   - **Analogies (7 items):** `vr-003` (CHISEL : SCULPTOR) notes that a chisel is also used by a carpenter, but SCULPTOR is the only craftsperson among the options. Defensible and unique.
   - **Classification & Odd-One-Out (6 items):** Categorisation rules (e.g., predatory birds, architectural elements, metric units) are distinct and unambiguous.
   - **Word Relationships & Compound Words (12 items):** Validated against `compound-words-allowlist.json`. Neither distractor forms two valid compound words with the bridging stems.
   - **Sentence Logic & Deductions (6 items):** `vr-032` was remediated to ensure modus tollens logic has exactly one valid deduction.
   - **Letter Series & Coded Words (7 items):** Closed-language solvers independently verify that shift ciphers and positional progressions admit only the keyed sequence.

2. **Reading Comprehension (35 items):**
   - **Factual Retrieval & Inference (13 items):** Text evidence is unambiguous following the 18–19 Oct primary-source grounding.
   - **Vocabulary in Context (6 items):** Options test the contextual nuance rather than dictionary definition; no two options are synonymous in context.
   - **Authorial Craft & Text Structure (7 items):** Rhetorical function is clearly differentiated.
   - **Option-Length Cue Elimination:** Historical Claude drafts had the correct option as the longest in 18 of 35 items. In current revisions, distractors have been balanced so that no key exceeds 1.45× average distractor length, preventing length-based guessing.

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
**Resolution Route:** When the different-provider review is run, the reviewer evaluates difficulty directly. The reviewer's difficulty assessment provides the independent rating required to reconcile or confirm the declared difficulty.

---

## 6. Exact Protocol to Obtain Qualifying Independent Review

To satisfy repository governance and the Different-Provider Review Policy, the following exact protocol must be executed:

### Phase A: Packet Preparation (Completed)
- Regenerated answer-withheld packet: `docs/reviews/scholarship-2026-10-18/external-review/prompt-with-packet.txt`
- Packet Text: `docs/reviews/scholarship-2026-10-18/external-review/packet.txt`
- Verified Packet SHA-256: `5a0c90b426af617468a3958b64aeca7e2c653f526951db76072209f2faf12198`
- Target response schema: `docs/reviews/scholarship-2026-10-18/external-review/response-schema.json`

### Phase B: Attended Review Session (Owner Action Required)
1. Open a **brand-new, empty chat session** in an external provider UI (ChatGPT-4o/5, Google Gemini Advanced, or Qwen 2.5).
2. Ensure no prior conversation context, system prompts, or answer keys are present.
3. Paste the entire content of `docs/reviews/scholarship-2026-10-18/external-review/prompt-with-packet.txt`.
4. Instruct the model to return strictly valid JSON matching the schema, with `"freshSession": true`.
5. Save the returned JSON as `external-review-<provider>.json` outside the git repository.

### Phase C: Machine Verification & Ingest
1. Run the read-only verification tool:
   ```bash
   npx tsx scripts/verify-scholarship-external-review.mts path/to/external-review-<provider>.json
   ```
2. Verify:
   - Packet hash matches `5a0c90b426af617468a3958b64aeca7e2c653f526951db76072209f2faf12198`.
   - Exactly 80 items present with no missing or duplicate IDs.
   - Provider is not Anthropic / Claude.
   - `freshSession` is `true`.
   - Agreement on answer keys (target 100%).
3. Once clean, ingest into the factory review chain:
   ```bash
   npm run questions:requeue-for-review -- --candidate-ids <ids>
   npm run questions:review-ingest -- --response path/to/external-review-<provider>.json
   ```
4. Re-run pipeline gates:
   ```bash
   npm run questions:pipeline -- --batch-id scholarship-y6-2026-10-17
   ```
