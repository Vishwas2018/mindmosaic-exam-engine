# DESIGN_AUDIT.md

Audit of the MindMosaic codebase for the designer, produced from the prompt in
`design_handoff_mindmosaic/Claude Code prompt - auth screens and repo audit.md`.
No code was changed to produce this. Copy is quoted verbatim from source; where a
string is assembled at runtime the template is shown with `{placeholders}`.

Audit date: 4 August 2026. Branch `main`.

---

## 0. Headline findings the designer needs before anything else

1. **Public sign-up does not exist.** `src/features/auth/signup-policy.ts` exports
   `PUBLIC_SIGNUP_ENABLED = false`. `/sign-up` renders an "Sign-up is closed" card,
   not a form. The handoff's three-step Sign up screen has **no counterpart in this
   product**, and the real "add a student" flow lives in the *parent dashboard*, after
   sign-in, not in onboarding.
2. **Log in is two routes, not one screen with a Parent/Student toggle.** Parents use
   `/sign-in` (email + password). Students use `/student-sign-in` (**login code + PIN** —
   a student has no email and no username). The handoff's segmented control that swaps
   "email vs student username" does not match: the student identity field is an
   8-character login code like `K7XJ-2P9R`, and the second field is a **6-digit PIN**,
   not a password.
3. **There is no "Learn" product screen of the kind designed.** `/student/learn` is a
   "Learning hub" of activity launchers and a skill browser. There are no lessons,
   no lesson list, no programme tabs (Australian Curriculum / Singapore Maths /
   English), and no lesson content model in the codebase at all.
4. **Content coverage is Grade 3 and Grade 5 only** (`yearLevel` is literally typed
   `3 | 5` in provisioning and in filters). The marketing surface says Years 1–12.
   Anything the designs show for other years is aspirational.
5. **Practice and Exam are real and substantially built**, but with different state
   names, different controls and different copy from the designs.
6. Success redirect after sign-in is **role-based**, not "parent → Landing, student →
   Learn": `/parent`, `/student`, `/teacher`, `/admin`.

---

## 1. Repo context

### Framework and tooling

| Concern | Value |
|---|---|
| Framework | Next.js `16.2.10`, **App Router** (`src/app/**`) |
| React | `19.2.4` |
| Language | TypeScript (strict), `tsc --noEmit` via `npm run typecheck` |
| Styling | **Tailwind CSS v4** (`@tailwindcss/postcss`), single global stylesheet `src/app/globals.css`. No CSS modules, no styled-components. |
| Class composition | `clsx` + `tailwind-merge`, wrapped as `src/lib/cn.ts` |
| Icons | **`lucide-react` 1.24.0** — the codebase's icon set. Replace the handoff's text glyphs (`← → ⌂ ⌕ ▶ ✓ ✕ +`) with these. |
| Data / auth | Supabase (`@supabase/ssr`, `@supabase/supabase-js`), RLS-scoped |
| Payments | Stripe `22.3.2` |
| Client state | `zustand` (exam runner store) |
| Validation | `zod` 4 |
| Tests | Vitest (unit/component), Playwright (e2e + `playwright.auth.config.ts`), `@axe-core/playwright` for accessibility |

There is **no third-party component library**. `src/components/ui/` is the in-house one:
`Badge, Button (+buttonClasses), Card (+CardHeader/Title/Description/Content/Footer),
ConfirmDialog, EmptyState, ErrorState, Input, Modal, PermissionDenied, ProgressBar,
Select, Skeleton, SkeletonText, Textarea, ToastProvider/useToast, UpgradeRequired,
WidgetError/WidgetErrorBoundary`.

### Two separate palettes — this matters

`globals.css` deliberately maintains **two token families**, and they must not be mixed:

**(a) Product tokens** (`:root`), used by auth, dashboards, exam runner, billing, admin:

```
--purple: #5925a8    --orange: #f9a825    --text-dark: #1a1a2e   --text-mid: #4a4a6a
--text-light: #6b6b8a --bg-page: #f7f6fb  --bg-white: #ffffff    --border: #e4e0f0
--success: #0f6b32   --warning: #92400e   --error: #b91c1c
--accent: #ef4444    --accent-strong: #b91c1c  --paper: #faf8f4
--landing-ink: #221833  --landing-muted: #5b5468
--brand-bright: #7c3aed --brand-coral: #ff555a --brand-deep: #43188a --brand-ink: #2a1051
```

Exposed as utilities `bg-royal`, `text-ink`, `text-muted`, `bg-page`, `bg-surface`,
`text-success`, `text-error`, `text-warning`, `bg-royal-orange`.

**(b) Marketing / design-canvas tokens** (`--mm-*`), used **only** by `.lp-root` and
`.legal-page`. These are copied verbatim from the same design file this handoff comes
from, so the handoff's colour table is already largely in the repo:

| Handoff token | Repo token | Value | Match |
|---|---|---|---|
| Brand purple | `--mm-brand` | `#5925a8` | ✅ |
| Purple hover | `--mm-brand-deep` | `#4a1e8d` | ✅ |
| Lavender | `--mm-lilac` | `#c9b6e4` | ✅ |
| Lavender tint | `--mm-tint` | `#f3eefa` | ✅ |
| Lavender tint 2 | `--mm-track` | `#efeaf4` | ✅ |
| Coral | `--mm-coral` | `#ff555a` | ✅ |
| Coral border | `--mm-alert-line` | `#ffd3d4` | ✅ |
| Paper | `--mm-page` | `#fcfbf8` | ✅ |
| White | `--mm-surface` | `#ffffff` | ✅ |
| Ink | `--mm-ink` | `#18151f` | ✅ |
| Ink 2 | `--mm-ink-soft` | `#3d3846` | ✅ |
| Muted | `--mm-muted` | `#625d69` | ✅ |
| Border | `--mm-line` | `#e9e4ed` | ✅ |
| Border light | `--mm-line-soft` | `#f1edf5` | ✅ |
| Border lavender | `--mm-tint-line-strong` | `#dfd3ee` | ✅ |
| Coral wash | `--mm-alert` | `#fff0f0` | ⚠️ handoff says `#FFF1F1` |
| **Plum ink `#2A1145`** | — | — | ❌ **missing** (nearest is `--brand-ink: #2a1051`) |
| **Lavender wash `#FBF8FE`** | — | — | ❌ **missing** |
| **Coral text `#D8323A`** | — | — | ❌ **missing** |
| **Coral deep `#98262C`** | — | — | ❌ **missing** |
| **Muted 2 `#928C99`** | — | `--mm-quiet: #5c5664` | ❌ different value |

Repo-only extras with no handoff equivalent: `--mm-brand-mid #9b72ce`,
`--mm-tint-soft #f7f3fc`, `--mm-tint-quiet #f2eef7`, `--mm-tint-line #e4d9f2`,
`--mm-surface-quiet #f7f5f9`, `--mm-warm #fff4ee`, `--mm-line-quiet #ded8e4`.

### Typography

Loaded by `next/font` in `src/app/layout.tsx`, exposed as CSS variables:

- **Product surfaces**: DM Sans (`--font-dm-sans` / legacy alias `--font-roboto`) on
  `<body>`; DM Serif via `--font-dm-serif`.
