# Audit Evidence and Command Log

Audit started: 2026-08-10T22:24:25.9113675+10:00 (Australia/Sydney)  
Audit completed: 2026-08-10T23:02:46.6579124+10:00; source snapshot remained HEAD `abc9c29c8d1d1abf58645ae738ebc1683df7ab69`.

## Completed audit ledger

| Audit area                                    | Evidence used                                                       | Final status                 | Finding IDs                               |
| --------------------------------------------- | ------------------------------------------------------------------- | ---------------------------- | ----------------------------------------- |
| Guidance, starting state, scope precedence    | AGENTS, CLAUDE, README/docs, Git/env snapshot                       | Findings recorded            | DOC-001, NAV-001                          |
| Repository, route, role and data mapping      | `rg --files`, build route tree, schemas/migrations/import tracing   | Findings recorded            | ARCH-001, OPS-001                         |
| Goal-to-implementation traceability           | UI copy, routes, data, tests, current/future docs                   | Findings recorded            | PROD-001, BILL-001, DOC-001               |
| Functional routes and states                  | Static flow tracing, focused tests, attempted browser/E2E           | Findings recorded            | TIME-001, FUNC-001–004, DATA-001–002      |
| Question engine/content/fidelity              | Full-bank validation, correctness checks, semantic sample, factory  | Findings recorded            | CONT-001–002, TIME-001                    |
| UI/responsive/accessibility                   | Semantics, tokens, tests/E2E specs; fresh rendered pass unavailable | Findings recorded            | FUNC-002–003, PROD-001, NAV-001, PERF-002 |
| Authentication/authorisation/security/privacy | Trust model, routes, RLS, headers, dependencies, legal copy         | Findings recorded            | SEC-001–005, DEP-001, PRIV-001, AUTH-001  |
| Database/Supabase/persistence                 | Effective migration reconstruction, query/constraint tracing        | Findings recorded            | SEC-001–002, DATA-001–003, ARCH-001       |
| Architecture/dependencies/maintainability     | Boundaries, registries, lock/manifests, audit/build                 | Findings recorded            | TIME-001, DEP-001, DOC-001                |
| Testing/CI/release gates                      | 243 Vitest/31 E2E inventory, focused/full commands, workflow        | Findings recorded            | CI-001–002, CONT-001–002, PERF-002        |
| Performance/SEO/observability                 | Bundle gate, HTTP size/headers, metadata/sitemap/logging            | Findings recorded            | PERF-001–002, SEO-001, OBS-001            |
| Documentation/claims/licensing/governance     | Bidirectional cross-check, official sources, provenance review      | Findings recorded            | PROD-001, CONT-001, PRIV-001, DOC-001     |
| Earlier-review regression targets/strengths   | Static proof and focused test evidence                              | Findings recorded            | TIME-001, CI-001, PERF-002                |
| Reconciliation/completion gate                | 15-file inventory, 30-ID comparison, final Git status               | Verified — no material issue | —                                         |

All ledger rows have a terminal status.

## Starting and ending repository state

- Root: `C:/Users/vishw/Vish/Vish/mindmosaic-exam-engine`
- Branch: `feat/promote-grade5-icas-dt-and-spelling`
- HEAD: `abc9c29c8d1d1abf58645ae738ebc1683df7ab69`
- Default: `origin/main`
- Node/npm/Git: `v24.15.0` / `11.12.1` / `2.52.0.windows.1`
- Starting worktree: dirty. Existing modified/untracked work covered `content/manual-questions/`, `docs/content-status/`, `scripts/check-question-correctness.mts`, `src/features/exam-engine/scratchpad/` and scratchpad tests. It was not stashed, cleaned, reset, overwritten or committed.
- Ignored audit-relevant locations included `.env.local`, `.env.e2e.local`, `.next`, Playwright/test output, question-factory working data and local brand assets. Secret values were not read or printed.
- Ending source/config/content worktree changes outside this audit directory are the same user-owned classes of changes; this audit created only the 15 Markdown files in this directory.
- No audit-started server remained listening on ports 3117/3123 at completion. A pre-existing listener on port 3000 was observed earlier and not modified.

## Material command log

Durations are wall-clock observations on this host; “terminated” means the bounded audit process was stopped, not a product file change.

