# Deployment readiness

## 1. Close public sign-up — REQUIRES THE SUPABASE DASHBOARD

**This is the one step in this document that code in this repo cannot
perform.** It must be done by a project owner, by hand, before the app is
reachable from the internet.

### Why the app cannot do it

The Supabase anon key is published to every browser that loads the site —
that is what it is for. So `POST /auth/v1/signup` is reachable by anyone who
opens dev tools, regardless of what the UI offers. Removing the form, hiding
the link, or refusing in `AuthProvider.signUp` closes only the door you can
see.

This is the same shape as MM-AUTH-01: a route-level role check existed, the
RLS policy behind it did not, and the check was walkable-around by calling
PostgREST directly. The lesson held then and holds here — **the control has
to live where the request actually arrives.**

### Steps (hosted project)

1. Open the Supabase dashboard → select the project
   (`uermhsptduikehuyceiz`).
2. **Authentication** → **Sign In / Providers** → **Email**.
3. Turn **"Allow new users to sign up"** OFF.
   (Older dashboards label this **Authentication → Providers → Email →
   "Enable email signup"**; some show it as **Authentication → Settings →
   "Allow new users to sign up"**. It is the same project-level flag —
   GoTrue's `DISABLE_SIGNUP`.)
4. Save.

Leave everything else alone. In particular do **not** disable the Email
provider itself — that would break parent sign-in and password reset, which
use the same provider.

### Then verify — do not take the dashboard's word for it

```bash
npm run verify:signup-closed
```

It POSTs to `/auth/v1/signup` with the **public anon key**, exactly as a
stranger would, and exits non-zero unless GoTrue refuses at the sign-up gate.
It reads `/auth/v1/settings` too, but the POST is the proof.

The probe sends a deliberately too-short password. GoTrue evaluates
`disable_signup` → password strength → email validity, in that order, so the
error code says how far the request got:

| Response | Meaning |
|---|---|
| `signup_disabled` (422) | Refused at the gate — **closed**. |
| `weak_password` (422) | Got past the gate — **open**. |
| `email_address_invalid` (400) | Got past the gate — **open**. |
| `2xx` | Got past everything — **open**, and a user now exists. |

Because the password can never pass, the open case is detected without
creating an account or emailing anyone.

Anything else is reported as **inconclusive** and fails. That matters: two
earlier versions of this probe were wrong in the dangerous direction. The
first treated any 4xx as success and reported "closed" while sign-up was wide
open — it had used a `.invalid` address that GoTrue rejected as malformed,
and a rejection for the wrong reason is not a refusal. Only `signup_disabled`
counts.

### What must keep working afterwards

Disabling sign-up affects **only** new self-service account creation. Confirm
after flipping it:

- **parent sign-in** — `signInWithPassword`, unaffected;
- **student sign-in** — code + PIN, also `signInWithPassword` under the hood
  against the alias address (`student-alias.ts`), unaffected;
- **password reset** — `resetPasswordForEmail`, unaffected;
- **adding a child** — `provisionChild` uses the **service-role** admin API
  (`admin.auth.admin.createUser`), which bypasses `disable_signup` entirely.
  A parent can still add children.

There is regression cover for the last one in
`src/tests/unit/provision-child.test.ts`; the first three are exercised by
the authenticated Playwright suite.

### The app side (already done, in this repo)

- `src/features/auth/signup-policy.ts` — `PUBLIC_SIGNUP_ENABLED = false`, the
  single flag the UI reads. **Not a security control**, and says so.
- `AuthProvider.signUp` refuses before calling out, so the UI never reports
  GoTrue's wording as if the user mistyped something.
- `/sign-up` renders an honest "sign-up is closed" card with real routes out,
  instead of a form that fails on submit.
- `?mode=signup` on `/sign-in` falls back to sign-in.
- The landing page no longer advertises account creation: the "For Parents"
  CTA points at sign-in, the waitlist CTA at `/contact`, and the footer
  "Sign Up" link is gone.
- `supabase/config.toml` sets `enable_signup = false` for local stacks, so a
  developer's machine matches production.

## 2. Non-production routes

`/dev/routes` and `/showcase` both `notFound()` when `NODE_ENV` is
production. `/showcase` renders every question and visual renderer and is
QA tooling, not a learner surface.

`/showcase` additionally honours `SHOWCASE_ENABLED=1`, which the Playwright
config sets for its own web server. The e2e suite runs against a production
build, and the renderer and a11y specs are the only coverage of every
question type — gating on `NODE_ENV` alone would have deleted that coverage
rather than moved it. **Never set `SHOWCASE_ENABLED` on a real deployment.**

## 3. Migration state

```bash
npm run migrations:status   # must report 8 of 8, exit 0
```

See [MIGRATIONS.md](./MIGRATIONS.md).

## 4. Email delivery — there is none, and password reset is affected

**Decided position: ship without custom SMTP, and know exactly what that
costs.** This section exists so the cost is written down before the first
deploy rather than discovered by a parent who cannot get back into their
account.

The live project has no SMTP configured at all:

```
smtp_host          null
smtp_admin_email   null
smtp_sender_name   null
```

(read from `GET /v1/projects/{ref}/config/auth` — `npm run close:signup --
--dry-run` prints these.)

With those unset, every transactional email — confirmation, password reset,
email change — goes through Supabase's built-in sender, which is:

- **restricted to members of the Supabase organisation.** Anyone else gets
  `Email address not authorized`. It is not a general mail service;
- **rate limited to 2 messages per hour**, project-wide;
- **offered with no SLA and explicitly unsupported for production use.**

### What this means concretely

Today there is one parent account and it belongs to the Supabase org owner,
so reset mail reaches it. That is the *only* reason this currently works.

**If a second parent account is ever created, password reset is broken for
that person from that moment.** Not degraded — broken. They are not in the
Supabase org, so their reset mail is refused outright. Nothing in the app
will say so.

That last part is the dangerous half. `AuthProvider.sendPasswordReset`
(`src/features/auth/AuthProvider.tsx:251`) reports success on the absence of
an error:

```ts
const { error } = await supabase.auth.resetPasswordForEmail(email, {...});
if (error) return { ok: false, message: error.message };
return { ok: true, message: "If that email has an account, a reset link is on its way." };
```

The `ok: true` at line 257 is returned for any call GoTrue accepts —
**including sends it cannot deliver**. The wording is deliberately
non-committal to avoid leaking whether an account exists, and that same
wording now also conceals a delivery failure. A parent locked out sees a
reassuring message and waits for an email that was never sent, and no error
is raised anywhere for anyone to notice.

### Until real SMTP exists

- **Non-owner password recovery is a manual, dashboard-only operation.**
  Supabase dashboard -> Authentication -> Users -> the user -> send a
  recovery link or set a password directly. Treat this as the actual
  recovery path, not a fallback.
- Do not add a second parent account without either configuring SMTP first
  or accepting that you personally are that account's recovery mechanism.
- Configuring a real provider (Resend, SES, Postmark, or any SMTP host) in
  Authentication -> Emails -> SMTP Settings removes every limitation above.
  It is the fix; everything here is what holding off costs.

This also interacts with `site_url` and `uri_allow_list`, which still point
at `http://localhost:3000` and `""` respectively — so even a delivered reset
link would currently arrive pointing at the recipient's own machine. Those
need the deployed URL and are handled at deploy time, not here.

## 5. Pre-deploy checklist

```bash
npm run typecheck
npx eslint . --max-warnings 0
npm run build
npx vitest run --pool=forks --maxWorkers=2
npm run test:e2e
npm run check:answers -- --include-published
npm run validate:questions
npm run migrations:status
npm run verify:signup-closed     # after the dashboard step above
```
