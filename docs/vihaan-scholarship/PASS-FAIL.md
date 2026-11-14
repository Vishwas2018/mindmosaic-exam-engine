# Vihaan 20-question pilot ? PASS/FAIL and quality assessment

13 November 2026, Australia/Sydney. Worktree: `C:/Users/vishw/AppData/Local/Temp/mindmosaic-vihaan`, branch `feat/vihaan-scholarship-prep`.

**Overall: FAIL release readiness; FAIL expansion readiness.** The introductory pilot is drafted and passes local automated checks. It is not a validated-and-human-approved bank. All content remains private draft material. The remaining 380 questions were deliberately not generated following the pilot quality assessment. No content was ingested, staged, approved, published, deployed or merged; no production database or publication workflow was changed.

## Actual content counts

| Subject | Drafted | Automated PASS | Rejected | Pending human review | Approved / published |
|---|---:|---:|---:|---:|---:|
| Mathematics | 6 | 6 | 0 | 6 | 0 / 0 |
| Numerical Reasoning | 5 | 5 | 0 | 5 | 0 / 0 |
| Verbal Reasoning | 4 | 4 | 0 | 4 | 0 / 0 |
| Reading Comprehension | 3 | 3 | 0 | 3 | 0 / 0 |
| Written Expression | 2 | 2 | 0 | 2 | 0 / 0 |
| Total | 20 | 20 | 0 | 20 | 0 / 0 |

Automated PASS and pending-review counts overlap. Final publication-eligible count is **0**. No draft was permanently rejected; adversarial mutations used in tests are synthetic fixtures and do not count as generated questions. Final provisional difficulty: 8 easy, 9 medium, 3 challenging. The challenging labels belong to two mathematics items and one writing task and still need human calibration.

## Content and governance gates

| Gate | Result | Evidence / limitation |
|---|---|---|
| Existing production schema compatibility | PASS | All 20 also pass a stricter draft-only pilot envelope; existing taxonomy used for 18 objective items. |
| Arithmetic recomputation | PASS | 11/11 mathematics/numerical stems parsed in full and solved from stated givens; exactly one numeric/colour option matches. No declared answer or working enters recomputation. |
| Explanation/working consistency | PASS, structural only | All 20 explanation strings agree with their worked steps. This does not prove semantic correctness of every sentence. |
| Existing scorer compatibility | PASS | Correct/wrong objective options use existing scoreQuestion; essays remain manual and earn no automatic marks. |
| Internal exact/near duplication | PASS, bounded | No exact stems or near-stem flags against 1,761 internal comparison records or within the pilot; Jaccard threshold 0.82. Shared reading passage is intentional. Corpus scope and hashes in validation-report.json. |
| Unsupported interactions, metadata and markup | PASS for pilot | No visuals/media/HTML/URLs; strict interaction, metadata and option contracts. Mutation tests reject unsupported content, keys, metadata leakage and fabricated approval. This is not a universal semantic safety detector. |
| Australian English and age suitability | FAIL clearance | en-AU schema and a limited spelling/markup screen pass; full human language and suitability review remains pending for all 20. |
| Originality clearance | FAIL clearance | Newly authored in this session without external source material. Internal similarity assessment only; no external corpus search, global originality proof or copyright clearance. Human assessment required. |
| Blind reasoning/reading advisory | PASS, advisory only | 12/12 keys independently selected by separate OpenAI agent, both initial and final packets. No material ambiguity found. Exact-file bindings recorded. |
| Required independent-review clearance | FAIL / pending | Separate agent is same-provider OpenAI. It is not different-provider production-grade review, authenticated factory evidence or human approval. 12 reasoning/reading items remain pending that gate. |
| Mathematics/writing independent editorial review | FAIL / pending | Not performed. Numeric recomputation is narrower than editorial interpretation or rubric review. |
| Writing assessment | PASS draft structure; FAIL approval | Two tasks, task-specific planning/success criteria, illustrative partial responses, existing six-criterion scholarship rubric v1. No single correct essay; no live marking connection. |
| Difficulty calibration | FAIL expansion readiness | Revised inflated labels after blind review. Reasoning mostly easy or easy?medium; no empirical learner calibration or scholarship score prediction. |
| Human sign-off | FAIL / pending | approvedBy remains null; 0 named human approvals. Worksheet is not an approval artefact. |
| Student serving isolation | PASS | Real canonical published-bank integration test selects no pilot draft, including weak-topic requests. No runtime import of pilot content; no new student content endpoint. |
| ADR-017 integrity | PASS boundary preserved | No legacy import/admission controls changed. Local solvers/hashes do not constitute D1/D2/D3 attestations, signatures or admission evidence. |
| Randomised practice / revision planning | PASS planning seam | Fisher?Yates without replacement; subject and weak-topic filters; canonical server gateway first. Actual published pilot pool is empty. |
| Genuine progress | PASS pure calculations; FAIL live integration | De-duplicates response IDs, excludes omissions/invalid rows/manual writing from accuracy, requires five distinct questions before weakness recommendations. No persistence/fetch adapter or improvement-trend measurement is connected. |
| Lessons and full mock examinations | FAIL / pending | Existing governed lesson/pattern/session infrastructure inspected; no unapproved item integrated. No complete pilot lesson set or mock paper assembled. Future section quotas and passage grouping must pass existing gates. |
| Qwen drafting | FAIL availability | No connector found; no local Ollama executable found; localhost endpoint failed to connect. Drafted by Codex instead. Optional local-only Qwen capture adapter added but not exercised with a model. |