- **Marketing surfaces only** (`.lp-root`, `.legal-page`): **Instrument Sans** display
  (`--font-instrument-sans`) + **Geist** body (`--font-geist`). This is exactly the
  handoff's pair. Headings get `letter-spacing: -0.028em`; h1/h2 get `font-weight: 500`
  and `-0.034em`.
- Weight tokens are remapped one step lighter than Tailwind's defaults:
  `semibold → 500`, `bold → 600`, `extrabold → 700`, `black → 800`.
  **A `font-bold` in this codebase is 600, not 700.**

Type scale utilities: `text-hero` `clamp(2.25rem,1.6rem+3vw,3.25rem)/1.08`,
`text-h2` `clamp(1.75rem,1.45rem+1.6vw,2.375rem)/1.15`,
`text-h3` `clamp(1.125rem,1.08rem+0.25vw,1.25rem)/1.3`,
`text-btn` `clamp(0.9375rem,0.92rem+0.1vw,1rem)/1`.

### Layout, radius, shadow, motion

- `.mm-width` — **marketing** container: `max-width: 1440px`, `padding-inline: clamp(20px, 4vw, 64px)`. Matches the handoff exactly.
- `.site-width` — **product** container: `min(100% - 64px, 1200px)`, narrowing to 24px/16px gutters below 1024/640px.
- Section rhythm (marketing): `py-[clamp(40px,4vw,64px)]` via `<Section>`.
- Radius tokens: `--radius-card: 1rem (16px)`, `--radius-btn: 0.75rem (12px)`, `--radius-pill: 999px`. **The handoff's 20/18/13–14/10–11/9/3px radii are finer-grained than these** — marketing components already use arbitrary values (`rounded-2xl`, `rounded-[10px]`) rather than the tokens.
- Shadows: `--shadow-card-rest: 0 8px 24px rgba(30,20,60,.06)`, `--shadow-card-hover: 0 14px 36px rgba(30,20,60,.1)`. The marketing primary button uses `shadow-[0_2px_8px_rgba(89,37,168,0.22)]` — the handoff specifies `0 6px 18px rgba(89,37,168,0.22)`.
- Motion tokens `--motion-fast/base/slow`; keyframe `lp-rise` (**translateY(16px)→0 only — the opacity keyframe was deliberately removed** because axe sampled mid-fade text as failing contrast). `<Reveal>` (`src/features/landing/components/Reveal.tsx`) is the scroll-trigger. A global `prefers-reduced-motion` block neutralises all animation.
- `<details>` chevron: `.lp-root details[open] > summary .mm-plus { transform: rotate(45deg) }`, 180ms — matches the handoff's spec.

### Marketing primitives already in place

`src/features/landing/components/primitives.tsx` exports `mmButton({variant: primary|outline|quiet, size: md|lg})`, `Eyebrow({rule})`, `Section({tone: page|white|tint})`, `SectionHeading`, `MmCard`, `MosaicRule({tiles})`, `pillClasses({selected, disabled})`, `EmptySlot({label})`. **`EmptySlot` is the repo's `<image-slot>`** and should be reused for every unsupplied photo.

Focus treatment in the marketing primitives is `focus-visible:ring-4 ring-mm-brand/30 ring-offset-2`, **not** the handoff's `outline: 3px solid #5925A8; outline-offset: 3px`.

---

## 2. Route table

Public = no session needed. Guarded routes call `requireStudent()` / `requireRole()` /
`requireParent` server-side; `src/middleware.ts` only refreshes the Supabase session
cookie (`matcher` excludes `_next/*` and static assets) — **it does not gate routes**.

### Marketing / public

| Route | File | Access |
|---|---|---|
| `/` | `src/app/page.tsx` | Public — the Landing screen |
| `/learn` | `src/app/learn/page.tsx` | Public — marketing |
| `/assessments` | `src/app/assessments/page.tsx` | Public — marketing ("Practice") |
| `/exam-preparation` | `src/app/exam-preparation/page.tsx` | Public — marketing |
| `/methodology` | `src/app/methodology/page.tsx` | Public — **the "How It Works" screen** |
| `/pricing` | `src/app/pricing/page.tsx` | Public — **the "Plans" screen** |
| `/about` | `src/app/about/page.tsx` | Public — prose page in `LegalPageShell` |
| `/help` | `src/app/help/page.tsx` | Public — Help Centre, prose |
| `/contact` | `src/app/contact/page.tsx` | Public |
| `/privacy` `/terms` `/accessibility` `/assessment-disclaimer` | `src/app/<route>/page.tsx` | Public — legal |
| `/parent-guide` `/student-tips` | `src/app/<route>/page.tsx` | Public — resource articles |
| `/showcase` | `src/app/showcase/page.tsx` | Public — component showcase |
| `/dev/routes` | `src/app/dev/routes/page.tsx` | Dev route inventory |

### Auth

| Route | File | Access |
|---|---|---|
| `/sign-in` | `src/app/sign-in/page.tsx` → `AuthCard` | Public |
| `/sign-up` | `src/app/sign-up/page.tsx` → `SignupClosedCard` | Public, **`robots: noindex, nofollow`** |
| `/student-sign-in` | `src/app/student-sign-in/page.tsx` → `StudentSignInCard` | Public |
| `/auth/reset` | `src/app/auth/reset/page.tsx` | Public, needs Supabase recovery session |
| `/auth/confirm` | `src/app/auth/confirm/page.tsx` → `EmailVerificationScreen` | Public |
| `/auth/callback` | `src/app/auth/callback/route.ts` | OAuth exchange |

### Product — student

| Route | File | Access |
|---|---|---|
| `/student` | `src/app/student/page.tsx` | Student (`requireStudent`), `force-dynamic` |
| `/student/learn` | `src/app/student/learn/page.tsx` | Student |
| `/student/assignments` | `src/app/student/assignments/page.tsx` | Student |
| `/student/engagement` | `src/app/student/engagement/page.tsx` | Student |
| `/practice` | `src/app/practice/page.tsx` | **Public** (guest practice) |
| `/practice/[program]` | `src/app/practice/[program]/page.tsx` | Public |
| `/practice/session` | `src/app/practice/session/page.tsx` | Public |
| `/exam` | `src/app/exam/page.tsx` | Public (guest); resume is signed-in only |
| `/results` | `src/app/results/page.tsx` | Public (reads the in-memory store) |

### Product — parent / teacher / admin

| Route | File | Access |
|---|---|---|
| `/parent`, `/parent/children` | `src/app/parent/**` | Parent, `force-dynamic` |
| `/billing` | `src/app/billing/page.tsx` | Parent |
| `/teacher/**` (dashboard, students, assignments, marking, analytics) | `src/app/teacher/**` | Teacher |
| `/admin/**` (dashboard, analytics, intelligence, operations) | `src/app/admin/**` | Admin |

### API routes

`/api/exam/guest-bank`, `/api/exam/session`, `/api/exam/session/active`,
`/api/exam/session/[id]/responses`, `/api/exam/session/[id]/submit`,
`/api/parent/children`, `/api/parent/children/[childId]`,
`/api/stripe/{checkout,portal,status,cancel,resume,invoices,payment-method,webhook}`,
`/api/teacher/{assignments,marking}`.

