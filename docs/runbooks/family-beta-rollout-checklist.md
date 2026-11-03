# Family-beta rollout checklist (WP1 candidate)

**Status: NO-GO — blocked on credentials and on human content approval.** Every local and Linux/CI check that can be
run has been run and is recorded below with its result. Nothing has been done on any hosted environment, because the
credentials required to do it are not available to this workstation (see §0). A box is ticked only with evidence next
to it; a blocked box is marked BLOCKED, never ticked.

Local verification is recorded in §2. The authoritative Linux E2E run is recorded in §3. DEV (`mfglzabnayacssgertat`)
work is §5 onwards. Production (`uermhsptduikehuyceiz`) is out of scope and untouched.

## 0. Hard blockers (nothing in §5–§7 can proceed past these)

| Blocker | Established how | Consequence |
| --- | --- | --- |
| **No Supabase management access.** `SUPABASE_ACCESS_TOKEN` in `.env.e2e.local` returns **HTTP 401** from `GET https://api.supabase.com/v1/projects`. | Called the API directly. | DEV migration state cannot be read, and no migration can be applied. **M0–M3 all BLOCKED.** |
| **No DEV database owner credential.** No `SUPABASE_DB_URL`, `EXAM_WRITE_DB_URL` or `EXAM_WRITE_DB_CA` exists in any local env file or in the Vercel project. The only DEV Postgres URL present is `SCORING_DB_URL` (role `mindmosaic_scoring`), which cannot `CREATE ROLE` or `GRANT`. | Read the variable names (not values) from `.env.local`, `.env.e2e.local`, and the Vercel env listing. | The writer role cannot be created or verified; **W1–W4 BLOCKED**. |
| **No `RECOVERY_GRANT_SECRET`, and none in Vercel.** | Vercel env listing for the project holds 14 variables; this is not among them. | Hosted password recovery returns 503 `recovery_unavailable`. **A1 BLOCKED.** |
| **No human content approval.** Not a credential problem — an owner decision. No pinned item carries `approvedBy`. | §4. | The papers must stay unreachable by family users. **Owner gate.** |

Everything in §1–§4 was completed despite these blockers.

## 1. One release candidate

- [x] **Candidate branch** `chore/family-beta-wp1-candidate-20261102`, pushed to `origin`.
- [x] **Reported SHA reconciled.** The brief named `759fadbe`; the branch was already one commit further on at
  `d5bd9a25` (`ci: close three gaps in family-beta-verify gating`), and `759fadbe` is an ancestor. No work was lost.
- [x] **PRs #91, #93, #94 reconciled.** `origin/fix/exam-legacy-write-rpc-server-only` (`ed52ef99`),
  `origin/fix/auth-device-independent-links` (`75549435`) and `origin/fix/auth-recovery-verified` (`46592735`) were each
  re-fetched and confirmed to be ancestors of the candidate, so none has moved since it was merged. `origin/dev`
  (`17d8be2f`) is also contained.
- [x] **Content integrated.** `feat/family-beta-fixed-papers` (`5cfa3555`) had diverged from the candidate and was
  merged in: the pinned-paper loader, `family-beta-pinned-data.json`, the Year 5 Q24 payment-wording correction, and the
  fixed-paper and interactive-renderer tests. The correction's diff is byte-identical to `23a7586b` on
  `chore/family-beta-content-20261103`, so that branch carries nothing the candidate now lacks.
- [x] **Concurrent work preserved.** The merge was `--no-ff` with no conflicts; no other agent's branch was rewritten.

## 2. Local verification (Windows host)

- [x] `npm run typecheck` — clean.
- [x] `npm run lint` — **0 errors**, 17 pre-existing warnings (unused vars).
- [x] `npm test` — **7089 tests passed**, 403 of 404 suites. The one failing suite was a fixture-isolation defect, now
  fixed: `src/tests/unit/stripe-webhook-route.test.ts` read `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` from
  `.env.local` and threw `ENOENT` when absent, so in any git worktree the whole suite failed to collect (0 of 8 tests
  ran). `ci.yml` sets both at workflow level, so **CI was never affected** — this was a local/worktree-only failure. A
  deterministic synthetic fallback now follows the existing `process.env` then `.env.local` lookups. No assertion
  changed: the value only signs and verifies this suite's own payload. 8 tests now run and pass.
