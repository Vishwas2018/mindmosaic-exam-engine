# Post-hoc audit — the 288-question publication

**Audit target:** `main` @ `f65a5122d14f13858ef0523aa8fcad71cefba5eb` (pushed; backup ref `backup/pre-audit-main-f65a512`)
**Date:** 2026-07-30 · **Method:** read-only, every binding and fingerprint recomputed with the live factory modules, driven from `content/question-factory/published-manifests/`
**Machine-readable companion:** `publication-288-posthoc-audit.json` (162 findings)

**Audit recommendation: SELECTIVE UNPUBLISH of 132 questions. The remaining 156 stand.**
**Owner verdict (2026-07-30): ALL 288 STAND — see the addendum at the end of this report.**

---

## 1. Headline

132 of the 288 published questions carry a correctness-gate report whose status is **`review_required`**, not `passed`, with capability `requires_independent_semantic_review` and issue code `semantic_review_required`:

> "Question type '…' (or its manual/text answer key) requires independent semantic review; deterministic correctness cannot be established."

There is **no durable evidence anywhere in the repository that any of those 132 received that review.** The split is exact and not arbitrary:

| Correctness status | Capability | Count | What they are |
|---|---|---|---|
| `passed` | `deterministically_verifiable` | **156** | every numeracy item |
| `review_required` | `requires_independent_semantic_review` | **132** | every reading (69) + language_conventions (63) item |

The 132 by type: `reading_comprehension` 54, `fill_blank` 37, `dropdown` 26, `short_answer` 15.
By program: naplan/reading/y5 45 · naplan/language/y5 30 · naplan/language/y3 25 · icas/reading/y5 17 · icas/language/y5 8 · naplan/reading/y3 7.

All 132 are live to learners through the `"published"` bank.

## 2. Root cause — how they got through

Neither of the two lifecycle guards re-checks the correctness or semantic gate:

- `orchestrateStaging` (`staging/orchestrate-staging.ts:118-143`) verifies **only** the difficulty report, plus content-hash self-consistency.
- `checkPublicationEligibility` (`publication/eligibility.ts:51-127`) verifies **only** originality + difficulty reports, content hash, and that the generator is not `deterministic_fixture`.

So the candidate's `state: difficulty_review_passed` was trusted as a proxy for every earlier gate. It is not one. A candidate can hold a `review_required` correctness report and a `passed` difficulty report simultaneously, and nothing between staging and publication looks at the former. This is a gap in the gate chain, not a mistake by the operator who ran the publish.

## 3. Dimension results

### D1 — Evidence completeness and recomputed bindings

Every binding was recomputed against the **published** manifest's `contentHash`/`revision` (stored labels were not trusted).

| Gate | Report present | `status: passed` | Binding fresh | Missing | Stale |
|---|---|---|---|---|---|
| structural (`sv-`) | 288/288 | 288 | 288 | 0 | 0 |
| correctness (`cv-`) | 288/288 | **156** | 288 | 0 | 0 |
| originality (`og-`) | 288/288 | 288 | 288 | 0 | 0 |
| difficulty (`df-`) | 288/288 | 288 | 288 | 0 | 0 |
| semantic | **n/a — see below** | — | — | — | — |

Binding freshness is perfect across all four gates: zero stale, zero missing. The only D1 failure is the correctness **status** on 132 items.

**The semantic gate leaves no durable artefact.** Only four report-id builders exist (`sv-`, `cv-`, `og-`, `df-`); there is no semantic equivalent and no `semantic/` module. Semantic evidence lives solely in `provenance.reviewRecords` — see D2.

### D2 — Review-chain integrity: NOT AUDITABLE

`verifyReviewChain` cannot be run on any of the 288. The chains no longer exist:

- `compartmentForState("published")` returns `undefined` by design — "a published candidate's content is written into `src/content/questions/generated/` … and only its manifest stays in the factory workspace." The candidate record, which carries `provenance.reviewRecords`, is consumed at publication.
- `content/question-factory/review-queue/` is gitignored and was **never** tracked: the only commit touching it is `f4748ac`, which added `.gitkeep` alone.
- No tracked file under `content/question-factory` contains `reviewRecords`. The single on-disk file that does is `reports/restore-review-report-2026-07-25.json`, itself gitignored.

