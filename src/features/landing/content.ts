/**
 * All landing-page copy, imagery references and structured content, typed
 * and centralised so the page's composition, copy, stats, links and image
 * choices are a config edit — never a component edit. `sections` controls
 * both order and visibility; `src/app/page.tsx` renders whatever it says.
 *
 * Rebuilt to match the owner's two approved mockups (brand/images/asset-map.json,
 * "reference" entries): mockup 1 ("Smart Practice Bright Futures") is the
 * primary page structure; mockup 2's ("The Smarter Way for Kids...") 5-card
 * "Why Students Love MindMosaic" row, subject icon grid, and hero floating
 * progress chips are blended in where sections correspond. See
 * remediation-output/60-landing-rebuild-report.md for the full build report,
 * including which owner photos were chosen for which card and why.
 *
 * Every image path below points at a WebP already produced from
 * brand/images/asset-map.json's "use"/"flagged" entries — see
 * remediation-output/tools/_process-landing-assets.mjs. brand/images/ itself
 * is gitignored; only asset-map.json is committed from that directory.
 */

import { FAMILY_PLAN, FAMILY_PLAN_AVAILABILITY, PRICE_DISCLAIMER } from "@/lib/billing/prices";

export type SectionKey =
  | "hero"
  | "trustStrip"
  | "whyLove"
  | "subjectCards"
  | "subjectGrid"
  | "statsBand"
  | "howItWorks"
  | "forParents"
  | "pricing"
  | "faq"
  | "educators"
  | "testimonials"
  | "featureStrip"
  | "footer";

/**
 * Page composition: order AND visibility in one place. `src/app/page.tsx`
 * maps over this array — adding, removing, reordering, or toggling a
 * section is a config edit only.
 */
/*
 * Order: Hero -> Why students love -> Practice by assessment
 * (subjectCards) -> Explore subjects (subjectGrid) -> How it works ->
 * Trust & social proof (statsBand + testimonials, grouped adjacently) ->
 * Learning insights (forParents, merged with the former "Learning that
 * fits every student" section — see forParents' doc comment) -> Pricing
 * -> FAQ -> Footer. `educators` predates this pass and isn't part of
 * that list — left disabled where it already was.
 */
export const sections: { key: SectionKey; enabled: boolean }[] = [
  { key: "hero", enabled: true },
  { key: "trustStrip", enabled: true },
  { key: "whyLove", enabled: true },
  { key: "subjectCards", enabled: true },
  { key: "subjectGrid", enabled: true },
  { key: "howItWorks", enabled: true },
  { key: "statsBand", enabled: true },
  { key: "testimonials", enabled: false },
  { key: "forParents", enabled: true },
  { key: "pricing", enabled: true },
  { key: "faq", enabled: true },
  { key: "educators", enabled: false },
  { key: "featureStrip", enabled: true },
  { key: "footer", enabled: true },
];

export const nav = {
  links: [
    { label: "Practice", href: "/practice" },
    { label: "Courses", href: "/practice" },
    { label: "Plans", href: "#plans" },
    { label: "Resources", href: "#faq" },
    { label: "Insights", href: "#audiences" },
  ],
  signIn: { label: "Log in", href: "/sign-in" },
  cta: { label: "Start free", href: "/practice" },
} as const;

/* ---------- Hero ---------- */

