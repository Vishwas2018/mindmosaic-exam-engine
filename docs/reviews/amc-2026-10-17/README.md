# AMC review checkpoint ? 17 October 2026

STOP: Vish must re-sign before approval recording or publication. These are private review previews, not published bank items.

## Review files

- Year 3: `review-sheet-amc-y3-blank.csv` (29 rows); read `review-sheet-amc-y3.html` alongside it.
- Year 5: `review-sheet-amc-y5-blank.csv` (28 rows); read `review-sheet-amc-y5.html` alongside it.
- The existing nine columns are preserved. Question ID, canonical content hash, revision and source manifest hash are populated. Correctness, originality, age appropriateness, decision and notes are blank. Review each item individually; a blank is not approval. Return filled copies without changing the first four columns.

## Excluded from this approval round

`revision-loop-amc.csv` records the scope decision to revise/exclude these three items. It is not a human approval or a claimed completed factory revision transition.

| Item | Decision | Reason |
| --- | --- | --- |
| roadmap-amc-y3-014 | Exclude for revision | The arithmetic mean wording needs Year 3 age-fit review. The numerical key alone does not resolve age fit. |
| roadmap-amc-y5-006 | Exclude for revision | Corrupted multiplication-symbol text in the explanation must be repaired before fresh review. |
| roadmap-amc-y5-028 | Exclude for revision | Two-variable whole-number algebra needs a Year 5 age-fit decision or replacement. |

29 + 28 reviewable + 3 excluded = 60 current drafts. No question wording, options or keys were changed. Excluded IDs cannot be approved by inserting them into these sheets; revision requires regenerated bindings and fresh review.

## Binding contract

`content/review-sources/amc/y3.json` and `y5.json` each contain 30 strictly typed `amc_draft_review_source` descriptors. `sourceManifestHash` is the canonical SHA-256 hash of the item's descriptor, which binds its ID, revision, original draft path, original question hash and canonical publication-preview content hash. The loader recomputes those values against the current draft and refuses missing, duplicate or stale sources.

These source descriptors are **not publication manifests**. They contain no `publishedAt`, `approvedBy`, human approval, gate reports or review chain. Hashing a review source makes no correctness, originality, age-fit or staging claim.

The existing approval-row validator can validate the regenerated bindings against private draft targets. This does not add the drafts to `getExamBank`, the generated inventory or the publication manifest directory. Test signatures exist only in test memory; no approval record has been written.

## Cleanup and publication hold

The abandoned worktree's 60 untracked AMC published manifests and `scripts/prepare-amc-staged.mts` were removed. Its generated bank file was restored to its tracked baseline only after verifying that every non-AMC question matched that baseline. None of its fabricated artifacts or reports was copied to the clean worktree.

The fresh branch is `fix/amc-publication-clean`, based on origin/dev `3b85a102`. At this checkpoint, AMC approval records, AMC publication manifests and served AMC items are all zero. Scholarship and Singapore remain coming soon.

After Vish returns valid signatures, the next phase must implement/verify the complete attested lifecycle before recording or publishing: `checkPublicationEligibility` plus hash-bound `verifyFirstPartyAmcAttestation`, genuine upstream evidence, a real approval file, and a review chain carrying both first-party attestation and human approval. Current baseline publication machinery does not yet supply that dual-stage AMC chain. Do not run publication until those requirements are enforced; never manufacture staging reports or a published manifest to make the sheets validate.
