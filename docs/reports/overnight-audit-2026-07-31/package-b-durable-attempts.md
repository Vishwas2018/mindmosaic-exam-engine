# Package B — durable-attempts integrity audit

Traced create → save → resume → submit → score through
`src/app/api/exam/session/route.ts`,
`src/app/api/exam/session/[id]/responses/route.ts`,
`src/app/api/exam/session/active/route.ts`,
`src/app/api/exam/session/[id]/submit/route.ts`, the Zustand store
(`src/features/exam-engine/state/exam-store.ts`), the schema
(`supabase/migrations/20260718090000_phase0_roles_and_exam_schema.sql`,
`20260719100000_exam_responses.sql`), and the existing unit/RLS tests.
Read-only — no live queries needed beyond what Package A already ran (the
constraint/policy state confirmed there is reused here).

## Guarantee-by-guarantee

| Guarantee | Status | Evidence |
|---|---|---|
| Optimistic concurrency (compare-and-set on a version) | **MISSING** | `exam_sessions` and `exam_responses` have no version/`updated_at`-guard column in schema (`20260718090000_phase0_roles_and_exam_schema.sql:41-49`, `20260719100000_exam_responses.sql:16-23`). Autosave is a plain `upsert(..., {onConflict:"session_id"})` (`src/app/api/exam/session/[id]/responses/route.ts:80-90`) — last-write-wins. `autosaveRequestSchema` (`server-scoring-contract.ts:77-81`) carries no sequence/version field for the server to compare against. No test file references "version" or "concurrency". Two concurrent autosave requests (e.g. two open tabs) can arrive out of order at the network layer and the later-arriving response silently overwrites the newer state with older data — nothing detects or prevents this. |
| Idempotent + atomic submission (transition + scoring in one transaction; same-key replay returns the same result) | **PARTIAL** | *Atomic write*: implemented. A single `INSERT` (`submit/route.ts:125-130`) is one Postgres statement, and the unique constraint `exam_attempts_session_id_key` (confirmed live in Package A) makes "at most one attempt per session" a database-level guarantee, not an application race the route merely tries to avoid. *Idempotent replay*: **not implemented as specified**. A duplicate submit returns `{error:"already_submitted"}`, HTTP 409, with no `result`/`reviewQuestions` (`submit/route.ts:139-141`) — deliberately, per the test name `"returns the idempotent 409 (not a 500) when the insert loses the TOCTOU race"` (`src/tests/unit/exam-submit-route.test.ts:133`). That is idempotent in the sense of "never double-scores or double-inserts," but a legitimate retry (double-click, network retry after an unacknowledged first success, or the genuine loser of a race) gets an error, not its own already-recorded result. `ServerAuthoritativeScoringService.score()` throws on any non-OK response (`server-authoritative-scoring-service.ts:46-48`), and the store's catch handler resets `status: "in_progress"` and restarts the autosave loop (`exam-store.ts:558-566`) rather than fetching the stored attempt — so a client stuck in this state retries forever, always hitting 409, never reaching `/results`. **There is no route to fetch an already-submitted attempt's result** — `find src/app/api -type d` and a grep for `exam_attempts` across `src/app/api/` turn up only the three exam routes already covered plus the unrelated teacher-marking route; `/results` reads exclusively from in-memory Zustand state (`src/app/results/page.tsx:141-155`), with no server fallback. |
| Immutable attempt/question-version snapshots | **PARTIAL** | *Row immutability*: implemented and strong. `exam_sessions` and `exam_attempts` both carry the explicit comment `"No update/delete policies: a session/attempt is immutable once created/written."` (`20260718090000_phase0_roles_and_exam_schema.sql:343`, `:372`) — confirmed live in Package A: no UPDATE or DELETE policy exists on either table, so this is a database-enforced guarantee, not just an absence of a route. *Question-content immutability*: weaker than the wording implies. `exam_sessions.selected_question_ids` stores **ids only** (`schema:46`), never a content snapshot; `exam_attempts.result.questionDetails` stores `questionId` + marks/status only (`exam-report.ts:9-19`), not the question's actual prompt/options text. `getExamBank()` reads from statically bundled content modules (`src/server/exam-bank.ts:11-33`), so content can only change on a new deploy — bounded risk, not zero: if a question's answer key or wording is edited in a later deploy while a session from before that deploy is still open (autosave/resume/submit all recompute from the **current** `getExamBank()` call, e.g. `active/route.ts:74-78`, `submit/route.ts:88-96`), the student would resume into, and be scored against, content that differs from what they were originally shown. I did not find a route that re-derives a **past, already-submitted** attempt's question content from the bank by id for later display (grepped `getExamBank`/`getQuestionById` usage across `src/`) — the one post-submission reveal (`reviewQuestions`) is returned inline at submit time and not refetched later, which limits the exposure to the resume-across-a-deploy window specifically, not general reads of history. I could not fully trace the teacher marking detail page's data source in the time available; flagging as unverified rather than asserting it's clean. |
| Enforced lifecycle transitions | **IMPLEMENTED (informal)** | No explicit `status` enum column exists on `exam_sessions`; the state is inferred by construction rather than named: created = session row exists; in-progress = no `exam_attempts` row yet and `now <= expires_at`; submitted = `exam_attempts` row exists (terminal, enforced by the unique constraint plus no-UPDATE/DELETE policies above). Transition guards are real and checked at each route: autosave rejects with 410 past `expires_at` (`responses/route.ts:62-64`) and 409 once an attempt exists (`:70-77`); submit rejects with 410 past `expires_at` (`submit/route.ts:65-67`) and 409 once an attempt exists (`:69-76`); a late-but-within-grace submission is clamped to the deadline and recorded as `timer_expired` rather than accepted at face value (`submit/route.ts:104-112`). This holds as a guarantee today, but it is enforced by the conjunction of several independent checks rather than one canonical state machine — a future route that forgets one of these checks would silently reopen a transition, and nothing would catch that class of regression short of the specific unit tests that exist for the current routes. |
| No answer-key leakage through any candidate-facing API | **IMPLEMENTED** | `toCandidateQuestion()` (`src/features/exam-engine/types/candidate-question.ts:44-54`) is the one function that strips `answerKey`/`explanation` via destructuring, and its own doc comment states it is meant to be the only path. Grepped `src/app/api/` and `src/features/exam-engine/state/` for hand-picked `answerKey` access outside this function and test files — **zero hits**. `CreateSessionResponse` and `ActiveSessionResponse` both route their questions through `toCandidateQuestions()` (`session/route.ts:121`, `active/route.ts:99`). The one sanctioned reveal, `reviewQuestions` (full `AuthoringQuestion`, answer key included), is returned **only** from the submit response, after the attempt is already recorded (`submit/route.ts:148`) — never before. `src/tests/unit/bundle-boundaries.test.ts` independently guards that `/exam`, `/results`, `/showcase` never import the production question bank directly or via the exam-engine components barrel, which would be the static-analysis equivalent of a leak. This guarantee holds and is exercised by name-checkable tests. |

## Summary

Two guarantees hold cleanly (immutable rows, no answer-key leakage). One
holds informally but without a single point of enforcement (lifecycle
transitions). Two are real gaps, not just missing polish:

- **No optimistic concurrency at all** on the one table that needs it most
  (autosave) — silent last-write-wins between concurrent requests.
- **Idempotent replay returns an error, not the original result**, and the
  client has no way to recover its own already-recorded attempt — a design
  gap that produces an observable bug (infinite resubmit loop) for anyone
  who legitimately hits the race the unique constraint was built to survive.

Neither gap has caused data corruption — the unique constraint and the
immutable-row policies mean the *stored* data is always correct even when
the *client experience* around a race is broken. That is the right failure
mode to have discovered one deep, but it is still worth fixing: the autosave
race is plausible any time a student has the exam open in two tabs (common
on a shared family device), and the resubmit loop is directly reachable by
an ordinary double-click on the submit button under slow network
conditions.
