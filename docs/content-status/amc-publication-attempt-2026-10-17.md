# AMC governed publication attempt � 17 October 2026

Status: BLOCKED, not published. Branch: fix/amc-publication-clean. No merge.

## Persisted work

The committed first-party modules on content/amc-publication-pipeline were already present on this branch. No committed AMC-specific 60-solver module existed there. The replacement uses the legitimate committed roadmap AMC verifier computations and immutable content-hash pins, not the abandoned staging script. Guardrails cover stale content, missing/throwing/non-finite/ambiguous/mismatched computation and candidate-supplied logic.

Vishwas Joshi explicitly authorized approve on the 29 Y3 and 28 Y5 rows. The governed recorder wrote 57 real approval records. All 57 records independently pass validateHumanApproval against current canonical question content, revision and sourceManifestHash. The full per-item fields are in [the 57-row index](amc-approval-evidence-2026-10-17.csv).

`content/publication-approvals/roadmap-amc-y3-001.json` contains:

```json
{"kind":"human_publication_approval","questionId":"roadmap-amc-y3-001","revision":1,"approvedBy":"Vishwas Joshi","approvedAt":"2026-10-17T01:59:20.115Z","contentHash":"9523d5b67912f46386ee02ae6e49056834da31a5631614bad74334ed67c6b0d6","sourceManifestHash":"6bd1bb5af3888ae7eb3bdd314fc1886dc931bf0cc4dbd9102f439c395bcc1bdb"}
```

`content/publication-approvals/roadmap-amc-y5-001.json` contains:

```json
{"approvedBy":"Vishwas Joshi","approvedAt":"2026-10-17T01:59:28.745Z","contentHash":"683555c99beea3e5554264d86ba76eb9c91671d222d8f3455be8f8a00f42ba77","sourceManifestHash":"94a5f1f01f05753f799fb3e72d6fb866d22875d1a528d129851fbfd5e6287c66"}
```

## Actual governed chain result

1. content:record-approvals: 57 actual approval records, 29 Y3 + 28 Y5.
2. content:verify-publication: successful integrity validation; 57 pendingPublication, eligible 0, problems []. Pending approval is explicitly distinct from published eligibility and is never served.
3. questions:publish: refused all 57, exit 3. Representative actual result:

```json
{"outcome":"not_staged","candidateId":"roadmap-amc-y3-001","foundState":"not_found"}
```

4. questions:assemble-bank: not run after publisher refusal. No fabricated staging reports were created to bypass it.

No AMC published manifest exists under `content/question-factory/published-manifests/`; consequently no actual AMC manifest reviewChain can be quoted. The schema now refuses AMC publication without both a passed hash/revision-bound first-party correctness stage and a passed human stage referencing the real approval fingerprint. Serving requires the corresponding external approval file as well. Tests exercise empty chains, incomplete chains, stale bindings and bare approvedBy rejection using in-memory fixtures only.

## Upstream blockers

There are no governed staged records for these 57 candidates. A pure diagnostic of the unchanged source candidates, not a persisted gate report, finds taxonomy errors on all 57 and difficulty deviations exceeding 0.15 on 37. For example, roadmap-amc-y3-001 reports unknown_taxonomy_skill: Skill 'Number sequences and recurrence relations' does not resolve to any taxonomy id or declared alias. roadmap-amc-y3-011 has an unknown skill and declares medium while the estimator returns easy (deviation 0.5, tolerance 0.15).

Resolving these upstream authoring/lifecycle issues must precede genuine staging. Editing approved content requires fresh bindings and review. A correct solver result and human approval alone cannot replace the other governed checks.

## Runtime negative proof

getExamBank("practice"): total 1548; AMC before Y3 0/Y5 0, after Y3 0/Y5 0. Bound pending approvals: 57. AMC manifests: 0. Excluded roadmap-amc-y3-014, roadmap-amc-y5-006, roadmap-amc-y5-028 each have no approval, no manifest and no bank entry. Scholarship remains coming soon; Singapore status is coming_soon. No main merge occurred.

## Validation

The targeted seven-file attestation/approval suite passed 163 tests; a separate three-file manifest/pending-approval run passed 36 tests. Typecheck passed after the final schema compatibility fix; lint passed. The roadmap validator passed 199 structurally valid drafts and all listed full-paper fill checks. Final publication integrity verification passed with 57 pending approvals and zero problems. The full npm test run encountered repeated timeouts (including sign-in, signup, year-authority and projection suites) and was interrupted; full-suite green is not claimed. Build, RLS and browser/auth end-to-end checks were not completed in this blocked attempt. This is a draft PR, not merge-ready.