## Observed verification

| Check | Result | Actual observation |
|---|---|---|
| Pilot validation CLI | PASS | 20 automated passes, 0 rejected, 20 human-pending; 11 numeric passes; corpus 1,761. |
| New pilot tests | PASS | 12 tests across pilot.test.ts and pilot-runtime.test.ts in the focused integration run. |
| Focused pilot + existing integrity/solver integration | PASS | 5 files, 66 tests passed: pilot, pilot-runtime, publication-integrity, scholarship-draft-validator and scholarship-solvers. |
| Existing scholarship-prep feature suite, earlier snapshot | FAIL | 24 passed, 1 failed (25 total). Existing preview feature-flag test expected allowed=true for a mismatched binding. Assertions unchanged. |
| Full unit suite | FAIL | 409 files: 401 passed, 8 failed. 7,017 tests: 7,007 passed, 10 failed. Duration 731.58 seconds. Full run retained as failed regardless of targeted reruns. |
| Typecheck, latest snapshot | FAIL | Concurrently edited VihaanParentDashboard.tsx has unmatched JSX tags/parser errors at lines 14, 61, 83, 85 and 86. No pilot-file diagnostic was emitted in that run; parsing failure prevents claiming full type verification. Earlier snapshot also reported flag env typing and disabled attributes on anchors in existing Vihaan files. |
| Repository lint | PASS with warnings | npm.cmd run lint exited 0: 0 errors, 8 warnings in existing/shared files. Later-added review-sheet script and runtime test also lint clean. |
| Changed pilot code scoped lint | PASS | Validator, draft adapter, practice helper/server seam, pilot tests and edited dashboard files emitted no lint diagnostics. |
| Mechanical design detector | PASS | No findings on the three earlier edited UI components. Browser/visual inspection not performed. |
| Review artefact binding | PASS | Exact-file advisory hashes verified; worksheet batch hash matches the validation report. Hashes are local draft bindings, not governance clearance. |
| Build, RLS, browser E2E, authenticated E2E | NOT RUN | No PR submitted; full pre-PR gate is not claimed. No isolated backend/session integration or browser QA verified. |

The default sandbox prevented esbuild from reading ancestor directories of the user-specified Temp worktree. Retrying the test command with approved expanded execution allowed the focused tests to run. This was a filesystem access issue, not a skipped assertion. Windows npm.ps1 was blocked by shell policy; npm.cmd/npx.cmd were used instead.

### Targeted rerun of the eight failed files