---

## 3. Log in

**Route** `/sign-in` · **Files** `src/app/sign-in/page.tsx`, `src/features/auth/components/AuthCard.tsx`
**Purpose:** one card that handles sign-in, (nominally) sign-up and forgot-password for parent/teacher/admin accounts.

### Layout as built
`min-h-screen bg-page`, a `max-w-5xl` two-column grid (`lg:grid-cols-2`). Left column is
`<AuthBrandPanel />`, hidden below `lg` and replaced by a compact header strip with the
logo and a "Sample exams" link to `/practice`. Right column is a
`rounded-3xl bg-surface shadow-[0_20px_60px_rgba(49,32,86,0.08)]` card holding `<AuthCard />`
inside a `<Suspense>` (fallback: `min-h-[520px] animate-pulse`).

### Modes
`AuthCard` has `type Mode = "signin" | "signup" | "forgot"` plus a fourth screen
`"signup-sent"`. Initial mode comes from the `?mode=` query (`signup`/`forgot`), else the
`initialMode` prop. **`?mode=signup` is force-downgraded to `signin` when
`PUBLIC_SIGNUP_ENABLED` is false.**

### Fields — sign-in
| Field | id | Type | autoComplete | Icon | Required |
|---|---|---|---|---|---|
| Email address | `auth-email` | `email` | `email` | `Mail` | yes (non-empty) |
| Password | `auth-password` | `password`/`text` | `current-password` | `Lock` | yes (non-empty) |

The password field has an inline show/hide toggle button on the right
(`aria-label` = `"Show password"` / `"Hide password"`, icons `Eye`/`EyeOff`) — this
**does** match the handoff. Input shell:
`min-h-12 rounded-xl border border-royal/15 bg-white px-4 py-3 … focus:border-royal focus:ring-4 focus:ring-royal/15`
— i.e. **48px tall, 12px radius**, against the handoff's 52–54px / 13–14px.

**There is no "keep me signed in" checkbox.** Supabase persists the session by default.
There is no "school access code" and no "one-time email link" option.

### Copy — verbatim
- h1 (signin): `"Welcome back"` · sub: `"Sign in to continue your learning journey."`
- h1 (signup): `"Create your account"` · sub: `"Create a parent account to set up practice for your child — it's free to try."`
- h1 (forgot): `"Reset your password"` · sub: `"We'll email you a secure link to set a new password."`
- Labels: `"Display name"`, `"Email address"`, `"Password"`, `"Confirm password"`
- Buttons: `"Sign in"`, `"Create account"`, `"Send reset link"`, `"Forgot password?"`
- Divider: `"Or continue with"`
- Footer (signup closed): `"Signing in for a child?"` + `"Use a login code"` → `/student-sign-in`
- Footer (signup open): `"New here?"` + `"Create an account"`
- Second footer line: `"Student?"` + `"Sign in with your code"` → `/student-sign-in`
- Unconfigured Supabase: `"Accounts aren't connected on this device yet. You can still practise as a guest — add Supabase keys to .env.local to enable sign-in."`

### Validation and gating
`canSubmit` — signin: `email.length > 0 && password.length > 0 && !isLocked`.
signup: `name.trim().length > 0 && email.length > 0 && passwordOk && confirmMatches`.
forgot: `email.length > 0 && forgotCooldown === 0`.
**There is no client-side email-format validation** — the button simply enables on
non-empty. The handoff's "empty fields on submit trigger the error" is therefore wrong
for this build: empty fields leave the button *disabled*.

### Error and lockout states
- Feedback panel is `role="status"` (**not `role="alert"`** as the handoff specifies),
  rendered as `bg-error/10 text-error` or `bg-success/10 text-success`.
- Unverified email (matches `/email.*not.*confirm|confirm.*your.*email/i`):
  `"Confirm your email before signing in — check your inbox for the link we sent."`
  with an inline action `"Resend confirmation email"`.
- Network error (`TypeError` or `/network|fetch/i`): `"Network error — check your connection and try again."`
- Any other throw: `"Something went wrong. Please try again."`
- Generic failure: `"Could not sign in."`
- **Soft lockout**, client-side only: after `LOCKOUT_AFTER_ATTEMPTS = 5` failures,
  `LOCKOUT_SECONDS = 30`. Renders `role="alert"`:
  `"Too many failed attempts. Try again in {n}s, or reset your password."`
  and the submit button relabels to `"Try again in {n}s"`.
- Forgot-password throttle: `FORGOT_COOLDOWN_SECONDS = 30`; button reads
  `"Resend available in {n}s"`.

**There is no red input border on error.** The error is panel-only.

### Social / SSO
`SocialButtons` offers four providers in a 2-column grid: **Google, Apple, Microsoft
(`azure`), Facebook**, each with an inline brand SVG, `min-h-12 rounded-xl`, pending
label `"Redirecting…"`, failure message `"That sign-in method isn't available yet."`
The handoff shows no social sign-in at all.

### Success redirect
`explicitNext ?? roleHomePath(await auth.fetchRole())` — i.e. `?next=` wins, otherwise
`ROLE_HOME_PATHS`: `student → /student`, `parent → /parent`, `teacher → /teacher`,
`admin → /admin`; no role → `/`. **Not** the handoff's parent → Landing / student → Learn.

---

## 3b. Student sign in (the real "Student tab")

**Route** `/student-sign-in` · **File** `src/features/auth/components/StudentSignInCard.tsx`

Same two-column shell as `/sign-in`. Fields:

| Field | id | Input mode | Icon |
|---|---|---|---|
| Login code | `student-login-code` | text, `autoComplete="off"` | `KeyRound` |
| PIN | `student-pin` | `inputMode="numeric"`, `autoComplete="off"` | `Shield` |

Copy: h1 `"Student sign in"`; sub `"Enter the login code and PIN your parent gave you."`;
button `"Sign in"`; footer `"Parent or teacher?"` + `"Sign in here"`.
Failure: `"Could not sign in."` (`role="status"`, `bg-error/10`).

