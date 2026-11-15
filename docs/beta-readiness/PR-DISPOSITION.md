# PR disposition — 2026-11-15

All 43 PRs that were open on 2026-11-15 were triaged against `dev` `c93e5100`. Method: each PR head was trial-merged
into `dev` (`git merge-tree`). Every file the PR touched was compared with `dev`'s copy, and any file not in `dev`
was looked at by hand. Branches are **not** deleted. A closed PR can be reopened or cherry-picked.

Integration PR: **#127** (`integration/dev-final`). Backlog of deferred work: **issue #128**.

## Integrated now (in #127)

| PR | What went in |
|----|--------------|
| #126 | Final evidence docs + A0 real-email spec, merged unchanged. Closed once #127 merges. |
| #95 (part) | `3512fb8c` concurrent exam starts no longer create duplicate sessions. `e5b02db3` bar-chart accessible data list (renderer + test). |
| — | `dev` CI fix: PIN sign-in specs wait for one settled form (e2e-auth failed on `c93e5100`). |

## Already in `dev`: closed as superseded

| PR | Evidence |
|----|----------|
| #119 workspace redesign RC | Reconciled onto `dev` by #123 (`100287e7`). |
| #99–#104 student P1–P6 | Delivered through #119 → #123. 75–100% of their files are byte-identical in `dev`; the rest were changed later in `dev` (#122 honesty fixes). |
| #106, #107, #113–#117 parent P1–P7 | Delivered through #119 → #123. Every file exists in `dev`. The differences are later `dev` corrections: no sample-family defaults, no simulated support ticket (`MM-4821`), no "NEEDS A BUILD" canvas notes (#121, #124). |
| #108 parent workspace UI (8 Nov) | Earlier, separate implementation, replaced by the P-series components in `dev`. |
| #109–#112 student/auth/admin/billing visual preview modes | Design-artboard fixture previews. #111 is 74/79 files identical in `dev`. `dev` deliberately keeps fixture data out of real pages (#124 decision). Student preview remains at `/dev/student-preview`. |
| #118 auth journey phase 2 | `dev` has the auth journey (#120/#123): `AuthMosaicPanel` brand panel, recovery marker (`src/features/auth/recovery-marker.ts`, cleared after reset and on sign-out), student help at `/student-sign-in/help`. |
| #93, #94 auth links / verified recovery | Included in #118 → #123: `token_hash`/PKCE/implicit handling, verified recovery session. |
| #91 legacy exam-write RPCs | Migrations `20261031090000`/`090100` and `src/server/exam-write/legacy-exam-writes.ts` are in `dev`. Applied on DEV Supabase 2026-11-14. |
| #95 WP1 candidate (rest) | Fixed papers are superseded by the approved-only publication gate. The server recovery grant was not adopted (`dev` uses the hosted-verified recovery marker; option recorded in #128). The writer TLS/identity check is moved to #128. |
| #73 scholarship sample | Superseded by #85 (merged 2026-10-29). |
| #60 Singapore foundation | Superseded by #84/#88. `bar_model` validation is in `dev` (`scripts/validate-bar-models.mts`). |
| #59 beta hardening | `signup-policy` is in `dev`; erasure requests already exist (`20260817*`). Remaining rate limits / server-side role moved to #128. |
| #24 explicit grants | 2026-10-30 deadline passed. Hosted DEV acceptance is green after it. A re-check before PROD is in #128. |
| #55 review console | Dev-only tool, 129 commits stale. `/admin/review` exists. Listed in #128. |
| #40, #29 landing hero iterations | Superseded by later landing work (#82, #92, Oct 2026 owner brief). |
| #97, #98, #105 journey trace docs | Planning docs for work that has since shipped. |
| #25, #26, #56, #57 October docs drafts | Replaced by `docs/beta-readiness/*` (RELEASE-CHECKLIST, CONTENT-GOVERNANCE, MASTER-PLAN). |

## Kept open, with a reason

| PR | Why open | Who |
|----|----------|-----|
| #87 `dev` → `main` release | Production release. Owner only. | Owner |
| #96 UX audit fixes + Night mode | Not superseded, but conflicts with the redesigned shells in 6 files. The dark palette has had no human review. Deferred until after the beta (#128). | Owner visual review |
| #86 `/programs` redesign | Clean merge, but marketing visual change never approved by the owner. | Owner visual review |
| #58, #61 draft content packets | `draftOnly` content. Nothing is served until a human approves it. | Human content sign-off |
