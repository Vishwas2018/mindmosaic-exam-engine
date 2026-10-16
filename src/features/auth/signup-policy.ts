/**
 * Whether this deployment offers public, self-service account creation.
 *
 * A parent creates their own account here; children are still provisioned
 * by their parent through ./provision-child.ts, which never touches this
 * path — a student is never self-service.
 *
 * IMPORTANT — this flag is NOT the security control, and must not be
 * mistaken for one, in either position. The Supabase anon key ships to
 * every browser, so anyone can POST directly to GoTrue's /auth/v1/signup
 * and never involve this code at all. Exactly the shape of MM-AUTH-01,
 * where a route-level role check existed and the RLS policy behind it did
 * not.
 *
 * The real control is the project-level "allow new users to sign up"
 * setting in Supabase Auth (mirrored as `enable_signup` in
 * supabase/config.toml for local stacks). This flag only makes the app
 * honest about it, in whichever direction it is set:
 *
 *   - Flag on, Supabase closed  -> the form submits and GoTrue answers
 *                                  "Signups not allowed for this instance",
 *                                  which reads to the person filling it in
 *                                  like they typed something wrong.
 *   - Flag off, Supabase open   -> the app claims a door is shut that is
 *                                  not, which is the dangerous direction.
 *
 * So the two must be changed together. `npm run verify:signup-open` asks
 * GoTrue directly, with the public anon key, exactly as a stranger would,
 * and exits non-zero if the live project would refuse the wizard's submit.
 * It is deliberately not a CI gate — it needs live credentials and a real
 * network call. See docs/DEPLOYMENT.md.
 *
 * BETA: closed (invite-only). The app flag is false and supabase/config.toml
 * says `enable_signup = false`. The hosted project's "Allow new users to
 * sign up" switch is a dashboard step this repo cannot perform; until it is
 * off, `verify:signup-open` exits 0 against production and a stranger can
 * still POST to /auth/v1/signup. Families are invited from the dashboard
 * (Authentication > Users > Invite) or created with the admin API.
 */
export const PUBLIC_SIGNUP_ENABLED = false;

/** Shown wherever a sign-up affordance used to be. */
export const SIGNUP_CLOSED_MESSAGE =
  "MindMosaic isn't open for public sign-up. Accounts are created for families directly, and children are added by their parent from the parent dashboard.";
