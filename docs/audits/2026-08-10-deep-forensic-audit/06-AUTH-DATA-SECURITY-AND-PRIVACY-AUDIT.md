# Authentication, Data Security and Privacy Audit

## Coverage and threat model

Threat actors considered: unauthenticated scraper, authenticated learner/parent, malicious or mistaken teacher, cross-tenant user with a known UUID, compromised CI dependency and network attacker exploiting framework defects. Assets include child identity/profile links, raw responses, scores, teacher feedback, subscription state, proprietary question content and server secrets. Route handlers, client/server projections, auth redirects, origin checks, Supabase policies, environment reads, headers, dependencies and legal/privacy claims were inspected.

## Verified strengths

- Service-role and Stripe secret variables are referenced only from server-side modules; public variable names are appropriately prefixed.
- Signed-in exam APIs authenticate, validate input, use origin checks for state-changing browser requests and recompute questions from server-side IDs.
- Correct answers are removed from candidate questions and were not found in client JS/HTML/RSC by the bundle gate.
- Stripe webhook verification uses the signature boundary; checkout/portal routes fail closed when configuration is absent.
- No arbitrary HTML/SVG injection path was found in the visual renderer system.
- RLS is enabled on exposed domain tables and contains useful parent/student/teacher read separation—although two policy designs defeat the intended boundary.

## Findings

### P1 High

- `MM-AUD-SEC-001` — direct trusted-field writes: `exam_sessions` insert policy checks identity/role but not server-owned config, seed, selected IDs or expiry; `exam_attempts` lets a student insert arbitrary responses and `result`. Teacher policies similarly let authorised teachers set trusted manual-mark maxima and assignment-attempt links directly. Browser PostgREST access bypasses route validation.
- `MM-AUD-SEC-002` — manufactured teacher access: class create policies require only `teacher_id = auth.uid()`, not a teacher profile. The owner can add any known student UUID to `class_students`; helper policies then treat that owner as the student's teacher and expose profile/session/attempt rows.
- `MM-AUD-SEC-003` — unsafe redirect/XSS sink (strongly indicated): `SignInPanel.tsx:108,181` passes query parameter `next` directly to `router.push`. Next.js explicitly warns that unsanitised values, including `javascript:` URLs, can execute in page context.
- `MM-AUD-DEP-001` — vulnerable production dependencies: `npm audit` reports three high-severity groups. The direct Next.js version is `16.2.10`; the vendor's 20 July 2026 security release directs Active LTS users to `16.2.11` for four high and five medium issues.
- `MM-AUD-PRIV-001` — child-data launch controls incomplete: the live policy says there is no published retention/deletion policy and the terms are a non-final draft. This is a release-readiness defect, not a legal-compliance conclusion.

### P2 Medium

- `MM-AUD-SEC-004`: `handle_new_user()` accepts raw signup metadata role `student` or `parent`, contradicting the UI/legal promise that student accounts are parent-provisioned only.
- `MM-AUD-SEC-005`: local production responses had no CSP, HSTS, frame, referrer or permissions-policy headers; `next.config.ts` defines none.
- `MM-AUD-AUTH-001` (strongly indicated): repository deployment documentation records incomplete SMTP/recovery readiness. Production was deliberately not contacted.
- `MM-AUD-CI-002`: GitHub Actions use movable major tags and do not declare least-privilege `permissions`.
- `MM-AUD-PERF-001`: the public static guest bank exposes all answer keys/explanations in a 5.08 MiB response cached for one year. Guest scoring requires keys, but shipping three overlapping banks maximises scraping/IP exposure.

## Privacy posture

Data collection is relatively minimised: student aliases rather than real email, no DOB/school/address requirement, and no advertising/behavioural tracker found. However, privacy copy makes absolute RLS/server-scoring claims disproven by `SEC-001/002`, and operational deletion/retention is manual and unpublished. The OAIC states that the Children's Online Privacy Code must be registered by 10 December 2026 and applies to covered online services likely to be accessed by children; applicability and obligations require specialist review.

## Ruled out or bounded

- No secret values were printed; ignored env files were identified by location/type only.
- OAuth callback destinations are constrained to a leading slash and concatenated to the app origin; the proven unsafe sink is the password sign-in client path.
- Answer-key leakage from authenticated candidate APIs is ruled out. Guest mode intentionally downloads keys for local scoring and is a separate exposure/performance trade-off.
- Duplicate final attempts are constrained; retry-safe result retrieval is still missing.

## Gaps and blocked verification

No exploit was run against production or real accounts. The redirect sink was not reproduced in a browser, the local RLS suite was not started, and production cookie flags, SMTP, Supabase grants/drift, rate limits, CDN headers and backup/deletion operations remain unverified externally.

## Priorities

Revoke direct authenticated writes to trusted tables or replace them with narrow security-definer/RPC operations; bind class authority to verified teacher roles and controlled enrolment; sanitise internal redirects; patch dependencies; add security headers; complete privacy/legal/deletion operations and adversarial RLS tests before enabling broader accounts.
