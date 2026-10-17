# AMC review checkpoint � 17 October 2026

Vishwas Joshi explicitly authorized approval of the 57 included rows in this session. Both CSVs retain their original nine columns and binding values; correctness, originality and age appropriateness are yes, and decision is approve. Despite their historical `blank` filenames, they are now filled and committed.

- Year 3: `review-sheet-amc-y3-blank.csv`, 29 approved rows.
- Year 5: `review-sheet-amc-y5-blank.csv`, 28 approved rows.
- `revision-loop-amc.csv`: three excluded items, roadmap-amc-y3-014, roadmap-amc-y5-006, roadmap-amc-y5-028. No approval was recorded for these.
- HTML previews are the earlier review snapshots, not approval evidence.

The governed recorder created 57 real records under `content/publication-approvals/`, each bound to its unchanged content hash and source descriptor hash. These are authoring approvals pending publication, not published manifests. `content/review-sources/amc/y3.json` and `y5.json` remain strictly typed review-source descriptors, not manifests.

## Publication refused

`content:verify-publication` reports 57 pending approvals and no integrity problems. `questions:publish` refused all 57 with `outcome: not_staged`, `foundState: not_found` (exit 3). There are no legitimate upstream staging records. The follow-up fixed ingestion identity preservation and registered exact taxonomy entries for all 57. Difficulty deviations remain on 37; y5-027 is flagged because an easy label cannot be justified for its combinatorial task. These findings are not staging evidence. Assembly was not run after refusal.

AMC remains at 0 manifests and 0 served items (Y3 0, Y5 0). Scholarship and Singapore remain coming soon. No fabricated manifest or prepare-amc-staged script was reused. This branch enforces a real external approval record and both hash-bound first-party and human review stages before any future AMC publication can pass.

See `docs/content-status/amc-publication-attempt-2026-10-17.md` and the 57-row approval evidence index for the actual recorded fields and blockers. Approved content was not edited to force upstream validation.