Manifests preserve `originalityFingerprint`, `difficultyFingerprint` and `manifestFingerprint`, but **no review chain, no reviewer identity, no `reviewResultFingerprint`**. Copied-review and tampered-chain detection are therefore impossible after the fact. This is a design property, not evidence of wrongdoing — but it means publication destroys exactly the evidence an independence audit needs.

### D3 — Generator → reviewer identity

Generators (from manifests, all 288 — authoritative):

| Generator | Count |
|---|---|
| `anthropic/claude-sonnet-5` (claude, `manual_external`) | 206 |
| `human/human` (human, `manual_external`) | 82 |

Reviewer identity survives for only **62 of 288** (22%), reconstructed from local, gitignored `reports/review-responses-*/` artefacts — not from the authoritative chain:

| Generator → reviewer | Count | Independence |
|---|---|---|
| `human/human` → `claude-opus-4-8` | 32 | OK — different family |
| `anthropic/claude-sonnet-5` → `claude-opus-4-8` | **30** | **VIOLATION — Claude reviewing Claude** |

**30 confirmed same-family violations.** For the other 226 published candidates, reviewer identity is unrecoverable — the violation rate cannot be bounded above 30. Given 206 of 288 were Claude-generated, the true count is plausibly far higher.

I found no positive evidence of *fabricated* reviews. What is established is absence of required evidence plus same-family review where identity survives.

### D4 — Publication mechanics: CLEAN

| Check | Result |
|---|---|
| `manifestFingerprint` recomputed vs stored | 288/288 match |
| `originalityFingerprint` vs `og-` report evidence | 288/288 match |
| `difficultyFingerprint` vs `df-` report evidence | 288/288 match |
| `question.status === "published"` | 288/288 |
| Duplicate question ids within batch | 0 |
| Collisions against the 100 curated seed ids | 0 |
| `batch-published.json` entries | 288 |
| In batch but not in manifests / vice versa | 0 / 0 |
| Batch entry hash-equal to manifest question | 288/288 |

Mechanically the publication is sound. Nothing here argues for an unwind.

### D5 — Wiring vs the Mission 3E contract (separate verdict)

Compliant: the loader is **static** (single literal `import batch from "./batch-published.json"`, no dynamic `import()`, no directory scan), **schema-validated on load** (`z.array(questionSchema).parse`), contains **no candidate-derived executable code**, and is template-stable. The new `published-bank-reachability.test.ts` (185 lines) does assert gated programs stay gated.

Deviations:

1. **Wiring target.** Contract §514 requires the loader re-export for `src/content/questions/question-bank.ts` to concatenate alongside the hand-authored grade modules. Actual wiring feeds `practice-bank.ts` and a new `publishedExamBank`. Defensible — it keeps the governed 100 and its tests intact — but it is not what the contract specifies, and it should be reconciled deliberately rather than left as drift.
2. **Batch filename.** Registry pattern is `batch-{batchId}.json`; the actual file is `batch-published.json` — literal `"published"`, one file for all batches, not one per `batchId`.
3. `question-bank-contract.generated.json` — a `PUBLICATION_CONTROLLED_FILES` entry — **was never written** (absent).
4. `question-bank-summary.ts` — also controlled — unchanged since `dd8e0e0`.
5. `generated/index.ts` carries blanket `/* eslint-disable */` and `// @ts-nocheck` in a controlled production file.

### `c235acb` — judged separately

"test(e2e): update landing and billing specs stale since the 2026-07-29 landing work" touches only Playwright specs and is unrelated to the publication. No audit objection; it should not be reverted alongside any unwind.

## 4. Recommendation

**Selective unpublish of the 132 `review_required` items; the 156 deterministically-verifiable numeracy items stand.**

Rationale: the 156 pass every auditable dimension — four gates present/passed/freshly bound, mechanics clean, and their capability is `deterministically_verifiable`, so the missing independent semantic review is not required for them. The 132 are the opposite: their own correctness report states that deterministic correctness cannot be established and independent review is required, and no such review is evidenced.

I stopped short of recommending **full unwind** because D4 is clean and I found no positive evidence of fabricated or tampered evidence — the failure is absent evidence and a gate-chain gap. Escalate to full unwind if you judge that (a) 30 confirmed Claude-on-Claude reviews plus 226 unverifiable ones, or (b) the fact that publication destroyed the review chains, makes process integrity rather than item quality the issue. That is a policy call, not a technical one.

