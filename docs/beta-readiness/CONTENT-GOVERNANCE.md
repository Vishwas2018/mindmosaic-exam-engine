# Content governance for the DEV family beta

Last updated 2026-11-14. Verified facts are marked **[V]**; anything inferred is marked **[I]**.

## What a beta child can be served

**[V]** Deployed builds (Vercel `preview` and `production`) serve only questions with a verified human approval
record (`deployedGateFallback` in `src/server/exam-bank.ts`, PR #124). Local runs and CI keep the earlier "report"
mode so the authored bank stays testable; `MM_PUBLICATION_GATE=enforce|report` overrides either way.

Before PR #124, every programme was in report mode and DEV served all 1,601 bank items to signed-in children.

**[V]** Under enforcement, a live programme that approved content cannot fill (below the 30-item bar the catalogue
already uses) is withdrawn to `coming_soon`, which the programme route serves as 404.

| Programme | Bank | Approved and served | Offered on the beta |
|-----------|-----:|--------------------:|---------------------|
| NAPLAN-style Numeracy, Year 3 | 128 | 36 | Yes |
| NAPLAN-style Numeracy, Year 5 | 164 | 41 | Yes (Y5 Q20 excluded) |
| Mixed practice ("build your own") | — | **[I]** drawn from the same 130 approved items | Yes |
| AMC Year 3 / Year 5 | 26 / 27 | 26 / 27 | No: below 30 |
| NAPLAN Reading, Language; all ICAS; Writing prompts | 1,256 | 0 | No |

Numbers from the repository's own verifier, re-run on the commit of PR #124. Hosted check: `e2e/hosted/g-content-governance.spec.ts`.

## The 130 approval records

**[V]** `content/publication-approvals/*.json`: 130 files. All 130 pass `validateHumanApproval` against current
content (content hash, source manifest hash, fingerprint and revision all match; 0 stale).

- 53 AMC records, approvedAt across six batches on 2026-10-17.
- 77 NAPLAN numeracy records (36 Y3 + 41 Y5), **one shared timestamp 2026-11-13T10:57:49.837Z, one reviewer**.

**[V]** No independent per-item review evidence exists in the repository (review queues and report folders are
empty; the only reviewer fields are the three booleans the recorder writes). The 77 were recorded from the owner's
chat statement on 2026-11-13 that they had reviewed all 78 family-beta items.

**[I]** That makes the 77 an owner attestation, not an item-by-item audit trail. It is acceptable for a
*supervised* beta only if the owner confirms the attestation (below). No approval was created or changed by this work.

## Y5 Q20 (`man-eb2d2e6d5ddfebf6c5085c6e`)

**[V]** Corrected after review (number line re-ticked), no approval file, no embedded approval. It was served on
`dev` at `100287e7`; under enforcement it is not served. It stays excluded until the owner approves the corrected item.

## Owner review packet (the only human decisions left on content)

1. **Confirm the attestation for the 77 NAPLAN numeracy items** (a short written statement that each was reviewed,
   or re-review a sample). Until then they are served on the beta under the existing recorded approval.
2. **Approve or keep excluding Y5 Q20.** Preview it at `/practice/naplan-g5-numeracy` locally with
   `MM_PUBLICATION_GATE=report`.
3. **Choose whether more programmes are wanted for the beta.** Reading, language and ICAS need human review of
   their items before they can be offered; nothing here invents approvals.
