# ADR-011: Adaptive reporting and calibration claims

- **Status:** proposed
- **Date:** 2026-08-12
- **Spec:** §9.8, §14.4, §15, §21 Phase 5
- **Phase:** 5

## Placeholder

Reporting today is a percentage plus per-question detail computed by the pure
`buildExamResult`, and every learner-facing number is directly derived from
marks. Adaptive delivery breaks that correspondence: a raw percentage across a
routed path is not comparable between learners, and a provisional ability
estimate from an uncalibrated pool is not a measurement. This ADR must decide
what may be shown, to whom, and with what qualification during the adaptive
pilot — banded versus numeric provisional ability (deferred by spec §24),
whether provisional results are isolated from or adjusted for the route taken,
and what a parent or teacher is told about comparability. It must also govern
calibration claims: `item_calibrations` is append-only and versioned by
algorithm and model, recalibration MUST NOT mutate item content, and a
`provisional` or `stale` calibration status MUST NOT be presented as a
calibrated measurement. Spec §5.4 requires authored facts and measured estimates
to stay separate, and this ADR is where that separation becomes a
learner-facing rule. Until it is accepted, conservative claims are the default.
