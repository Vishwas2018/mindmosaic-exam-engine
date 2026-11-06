# My Space + Practice Studio — P0 trace (6 Nov 2026)

Docs only. Base: `origin/dev` @ `17d8be2fcf81ab456980b24a65d4da0bc38950b2` (fetched 6 Nov; unchanged since the 4 Nov
fetch the audit used). Audit: `docs/content-status/practice-availability-2026-11.md` (committed unchanged).
Verdicts: SUPPORTED / UNSUPPORTED / UNVERIFIED. Paths are relative to the repo root.

## Totals re-run on this base

Run through the app's own loading path (`getExamBank("practice")` via `scripts/lib/allow-server-only.mts`). The counting
script was a temporary file, deleted, and is not in this commit.

| Measure | Audit (79441a12) | This base (17d8be2f) | Delta |
|---|---|---|---|
| Total served | 1,601 | 1,601 (1,601 unique ids) | 0 |
| Year 3 / Year 5 | 940 / 661 | 940 / 661 | 0 |
| AMC questions | 53 | 53 | 0 |
| Strand groups / with >= 5 | 141 / 95 | 141 / 95 | 0 |
| Distinct strand labels | 81 | 81 | 0 |
| Topic groups / with >= 5 | 754 / 62 | 754 / 62 | 0 |
| Duplicate-prompt groups / questions | 17 / 68 | 17 / 68 | 0 |

No delta. The audit measured the WP1 candidate (33 commits ahead of `dev`); this base is plain `origin/dev` and gives identical figures. Why is not investigated here.

## B1 — Can a signed-in practice set survive reload or a device change?

**UNSUPPORTED.** Practice sets cannot resume.

- `src/features/exam-engine/practice-mode/use-practice-session.ts:31` — state is a plain `useReducer` over
  `practiceReducer`. No `fetch`, `localStorage`, `sessionStorage` or persistence call anywhere in
  `practice-mode/` (grep for each returned only reducer hits).
- `src/app/practice/session/page.tsx` — the question set is rebuilt in the browser on every load (see B2); there is no
  session id to resume.
- No server record exists for practice, so there is no server-confirmed save time for it.
- Exam sessions, by contrast: **SUPPORTED** — `src/app/api/exam/session/active/route.ts`,
  `src/server/assessment/read-dispatch.ts` (`readTargetSitting`, ~L650-740), `src/features/exam-engine/state/resume.ts`.

**Stop rule applies:** no practice-set Continue, no backend.

### Server-confirmed save time (C12) — narrower than the audit says

The audit called `lastAutosavedAt` SUPPORTED. It exists, but:

- `src/features/exam-engine/state/exam-store.ts:347` sets `lastAutosavedAt: clock()` — the **client's** clock, on a 2xx
  response. The server does return `savedAt` (`src/app/api/exam/session/[id]/responses/route.ts:75,135`; contract
  `AutosaveResponse` at `server-scoring-contract.ts:142`) but the store ignores it.
- It is in memory only. `ActiveSessionResponse` (`server-scoring-contract.ts:152-163`) has **no** save timestamp, so My
  Space, which reads `/api/exam/session/active`, cannot say "saved on our server at 4:15 pm" today.
- The database holds the data: `exam_responses.updated_at` (`20260719100000_exam_responses.sql:22`) and the target model
  returns `savedAt` from `max(r.updated_at)` (`20260814100000_assessment_session_resume_state.sql:126-142`). The legacy
  read path (`read-dispatch.ts` ~L650) selects only `responses, current_question_index, flagged_question_ids`.

Verdict: server-confirmed time inside a running exam is **SUPPORTED** (as "saved just now", via the client's own clock on a
confirmed response). On My Space it is **UNSUPPORTED** until `/active` returns `savedAt`.

### Position ("question 7 of 10")

`currentQuestionIndex` is always a number: `read-dispatch.ts:664` and `:730` default it to `0` when nothing is recorded.
So "position 0" cannot be told apart from "no position saved". **UNSUPPORTED** as a distinguishable fact; show "6 answered ·
4 remaining" only (that count is derivable: `active-session-view.ts` `toActiveSession`). Show a position only if the
payload gains a nullable field.

### Uncertain-save state

**UNVERIFIED / not built.** The store records a failed flush only by not updating `lastAutosavedAt`
(`exam-store.ts:347-350`, catch is best-effort). There is no "N answers confirmed, latest may not have reached us" state to
read. It would need a count of answers at last confirmed save. It is only reachable inside the exam runner, not My Space.

## B2 — How does signed-in /practice/session get its questions, and who selects?

**The client selects, from the answer-bearing guest bank, for everyone including signed-in students.**

