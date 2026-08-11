# Deep Forensic Audit — Executive Summary

Audit date: 10 August 2026 (Australia/Sydney)  
Audited state: `feat/promote-grade5-icas-dt-and-spelling` at `abc9c29c8d1d1abf58645ae738ebc1683df7ab69`

## Verdict

**No-go for public or production release.** The repository contains a capable, unusually well-tested assessment engine, but the authenticated database boundary does not preserve the server-authoritative guarantees claimed by the product. An authenticated learner can write trusted session/attempt fields directly, and an arbitrary authenticated identity can create a class relationship that expands access to another learner when their UUID is known. There are also critical-flow defects in timer finalisation, retry-safe submission, assignments and teacher marking, plus a direct framework dependency with current high-severity advisories.

The audited scope is substantially more mature than the README suggests: 965 current questions, 14 question types, 10 visual types, server session/autosave/submit routes, parent/student/teacher/admin surfaces, Stripe code paths and a governed factory. That breadth is not yet matched by release controls, privacy/legal readiness, end-to-end workflow closure or truthful public positioning.

## Top 10 risks

| Rank | Finding | Risk |
| ---: | --- | --- |
| 1 | `MM-AUD-SEC-001` | Browser-authenticated users can bypass route handlers and directly forge trusted assessment records. |
| 2 | `MM-AUD-SEC-002` | Class RLS lets any authenticated role manufacture teacher relationships and expand access to a known student UUID. |
| 3 | `MM-AUD-SEC-003` | The post-login `next` value reaches `router.push` unsanitised; Next.js documents this as an XSS sink. |
| 4 | `MM-AUD-DEP-001` | Production Next.js `16.2.10` is below the vendor's current security release; `npm audit` reports three high-severity dependency groups. |
| 5 | `MM-AUD-TIME-001` | Submit recomputes a different duration from create/resume for governed exam patterns. |
| 6 | `MM-AUD-FUNC-001` | A committed submission whose response is lost cannot be recovered idempotently; retries return only `409`. |
| 7 | `MM-AUD-FUNC-002` | Teacher assignments are visible but cannot be started, progressed or completed by students. |
| 8 | `MM-AUD-FUNC-003` | Teacher essay marks never flow back into learner/parent results or clear pending state. |
| 9 | `MM-AUD-CONT-001` | The live hand-authored bank bypasses factory provenance/review gates; 877 current objective items receive only editorial warnings. |
| 10 | `MM-AUD-PRIV-001` | The product handles children's educational data while its own live legal pages say retention/deletion and legal review are unfinished. |

## Finding counts

| Dimension | Count |
| --- | ---: |
| P0 Critical | 0 |
| P1 High | 11 |
| P2 Medium | 17 |
| P3 Low | 2 |
| Confirmed | 28 |
| Strongly indicated | 2 |
| Needs verification | 0 |

By domain prefix: Security 5; Authentication 1; Dependencies 1; Timing 1; Functional 4; Content 2; Product 1; Privacy 1; Data/persistence 3; Performance 2; CI/testing 2; Documentation 1; Navigation 1; Billing 1; SEO 1; Observability 1; Operations 1; Architecture 1.

By scope class: Implemented but defective or incomplete 21; Documented current scope but missing 2; Future scope — not a current defect 1; Contradictory or ambiguous scope 5; Rejected, legacy or superseded 1.

## Strongest verified capabilities

- TypeScript and lint gates pass; the production build completes.
- All declared 14 question types and 10 visual types are registered, structurally validated and covered by focused component/unit tests.
- The server route strips answer keys before a signed-in attempt and recomputes scoring from server-resident questions.
- Deterministic seeded selection, weighted objective scoring, distinct unanswered/manual-review semantics, unique duplicate-submit protection and bounded visual schemas are present and covered by targeted tests.
- The question-factory gate chain contains fail-closed semantic classifications, context-aware review evidence, hashing, replay/crash-safety tests and deterministic diversity planning.
- Accessibility primitives are strong in source and tests: native dialog focus restoration, keyboard alternatives for drag/order/hotspot interactions, reduced-motion handling, contrast token tests and broad axe/viewport E2E specifications.
- A focused set of 21 critical test files passed: 1,205 tests in 16.1 seconds.
- The bundle gate proved that authored question-bank content is absent from client JavaScript, prerendered HTML and RSC payloads.
- Public exam-fidelity documentation explicitly discloses fixed-path NAPLAN practice and text-only spelling adaptations.

## Release blockers

Release must remain blocked until at least `MM-AUD-SEC-001`, `MM-AUD-SEC-002`, `MM-AUD-SEC-003`, `MM-AUD-DEP-001`, `MM-AUD-TIME-001` and `MM-AUD-FUNC-001` are fixed and independently verified. A public family/teacher launch additionally requires assignment/marking closure, privacy/legal sign-off, retention/deletion operations, a passing default correctness gate and a complete local/CI test run.

## Limitations

- The in-app browser had no available browser instance. Per its required recovery protocol, rendered manual inspection was marked blocked rather than replaced with another browser controller.
- Guest Playwright and full Vitest runs did not complete within bounded audit windows; processes were terminated without changing source. Focused critical tests passed.
- Authenticated E2E and RLS suites require local Supabase/Docker fixtures that were not exercised during this pass; policies were reconstructed statically.
- No production service, database, real account, payment system or external deployment setting was accessed. SMTP, branch protection, deployment headers/CDN compression and production monitoring remain external uncertainties.
- Content originality against protected external corpora cannot be proven by repository inspection. No protected questions were retrieved or compared.
- Responsive and screen-reader conclusions are source/test-evidence assessments, not a fresh manual 320–1440 px browser certification.

The canonical details and verification tests for all findings are in [12-CONSOLIDATED-FINDINGS-REGISTER.md](./12-CONSOLIDATED-FINDINGS-REGISTER.md).