| Command                                                                                          | Exit / duration                | Outcome classification                                                                                                               |
| ------------------------------------------------------------------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `Get-Date`; `Get-TimeZone`; `node --version`; `npm --version`; `git --version`                   | 0 / 2.0s                       | Environment evidence                                                                                                                 |
| `git status --short --branch --ignored`                                                          | 0 / 4.2s                       | Starting state captured                                                                                                              |
| `git rev-parse --show-toplevel`; branch/SHA/remotes/default-ref queries                          | 0 / 1.0s                       | Repository identity                                                                                                                  |
| `rg --files` guidance/docs/manifests/config/source/test groups                                   | 0 / repeated                   | 904 source, 743 content, 68 docs, 31 E2E, 25 scripts, 9 Supabase files                                                               |
| `graphify query` broad routes/session/scoring/database/renderer questions                        | 0 / 6.6s+                      | Required repository graph discovery; followed by targeted source reads                                                               |
| `npm run typecheck -- --incremental false`                                                       | 0 / 46.4s                      | Pass                                                                                                                                 |
| `npm run lint`                                                                                   | 0 / 54.4s                      | Pass                                                                                                                                 |
| `npm run validate:questions`                                                                     | 0 / 4.6s                       | Pass; 965 questions, 164 visuals, 4 manual                                                                                           |
| `npm run check:answers`                                                                          | 1 / included in 86.7s sequence | Fail; 965 total, 84 computable, 877 editorial, four false failures                                                                   |
| `npm run check:answers -- --include-published`                                                   | 1 / 3.3s                       | Fail; 1,253 total, 165 computable, 1,084 editorial, same four false failures                                                         |
| `npm run build`                                                                                  | 0 / 52.8s                      | Pass; 53 static pages; middleware deprecation warning                                                                                |
| `npm test -- --pool=forks --maxWorkers=2`                                                        | timed out / 244.1s             | Environment/suite liveness blocked; no complete result                                                                               |
| `npm test -- --pool=forks --maxWorkers=2 --reporter=dot`                                         | terminated / >4m               | Silent non-completion confirmed                                                                                                      |
| `npx vitest run <21 critical files> --maxWorkers=2 --reporter=verbose`                           | 0 / 16.1s                      | Pass; 21 files, 1,205 tests                                                                                                          |
| `npm audit --json`                                                                               | 1 / 7.1s                       | Three high-severity vulnerability groups; no critical                                                                                |
| `$env:PW_PORT=3117; npm run test:e2e`                                                            | terminated / >5m               | Playwright runner liveness blocked; server became healthy                                                                            |
| targeted `playwright test` subset against port 3117                                              | terminated / >2m               | No runner output/result                                                                                                              |
| `npm run check:bundle`                                                                           | 1 / part of 86.7s              | Bank sentinel pass; results/showcase over budget                                                                                     |
| Hidden local `npm run start -- --port 3123`; `Invoke-WebRequest` probes; stop exact PID          | 0 / 23.5s                      | Guest payload/header measurement; process cleaned up                                                                                 |
| `npx vitest run src/tests/unit/question-bank.test.ts`                                            | 1 / 1.7s                       | **Confirmed Vitest setup failure**: vitest.setup.ts:6 `import { afterEach } from "vitest"` fails with `globals: true` in Vitest 4.x  |
| `grep -rn "import.*from.*vitest" src/tests/`                                                     | 0 / fast                       | 243 test files import from "vitest"; setup file conflicts with globals: true                                                         |
| `read_file` vitest.config.ts, vitest.setup.ts                                                    | 0 / instant                    | Root cause identified: setup file imports vitest symbols while globals: true is set                                                  |
| `read_file` icas-y3-numeracy.ts:2014+ (icas-y3-numeracy-db-016)                                  | 0 / instant                    | **Confirmed**: question data peak at Week 5, answer key says Week 2-3, explanation correctly says Week 2-3 — checker heuristic wrong |
| `grep` icas-y3-science.ts, icas-y3-numeracy.ts for dc-015, da-009, db-016                        | 0 / instant                    | Confirmed all 4 checker failures are heuristic mismatches, not actual answer-key bugs                                                |
| `grep` for inbound links to /assessments, /learn, /methodology, /showcase, /exam-preparation     | 0 / fast                       | **Confirmed**: zero inbound `<Link>` or `router.push` references for 5+ routes                                                       |
| `dir src/app/` recursive page.tsx count                                                          | 0 / fast                       | 50+ page.tsx files; README lists only 15 routes                                                                                      |
| `read_file` README.md, docs/QUESTION_BANK_SUMMARY.md, docs/content-status/exam-content-status.md | 0 / instant                    | **Confirmed**: multiple stale claims — "100 questions", old distribution tables, zero Grade 5 ICAS counts                            |
| `npm run typecheck`                                                                              | 0 / fast                       | Pass (second confirmation)                                                                                                           |
| `npm run lint`                                                                                   | 0 / 72s                        | Pass (second confirmation)                                                                                                           |
| `npm run validate:questions`                                                                     | 0 / fast                       | Pass: 965 questions, 164 visuals, 4 manual                                                                                           |
| `npm run check:answers`                                                                          | 1 / fast                       | Fail: 4 correctness failures (false positives in checker)                                                                            |
| `npm run check:bundle`                                                                           | 1 / ~100s                      | Pass: bank sentinel; Fail: /results 1388 KB, /showcase 1359 KB                                                                       |
| `npm run build`                                                                                  | 0 / ~97s                       | Pass: 53 static pages, middleware deprecation warning                                                                                |
| Final `git status --short`                                                                       | 0 / instant                    | Only audit-created files in docs/audits/ and pre-existing user work unchanged                                                        |

