# Guest session abuse protection

`/api/exam/guest-session` serves unauthenticated candidates. Questions are delivered without answer keys; keys and
explanations are returned only for attempted items after a submit. A client that repeatedly starts sessions and
submits junk answers could therefore harvest keys. Controls:

1. **Per-instance limiter** (`src/lib/security/rate-limit.ts`): per client address per 10 minutes — 30 starts,
   20 submits, 120 feedback calls; HTTP 429 with `Retry-After`. Client = first hop of `x-forwarded-for`/`x-real-ip`
   and is trusted only when `VERCEL=1` (the Vercel edge overwrites it); elsewhere the header is ignored, so a spoofed value cannot rotate buckets. IPv6 is keyed by /64. Not on Vercel (local, CI) = not limited. `MM_GUEST_RATE_LIMIT=off` disables it.
   Limit: counters are per warm serverless instance, so this is a speed bump, not a global quota.
2. **Platform rule (owner action, not applied):** add a Vercel Firewall rate-limit rule for
   `POST|PUT|PATCH /api/exam/guest-session`, e.g. 30 requests / 10 min per IP, action "Rate limit"/429.
3. Scholarship-style content is never available to guests; tickets are cookie-bound, HMAC-signed, 4h TTL.

Residual risk: a determined client rotating IPs can still enumerate the non-scholarship guest bank. That bank is
already the public practice pool; the scholarship and unseen-mock content is excluded by design.

## Mid-exam answer disclosure
A ticket's first submit sets a signed HttpOnly `mm-guest-spent` cookie. Re-sending the same answers is idempotent;
sending different answers for that ticket returns 409 `already_submitted`, so in-browser probing (submit partial
answers, read keys, edit, resubmit) stops. A client that discards cookies avoids this and is bounded only by the
limiter. Closing it fully needs shared state, e.g. a Vercel KV / Upstash Redis key per ticket id (SETNX on submit)
which also gives the globally consistent rate limit. That adds infrastructure and needs owner approval; not applied.

## Distributed limiter proposal
Upstash Redis via the Vercel Marketplace, `@upstash/ratelimit` sliding window keyed by client /64 or IPv4, plus
`SET guest:spent:<ticket-id> NX EX 14400`. Fails open if Redis is unreachable (logged), keeping exams usable.

## Firewall rule vs legitimate use
Per IP per 10 minutes a family needs about 1 start + 1 submit per paper; a school or shared NAT of 30 children
each starting a paper is 30 starts / 30 submits. The app limits (30 start, 20 submit) would already throttle a
classroom behind one NAT. Recommend the platform rule at 120 requests / 10 min / IP on this path with the app limits
raised to 60 start / 60 submit before any classroom rollout; for the family beta (one household) current values
are ample.
