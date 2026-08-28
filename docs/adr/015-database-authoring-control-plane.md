# ADR-015: Database-backed authoring control plane with deterministic Git exports

- **Status:** accepted
- **Date:** 2026-08-25
- **Supersedes:** ADR-002 clauses making Git the authoring source of truth

## Decision

Supabase is the operational authority for v2 candidates, immutable revisions, evidence, assets, approvals, publications and form pins. Git exports are deterministic backup, diff and recovery artefacts, not a peer write authority. The existing immutable runtime projection and least-privilege answer isolation are retained.

New and revised content enters one pipeline regardless of origin. Owner approval is authenticated and distinct from AI evidence. Publication links the exact authoring revision, approval, evidence bundle hash and runtime item revision. Historical compiled content remains truthfully classified and served until shadow cutover proves equivalence.

## Why

Large batches must not rebuild application modules, and a solo operator needs resumable/idempotent jobs rather than hand-maintained banks. Database persistence supplies lifecycle queries and auditability while immutable hashes and exports preserve reviewability and recovery.

## Status of earlier documents

- ADR-002: **partially superseded** for authoring authority; retained for runtime projection, immutability, answer isolation and shadow cutover.
- Platform spec v1.3: **partially superseded** by Content Platform v2; retained for session/runtime architecture not contradicted here.
- Manual question README/prompt packs: **retained as legacy migration material**, not current operational guidance.