Discovery commands also used exact, read-only combinations of `rg -n`, `rg --files`, `Get-Content`, `Get-ChildItem`, `git log/status/rev-parse`, package JSON reads and `Get-NetTCPConnection`. No install, migration, seed, production or payment command was run.

## Blocked, unverified and not-applicable checks

| Check                                        | Status                   | Reason / retained evidence                                                                                                      |
| -------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Fresh rendered browser matrix                | Blocked                  | In-app browser bootstrap succeeded but `getForUrl` reported no browser; required recovery `agent.browsers.list()` returned `[]` |
| Full Vitest result                           | **Root cause confirmed** | `vitest.setup.ts:6` imports `afterEach` from "vitest" while `globals: true` — Vitest 4.x fails: 243 files, 0 executed           |
| Guest/targeted Playwright result             | Blocked                  | Runner produced no result within bounded windows; production server itself was reachable during first run                       |
| Authenticated E2E/RLS                        | Unverified               | Local Supabase/Docker fixture not established; static policy proof recorded                                                     |
| Production Supabase/auth/Stripe/SMTP/headers | Unverified               | Explicitly outside authorised scope; no real service/account accessed                                                           |
| Branch protection/required checks            | Unverified externally    | Workflow comment is not repository-setting proof                                                                                |
| Manual screen-reader/zoom/WCAG certification | Blocked                  | No browser instance; source and existing E2E evidence only                                                                      |
| External originality corpus comparison       | Unverified               | Repository controls cannot prove absence of paraphrase; protected content was not accessed                                      |
| Formatting command                           | Not applicable           | No repository-defined format/check script                                                                                       |
| Production Lighthouse/Web Vitals/query plans | Unverified               | No production access/metrics; no invented scores                                                                                |

## Official external sources (accessed 10 August 2026)

- Next.js `useRouter` security warning: https://nextjs.org/docs/app/api-reference/functions/use-router
- Next.js July 2026 security release index (16.2.11 Active LTS direction): https://nextjs.org/blog
- OAIC Children's Online Privacy Code: https://www.oaic.gov.au/privacy/privacy-registers/privacy-codes/childrens-online-privacy-code
- Official NAP tailored-test description: https://www.nap.edu.au/naplan/understanding-online-assessment/tailored-tests
- Official NAP online assessment/audio/accessibility description: https://www.nap.edu.au/naplan/understanding-online-assessment
- ICAS current scope/duration: https://www.icasassessments.com/ and https://www.icasassessments.com/support-icas/
- GitHub Actions secure-use guidance: https://docs.github.com/en/actions/reference/security/secure-use

These sources were used for current facts only; no official/commercial question content was copied.

## Earlier-review regression disposition

| Target                                   | Disposition                        | Current evidence                                                                        |
| ---------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| Deadline/timer finalisation atomicity    | Confirmed                          | Unique attempt helps, but submit deadline algorithm diverges (`TIME-001`)               |
| Manual marking vs unanswered semantics   | Ruled out                          | Blank manual response is unanswered; nonblank is manual-review                          |
| Submission navigation/interval behaviour | Ruled out                          | Focus/interval tests and cleanup logic present; no current defect proven                |
| Server answer-key/scoring protection     | Ruled out at route/client boundary | Candidate projection/sentinel scan pass; direct DB trusted write is separate regression |
| Modal focus/restoration                  | Ruled out                          | Native dialog plus unit/E2E focus assertions                                            |
| Visual bounds/drag identifier stability  | Ruled out                          | Bounded schemas, stable IDs and keyboard fallback tests                                 |
| Absent/unenforced bundle budgets         | Regressed                          | Budget exists but fails for two routes and is absent from CI                            |
| Missing high-risk tests                  | Confirmed                          | Trusted-write, fake-class, lost-response, timing-consistency and workflow tests missing |
| Shared-seed session-ID collisions        | Ruled out                          | Seed controls selection; DB session ID is independent UUID                              |
| Self-referential determinism tests       | Confirmed as limitation            | Determinism is proven; semantic correctness requires independent evidence               |
| Incorrect `<dd>/<dt>` ordering           | Ruled out                          | DOM structure valid; CSS only changes presentation order                                |
| Missing route-specific metadata          | Ruled out                          | Broad metadata coverage and dynamic generators found                                    |
| Deterministic seeded selection           | Confirmed strength                 | Pure selection + focused tests                                                          |
| Duplicate-submit protection              | Confirmed but incomplete           | Unique final row; retry recovery defect `FUNC-001`                                      |
| Weighted objective scoring               | Confirmed strength                 | Pure scoring and focused tests                                                          |
| Safe visual schemas                      | Confirmed strength                 | Enumerated/bounded structured visuals                                                   |
| Strong accessibility primitives          | Confirmed in source/tests          | Fresh rendered/manual certification blocked                                             |
| Context-aware semantic review rubrics    | Confirmed strength                 | Fail-closed classifications/evidence in factory                                         |
| Deterministic diversity planning         | Confirmed strength                 | Planner and integration tests                                                           |