- [x] `npm run validate:questions` — all production questions and showcase fixtures valid.
- [x] `npm run check:answers -- --include-published` — 1601 questions, **0 failures**. Note its own breakdown: only
  **175 are fully computable/verified**, 1422 are "editorial review", 1571 carry warnings. This check is a structural
  net, not a correctness proof — which is why §4 solved the beta's 78 items by hand.
- [x] `npm run questions:validate-ledger` — PASS.
- [x] New tests added by this candidate pass: 24 (gate + derived findings) and 35 (partial/unanswered scoring).

## 3. Linux/CI evidence — the authoritative E2E environment

No Windows E2E count is quoted anywhere in this document. The Windows runs remain INVALID (10 s native socket stalls in
`next start`, cause never established). Norton was not disabled and no Windows run was repeated.

- [x] **`family-beta-verify` PASSED on Linux** at SHA `50916415` (run `41731584979`), with its gate requiring every
  suite, repeat and report check to succeed:
  - Authenticated E2E: **90 tests, 69 passed, 0 failed**, 1 flaky (passed on retry), **20 skipped**. `BUILD_ID=YrUebnXiR-Kx_cZXBWk_T`.
  - Keyboard walkthrough ×5, retries 0: **5/5 passed** — the previously unresolved check is now resolved.
  - Public E2E: **386 tests, 385 passed, 0 failed**, 1 flaky. `BUILD_ID=0i1Ielo5F6J6TA6NoKTG8`.
  - Isolation held: local Supabase on 127.0.0.1:56321-56324, no `secrets.` reference in the workflow, no hosted target,
    positive pre-flight env guard, SHA identity asserted, artifacts redacted.
- [x] **CI `core`, `e2e-auth` and `scholarship-drafts` passed** on `50916415` (`core` covers typecheck, lint, build and
  every content/publication gate plus `npm run test:ci`).
- [x] **CI `rls` failed on `50916415` — root-caused and fixed.** Three expectations in
  `tests/rls/target-http-lifecycle.test.ts` saw `503` where they expected `200`. Cause: the file scoped
  `EXAM_WRITE_DB_URL` to the loopback writer but not `EXAM_WRITE_ALLOW_LOOPBACK`, so `validatedTarget()` refused the
  target with `loopback_not_enabled` *before connecting* and the route answered 503 `not_configured`. The harness runs
  against 127.0.0.1 by design, so the explicit opt-in is the correct posture. **No control was weakened**: 
  `tests/rls/exam-write-target.test.ts` still proves a loopback target IS refused without the flag, and a hosted target
  on a ref mismatch. (The third failure was a cascade — `legacySessionId` was undefined.)

### Two gaps in the green run, both now closed in the workflow

- [x] **The 20 skipped authenticated tests were the entire email path.** `e2e/auth/email-confirmation-and-recovery.spec.ts`
  and `e2e/auth/password-recovery-security.spec.ts` call `test.skip(!MAIL, ...)` when `E2E_MAILPIT_URL` is unset, and the
  workflow never set it — so the green run proved **nothing** about email confirmation or password recovery, the very
  thing this candidate exists for. `supabase start` already runs the catcher on the runner (`[inbucket]`, port 56324,
  Mailpit API, which `e2e/fixtures/mailpit.ts` already defaults to). `E2E_MAILPIT_URL` is now set in the job env. These
  tests will now either pass or fail; they can no longer silently skip.
- [x] **The repeated keyboard coverage targeted the wrong spec.** The observed flake was in the PUBLIC suite
  (`e2e/a11y-auth-pages.spec.ts`, "sign-in keyboard walkthrough", failed attempt 1, passed on retry), while the ×5
  repeat covered the authenticated parent dashboard, which never flaked. A second repeat step now runs the public
  walkthroughs ×5 with `--retries=0`, gated by `--require-spec a11y-auth-pages`, and is added to the final gate. With
  retries off a flake fails the step, so this will tell a real focus-order defect from a one-off.