**The identity model behind it** (`src/features/auth/student-alias.ts`):
- Login code: 8 characters from `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (Crockford-style,
  0/O/1/I/L removed), displayed hyphenated as `XXXX-XXXX` via `formatLoginCode`.
- `normalizeLoginCode` strips non-alphanumerics and upper-cases, so entry is forgiving
  of hyphens, spaces and case.
- PIN: exactly 6 digits (`isValidPin` = `/^\d{6}$/`) — it *is* the account password, so
  Supabase's `minimum_password_length = 6` fixes the length.
- The code deterministically rebuilds an internal alias email
  `childcode+<code>@students.mindmosaic.internal`. **No code→email lookup table exists.**

---

## 4. Sign up

**Route** `/sign-up` · **File** `src/app/sign-up/page.tsx`

### What actually renders
`PUBLIC_SIGNUP_ENABLED === false`, so the page renders
`src/features/auth/components/SignupClosedCard.tsx` — **not a form, and not multi-step**.

Metadata when closed: title `"Sign-up closed"`, description
`"MindMosaic accounts are created directly for families, not by public sign-up."`,
`robots: { index: false, follow: false }`.

Verbatim copy:
- Badge: `"Invite only"` (with `LockKeyhole` icon)
- h1: `"Sign-up is closed"`
- Body (`SIGNUP_CLOSED_MESSAGE`): `"MindMosaic isn't open for public sign-up. Accounts are created for families directly, and children are added by their parent from the parent dashboard."`
- Primary: `"Sign in to an existing account"` → `/sign-in`
- Secondary: `"I'm a student with a login code"` → `/student-sign-in`
- Closing paragraph: `"Practice exams stay free and need no account at all — start practising. Parents add their children from the parent dashboard."` (links to `/practice` and `/parent`)

The `signup-policy.ts` docblock is explicit that this flag **is not the security
control** — the real control is Supabase's project-level "allow new users to sign up"
(`enable_signup` in `supabase/config.toml`), verified by `npm run verify:signup-open`.

### The dormant sign-up form (behind the flag)
If the flag were flipped, `AuthCard initialMode="signup"` renders a **single-step** form:

| Order | Field | id | autoComplete | Required |
|---|---|---|---|---|
| 1 | Display name | `su-name` | `name` | yes |
| 2 | Email address | `auth-email` | `email` | yes |
| 3 | Password | `auth-password` | `new-password` | yes, all 5 rules |
| 4 | Confirm password | `auth-confirm` | `new-password` | yes, must match |

No first/last name split, no consent checkbox, no year-level grid, no state/territory
row, no programme selection, no progress bar, no step tracker, no "Skip for now".

Role is hardcoded: `auth.signUp({ …, role: "parent" })`.

Confirm feedback: `"Passwords match"` / `"Passwords do not match"`.
Failure: `"Could not create your account."`

### Password strength meter — the real rules
`src/features/auth/password.ts`. **Five rules, all required** (`allMet`), not the
handoff's length bands:

| id | Label (verbatim) | Test |
|---|---|---|
| `length` | `"8+ characters"` | `p.length >= 8` |
| `lower` | `"Lowercase letter"` | `/[a-z]/` |
| `upper` | `"Uppercase letter"` | `/[A-Z]/` |
| `number` | `"Number"` | `/[0-9]/` |
| `special` | `"Special character"` | `/[^A-Za-z0-9]/` |

Strength bands by *rules met*, not length: `0 chars → empty`; `≤2 → weak`;
`≤4 → fair`; `5 → strong`. Labels: `""`, `"Weak"`, `"Getting there"`, `"Strong"`.
Bar widths `w-0 / w-1/3 / w-2/3 / w-full`; colours `bg-royal/10 / bg-error /
bg-royal-orange / bg-success`. Each rule renders as a pill with a `Check` or `X` icon.

> Handoff divergence: the design's meter is 0 / `<6` "Too short" (coral) / `<10`
> "Getting there" (lavender) / else "Strong" (purple). The repo's third label happens
> to match, but the thresholds and the semantics do not, and the repo's palette for it
> is the *product* palette, not `--mm-*`.

### Post-signup: email confirmation
`EmailConfirmationPending.tsx` (shown when Supabase returns `needsEmailConfirmation`):
- h1 `"Check your email"`
- Body: `"We sent a confirmation link to {email}. Click it to activate your account, then sign in."`
- Button `"Resend confirmation email"` / `"Resend available in {n}s"` (`RESEND_COOLDOWN_SECONDS = 30`)
- Success `"Confirmation email resent."` / failure `"Could not resend the email."`
- Back link `"← Back to sign in"`

---

## 5. Password reset, email verification, session

### Password reset request
Inside `AuthCard`, mode `forgot`. One field (email). 30-second cooldown.
Messages: `"Reset link sent."` / `"Could not send reset link."`
Back link: `"← Back to sign in"`.

### Setting the new password — `/auth/reset`
`src/app/auth/reset/page.tsx`. Supabase establishes a short-lived recovery session on
arrival.

Fields: `new-password` (`"New password"`) with the strength meter, and
`confirm-password` (`"Confirm new password"`). `ready = evaluatePassword(password).allMet
&& confirm === password`.

Copy: h1 `"Choose a new password"`; sub `"Enter a new password for your account below."`;
button `"Update password"` (orange variant); success
`"Password updated — taking you to sign in…"` then `router.push("/sign-in")` after 1500ms;
failure `"Could not update your password."`

**Expired / invalid link is its own screen** (`MailWarning` icon):
h1 `"Link expired or invalid"`; body is either
`"This password reset link has expired."` (when `error_code === "otp_expired"`),
the URL's `error_description` with `+` → spaces, `"This password reset link is invalid."`,
or — when `updateUser` fails with a session error —
`"This password reset link has expired or has already been used."`
CTA `"Request a new reset link"` → `/sign-in?mode=forgot`, plus `"← Back to sign in"`.
Error params are read from **both** the query string and the URL hash, in an effect
(deliberately, to avoid a hydration mismatch).

### Email verification — `/auth/confirm`
`EmailVerificationScreen` inside a `<Suspense>` whose fallback is a full-screen
spinning `Loader2`.

### Session and expiry
`src/middleware.ts` → `updateSession(request)` (`src/lib/supabase/middleware.ts`) refreshes
the Supabase auth cookie on every non-asset navigation. There is **no application-level
idle timeout, no "remember me", and no session-expiry warning UI.** `AuthProvider` exposes
`status: "loading" | "authenticated" | "anonymous" | "unconfigured"`.

`AuthProvider` API surface: `fetchRole`, `signInWithPassword`, `signInWithStudentCode`,
`signUp`, `signInWithOAuth`, `sendPasswordReset`, `updatePassword`,
`resendConfirmationEmail`, `confirmEmail`, `signOut`, plus `configured`, `status`, `role`.

---

## 6. Consent, privacy, terms, age gating

**There are none in the auth flow.** No consent checkbox, no terms acceptance, no
age gate, no parental-consent affirmation anywhere in `AuthCard`, `SignupClosedCard`,
`StudentSignInCard` or `AddChildCard`. The handoff's required consent checkbox on
Sign up step 1 has no existing wording to inherit — **it would be new copy and needs
legal approval**, same as the footer disclaimer.

The nearest existing compliance strings are the two disclaimers in
`src/features/landing/content.ts`, and both are already carried verbatim on the
marketing surface:

- `credibility.disclaimer`: `"MindMosaic is an independent learning platform. Its assessment-style materials contain original questions and are not official examinations, past papers or endorsed preparation materials."`
- `footer.disclaimer`: `"MindMosaic is an independent learning platform. Its assessment-style materials contain original questions and are not official examinations, past papers or endorsed preparation materials. NAPLAN, ICAS, AMC and selective school entry assessments are the property of their respective owners; those names are used only to describe the style of practice provided."`
- `footer.supportLine`: `"Questions? Email hello@mindmosaic.app."`
- `footer.copyright`: `"© 2026 MindMosaic. Made in Australia."`

`/privacy`, `/terms`, `/assessment-disclaimer` and `/accessibility` are **real pages**
(`src/app/*/page.tsx` via `LegalPageShell`), not stubs.

---

## 7. Post-signup onboarding

**There is no onboarding flow.** Because sign-up is closed, the first authenticated
screen is whatever `roleHomePath(role)` resolves to. For a parent that is `/parent`,
which renders:

- If Supabase is unconfigured: `ErrorState` `"Accounts aren't set up yet"`.
- If the query errored: `"We couldn't load your dashboard"` / `"Something went wrong fetching your children's progress. Please refresh to try again."`
- **If no children yet** (the closest thing to onboarding): `<CheckoutStatusToast/>`,
  `<BillingPanel/>`, then `EmptyState` — `"No children linked to your account yet"` /
  `"Add your child below to create their login. Once they start practising, their progress and exam results will appear here."` — then `<AddChildCard/>`.
- Otherwise: `<ParentDashboard summaries subscription hasAccess/>` + `<AddChildCard/>`.

There is **no programme selection**, **no year-level onboarding step** and **no
trial/payment screen** after account creation.

### The real "add a student" — `AddChildCard`
`src/features/parent-dashboard/components/AddChildCard.tsx`, POSTs to
`/api/parent/children`.

Fields: **display name** (single free-text field, not first name + initial),
**year level** (a `<Select>` restricted to `"" | "3" | "5"`), optional **PIN**
(6 digits; auto-generated if blank). `canSubmit = displayName.trim().length > 0`.

Copy: title `"Add a child"`; description `"Create a login for your child. You'll get a
login code and PIN to give them — they never need an email address."`
Success: `"Account created. These are shown once — save them now and give them to your
child."` with `"Login code"` / `"PIN"`, and buttons `"Copy"` / `"Copied"`,
`"Add another child"`, `"Done — show on dashboard"`.
Duplicate name is a question, not a failure: `"You already have a child called
{existingName}. Add another one anyway?"`

Server-side messages (`src/features/auth/provision-child.ts`):
`"A display name is required."`, `"Year level must be 3 or 5."`,
`"PIN must be exactly 6 digits."`, `"Student provisioning isn't configured on this
server yet."`, `"Sign in as a parent to add a child."`,
`"Only a parent account can add a child."`, `"That PIN can't be used. Please choose a
6-digit PIN."`, `"Could not create the student account. Please try again."`,
`"Could not generate a unique login code. Please try again."`
A unique code is retried up to `MAX_CODE_ATTEMPTS = 3` times.

**A student profile holds: display name, year level (3 or 5), role, and a parent link.**
No last name, no initial, no state/territory, no programme, no avatar.

---

## 8. Student home / dashboard

**Route** `/student` · **File** `src/app/student/page.tsx` · `dynamic = "force-dynamic"`
Shell: `<StudentShell active="home">`.

Elements in order: `<ActiveSessionBanner/>`; header with eyebrow `"Your dashboard"`,
h1 `"Hi {firstName}"` (or `"Hi there"`), a status line, and a CTA; a stat rail; then a
two-column body (`lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]`).

Verbatim copy:
- Empty status line: `"Nothing sat yet. Pick a session type below and your progress starts filling in."`
- Populated: `"{n} session(s) finished"` + optionally `" · {n}-day streak going"`
- CTA: `"Start your first session"` (0 sessions) or `"Start a session"` → `/practice`
- Section labels: `"Your numbers"`, `"Start a session"`, `"Pick up where you left off"` (or `"Recent sessions"` when empty), `"Your progress"`
- Sub-label: `"Pick a mode — you can switch any time"`
- Focus card (only once there is scored history): `"Focus next: {label}"`,
  `"Your lowest subject so far, at {percent}%."`, action `"Practise this"` → `/student/learn`
- Badge when there is history: `"{n} finished"`

Panels: `DashboardStatRail` (total sessions, average %, best %, current streak),
`SessionModeCards`, `RecentAttemptsCard`, `StreakWeeklyGoalWidget`,
`AssignmentsSummaryCard`, `MasterySnapshot`.

Empty states are deliberate: the docblock records that panels used to hide when empty and
now render honest zeros instead.

Student nav (`src/features/student/components/student-nav.ts`) — the real sidebar:
`Dashboard /student`, `Learn /student/learn`, `Assignments /student/assignments`,
`Progress /student/engagement`, `Practice /practice`, `Results /results`, plus
`BACK_TO_SITE = { label: "Back to site", href: "/" }`.

> Handoff divergence: the designed sidebar is logo → student chip → **Modes** (Learn,
> Practice, Exam preparation, Learning Hub) → a "This week 4 of 5" panel → **Site nav**
> (Home, How It Works, Plans, About, Parent view). None of "Exam preparation",
> "Learning Hub" (as a mode) or "Parent view" exist as student destinations.

---

## 9. Learn — lesson list and lesson view

**Route** `/student/learn` · **File** `src/app/student/learn/page.tsx` ·
Shell `<StudentShell active="learn">` · `force-dynamic`.

**There is no lesson content model, no lesson list and no lesson view in this codebase.**
The screen is an activity launcher.

Elements: h1 `"Learning hub"`; sub `"Choose an activity or focus on the skills that need
you most."` or, with no attempts, `"Choose your first activity to get started."`; a
`Year {n}` badge when known.

Recommended-focus panel (solid `bg-royal`, white text), only when a weakest subject exists:
eyebrow `"Recommended focus"`, h2 = subject label, body `"This is your weakest subject so
far at {percent}% of objective marks. A couple of focused practice sessions could turn it
into a strength."`, CTA `"Start practice"` → `/practice`.

Otherwise the get-started card: h2 `"Begin with a practice session"`, body
`"Finish your first session and MindMosaic will map your mastery by subject, highlight
what needs attention and recommend what to practise next."`, CTA
`"Set up your first session"`.

`"Start an activity"` — four cards, verbatim:

| Title | Meta | Description | href |
|---|---|---|---|
| Diagnostic check | `~15 min · every subject` | `A quick mixed check to see where you stand right now.` | `/practice/session?subject=mixed&count=15` |
| Practice | `Untimed · your pace` | `Targeted drills by subject, style and length.` | `/practice` |
| Exam sim | `Timed · exam conditions` | `Full NAPLAN- or ICAS-style timed assessment.` | `/practice` |
| Review results | `Every finished session` | `Revisit answers and explanations from past sessions.` | `/results` |

Then `"Browse by skill"` → `<SkillBrowser skills={buildSkillCatalogue(getExamBank("curated"))}/>`,
and `"Your progress"` → `RecentAttemptsCard` (limit 6) + `MasterySnapshot`.

---

## 10. Practice — question, submission, explanation, retry

**Routes** `/practice` (catalogue), `/practice/[program]`, `/practice/session` (the runner).
**Files** `src/app/practice/**`, `src/features/exam-engine/practice-mode/PracticeSession.tsx`.

### Catalogue `/practice`
Public. Badge `"Original Australian practice"`; h1 `"Choose the right practice for
today"`; body `"Explore original Grade 3 and Grade 5 NAPLAN-style and ICAS-style
practice. Choose a subject, year level and assessment style, then start immediately —
signing in is what saves your progress."`
Trust points: `"Original questions"`, `"Australian English"`, `"Instant scoring"`,
`"Progress saved when signed in"`.
Then `PracticeProgramGrid` (filter state is parsed **server-side** from the query and
passed as `initialFilters` — a documented, e2e-enforced constraint) and
`ComingSoonPrograms`.

### Runner `/practice/session`
Query params: `subject` (`numeracy|reading|language|mixed`), `year` (`3|5|mixed`),
`style` (`naplan_style|icas_style|mixed`), `skill`, `count` (default
`DEFAULT_QUESTION_COUNT = 8`). Questions come from `/api/exam/guest-bank` and are
selected client-side with a deterministic seed
`practice-{subject}-{year}-{style}-{skill|any}`.

Loading: `"Loading your practice session…"` / `"One moment while we put together your questions."`
Error: `"We couldn't load practice questions"` / `"Check your connection and try again."` + `"Back to Learning Hub"`.
No matches: `"No questions match this practice set"` / `"Try a different subject or skill from the Learning Hub."`

### `PracticeSession` state and controls
Phases: `question` → `checked` → (next) … → `summary`.
State: `questions`, `currentIndex`, `answers`, `results`, `streak`, `bestStreak`, `phase`.

Header (sticky, `min-h-16`, `bg-white/85 backdrop-blur-xl`): `"Exit practice"` link
(left), centred title + `ProgressBar` + `{currentIndex} / {total}`, and a **streak
counter** with a `Flame` icon (right).

Body (`max-w-2xl`): eyebrow `"Question {n} of {total}"` (focused on navigation,
`tabIndex={-1}`, with a parallel `sr-only` `role="status"` announcement), then
`<ExamQuestion>` — which renders **any of 14 question types**, not just four
multiple-choice options.

Controls: `"End session"` (ghost), `"Skip"`, `"Check answer"`
(disabled until `!isUnanswered(answer)`), then `"Next question"` / `"View results"`.

**Feedback panel** (`role="status"`, `data-testid="feedback-panel"`), statuses:

| Status | Label (verbatim) | Tone |
|---|---|---|
| `correct` | `"Correct"` | `bg-success/10 text-success` |
| `incorrect` | `"Not quite"` | `bg-error/10 text-error` |
| `unanswered` | `"You didn't answer this one"` | `bg-royal/8 text-muted` |
| `manual_review` | `"We'll mark this one for you"` | `bg-warning/10 text-warning` |
| `skipped` | `"Skipped"` | `bg-royal/8 text-muted` |

It shows `Your answer: {…}` (incorrect only), `Correct answer: {…}` (incorrect or
unanswered) and the question's `explanation` as a single paragraph.
**There are no numbered step tiles**, no "Try again" button, and no "Read the lesson"
link — there is no lesson to link to.

**Summary view**: eyebrow `"Session complete"`, h1 `"Nice work"`, sub `"Here's how you
did on {title}."`; three stats `Accuracy` / `Correct` / `Questions`; an insight line
banded at ≥85 / ≥60 / below:
- `"Outstanding session — {correct} of {scored} scored correct, with a best streak of {bestStreak}."`
- `"Solid progress — {accuracy}% correct with a best streak of {bestStreak}. One more session should lock this in."`
- `"Keep practising — {accuracy}% correct this time. Review the explanations below for the patterns to focus on."`
- `"Nothing to score in this session — try answering a few questions next time."`
Then `"Question review"` with `"{correct} correct · {incorrect} incorrect[ · {n} skipped]"`,
and CTAs `"Practice again"` / `"Back to Learning Hub"`.

---

## 11. Exam simulation

**Route** `/exam` · **File** `src/app/exam/page.tsx` (client) · store
`src/features/exam-engine/state`.

### Start
There is no start screen at `/exam`. Configuration happens in `ExamConfigurator` on the
practice pages; `/exam` is entered once a session exists. Cold-load states:
- Resume check (signed-in only): `"Checking for an exam in progress…"` / `"One moment while we check whether you have an exam to resume."`
- No session: `"No exam in progress"` / `"Set up an exam from the practice page to begin practising."` + `"Set up an exam"`
- Already submitted: `"This exam has already been submitted"` / `"Taking you to your results…"` (or `"We could not open your results automatically."`) + `"View results"` / `"Try again"`
- Bad question set: `"The exam could not be opened"` / `"The selected questions are unavailable. Return to practice and try again."`

A refresh mid-exam wipes the Zustand store; a **signed-in** student gets one
`resumeServerExam()` attempt. **Guests lose the session** — deliberate, per
`docs/ASSESSMENT_SECURITY_MODEL.md`.

### In-progress UI
Header: a 3px decorative progress strip (`aria-hidden`), logo → `/practice`,
`<ExamIntegrityMonitor active={config.timing === "timed"}/>`, `<ExamTimer/>`,
and `"Exit exam"` (`data-testid="exit-exam"`).

Title block: badge `"MindMosaic practice exam"`, h1 `describeConfig(config)`, body
`"Answer each question, flag anything you want to check again, and submit when you are
ready. Your answers are kept while you move between questions."`, plus
`"{answered} of {total} answered"` and a labelled `ProgressBar` (`"Questions answered"`).

Layout `lg:grid-cols-[260px_minmax(0,1fr)]`, sidebar sticky.

**Question grid** — `<ol>` of buttons, `grid-cols-5 sm:grid-cols-8 lg:grid-cols-4`,
each `min-h-11 rounded-xl`. Three states via `data-nav-state`:

| State | Styling | Marker |
|---|---|---|
| `current` | `border-royal bg-royal text-white` + shadow | — |
| `answered` | `border-success/20 bg-success/8 text-success` | `Check` top-right |
| `unanswered` | `border-royal/12 bg-page text-muted` | — |

Flagged adds a filled `Flag` glyph top-right (and takes precedence over the tick).
`aria-label`: `"Go to question {n}, answered|not answered[, flagged for review]"`;
`aria-current="step"` on the current cell.
Legend: `"Tick means answered"`, `"Flag means marked for review"`.

> Handoff divergence: the design specifies **four** cell states (answered, flagged,
> current, blank) in a 20-cell grid. The repo has three states plus flagging as an
> orthogonal marker — closer, but the legend wording and colours differ, and the repo
> uses `success` green where the design uses purple/lavender.

**Question card header**: `"Question {n} of {total}"` (h2, focus target),
metadata line `"Grade {yearLevel} · {subject} · {skill|topic} · {difficulty}"`,
and a flag toggle labelled `"Flag for review"` / `"Flagged for review"`
(`aria-pressed`, `data-testid="flag-toggle"`).

The question body is wrapped in a `WidgetErrorBoundary` keyed by question id — one
malformed item cannot end the sitting. Fallback: `"This question didn't display
properly"` / `"Skip ahead and keep going — your other answers are saved, and this one
won't be marked against you."` / `"Try loading it again"`.

Footer controls: `"Previous"` (disabled on the first), `"Next question"` (hidden on the
last), `"Submit exam"`.

### Timer, autosave, integrity
- `ExamTimer` — separate component; drives `submitExam("timer_expired")`.
- Autosave is server-side for signed-in students via
  `/api/exam/session/[id]/responses`; **no autosave state is displayed in the header.**
  The design's "Saved just now" indicator has nothing to read from today.
- `ExamIntegrityMonitor` runs on timed sittings only.

### Review before submit
`SubmitConfirmationDialog` receives `totalQuestions`, `answeredCount`,
`unansweredCount`, `flaggedCount`, `manualReviewCount`.
Exit confirmation (`ConfirmDialog`, `variant="danger"`): title `"Exit this exam?"`,
description `"Your progress on this attempt will be lost and can't be recovered."`,
buttons `"Exit exam"` / `"Keep working"`.

On submit the route is **replaced** (not pushed) with `/results`, via
`useBoundedNavigation`, so Back never lands on a submitted exam.

### Results — `/results`
Header is the shared `AppHeader`, plus badge `"Exam complete"`.

Verdict eyebrow by `objectivePercentage`: ≥85 `"Excellent result"` /
`"Strong understanding shown across this exam."`; ≥70 `"Solid performance"` /
`"Good foundations, with a few areas to strengthen."`; ≥55 `"Room to grow"` /
`"Building understanding — focused practice will close the gaps."`; else
`"Let's build from here"` / `"This result shows clear areas to target below."`
h1 `"Your results"`.

Score panel: solid `bg-royal`, a conic-gradient `.score-ring` (`role="img"`,
`aria-label="Objective score: {n} percent, {earned} of {available} objective marks"`),
h2 `"Objective score"`, and either
`"Writing tasks ({n}) are marked by a person and are not counted in this percentage."`
or `"Every question in this exam was marked automatically."`

`"Performance summary"` — `"Time taken: {duration}"` and four tiles:
`"Correct"`, `"Incorrect"`, `"Not answered"`, `"Manual review"`.
Then a definition list: `"Total questions"`, `"Attempted"`, `"Marked automatically"`,
`"Pending manual marks"`, `"How it ended"` (`"Time ran out (auto-submitted)"` /
`"Submitted by you"`).

`ResultsHistoryPanel`, then `"Breakdowns"` / `"Where your marks came from"` /
`"Objective marks exclude writing tasks that a person marks. A group with no objective
marks shows 0/0."` — six tables: by question type, subject, skill, difficulty, and
(only when `mixed`) year level and exam style. Columns: `Group, Total, Attempted,
Correct, Incorrect, Unanswered, Manual review, Objective marks`.

`"Question review"` / `"Every question, explained"`. **The only filter is a flagged
toggle** — `"Review flagged questions"` / `"Showing flagged ({n})"`; there is **no
"Incorrect only"** filter. Empty: `"You did not flag any questions in this exam."`
Each row: `"Question {n}"`, a status chip (`"Correct"`, `"Incorrect"`,
`"Not answered"`, `"Marked by a person"`), an optional `"Flagged"` chip, the metadata
line ending `"{awarded}/{available} marks"` or `"{n} marks pending review"`, the prompt,
an optional `<details>` stimulus, visuals, then `"Your answer"` (or `"Not answered"`)
against `"Correct answer"` — or, for manual items, `"Marked by a person"` /
`"Writing tasks have no single correct answer. A marker uses the rubric to award up to
{n} marks."` — and an `"Explanation"` block.
**Incorrect rows are not tinted.**

Footer actions: `"Print results"`, `"Back to {role home}"` / `"Back to practice"`,
`"Practice {subject} again"`, `"Try another exam"`.

---

## 12. Parent view / reporting

**Routes** `/parent`, `/parent/children` · Shell `<ParentShell active="/parent">` ·
`force-dynamic`. Data is loaded through RLS-scoped queries as the signed-in parent
(`loadParentDashboard()`), summaries computed server-side by `buildChildSummary`, then
handed to a client component as plain props. See §7 for the empty and error states and
the `AddChildCard` inventory.

`hasAccess = subscription.status === "ready" && subscription.subscription?.hasAccess`.

---

## 13. Plans, billing and trial

### Price strings — the single source of truth
`src/lib/billing/prices.ts`:

```
CURRENCY = "AUD"
FAMILY_PLAN.name          = "Family"
FAMILY_PLAN.maxChildren   = 3
FAMILY_PLAN.monthly       = { plan: "family_monthly", amount: 14.99, display: "A$14.99", period: "/mo" }
FAMILY_PLAN.annual        = { plan: "family_annual",  amount: 149,   display: "A$149",   period: "/yr" }
FAMILY_PLAN_AVAILABILITY  = "purchasable"
PRICE_DISCLAIMER = "GST-inclusive AUD — pricing subject to change. Placeholder amounts, not yet linked to a live Stripe price."
```

The amounts `14.99` and `149` match the handoff's monthly and family-year prices. **The
display format does not**: the repo renders `A$14.99`, the design `$14.99`.

### The Plans screen — `/pricing`
`src/app/pricing/page.tsx` → `<MarketingPage>` wrapping `<Plans/>` + `<Faq/>`.
Page eyebrow `"Plans"`, h1 `"Free to practise. Paid only for what a family adds on
top."`, intro `"Guest practice needs no account and is never gated behind a
subscription. The Family plan has a live price; the Individual learner tier's inclusions
are still being confirmed and are marked as such rather than guessed at."`

`plans` in `content.ts` — heading `"Three ways to access MindMosaic."`, three cards:

| id | Eyebrow | Name | Price | Note | CTA |
|---|---|---|---|---|---|
| `free` | Free access | Try the platform | `$0` / `forever` | `"Unlimited guest practice — no account required."` | `"Start free"` → `/practice` |
| `individual` | Individual learner | One student, full access | *null* (**pending**, highlighted) | `"Price and inclusions to be confirmed"` | `"See plans"` → `/pricing` |
| `family` | Family access | More than one student | `A$14.99` / `mo` | `PRICE_DISCLAIMER` | `"Subscribe to Family"` → `/billing` |

> Handoff divergence: the design's three cards are **free trial `$0` / 7 days**,
> **monthly `$14.99` (featured)**, **family year `$149`**. The repo has no trial concept
> at all, features the *unpriced* Individual tier instead of the monthly one, and has no
> annual card on the marketing page. There is also **no nine-row comparison table** and
> **no five billing FAQs** — the FAQ on `/pricing` is the six general product questions.

### `/billing`
`src/app/billing/page.tsx`, parent-scoped. Reads `getMySubscription()`. Components:
`FamilyPlanCard`, `PlanComparisonTable`, plus Stripe checkout/portal/cancel/resume
wiring under `/api/stripe/*`.

**There is no free-trial mechanism anywhere in the code** — no trial days, no trial
state on the subscription, no "Start the 7-day trial" path. The design's step-3
"what happens next" panel restating trial terms would be describing something that
does not exist.

---

## 14. Screen-by-screen reconciliation with the handoff

| # | Handoff screen | Nearest existing route | Verdict |
|---|---|---|---|
| 1 | Landing | `/` | **Already built from this same design file.** Sections in `content.ts`; hero photo recovered from the design's sidecar. |
| 2 | How It Works | `/methodology` | Built. Has `HowItWorks` (3 steps) + `Quality` (10 standards) + `Audiences`. **`Tutorials` exists but is on `/` only**, and all its video slots are empty by design. |
| 3 | Plans | `/pricing` | Built, but the card set, prices shown, comparison table and billing FAQs all diverge (§13). |
| 4 | Resources | `/help` + the `Resources` section on `/` | **Largest marketing gap.** No search field, no seven category tabs, no nine-card grid, no featured split card, no six-card Help Centre index. `/help` is prose; `resources` in `content.ts` has **three** items. |
| 5 | About | `/about` | **Prose page in `LegalPageShell`, not the designed screen.** No principle tiles, no pipeline, no privacy summary panel, no contact form (there is a separate `/contact`). Its copy also still says *"Grade 3 and Grade 5"*. |
| 6 | Log in | `/sign-in` + `/student-sign-in` | Exists, different model (§3, §3b). Speculative fields confirmed wrong: no username, no "keep me signed in", no access code, no email-link option; student = code + PIN. |
| 7 | Sign up | `/sign-up` | **Does not exist as a flow.** Sign-up is closed by policy; the real equivalent is `AddChildCard` inside `/parent` (§7). |
| 8 | Learn | `/student/learn` | Exists in name only. **No lessons in the data model** (§9). |
| 9 | Practice | `/practice/session` | Built, richer than the design (14 question types, skip, streak) and poorer in others (no step tiles, no retry, no lesson link). |
| 10 | Exam Preparation | `/practice` → `/exam` → `/results` | Three of the four designed views map onto real routes. **The jurisdiction picker does not exist** — the nearest is `programmes.regions` on the marketing page (NSW, VIC, QLD, WA, SA, Other — **six**, not eight, and none marked confirmed). |

---

## 15. Things that surprised me, and things that look unfinished

**Surprising, but deliberate and documented**

1. `globals.css` carries a long comment recording that `--success/--warning/--error`
   and the landing tokens were once declared in `@theme inline` but missing from
   `:root`, so `bg-error text-white` on the destructive Button rendered white-on-white
   — which is why the exam's "Exit exam" dialog appeared to offer only "Keep working".
2. Cascade layers are load-bearing. Unlayered CSS beats *any* layered utility, so
   `a { color: inherit }` silently defeated `text-white` on purple buttons. Element
   resets are therefore inside `@layer base`, and `.lp-card-hover` is too, so
   `focus-visible` rings (also box-shadows) still win.
3. `lp-rise` intentionally has **no opacity keyframe** — axe sampled mid-fade text as
   failing contrast.
4. `--font-display` at theme level is an inert system serif on purpose; the real
   Instrument Sans value is scoped to `.lp-root`/`.legal-page`. A previous leak had
   `FamilyPlanCard`'s price silently rendering in Roboto Slab.
5. The font-weight scale is remapped one step lighter globally, to slim ~760
   `font-bold`/`font-semibold` call sites at once.
6. `/practice` parses filters **server-side** because `useSearchParams()` in the client
   grid made the production HTML ship a skeleton with zero program cards — invisible in
   dev, caught only by e2e against a real build.
7. `AddChildCard` guards double-submit with a `useRef`, not `submitting` state: two
   clicks before a re-render would otherwise create two children.
8. The student login code **is** the email mapping (`childcode+<code>@students.
   mindmosaic.internal`) — no lookup table exists, by design.
9. `PUBLIC_SIGNUP_ENABLED` is explicitly documented as *not* a security control.

**Unfinished or inconsistent**

1. **Year coverage contradiction.** Marketing says Years 1–12; the code accepts
   `yearLevel: 3 | 5` in provisioning, filters and `AddChildCard`'s `<Select>`. `/about`
   and `/practice` both say "Grade 3 and Grade 5". A designed year-level grid of twelve
   buttons cannot be wired to anything today.
2. **"Grade" vs "Year".** The product surfaces say `Grade {n}`; the marketing surface and
   the designs say `Year {n}`. Both appear in shipped copy.
3. **Prices are placeholders.** `PRICE_DISCLAIMER` says so outright, yet
   `FAMILY_PLAN_AVAILABILITY = "purchasable"` and checkout is live.
4. **The annual price `A$149` is never shown on any marketing page** — only monthly is.
5. **No trial exists** anywhere in code, despite the design's 7-day trial being the
   primary conversion path.
6. **Two auth palettes.** `/sign-in` uses product tokens (`bg-page`, `text-royal`) while
   the page it is reached from uses `--mm-*`. Crossing that boundary is visible.
7. **`role="status"` where `role="alert"` is meant.** Sign-in errors, the student
   sign-in error and the practice feedback panel are all `status`; only the lockout
   notice and the reset-link error use `alert`.
8. **No inline field-level validation** anywhere in auth — no email format check, no
   red input borders, errors are panel-only.
9. **Password rules are stricter than the design implies** and are all-or-nothing:
   a 30-character all-lowercase password fails.
10. `roles.ts` still describes `ROLE_HOME_PATHS` as "Phase 0 placeholder routes", though
    `/student`, `/parent`, `/teacher` and `/admin` are all real now.
11. `AuthCard` offers four OAuth providers; whether any are configured in Supabase is
    unknown from the code, and the failure message (`"That sign-in method isn't
    available yet."`) suggests some are not.
12. `/about` and `/help` are `LegalPageShell` prose pages with a hardcoded
    `lastUpdated="29 July 2026"`.
13. `Tutorials` renders three empty slots plus one feature slot; no video has been
    recorded, matching the handoff's open item 2.
14. `evidence` in `content.ts` is three explicit placeholder panels, each naming what is
    required before production — testimonials, platform figures and author credentials
    are all unverified.
15. There is no `Pricing.tsx`, `SocialProof.tsx`, `StatsBand.tsx`, `Subjects.tsx` or
    `WhyLove.tsx` any more — those landing components (and their tests) were deleted in
    the current working tree in favour of the design-canvas components. The working tree
    is **dirty**: 30+ modified files and 10 untracked new components/routes.

---

## 16. Status of this document

Everything above describes the codebase **as it was before the ten handoff screens were
implemented**. That is the point of it: the handoff asked for a report of what exists so
the designs could be reconciled against real fields, copy and routes rather than
replacing them blind.

It has deliberately **not** been rewritten to describe the result. Read it as the
"before" column. The reconciliations it drove are recorded where they were made — each
one is a comment in the component that carries it, naming the section of this document
it came from — and the largest of them are:

- **Log in** now has the Parent/Student segmented control the design specifies, with the
  Student tab asking for a login code and a PIN (§3b) rather than the design's
  speculative "student username" and password.
- **Sign up** exists as the three-step wizard, and public sign-up was opened deliberately
  to make it reachable. `PUBLIC_SIGNUP_ENABLED` and `supabase/config.toml`'s
  `enable_signup` were flipped together; the hosted Supabase project's own setting is a
  separate switch and must be turned on there too (§4).
- **Plans** carries the real monthly and yearly prices, a nine-row comparison and five
  billing FAQs — with no trial, because there is no trial mechanism (§13).
- **Learn** is built to the design, with the lesson list as a labelled empty state,
  because there is still no lesson content model (§9).
- **Exam preparation** gained a real screen at `/student/exam-preparation`. Every
  jurisdiction shows "Being confirmed", including the three the design marks confirmed,
  because no selective entry-style content exists for any of them (§14, and the
  handoff's own open item 4).

The items in §15 that were statements about missing product — no trial, no lessons, no
selective-entry content, Years 3 and 5 only — are all still true. Nothing here was
implemented by inventing content to fill a design's slot.
