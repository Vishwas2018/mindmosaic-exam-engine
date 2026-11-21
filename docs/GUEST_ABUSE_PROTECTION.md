# Guest session abuse protection

`/api/exam/guest-session` serves unauthenticated candidates. Questions are delivered without answer keys; keys and
explanations are returned only for attempted items after a submit. A client that repeatedly starts sessions and
submits answers could harvest keys. The controls below stack; none stores question content.

## 1. Shared guard store (`src/lib/security/guard-store.ts`)
- **Redis (production design):** Upstash Redis over its REST API (serverless-safe, no TCP). Enabled when
  `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (or the Vercel Marketplace names `KV_REST_API_URL` /
  `KV_REST_API_TOKEN`) are set; the URL must be `https://`. Counters and submit claims are global across instances.
- **Memory store:** per-instance, used only off-host (local runs and CI, where `VERCEL` is not `1`).
- **Hosted deployments fail closed.** When `VERCEL=1`, the shared store is mandatory. If Redis is not configured, times
  out (800 ms), or returns an error, start, submit and feedback return `503 {"error":"guard_unavailable"}` with
  `Retry-After: 15`. No answer, explanation or review material is returned without the atomic submit claim, so an outage
  cannot be used to probe the key. The client keeps its answers and the sitting is recoverable; the same ticket submits
  normally once Redis returns (the claim is only written on a successful submit). Cost of this choice: during a Redis
  outage (or on a hosted environment that has no Redis yet) guests cannot start or finish a paper. Signed-in sittings
  are unaffected (they do not use this store).
- **Explicit degraded mode:** `MM_GUEST_GUARD=memory` lets a hosted environment run on the per-instance memory store
  (no cross-instance replay protection). Owner-set only, never the default; use it for a throwaway preview, not family beta.
- **Provisioning is not done.** It needs the owner's approval (new infrastructure, Vercel env vars, cost).

## 2. Rate limits (`src/lib/security/rate-limit.ts`), per 10 minutes
| Endpoint | Per address (ceiling) | Per browser (tight) |
|----------|----------------------|---------------------|
| start (POST) | 120 | 20 |
| submit (PUT) | 120 | 20 |
| feedback (PATCH) | 600 | 120 |
- **Shared NAT (school, household):** the address ceiling is sized for a classroom (30 children, a few papers each);
  the per-browser limit means one noisy device cannot spend the shared ceiling. A script that discards its cookie is
  still stopped by the address ceiling. Tests cover both.
- **Address source:** first hop of `x-forwarded-for` / `x-real-ip`, trusted only when `VERCEL=1` (the edge overwrites
  it). Elsewhere it is ignored, so a spoofed header cannot rotate buckets. IPv6 is keyed by /64. Addresses and browser
  ids are hashed in Redis keys.
- Over the limit: HTTP 429 with `Retry-After`, no payload. `MM_GUEST_RATE_LIMIT=off` disables limiting.

## 3. One-time submit (replay prevention, atomic)
Each ticket id gets `SET guest:spent:<ticket> <answers-digest> EX 14400 NX`. First submit wins; an identical replay is
idempotent; changed answers after disclosure return 409 `already_submitted`. This stops submit-partial-read-edit
probing and holds across parallel requests and cookie loss (with Redis). A signed HttpOnly `mm-guest-spent` cookie
is kept as a fallback for when the shared store is unavailable or not provisioned.

## 4. Remaining limits
- Without Redis the claim and counters are per instance (cookie fallback only stops in-browser probing).
- A determined attacker with many IPs can still start many sessions and read keys for the guest bank, which is already
  the public practice pool; scholarship and unseen-mock content is excluded from guests by design.
- Platform Firewall rule (owner action, optional second layer): rate limit `POST|PUT|PATCH /api/exam/guest-session`,
  ~240 requests / 10 min / IP, to match the app ceilings.

## Owner approvals needed
1. Provision Upstash Redis (Vercel Marketplace) for DEV and set the two env vars for the DEV preview.
2. (Optional) add the Firewall rule.
