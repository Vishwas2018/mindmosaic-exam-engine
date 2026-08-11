# Goal-to-Implementation Deviations

## Bidirectional traceability matrix

| Goal or promise | Source / intended phase | Implementation evidence | Runtime/tests | Status | Deviation / severity |
| --- | --- | --- | --- | --- | --- |
| Original Years 3/5 NAPLAN-/ICAS-style practice | AGENTS, README, legal pages; current | 965-bank, patterns, schemas, renderers | Validation/build and targeted tests pass | Implemented and verified | External originality remains unprovable from source alone |
| 14 question and 10 visual types | README/current | Registries, schemas, components, bank examples | Focused renderer/registry tests pass | Implemented and verified | Fresh rendered audit blocked |
| Server-authoritative scoring; client cannot alter result | security/privacy docs; current | Submit route recomputes result | Route tests pass | Implemented but defective | Direct authenticated DB insert accepts trusted `result` (`SEC-001`, P1) |
| Tenant-safe RLS | privacy/security docs; current | RLS enabled on exposed tables | Static policy reconstruction | Implemented but defective | Class ownership is not role-bound (`SEC-002`, P1) |
| Pattern-faithful timing | exam-pattern docs; current | Create/resume use pattern duration | Submit uses count-derived duration | Implemented but defective | Conflicting deadline authority (`TIME-001`, P1) |
| Duplicate-submit protection | security docs; current | Unique `session_id` constraint | Focused tests pass | Implemented and verified, incomplete recovery | Collision is blocked but successful lost-response retries strand client (`FUNC-001`, P1) |
| Resume interrupted attempt | README/docs; current | Autosave and active route | Unit tests pass | Implemented but defective | Most recent submitted session masks older open session (`FUNC-004`, P2) |
| Teacher assignments | route/nav/current UI | Teacher creation + student list | Route/component tests | Implemented but incomplete | No Start/status/attempt linkage (`FUNC-002`, P1) |
| Teacher manual marking | route/nav/current UI | Marking queue/API/table | Route/queue tests | Implemented but incomplete | Marks do not update result/history/insights (`FUNC-003`, P1) |
| Meaningful parent insights | product principle/current | Real attempt aggregates and weak-skill actions | Focused summary tests | Implemented but incomplete | Manual marks never contribute; avoid claiming closed-loop marking |
| Full independent answer correctness | README/CI/current | Heuristic checker | Default gate: 4 failures, 877 editorial warnings | Documented current scope but missing | Checker is both incomplete and false-positive-prone (`CONT-001`, `CONT-002`) |
| Governed publication | factory docs/current | Strong factory states/reviews/hashes | Extensive factory tests | Implemented but bypassable | Hand-authored live bank imports do not require factory evidence (`CONT-001`, P1) |
| Fixed-path NAPLAN-style, not official simulation | fidelity docs/current | Adaptation flags/disclosure UI | Pattern/E2E specifications | Implemented and verified | Marketing term “simulation” should stay qualified |
| Text-only spelling adaptation | fidelity docs/current | `text_only_spelling` flags | E2E asserts disclosure | Implemented and verified | No defect; audio remains future scope |
| Broader K–12 learning OS | supplied north star/future | Years 1–12 taxonomy/catalogue scaffolding | No live learning pathways | Future scope | DB profile year check remains 3/5 (`ARCH-001`, P3 roadmap constraint) |
| Primary/secondary, curriculum, AMC/selective challenge platform | landing hero/SEO/current-facing | Catalogue marks most coming soon | Static copy | Contradictory scope | Hero leads with unavailable breadth (`PROD-001`, P1) |
| Family prices are live and charged | landing plans/current-facing | Prices explicitly placeholder; availability roadmap | CTA registers interest | Contradictory scope | Intro contradicts implementation/legal pages (`BILL-001`, P2) |
| Child privacy/data control | privacy/current launch | Data minimisation and RLS architecture | Retention/deletion absent by admission | Contradictory scope | Not launch-ready (`PRIV-001`, P1) |
| Canonical public navigation | audit baseline/current governance | Later `content.ts` uses more routes and `/sign-in` names | Navigation tests enforce later map | Contradictory/superseded | Decision is not formally reconciled (`NAV-001`, P2) |
| Release gates | AGENTS/CI/current | typecheck, lint, build, validation, checker, tests | Several pass; checker/bundle fail; suites hang locally | Implemented but defective | CI cannot be green at audited commit (`CI-001`, P2) |
| Production security posture | security docs/current | Origin checks, safe projections, RLS | Header probe/audit | Implemented but defective | No defence headers and vulnerable deps (`SEC-005`, `DEP-001`) |
| Operations console | dev mockup/unspecified | `/admin/operations` uses mock jobs | Build exposes admin route | Rejected/legacy | Labelled mock but remains product code (`OPS-001`, P3) |

## Promise without delivery

The material promise gaps are current broad-platform marketing (`PROD-001`), server-authoritative database guarantees (`SEC-001`), assignment and marking lifecycle completion (`FUNC-002`, `FUNC-003`), independently verified content (`CONT-001`), live-price wording (`BILL-001`) and release/privacy readiness (`PRIV-001`, `CI-001`). These are not future-feature complaints: current UI, policies or documentation describe the capabilities as present.

## Implementation without governed purpose

- `/admin/operations` deliberately renders mock queue rows and local retry state. It is labelled honestly, so this is P3 cleanup rather than deception.
- `/showcase` is a useful renderer/a11y harness but ships as a public static route and exceeds its budget. It needs an explicit production purpose or build-time exclusion.
- Stripe routes are implemented while `FAMILY_PLAN_AVAILABILITY` remains `roadmap`; this can be valid staging, but the commercial/legal activation sequence must be governed.

## Roadmap constraints

The core schema/type design is more extensible than the early README suggests: programme, subject and Years 1–12 registries exist. The principal hard constraint is `profiles.year_level IN (3,5)` and the provisioning allow-list. Pattern-specific duration logic is duplicated across modules, which already produced `TIME-001` and will become harder as programmes multiply.

## Naming and route contradictions

The repository mixes Grade/Year, exam/assessment/practice and Language/Language Conventions/spelling subject groupings. Most are presentation aliases backed by registries, but README and navigation governance lag the actual route tree. The supplied canonical `/login` and `/signup` paths do not exist; the checked-in later decision uses `/sign-in`, `/sign-up`, `/resources`, `/learn` and `/exam-preparation`. This was classified ambiguous rather than treated as a broken future requirement.
