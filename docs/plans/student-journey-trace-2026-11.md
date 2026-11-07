# Student journeys — P0 trace and decisions

**Date:** 7 November 2026
**Base:** `origin/dev` @ `17d8be2fcf81ab456980b24a65d4da0bc38950b2`
**Scope:** docs only. Read-only trace of the code behind the seven student journeys (phases P0–P11).
**Evidence rule:** every verdict cites `file:line` on the base above. SUPPORTED = code does it today.
UNSUPPORTED = code does not, or does the opposite. UNVERIFIED = could not be established from code alone.

The audit `docs/content-status/practice-availability-2026-11.md` is committed unchanged alongside this file.

---

## 0. Audit totals re-run on this base

Run through the app's own loading path (`getExamBank("practice")` from `src/server/exam-bank.ts`; never counting text).
The counting script is not committed.

| Figure | Audit (79441a12) | This base (17d8be2f) | Delta |
|---|---|---|---|
| Served questions | 1,601 | **1,601** (1,601 unique ids) | 0 |
| Year 3 | 940 | **940** | 0 |
| Year 5 | 661 | **661** | 0 |
| year∣style∣subject∣strand groups | 141 | **141** | 0 |
| …of which ≥ 5 questions | 95 | **95** | 0 |
| Distinct strand labels | 81 | **81** | 0 |
| Duplicate prompt groups / questions | 17 / 68 | **17 / 68** | 0 |
| `getBankEligibility()` cells (practice) | not stated | 650 | n/a |

No delta, so the stop rule on totals does not fire. Note the audit called 79441a12 33 commits ahead of `dev`
yet the served bank is identical; the audit's "+53 AMC" was drift against a historical figure, and `dev` already
carries those 53. Spot cells: `5:icas_style:science` = `{count: 0, fullDurationSeconds: 600}` (confirms ICAS Y5 Science
empty); `5:icas_style:language` = 37 questions (the vocabulary join works through this API).

---

## B1 — Can a signed-in practice set survive reload or a device change?

**UNSUPPORTED.** There is no server record of a practice set and no server-confirmed save time for one.

- `/practice/session` is a client page (`src/app/practice/session/page.tsx:1`, `"use client"`). It fetches the
  whole answer-bearing bank from `/api/exam/guest-bank` (`:80`) for signed-in and signed-out students alike, then
  selects the set in the browser: `seededShuffle(scoped, seed).slice(0, count)` (`:414`).
- State lives only in the reducer (`practice-mode/practice-reducer.ts`). No `localStorage`, `sessionStorage` or
  `fetch` appears anywhere under `src/features/exam-engine/practice-mode/` (grep: zero hits).
- The seed is deterministic per filter (`buildSeed`, `page.tsx:~38`), so a reload re-draws the *same questions in the
  same order*, but every answer is lost.
- Contrast, exam sessions: `lastAutosavedAt` (accepted-by-server epoch), `/api/exam/session/active`,
  `/api/exam/session/[id]/responses` (autosave incl. `currentQuestionIndex`, `flaggedQuestionIds`, `responses/route.ts:66-125`).

**Stop rule fires:** "If B1 shows practice sets cannot resume, build no practice-set Continue and no backend; report."
→ P3 offers Continue only for an open timed paper (C11). P6 must say a tab-close restarts from question 1 (C14).

**Option to put to Vish (not decided here):** `POST /api/exam/session` accepts a `config`, creates a server session,
and returns `{ sessionId, questions }` already answer-stripped (`api/exam/session/route.ts:138`). An *untimed* exam
session is therefore a server-backed, resumable, server-scored practice set. It would change the B1 answer, but it
scores at submit only, not per question, and writes to the same history as timed papers. See D11 below.

---

## B2 — How does a signed-in `/practice/session` get its questions; who selects; can Start return a session id?

**Query-param navigation only. No confirmed session id.**

- Selector for a set is entirely client-side (see B1). `parsePracticeSessionParams`
  (`practice-mode/practice-params.schema.ts`) reads `subject`, `year`, `style`, `count`, `skill`, `seed`,
  `curriculumCode` from the URL; drill mode reads a launch record from the browser (`getDrillLaunchRequest`).