## Follow-up: identity and taxonomy repaired; difficulty hold remains

On the follow-up instruction, ingestion was repaired and pushed in c97758f7: a complete pinned first-party AMC candidate retains its roadmap draft ID only after its independent attestation succeeds. Unregistered or modified source content still receives an infrastructure-minted ID. This branch has no stage-*-candidates.mts scripts; the real id replacement was in manual-ingestion/ingest.ts. The real inbox-ingestion regression suite passed 32 tests, including preserved hash/solver resolution and rejection of a modified question's claim to the registered identity. No direct staging records were constructed.

Explicit skill entries were registered and pushed in a7fa8f11. There are 51 distinct skill/strand entries for the 57 included items. All 57 now pass checkTaxonomy with exact subject, strand, year and style matches; no fuzzy matching was added. The combined registry remains collision-free, and unknown variants still fail. All three taxonomy tests passed. The preceding section's all-57 taxonomy errors describes the earlier attempt and is now resolved.

Difficulty remains a genuine blocker. roadmap-amc-y5-027 asks: "A grid has 4 columns and 3 rows of equal square cells. How many rectangles of all sizes have sides along the grid lines?" Its explanation selects two of five vertical lines and two of four horizontal lines, then multiplies 10 by 6 to obtain 60. That is a two-dimensional combinatorial reasoning task; an easy Year 5 label cannot be justified merely because its wording is short. I am flagging it rather than forcing a label. Even changing challenging to medium would still differ from the estimator's easy by 0.5 > 0.15.

The actual pure verifyCandidateDifficulty function, supplied the unchanged candidate and declared challenging label in a clearly marked diagnostic context, returned status failed, code difficulty_deviation_exceeded:

> Estimated difficulty 'easy' deviates from declared difficulty 'challenging' by 1.0000, exceeding the tolerance of 0.15.

This is a preflight diagnostic, not a persisted difficulty report or a claim that the governed lifecycle reached that stage. The verifier's declared difficulty comes from the bound blueprint during the real pipeline, not from question metadata alone. No bound AMC blueprint or successful upstream evidence was invented for the diagnostic.

[The 37-row difficulty preflight](amc-difficulty-preflight-2026-10-17.csv) records before and after labels (unchanged), proxy estimates and dispositions. It is not a claim of 37 completed label migrations. Stopped at this flagged item before changing labels or rebinding approvals. The other 36 label decisions were not applied. Questions, keys, approvals, source descriptors and solver pins remain unchanged.

The new ingest/stage/publish chain was not run after this blocker. Existing 57 human approvals remain pending, with zero AMC manifests and zero AMC bank entries. No new human or attestation review stages have been fabricated. PR #62 remains a draft; no merge.

Follow-up verification: final typecheck passed. The four-file AMC attestation/taxonomy/manifest/pending-approval suite passed 98 tests. A fresh runtime audit revalidated all 57 content/source-bound approvals, reported zero problems, and confirmed AMC Y3 0/Y5 0, no AMC manifests, and no approval/manifest/bank presence for any of the three excluded ids.

## Continued item-by-item recalibration

The subsequent continue instruction was applied to the independent item work. Sixteen overstated labels were changed to easy after inspecting the actual reasoning: Y3 015/016/022/025, and Y5 011/013/014/015/016/018/020/023/024/025/026/029. The 37-row preflight now quotes each original and resulting label and gives the mathematical reason for each change. Twenty-one items remain flagged rather than having their label forced to match the estimator; this includes y5-027. No question text, option, key, explanation, marks or timing was changed.

The 16 old approval records were preserved verbatim under docs/reviews/amc-2026-10-17/superseded-label-approvals/. The new snapshot pins, review descriptors and signed CSV bindings were regenerated for the label-only changes, and content:record-approvals under Vishwas Joshi created 4 replacement Y3 approvals and 12 replacement Y5 approvals (41 unchanged approvals replayed). No approval fingerprint was edited by hand. A regression compares all 16 canonical questions with their archived approved snapshots and requires difficulty to be the only differing field. The three-file recalibration/attestation/pending suite passed 89 tests; all 57 current signatures passed the fresh binding audit. Runtime AMC remains Y3 0/Y5 0 and manifests remain zero.