export const hero = {
  headlineLines: [
    { text: "Original NAPLAN & ICAS-style practice.", tone: "ink" as const },
    { text: "Built for Grades 3 & 5.", tone: "brand" as const },
  ],
  subheadline: "Expert-written questions. Instant feedback. Real progress.",
  primaryCta: { label: "Start free", href: "/practice" },
  secondaryCta: { label: "Explore Practice Tests", href: "/practice" },
  trustChips: [
    { icon: "ShieldCheck", label: "100% Original Content" },
    { icon: "BookOpenCheck", label: "Curriculum Aligned (AU)" },
    { icon: "Zap", label: "Instant Explanations" },
    { icon: "TrendingUp", label: "Progress Tracking for Parents" },
  ],
  /** Not a partnership/endorsement claim — see footer.disclaimer for the matching full statement. */
  disclaimer: "MindMosaic is not affiliated with or endorsed by NAPLAN, ICAS or AMC.",
  image: {
    src: "/landing/hero/hero-girl-laptop-chips-landscape.webp",
    width: 724,
    height: 483,
    alt: "A student smiling while practising on a laptop at her desk",
  },
  /**
   * Rendered as real HTML/CSS (matching the "Weekly Goal" / "Reading Score"
   * mini-cards in the lavender band) rather than baked-text images, so it's
   * illustrative UI, not real outcome data or a claim about any individual
   * student's results — each card is visibly labelled "Illustrative" (see
   * Hero.tsx), matching the placeholder-content convention used for
   * testimonials/stats elsewhere on this page.
   */
  floatingChips: {
    enabled: true,
    chips: [
      { label: "Accuracy", value: "87%", fraction: 0.87 },
      { label: "Memory", value: "+19%" },
      { label: "Questions Solved", value: "1,240" },
    ],
  },
} as const;

/* ---------- Trust strip ---------- */
/*
 * HARD RULE: no third-party logos (NAPLAN / ICAS / ACARA / Google / AWS or
 * any other) anywhere on this page — text references only. Both mockups
 * show real assessment-body logos in this strip; that part of both mockups
 * is deliberately NOT reproduced. See the build report's deviations list.
 */
/*
 * Cut from 5 badges to 4: "Curriculum Referenced" was a near-duplicate of
 * "Australian Curriculum Aligned" and "Trusted by Families" was
 * unsupported filler (no evidence backs it, unlike the other three).
 * Fewer, higher-confidence points read as intentional instead of noise.
 */
export const trustStrip = {
  heading: "Helping Australian students learn and grow",
  badges: [
    "100% Original Content",
    "Australian Curriculum Aligned",
    "NAPLAN-style Practice",
    "ICAS-style Practice",
  ],
} as const;

/* ---------- Why Students Love MindMosaic (mockup 2) ---------- */

/*
 * Icons: lucide-react marks in tinted ColorTile squares (not the owner's
 * feature-icon-*.webp images, and not hand-authored SVG — a lucide
 * equivalent exists for all 5). `tone` maps to ColorTile's existing tone
 * classes in primitives.tsx — no new colour values.
 *
 * "Full skill coverage" (was "Adaptive learning"): renamed because no
 * adaptive/personalisation engine exists in this codebase — nothing
 * adjusts difficulty or sequencing to an individual student's
 * performance. What's real and shippable: every question carries a
 * `skill`/`topic` and a `difficulty` ("easy" | "medium" | "challenging" —
 * see src/schemas/question.schema.ts), and
 * src/features/exam-engine/selection/skill-catalogue.ts aggregates the
 * full bank into a per-subject, per-skill breakdown for the Learning Hub.
 * That's genuine skill + difficulty breadth, not an adaptive algorithm.
 */
export const whyLove = {
  heading: "Why Students Love MindMosaic",
  subheading: "Everything they need to improve, in one beautiful platform.",
  cards: [
    {
      icon: "GraduationCap",
      tone: "brand",
      title: "Exam-ready practice",
      body: "Real NAPLAN-style and ICAS-style questions that build genuine exam confidence.",
    },
    {
      icon: "Zap",
      tone: "success",
      title: "Instant feedback",
      body: "Every answer is scored immediately, with a clear explanation of the right approach.",
    },
    {
      icon: "BarChart3",
      tone: "brand",
      title: "Track real progress",
      body: "See skill-by-skill growth over time, not just a single test score.",
    },
    {
      icon: "Target",
      tone: "brand",
      title: "Full skill coverage",
      body: "Every skill for each year level, from easy warm-ups to challenging extension questions.",
    },
    {
      icon: "Star",
      tone: "royal-orange",
      title: "Build confidence",
      body: "A safe, ad-free space where mistakes are simply part of getting better.",
    },
  ],
} as const;