- Fail-closed for `curriculumCode` exists (`page.tsx:~385`), but the *general* path
  (`filterEligibleQuestions` → shuffle → slice, `:400-414`) draws from the whole published bank and has **no strand
  dimension, no floor and no prompt-hash de-duplication** (C2, C3, C5 all unmet today).
- It draws from `banks.published` of the **guest** payload, which carries answer keys and explanations to the
  browser (audit §7). Per C10 `/api/exam/guest-bank` is not touched, but **P6 cannot satisfy C15 while the set
  is still drawn from that payload.** The runner will need server-selected, answer-stripped questions (see B5).
- A confirmed id only exists for exam sessions (`/api/exam/session` → `sessionId`).

---

## B3 — Exact fields and null-semantics in a `getBankEligibility()` cell

**SUPPORTED, and thinner than the design needs.**

`src/server/exam-bank.ts:87-97` returns `Record<ExamBankId, BankEligibilitySummary>`; `practice` and `published`
are the same object. `BankEligibilitySummary = Record<string, EligibleSummary>`
(`features/exam-engine/selection/eligibility-summary.ts:25`), key `${yearLevel}:${examStyle}:${subject}` (`:27-31`),
cell:

```ts
interface EligibleSummary { count: number; fullDurationSeconds: number }   // :20-23
```

Semantics that matter:

1. **No nulls, no state.** A combination with nothing in it is `{count: 0, fullDurationSeconds: 600}`, not absent
   and not null. Every cell exists for every option combination (650 on this base).
2. **`fullDurationSeconds` for an empty cell is 600** — the 10-minute floor
   (`MINIMUM_FULL_EXAM_DURATION_SECONDS`, `selection-config.ts:193`); it is capped at 180 minutes (`:194`).
   `3:naplan_style:numeracy` reads 128 questions / 10,800 s. Showing any duration for an empty or large cell
   would be a fabricated number. P1 must ignore it for emptiness and never show it for a short set (C6).
3. **No strand, no median, no ready/none/unknown, no unique-prompt count.** Everything P1 returns beyond
   `count` and `fullDurationSeconds` is new computation, from the served bank.
4. **"Unknown" is invisible.** `servedBank()` returns `Object.freeze([])` when `getPublicationEligibility()` reports
   any problem (`exam-bank.ts:39`), so *every* cell becomes `{0, 600}` — identical to "genuinely empty".
   Distinguishing the two (C7) needs a separate read of `getPublicationEligibility().problems` (try/catch for a
   thrown call). That check is the only reliable "couldn't check" signal. P1 owns it.
5. Subject vocabulary in the key is the catalogue's (`language`, not `language_conventions`); strand and
   `estimatedTimeSeconds` come from the bank's `metadata`, which uses `language_conventions` (audit §3).

---

## B4 — What backs "Recent results", what a per-attempt review needs, what a "strength / area to practise" can rest on

- **Recent results:** `fetchStudentOverview().attempts` (`features/student/data.ts`) → `summarizeAttempt`
  (`attempt-summary.ts:125`) → `AttemptSummary` (`:25`): id, submittedAt, title, subjectLabel, timing,
  totalQuestions, `scorePercent`, `attemptedQuestions`, `pendingManualReview`. **It has no marks earned and no
  marks available** (only a percentage; `objectiveMarksAvailable` is read then discarded), so C17's "out of what has
  been marked" cannot be drawn from this type. **SUPPORTED** for the list; **UNSUPPORTED** for marks-out-of.
- **Practice sets never appear** in it: the source is `visible_sittings` (exam sessions only,
  `server/assessment/read-dispatch.ts:351`). Nothing records a finished practice set (B1).
- **Per-attempt review route:** none exists. `RecentActivityCard.tsx:64` and `results/ResultsColdLoad.tsx:142` both
  say so. `/results` reviews only the attempt in the in-memory Zustand store (`app/results/page.tsx`); after a reload
  it shows a flat list with no link into an attempt.
