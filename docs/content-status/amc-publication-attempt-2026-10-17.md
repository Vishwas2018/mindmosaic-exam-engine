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
