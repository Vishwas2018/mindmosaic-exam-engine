# Prioritised Remediation Roadmap

Planning only; no fix was made during this audit.

## Phase 0 — Immediate containment and release blockers

1. **Keep release/public account expansion blocked.** Do not rely on stored scores or class separation until `SEC-001/002` are remediated.
2. **Close the database mutation boundary (`SEC-001`, `DATA-003`).** Inventory grants, revoke direct trusted writes, introduce narrow transactional RPC/server operations, and migrate policies without exposing a fail-open interval.
3. **Repair teacher/enrolment authority (`SEC-002`, `SEC-004`).** Require trusted teacher provisioning and controlled membership; audit existing class memberships before applying new reads.
4. **Sanitise post-login destinations (`SEC-003`).** One internal-route parser must cover password and OAuth paths.
5. **Patch security dependencies (`DEP-001`).** Use the smallest supported Next/transitive update, then run compatibility and security regression suites.
6. **Unify the authoritative deadline (`TIME-001`).** Prefer a persisted `deadline_at` derived from the governed pattern, with server time as authority.
7. **Correct immediate public truth (`PROD-001`, `BILL-001`).** Lead with Years 3/5 live scope and roadmap Family availability.
8. **Adopt an explicit launch/privacy hold (`PRIV-001`, `AUTH-001`).** No paid/public child-account launch before legal, retention/deletion and email recovery readiness.

**Verification gate:** adversarial RLS tests, redirect-vector E2E, all pattern boundary tests, clean dependency audit or documented accepted residuals, product-copy approval, and privacy launch checklist. Roll back policy migrations by restoring prior grants only in a controlled maintenance environment—never by temporarily granting broad writes.

## Phase 1 — Correctness, security and data integrity

1. Make submit retries return the existing immutable result (`FUNC-001`).
2. Build a mandatory production-bank provenance/review manifest and retrospectively review risk strata (`CONT-001`).
3. Replace/limit the false correctness heuristics and create an independent semantic gold set (`CONT-002`).
4. Make child provisioning and assignment creation compensating/transactional (`DATA-001/002`).
5. Add composite/in-function ownership/rubric invariants (`DATA-003`).
6. Configure defence headers (`SEC-005`) after route/OAuth compatibility tests.

**Prerequisites:** Phase-0 policy design and database backup/migration rehearsal. **Verification:** lost-response concurrency test; unreviewed-content rejection; failure injection after each write; header probes; full RLS matrix. **Rollback:** version RPCs/policies and retain read compatibility while writers migrate.

## Phase 2 — Core-flow, accessibility and test closure

1. Design and implement assignment start/resume/submit/status linkage (`FUNC-002`).
2. Compose teacher marks into auditable learner/parent results and aggregates (`FUNC-003`).
3. Correct active-session anti-join (`FUNC-004`).
4. Resolve full Vitest/Playwright liveness, make the gate stack deterministic, and require risk-appropriate CI jobs (`CI-001`).
5. Pin CI actions and declare permissions (`CI-002`).
6. Run manual browser/a11y certification at 320, 375, 768, 1024 and 1440 px, 200%/400% zoom, keyboard, reduced motion and screen readers.

**Prerequisites:** secure trusted writes and stable result model. **Verification:** one seeded journey per role, assignment and manual-mark end-to-end tests, two clean full CI runs, WCAG issue log. **Rollback:** feature-flag assignment/mark display until the whole state machine is deployable; never expose partial writes.

## Phase 3 — Architecture, performance and maintainability

1. Scope guest bank/session delivery and set transfer/parse budgets (`PERF-001`).
2. Split `/results` and `/showcase`, add bundle gate to CI (`PERF-002`).
3. Implement privacy-safe structured events, correlation IDs, health checks and critical alerts (`OBS-001`).
4. Generate current bank/route/type facts and archive historical status docs (`DOC-001`).
5. Approve one route/navigation contract and derive nav/sitemap/tests from it (`NAV-001`, `SEO-001`).
6. Remove or explicitly build-gate mock operations (`OPS-001`).

**Verification:** payload and chunk budgets; public sitemap crawl; docs drift test; staged alert exercises. **Rollback:** retain versioned guest asset/API and route redirects for one release window.

## Phase 4 — Future-scope enablement

1. Only after content/product approval, widen profile-year persistence and provisioning (`ARCH-001`).
2. Extend programme/paper configuration without duplicating timing/scoring authority.
3. Preserve explicit fixed-path/text-only adaptations until true adaptive testlets/audio/section locking exist.
4. Activate commercial billing only after real Stripe prices, refund terms, privacy/terms/accessibility review and entitlement decisions are consistent.
5. Add future programmes one at a time with governed content availability, claim tests and migration rehearsals.

## Safe sequencing summary

`contain public release → secure DB identity/mutations → unify deadlines/submit idempotency → govern content → repair transactions → close assignment/marking → stabilise CI/a11y → optimise/observe/document → enable future years/programmes`

The order matters: building assignment completion before securing direct writes would create more trusted fields an authenticated client can forge; recalculating marked results before defining an auditable result overlay would corrupt historical interpretation; widening years before content availability would make roadmap entries appear usable.

## Definition of ready for re-audit

- Every P1 has a committed fix and an independent failing-before/passing-after test.
- Full core, RLS, E2E, content, bundle, build and dependency gates pass twice from a clean checkout.
- The privacy/legal/email checklist is signed by accountable owners.
- Public hero, pricing, route map and live catalogue agree.
- A staged learner can complete an assigned timed paper, survive a lost submit response, receive a teacher mark, and see the same final state as parent/teacher without direct trusted DB writes.