- `src/app/practice/session/page.tsx` `fetch("/api/exam/guest-bank")` (the effect near the top), with its own comment:
  "Reused here rather than a new endpoint … the same client-side-selection trade-off the guest exam flow already accepts …
  regardless of whether the student is signed in."
- Standard mode: `filterEligibleQuestions(pool, …)` then `seededShuffle(scoped, seed).slice(0, count)` in the browser. The
  seed is deterministic from the filters (`buildSeed`) unless a `seed` param is passed.
- `/api/exam/guest-bank` is `force-static` and returns keys and explanations (audit §7). **So signed-in practice already
  ships answer keys to the browser.** This is the existing state of `dev`, not something any phase here adds (C10), but it
  means the audit's "signed-in sessions are answer-stripped" holds for exams (`/api/exam/session` →
  `toCandidateQuestions`, `route.ts:252`) and **not** for `/practice/session`. The audit's open question 5 is partly
  answered: key exposure to signed-in practice is already true on `dev`.
- Navigation only: no session id is created. Start practice = navigate to `/practice/session?subject=&year=&style=&skill=&count=&seed=`.
  Parameters come from `practice-params.schema.ts`.
- No strand parameter exists. `skill` and `curriculumCode` exist; `strand` does not. Filtering by strand needs a new
  param plus a selection step (B5).
- De-duplication (C5): neither selector dedupes. Exam path: `selectExamQuestions` (`select-questions.ts`) filters then
  shuffles. Practice path: `seededShuffle(...).slice` in `page.tsx`. Both can serve the same prompt twice from two ids.
- Vestige of C1: `practice-params.schema.ts` still parses an `extended` param (`val === "1"`). Nothing in `page.tsx` reads
  it. Harmless, but it is dead configuration naming a removed feature.
- A branch `wip/practice-reveal-states`: not found locally (`git branch -a --list`) and not found on `origin`
  (`git ls-remote --heads`). Reported, not built on.

**Start practice cannot return a confirmed session id.** There is no create-practice-session endpoint. P4 must be
navigation to `/practice/session` and say so.

## B3 — `getBankEligibility()` cell

`src/features/exam-engine/selection/eligibility-summary.ts`. Executed on this base.

- Shape: `Record<string, { count: number; fullDurationSeconds: number }>`; key `${yearLevel}:${examStyle}:${subject}`.
  650 cells for the practice bank. Both fields are always numbers; there is no `null`.
- **No strand level.** Keys have exactly three segments; no strand or topic. The summary cannot supply strand counts. P1
  needs a new server-side function over `getExamBank("published")` (or an extension of this builder) — see B5.
- Counts include duplicate prompts (17 groups / 68 questions), so counts are over-stated by the duplicates.
- Zero is not special: `5:icas_style:science` → `{count: 0, fullDurationSeconds: 600}`. `600` is
  `MINIMUM_FULL_EXAM_DURATION_SECONDS` (`selection-config.ts:193`); never display duration when count is 0.
  `3:icas_style:science` → `{count: 99, fullDurationSeconds: 9000}` (150 minutes; full-exam, buffered 1.5x, clamped
  10-180 min). Not a short-set time.
- Integrity failure: `servedBank()` returns an empty frozen array (`exam-bank.ts:39`) so every cell reads `count: 0`.
  **Indistinguishable from "really none".** The two zero states of C7 cannot be told apart from this function's output.
  P1 needs a separate integrity signal (e.g. reading `getPublicationEligibility().problems.length` or a thrown/flagged
  result) alongside the counts.
- Vocabulary: catalogue subject (`language`) is mapped to bank subject (`language_conventions`) inside
  `filterEligibleQuestions` (`select-questions.ts`, `SUBJECTS_BY_FILTER`). Consume the summary keys directly, and in any new
  strand code reuse `filterEligibleQuestions`, never a hand-rolled join.
- Stale docblock: `selection-config.ts:6-22` still describes `practice` as "published plus ~1,100 auto-generated seeds" and an
  "extended practice bank" toggle; `exam-bank.ts:149-152` says "24 strands" (81 labels in data). Both misleading.

## B4 — What backs "Recent results" / "Review answers", and what can a strength rest on?

- **Recent results: SUPPORTED** for **exam** sittings only. `fetchStudentOverview()` (`src/features/student/data.ts`) →
  `fetchSittingRows(limit 50)` → `buildOverview` → `AttemptSummary` (`attempt-summary.ts`): id, `submittedAt`, title,
  subject, total, `scorePercent`, `attemptedQuestions`. Practice sets never write a row, so a completed practice set never
  appears in Recent results.
