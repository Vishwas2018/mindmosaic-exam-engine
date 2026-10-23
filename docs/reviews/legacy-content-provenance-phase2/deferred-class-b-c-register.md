# Deferred Class B and Class C decision register

**Status:** DEFERRED. These five candidates and the shared reading passage are held at the Phase 1 position. Nothing about them is retired, rewritten, re-authored, re-keyed or altered.

The purpose of this register is to record what is held, what evidence already exists, what is actually missing, and what would have to become true before the question is reopened — so that deferral is a tracked state rather than an omission.

---

## 1. What is held

| Candidate | Class | Skill | Key | Difficulty | Status |
|---|---|---|---|---|---|
| `scholarship-y6-vr-001` | B — judgement verbal | `vr-analogies` | e (DISTANCE) | medium | DEFERRED |
| `scholarship-y6-vr-016` | B — judgement verbal | `vr-synonyms-antonyms` | d (ENERGETIC) | easy | DEFERRED |
| `scholarship-y6-rc-001` | C — literary stimulus | `rc-authorial-craft` | a | medium | DEFERRED |
| `scholarship-y6-rc-002` | C — literary stimulus | `rc-figurative-language` | c | medium | DEFERRED |
| `scholarship-y6-rc-003` | C — literary stimulus | `rc-character-inference` | e | medium | DEFERRED |

Plus the complete shared reading passage, "The Estuary Watchers", in `content/scholarship-drafts/scholarship-y6-reading-draft.json`.

`scholarship-y6-vr-032` is **not** in this register. It is nominally Class A, but has no first-party recompute entry and would need a new non-numeric attestation category; `solver-coverage.md` recommends deferring it with Class B unless the owner wants that category built.

## 2. Explicit non-actions

The following are recorded as **not** proposed, because the withdrawn first draft proposed several of them:

- No candidate is retired or marked `retired_ineligible`.
- The reading passage is not replaced, rewritten or re-authored. The "clean-sheet re-authoring" recommendation is withdrawn.
- No answer key, stem, option, explanation, passage text or difficulty value is changed.
- No candidate hash or publication hash is recomputed.
- No candidate is ingested, staged, published or approved.

## 3. Evidence preserved as advisory

Each of the five carries a completed manual ChatGPT blind review that agrees with its declared key. These are retained and remain attached as **advisory corroboration**, with the classification their own summary records: `manual_user_attested`, `chatgpt-unversioned`, no authenticated API envelope.

Advisory evidence does not expire and does not decay into something stronger. It also does not contribute to any admission test, now or later.

## 4. What is actually missing, per class

### Class B — `vr-001`, `vr-016`

Correctness here is a judgement about lexical and semantic convention, so no deterministic recompute exists or can exist. The governing constraint is `docs/REVIEW_INDEPENDENCE_POLICY.md`: for judgement content the reviewer's judgement *is* the correctness evidence, and with an unknown generator independence cannot be evaluated at all.

Missing:

1. Any authenticated external review. No provider API call has succeeded — Google returned `404` then `402`, OpenAI returned `429`. The blocker is funded API access, not policy.
2. A named qualified subject-matter expert. None is engaged.
3. A decision on whether corroboration from two distinct providers is an acceptable substitute for unverifiable independence, recorded under its own name and never as `isProductionGradeIndependentReview`.

### Class C — `rc-001`, `rc-002`, `rc-003` and the passage

Carries everything Class B carries, plus originality exposure specific to extended literary text.

Missing:

1. The Class B items above, for all three derived questions.
2. A bounded originality search over the passage, with coverage gaps recorded.
3. A cultural and age-suitability review of the passage.

A note on the re-authoring argument, which was the withdrawn draft's headline recommendation. Re-authoring does not remove memorisation exposure: a freshly generated passage can reproduce memorised text exactly as a legacy one can, and would have had no search run against it. Separately, re-authoring cannot currently produce better provenance, because `live_provider` is unimplemented and the only publishable route for new AI-authored prose is `manual_external`, which the repository defines as untrusted. Re-authoring would substitute attested provenance for unknown provenance, at the cost of discarding reviewed, hash-bound content.

## 5. Reopening conditions

Class B is reopened when **all** of:

- Funded, working provider API access exists and a stateless, answer-withheld, hash-pinned review completes with a recorded execution envelope.
- A second review completes from a different provider, and both agree on the key with no ambiguity flagged.
- A named SME completes a rubric review bound to the exact content hash.
- The corroboration-versus-independence question in section 4 is decided and named honestly.

Class C is reopened when the Class B conditions hold for all three items **and** a bounded originality search over the passage returns `no_match_found` with its coverage gaps recorded, **and** a cultural and age-suitability review is complete.

Both additionally require the approval-authentication and ledger controls that gate Class A.

## 6. Consequence for the sample

Deferring these five means the 12-question scholarship sample cannot be released in full under this policy.

It does **not** mean a seven-item or six-item sample should be released instead. The sample is a pinned set with pinned release identities in `src/features/admin-review/release-identities.json`; shipping a subset changes subject balance and what a student sees, and is a separate product decision requiring its own authorisation. See `pr-73-migration-plan.md`.
