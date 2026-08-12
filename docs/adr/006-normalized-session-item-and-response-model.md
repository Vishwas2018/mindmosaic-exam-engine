# ADR-006: Normalized session-item and response model

- **Status:** proposed
- **Date:** 2026-08-12
- **Spec:** §12.2–§12.6, §21 Phase 2
- **Phase:** 2

## Placeholder

Today a session's content is a `selected_question_ids` string array on
`exam_sessions`, in-progress answers are a single upserted `exam_responses` row
per session, and the final answers plus score are one `result` jsonb blob on
`exam_attempts`. This ADR must decide the normalized replacement: a served-item
ledger (`assessment_session_items`) pinning item-version IDs with ordinal,
section/stage, allocation reason and served timestamp; per-response rows rather
than one JSON document; the session snapshot that records exactly which profile
version, framework version, blueprint version and scoring algorithm version a
sitting was pinned to; and stage sealing for staged delivery. It must decide
response identity and idempotency (what happens when the same response arrives
twice, late, or out of order), how autosave maps onto per-response rows without
reintroducing a rewritable record after submission — the guarantee
`20260811092000` currently provides via `session_has_attempt()` — and what
remains immutable once written. It must also decide whether the guest flow,
which is deliberately client-side and unauthenticated, gains any server-side
representation at all.