- **What is stored per attempt:** the `result` jsonb is an `ExamResult` (`scoring/exam-report.ts:32`): counts, marks
  earned/available, `pendingManualMarks`, `timeTakenSeconds`, `questionDetails[]` (id, status, awardedMarks,
  availableMarks, manual flags), and breakdowns by subject, skill, question type, difficulty. It does **not** store
  the student's answer, the correct answer or the explanation.
- **A review therefore needs:** the stored responses for that session (the autosave/response rows, owned by the
  student through RLS), the question ids from the session's stored selection, and the correct answer and working
  looked up **server-side** from the bank *after* submission, returned only for a submitted session of the caller.
  `getQuestionById` (`exam-bank.ts:74`) exists for exactly this kind of lookup. Cost: one new GET route plus a
  review view; no migration. **UNVERIFIED:** whether responses are retained on the legacy table after submit and
  on the version-pinned model — must be checked in P10 before the route is designed.
- **"Strength / area to practise":** the honest bases are `ExamResult.breakdowns.bySkill/bySubject` for **one
  sitting**, and `aggregateMastery` (`attempt-summary.ts:178`) across sittings by subject. `recommendSkills` is
  single-sitting only (`exam-engine/recommendation/recommend-skills.ts`). Nothing supports a longitudinal skill
  claim; per-skill figures across sittings are not aggregated anywhere. C19/D6 thresholds apply.

---

## B5 — What the Singapore Maths sample proves about per-question marking

**It proves the *store* and the *response contract*; it does not prove general marking.**

Proven (`src/app/api/practice/singapore-maths/sample/{session,submit,reveal}`, `features/singapore-maths-sample/attempt-store.ts`):

- **Shape:** the browser posts `{questionId, answer}`. The server authenticates (401), validates, marks, stores and
  replies `{correct, answer, alreadyAnswered, workedExplanation?}` (`submit/route.ts:~85-95`). No key travels out
  before the answer.
- **Store:** durable in Postgres via the existing service-role-only `idempotency_keys` table; no schema change;
  one immutable graded submission per question per attempt enforced by the primary key (`attempt-store.ts:11-32`);
  a "new attempt" marker supports Start again; 7-day `expires_at`.
- **Access control:** `createClient().auth.getUser()` per request, per-user keys, behind a feature flag
  (`isSingaporeMathsSampleAllowed`); service-role client is server-only.
- **Fits C15:** server marks, response carries correctness and explanation.

Not proven, and what a general version costs:

1. **Marking is fixture-specific.** `validateSampleAnswer` / `sampleExplanation` read the bar-model fixtures, not
   the bank. A general version must call the existing pure scoring dispatcher over `getQuestionById(id)`. **UNVERIFIED**
   how many question types the dispatcher marks server-side without the full session (matching, ordering, multiple
   selection need checking).
2. **Immutable-first-answer policy** conflicts with the P6 wording "the answer stays selected … nothing is marked"
   on failure, and with a retry-after-wrong flow. It is a decision (D12): keep immutability (simple, honest) or allow
   re-check.
3. **Explanation only if correct** in the sample (`:~90`). P6 and the review screens show the working either way.
   Returning it on a wrong answer is fine under C15 (it is after submission) but is a behaviour change.
4. **Question delivery:** the store marks one answer; it does not deliver questions. Today the set is drawn from the
   key-bearing guest payload (B2). A general version needs a server-selected, answer-stripped set
   (`toCandidateQuestions`, unchanged per C15) — either a new session-create route, or the existing
   `POST /api/exam/session` with an untimed config (D11).
5. **Storage:** `idempotency_keys` is an operational table with a reaper; reusing it for student-facing practice
   history is a stretch. A dedicated table needs a migration — **out of bounds without asking.**

**Stop rule:** not tripped yet (the store pattern reuses), but items 4 and 5 are the real P6 cost. If a general
per-question check cannot be built without sending keys to the browser or adding a migration, P6 stops and asks.

---

## B6 — What a results LIST needs

