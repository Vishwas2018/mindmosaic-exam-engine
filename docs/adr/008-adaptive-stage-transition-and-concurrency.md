# ADR-008: Adaptive stage transition and concurrency contract

- **Status:** proposed
- **Date:** 2026-08-12
- **Spec:** §11.3, §12.6, §21 Phase 4
- **Phase:** 4

## Placeholder

In a multistage adaptive test the stage-completion response is the carrier of
the next candidate allocation (spec §1.1), which makes stage transition the one
operation where scoring, routing and allocation must happen atomically. This ADR
must define that contract: what seals a stage, what the server returns, what
happens when the same stage-completion request arrives twice or from two tabs,
how a partially allocated next stage is recovered after a disconnect, and what a
resumed session is permitted to re-request. The existing fixed-path precedents
are the model — `record_exam_attempt` does its work in one transaction and lets
the `exam_attempts_session_id_key` unique violation (SQLSTATE 23505) surface so
a lost race becomes an idempotent 409 rather than a 500, and `session_has_attempt()`
makes "submitted" a single fact the whole schema keys off. The adaptive
equivalent needs the same shape: one transaction, one uniqueness guarantee per
(session, stage), and no client-side merge. It must also decide whether a
transition may ever be reversed, and what happens when a routing rule changes
between a session's creation and its next transition — the profile version is
pinned, so the answer should follow from ADR-004, and this ADR must say so
explicitly rather than leave it inferred.