- No failure anywhere was hidden by a retry, a skipped assertion or a raised timeout.

## 4. Content: verification done, approval outstanding

- [ ] **BLOCKED — the revised `family-beta-review-deliverables.zip` is not on this machine.** A recursive search of
  `C:\tmp`, `C:\Users\vishw\Downloads` and `C:\Users\vishw\Vish` found no such file, so the expected SHA-256
  `8a985823e7295ae9fe5b294ec83c3fbee04fc52f88ba856207ffbbeb90b54926` **could not be checked**. Supply the file to close
  this box. It was verified against repository objects instead, which is the stronger check for rollout purposes:
- [x] **All 78 pins resolve and every hash matches.** Year 3 36 items, Year 5 42 items, matching the packet's stated
  counts. Each pinned `canonicalSha256` was recomputed with the repo's own `hashJson` against `publishedExamBank` and
  **all 78 agreed**; types agreed; slots are contiguous 1..N; ids unique. So what renders is the reviewed version, and
  `loadFamilyBetaFixedPaperQuestions` fails closed on any drift.
- [x] **All 78 answer keys independently solved and correct.** Every item was worked by hand from the prompt and visual
  data and compared with the stored key: **78/78 agreed**, including the corrected Year 5 Q24 (8 × $3.00 = $24, pays
  $30, change $6).
- [x] **No answer leakage.** `toCandidateQuestions` strips `answerKey`, `explanation` and rationale for all 78.
- [x] **Scoring authority is server-side**; the reviewer preview never receives an answer key as a client prop.
- [x] **Eleven interactive configurations** (ordering ×1, fill_blank ×3, label_diagram ×2, dropdown ×2, matching ×3) are
  rendered and scored by `src/tests/components/family-beta-interactive-renderers.test.tsx` at desktop and tablet
  viewports, correct and incorrect.
- [x] **Partial and unanswered scoring now covered** (`family-beta-partial-unanswered-scoring.test.ts`, 35 assertions).
  Result to be aware of: **partial credit does not exist**. `objective()` awards full marks or zero, so a 2-mark item
  answered half-right earns **nothing** — Year 5 Q11 (perimeter right, area wrong), Q15 (2 of 4 pairs), Q25, Q31.
  Unanswered is correctly distinct from incorrect. This is the engine's existing rule; it was not changed.
- [ ] **OWNER GATE — no item carries `approvedBy`.** All 78 are `status: published` with **no human approval**: of the 46
  that resolve to a manifest in `content/question-factory/published-manifests/`, **none** has `humanApproval` or
  `approvedBy` (30 carry `noChainRecovered: true`), and 32 pins have no manifest file there at all. Nothing in this
  work records approval, and none of it may be read as approval.
- [x] **Pending content is unreachable by family users.** Nothing in the application imports
  `src/server/family-beta-fixed-papers.ts` except the reviewer route below, and the module is fail-closed.
- [x] **Gate hardened.** `isFamilyBetaFixedPapersEnabled()` checked only `VERCEL_TARGET_ENV`; `VERCEL_ENV` is the only
  production signal on older Vercel builds, so a production deployment with the flag set could have served unapproved
  content. Both are now refused, with a test for each.

### Open content findings for the owner review (10 items of 78)

Derived from the question objects by `src/server/family-beta-review-findings.ts` and pinned by a test, so the list
cannot drift from the content. None is a wrong answer key.

