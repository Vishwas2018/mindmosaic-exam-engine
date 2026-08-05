# Deployment readiness

## 1. Public sign-up is OPEN — REQUIRES THE SUPABASE DASHBOARD

**This is the one step in this document that code in this repo cannot
perform.** It must be done by a project owner, by hand, and the app is not
fully functional until it is.

Public parent sign-up was previously closed on this deployment. **That
decision was reversed on 5 August 2026.** `/sign-up` now renders the
three-step wizard (`src/features/auth/components/SignUpWizard.tsx`), and it
needs the live project to accept `POST /auth/v1/signup`.

Only **parent** accounts are self-service. Students are still provisioned by
their parent through `src/features/auth/provision-child.ts`, which uses the
service-role admin API and is unaffected by this flag in either position.

### Why the app cannot do it

The Supabase anon key is published to every browser that loads the site —
that is what it is for. So `POST /auth/v1/signup` is reachable by anyone who
opens dev tools, regardless of what the UI offers. `PUBLIC_SIGNUP_ENABLED`
and `supabase/config.toml` govern this app and local stacks; neither has any
authority over the hosted project.

This cuts both ways, and it is worth being explicit about which failure is
which:

- **App on, project closed** — the wizard submits and GoTrue answers
  "Signups not allowed for this instance", which reads to whoever filled it
  in like they mistyped something. This is the failure the current
  configuration risks, and what `verify:signup-open` checks for.
- **App off, project open** — the app claims a door is shut that is not.
  Strictly worse, and the reason `PUBLIC_SIGNUP_ENABLED` documents itself as
  **not a security control**.

### Steps (hosted project)

1. Open the Supabase dashboard → select the project
   (`uermhsptduikehuyceiz`).
2. **Authentication** → **Sign In / Providers** → **Email**.
3. Turn **"Allow new users to sign up"** ON.
   (Older dashboards label this **Authentication → Providers → Email →
   "Enable email signup"**; some show it as **Authentication → Settings →
   "Allow new users to sign up"**. It is the same project-level flag —
   GoTrue's `DISABLE_SIGNUP`.)
4. Save.

If the dashboard will not hold the change — it has failed to before on this
project — `npm run open:signup` writes the same flag through the Management
API, then probes GoTrue to confirm the auth server actually picked it up.

### Then verify — do not take the dashboard's word for it

```bash
npm run verify:signup-open
```

It POSTs to `/auth/v1/signup` with the **public anon key**, exactly as a
stranger would, and exits non-zero unless GoTrue lets the request past the
sign-up gate. It reads `/auth/v1/settings` too, but the POST is the proof.

The probe sends a deliberately too-short password. GoTrue evaluates
`disable_signup` → password strength → email validity, in that order, so the
error code says how far the request got:

| Response | Meaning |
|---|---|
| `weak_password` (422) | Got past the gate — **open**. Exit 0. |
| `email_address_invalid` (400) | Got past the gate — **open**. Exit 0. |
| `2xx` | Got past everything — **open**, and a user now exists. Exit 0, with a warning. |
| `signup_disabled` (422) | Refused at the gate — **closed**. Exit 1. |

Because the password can never pass, "open" is confirmed without creating an
account or emailing anyone, so the probe is safe to re-run against
production.

Anything else is reported as **inconclusive** and fails. That matters: two
earlier versions of this probe were wrong in the dangerous direction, one of
them treating any 4xx as proof of closure while sign-up was wide open. A
result for the wrong reason is not a result.

**This is not wired into CI, deliberately.** It needs live project
credentials and makes a real network call to the production auth server; a
required check depending on both would flake on Supabase's availability
rather than on this repo's correctness. Run it after a deploy or a dashboard
change.

### What must keep working

Opening sign-up affects **only** new self-service account creation. Confirm
after flipping it:

- **parent sign-in** — `signInWithPassword`, unaffected;
- **student sign-in** — code + PIN, also `signInWithPassword` under the hood
  against the alias address (`student-alias.ts`), unaffected;
- **password reset** — `resetPasswordForEmail`, unaffected;
- **adding a child** — `provisionChild` uses the **service-role** admin API
  (`admin.auth.admin.createUser`), which bypasses `disable_signup` entirely.
  Students are never self-service, whatever this flag says.

There is regression cover for the last one in
`src/tests/unit/provision-child.test.ts`; the first three are exercised by
the authenticated Playwright suite.

### The app side (already done, in this repo)

- `src/features/auth/signup-policy.ts` — `PUBLIC_SIGNUP_ENABLED = true`, the
  single flag the UI reads. **Not a security control**, and says so.
- `/sign-up` renders the three-step wizard: parent account (with a required
  consent checkbox), add a student, first programme. With the flag off it
  falls back to the "sign-up is closed" card rather than a form that fails on
  submit.
- `supabase/config.toml` sets `enable_signup = true` for local stacks, so a
  developer's machine matches production.
- `src/tests/components/signup-policy.test.tsx` asserts the app flag and
  `supabase/config.toml` agree, so the two cannot drift apart in the repo.
  Neither of them can speak for the hosted project — that is what the probe
  above is for.

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

> **This section changed severity when sign-up opened (§1).** It was written
> when the only way to get a second parent account was for an operator to
> create one deliberately — so "do not add a second parent account without
> configuring SMTP first" was advice an operator could simply follow. It is
> not any more: **any stranger can now create one from `/sign-up`**, and the
> moment they do, that account has no working password recovery and no
> confirmation email. Read the rest of this section as a live consequence of
> the sign-up decision, not a hypothetical. Configuring SMTP is now the
> blocking item for a real public launch.

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

(read from `GET /v1/projects/{ref}/config/auth` — `npm run open:signup --
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
- **With sign-up open, you no longer control when a second parent account
  appears.** Until SMTP exists, every self-service account created at
  `/sign-up` is one whose confirmation and recovery mail may silently not
  arrive — and whose owner will be told, in the app, that it did. Either
  configure SMTP or close sign-up again (§1); leaving both as they are is a
  choice to ship that failure.
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
npm run verify:signup-open       # after the dashboard step above
```
