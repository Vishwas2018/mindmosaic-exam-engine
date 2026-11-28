# Publication-manifest tampering review — PR #74

Scope: can removing, replacing or forging the optional `generatorAdapter` on a publication manifest make an unknown-origin question eligible through publication replay, manifest validation or published-bank assembly? Reviewed against `ed7c9376`. All fixtures are synthetic; no real manifest was written, no ingestion, staging, publication or approval was performed.

## What binds `generatorAdapter`

1. `manifestFingerprint = hashJson(publicationManifestFacts(manifest))`; `generatorAdapter` is one of the eleven fact keys (`MANIFEST_FACT_KEYS`). `validatePublicationSource` recomputes it on every consumer path.
2. The human approval carries `sourceManifestHash = hashJson(manifest minus humanApproval)`, covering every manifest field, and is itself fingerprinted. `validateHumanApproval` checks it.
3. The three consumers all call `validatePublicationSource`: bank assembly (`assemblePublishedQuestions`), runtime selection (`selectApprovedQuestions`) and publication replay (`orchestratePublication`). That function calls `validateManifestReviewEvidence`, which refuses an explicit `legacy_import` adapter.

## Tampering matrix (`src/tests/unit/question-factory/legacy-manifest-tamper.test.ts`)

Each manifest is run through assembly, selection, replay and `validatePublicationSource`.

| Attack | Result at `ed7c9376` | Result after hardening |
| --- | --- | --- |
| Honest `legacy_import` manifest with a valid fingerprint and approval | refused everywhere | refused everywhere |
| Marker removed after sealing | refused (`manifest_fingerprint_mismatch`) | refused |
| Marker replaced by a known identity after sealing | refused (`manifest_fingerprint_mismatch`) | refused |
| Marker replaced and fingerprint recomputed, original approval kept | refused (`approval_source_mismatch`) | refused |
| Approval embedded from the legacy-marked manifest, reused | refused | refused |
| Smuggled `originalGeneration`/`provenance` fields on a legacy manifest | refused | refused |
| Adapter **absent**, fingerprint **and** approval re-sealed | **admitted** | refused (`invalid_generator_attribution`) |
| Adapter `null`, a bare string, an array, `{}`, a non-string class, an unknown class, `LEGACY_IMPORT`, `" legacy_import"`, all re-sealed | **admitted** | refused |
| Known-generation control; historical `{ class: "manual_external" }` fixture shape | admitted | admitted |

## Findings

**P0: none. P1: none.**

**P2-1 (fixed): the legacy guard was a deny-list on one exact string.** `generatorAdapter?.class === "legacy_import"` only fires for a well-formed marker. A manifest whose adapter was absent, mis-shaped or an alias passed all checks if the attacker also recomputed the fingerprint and the human approval's source hash. This is not an unauthenticated bypass: it needs the ability to forge a fingerprinted human approval, which is the same capability that defeats every other manifest check (see P2-2). Severity P2 as defence in depth, fixed because the repair is tiny and cannot affect real data.

*Change.* `manifestGeneratorAttributionIssue` (`publication/manifest-schema.ts`) is an allow-list: `generatorAdapter` must be an object whose `class` is exactly `deterministic_fixture`, `manual_external` or `live_provider`. `validatePublicationSource` (`content-governance/publication-integrity.ts`) enforces it immediately after the fingerprint check, returning `invalid_generator_attribution`. That function is the single path for assembly, selection and replay. `validateManifestReviewEvidence` is unchanged apart from a type widening, so its chain-logic unit tests keep their fixtures and assertions. The `identity` object is deliberately not required, so the historical adapter shape stays valid.

*Compatibility.* All 596 committed manifests (288 v1, 308 v2) carry a well-formed `manual_external` adapter. A regression test reads every committed manifest and asserts the new rule accepts it. No manifest, fingerprint or approval is rewritten.

**P2-2 (limitation, not fixable here): a fully re-sealed manifest with a *fabricated known* adapter cannot be told from a genuine one by shape.** Fingerprints are unkeyed hashes and human approvals are unauthenticated JSON, so anyone who can write both a manifest and its approval can claim any origin. The marker is therefore protection against relabelling, omission and honest mistakes, not against deliberate forgery by a repository writer. A real defence needs a policy and tooling decision: authenticated approvals, or a tracked ledger of legacy-imported candidate IDs and content hashes that assembly cross-checks. Neither is implemented, because the candidate record is consumed at publication and the importer's journal lives in the untracked factory workspace. Phase 1 closes the hole upstream instead: legacy candidates cannot reach staging or publication, so no genuine legacy manifest can be produced by the pipeline.

**P2-3 (process): the verification report overstated nothing but left two items open** (a local e2e run recorded as "in progress", a factory rerun deferred to CI). Both are now resolved in `verification.md`.

## Remaining limitations

- Trust boundary as in P2-2. This review did not and cannot make unknown-origin material eligible; no waiver exists.
- The new test runs `orchestratePublication` replay against a stub repository, not the filesystem repository.
- Not run locally: `test:rls`, `test:e2e`, `test:e2e:auth`. CI evidence for those is in `verification.md`.