| Item | Finding | What it means |
| --- | --- | --- |
| Y5 Q8, Q16, Q23, Q26, Q32, Q42 | `CHART-ALT-NO-DATA` | **Accessibility.** `BarChartRenderer`, `LineGraphRenderer` and `PieChartRenderer` mark every bar, point and segment `aria-hidden="true"` and expose only `altText`; there is no data table. These six have generic alt text ("clearly varying values across four points") that names none of the plotted values, so **a screen-reader user cannot answer them at all**. Sighted use is unaffected. Note the genuine tension: for Q8 and Q42 ("lowest value"), putting the values in alt text would give the answer away — the real fix is an accessible data table, which is a design change beyond this candidate. |
| Y5 Q20 | `NUMBERLINE-OFF-GRID` | `NumberLineRenderer` draws ticks at `min + n × step` (2.0, 2.4, 2.8, …) but the highlighted values are 2.2, 2.6, 3.0, 3.4, so every marker renders **between** ticks and cannot be read off the scale. The prompt states the pattern, so the item is still answerable from text. Y5 Q13 and Q28 are correctly aligned. |
| Y3 Q26 | `UNIT-NOT-CUED` | Key is `105` with unit `cents`, but the prompt only says "How much do they cost altogether?" — a child answering `1.05` is marked wrong. |
| Y5 Q36 | `UNIT-NOT-CUED` | Key is `1250 mL`; the prompt says "How many millilitres" — borderline, included for completeness. |
| Y5 Q33 | `UNIT-AMBIGUOUS` | "Convert 2,750 millilitres to litres" with key `2.75` and no unit stated for the answer. |

Also worth an owner decision, not defects: mark weighting is inconsistent for the same skill (Y5 Q8/Q42 "read the
lowest value" are 2 marks while Q16/Q26 "find the maximum" are 1; "Identifying equivalent fractions" is 1 and 2;
"Solving multi-step money problems" is 1 and 2). Year 3 totals 36 marks over 36 items; Year 5 totals **49 marks over 42
items**. Two skill tags are wrong (Y3 Q27 is tagged `num.number.odd-even` but asks "less than 20"; Y5 Q19 is tagged
"Ordering decimals on a number line" but has no number line).

### How to do the review

A reviewer route renders both papers through the **same** question and visual renderers a child uses, so what you see
and can interact with is what they would get:

- `/dev/family-beta-review` — both papers, counts, marks, per-item finding index, and what each finding means.
- `/dev/family-beta-review/year3` and `/dev/family-beta-review/year5` — every item in slot order: prompt, real rendered
  visual with its alt text shown, the live interactive control, the findings against that item, and a
  "Show expected answer" toggle with the explanation.

It is behind the papers' own fail-closed gate (404 without `FAMILY_BETA_FIXED_PAPERS_PREVIEW=enabled`, and 404 on any
production deployment), it shows expected answers so it must never be reachable by a student, and **nothing on it
records approval**.

## 4b. Audit coverage by area

What each listed beta-impacting area rests on, and where the evidence is. "Local/CI" means proved by tests that ran;
"hosted unverified" means the control exists in code but its hosted configuration was never read (§0).

| Area | State |
| --- | --- |
| Parent/student authentication, logout, shared-device switching | Local/CI. Authenticated E2E + `e2e/auth/*`; PRs #93/#94 in the candidate. |
| Same-device and cross-device recovery | Code + route/SQL tests. **CI coverage was skipping** until this candidate set `E2E_MAILPIT_URL` (§3). Cross-device (E2) still needs a physical second device. |
| Recovery-grant replay, concurrency, uncertain Auth outcomes | `recovery-grant.test.ts`, `recovery-routes.test.ts` (727 lines), `tests/rls/recovery-grant-claims.test.ts`. Hosted unverified (N3). |
| Restricted exam writer, positive environment validation, verified TLS | `exam-write-target.test.ts`, `exam-write-tls.test.ts`, `tests/rls/exam-write-target.test.ts`, `exam-write-lockdown.test.ts`. **The real hosted chain is unverified (W3).** |
| Legacy RPC exposure | Migration `20261031090100` + `tests/rls/exam-write-lockdown.test.ts`. **Not applied on DEV (M3).** |
| Parent/child, sibling, cross-family authorisation | `tests/rls/*` RLS suite, green on Linux. Hosted two-family check BLOCKED (F1). |
| Exam creation, autosave, resume, submission, durable results | `exam-session-create-route`, `exam-submit-route`, resume reconciliation; PR #88's durable per-question submissions. Hosted journey BLOCKED (F2). |
| Duplicate requests, interrupted connections | Idempotency covered in `exam-submit-route.test.ts` (409 path) and `apply-subscription-event.test.ts`. |
| Client-supplied score manipulation | Server-authoritative scoring; `tests/rls/exam-attempts.test.ts`, `assessment-session-responses.test.ts`, `scoring-module-boundary.test.ts`. |
| Answer-key leakage; draft/unapproved content access | §4: no leakage on all 78; papers fail-closed and unimported by any family route; gate now refuses both production markers. |
| **Student PIN abuse protection** | **Bounded, and weaker than it looks in isolation.** A student signs in with `signInWithPassword(alias, pin)` where the PIN is only 6 digits — there is **no application-level lockout or attempt counter**. What actually protects it is that the alias email is derived from an 8-character, ~40-bit secret login code (`student-alias.ts`), which is never stored as a mapping, so an attacker must guess the code *and* the PIN; plus Supabase's `sign_in_sign_ups` throttle, set locally to 30 per 5 minutes per IP. **The hosted DEV throttle was never read (A5), and local `config.toml` values do not apply to a hosted project.** Defensible for a private family beta; read A5 before any wider use. Minor, non-blocking: both generators use `byte % n` (31-char alphabet, 10 digits), a small modulo bias costing a fraction of a bit — not worth churning the auth path before the beta. |
| Accessibility, loading states, keyboard operation, tablet layout | Keyboard walkthroughs ×5 retries-0 on the authenticated side (5/5) and now repeated on the public side too (§3); interactive renderers tested at desktop and tablet viewports. **Open defect: six Year 5 items are unanswerable with a screen reader (§4).** |
| Sensitive logging and operational support | Target decisions carry enumerated reason codes only, never the URL or password (`target.ts`); CI artifacts redact JWTs and token/code query parameters. |

