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

export type SectionKey =
  | "hero"
  | "trustStrip"
  | "whyLove"
  | "subjectCards"
  | "subjectGrid"
  | "statsBand"
  | "howItWorks"
  | "fitsEveryStudent"
  | "forParents"
  | "educators"
  | "testimonials"
  | "featureStrip"
  | "footer";

/**
 * Page composition: order AND visibility in one place. `src/app/page.tsx`
 * maps over this array — adding, removing, reordering, or toggling a
 * section is a config edit only.
 */
export const sections: { key: SectionKey; enabled: boolean }[] = [
  { key: "hero", enabled: true },
  { key: "trustStrip", enabled: true },
  { key: "whyLove", enabled: true },
  { key: "subjectCards", enabled: true },
  { key: "subjectGrid", enabled: true },
  { key: "statsBand", enabled: true },
  { key: "howItWorks", enabled: true },
  { key: "fitsEveryStudent", enabled: true },
  { key: "forParents", enabled: true },
  { key: "educators", enabled: false },
  { key: "testimonials", enabled: false },
  { key: "featureStrip", enabled: true },
  { key: "footer", enabled: true },
];

export const nav = {
  links: [
    { label: "Practice", href: "/practice" },
    { label: "Courses", href: "/practice" },
    { label: "Plans", href: "#plans" },
    { label: "Resources", href: "#faq" },
    { label: "About", href: "#about" },
  ],
  signIn: { label: "Log in", href: "/sign-in" },
  cta: { label: "Get Started", href: "/practice" },
} as const;

/* ---------- Hero ---------- */

