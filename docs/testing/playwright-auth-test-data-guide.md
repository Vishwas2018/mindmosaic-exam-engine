# Authenticated Playwright setup

Foundation for testing parent/student/teacher/admin screens against a real,
local Supabase instance — real GoTrue sessions, real RLS-scoped queries,
deterministic seeded identities. Covers auth + test-data plumbing only; it
does not implement the full authenticated screen suite (see
[Remaining blocked authenticated journeys](#remaining-blocked-authenticated-journeys)).

The existing `e2e/*.spec.ts` suite (`playwright.config.ts`, `npm run
test:e2e`) is guest-only and untouched by any of this — it runs against an
unconfigured Supabase (`isSupabaseConfigured === false`) and always will.
Everything below lives behind a separate config, `playwright.auth.config.ts`.

## Why a second config, a second env file

This repo's own `.env.local` points at a **real hosted Supabase project**
(`*.supabase.co`) for day-to-day app development — that's normal and correct
for `npm run dev`. It is never safe to let a test suite that seeds and
deletes accounts read that file. So:

- `.env.e2e.local` (gitignored, template in `.env.e2e.local.example`) is a
  wholly separate env file, read only by `e2e/fixtures/env.ts`. Next.js never
  loads it and `.env.local` is never touched.
- `e2e/fixtures/environment-guard.ts` independently refuses to run against
  anything whose Supabase URL hostname isn't `127.0.0.1`/`localhost`/`::1`,
  regardless of what's configured — even if `.env.e2e.local` were somehow
  mispointed. Called from `playwright.auth.config.ts` (fails before the
  webServer even starts), the seed/cleanup CLIs, and `auth.setup.ts`.
- `playwright.auth.config.ts`'s `webServer.env` injects the local
  URL/anon/service-role keys as real process env vars around the
  `next build && next start` it spawns. Next.js never lets a `.env.local`
  value override a variable already present in `process.env`, so the app
  under test is provably pointed at local Supabase no matter what
  `.env.local` contains.

## Required local services

- Docker (for the Supabase CLI's local stack)
- Supabase CLI (`supabase start`/`stop`)
- Node (this repo's usual toolchain — no new runtime dependency was added;
  cookie/session env loading uses Node's built-in `loadEnvFile`)

## Environment variables (names only — see `.env.e2e.local.example`)

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Local Supabase API URL (`http://127.0.0.1:56321`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Local anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Local service-role key — seed/cleanup only, never sent to a browser |
| `E2E_FIXTURE_PASSWORD` | Shared password for every seeded parent/teacher/admin fixture |
| `E2E_FIXTURE_STUDENT_PIN` | Shared PIN for every seeded student fixture |

The URL/anon/service-role values in `.env.e2e.local.example` are the
Supabase CLI's published local-development demo values — identical on every
machine running the local stack, not secrets. `E2E_FIXTURE_PASSWORD`/`PIN`
are arbitrary local-only values; keep them in `.env.e2e.local` (already
`.env*`-ignored) rather than hardcoded in source, per this mission's
security requirements.

## Local Supabase start and migration

```sh
supabase start   # applies every migration in supabase/migrations/ to a fresh local Postgres
```

`supabase/config.toml`'s `project_id` is `mindmosaic-rls-harness`, distinct
from any other local Supabase stack that might already be running on this
machine. `[api]` and `[auth]` are enabled (Auth + PostgREST reachable at
`http://127.0.0.1:56321`); `studio`/`storage`/`realtime`/`analytics`/
`edge_runtime` stay off — this suite doesn't need them, matching the existing
RLS-harness posture (see `docs/RLS_TEST_PLAN.md`).

```sh
supabase stop    # when done
```

## Seed procedure

```sh
npm run e2e:seed
```

Creates (or reuses, if already present) every fixture identity in
`e2e/fixtures/identities.ts` via the GoTrue admin API, links
parents/children, rosters students into classes, seeds one completed
`exam_attempts` row, and sets two subscriptions rows to non-default states.
Safe to re-run: every step looks up by fixed email (or existing FK row)
before writing, so a second run is a no-op that returns the same IDs.

`playwright.auth.config.ts`'s `globalSetup` (`e2e/setup/auth.setup.ts`) calls
this automatically before every `npm run test:e2e:auth` run — you only need
to run it by hand to inspect the seeded state directly (e.g. in Supabase
Studio, if you enable it) between runs.

## Cleanup procedure

```sh
npm run e2e:cleanup
```

Deletes every `auth.users` row matching one of the two patterns seed.ts ever
writes (`@e2e.mindmosaic.local`, or a student alias whose local part matches
`childcode+e2stud*@students.mindmosaic.internal`) and nothing else — a real
household's email can never match either pattern. Every `public.*` row for a
deleted user (profile, links, classes, sessions, attempts, subscription)
cascades away via the schema's existing `on delete cascade` foreign keys; no
`public.*` table is touched directly by cleanup itself.

Not run automatically — this is foundation, not a full suite with its own
teardown hook yet. Run it whenever you want a clean slate; `npm run e2e:seed`
immediately after restores every fixture with the same IDs (once you've
deleted them, a fresh create issues new IDs — the identities are
deterministic, the underlying UUIDs are not).

## storageState generation (no browser UI login)

`e2e/setup/auth.setup.ts` signs in every parent/teacher/admin/student fixture
by calling GoTrue's password grant directly over HTTP
(`e2e/fixtures/session-cookie.ts#signInWithPassword`) — the same request
`supabase.auth.signInWithPassword` makes, minus the browser. The returned
session is then encoded into the exact cookie `@supabase/ssr` expects
(`sb-<host-first-label>-auth-token`, `base64-` + base64url of the
JSON-stringified session — see the comments in `session-cookie.ts` for the
exact source in `node_modules/@supabase/ssr` and `@supabase/supabase-js` this
was read from, not guessed) and written straight into a fresh browser
context via `context.addCookies()`, then saved to `e2e/.auth/<identity>.json`
via `context.storageState()`.

No sign-in form is ever rendered for this. `e2e/fixtures/auth.fixture.ts`'s
`contextAs("parent-one-child")` fixture loads the matching storageState file
on demand — a single spec file can hold many different identities at once
(see `e2e/auth/role-access.smoke.spec.ts`), which is why this repo uses a
factory fixture rather than Playwright's more common
one-project-per-storageState pattern.

`e2e/.auth/` is gitignored — it holds live session cookies, regenerated
fresh by `globalSetup` on every `test:e2e:auth` run.

## Student-session setup

Students never have a real email — they sign in with a login code + PIN
(`src/features/auth/student-alias.ts`, `StudentSignInCard.tsx`), which
resolves to the exact same `signInWithPassword` call under the hood against
a reconstructed alias email. `e2e/fixtures/student-session.fixture.ts`
(`signInAsStudent({ loginCode, pin })`) mirrors that reconstruction so a
fixture student authenticates through the real mechanism, not a shortcut
around it — kept as its own file, separate from the parent/teacher/admin
path, because the login model genuinely differs (code + PIN, no email
field).

## Supported role fixtures

All ten states the mission asked for are supported by the current schema
(`supabase/migrations/**`) and seeded by `e2e/fixtures/seed.ts` /
`identities.ts`:

| State | Identity key |
| --- | --- |
| Unauthenticated visitor | `"unauthenticated"` (empty storageState) |
| Parent, no children | `parent-no-children` |
| Parent, one child | `parent-one-child` (child: `student-no-attempts`) |
| Parent, multiple children | `parent-multi-children` (children: `student-completed-attempt`, `student-second-child`) |
| Student, no attempts | `student-no-attempts` |
| Student, completed attempt | `student-completed-attempt` |
| Teacher, no assigned students | `teacher-no-students` (owns an empty class) |
| Teacher, with assigned students | `teacher-with-students` (roster: `student-completed-attempt`) |
| Admin | `admin` |
| Expired subscription household | `household-expired` (`subscriptions.status = 'trial_expired'`) |
| Active premium household | `household-active-premium` (`subscriptions.status = 'active'`) |

Note on the last two: `BILLING_ENFORCEMENT_ENABLED` defaults off (see
`src/features/billing/require-active-subscription.ts`), so today neither
state changes whether the household can reach `/parent`/`/student` — the
billing gate is a documented no-op until a later batch flips that flag. Both
fixtures exist and their `subscriptions` row is genuinely in the stated
state; only the *access-blocking* behavior is out of scope for this
foundation (no state the domain model can't support was fabricated — see
below for what *is* out of scope).

No fixture role/state was fabricated beyond this list — every one maps
directly to an existing column, table, or trigger.

## Production-safety guards

- `environment-guard.ts` refuses any Supabase hostname other than
  `127.0.0.1`/`localhost`/`::1`, and also refuses a `_live_` Stripe key
  anywhere in the process env (defense in depth — this suite never touches
  Stripe, but a live key present would itself signal leaked prod config).
- Called at `playwright.auth.config.ts` load time (before the webServer
  spawns a build), inside `createAdminClient()` (seed/cleanup entry point),
  and inside `globalSetup`.
- The service-role key only ever exists in `e2e/fixtures/supabase-admin.ts`
  and the Node-side setup/seed/cleanup scripts — never sent to a browser,
  never written into a storageState cookie.
- Seed/cleanup email patterns (`@e2e.mindmosaic.local`,
  `childcode+e2stud*@students.mindmosaic.internal`) are reserved and cannot
  collide with a real household's email.

## Troubleshooting

- **`e2e env: NEXT_PUBLIC_SUPABASE_URL is not set`** — copy
  `.env.e2e.local.example` to `.env.e2e.local`.
- **`Environment guard: refusing to run against Supabase host "..."`** — your
  `.env.e2e.local` (or a real env var of the same name already set in your
  shell) points somewhere non-local. Real shell env vars take priority over
  the file — check `echo $NEXT_PUBLIC_SUPABASE_URL` if this fires
  unexpectedly.
- **`signInWithPassword failed for ...: 400 ...`** — local Supabase isn't
  running, or `.env.e2e.local`'s keys don't match its current
  `supabase start` output (they're regenerated per `supabase db reset`/first
  start on a fresh volume in some CLI versions — re-copy from `supabase
  start`'s own printed output if in doubt).
- **PostgREST 503s / `.from(...)` calls fail** — `supabase/config.toml`'s
  `[api] enabled` must be `true` (it is, as of this mission — see the
  comment there). If it somehow reads `false`, `supabase stop && supabase
  start` after fixing it.
- **`Fixture session cookie needs chunking`** — a fixture's `user_metadata`
  grew large enough to exceed one cookie chunk. See the comment in
  `session-cookie.ts`; the chunked-cookie path from `@supabase/ssr` isn't
  implemented here, only detected.

## Remaining blocked authenticated journeys

Out of scope for this mission (foundation only, per the brief):

- The full authenticated screen suite (parent/student/teacher/admin feature
  flows beyond "does the right dashboard load") — this mission adds one
  minimal smoke test per role plus the required negative tests, nothing
  more.
- Billing-enforcement-on behavior (`BILLING_ENFORCEMENT_ENABLED=true`) — the
  expired/active household fixtures exist and are correctly seeded, but no
  test exercises the flag flipped on, since `/billing` doesn't exist yet
  (see the var's own doc comment in `.env.local.example`).
- Teacher assignment-creation flows, essay marking, admin
  analytics/intelligence dashboards' actual content — all reachable once
  signed in, none asserted on beyond page load in this mission.
- `signInWithOAuth` (Google/Apple/Microsoft/Facebook) fixtures — no local
  OAuth provider is configured; only email/password (parent/teacher/admin)
  and code+PIN (student) are covered.