- **Review answers: UNSUPPORTED for past attempts.** `src/app/results/ResultsColdLoad.tsx` says there is "no per-attempt
  review route"; `/results` reads the store, which only holds the attempt just submitted. Only an immediate post-submit
  review exists. A "Review answers" link in My Space could point at nothing.
- **Strength / area to practise:** `aggregateMastery` (`attempt-summary.ts` ~L174) gives **subject-level**, marks-weighted
  percentages over up to 50 recent sittings, excluding confidence-mode sittings, `recommendedFocus` = weakest subject. That is
  honest at subject level, over exam sittings only.
- `recommendSkills(result, questions)` (`recommendation/recommend-skills.ts:97`) is **single-sitting**, needs the full
  `ExamResult.questionDetails` and question metadata, so skill-level areas rest on the most recent sitting only. It cannot be
  computed from the overview list.
- Honest copy: "Based on your last N exam sittings, by subject" for subject view; "Based on your most recent exam" for skills.
  Not practice sets.

## B5 — Behaviours the design needs that the backend cannot make true, and the smallest change

| # | Design behaviour | Why it is not true today | Smallest change (not built) |
|---|---|---|---|
| 1 | Continue a practice set | B1: client-only reducer | Out of scope per stop rule. Continue = exam sessions only |
| 2 | "Saved on our server at 4:15 pm" on My Space | `/active` carries no `savedAt` | Add `savedAt` (from `exam_responses.updated_at` / `max(updated_at)`) to `ActiveSessionResponse` in `readLegacySitting` and `readTargetSitting`. Contract change, no migration |
| 3 | "Question 7 of 10" | index defaults to `0` (ambiguous) | Make `currentQuestionIndex` nullable in the payload, or omit position. Default: omit |
| 4 | Uncertain-save state | no unconfirmed-count signal | Track answers-at-last-confirm in the exam store. Exam runner only |
| 5 | Strand counts and strand-level start | summary is subject-level; no strand param | New pure builder over the served bank (P1) reusing `filterEligibleQuestions`; add `strand` to `practice-params.schema.ts` and a filter step. Touches the practice param contract |
| 6 | Unique-prompt counts / no duplicate in a set | neither selector dedupes | Dedup by prompt hash in P1's counter **and** in the selector that picks the set. For practice that is client code in `page.tsx` (a shared pure helper) |
| 7 | "Can't check right now" distinct from "none" | empty bank ≡ all zeros | Surface integrity status separately in P1 |
| 8 | Start practice returns a session id | none exists | Do not invent. Navigate and say so (B2) |
| 9 | Review answers for past attempts | no review route (B4) | Omit link, or build a per-attempt review route. Owner decision |
| 10 | Start again clears saved answers | Nothing is saved for practice. `restart` only exists on the end-of-set summary screen, labelled "Practice again" (`PracticeSession.tsx:303-308`), and resets to the **same** questions in memory (`practice-reducer.ts:177`). No server discard exists for exams; whether starting a new exam supersedes an active one is **UNVERIFIED** (`/api/exam/session/route.ts` has no active-session check) | See C13 note below |
| 11 | Signed-in practice answers hidden until submit | Keys already ship via `guest-bank` (B2) | Not caused by this work. Report to owner. Do not build on it |
| 12 | Recent practice results | Practice writes nothing | Show exam results only, say so |

### C13 — Start-again dialog

The dialog "your saved answers will be cleared" **cannot be made true**:

- For practice there is nothing saved to clear. The only restart is the end-of-set "Practice again", which re-runs the same
  set; there is no mid-set "Start again" in the code.
- For exams there is no discard endpoint, and `POST /api/exam/session` does not close an earlier active session
  (UNVERIFIED beyond the route file).

Honest alternatives: (a) drop the dialog; Practice again on the summary needs none; (b) for an exam with answers, a dialog is
only accurate if it says what happens ("you'll start a new exam; your unfinished one stays open until it expires"), which
needs the UNVERIFIED lifecycle checked. **Owner decision needed before P3.**

## Other observations for later phases

- Public/other occurrences of "Learning Hub" in the practice runner: `src/features/exam-engine/practice-mode/PracticeSession.tsx`
  and `src/app/practice/session/page.tsx` ("Learning Hub", "Back to Learning Hub"). To list in the P2 PR; not changed in P0.
- P2 pinned tests to check: `student-shell.test.tsx`, `navigation-graph.test.ts`, `a11y-student-dashboard.spec.ts`,
  `student-portal-content.spec.ts` (not read in P0).
- D1 (bottom nav vs `docs/design.md` §8.2) is not resolved here.