/* ---------- Practice by Assessment ---------- */
/*
 * Exam-style scope, truthful against src/features/catalogue/catalogue.ts:
 * NAPLAN-style and ICAS-style are live programs today; "Australian Maths
 * Competition" exists in the catalogue as status: "coming_soon" (not yet a
 * playable program), so it renders the same disabled "Coming soon" card
 * treatment as the other not-yet-available subjects — never a dead link.
 */
export const subjectCards = {
  heading: "Practice by Assessment",
  subheading: "Choose the exam style your child is preparing for.",
  yearsLine: "Grades 3 & 5",
  viewAllCta: { label: "View All Subjects", href: "/practice" },
  cards: [
    {
      name: "NAPLAN-style",
      icon: "BookOpenCheck",
      description: "Practice aligned to the NAPLAN test format across Numeracy, Reading and Language Conventions.",
      image: { src: "/landing/subject-card/card-girl-writing-classroom.webp", width: 724, height: 483 },
      href: "/practice",
      comingSoon: false,
    },
    {
      name: "ICAS-style",
      icon: "Sigma",
      description: "Reasoning and challenge-style questions modelled on the ICAS format, for Numeracy and English.",
      image: { src: "/landing/subject-card/card-boy-glasses-writing.webp", width: 724, height: 483 },
      href: "/practice",
      comingSoon: false,
    },
    {
      name: "AMC-style",
      icon: "Trophy",
      description: "Competition-style problem solving practice, modelled on the Australian Maths Competition.",
      image: { src: "/landing/subject-card/card-boy-science-goggles.webp", width: 724, height: 483 },
      href: "/practice",
      comingSoon: true,
    },
  ],
} as const;

/* ---------- Explore Subjects icon grid ---------- */
/*
 * 8 distinct subjects, truthful against src/features/catalogue/catalogue.ts
 * and the selection engine's real filter dimensions (numeracy/reading/
 * language only — see catalogue.ts's SCOPED_LIVE_PROGRAMS comment). Live:
 * Numeracy, Reading, Grammar & Punctuation (the real "language" filter).
 * Coming soon: Writing (bundled today inside "Mixed practice" only, not a
 * standalone program — matches the precedent this page has always used
 * for it), Science, Digital Technologies (both already coming_soon in the
 * catalogue), Spelling (real blueprint content exists but isn't separately
 * selectable — it's bundled into the language filter with grammar/
 * punctuation), and Critical & Creative Thinking (not in the catalogue at
 * all). No fabricated subject stands in as "live".
 */
export const subjectGrid = {
  heading: "Explore Subjects",
  subheading: "Comprehensive practice across key learning areas",
  gradesLine: "Grades 3 & 5",
  tiles: [
    { name: "Numeracy", image: "/landing/subject-icon/icon-numeracy-calculator.webp", icon: undefined, tone: "brand", comingSoon: false },
    { name: "Reading", image: "/landing/subject-icon/icon-reading-book.webp", icon: undefined, tone: "accent", comingSoon: false },
    { name: "Writing", image: undefined, icon: "PenLine", tone: "brand-bright", comingSoon: true },
    { name: "Science", image: "/landing/subject-icon/icon-science-flask.webp", icon: undefined, tone: "accent", comingSoon: true },
    { name: "Digital Technologies", image: "/landing/subject-icon/icon-digitech-computer.webp", icon: undefined, tone: "brand", comingSoon: true },
    { name: "Spelling", image: undefined, icon: "SpellCheck", tone: "royal-orange", comingSoon: true },
    { name: "Grammar & Punctuation", image: "/landing/subject-icon/icon-writing-pencil.webp", icon: undefined, tone: "royal-orange", comingSoon: false },
    { name: "Critical & Creative Thinking", image: undefined, icon: "Lightbulb", tone: "brand-ink", comingSoon: true },
  ],
  iconSize: { width: 627, height: 627 },
} as const;