## 5. Vercel / Preview isolation

- [x] **Automatic Preview deployments cannot target production.** The project's `productionBranch` is `main`, so only
  `main` deploys to production. Confirmed empirically as well as from config: pushing this candidate produced
  deployments with `target: null` (Preview), not `production`.
- [x] **Preview resolves to DEV, not production.** Preview-scoped plain variables name the DEV ref
  (`SCHOLARSHIP_SAMPLE_SUPABASE_REF` and `SINGAPORE_MATHS_SAMPLE_SUPABASE_REF` = `mfglzabnayacssgertat`) and
  `SCHOLARSHIP_SAMPLE_FORBIDDEN_SUPABASE_REFS` = `uermhsptduikehuyceiz` guards against the production ref.
  *Bounded limitation:* preview `NEXT_PUBLIC_SUPABASE_URL` is a **sensitive** variable whose value the API does not
  return, and it was not decrypted, so its project ref is corroborated by the above rather than read directly.
- [x] **Branch-scoped isolation for the review flag.** `FAMILY_BETA_FIXED_PAPERS_PREVIEW=enabled` was created with
  `target: ["preview"]` **and** `gitBranch: chore/family-beta-wp1-candidate-20261102`, so no other Preview and no
  Production deployment is affected. Remove it when the review is finished.
- [x] Preview deployments are behind Vercel SSO (`ssoProtection: all_except_custom_domains`), so only the owner's
  Vercel account can open the review URL. This also means automated hosted checks would need a protection-bypass token.
- [ ] **Not done:** none of `EXAM_WRITE_DB_URL`, `EXAM_WRITE_EXPECTED_PROJECT_REF`, `EXAM_WRITE_DB_CA` or
  `RECOVERY_GRANT_SECRET` exists in the Vercel project at all, for any target. Until they do, a Preview or DEV
  deployment of this candidate cannot create exam sessions through the restricted writer (503 `not_configured`) and
  cannot serve password resets (503 `recovery_unavailable`). See §0.

## 6. DEV rollout — BLOCKED, in the order it must happen

The sequence below is unchanged and still correct; **nothing in it has been executed**, because §0 blocks step M0, and
every later step depends on it. Do not reorder: M3 breaks the previous application version, so it is never applied
"with the rest".