export const hero = {
  headlineLines: [
    { text: "Smart Practice", tone: "ink" as const },
    { text: "Bright Futures", tone: "brand" as const },
  ],
  subheadline:
    "Interactive practice for NAPLAN, ICAS & school success. Built for Australian students from Year 3 to Year 5.",
  primaryCta: { label: "Start Free Practice", href: "/practice" },
  secondaryCta: { label: "Explore Courses", href: "/practice" },
  trustChips: [
    { icon: "BookOpenCheck", label: "Curriculum Aligned" },
    { icon: "Zap", label: "Instant Feedback" },
    { icon: "TrendingUp", label: "Track Progress" },
    { icon: "Heart", label: "Trusted by Parents" },
  ],
  image: {
    src: "/landing/hero/hero-girl-laptop-chips-landscape.webp",
    width: 724,
    height: 483,
    alt: "A student smiling while practising on a laptop at her desk",
  },
  /**
   * Mockup 2's floating "Overall Progress 78%" / "Accuracy 85%" cards,
   * layered onto mockup 1's hero photo. Rendered as real HTML/CSS (matching
   * the "Weekly Goal" / "Reading Score" mini-cards in the lavender band)
   * rather than baked-text images, so it's illustrative UI, not real
   * outcome data or a claim about any individual student's results.
   */
  floatingChips: {
    enabled: true,
    chips: [
      { label: "Overall Progress", value: "78%", fraction: 0.78 },
      { label: "Accuracy", value: "85%", fraction: 0.85 },
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
export const trustStrip = {
  heading: "Helping Australian students learn and grow",
  badges: [
    "Australian Curriculum Aligned",
    "NAPLAN-style Practice",
    "ICAS-style Practice",
    "Curriculum Referenced",
    "Trusted by Families",
  ],
} as const;

/* ---------- Why Students Love MindMosaic (mockup 2) ---------- */

export const whyLove = {
  heading: "Why Students Love MindMosaic",
  subheading: "Everything they need to improve, in one beautiful platform.",
  cards: [
    {
      icon: "/landing/feature-icon/feature-icon-target-purple.webp",
      title: "Exam-Style Practice",
      body: "Real NAPLAN-style and ICAS-style questions to build exam confidence.",
    },
    {
      icon: "/landing/feature-icon/feature-icon-chart-pink.webp",
      title: "Smart Analytics",
      body: "Detailed reports help students and parents track strengths and growth.",
    },
    {
      icon: "/landing/feature-icon/feature-icon-gradcap-green.webp",
      title: "Curriculum Aligned",
      body: "Mapped to the Australian curriculum for every year level.",
    },
    {
      icon: "/landing/feature-icon/feature-icon-trophy-yellow.webp",
      title: "Boosts Confidence",
      body: "Practice that meets kids where they are and helps them grow, one session at a time.",
    },
    {
      icon: "/landing/feature-icon/feature-icon-shield-blue.webp",
      title: "Safe & Child-Friendly",
      body: "A secure, ad-free environment made just for students.",
    },
  ],
  iconSize: { width: 627, height: 627 },
} as const;

/* ---------- Popular Practice by Subject (mockup 1, 6 photo cards) ---------- */
/*
 * The 6 cards are the platform's real subject scope: the 5 live subjects
 * (matching src/features/landing content elsewhere) plus ICAS Science,
 * which is genuinely in development — shown, not linked. Nothing here is
 * invented to fill a slot. Photo choices (of the owner's ~14-image
 * subject-card set) are recorded per card below and in the build report.
 */
export const subjectCards = {
  heading: "Popular Practice by Subject",
  subheading: "Explore our most loved practice tests and courses",
  yearsLine: "Year 3 – Year 5",
  viewAllCta: { label: "View All Subjects", href: "/practice" },
  cards: [
    {
      name: "Numeracy",
      icon: "Calculator",
      image: { src: "/landing/subject-card/card-boy-writing-closeup.webp", width: 724, height: 483 },
      href: "/practice",
      comingSoon: false,
    },
    {
      name: "Reading",
      icon: "BookOpen",
      image: { src: "/landing/subject-card/card-girl-reading-book.webp", width: 724, height: 483 },
      href: "/practice",
      comingSoon: false,
    },
    {
      name: "Conventions of Language",
      icon: "PenLine",
      image: { src: "/landing/subject-card/card-girl-writing-classroom.webp", width: 724, height: 483 },
      href: "/practice",
      comingSoon: false,
    },
    {
      name: "ICAS Mathematics",
      icon: "Sigma",
      image: { src: "/landing/subject-card/card-boy-glasses-writing.webp", width: 724, height: 483 },
      href: "/practice",
      comingSoon: false,
    },
    {
      name: "ICAS Science",
      icon: "FlaskConical",
      image: { src: "/landing/subject-card/card-boy-science-goggles.webp", width: 724, height: 483 },
      href: "/practice",
      comingSoon: true,
    },
    {
      name: "ICAS English",
      icon: "Languages",
      image: { src: "/landing/subject-card/card-girl-headphones-tablet.webp", width: 724, height: 483 },
      href: "/practice",
      comingSoon: false,
    },
  ],
} as const;

/* ---------- Explore Subjects icon grid (mockup 2) ---------- */
/*
 * The same real live/coming-soon scope as `subjectCards`, in the icon-tile
 * treatment. "More Subjects" is a truthful catch-all for subjects still in
 * development (incl. NAPLAN-style Writing) rather than a fabricated 8th
 * subject.
 */
export const subjectGrid = {
  heading: "Explore Subjects",
  subheading: "Comprehensive practice across key learning areas",
  gradesLine: "Years 3 & 5",
  tiles: [
    { name: "Numeracy", image: "/landing/subject-icon/icon-numeracy-calculator.webp", icon: undefined, tone: "brand", comingSoon: false },
    { name: "Reading", image: "/landing/subject-icon/icon-reading-book.webp", icon: undefined, tone: "accent", comingSoon: false },
    { name: "Conventions of Language", image: "/landing/subject-icon/icon-writing-pencil.webp", icon: undefined, tone: "royal-orange", comingSoon: false },
    { name: "ICAS Mathematics", image: undefined, icon: "Sigma", tone: "brand-bright", comingSoon: false },
    { name: "ICAS English", image: undefined, icon: "Languages", tone: "success", comingSoon: false },
    { name: "ICAS Science", image: "/landing/subject-icon/icon-science-flask.webp", icon: undefined, tone: "accent", comingSoon: true },
    { name: "Digital Technologies", image: "/landing/subject-icon/icon-digitech-computer.webp", icon: undefined, tone: "brand", comingSoon: true },
    { name: "More Subjects", image: undefined, icon: "Sparkles", tone: "brand-ink", comingSoon: true },
  ],
  iconSize: { width: 627, height: 627 },
  /** Second-row visual rhythm using the illustrated tile set — decorative, alongside the same names already in `tiles` above. */
  illustratedRow: [
    { name: "Numeracy", image: "/landing/subject-tile/tile-illustrated-numeracy-girl.webp" },
    { name: "Reading", image: "/landing/subject-tile/tile-illustrated-reading-girl.webp" },
    { name: "Conventions of Language", image: "/landing/subject-tile/tile-illustrated-writing-girl.webp" },
    { name: "ICAS Science", image: "/landing/subject-tile/tile-illustrated-science-girl.webp" },
    { name: "Digital Technologies", image: "/landing/subject-tile/tile-illustrated-digitech-girl.webp" },
  ],
  illustratedSize: { width: 724, height: 483 },
} as const;

/* ---------- Stats band (mockup 2 layout: cutout image + 4 tiles) ---------- */
/*
 * Live values are truthful and modest by design (ACL s18 — no invented user
 * counts or ratings). Both mockups' aspirational numbers are kept here,
 * commented out, for when they become true.
 */
// Aspirational (DO NOT ship live yet — not true today):
//   mockup 1: "80,000+ Active Students" / "14,000+ Practice Tests Completed" / "95% Parents Satisfied" / "4.9/5 Average Rating"
//   mockup 2: "10,000+ Happy Students" / "80,000+ Practice Questions" / "95% Parent Satisfaction" / "50+ Subjects & Skills"
export const statsBand = {
  image: {
    src: "/landing/stats-band/cutout-boy-purple-hoodie-tablet.webp",
    width: 627,
    height: 627,
    alt: "",
  },
  stats: [
    { icon: "/landing/stat-icon/stat-icon-clipboard-light.webp", value: "300+", label: "Original practice questions", isPlaceholder: false },
    { icon: "/landing/stat-icon/stat-icon-gradcap-light.webp", value: "8", label: "Subject areas", isPlaceholder: false },
    { icon: "/landing/stat-icon/stat-icon-students-light.webp", value: "2", label: "Year levels", isPlaceholder: false },
    { icon: "/landing/stat-icon/stat-icon-star-light.webp", value: "100%", label: "Original content", isPlaceholder: false },
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
  cta: { label: "Explore Practice Tests", href: "/practice" },
} as const;

/* ---------- Learning that fits every student (blend band) ---------- */

export const fitsEveryStudent = {
  headlineLines: [
    { text: "Learning that fits ", tone: "ink" as const },
    { text: "every student", tone: "brand" as const },
  ],
  body: "Engaging content, fun for kids and peace of mind for parents.",
  cta: { label: "Get Started Free", href: "/practice" },
  image: {
    src: "/landing/fits-every-student/banner-boy-headphones-laptop.webp",
    width: 768,
    height: 768,
    alt: "A student wearing headphones, practising happily on a laptop",
  },
  /** Pure HTML/CSS floating mini-cards — text-first, no image assets. */
  miniCards: [
    { kind: "progress" as const, label: "Weekly Goal", value: "4 / 5 Tests", fraction: 0.8 },
    { kind: "badge" as const, label: "Strong in Math", value: "Keep it up!", icon: "Trophy" },
    { kind: "progress" as const, label: "Reading Score", value: "85%", fraction: 0.85 },
  ],
} as const;

/* ---------- For Parents ---------- */

export const forParents = {
  eyebrow: "For Parents",
  heading: "See the skill behind every score",
  body: "MindMosaic's parent dashboard shows more than a mark — it shows what to practise next.",
  points: [
    { icon: "Users", text: "Separate profiles for every child, all under one family account" },
    { icon: "Puzzle", text: "Skill-by-skill breakdowns, not just a subject score" },
    { icon: "History", text: "Full session history, so you can see consistency over weeks" },
  ],
  cta: { label: "Create a Family Account", href: "/sign-up" },
  image: {
    src: "/landing/for-parents/parents-mum-boy-laptop.webp",
    width: 724,
    height: 483,
    alt: "A parent and child looking at a laptop together",
  },
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
export const testimonials = {
  enabled: false as false | "placeholder" | true,
  heading: "What Parents & Students Say",
  subheading: "Real stories from our learning community.",
  disclaimer: "Illustrative placeholders — not real reviews.",
  items: [
    { quote: "MindMosaic has helped my son improve his maths confidence so much. The reports are detailed and easy to understand.", name: "Placeholder — Sarah W.", role: "Parent", avatar: "/landing/people/avatar-woman-circle.webp" },
    { quote: "The questions are challenging and fun! I love seeing my progress go up every week.", name: "Placeholder — Ethan K.", role: "Year 5 Student", avatar: "/landing/people/avatar-boy-navy-polo.webp" },
    { quote: "As a teacher, I recommend MindMosaic to all my students. It's the perfect extra practice tool.", name: "Placeholder — Mrs Patel", role: "Teacher", avatar: "/landing/people/avatar-woman-cardigan.webp" },
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
        { label: "Terms of Service", href: "/terms" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Accessibility", href: "/accessibility" },
        { label: "Contact Us", href: "mailto:hello@mindmosaic.app" },
      ],
    },
  ],
  newsletter: {
    heading: "Stay in the loop",
    body: "Get the latest tips and updates.",
    placeholder: "Enter your email",
    /** Real submit is not wired yet — the form shows an inline "coming soon" confirmation instead of sending anywhere. */
    comingSoonMessage: "Thanks! Email updates are coming soon — we'll be in touch.",
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