**Partly supported.** There is a list query: `fetchSittingHistory` (`read-dispatch.ts:351`) reads `visible_sittings`,
newest first, limit 200 (`HISTORY_LIMIT`), RLS-scoped, no student id passed. `SITTING_COLUMNS` already selects
`total_items, attempted_items, objective_percentage, objective_available_marks, pending_manual_marks`.

Gaps:
- `SittingSummary`/`AttemptSummary` drop marks earned and marks available (B4). Earned = percentage × available is
  *derivable* but rounding makes it inexact; the `ExamResult` jsonb carries the exact `objectiveMarksEarned`.
- `configSubject` only recognises numeracy / reading / language / mixed (`read-dispatch.ts:~335`). Science, spelling,
  digital technologies, AMC sittings get `subject: null` → a subject filter on the list will mis-bucket them. Fix
  belongs in P10.
- **Practice sets are not in the list** — nothing is stored (B1). P10's "practice/paper" filter can only be
  honest for papers unless D11 is chosen.
- No pagination beyond 200.

---

## B7 — Lesson data, strands, and lesson progress

- **Lesson record** (`features/curriculum/lessons/schema.ts:80-93`): `curriculumCode`, `title`, `strand`, `level`,
  `estimatedMinutes`, `learningIntention`, `successCriteria[]`, `prerequisites[]`, `sections[]`, `status`,
  `provenance`. Section kinds: `concept` (explanation, key terms, visual), `worked_example` (problem, steps,
  final answer, optional `commonError`), `misconception` (claim, why wrong, correction), `check`
  (`curriculumCode`, `practiceCount`). The design's "intention / success criteria / idea / worked example /
  common trap / practice questions" maps onto these. **SUPPORTED.** "Common trap" is `misconception` or
  `worked_example.commonError`; a lesson may have either, both or neither — P5 must tolerate absence.
- **Strands:** each lesson carries a single `strand` string; content is split by file
  (`content/level-3-number.ts`, `level-3-measurement.ts`, …). Levels present: **UNVERIFIED** for Year 5 — only
  level-3 files were listed; P5 must confirm Year 5 coverage before drawing the year picker (C9-style honesty).
- **Alignment:** `getMappedQuestionIdsForNode` (`lessons/alignments.ts`) maps a code to bank question ids;
  "shown as recorded, no alignment claim" is the safe wording.
- **Lesson progress: UNSUPPORTED — none is stored.** No `lesson_progress`/completion table or column in
  `supabase/migrations` or `src` (grep: zero hits). The one apparent hook,
  `discovery-recommendations.ts:12` ("for curriculum_lesson, real completion-so-far") is **not real**: the code at
  `:134-140` hardcodes `completed: 0, percent: 0, completedLabel: "Lesson 1 of N"`. `student/learn/page.tsx:40`
  admits "real completion tracking" doesn't exist. **C16 holds as written.** The 65% bar in
  `LearningHubUnitSpotlight` is invented and goes in P5.

---

## B8 — Exam Centre: duration, count, marks, fillability, shortfall

- **Duration and count come from the pattern**, not a sum: `examPatternSchema` has `questionCount` and `timeMinutes`
  (`exam-patterns/exam-pattern.ts:154-155`); full-length sittings use `pattern.timeMinutes * 60`
  (`pattern-session.ts:99`). **SUPPORTED**, matches C6.