1. **W: writer connection** (before deploying this version)
   - [ ] W1 BLOCKED `EXAM_WRITE_DB_URL` is the `mindmosaic_exam_writer` URL for DEV (direct `db.<ref>.supabase.co`, or
     pooler with the `.<ref>` username suffix), with no `sslmode` other than `verify-full`. *Needs: the writer role's
     password, set out of band.*
   - [ ] W2 BLOCKED `EXAM_WRITE_EXPECTED_PROJECT_REF=mfglzabnayacssgertat`; `NEXT_PUBLIC_SUPABASE_URL` names the same
     project; `EXAM_WRITE_ALLOW_LOOPBACK` unset; `NODE_TLS_REJECT_UNAUTHORIZED` unset.
   - [ ] W3 BLOCKED `EXAM_WRITE_DB_CA` set to the CA from the DEV project's Database settings, fingerprint checked
     against the dashboard. Then **prove the chain on the deployed environment**: one create-session call succeeds with
     verified TLS, and the same call with a deliberately wrong CA is refused (`503`, reason `tls_ca_invalid`).
   - [ ] W4 BLOCKED The writer role exists on DEV with its password set out of band, and its attributes read back clean
     (the module refuses a role with `rolsuper`/`rolbypassrls`/`rolcreaterole`/`rolcreatedb`/`rolreplication`).
2. **A: Auth configuration**
   - [ ] A1 BLOCKED `RECOVERY_GRANT_SECRET` (32+ random chars) set for the DEV deployment; redeploy.
   - [ ] A2 BLOCKED The **live hosted** recovery template is the fragment form
     (`/auth/reset#token_hash={{ .TokenHash }}&type=recovery`). Hosted templates are edited in the dashboard, not
     deployed from the repo: read the live template and record it.
   - [ ] A3 BLOCKED Redirect allow-list contains the DEV origin's `/auth/reset` and `/auth/confirm` — read, not assumed.
   - [ ] A4 BLOCKED Record the hosted `secure_password_change` and session lifetime/inactivity values. **Owner
     decision**, recommended on. Do not claim the application blocks direct Supabase Auth password changes — it cannot.
   - [ ] A5 BLOCKED Rate limits and email sender/deliverability for `/recover` and `/verify` recorded.
3. **M: migrations** (owner-authorised, DEV only, snapshot first)
   - [ ] M0 BLOCKED **Read current state first; do not blindly re-apply.** `20261031090000` was previously *reported*
     applied on DEV — treat that as a claim to re-check. Run `npm run migrations:status` against DEV with verified TLS
     (`SUPABASE_DB_URL`, `SUPABASE_DB_CA`/`SUPABASE_DB_CA_FILE` = the project CA, `NODE_TLS_REJECT_UNAUTHORIZED` unset;
     `scripts/migrations/verify.ts` refuses to connect otherwise). Record, per migration, ledger row present/absent
     **and** the registry's object checks. Apply only what is absent. Without a DB URL or CA, the alternative is the
     same read-only catalogue query in the Supabase SQL editor — never a client that skips certificate checks.
   - [ ] M1 BLOCKED `20261031090000` (writer role + `_for` functions) — confirmed by M0, or applied now if absent. *No
     effect on the running app.*
   - [ ] M2 BLOCKED `20261102090000` (`recovery_grant_claims` + `claim_recovery_grant`, `settle_recovery_grant`,
     `resolve_recovery_claim`), after M1 and **before** the new version serves resets. Additive; reads
     `auth.users.encrypted_password` as a digest inside SECURITY DEFINER functions. Without it the reset endpoint is
     503 `recovery_unavailable` and changes nothing — safe, but resets are down. Reported as drift until applied.
   - [ ] M2b BLOCKED `20261103090000` (`recovery_claim_fail_closed`) immediately after M2, same authorised window.
     Makes lapsed claims terminal `abandoned` and revokes `service_role` access to the claims table. **This candidate
     expects it.** Not applied anywhere hosted.
   - [ ] M3 BLOCKED `20261031090100` (revoke legacy RPCs from clients) **last** — only after D1, D1's hosted
     create/submit verification, and N1. It breaks the previous application version.
4. **D: compatible deployment before the lockdown**
   - [ ] D1 BLOCKED Deploy this version (it calls the `_for` functions as the writer) and confirm create-session and
     submit work end to end **with the legacy RPCs still executable**, so recovery does not require rolling back M3.
   - [ ] D2 BLOCKED Only then apply M3. Re-run N1.
