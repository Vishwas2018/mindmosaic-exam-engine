# DEV Auth custom SMTP (D-025)

Last updated 2026-11-15. Status: **prepared, not applied** — needs an owner-held provider account and credential.

## Why

DEV Supabase Auth sends email through Supabase's built-in service, which is rate-limited to a handful of messages
an hour and is not meant for real users. In hosted acceptance the second sign-up within about an hour was refused
("Too many attempts") and the account was not created. Families registering close together would hit the same wall.
Email confirmation must stay on; the fix is our own SMTP sender, not switching confirmation off.

## Provider: Resend (owner's choice, 2026-11-15)

Settings DEV will use:

| Field | Value |
|-------|-------|
| Host / port | `smtp.resend.com` / `465` (implicit TLS) |
| Username | `resend` |
| Password | a Resend API key with **Sending access** only, restricted to the sending domain |
| Sender email | e.g. `beta@mail.<your domain>` (must be on the verified domain) |
| Sender name | `MindMosaic (beta)` |
| Auth "emails sent per hour" | 30 |

**A verified domain is required.** Without one, Resend only sends from `onboarding@resend.dev` and only to the
Resend account owner's own address, so two separate families cannot both receive mail. No custom domain is
attached to the Vercel team (checked 2026-11-15), so the owner must use a domain they control. A subdomain such as
`mail.<domain>` keeps the root domain's mail reputation separate. Resend asks for (exact values shown in its
dashboard): an MX and a TXT (SPF) record on `send.mail.<domain>`, and a TXT DKIM record `resend._domainkey.mail.<domain>`.
Adding a DMARC record (`_dmarc.<domain>`, `v=DMARC1; p=none;`) improves delivery to Gmail.

Checked 2026-11-15 from DEV's public settings: sign-up open, email provider on, **`mailer_autoconfirm: false`
(confirmation required)**.

## Owner steps (the only parts that need a human)

1. Create the Resend account; add the sending domain and the DNS records it lists; wait for "Verified".
2. Create an API key: permission *Sending access*, domain = the verified domain.
3. Create a Supabase personal access token for the account that owns DEV `mfglzabnayacssgertat`
   (the Supabase CLI on this machine is currently signed in to a different account and cannot see DEV).
4. Either paste the values into the Supabase dashboard (DEV → Authentication → Emails → SMTP Settings, and
   Rate Limits → "emails sent per hour" = 30), **or** run the script below in your own terminal so no credential
   passes through chat:

```
# PowerShell, in the repo
$env:SUPABASE_ACCESS_TOKEN = "<token>"
$env:SMTP_HOST = "smtp.resend.com"; $env:SMTP_PORT = "465"; $env:SMTP_USER = "resend"
$env:SMTP_PASS = "<provider key>";  $env:SMTP_ADMIN_EMAIL = "beta@mail.<your domain>"
node scripts/dev-auth/configure-smtp.mjs            # dry run: shows current settings and the plan
node scripts/dev-auth/configure-smtp.mjs --apply    # writes, reads back, prints VERIFIED
Remove-Item Env:SMTP_PASS, Env:SUPABASE_ACCESS_TOKEN
```

The script is fixed to DEV, refuses PROD, aborts if email confirmation is switched off, and sends only the SMTP
fields plus the email rate limit. It also reports whether the hosted confirmation and recovery templates use
`token_hash` links (the device-independent flow the app expects).

## Verification after it is applied (engineering, no owner input)

Two separate family registrations through the real form on the `dev` Preview, each with a mailbox we can read:

| Step | Check |
|------|-------|
| Register parent 1, then parent 2 within 5 minutes | both accepted; no "Too many attempts" |
| Delivery | both confirmation emails arrive from the configured sender, not `noreply@mail.app.supabase.io` |
| Confirmation link | opens the Preview's `/auth/confirm`, lands signed in on the parent area |
| Sign out / sign in | password sign-in works for both |
| Recovery | "Forgot password" email arrives; link sets a new password; old password refused, new one accepted |
| Cleanup | `node scripts/hosted-acceptance/cleanup.mjs --env <DEV env> --apply` removes both families |

Run with `HOSTED_MAIL_BASE=<inbox you can read>` so the suite reads the real messages (A1–A2), never
`HOSTED_CONFIRM=admin`, which confirms by service-role link and therefore proves nothing about delivery.

The dry run also prints `site_url` and `uri_allow_list`. Confirmation and recovery links must be allowed to land on
the `dev` Preview (A1–A2 passed on a branch Preview on `3fc807b4`, so the current list admits Preview hosts); if the
list does not cover the `dev` branch Preview host, the owner adds it in Authentication → URL Configuration.
