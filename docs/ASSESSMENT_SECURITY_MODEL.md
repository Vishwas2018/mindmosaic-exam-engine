# Assessment Security Model

## Read this first

**MindMosaic's exam engine, as it stands today, is suitable for low-stakes local practice only. It is not a secure, tamper-resistant, or proctored assessment platform, and must not be presented as one.**

The production question bank — every question, every answer key, every explanation, every scoring rule — ships inside the client JavaScript bundle. A user with browser developer tools, or anyone willing to read the deployed JavaScript, can find the answer to every question in the bank. Nothing server-side verifies a submitted response. This document explains exactly what boundary exists today, why, and what would need to change before this could support a trusted, high-stakes assessment.

## Why the bank is still in the client bundle

The product constraint for this phase is explicit: local practice, no backend, no Supabase, no accounts, no server. Given that constraint, there is no way to keep answer keys out of the client entirely — a fully static site has no server to hide them behind. The hardening work in this phase does not (and cannot) change that; what it does is:

1. Establish a clear boundary so the *architecture* is ready for a server the day one exists, rather than needing every renderer and every scoring call site rewritten.
2. Stop answer keys from being available anywhere they don't need to be — specifically, out of the one piece of state the whole exam UI reactively subscribes to.
3. Name the security limitation explicitly, in code and in documentation, so nobody mistakes "it works" for "it's secure."

## The DTO boundary

Three named types describe the same underlying question data at different points in its lifecycle (`src/features/exam-engine/types/candidate-question.ts`):