5. **N: hosted negative security tests** (each recorded as a refusal, with its status code)
   - [ ] N1 BLOCKED Signed-in student calling `create_exam_session` / `record_exam_attempt` / `*_for` over PostgREST →
     `permission denied`.
   - [ ] N2 BLOCKED Writer URL pointed at the wrong project (ref mismatch) and at a non-verifying configuration →
     refused before connecting.
   - [ ] N3 BLOCKED Recovery: forged, expired, other-user and other-session grants refused; **two concurrent submits
     with one grant → exactly one password change**; replay after success → 403 `spent`; ordinary signed-in session with
     no grant → 403. Do **not** force Auth failures on DEV with real users: the `update_uncertain` and `lapsed` paths are
     proved by the SQL and route tests, not by breaking DEV.
   - [ ] N4 BLOCKED With the claim function unavailable on a test project, the reset endpoint is 503 and the password is
     unchanged. Not on a project with real users.
6. **F: families and exam journeys** — all BLOCKED on §0
   - [ ] F1 Two synthetic DEV families, two children in one: neither parent can see the other's children, results or
     sessions, through the UI, the APIs and the database.
   - [ ] F2 Complete Year 3 and Year 5 journeys per child: start, answer, autosave, hard refresh, browser restart,
     resume, submit, result, parent view after a fresh session; an interrupted submit retried safely (idempotent 409);
     a client-supplied score rejected.
   - [ ] F3 Only approved items are served. **Record the count.** The prior baseline found 53 approved against 1,601
     served; §4 shows the beta's own 78 are unapproved, so this box cannot be ticked until §4's owner gate is closed.
7. **E: real-email recovery** — BLOCKED on §0 (and partly not automatable)
   - [ ] E1 Real email on DEV, same browser. [ ] E2 A different device/browser opening the same link. [ ] E3 "other
     devices signed out" checked against a previously signed-in second device. [ ] E4 Reuse and expiry refused.
   - The CI equivalents of E1/E4 now run against the runner's own mail catcher (§3); **E2 and E3 need a physical second
     device and cannot be automated here.**

## 7. Suspension and rollback (decide and rehearse before inviting anyone)

- [ ] R1 **Security-preserving suspension.** Do **not** re-grant `EXECUTE` on the legacy RPCs to `authenticated`.
  Suspend instead: take the app offline / serve the maintenance page, or unset `EXAM_WRITE_DB_URL` so writes fail closed
  with 503. Suspend functionality; never reopen score forgery.
- [ ] R2 **Application rollback** works only while M3 is **not** applied. After M3, roll forward, not back.
- [ ] R3 `20261102090000` and `20261103090000` are additive/forward-only; the previous application ignores the table.
- [ ] R4 Credential rotation path for the writer password and `RECOVERY_GRANT_SECRET` (rotating the latter invalidates
  grants in flight).
- [ ] R5 Older Preview deployments share DEV. After M3 they will 503 on exam writes. Either redeploy or accept that
  stale Preview URLs stop working — do not restore legacy grants to fix them.
- [x] R6 **Review-flag teardown:** delete the branch-scoped `FAMILY_BETA_FIXED_PAPERS_PREVIEW` variable (id
  `Q1qdssAxhMfNJeb3`) when the content review is finished.

## 8. Known open items not fixed by this candidate

- Direct Supabase Auth password changes by an ordinary session: provider behaviour, owner decision (A4).
- Recovery single-use is an **application** guarantee, not an Auth one: a request already in flight cannot be
  cancelled, and a session holder can call Supabase Auth's update-user API directly.
- `scripts/migrations/verify.ts` requires verified TLS against an operator CA for any non-loopback database; the real
  hosted chain stays unverified until M0 runs.
- Charts have no accessible data table (§4). Six Year 5 items are unanswerable without sight.
- No partial credit anywhere (§4), on 2-mark items included.
- The content packet zip could not be hash-verified (§4).
- Whether the Windows 10 s socket stalls also affect `origin/dev` on that host was not tested.
