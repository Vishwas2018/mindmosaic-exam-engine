# Database readiness (hosted DEV `mfglzabnayacssgertat`)

Nothing in this document was executed against a hosted database in this session. Production
(`uermhsptduikehuyceiz`) is out of scope and was not contacted.

## What the integration branch needs from DEV

| Need | Why | State on hosted DEV |
|------|-----|---------------------|
| Migration `20261031090000_exam_writer_role_and_server_write_functions` | Creates `mindmosaic_exam_writer` and the `*_for` functions | Not applied as of the 2026-11-04 audit. Not re-read this session |
| `EXAM_WRITE_DB_URL` in the Vercel **Preview / DEV** environment | The app's only route to create a session or record an attempt | Absent as of 2026-11-04 |
| Deploy of this branch | Uses the new path | Not deployed |
| Migration `20261031090100_revoke_legacy_exam_write_rpcs_from_clients` | Closes the hole (students could call the legacy RPCs directly) | Not applied. **Must follow the deploy, never precede it** |

## Which paths depend on it (from reading the callers of `legacy-exam-writes.ts`, not from a hosted run)

| Path | Route | Without `EXAM_WRITE_DB_URL` |
|------|-------|------------------------------|
| Start an authenticated exam | `POST /api/exam/session` | `503 not_configured` |
| Submit an authenticated exam | `POST /api/exam/session/[id]/submit` | Attempt not recorded |
| Onboarding diagnostic | `POST /api/student/onboarding/complete` | Session and attempt not recorded |
| Guest practice | `/api/exam/guest-bank`, client state | Unaffected |
| Singapore Maths sample | `/api/practice/singapore-maths/sample/*` | Unaffected (own storage, #88) |
| Autosave of responses | `/api/exam/session/[id]/responses` | Unaffected once a session exists |

So Scenario B of the beta test (child sits and submits an assessment) cannot pass on hosted DEV until the four
rows above are done in order.

## Runbook

`docs/runbooks/legacy-exam-write-lockdown.md` is the reviewed sequence, with a verification query after every step
and a rollback table. It has no destructive step.

## Approval request (owner action)

1. Apply `20261031090000` to DEV only.
2. Set the role password out of band and store `EXAM_WRITE_DB_URL` as a Preview/DEV variable.
3. Allow a Preview deploy of `integration/beta-consolidation` (or of `dev` after #123 merges).
4. After the journey passes on that deploy, apply `20261031090100`.

Impact if not done: authenticated assessments fail closed with a 503. No data is at risk.
Rollback: step 1 is additive and may stay; step 4 is reversed by one `grant execute` (in the runbook).

## Verified in CI on a local Supabase stack (not hosted)

`rls` job on `d7914c21`: pass. It applies every migration in the repository, including both of the above, and runs
`tests/rls/exam-write-lockdown.test.ts`.

## Not verified

- Current migration state of hosted DEV.
- Whether the `SUPABASE_ACCESS_TOKEN` in `.env.e2e.local` still returns 401.
- RLS behaviour on hosted DEV (only the local stack was exercised).
