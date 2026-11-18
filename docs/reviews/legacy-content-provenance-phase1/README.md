# Phase 1 implementation review package

This isolated migration starts at fresh `origin/dev` commit `82987b74e427cb367ebfcf7b880e1116fe3e178b`. PR #73 and its source branch remain untouched at `dcb60a80f3f6eabdb522b20202929d2e3f328a94`. That commit's provenance investigation is read-only reference evidence, not proof of original generation.

The versioned legacy variant records unknown original generation explicitly and separately binds the verifiable repository import. It does not default unknown identity to a named provider. Known-generation compatibility remains enforced by the existing regression suites. Unknown origin cannot establish independence from any reviewer. Phase 1 refuses semantic review ingestion, revision relabelling, staging, publication and bank assembly for legacy records; deterministic correctness can still be proven without clearing that hold.

## Deliverables

- [Architecture, schema, audit/recovery behaviour and safe PR #73 migration sequence](../../spec/legacy-content-provenance-phase1.md).
- [Exact changed-file inventory](changed-files.txt).
- [Verification results and limitations](verification.md).
- [Pinned sample import manifest](sample-import-manifest.json).
- [Real no-write results for all 12 candidates](preflight-12.json), including exact raw/source/factory/publication hashes.
- [Schema-valid synthetic record](synthetic-record.json): prominently labelled synthetic; no real import was executed and its fake source identities cannot pass real preflight.

All twelve no-write checks passed. The manifest's raw-file SHA-256 is `13bdb8a4756cc123f18017555fef266c62ad523d3ca841cca655f5989e161dd6`. Its canonical JSON transaction hash is `588aba29e8100e559da756269e1e6997309cc647fb6d1f5c5ad174be91020994`; these intentionally identify different representations. VR-032 and NR-001 have explicit solver-sidecar enrichment, separately bound before and after, with unchanged publication content.

Reproduce from a checkout containing the exact reference Git objects and existing bound blueprints:

```sh
npm run questions:import-legacy -- --manifest docs/reviews/legacy-content-provenance-phase1/sample-import-manifest.json --expected-manifest-sha256 13bdb8a4756cc123f18017555fef266c62ad523d3ca841cca655f5989e161dd6 --dry-run
```

Preflight establishes repository and content bindings, not authorship authenticity, review clearance, original generation events or release readiness. Source repository identity is checked against local Git origin configuration, not an authenticated provider execution log. Operator identity remains null.

## Policy and next action

The remaining governance decision is whether unknown-origin content may ever become eligible, and what independently reviewed evidence and controls would permit that. This implementation supplies no waiver, approval override or positive eligibility decision. Any future policy change needs its own review and tests before real review/staging/publication can proceed.

Review the isolated implementation and CI evidence. Keep both PRs draft until their respective requirements are met. Any future real import must be separately authorised after implementation review, revalidate the exact selected PR #73 revisions, and preserve the existing advisory reviews and difficulty disagreements without promoting them to factory attestations. No owner approval, ingestion, release re-pin or publication has been recorded here.
