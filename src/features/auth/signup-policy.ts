/**
 * Whether this deployment offers public, self-service account creation.
 *
 * MindMosaic is a private family deployment: accounts are provisioned, not
 * signed up for. A parent account is created deliberately by the operator;
 * children are provisioned by their parent through
 * ./provision-child.ts, which never touches this path.
 *
 * IMPORTANT — this flag is NOT the security control, and must not be
 * mistaken for one. The Supabase anon key ships to every browser, so anyone
 * can POST directly to GoTrue's /auth/v1/signup and never involve this code
 * at all. Exactly the shape of MM-AUTH-01, where a route-level role check
 * existed and the RLS policy behind it did not.
 *
 * The real control is the project-level "allow new users to sign up"
 * setting in Supabase Auth (mirrored as `enable_signup` in
 * supabase/config.toml for local stacks). This flag only makes the app
 * honest about it: a form that silently fails against a closed backend is
 * worse than no form, because the person filling it in cannot tell whether
 * they typed something wrong or the door is shut.
 *
 * See docs/DEPLOYMENT.md, and `npm run verify:signup-closed` for the proof
 * that the actual door is locked.
 */
export const PUBLIC_SIGNUP_ENABLED = false;

/** Shown wherever a sign-up affordance used to be. */
export const SIGNUP_CLOSED_MESSAGE =
  "MindMosaic isn't open for public sign-up. Accounts are created for families directly, and children are added by their parent from the parent dashboard.";