- **Marks available per paper: not on the pattern.** Marks are per question (`question.schema.ts:220`,
  default 1, max 20). A paper's total is the sum over the drawn questions. It is exact only after selection
  (or if a pattern's sources are all one-mark). **UNVERIFIED** whether any available pattern has mixed-mark
  sources; P8 must either compute from a probe draw (as readiness does) or leave "marks" off until start.
- **Fillability:** `getPatternReadiness()` (`exam-bank.ts:114`) runs the real selection per pattern:
  `state: ready | short | unavailable`, `requestedCount`, `availableCount`, and `distinctPapers` (0–3
  provably non-overlapping papers). **SUPPORTED** — this is exactly what the three start-confirmation
  conditions need: "short" gives the offerable length (`availableCount`); `distinctPapers` backs "questions that
  will repeat" with a real number.
- **When it cannot fill:** `short` means "do not start as full-length; a clearly labelled practice module of what
  is available may be offered" (`pattern-readiness.ts` docblock). The session route returns `no_eligible_content`
  (`api/exam/session/route.ts:~140`). P8 must offer only `availableCount`, never the full length.
- **A paper already open:** `/api/exam/session/active` (404 `no_active_session` when none).
- **Human-marked questions in a paper (D7):** writing is 4 items in the whole bank (audit §2) and has no programme
  scope, so patterns almost certainly exclude them. **UNVERIFIED** per pattern.

---

## B9 — Help articles and problem reports

**UNSUPPORTED — neither exists.** No `help_article(s)`, `problem_report`, `support_ticket` or `feedback` table or
module in `supabase/migrations` or `src` (grep: no matches beyond an unrelated curriculum-platform migration).
`src/app/help` is the public marketing page (one `page.tsx`). Consequence: P11 ships browse-by-topic and "five most
asked" as static authored content in the repo (no records), **no search**, and **no report form** (also blocked by D10).

---

## B10 — Student preferences

**Partly.** `public.profiles` already carries per-student settings added by
`20260922100000_student_onboarding_preferences.sql:4-8`: `interests text[]`, `weekly_goal_minutes integer`,
`onboarding_completed_at`, `diagnostic_completed_at`, and the migration widens column-level grants so a student can
update their own preferences. So a per-student store exists and is RLS-governed.

It has **no column for display or accessibility preferences** (hide timer, reduced motion, etc.). One more
preference = one new nullable column (or one jsonb column) + a grant change = **a migration, which is outside this
brief's permitted changes.** Cost is small but it needs Vish's go-ahead and D10 (retention/moderation only matters
for free text, not for a boolean). Until then: no preference switch is drawn (C20), and P9's hide-timer waits.

---

## Decisions Vish needs to make (defaults apply unless overridden)

| # | Decision | Default |
|---|---|---|
| D1 | Sidebar + mobile bottom nav vs design.md §8.2 (header-based shell). **Blocks P2.** | Ask. Recommendation: yes, record the exception. |
| D2 | Strand floor = 5, as a new documented rule. | 5 |
| D3–D9 | As written in the brief. | As written |
| D10 | Preference store (and free-text moderation/retention). **Blocks P11's report form and any preference switch.** B10: a boolean needs a migration. | No switches, no form |
| **D11** (new) | Should a practice set be a server-backed *untimed exam session* (B1/B5)? Gives resume, a confirmed id, durable history in My Results; costs per-question checking (exam submit scores at the end) and mixes practice into the results list. | No — keep practice sets unsaved (C14), build per-question check on the sample pattern |
| **D12** (new) | Per-question check: first answer final (as the Singapore sample) or allow re-check after a wrong answer? | First answer final |
| **D13** (new) | P6 needs server-selected, answer-stripped question delivery for practice sets. That is a new route (no migration) but it means the runner no longer reads the guest bank. Approve? | Yes |

## Stop-rule status

- Totals differ from audit: **no** (zero delta).
- B1 shows practice sets cannot resume: **yes** → no practice-set Continue, no backend (as instructed).
- B5: reuse of the sample's store shape is plausible; delivery (B2) and storage (item 5) are the cost. Not tripped,
  but **P6 may stop** if D13 is refused or a migration proves necessary.
- Anything needing content, migration or hosted-config changes: **B10 hide-timer and any durable practice history**
  would. Not done; flagged.

## UNVERIFIED (to settle in the named phase)

- Whether responses are retained after submit on both storage models (needed for the answer review) — P10.
- Server-side scoring coverage for matching/ordering/multiple selection through the pure dispatcher — P6/P7.
- Year 5 lesson coverage — P5.
- Mixed-mark sources in any available exam pattern, and writing in any pattern — P8.
- Whether the parent-coverage `supportingContentCount` population matches the served bank (audit §10.3) — not needed.