### Mechanics — selective (recommended), as forward commits only

1. Snapshot already taken outside the repo: `C:\Users\vishw\Vish\Vish\mm-audit-snapshot-f65a512` — 288 manifests + `batch-published.json` + `index.ts` + the 18 remaining candidates, 309 files, digest `1b65ff2eacaca04ee21a9db1f765726f74ab91a0594210b44f01854f7acaa235`.
2. Delete the 132 manifests listed in `D1_reviewRequiredPublished` from `published-manifests/`.
3. Re-run `npm run questions:assemble-bank` — regenerates `batch-published.json` to 156 entries.
4. Re-seed the 132 into `review-queue/` from the snapshot manifests, resetting state to `correctness_check_passed`. **Note:** manifests do not carry `provenance.reviewRecords`, so the re-seeded candidates will have **no review chain**. They cannot be re-published without re-running correctness and a genuine independent semantic review from scratch.
5. Forward-fix commits on `main`. No history rewrite; the pushed `f65a512` stays.

### Mechanics — full unwind, if ordered

`git revert -m 1 f65a512` (forward revert of the merge, history intact), then re-seed all 288 from the snapshot, with the same no-review-chain caveat. Do **not** revert `c235acb`.

### Process fixes to land before any republication

- Make `orchestrateStaging` and/or `checkPublicationEligibility` verify the **correctness report status** and refuse `review_required`. This is the defect that allowed the 132 through.
- Give the semantic gate a durable report artefact (a `sm-`-style file) so independence is auditable after publication.
- Persist the review chain into the manifest, or archive the candidate record on publication, so `verifyReviewChain` remains runnable post-hoc.
- Enforce reviewer-vs-generator family separation mechanically at ingest, rather than by operator discipline.

## 5. Audit limitations

- D2 unauditable; D3 only 22% covered — both because publication consumes the evidence.
- Reviewer identities used in D3 come from gitignored local artefacts that could themselves be incomplete or edited; they are the best available source, not a trustworthy one.
- Absence of a semantic review is proven for the 132 in the sense that no evidence exists in repo or git; it does not prove no review ever occurred out-of-band.

---

## Addendum — owner verdict, 2026-07-30

**All 288 stand by owner decision. Retroactive review ordered.** No unwind, no
selective unpublish. This overrides the selective-unpublish recommendation in
§4 above; that recommendation is retained unedited as the audit's independent
finding.

The snapshot `C:\Users\vishw\Vish\Vish\mm-audit-snapshot-f65a512` (309 files,
digest `1b65ff2eacaca04ee21a9db1f765726f74ab91a0594210b44f01854f7acaa235`) is
retained **indefinitely** as the audit record, not as a staging area for a
rollback that is no longer planned.

Consequently the 132 `review_required` items remain live while the following
remediation runs:

- **P0-A — gate-chain fix.** `checkPublicationEligibility` and
  `orchestrateStaging` must verify every upstream gate per candidate
  (structural, correctness as `passed` and never `review_required`, semantic
  evidence per classification, originality, difficulty) and must never treat
  `difficulty_review_passed` as a proxy. Nothing publishes again until closed.
- **P0-B — durable review evidence.** Publication must persist the full review
  chain so published content stays post-hoc auditable, closing the
  "compartment consumed at publish" gap this audit hit in §D2. Includes
  append-only enrichment of the existing 288 manifests, capturing the 62
  surviving reviewer identities into tracked form before they are lost.
- **P0-C — independence policy upgrade.** AI-generated `semantic_objective` /
  `manual_review_writing` candidates require a **different-provider** reviewer.
  The 30 `claude-sonnet-5 → claude-opus-4-8` pairs recorded in §D3 become a
  FAIL under the new policy.
- **Retroactive independent review of all 132**, against their published
  content hashes, via the external different-provider round-trip. Standing
  rule: any of the 132 that fails retroactive review is removed from the
  published bank by forward-fix commit — pre-approved on evidence of failure,
  reported before execution.

ICAS streams (`content/icas-1000-claude`, `content/icas-1000-codex`) remain
paused until P0-A/B/C are merged and green.
