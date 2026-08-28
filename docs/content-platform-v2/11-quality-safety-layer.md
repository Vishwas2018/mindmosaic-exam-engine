# Question Quality Safety Layer

**Status:** implemented and locally database-verified on 2026-08-26.

## Two-pass review

Pass 1 receives the learner-visible question without answer key, explanation, validator result or private evidence. It returns a concise blind answer plus structured ambiguity, visual-semantic, assessment-fit and Australian-English findings. Pass 2 is content-hash-bound to pass 1, reveals the declared key and learner explanation, and records answer agreement and explanation quality. No chain-of-thought is requested or stored.

Automatic eligibility requires `clear`, uniquely defensible, sufficient information, `supported` visual status, `appropriate` assessment fit, no Australian-English issue, answer agreement, `good` explanation and outcome `pass`. Every other outcome escalates or blocks.

## Deterministic prechecks

Code blocks missing/wrong referenced visual types, duplicate normalised options, exact corpus stem/stimulus duplication, stale/missing asset revisions, hash mismatch and alt-text answer leakage. It raises risk for repeated templates, distractor structures, explanations, visuals and Australian-English issues. Semantic correctness, ambiguity and year/style fit remain independent-review judgements rather than false deterministic claims.

## Live proof

The full 40-migration history applies from zero with no drift. The RLS suite proves learner isolation, authenticated owner-only approval, immutable evidence/revisions, stale-hash rejection and no authenticated publication write. Runtime delivery remains unchanged.

## Pilot interpretation

The truthful 60-item manual pilot uses factory manifests whose generator identity is explicitly human. The 30-item Science pilot preserves its Codex origin. Both are database-ingested and retried idempotently. Publication dry-runs remain blocked until a real independent review and owner action exist. The Science opposite-family review cannot be claimed without Claude credentials.