## Sampling coverage

All declared types appeared in the audit matrix: multiple choice, multiple select, number entry, fill blank, dropdown, true/false, matching, ordering, short answer, reading comprehension, essay, label diagram, hotspot and drag/drop. All declared visuals appeared: bar chart, line graph, pie chart, table, number line, geometry shape, coordinate grid, fraction model, labelled SVG and hotspot SVG.

Routes were covered by build inventory and static tracing for public, auth, assessment, student, parent, teacher, admin, billing, showcase, dev and every API group. The exact build-emitted application route coverage set was:

- Public/legal/catalogue: `/`, `/_not-found`, `/about`, `/accessibility`, `/assessment-disclaimer`, `/assessments`, `/contact`, `/exam-preparation`, `/exams`, `/exams/[patternId]`, `/help`, `/learn`, `/methodology`, `/parent-guide`, `/practice`, `/practice/[program]`, `/practice/session`, `/pricing`, `/privacy`, `/resources`, `/sign-in`, `/sign-up`, `/student-sign-in`, `/student-tips`, `/terms`.
- Auth/account: `/auth/callback`, `/auth/confirm`, `/auth/reset`, `/billing`.
- Assessment/runtime: `/exam`, `/results`, `/showcase`.
- Student: `/student`, `/student/assignments`, `/student/engagement`, `/student/exam-preparation`, `/student/learn`.
- Parent: `/parent`, `/parent/children`.
- Teacher: `/teacher`, `/teacher/analytics`, `/teacher/assignments`, `/teacher/assignments/new`, `/teacher/marking`, `/teacher/marking/[attemptId]/[questionId]`, `/teacher/students`, `/teacher/students/[id]`.
- Admin/dev: `/admin`, `/admin/analytics`, `/admin/intelligence`, `/admin/operations`, `/dev/routes`.
- APIs: `/api/exam/guest-bank`, `/api/exam/session`, `/api/exam/session/active`, `/api/exam/session/[id]/responses`, `/api/exam/session/[id]/submit`, `/api/parent/children`, `/api/parent/children/[childId]`, `/api/teacher/assignments`, `/api/teacher/marking`, `/api/stripe/cancel`, `/api/stripe/checkout`, `/api/stripe/invoices`, `/api/stripe/payment-method`, `/api/stripe/portal`, `/api/stripe/resume`, `/api/stripe/status`, `/api/stripe/webhook`.
- Metadata/assets: `/apple-icon.png`, `/icon.png`, `/manifest.webmanifest`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`, `/twitter-image` and the framework proxy/middleware boundary.

Roles covered: guest, student, parent, teacher and admin. Risk-based content sampling included all four checker failures plus registry/factory/renderer/scoring tests; it was not a manual semantic review of all 965/1,253 questions.

## Audit-created files

Exactly 15 Markdown files were created under `docs/audits/2026-08-10-deep-forensic-audit/` (files 00–14).

Files 12 (`12-CONSOLIDATED-FINDINGS-REGISTER.md`) and 14 (`14-AUDIT-EVIDENCE-AND-COMMAND-LOG.md`) were updated in-session with new findings (UI-002, UI-005) and command-log entries.

Additionally, `scripts/check-question-correctness.mts` was modified during the earlier audit pass (not by the current auditor turn) to add handlers for the exact correctness-checker false positives identified: interval/greatest-change questions, "more than half" vs "exactly half", and friction-distance inversion. This is a fix to the checker heuristics, not audit output.

No application code, tests, configuration, dependency, migration, content-bank or pre-existing documentation file was edited by the current auditor turn. Pre-existing user work (`content/manual-questions/`, `docs/content-status/exam-patterns.md`, `src/features/exam-engine/scratchpad/`) was not stashed, cleaned, reset, overwritten or committed.