| Type | Contains | Used by |
| --- | --- | --- |
| `AuthoringQuestion` | Everything — answer key, explanation, editorial fields. Alias for the full `Question` schema type. | Content authoring, selection, scoring, review |
| `CandidateQuestion` | Everything except `answerKey` and `explanation`. Keeps `answerKind` (the answer's *shape* — e.g. `single_option` — not its value) because a few renderers dispatch on it, and `minWords`/`maxWords` for essay-style instructional guidance. | Every question renderer, the exam UI, the renderer showcase |
| `ReviewQuestion` | Alias for `AuthoringQuestion`. Named separately to mark the one place revealing full content is correct, not accidental. | The results/review screen, after submission only |

`toCandidateQuestion` (same file) is the **only** place answer-revealing fields are removed. Every candidate-facing surface reaches a `CandidateQuestion` through this function — nothing hand-picks fields off an `AuthoringQuestion`.

### What this buys you today

- **`useExamStore`'s `questions` field — what the exam UI actually subscribes to and re-renders from — never contains an answer key.** `startExam` converts the selected questions to `CandidateQuestion[]` before they ever reach `set()`.
- The full authoring bank passed to `startExam` is kept in a module-level variable *outside* the Zustand store, not in reactive state. Selection is a pure function of `(bank, config, seed)`, so `submitExam` can deterministically recompute the same full authoring questions to score against without the store ever holding one mid-attempt.
- The recomputed authoring questions are written to a separate `reviewQuestions` field **only at submission** — `null` for the entire duration of the attempt, populated only once the exam is over. This is what the results page reads for correct answers and explanations; nothing before submission can reach it.
- `ScoredResponse.requiresManualMarking` and `.manualReviewRequired` are deliberately distinct (see [Architecture](ARCHITECTURE.md) and the question schema doc) so a blank essay is `unanswered`, not silently treated as "pending" — a scoring-integrity fix that fell out of the same DTO work.

### What this does not buy you

- The full bank — including every `CandidateQuestion`'s stripped `answerKey`, still present in the *authoring* modules imported by the selection code — is still present in the JavaScript bundle shipped to the browser. `toCandidateQuestion` prevents it from reaching *reactive component state*; it cannot prevent it from reaching the *bundle*, because there is no server boundary to stop at.
- A user who opens browser dev tools, sets a breakpoint inside `selectExamQuestions` or `buildExamResult`, or simply reads the bundled `question-bank.js` chunk can read every answer key directly.
- Nothing prevents a user from calling `useExamStore.getState().submitExam(...)` from the console with a fabricated `responses` object, or from patching the scoring functions at runtime.

## The scoring service boundary

Scoring is called through an explicit interface rather than a direct function call (`src/features/exam-engine/scoring/assessment-scoring-service.ts`):

```typescript
export interface AssessmentScoringService {
  score(
    questions: readonly AuthoringQuestion[],
    responses: ExamResponses,
    context: ExamResultContext,
  ): ExamResult;
}
```

`LocalPracticeScoringService` is the only implementation today — a thin pass-through to `buildExamResult`. `exam-store.ts`'s `submitExam` is the **only** call site; it calls `localPracticeScoringService.score(...)`, never `buildExamResult` directly.

This exists so that a future server-authoritative implementation — submit question IDs and responses to a server, score against a bank the client never receives, return a result DTO — is a drop-in replacement for `LocalPracticeScoringService` at this one call site. No renderer, no page component, and no other part of the store needs to change.

**`LocalPracticeScoringService` must never be wired into anything that claims to be a trusted, proctored, or high-stakes assessment mode without first being replaced.** There is currently no code-level guard preventing that misuse beyond this documentation and the name itself; that is an accepted limitation of an app with no server to enforce it from.

## The Phase 4 server-authoritative path

If and when a backend is introduced, the natural sequence is:

1. Move the authoring question bank (with answer keys) to server-only storage; the client only ever receives `CandidateQuestion[]` over the network, generated server-side by the same `toCandidateQuestion` function (or its server-side equivalent).
2. Implement `AssessmentScoringService` against a server endpoint: the client submits `{ questionIds, responses }`, the server scores against its own copy of the bank, and returns an `ExamResult`. Swap `localPracticeScoringService` for this implementation in `exam-store.ts`.
3. Move session selection (`selectExamQuestions`) server-side too, or accept a server-issued session token, so a client cannot request an arbitrary seed/config combination and read back the full selected set before playing back "already knowing" which questions are coming (a client-side-only limitation today: the seed is visible in the URL and the selection algorithm is public).
4. Add authentication and persistence — attempt records, learner accounts — behind the same boundary, per the "Future backend boundary" section of [Architecture](ARCHITECTURE.md).

None of this requires touching a question renderer, `ExamQuestion`, or the results page's layout — they already consume `CandidateQuestion`/`ReviewQuestion`, not raw authoring data.

## Summary of residual risk (as of this hardening pass)

| Risk | Present today? | Mitigated by |
| --- | --- | --- |
| Answer keys readable in the JS bundle | Yes — unavoidable without a server | Documented; not claimed to be secure |
| Answer keys in reactive/inspectable app state (Redux/Zustand devtools, React devtools) | No | `CandidateQuestion` boundary — `questions` never carries one |
| Answer keys visible on the results/review screen before submission | No | `reviewQuestions` is `null` until `submitExam` runs |
| Console/runtime tampering with scores or responses | Yes | None — no server to verify against |
| Reusing the local scoring adapter in a "trusted" mode by mistake | Possible | Naming + this document only; no runtime guard |

Do not claim secure, high-stakes, or proctored assessment capability for this application until a server-authoritative `AssessmentScoringService` implementation and authenticated persistence exist.
## Addendum — Phase 0 decision: moving to server-authoritative scoring

The body of this document above describes the local-practice, no-backend
scaffold. That constraint no longer holds — Supabase is now in the repo for
authentication, and Phase 0 of the multi-role build (student/parent/teacher/
admin dashboards, assignments, analytics) requires attempt results that a
parent or teacher can actually trust. A client-reported score is not
sufficient once other people rely on it.

**Decision: Phase 0 implements the server-authoritative path this document
already named as the eventual direction**, rather than deferring it further.
As built (including the Phase 0.1 delivery-channel fix):

1. Question selection is server-side, **at exam start**. `startServerExam`
   calls `/api/exam/session` before the student has seen a single
   question; the Route Handler runs `selectExamQuestions` with a
   **server-generated seed** (the request schema has no seed field — a
   client can neither choose nor predict its own selection), persists the
   chosen question IDs to `exam_sessions` (see
   [Data model and roles](DATA_MODEL_AND_ROLES.md)), and returns only
   `CandidateQuestion[]` plus the session id.
2. `ServerAuthoritativeScoringService implements AssessmentScoringService`
   calls `/api/exam/session/:id/submit` with the raw responses. The server
   loads its own stored `selected_question_ids`, recomputes the authoring
   questions from the server-only bank, scores with the existing pure
   `buildExamResult`, writes an `exam_attempts` row, and returns the
   `ExamResult` together with the full `ReviewQuestion[]` — the one
   sanctioned reveal, after the attempt is recorded, for the review
   screen. The client never sends or receives an answer key before this
   point.
3. `exam-store.ts`'s `submitExam` selects the scoring service from how the
   session was created (`sessionMode`, fixed at start): a server-created
   session submits to the server; a guest session keeps
   `LocalPracticeScoringService` exactly as today. One conditional at the
   existing call site — no renderer or page rewrite, the point of the
   `AssessmentScoringService` seam. Auth state changing mid-attempt cannot
   re-route a session to a scorer it wasn't built for.
4. The question bank is server-only across **every server-to-client
   delivery channel**, not just JS chunks: no client module may import it
   (eslint rule + `server-only` marker on `src/server/exam-bank.ts`), no
   page payload may carry it (the exam setup screen receives precomputed
   eligibility summaries — counts and durations, no question content), and
   `npm run check:bundle` scans emitted JS chunks, prerendered HTML **and
   RSC flight payloads** for bank-content sentinels. The JS-only version of
   that check once missed the bank riding to every visitor as home-page
   RSC props; the payload scan exists so that cannot regress silently.
5. Guest practice stays fully client-side and account-free: guests
   download the bank (answer keys included) from the public, statically
   generated `/api/exam/guest-bank` endpoint at start time. That endpoint
   is guest mode's documented, accepted residual — equivalent exposure to
   the bank that used to ship in the client bundle, now confined to a URL
   that no signed-in flow ever fetches or depends on.

### Updated residual risk table (post-Phase-0, with 0.1 delivery fix)

| Risk | Guest session | Signed-in session |
| --- | --- | --- |
| Answer keys delivered to the browser (any channel: JS chunk, HTML/RSC payload, fetch) | Yes — via `/api/exam/guest-bank`, the accepted trade-off of accountless practice | No — page payloads carry eligibility summaries only (verified by the `check:bundle` payload scan); questions arrive answer-stripped from `/api/exam/session`; answer keys appear only in the submit response, after the attempt is recorded |
| Client can choose or predict its own seed/question set | Yes (URL param, local selection) | No — the server generates the seed and stores the selection at start; the request schema has no seed field |
| Console/runtime tampering with scores or responses | Yes | No — the server recomputes questions and score from its own stored session, independent of anything client-held |
| Parent/teacher dashboards reflect a trustworthy score | N/A (no dashboards read guest data) | Yes — dashboards read only server-computed `exam_attempts` rows |

One caveat stated plainly: `/api/exam/guest-bank` is a public URL, so a
signed-in student who goes looking can fetch it — exactly as they could
read the client bundle before. What signed-in mode guarantees is that
their own session's selection and scoring never depend on anything the
client holds, and that no page render hands them answer keys. Removing
the public guest bank entirely would mean removing accountless guest
practice, which the guests-allowed decision forbids.

Guests remain exactly as documented in the rest of this file — this
addendum does not change guest behaviour (their bank now arrives via a
fetch instead of inside the page/bundle payload, with the same content
and the same client-side flow), only what happens once a visitor is
signed in.