/* ---------- Stats band (mockup 2 layout: cutout image + 4 tiles) ---------- */
/*
 * Live values are truthful and modest by design (ACL s18 — no invented user
 * counts or ratings). Both mockups' aspirational numbers are kept here,
 * commented out, for when they become true.
 *
 * Both contested figures are DERIVED, not hardcoded, so they can't drift
 * out of sync with the sections they describe again:
 * - The subjects stat reads `subjectGrid.tiles` directly (this file's own
 *   single source for Explore Subjects) instead of asserting a flat "8" —
 *   it previously claimed "8 Subjects" while the grid immediately below
 *   showed 5 of 8 as "Coming soon", a direct on-page contradiction.
 * - "Original Questions" is intentionally left as `null` here, NOT
 *   read from `@/content/questions/question-bank` — that module carries
 *   answer keys and is eslint-restricted from any file client components
 *   also import (this one is: SiteNav/Faq/SocialProof are "use client").
 *   StatsBand.tsx (a server component) fills the real value in at render
 *   time via the sanctioned server-only gateway
 *   (src/server/exam-bank.ts's getPublishedQuestionCount(), the governed,
 *   test-pinned curated bank — determinism tests currently pin it at
 *   exactly 100). The much larger interactive practice pool
 *   (practiceExamBank, 1200+ questions incl. auto-generated seeds) is
 *   real too, but isn't the number this codebase itself calls
 *   "published" — using it here would trade one overclaim for a
 *   differently-shaped one.
 */
const liveSubjectCount = subjectGrid.tiles.filter((tile) => !tile.comingSoon).length;
const totalSubjectCount = subjectGrid.tiles.length;

// Aspirational (DO NOT ship live yet — not true today):
//   mockup 1: "80,000+ Active Students" / "14,000+ Practice Tests Completed" / "95% Parents Satisfied" / "4.9/5 Average Rating"
//   mockup 2: "10,000+ Happy Students" / "80,000+ Practice Questions" / "95% Parent Satisfaction" / "50+ Subjects & Skills"
export const statsBand = {
  eyebrow: "Why parents trust MindMosaic",
  heading: "MindMosaic in numbers",
  image: {
    src: "/landing/stats-band/cutout-boy-purple-hoodie-tablet.webp",
    width: 627,
    height: 627,
    alt: "",
  },
  stats: [
    { icon: "/landing/stat-icon/stat-icon-clipboard-light.webp", value: null as string | null, label: "Original Questions", isPlaceholder: false },
    { icon: "/landing/stat-icon/stat-icon-gradcap-light.webp", value: `${liveSubjectCount}/${totalSubjectCount}` as string | null, label: "Subjects Live Today", isPlaceholder: false },
    { icon: "/landing/stat-icon/stat-icon-students-light.webp", value: "2" as string | null, label: "Year Levels (G3 & G5)", isPlaceholder: false },
    { icon: "/landing/stat-icon/stat-icon-star-light.webp", value: "✓" as string | null, label: "Australian Curriculum Aligned", isPlaceholder: false },
  ],
  iconSize: { width: 627, height: 627 },
} as const;

/* ---------- How MindMosaic Works (mockup 1, text-first) ---------- */

export const howItWorks = {
  heading: ["How ", "MindMosaic", " Works"],
  steps: [
    { number: 1, dot: "brand", icon: "GraduationCap", title: "Choose a Subject", body: "Pick a subject and year level to get started." },
    { number: 2, dot: "accent", icon: "FileText", title: "Take a Practice Test", body: "Multi-format questions designed for exam success." },
    { number: 3, dot: "royal-orange", icon: "BarChart3", title: "Get Instant Feedback", body: "See your results and learn from detailed explanations." },
    { number: 4, dot: "success", icon: "Target", title: "Track Your Growth", body: "Monitor progress and build confidence over time." },
  ],
  cta: { label: "Start free today", href: "/practice" },
} as const;

