# Guest session abuse protection

`/api/exam/guest-session` serves unauthenticated candidates. Questions are delivered without answer keys; keys and
explanations are returned only for attempted items after a submit. A client that repeatedly starts sessions and
submits junk answers could therefore harvest keys. Controls:

1. **Per-instance limiter** (`src/lib/security/rate-limit.ts`): per client address per 10 minutes — 30 starts,
   20 submits, 120 feedback calls; HTTP 429 with `Retry-After`. Client = first hop of `x-forwarded-for`/`x-real-ip`
   (set by the Vercel edge). No header (local, CI) = not limited. `MM_GUEST_RATE_LIMIT=off` disables it.
   Limit: counters are per warm serverless instance, so this is a speed bump, not a global quota.
2. **Platform rule (owner action, not applied):** add a Vercel Firewall rate-limit rule for
   `POST|PUT|PATCH /api/exam/guest-session`, e.g. 30 requests / 10 min per IP, action "Rate limit"/429.
3. Scholarship-style content is never available to guests; tickets are cookie-bound, HMAC-signed, 4h TTL.

Residual risk: a determined client rotating IPs can still enumerate the non-scholarship guest bank. That bank is
already the public practice pool; the scholarship and unseen-mock content is excluded by design.
