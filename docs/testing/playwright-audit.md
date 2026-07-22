# Playwright audit and validation plan

## Scope

This repository already has strong Playwright coverage for the deterministic exam flow, renderer showcase, accessibility, and core public routes. The gap addressed here is a lightweight layer for public-route stability: shared helpers, route-shell checks, and a focused regression suite that protects the stable user journeys without duplicating the detailed flow tests.

## Coverage inventory

- Functional E2E coverage: [e2e/smoke.spec.ts](e2e/smoke.spec.ts), [e2e/catalogue.spec.ts](e2e/catalogue.spec.ts), [e2e/exam-flows.spec.ts](e2e/exam-flows.spec.ts), [e2e/renderer-showcase.spec.ts](e2e/renderer-showcase.spec.ts)
- Responsive screen validation: [e2e/screen-validation.spec.ts](e2e/screen-validation.spec.ts) with shared helpers in [e2e/helpers/screen-helpers.ts](e2e/helpers/screen-helpers.ts)
- Accessibility coverage: [e2e/accessibility.spec.ts](e2e/accessibility.spec.ts)
- Visual snapshot coverage: not introduced in this pass; the new suite uses responsive assertions and viewport checks instead of screenshot baselines
- Authenticated coverage: still intentionally blocked for this pass because the repository does not currently provide a stable local Supabase-backed test environment

## Added structure

- Shared route helpers live in [e2e/helpers/screen-helpers.ts](e2e/helpers/screen-helpers.ts)
- A focused responsive regression suite now lives in [e2e/screen-validation.spec.ts](e2e/screen-validation.spec.ts)

## Guardrails

- Keep browser assertions anchored to semantic roles and test IDs that already exist in the app.
- Prefer stable content, layout, and viewport checks over broad screenshot assertions.
- Avoid adding authenticated tests unless a local Supabase-backed test environment is available.