/* ---------- Learning insights (image left, copy right) ---------- */
/*
 * Was two sections — "Learning that fits every student" and "Insights
 * that help every child grow" — that competed for the same message in
 * the same scroll (both pitched "parent value" back to back). Merged
 * into one: the stronger, more specific copy ("Insights..." heading, the
 * concrete dashboard body line, the 3 clear bullets) plus the stronger
 * imagery treatment (floating illustrative mini-cards over the photo,
 * previously only on the removed section) survive; the vaguer headline
 * ("Learning that fits every student"), its filler body line, and its
 * redundant /practice CTA (already the destination of both hero CTAs and
 * the How It Works CTA) do not. One CTA now, and it's a genuinely
 * different next step (a parent account) rather than another /practice
 * repeat.
 *
 * insights-parent-child.webp (per the design brief) doesn't exist in
 * public/landing — reuses the existing parents-mum-boy-laptop.webp, which
 * already shows the same parent-and-child-at-a-laptop moment, rather than
 * dropping to a blank ImageSlot for a working image. See the build report.
 */
export const forParents = {
  eyebrow: "For Parents",
  heading: "Insights that help every child grow",
  body: "MindMosaic's parent dashboard shows more than a mark — it shows what to practise next.",
  points: [
    { icon: "LayoutDashboard", text: "Parent dashboard — every child's activity in one place, under one family account" },
    { icon: "Puzzle", text: "Strengths & gaps — skill-by-skill breakdowns, not just a subject score" },
    { icon: "ListChecks", text: "Learning plan — a clear next-step recommendation after every session" },
  ],
  cta: { label: "Create a free parent account", href: "/sign-up" },
  image: {
    src: "/landing/for-parents/parents-mum-boy-laptop.webp",
    width: 724,
    height: 483,
    alt: "A parent and child looking at a laptop together",
  },
  /** Pure HTML/CSS floating mini-cards — text-first, no image assets. */
  miniCards: [
    { kind: "progress" as const, label: "Weekly Goal", value: "4 / 5 Tests", fraction: 0.8 },
    { kind: "badge" as const, label: "Strong in Math", value: "Keep it up!", icon: "Trophy" },
    { kind: "progress" as const, label: "Reading Score", value: "85%", fraction: 0.85 },
  ],
} as const;

/* ---------- Pricing preview ---------- */
/*
 * Free practice is real and live today. The Family tier's price AND its
 * availability copy are imported directly from src/lib/billing/prices.ts —
 * the same source /billing uses — so this preview can never drift from
 * the real price or independently claim a different "purchasable vs.
 * roadmap" state than /billing does. See prices.ts's FAMILY_PLAN_AVAILABILITY
 * doc comment for what "purchasable" means and why it's a maintained
 * literal rather than a live env-var probe.
 */
const familyPlanCta =
  FAMILY_PLAN_AVAILABILITY === "purchasable"
    ? { label: `Subscribe to ${FAMILY_PLAN.name}`, href: "/billing" }
    : { label: "Join waitlist", href: "/sign-up" };
const familyPlanBadge = FAMILY_PLAN_AVAILABILITY === "purchasable" ? "Most families" : "Coming soon";