**FAIL:** 6 files passed, 2 failed; 81 tests passed, 3 failed (84 total), 6.68 seconds. The admin-draft-review file, including unsigned-draft refusal, passed in this rerun. The earlier timeout cases and teacher wizard assertions also passed on this run; that does not erase their full-suite failures or establish the cause.

Reproducible failures: shared navigation placeholder links and the preview feature-flag expectation. A second navigation failure appeared for the concurrently added `/student/vihaan/diagnostic` route lacking an in-product way back. Those shared UI/flag files were left untouched per the user's instruction. Rerun all gates on a stable, coordinated worktree before proposing release.

### Full-suite failure detail

- parent-curriculum-explorer: search/clear test timed out at 5 seconds.
- teacher-assignment-wizard: one timeout and one missing Instructions label assertion.
- admin-draft-review: source-boundary scan timed out, then unsigned-draft refusal assertion resolved unexpectedly. This guard failure was not dismissed; targeted rerun result is recorded below.
- catalogue-card-counts: one timeout.
- exam-responses-route: unauthenticated guard test timed out.
- navigation-graph: found placeholder href="#" in five shared Vihaan UI components (CasualPractice, ConceptLearning, MockExams, SamplePapers, WritingPractice).
- scholarship-sample-preview-routes: one timeout.
- scholarship-prep feature-flag: existing preview binding expectation failed.

The worktree changed concurrently during these checks. These are observed snapshot results, not proof that every failure predates this task or will reproduce on a settled branch. No assertions, timeouts or test configuration were weakened. Final focused pilot/integrity rerun after the last progress-helper correction: **66/66 passed**, 5/5 files, 3.81 seconds. All writing outcomes, including assessed essays, are excluded from objective accuracy.

## Quality assessment and required next work

The strengths are explicit mathematical constraints, reproducible numeric answers, worked explanations, no material answer ambiguity in the reviewed packet, an original coherent reading passage and open-ended writing tasks tied to the existing rubric. The final reading passage is 207 whitespace-separated words, adequate for a short diagnostic. Arun explicitly checks leg lengths in the amended version; the reviewer confirmed this resolves the earlier mechanical gap.

The main weakness is discrimination for an above-average Year 5 student. Several reasoning questions supply the operation or are readily solved through option elimination. The reading theme is stated directly, then demonstrated; the three questions cover a narrow band. In r02, absolute distractors are easy to eliminate. In r03, distractors are contradicted or unrelated and the correct option is more abstractly phrased. Key positions across 18 objective items are a=4, b=6, c=6, d=2. This is acceptable as an exploratory pilot but needs balancing in a larger bank.

Before expansion, a human should review the worksheet and select concrete revisions: stronger text-supported distractors, longer varied passages for stamina, argument/evidence and less signposted inference, and challenging reasoning with explicit assumptions. Independently review the mathematics prose and writing tasks. Capture final-revision different-provider evidence where policy requires it, onboard writing taxonomy/blueprints, and use existing authorised intake and approval workflows. Human approval alone must not be treated as a substitute for the other gates.

## Collaboration and scope

The requested existing worktree was reused; main checkout was only inspected. Worktree already contained unfinished, uncommitted Vihaan UI, route, sidebar, flag and test work. During this task another editor changed shared UI files. On user confirmation to avoid those files, no further edits were made there. Earlier changes to VihaanDashboard.tsx, VihaanSmartRevision.tsx, VihaanStudyPlan.tsx and study-plan.ts remain in the worktree: corrected malformed/implicit typing, removed displayed fabricated accuracy, and presented content availability truthfully. They need coordinated review with the other editor; no restoration was attempted over concurrent work. StudentSidebar and the shared feature-flag tests were not changed by this pilot work.

Pilot artefacts are under content/vihaan-scholarship/pilot-01. Use human-review-sheet.md to review questions, advisory-review.md for review findings, validation-report.json for automated evidence, and docs/vihaan-scholarship/pipeline.md for the 400-item blueprint and governed integration plan. No commit or PR was created from this shared, concurrently changing worktree.
