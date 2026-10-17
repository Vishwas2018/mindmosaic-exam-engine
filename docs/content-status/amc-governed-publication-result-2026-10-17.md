# AMC governed publication result � 17 October 2026

**BLOCKED AT ASSEMBLY. Do not merge PR #62.** There are 57 genuine AMC publication manifests, but none of the AMC items has entered the assembled or served bank. The unchanged assembled snapshot is inconsistent with the new manifests, so the branch currently fails closed to an empty practice bank. This is an isolated draft branch; dev/main were not merged.

## Advisory difficulty policy and cognitive labels

`src/features/question-factory/difficulty/verify-candidate-difficulty.ts` retains the estimator values, deviation and fingerprinted warning for AMC while returning an explicit advisory outcome. `src/features/question-factory/staging/orchestrate-staging.ts` surfaces the warning as AMC_DIFFICULTY_ADVISORY. Non-AMC mismatch/low-confidence checks and malformed-input checks still block. Correctness, taxonomy, originality, semantic evidence and human approval requirements remain hard. `amc-difficulty-advisory.test.ts` covers the scope boundary; the real-chain integration test proves missing/duplicate external human approvals are refused.

[All 57 cognitive-demand labels and concise mathematical reasons](amc-cognitive-demand-2026-10-17.csv) were assigned from the question's reasoning rather than text length or estimator output. These are cognitive-demand assessments, not empirical psychometric measurements. Counts: Year 3 easy 8 / medium 14 / challenging 7; Year 5 easy 14 / medium 11 / challenging 3.

Seven earlier down-labels were reverted to medium: roadmap-amc-y3-016; roadmap-amc-y5-013, 016, 020, 024, 026, 029. The other nine earlier reductions remain because the tasks themselves are genuinely routine. Y5-027 remains challenging. This review changed 21 labels in total (11 Y3, 10 Y5). Questions, options, answer keys, explanations, marks and timing were preserved. All 21 changed snapshots/pins/sheets were rebound through content:record-approvals under Vishwas Joshi; old signatures are retained under docs/reviews/amc-2026-10-17/superseded-before-cognitive-review/. The approval decision stands; no signature fingerprint was hand-edited.

## Actual chain

- questions:ingest: 57 accepted through the real CLI, with stable draft ids and their existing authoring review revision 1. The importer writes source contracts/input only; it cannot create a gate report, staged record or manifest.
- questions:pipeline: structural, correctness, semantic, originality and difficulty processing genuinely ran. Result: simulated false, summary difficulty_review_passed 57. AMC semantic processing follows the existing deterministic path after real mathematical recomputation; no independent AI review was invented.
- questions:stage: 57 staged; warning-only difficulty deviations remained visible.
- content:record-approvals: replayed the 29 + 28 current bound signatures under Vishwas Joshi; no new approval decision was invented.
- content:verify-publication: passed before publication, with 57 pending approvals and no problems.
- questions:publish: all 57 returned published; manifests were committed and pushed in 15778e59.
- questions:assemble-bank: refused, exit 1. The original AMC duplicate-count problem (identical embedded and external signature counted twice) was repaired in 0dd30593 with a real-chain regression. It now requires exactly one external record matching the embedded signature and still rejects missing/duplicate records. After that fix, **zero AMC manifests were warned/skipped**. The remaining **542 warnings all concern pre-existing non-AMC manifests without valid human approvals**.

Exact blocker:

> warning: Manifest 'g5-depth-vc2e5la01-002' has no valid unique revision-bound human approval; skipped.
>
> Assembly refused: resolve all skipped manifests before replacing the authoring snapshot. Existing files were preserved.

`content/question-factory/published-manifests/g5-depth-vc2e5la01-002.json` already exists on origin/dev and contains revision 0 with neither approvedBy nor humanApproval. The requested 57 approvals do not authorize signing this or the other 541 legacy records. No signatures were manufactured for them, no manifests were silently dropped, and the human gate was not demoted.

## Per-item proof for all 57

[Full evidence, including every manifest's complete real reviewChain](amc-governed-publish-evidence-2026-10-17.json) and [compact approval/manifest index](amc-approval-evidence-2026-10-17.csv).

All 57 external approval records validate against their exact canonical content hash, source descriptor hash and revision. All 57 embedded approvals exactly match those external records. All 57 chains are non-empty, valid, and contain both the governed first-party correctness stage and the human approval stage. Their 57 referenced cva-* attestations were independently authenticated against the real cv-* report, structural fingerprint, current blueprint hash, candidate hash and revision. The evidence file quotes those references and fingerprints; it is not a substitute factory report.

Example: `content/publication-approvals/roadmap-amc-y5-027.json` contains:

```json
{"approvedBy":"Vishwas Joshi","approvedAt":"2026-10-17T01:59:28.745Z","revision":1,"contentHash":"8daed704aaf01eac9a50872ef0d45f4c738da2a57bb594fffd7611c7ae88f495","sourceManifestHash":"a1ff58ee4642c3c7ade87b58833610a8da8b0726ff069c4827379079b20e760e","fingerprint":"8245c539a7d5d83e0c3e86d15b82ab6c0681015718cbef6612213d1c6820cfd4"}
```

`content/question-factory/published-manifests/roadmap-amc-y5-027.json` carries these actual stages:

```json
[{"stage":"correctness_check_passed","reviewer":"mindmosaic-first-party-amc","reference":"cva-90e7e0397a8061c07f3c61a3f6a7ea0ebe611911"},{"stage":"published","reviewer":"Vishwas Joshi","reference":"8245c539a7d5d83e0c3e86d15b82ab6c0681015718cbef6612213d1c6820cfd4"}]
```

## Runtime result and exclusions

AMC manifest count: Y3 29 / Y5 28. AMC served count: **Y3 0 -> 0, Y5 0 -> 0**, not 0 -> 57. Before the chain the total practice bank was 1548; after the assembly refusal it is 0 because publication verification reports 57 orphan_manifest entries relative to the unchanged authoring snapshot. These are real approved but unassembled AMC manifests, not fabricated signatures or orphan approvals. This branch is not merge-ready. Do not call AMC live or served.

Excluded roadmap-amc-y3-014, roadmap-amc-y5-006, roadmap-amc-y5-028 each have no approval, no manifest and no bank entry. The set of 57 AMC manifests exactly equals the approved CSV id set. Scholarship and Singapore remain coming soon. No prepare-amc-staged script or hardcoded derived evidence was used. No merge occurred.

## Verification

The eight-file AMC/solver regression run passed 127 tests; the assembly integration regression additionally passed with real upstream gate execution and positive/missing/duplicate approval cases. Final typecheck and lint both passed after the assembly fix. Publication verification after assembly is intentionally NOT claimed green: the 57 unassembled manifests are integrity failures. The prior full-suite run was interrupted on timeouts; full CI green is not claimed.


Final post-publication verification was actually rerun and exited 1, reporting the 57 orphan_manifest entries quoted in the evidence JSON. Final typecheck and lint passed (exit 0 each). No full-suite green claim is made while assembly is blocked.
