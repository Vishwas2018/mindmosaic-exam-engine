# MindMosaic Content Platform v2

**Status:** Phase 1 implementation baseline (2026-08-25). Supersedes the file-first authoring parts of platform spec v1; its runtime/session and privacy decisions remain retained.

## Purpose

MindMosaic operates one content lifecycle: blueprint -> author/generate/import -> ingest -> validate -> independent review -> risk -> owner approval -> publish -> immutable form -> runtime -> revise/retire -> analytics. Manual and AI origins enter the same gates. Candidates live in the database; deterministic Git exports are backup, review and recovery artefacts.

## Authority boundaries

- Zod/TypeScript is the canonical structural contract; generated JSON Schema is an interchange artefact. QTI 3.0 is a future import/export boundary.
- Authoring revisions, evidence, approvals and audit events are the operational record. Published runtime tables remain the least-privilege learner projection.
- A logical question UUID survives revisions. Published content, assets and forms pin exact immutable revisions and SHA-256 hashes.
- Agents create or review evidence. Only an authenticated admin/owner may approve. Only the publication service may project an approved revision.
- Existing Git-authored content keeps truthful legacy provenance. No review or approval evidence is fabricated.

## Phase 1 scope

The database control plane, strict v2 envelope, adapters, import boundary, hard/risk separation, sampling rule, asset revisions, form pins, audit/export contracts and CLI orchestration are in scope. QTI, workers, psychometrics, adaptive delivery, a large admin UI, external plagiarism services and multi-reviewer workflows are deferred.

## Standards baseline

Blueprint metadata records exact framework references and `sourceType`: 2026 NAPLAN Assessment Framework, Australian Curriculum v9.0, current official ICAS subject frameworks, and WCAG 2.2 AA. Framework changes create new versions; they do not rewrite old mappings.

## Publication invariant

Publication requires the exact revision hash, a passing current validation run, independent passing review with answer agreement, resolved risk, owner approval, repository quality gates, and renderer/asset readiness. Self-reported model confidence never authorises publication.
