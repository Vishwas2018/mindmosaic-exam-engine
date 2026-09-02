# Phase 1 Pilot Results

Run on 2026-08-25. These are dry runs; nothing was published.

## Pilot 1 — ICAS Year 5 Science

A controlled 30-item slice of the existing `icas-y5-science-b05` Codex-authored candidate batch was used to exercise the new gate assumptions without fabricating new production content. Results: 30/30 passed the live canonical question schema, zero exact duplicate stems, and the owner QA minimum is five. The repository records an earlier independent Qwen audit for the source batch, but this is not substituted for the required opposite Codex/Claude v2 blind-review record.

Publication readiness: **blocked by design**. No OpenAI/Anthropic provider credentials or database operator credentials were present, the v2 migration has not been applied to a target Supabase instance, no authenticated owner QA/approval exists, and the legacy audit is not a v2 evidence bundle. The generation/review adapter and manual prompt-pack seams are implemented; a real opposite-agent run remains an operator step.

## Pilot 2 — representative manual import

A representative 60-item set was selected from two existing 35-item Year 5 ICAS Digital Technologies manual batches (30 from each). The inputs provide real repository content without claiming it is newly authored. The v2 importer was exercised in unit tests for single JSON, NDJSON, lossless CSV `canonical_json`, parse failures and source hashes. All 60 selected legacy question payloads pass the live question schema and have zero exact duplicate stems; the owner QA minimum is six.

Publication readiness: **blocked by design**. These legacy batches first require truthful `legacy_import` v2 envelopes/framework references, database ingestion, opposite-agent structured review, risk classification and owner QA. Existing material did not provide a suitable image upload fixture, so asset upload/storage resolution was contract- and migration-tested but not falsely reported as an executed upload. Database publication stayed dry-run.
