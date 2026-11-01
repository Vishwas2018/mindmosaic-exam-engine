# Verification of preparation changes

Content source is immutable commit `45b6cdab335723b2ef822f854ac7e15e556bb7d7`. The preparation commit does not change questions, active runtime pins/readers, historical status/sheets or approvals. Its final SHA is recorded in PR #73; this file does not try to include its own commit hash.

| Command | Actual result |
| --- | --- |
| `npm run typecheck` | Pass, including both preparation scripts. |
| `npm run lint` | No errors; an unused-import warning in the new reconciliation script was then removed. Focused ESLint for both final scripts passes without warnings. |
| `npx vitest run src/tests/unit/admin-draft-review.test.ts src/tests/unit/scholarship-release-package.test.ts src/tests/unit/scholarship-sample-pattern.test.ts src/tests/unit/scholarship-session-route.test.ts src/tests/components/admin-draft-review.test.tsx` | 5 files: 42 passed / 5 failed, 8.51 seconds. Four admin historical-pin failures and one old blank-sheet hash failure are reproduced. No assertion changed. |
| `npx vitest run src/tests/unit/scholarship-sample-pattern.test.ts src/tests/unit/scholarship-session-route.test.ts src/tests/components/admin-draft-review.test.tsx` | 3 files / 21 tests passed, 7.20 seconds. Covers fixed 12-item selection, missing-item refusal, complete passages, scoring, preview answer retention, server answer stripping and student-only permissions using isolated fixtures/RPC mocks. No database or approval writes. |
| `npm run content:validate-scholarship-drafts` | Pass, all 160 drafts; schema/solver/distribution/encoding/runtime-isolation checks retained. |
| `npm run build -- --webpack` | Pass: production compilation, TypeScript, all 65 static pages and route generation completed. Webpack is used because this worktree's linked node_modules previously prevents the default local Turbopack build. No build script was changed. |
| `npm run validate:questions` | Pass: all production questions and 18 showcase fixtures valid. |
| `npm run check:answers -- --include-published` | Pass: 175 fully computable, 1,601 structurally checked, 1,422 editorial-review, 4 manual-review; 1,571 warnings, zero failures. These are not claims of universal mathematical or independent semantic proof. |
| `npm run questions:validate-ledger` | Pass: 98 rows, 43 generated/audited events, 20 in-scope files. |
| `npx tsx scripts/report-scholarship-attestation.mts` | Pass, 60/60 first-party attestations. |
| `npx tsx scripts/scholarship-sample-reconcile.mts` | Completes the audit and emits `BLOCKED`, with 11 satisfactory current manual outcomes, exactly one amended question, unchanged historical hashes and an inactive proposal. This is successful audit execution, not release clearance. |
| `npx tsx scripts/scholarship-sample-evidence.mts` | Recomputes 12 exact candidate/publication pairs and binds the manifest to the current reconciliation plus the actual reviewed original/amended packets. The amended question is pinned to exact expected hashes; no blanket ID exemption remains. |

Raw local logs are `C:/tmp/scholarship-reconcile-*.log`, `C:/tmp/scholarship-preparation-*.log` and `C:/tmp/scholarship-45b-core.log`; generated test/build output is not committed.

Prior full CI on source 45b6cdab is [PR run 39536711901](https://github.com/Vishwas2018/mindmosaic-exam-engine/actions/runs/39536711901) and [branch run 39536706368](https://github.com/Vishwas2018/mindmosaic-exam-engine/actions/runs/39536706368). It reported all 6,488 unit tests concluded: 6,483 passed / 5 failed, with the same five failures above. RLS and public-browser jobs passed; authenticated browser jobs failed on the withheld mathematics/full-catalogue/sample state. These prior results are not presented as a fresh full-suite pass for the preparation commit. Any automatic CI after push remains authoritative for its SHA.

No broad browser/database rerun was used to bypass the known red release contract. The active identity and blank-sheet mismatches must be resolved as a coordinated, authorised version change and full CI must then pass before merge. The raw amended review was absent during that preparation run. The follow-up below records its later receipt and validation.

## Follow-up: amended manual review received

The exact 422-byte file in the user-specified Downloads directory was copied unchanged. SHA-256: `89a7db747f162f9eb2be9f372bc5f74158c55e3f325f0124a1bf2cd3347ecc83`. The user confirmed a separate fresh ChatGPT conversation; that is retained as manual attestation, with model label unknown and no API identity/envelope claim.

Reconciliation and manifest regeneration validate strict response schema, one exact candidate ID, answer agreement, PASS, uniqueness, medium difficulty, empty issues/fix, amended packet projection and both frozen content hashes. All twelve current manual outcomes now pass. The former 11-item rollup is preserved unchanged. The active pin, candidate files and previous raw reviews remain untouched.

Only focused preparation-script lint/typechecking and evidence-binding validation were repeated for this follow-up; completed runtime/build/full-suite checks were not repeated. Release readiness remains blocked by the unchanged active historical contracts and governed publication lifecycle, rather than by the now-resolved file delivery.