export const pricing = {
  heading: "Simple, honest pricing",
  subheading:
    "MindMosaic is free to use today. We'll announce paid plans here before they ever launch — guest practice is never gated behind a subscription.",
  plans: [
    {
      name: "Free",
      price: "$0",
      cadence: "forever",
      description: "Everything you need to start practising today.",
      features: [
        "Unlimited guest practice — no account required",
        "NAPLAN-style and ICAS-style questions",
        "Instant scoring and worked solutions",
        "A free parent account to track one child's progress",
      ],
      cta: { label: "Start free", href: "/practice" },
      highlighted: false,
      badge: undefined as string | undefined,
    },
    {
      name: "Family",
      price: FAMILY_PLAN.monthly.display,
      cadence: FAMILY_PLAN.monthly.period.replace(/^\//, "") as string | undefined,
      description: "Multi-child tracking, deeper analytics, and priority support.",
      features: [
        `Up to ${FAMILY_PLAN.maxChildren} children under one family account`,
        "Skill-by-skill breakdowns and progress history",
        "Priority support",
      ],
      cta: familyPlanCta,
      highlighted: true,
      badge: familyPlanBadge as string | undefined,
    },
  ],
  disclaimer:
    FAMILY_PLAN_AVAILABILITY === "purchasable"
      ? "No credit card required to practise — guest practice is always free. See our Terms of Service for full billing details."
      : "No credit card required to practise. See our Terms of Service for how billing will work once it launches.",
  priceNote: PRICE_DISCLAIMER,
  cancelNote: "Cancel anytime. No lock-in contracts.",
} as const;

/* ---------- FAQ ---------- */

export const faq = {
  heading: "Frequently asked questions",
  subheading: "Can't find what you're looking for? Email hello@mindmosaic.app.",
  items: [
    {
      question: "Is MindMosaic affiliated with NAPLAN or ICAS?",
      answer:
        "No. \"NAPLAN-style\" and \"ICAS-style\" describe the format of our original practice content only. MindMosaic is not affiliated with, endorsed by, or administered by ACARA (which administers NAPLAN) or the owner of the ICAS trademark. Every question is created originally for MindMosaic.",
    },
    {
      question: "Do I need an account to practise?",
      answer:
        "No — you can use the practice exam engine as a guest, with no sign-in at all. Nothing about a guest session is stored on our servers; it exists only in your browser for that session.",
    },
    {
      question: "What year levels does MindMosaic support?",
      answer: "MindMosaic currently supports Year 3 and Year 5, across Numeracy, Reading, Conventions of Language, and ICAS-style subjects.",
    },
    {
      question: "How does my child sign in?",
      answer:
        "A parent creates a student account and receives a short login code and a PIN. The child signs in with that code and PIN — never a real email address.",
    },
    {
      question: "Is MindMosaic free?",
      answer: "Yes — MindMosaic is free to use today. We don't process payments yet, and guest practice will never be gated behind a subscription.",
    },
    {
      question: "How is my child's data protected?",
      answer:
        "Access to stored data is enforced at the database level (row-level security), so one family's data can't be shown to another. See our Privacy Policy for the full detail.",
    },
  ],
} as const;

/* ---------- Educators carousel — flagged, disabled by default ---------- */
/*
 * `brand/images/asset-map.json` marks these portraits "flagged": real
 * people's faces, no consent/attribution on file. DO NOT set `enabled:
 * true` until every person below is a real, named, consenting MindMosaic
 * educator — swapping this flag is meant to be the ONLY step, so the
 * carousel is built pixel-per-mockup-1 now, wired to placeholder names.
 */
export const educators = {
  enabled: false,
  heading: ["Learn from the ", "Best"],
  subheading: "Expert educators passionate about student success",
  people: [
    { name: "Placeholder — Head of Mathematics", role: "Head of Mathematics", image: "/landing/people/educator-man-navy-beard.webp" },
    { name: "Placeholder — English Specialist", role: "English Specialist", image: "/landing/people/educator-woman-beige-blazer.webp" },
    { name: "Placeholder — Science Educator", role: "Science Educator", image: "/landing/people/educator-man-navy.webp" },
    { name: "Placeholder — Learning Coach", role: "Learning Coach", image: "/landing/people/educator-woman-blazer-2.webp" },
    { name: "Placeholder — Exam Strategist", role: "Exam Strategist", image: "/landing/people/educator-man-suit.webp" },
  ],
  imageSize: { width: 627, height: 627 },
} as const;

/* ---------- Testimonials — flagged, disabled by default ---------- */
/*
 * `enabled` is a tri-state: false (hidden, default), "placeholder" (visible
 * with AvatarInitial instead of a real photo and quotes clearly labelled
 * illustrative — safe to demo internally), or true (real, consented
 * reviews — not yet available). DO NOT set to `true` until every quote
 * below is replaced with a real, attributable review.
 */
/**
 * Two parent testimonials (this section's "trust & social proof" pairing
 * with statsBand — see `sections` above) — testimonial-1.png/testimonial-2.png
 * named in the design brief don't exist under public/ or brand/images, so
 * avatars stay on the existing ImageSlot/AvatarInitial placeholder path.
 * `enabled` stays `false` until these are real, consented reviews — see the
 * tri-state note above.
 */
export const testimonials = {
  enabled: false as false | "placeholder" | true,
  heading: "What Parents Say",
  subheading: "Real stories from our learning community.",
  disclaimer: "Illustrative placeholders — not real reviews.",
  items: [
    { quote: "MindMosaic has helped my son improve his maths confidence so much. The reports are detailed and easy to understand.", name: "Placeholder — Sarah W.", role: "Parent", avatar: "/landing/people/avatar-woman-circle.webp" },
    { quote: "My daughter looks forward to her practice sessions now — the instant feedback makes all the difference.", name: "Placeholder — David N.", role: "Parent", avatar: "/landing/people/avatar-man-cutout.webp" },
  ],
  avatarSize: { width: 627, height: 627 },
} as const;

/* ---------- Feature strip (mockup 1, text-first) ---------- */

export const featureStrip = {
  items: [
    { icon: "Lock", title: "Safe & Secure", body: "Your data is protected" },
    { icon: "Monitor", title: "Learn Anywhere", body: "Study on any device" },
    { icon: "BookOpenCheck", title: "Curriculum Aligned", body: "Based on Australian standards" },
    { icon: "Smile", title: "Designed for Kids", body: "Engaging and age-appropriate" },
  ],
} as const;

/* ---------- Footer ---------- */
/*
 * Real routes only, zero dead links — see the build report for the columns
 * mockup 1 shows that were dropped or renamed here (Blog, Study Guides,
 * Help Centre, Careers, About Us, For Schools have no real page yet).
 */
export const footer = {
  tagline: "Smart practice today, bright futures tomorrow.",
  columns: [
    {
      title: "Platform",
      links: [
        { label: "Practice Tests", href: "/practice" },
        { label: "Log In", href: "/sign-in" },
        { label: "Sign Up", href: "/sign-up" },
      ],
    },
    {
      title: "For Families",
      links: [
        { label: "Parent Dashboard", href: "/parent" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Use", href: "/terms" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Accessibility", href: "/accessibility" },
        { label: "Contact", href: "mailto:hello@mindmosaic.app" },
      ],
    },
  ],
  /*
   * There was a functioning-looking email input here that never sent
   * anywhere — the input's value was never read, only a fake "Thanks!"
   * message shown on submit. A form that silently discards an email
   * address a parent typed in good faith is worse than no form, so it's
   * gone; this is now a plain, honest status line instead.
   */
  newsletter: {
    heading: "Stay in the loop",
    body: "Email updates aren't live yet — check back soon.",
  },
  /** Rendered as visibly disabled icons — never real links — until real accounts exist. */
  socials: [
    { icon: "Facebook", label: "Facebook" },
    { icon: "Instagram", label: "Instagram" },
    { icon: "Youtube", label: "YouTube" },
    { icon: "Linkedin", label: "LinkedIn" },
  ],
  copyright: "© 2026 MindMosaic. All rights reserved.",
  disclaimer:
    "MindMosaic is an independent practice platform and is not affiliated with or endorsed by ACARA (NAPLAN) or ICAS Assessments.",
} as const;
