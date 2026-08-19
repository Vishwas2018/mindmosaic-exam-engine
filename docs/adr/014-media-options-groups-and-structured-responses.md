# ADR-014: Media, rich options, item groups and structured responses

Status: accepted for additive implementation  
Date: 2026-08-16

## Decision

Audio and structured visuals are presentation capabilities, not question types. Option-based questions may reference a governed structured visual. Audio authoring records use governed local paths or private `assessment-media/audio/` object references; learner DTOs never contain bucket/object details or non-learner transcripts.

Shared stimuli use immutable `item_group_versions` with ordered, version-pinned stimulus and child-item memberships. Children retain their normal question types and independent responses/answer versions. Session ledger rows optionally pin the group version and group ordinal.

`structured_response` is the only new response type because existing keys cannot represent part marks, hybrid marking, or rubric-versioned part evidence cleanly. Algebraic-expression equivalence is deferred; numeric tolerance and bounded short-text matching are the only automatic part rules.

Assessment families, programmes and offerings are stable text-backed reference rows. Programme configuration carries external-format adaptations. Valid offerings remain independent from content-readiness calculations.

## Security and privacy

Private media scripts live in a separate table with no learner privileges. Candidate projection positively selects media fields and includes transcript text only when visibility is `learner`. Playback evidence contains identifiers, ordinal and time only. Group candidate delivery continues through the session allocation boundary; no content table is learner-readable.

## Version governance

The question/factory schema and both prompt shapes changed, so new factory work uses schema `2`, generation prompt `v2`, and review prompt `v2`. Taxonomy remains `1` because no taxonomy entries changed. Existing persisted manifests, item versions, attestations and fixtures retain their recorded v1 tags and hashes; they are not rewritten. Current factory validation intentionally requires v2 for new or resumed candidates, so a v1 in-flight candidate must be explicitly regenerated and re-reviewed. Historical provenance schemas continue to read recorded version strings.

## Deferred work

Private Storage delivery requires an authenticated same-origin endpoint that authorizes the allocated session item and creates a short-lived signed URL. Until enabled, private-storage audio offerings remain not ready and the text-only spelling adaptation remains active. Adaptive MST itself and mathematical-expression equivalence remain out of scope.
