/**
 * All landing-page copy, imagery references and structured content, typed
 * and centralised so the page's composition, copy, programme data, links
 * and image choices are a config edit — never a component edit. `sections`
 * controls both order and visibility; `src/app/page.tsx` renders whatever
 * it says.
 *
 * Source of truth for this rebuild: the approved design-canvas file
 * "MindMosaic Landing.dc.html" in the claude.ai/design project "Wordmark UI
 * mockups" (ab404f55-b4af-402e-b27a-bbda4550c235). Copy is reproduced from
 * that file; where it referenced a route this app does not have, the href
 * is remapped to the real one (see `routes` below) rather than shipping a
 * dead link.
 *
 * Two deliberate deviations from the design file, both because the design
 * canvas has no access to this repo's sources of truth:
 *
 *  1. "Start free" points at /sign-up, as the design intends, now that
 *     public sign-up is open (src/features/auth/signup-policy.ts). It did
 *     not while sign-up was closed — a CTA to a form that cannot succeed
 *     is worse than no CTA. `routes.guestPractice` is kept separate and is
 *     what every "Explore practice" secondary CTA uses, because practice
 *     genuinely needs no account and that promise is worth keeping
 *     distinct from "create one".
 *  2. The Plans section keeps the real Family price and availability from
 *     src/lib/billing/prices.ts instead of the design's "price to be
 *     confirmed" chip. Family is genuinely purchasable today; replacing a
 *     live price with a placeholder would be a regression, not fidelity.
 */

import { FAMILY_PLAN, FAMILY_PLAN_AVAILABILITY, PRICE_DISCLAIMER } from "@/lib/billing/prices";

/**
 * The one real support address — every page that mentions it (FAQ, footer,
 * the /contact page, legal pages) reads from here so it can't drift into
 * an invented or inconsistent address.
 */
export const SUPPORT_EMAIL = "hello@mindmosaic.app";

export type SectionKey =
  | "hero"
  | "credibility"
  | "programmes"
  | "howItWorks"
  | "tutorials"
  | "showcase"
  | "questionTypes"
  | "learningHub"
  | "forParents"
  | "quality"
  | "audiences"
  | "plans"
  | "evidence"
  | "resources"
  | "faq"
  | "closing"
  | "footer";

/**
 * Page composition: order AND visibility in one place. Matches the design
 * file's own section order, top to bottom.
 */
export const sections: { key: SectionKey; enabled: boolean }[] = [
  { key: "hero", enabled: true },
  { key: "credibility", enabled: true },
  { key: "programmes", enabled: true },
  { key: "howItWorks", enabled: true },
  { key: "tutorials", enabled: true },
  { key: "showcase", enabled: true },
  { key: "questionTypes", enabled: true },
  { key: "learningHub", enabled: true },
  { key: "forParents", enabled: true },
  { key: "quality", enabled: true },
  { key: "audiences", enabled: true },
  { key: "plans", enabled: true },
  { key: "evidence", enabled: true },
  { key: "resources", enabled: true },
  { key: "faq", enabled: true },
  { key: "closing", enabled: true },
  { key: "footer", enabled: true },
];

/* ---------- Shared route map ---------- */

/**
 * The design file's hrefs, resolved to routes that actually exist here.
 * Every landing link goes through this map, so a route rename is one edit
 * and a typo can't ship as a 404.
 *
 * /learn, /assessments, /exam-preparation, /methodology, /pricing,
 * /resources and /about are real pages in this app
 * (src/app/<route>/page.tsx).
 */
export const routes = {
  learn: "/learn",
  practice: "/assessments",
  examPrep: "/exam-preparation",
  methodology: "/methodology",
  pricing: "/pricing",
  resources: "/resources",
  help: "/help",
  about: "/about",
  contact: "/contact",
  accessibility: "/accessibility",
  privacy: "/privacy",
  terms: "/terms",
  disclaimer: "/assessment-disclaimer",
  /** Account creation — the design's "Start free". */
  startFree: "/sign-up",
  /**
   * Guest practice: free, ungated and genuinely account-free. Kept as its
   * own entry so a future change to what "start free" means can never
   * silently move the one CTA that promises no sign-in.
   */
  guestPractice: "/practice",
  signIn: "/sign-in",
  parentGuide: "/parent-guide",
  studentTips: "/student-tips",
} as const;

/* ---------- Header ---------- */

export const nav = {
  links: [
    { label: "Learn", href: routes.learn },
    { label: "Practice", href: routes.practice },
    { label: "Exam Preparation", href: routes.examPrep },
    { label: "How It Works", href: routes.methodology },
    { label: "Plans", href: routes.pricing },
    { label: "Resources", href: routes.resources },
    { label: "About", href: routes.about },
  ],
  signIn: { label: "Log in", href: routes.signIn },
  cta: { label: "Start free", href: routes.startFree },
  /**
   * Shown instead of signIn/cta once there is a session. The href isn't
   * here on purpose: it comes from the session's role via
   * roleHomePath()/roleHomeLabel() (src/features/auth/roles.ts) so this
   * file never gets its own copy of the role -> home-route mapping.
   */
  signedIn: { signOutLabel: "Sign out" },
} as const;

/* ---------- Hero ---------- */

export const hero = {
  eyebrow: "Learning and assessment preparation for Australian students",
  headlineLines: [
    { text: "Learn with purpose.", tone: "ink" as const },
    { text: "Practise with confidence.", tone: "ink" as const },
    { text: "Be ready for every challenge.", tone: "brand" as const },
  ],
  subheadline:
    "Curriculum learning, focused practice and realistic exam preparation for Australian students—from foundational skills to NAPLAN-, ICAS-, AMC- and selective-entry-style challenges.",
  primaryCta: { label: "Start free", href: routes.startFree },
  secondaryCta: { label: "Explore practice", href: routes.practice },
  points: [
    { label: "100% original questions", tone: "brand" as const },
    { label: "Made for Australian learners", tone: "coral" as const },
    { label: "Practice and exam-style modes", tone: "lilac" as const },
    { label: "Clear progress for families", tone: "brand" as const },
  ],
  /**
   * The learner portrait the design file has dropped into its
   * `mm-hero-learner` slot, recovered from that file's
   * .image-slots.state.json sidecar. The design crops it left-of-centre
   * (`x: -42%` in the sidecar) so the figure sits to the right of the
   * frame; `objectPosition` reproduces that crop.
   */
  image: {
    src: "/landing/hero/hero-learner-desk.webp",
    width: 1200,
    height: 746,
    objectPosition: "78% 50%",
    alt: "A student smiling at her desk while writing in a notebook beside a laptop",
  },
  /**
   * The 8-tile mosaic rule under the photo — decorative only. An even
   * brand/lilac/coral repeat: the near-white `quiet` tiles read as gaps in
   * the rule rather than as part of it, so the hero uses solid tones only.
   */
  tiles: ["brand", "lilac", "coral", "brand", "lilac", "coral", "brand", "lilac"] as const,
} as const;

/* ---------- Credibility band ---------- */

export const credibility = {
  heading: "One platform for learning, practice and exam preparation",
  cards: [
    { title: "Primary & secondary", body: "Year levels shown per programme, never assumed.", tone: "light" as const },
    { title: "Curriculum learning", body: "Structured pathways, explanations and worked examples.", tone: "light" as const },
    { title: "Focused practice", body: "By year, subject or single skill, with feedback.", tone: "light" as const },
    { title: "Exam simulations", body: "Full-length, assessment-format practice sessions.", tone: "light" as const },
    { title: "100% original", body: "Written for Australian learners, in Australian English.", tone: "brand" as const },
  ],
  disclaimer:
    "MindMosaic is an independent learning platform. Its assessment-style materials contain original questions and are not official examinations, past papers or endorsed preparation materials.",
  disclaimerLink: { label: "Assessment Disclaimer", href: routes.disclaimer },
} as const;

/* ---------- Programmes ---------- */

export type ProgrammeCategory = "Curriculum" | "Assessments" | "Competitions" | "Learning Hub";

/**
 * Whether a learner can be served this programme today.
 *
 * Audit finding C-01: every programme here declared `practice: "Available"`
 * and a year range up to Year 12, while the entire shipped question bank —
 * curated, published and practice alike — holds only Years 3 and 5 in
 * NAPLAN- and ICAS-style. Four of the seven programmes have no content at
 * all. `from`/`to` alone could not express that: the panel only warns when
 * the CHOSEN year falls outside a programme's declared range, so an
 * AMC-style programme declared Years 3-12 read as available at every year
 * in it.
 *
 * "in_development" is the honest state for a programme we intend to build
 * and have not built. It suppresses every availability affordance rather
 * than relying on copy alone — see components/Programmes.tsx.
 */
export type ProgrammeStatus = "available" | "in_development";

export type Programme = {
  id: string;
  name: string;
  category: ProgrammeCategory;
  /**
   * The span shown to a visitor. For an "in_development" programme this is
   * the planned scope, and the UI labels it as such rather than as
   * coverage.
   */
  from: number;
  to: number;
  /**
   * The year levels an "available" programme can ACTUALLY serve, when that
   * is not simply every year from `from` to `to`.
   *
   * NAPLAN-style and ICAS-style hold Years 3 and 5 — not Year 4. Capping
   * their ranges to 3-5 without this would have swapped one overstatement
   * for a smaller one, which is why the C-01 regression test asserts
   * against real coverage rather than against the range.
   */
  coveredYears?: readonly number[];
  tbc: string;
  status: ProgrammeStatus;
  blurb: string;
  subjects: readonly string[];
  practice: string;
  exam: string;
  cta: { label: string; href: string };
  /** Selective entry differs by jurisdiction, so it asks for a state. */
  needsRegion?: boolean;
};

/** Practice/exam cell text for a programme with nothing behind it yet. */
const IN_DEVELOPMENT = "In development";

export const programmes = {
  eyebrow: "Programmes",
  heading: "Choose a year level, then a pathway.",
  intro:
    "Programmes you can practise today list the year levels they currently cover. Programmes still being built are labelled in development, with their planned scope shown rather than implied as available.",
  yearLegend: "Choose year level",
  groups: [
    { id: "primary", label: "Primary · Years 1–6", years: [1, 2, 3, 4, 5, 6], defaultYear: 5 },
    { id: "secondary", label: "Secondary · Years 7–12", years: [7, 8, 9, 10, 11, 12], defaultYear: 7 },
  ],
  defaultYear: 5,
  categories: ["all", "Curriculum", "Assessments", "Competitions", "Learning Hub"],
  regions: [
    { id: "nsw", label: "NSW" },
    { id: "vic", label: "VIC" },
    { id: "qld", label: "QLD" },
    { id: "wa", label: "WA" },
    { id: "sa", label: "SA" },
    { id: "other", label: "Other" },
  ],
  regionHeading: "Choose state or territory",
  regionIntro:
    "Selective entry formats, eligible year levels and testing arrangements vary by jurisdiction.",
  regionNote: "Coverage and format for this jurisdiction are being confirmed.",
  regionNoteOther: "Coverage for other states and territories is being confirmed.",
  items: [
    {
      id: "australian-curriculum",
      name: "Australian Curriculum",
      category: "Curriculum",
      from: 1,
      to: 10,
      tbc: "Planned scope — no year level is live yet",
      status: "in_development",
      blurb:
        "Structured Australian Curriculum learning pathways: concept explanations, worked examples and skill lessons that build in sequence. Exact curriculum mapping is being confirmed.",
      subjects: ["Mathematics", "English", "Reading", "Writing", "Spelling & grammar"],
      practice: IN_DEVELOPMENT,
      exam: "Not applicable",
      cta: { label: "Explore learning", href: routes.learn },
    },
    {
      id: "singapore-maths",
      name: "Singapore Maths",
      category: "Curriculum",
      from: 1,
      to: 8,
      tbc: "Planned scope — no year level is live yet",
      status: "in_development",
      blurb:
        "A visual, model-based approach to number and problem solving, taught step by step and then practised. Runs alongside the curriculum pathway rather than replacing it.",
      subjects: ["Number", "Model drawing", "Problem solving", "Fractions", "Ratio"],
      practice: IN_DEVELOPMENT,
      exam: "Not applicable",
      cta: { label: "Explore learning", href: routes.learn },
    },
    {
      id: "naplan-style",
      name: "NAPLAN-style",
      category: "Assessments",
      /* Years 3 and 5 are the only NAPLAN-style years with a bank behind
         them. NAPLAN itself is sat in Years 3, 5, 7 and 9 (see
         features/taxonomy/year-registry.ts), so 7 and 9 are named as
         unconfirmed rather than silently included in the range. */
      from: 3,
      to: 5,
      coveredYears: [3, 5],
      tbc: "Years 7 and 9 to be confirmed",
      status: "available",
      blurb:
        "Assessment-format practice in the NAPLAN test areas, available as short exam-style sets or full-length simulations. Original questions only — not past papers.",
      subjects: ["Numeracy", "Reading", "Writing", "Language conventions"],
      practice: "Available",
      exam: "Full-length simulation",
      cta: { label: "Explore exam preparation", href: routes.examPrep },
    },
    {
      id: "icas-style",
      name: "ICAS-style",
      category: "Assessments",
      /* Same as NAPLAN-style: Years 3 and 5 are what the bank actually
         holds. ICAS runs Years 2-12, which is what "wider year coverage"
         refers to. */
      from: 3,
      to: 5,
      coveredYears: [3, 5],
      tbc: "Wider year coverage to be confirmed",
      status: "available",
      blurb:
        "Extension-style questions that reward close reading and unfamiliar problems, in the ICAS response formats.",
      subjects: ["Mathematics", "English", "Spelling"],
      practice: "Available",
      exam: "Short exam-style sets",
      cta: { label: "Explore exam preparation", href: routes.examPrep },
    },
    {
      id: "amc-style",
      name: "AMC-style",
      category: "Competitions",
      from: 3,
      to: 12,
      tbc: "Planned scope — no year level is live yet",
      status: "in_development",
      blurb:
        "Competition-style mathematics: multi-step reasoning, pattern spotting and problems designed to be worked rather than recalled.",
      subjects: ["Mathematics", "Problem solving", "Logic & reasoning"],
      practice: IN_DEVELOPMENT,
      exam: IN_DEVELOPMENT,
      cta: { label: "Explore exam preparation", href: routes.examPrep },
    },
    {
      id: "selective-entry-style",
      name: "Selective school entry-style",
      category: "Assessments",
      from: 5,
      to: 9,
      tbc: "Planned scope — no year level is live yet",
      status: "in_development",
      blurb:
        "Assessment-style practice in the formats used for selective and high-ability entry testing. Requirements differ between states and territories, so choose your jurisdiction.",
      subjects: ["Mathematical reasoning", "Reading", "Thinking skills", "Writing"],
      practice: IN_DEVELOPMENT,
      exam: IN_DEVELOPMENT,
      cta: { label: "Explore exam preparation", href: routes.examPrep },
      needsRegion: true,
    },
    {
      id: "learning-hub",
      name: "Learning Hub",
      category: "Learning Hub",
      /* Not one of the four programmes the remediation brief named, but the
         same defect: `hub.articles` are nine commissioned briefs, every one
         `status: "planned"`, and /resources says so at the top. Leaving this
         as the only programme still claiming coverage would have made the
         new status affordance read as an endorsement of it. */
      from: 1,
      to: 12,
      tbc: "Planned scope — the library is being written",
      status: "in_development",
      blurb:
        "Every explanation, worked example and skill lesson in one browsable library — by year, subject or skill — with related practice attached to each entry.",
      subjects: ["All subjects", "Explanations", "Worked examples", "Skill lessons"],
      practice: IN_DEVELOPMENT,
      exam: "Not applicable",
      cta: { label: "Explore learning", href: routes.learn },
    },
  ] as readonly Programme[],
  primaryCta: { label: "View practice options", href: routes.practice },
} as const;

/* ---------- How it works ---------- */

export const howItWorks = {
  eyebrow: "How it works",
  heading: "Learn it, practise it, then sit it under exam conditions.",
  intro:
    "Three connected stages. Students can enter at any of them, and move back to learning whenever a skill needs more work.",
  steps: [
    {
      number: 1,
      title: "Learn the concept",
      body: "Structured pathways explain the idea, then show worked examples step by step. The Learning Hub holds the same material to return to later.",
      demo: {
        kind: "lesson" as const,
        eyebrow: "Skill lesson",
        title: "Fractions on a number line",
        body: "Concept explanation, two worked examples, then five practice questions.",
      },
    },
    {
      number: 2,
      title: "Practise with feedback",
      body: "Choose practice by year, subject or single skill. After submitting, every question comes with a worked explanation, and anything can be retried or reviewed.",
      demo: {
        kind: "feedback" as const,
        title: "Not correct — let’s look again",
        body: "The line is divided into eighths, so each step is 1/8. Five steps from zero gives 5/8.",
      },
    },
    {
      number: 3,
      title: "Sit an exam simulation",
      body: "Full-length, assessment-format sessions with realistic instructions, section navigation, flag for review and a review-before-submit screen. Results and explanations follow submission.",
      demo: {
        kind: "exam" as const,
        section: "Section 2 of 3 · Numeracy",
        remaining: "18:24 remaining",
        answered: 14,
        total: 32,
        flagged: 2,
      },
    },
  ],
} as const;

/* ---------- What happens in a first week (How It Works) ---------- */

/*
 * The design's five-step list. Step 02's programme names are the design's;
 * only the Australian Curriculum and exam-style pathways have content
 * behind them today, which the step says rather than the page implying
 * otherwise elsewhere.
 */
export const firstWeek = {
  heading: "What happens in a first week",
  intro:
    "Setup takes a few minutes. The platform builds a skill picture from the first session onward.",
  slot: "Screenshot — parent view after one week of activity",
  steps: [
    {
      title: "A parent creates the account",
      body: "A student profile holds a first name and year level. No other personal detail is required to begin.",
    },
    {
      title: "Choose a programme",
      body: "An Australian Curriculum pathway or an exam-style programme. More than one can run at once; Singapore Maths is still being written.",
    },
    {
      title: "First learning session",
      body: "The platform starts at the year level chosen and adjusts as skills are demonstrated.",
    },
    {
      title: "First practice set",
      body: "Explanations appear immediately after each answer, so misconceptions are corrected in the session.",
    },
    {
      title: "The parent view fills in",
      body: "Sessions completed, skills developing well and skills needing support, each linked to the lesson that explains it.",
    },
  ],
} as const;

/* ---------- Video tutorials ---------- */

/*
 * Every poster frame here is deliberately an empty slot: no tutorial has
 * been recorded yet, and a stock photo dressed up as a video still would
 * imply content that does not exist. The design file's own slots are empty
 * for the same reason ("Videos to be supplied").
 */
export const tutorials = {
  eyebrow: "Video tutorials",
  heading: "See how MindMosaic works in a few minutes.",
  intro:
    "Short walkthroughs of the student experience, practice mode and the parent view. Videos to be supplied.",
  feature: {
    badge: "Placeholder — full platform tour",
    slot: "Main tutorial video — 16:9 poster frame to be supplied.",
  },
  items: [
    {
      title: "Practice mode, end to end",
      body: "Answer, explanation, retry and review. Duration to be confirmed.",
      slot: "Video thumbnail — practice mode",
    },
    {
      title: "Sitting an exam simulation",
      body: "Instructions, flagging, autosave and review before submit.",
      slot: "Video thumbnail — exam simulation",
    },
    {
      title: "Reading the parent view",
      body: "Skills developing, skills needing support and recent activity.",
      slot: "Video thumbnail — parent view",
    },
  ],
} as const;

/* ---------- Inside the platform (9 illustrative screens) ---------- */

export type ShowcaseScreen =
  | "home"
  | "hub"
  | "choose"
  | "practice"
  | "exam"
  | "feedback"
  | "results"
  | "progress"
  | "parent";

export const showcase = {
  eyebrow: "Inside the platform",
  heading: "Explore how the MindMosaic experience works.",
  intro:
    "Nine views, from the student home through to the parent report. Practice mode and exam simulation are deliberately different experiences — compare tabs four and five. All names, scores and dates shown are illustrative.",
  host: "app.mindmosaic.com.au",
  sidebar: ["Home", "Learning Hub", "Practice", "Exam preparation", "Progress", "Parent view"],
  screens: [
    { id: "home", label: "Student home", crumb: "/home", role: "Student", navIndex: 0, mode: "" },
    { id: "hub", label: "Learning Hub", crumb: "/learn", role: "Student", navIndex: 1, mode: "Learning" },
    { id: "choose", label: "Choose practice", crumb: "/assessments", role: "Student", navIndex: 2, mode: "Practice" },
    { id: "practice", label: "Practice mode", crumb: "/assessments/session", role: "Student", navIndex: 2, mode: "Practice" },
    { id: "exam", label: "Exam simulation", crumb: "/exam-preparation/session", role: "Student", navIndex: 3, mode: "Exam simulation" },
    { id: "feedback", label: "Answer feedback", crumb: "/assessments/session", role: "Student", navIndex: 2, mode: "Practice" },
    { id: "results", label: "Session results", crumb: "/assessments/results", role: "Student", navIndex: 2, mode: "Practice" },
    { id: "progress", label: "Progress insights", crumb: "/progress", role: "Student", navIndex: 4, mode: "" },
    { id: "parent", label: "Parent view", crumb: "/family", role: "Parent", navIndex: 5, mode: "" },
  ] as ReadonlyArray<{
    id: ShowcaseScreen;
    label: string;
    crumb: string;
    role: string;
    navIndex: number;
    mode: string;
  }>,
} as const;

/* ---------- Question types ---------- */

export const questionTypes = {
  eyebrow: "Question types",
  heading: "14 ways to respond—built for different kinds of thinking.",
  intro:
    "From quick selections and written responses to reading, diagrams and interactive tasks, MindMosaic supports 14 clear, age-appropriate question types across practice and exam-style modes.",
  families: [
    {
      id: "select",
      label: "Select",
      dot: "brand" as const,
      types: ["Multiple choice", "Multiple select", "Dropdown", "True or false"],
    },
    {
      id: "enter",
      label: "Enter",
      dot: "coral" as const,
      types: ["Number entry", "Fill in the blank", "Short answer", "Essay"],
    },
    {
      id: "arrange",
      label: "Arrange",
      dot: "mid" as const,
      types: ["Matching", "Ordering", "Drag and drop"],
    },
    {
      id: "explore",
      label: "Explore",
      dot: "ink" as const,
      types: ["Reading comprehension", "Label a diagram", "Hotspot"],
    },
  ],
  visualNote:
    "Charts, tables, number lines and diagrams are visual formats that can support any of these types—they are not separate types.",
  statesHeading: "States shown",
  statesNote:
    "Unanswered, selected, keyboard focus, submitted and feedback. Every state carries a label or glyph, never colour alone.",
} as const;

/* ---------- Learning Hub ---------- */

export const learningHub = {
  eyebrow: "Learning Hub",
  heading: "The explanations live next to the practice, not in a blog.",
  intro:
    "Everything a student learns is browsable and returnable. When a skill needs more work, progress links straight back to the lesson that explains it.",
  steps: [
    "Browse by year, subject or single skill",
    "Read the concept explanation",
    "Work through worked examples step by step",
    "Complete the related practice attached to the skill",
    "Return to any skill that still needs support",
  ],
  primaryCta: { label: "Explore learning", href: routes.learn },
  secondaryCta: { label: "Explore practice", href: routes.practice },
  image: {
    src: "/landing/subject-card/card-girl-reading-book.webp",
    width: 724,
    height: 483,
    alt: "A student reading independently",
  },
} as const;

/* ---------- For parents ---------- */

export const forParents = {
  eyebrow: "For parents",
  heading: "Know where they are improving—and where they need support.",
  intro:
    "No percentile rankings and no leaderboards. A plain-language picture of what your child has learned, practised and sat, with the skills worth revisiting named in words.",
  cards: [
    { title: "Practice completed", body: "Learning, practice and exam-style sessions, by week." },
    { title: "Skills developing well", body: "Named skills, not a single overall score." },
    { title: "Areas needing support", body: "Labelled in words as well as colour." },
    { title: "Recent activity", body: "What they did, when, and in which mode." },
    { title: "Practice history", body: "A four-week rhythm, as a table you can read." },
    { title: "More than one child", body: "Switch between children from one parent view." },
  ],
  cta: { label: "See the parent view", href: "#showcase" },
  image: {
    src: "/landing/for-parents/parents-mum-boy-laptop.webp",
    width: 724,
    height: 483,
    alt: "A parent and child looking at a laptop together",
  },
} as const;

/* ---------- Quality and originality ---------- */

export const quality = {
  eyebrow: "Quality and originality",
  heading: "Purpose-built questions, reviewed against ten standards.",
  intro:
    "MindMosaic questions are purpose-built and reviewed for correctness, clarity, age suitability, visual consistency, Australian English, accessibility and originality.",
  /*
   * The design file numbered these 01–09 with "09" used twice while ten
   * cards were on screen. The number is derived from the array index here,
   * so the count and the labels cannot disagree again.
   */
  standards: [
    { title: "Correctness", body: "The stated answer is checked before the question is published." },
    { title: "Clarity", body: "One defensible answer, and no trick phrasing." },
    { title: "Age suitability", body: "Reading load reviewed against the year level, not just the topic." },
    { title: "Visual consistency", body: "Diagrams drawn to one house style and one scale system." },
    { title: "Australian English", body: "Spelling, currency, metric units and local settings throughout." },
    { title: "Accessibility", body: "Text alternatives, keyboard paths and contrast reviewed on every item." },
    { title: "Originality", body: "Reviewed against published material. Nothing is reproduced." },
    { title: "Explanation quality", body: "Every item ships with a worked explanation a child can read alone." },
    { title: "Difficulty calibration", body: "Trialled with children at the year level before it is released." },
    { title: "Annual review", body: "Items are revisited frequently and retired if they stop working." },
  ],
} as const;

/* ---------- Two audiences ---------- */

export const audiences = {
  heading: "Two people use MindMosaic. They need different things from it.",
  columns: [
    {
      eyebrow: "For the student",
      quote: "“I know why I got it wrong, so I can fix it.”",
      tone: "tint" as const,
      points: [
        { title: "Learn it properly first", body: "Explanations and worked examples before the questions start." },
        { title: "Understand mistakes", body: "A worked explanation after every practice question." },
        {
          title: "Walk into the test knowing the format",
          body: "Exam simulations remove the surprise, not the challenge.",
        },
      ],
    },
    {
      eyebrow: "For the parent",
      quote: "“I can see what’s working without hovering over them.”",
      tone: "white" as const,
      points: [
        { title: "See meaningful progress", body: "Named skills and honest status labels across all three modes." },
        { title: "Identify learning gaps", body: "The few things actually holding them up right now." },
        { title: "Support the next step", body: "Each skill to revisit links to the lesson that explains it." },
      ],
    },
  ],
} as const;

/* ---------- Plans ---------- */

/*
 * Screen 3 of the design handoff, reconciled against the real billing
 * model (DESIGN_AUDIT.md §13).
 *
 * The design's three cards are a 7-day free trial, a $14.99 month and a
 * $149 family year. Two of those are real and one is not:
 *
 *  - There is NO trial mechanism anywhere in this product — no trial days,
 *    no trial state on a subscription, no path that starts one. The first
 *    card is therefore the thing that genuinely costs nothing and always
 *    will: guest practice, ungated and account-free. It keeps the design's
 *    "$0" and its position; it does not keep "7 days", because that would
 *    describe a feature that does not exist.
 *  - The monthly and yearly prices ARE real, and come from
 *    src/lib/billing/prices.ts — the same module /billing and the Stripe
 *    checkout read — so this page cannot quote a price the checkout does
 *    not charge.
 *
 * The Individual learner tier is genuinely unpriced. It is not a fourth
 * card (the design has three); it sits under the comparison table, where
 * "still being confirmed" reads as a fact rather than an offer.
 */

/*
 * Both paid cards lead to /billing when Family is purchasable. If it ever
 * is not, neither card may keep a "Subscribe" label pointing at a checkout
 * that would fail — /contact is then the one real way to reach us.
 */
const paidCta = (label: string) =>
  FAMILY_PLAN_AVAILABILITY === "purchasable"
    ? { label, href: "/billing" }
    : { label: "Register interest", href: routes.contact };

export const plans = {
  eyebrow: "Plans",
  heading: "Three ways to access MindMosaic.",
  intro:
    "Guest practice is free today and is never gated behind a subscription. The Family plan's price is live and is charged in Australian dollars, inclusive of GST.",
  /** Sits on the top edge of the featured card. */
  featuredTab: "Most families choose this",
  items: [
    {
      id: "free",
      eyebrow: "Free access",
      name: "Practise as a guest",
      body: "A full practice session, scored, with a worked explanation after every question — and no account at any point.",
      price: "$0" as string | null,
      cadence: "forever" as string | null,
      note: "Unlimited guest practice — no account required.",
      pending: false,
      features: [
        "Unlimited practice sessions",
        "A worked explanation after every question",
        "All 14 question types",
        "Nothing about the session stored on our servers",
      ],
      /* Not `startFree`: this card's whole claim is that it needs no
         account, so it must not lead to the account form. */
      cta: { label: "Start practising", href: routes.guestPractice },
      highlighted: false,
      tone: "default" as const,
    },
    {
      id: "family-monthly",
      eyebrow: "Family access",
      name: "Month by month",
      body: `Every mode, saved and reported, for up to ${FAMILY_PLAN.maxChildren} student profiles under one parent account.`,
      price: FAMILY_PLAN.monthly.display as string | null,
      cadence: FAMILY_PLAN.monthly.period.replace(/^\//, "") as string | null,
      note: PRICE_DISCLAIMER,
      pending: false,
      features: [
        "Everything in guest practice, kept",
        "Progress saved across sessions and devices",
        "Exam simulations with results and explanations",
        "Parent view with skill-by-skill reporting",
        `Up to ${FAMILY_PLAN.maxChildren} student profiles`,
        "Cancel any time",
      ],
      cta: paidCta(`Subscribe to ${FAMILY_PLAN.name}`),
      highlighted: true,
      tone: "default" as const,
    },
    {
      id: "family-annual",
      eyebrow: "Best value",
      name: "Family year",
      body: "The same Family access, paid twelve months at a time.",
      price: FAMILY_PLAN.annual.display as string | null,
      cadence: FAMILY_PLAN.annual.period.replace(/^\//, "") as string | null,
      note: PRICE_DISCLAIMER,
      pending: false,
      features: [
        "Everything in the monthly plan",
        "Twelve months of access",
        `Works out at about A$${(FAMILY_PLAN.annual.amount / 12).toFixed(2)} a month`,
        "One parent view across every child",
      ],
      cta: paidCta("Choose the yearly plan"),
      highlighted: false,
      /** The design gives this card a coral eyebrow. */
      tone: "coral" as const,
    },
  ],

  /* ---- Nine-row comparison table ---- */
  comparison: {
    heading: "What each plan includes",
    intro:
      "Where a row says a programme is still being written, that is why it is unavailable — not a plan holding it back.",
    columns: ["Guest", "Monthly", "Family year"],
    rows: [
      { label: "Practice with instant explanations", values: ["Yes", "Yes", "Yes"] },
      { label: "All 14 question types", values: ["Yes", "Yes", "Yes"] },
      {
        label: "Exam simulations (NAPLAN-style, ICAS-style)",
        values: ["Yes", "Yes", "Yes"],
      },
      { label: "Progress saved between sessions", values: ["No", "Yes", "Yes"] },
      { label: "Parent view and skill reporting", values: ["No", "Yes", "Yes"] },
      {
        label: "Student profiles included",
        values: [
          "None",
          String(FAMILY_PLAN.maxChildren),
          String(FAMILY_PLAN.maxChildren),
        ],
      },
      {
        label: "Australian Curriculum learning pathways",
        values: ["Being written", "Being written", "Being written"],
      },
      {
        label: "Singapore Maths programme",
        values: ["Being written", "Being written", "Being written"],
      },
      { label: "Cancel any time", values: ["—", "Yes", "Yes"] },
    ],
    footnote:
      "An Individual learner tier — one student, full access, below the family price — is planned. Its price and inclusions are still being confirmed, so it is not offered here rather than being listed at a number we would have to change.",
  },

  /* ---- Five billing FAQs ---- */
  faq: {
    heading: "Billing questions",
    items: [
      {
        question: "Do I need a card to try MindMosaic?",
        answer:
          "No — and not because of a trial. Guest practice needs no account and no card at all. Sessions are scored and explained in the browser; what an account adds is keeping that progress.",
      },
      {
        question: "Is there a free trial?",
        answer:
          "Not today. Rather than describe one that does not exist, the free tier is simply free: unlimited guest practice, permanently, with no card and no expiry.",
      },
      {
        question: "Can I switch between monthly and yearly?",
        answer:
          "Yes, from the billing page in the parent account. A switch takes effect at the next billing date and the remaining paid period is credited.",
      },
      {
        question: "How many children does the Family plan cover?",
        answer: `Up to ${FAMILY_PLAN.maxChildren} student profiles under one parent account, each with its own progress, all visible from one parent view.`,
      },
      {
        question: "How do I cancel?",
        answer:
          "From the billing page in the parent account. Access continues until the end of the period already paid for, and the account stays open afterwards so progress is not lost.",
      },
    ],
    footnote:
      "Prices are in Australian dollars and include GST. Billing and refund terms are pending legal sign-off before production.",
  },
} as const;

/* ---------- Evidence placeholders ---------- */

export const evidence = {
  enabled: true,
  eyebrow: "Evidence",
  heading: "We will publish evidence when we have it, and not before.",
  intro:
    "Rather than invent testimonials, ratings or statistics, these panels mark exactly where verified material will sit.",
  panels: [
    {
      label: "Placeholder — family feedback",
      title: "Verified quotes from families, with first name, state and year level.",
      requirement: "Required before production: written consent and the account each quote came from.",
    },
    {
      label: "Placeholder — platform figures",
      title: "Programmes live, year levels covered and sessions completed.",
      requirement: "Required before production: figures from production data with a stated reporting date.",
    },
    {
      label: "Placeholder — who writes the questions",
      title: "Author and reviewer credentials, once confirmed and approved for publication.",
      requirement: "Required before production: verified credentials and permission to publish each name.",
    },
  ],
} as const;

/* ---------- Resources ---------- */

export const resources = {
  eyebrow: "For families",
  heading: "Short reads for the parts that aren’t about maths.",
  cta: { label: "Browse the Learning Hub", href: routes.resources },
  items: [
    {
      kicker: "Assessment weeks",
      title: "Preparing calmly for assessments",
      body: "What is worth doing in the fortnight before a test, and what only adds pressure.",
      href: routes.studentTips,
      image: {
        src: "/landing/subject-card/card-girl-writing-classroom.webp",
        width: 724,
        height: 483,
        alt: "A student writing at a classroom desk",
      },
    },
    {
      kicker: "Reporting",
      title: "Understanding progress reports",
      body: "What “developing well” and “needs support” actually mean, and what they don’t.",
      href: routes.parentGuide,
      image: {
        src: "/landing/subject-card/card-boy-glasses-writing.webp",
        width: 724,
        height: 483,
        alt: "A student working through written questions",
      },
    },
    {
      kicker: "Routines",
      title: "Building a practice routine that lasts",
      body: "Two short sessions a week beats an hour on Sunday night. How to make it stick.",
      href: routes.help,
      image: {
        src: "/landing/subject-card/card-girl-tablet-writing.webp",
        width: 724,
        height: 483,
        alt: "A student practising on a tablet",
      },
    },
  ],
} as const;

/* ---------- About (the /about screen) ---------- */

/*
 * Screen 5 of the design handoff. Two things in the design's own copy are
 * not repeated here because they are not true of this product yet:
 *
 *  - "Years 1 to 12 across the Australian Curriculum, Singapore Maths and
 *    assessment-style preparation". The question bank covers Years 3 and 5
 *    in NAPLAN- and ICAS-style formats. The narrative says what is live
 *    and what is planned, separately, because one of this page's six
 *    stated principles is "say what is not ready".
 *  - "Seven days free, no card required" in the closing band. There is no
 *    trial mechanism (src/lib/billing/prices.ts). Guest practice is the
 *    real free offer and needs no card because it needs no account.
 */
export const about = {
  eyebrow: "About MindMosaic",
  heading: "Built in Australia, for Australian students.",
  intro:
    "MindMosaic is an independent learning platform. We write every question ourselves, explain every answer, and report progress in language a family can act on.",
  heroSlot:
    "Team or workspace photo — landscape. Optional; a product screenshot also works.",
  why: {
    heading: "Why we built it",
    paragraphs: [
      "Most preparation material asks a student to answer questions and then tells them a score. That produces practice without understanding, and a report a parent cannot use.",
      "MindMosaic starts from the opposite end. Each session teaches the concept, practises it with the explanation available immediately, and only then puts it under exam conditions. Progress is reported by named skill, linked back to the lesson that explains it.",
      "What is live today is Years 3 and 5 in NAPLAN-style and ICAS-style formats, across numeracy, reading and language conventions. The wider programme — Years 1 to 12, the Australian Curriculum pathways, Singapore Maths, AMC-style and selective school entry-style preparation — is being built, and every programme page states which year levels it currently covers rather than implying the rest.",
    ],
  },
  /** Every third tile is inverted to solid brand purple, per the design. */
  principles: [
    {
      title: "Teach before testing",
      body: "A concept is explained and worked through before a student is asked to perform under time.",
    },
    {
      title: "Explain every answer",
      body: "Right or wrong, the reasoning is shown. A wrong answer is where the learning happens.",
    },
    {
      title: "Original questions only",
      body: "No past papers, no licensed third-party banks. Everything is written for MindMosaic.",
    },
    {
      title: "Name the skill",
      body: "Progress is reported as named skills, not a single score, and each links to its lesson.",
    },
    {
      title: "Say what is not ready",
      body: "Where coverage is still being confirmed, the programme states it plainly.",
    },
    {
      title: "Made for local classrooms",
      body: "Australian English, local contexts, and the year-level structure families recognise.",
    },
  ],
  pipeline: {
    heading: "How content is made",
    intro:
      "Every item passes through the same pipeline before a student sees it. Where curriculum mapping is still being verified, the programme says so rather than implying coverage.",
    steps: [
      {
        title: "Written",
        body: "A subject specialist writes the item against a named skill and year level.",
      },
      {
        title: "Reviewed",
        body: "Checked for correctness, a single defensible answer, and clear language.",
      },
      {
        title: "Localised",
        body: "Australian English, local contexts, and consistent diagram style.",
      },
      {
        title: "Accessibility pass",
        body: "Screen reader labels, contrast and keyboard navigation confirmed.",
      },
      {
        title: "Signed off",
        body: "Editorial approval, difficulty calibration, then release to the platform.",
      },
    ],
  },
  privacy: {
    heading: "Privacy, in plain terms",
    lead: "A student account is created by a parent and holds a first name and year level. We do not sell personal information and there is no third-party advertising anywhere on the platform.",
    points: [
      "A student profile holds a first name and year level only",
      "A student never has an email address — they sign in with a code and a PIN",
      "No selling of personal information, ever",
      "No third-party advertising on the platform",
      "Parents can request deletion of a profile and its data",
    ],
  },
  contact: {
    heading: "Contact us",
    intro:
      "Questions about programmes, accounts or schools. A person replies, usually within one business day.",
    /*
     * The design draws a three-field form with no endpoint. Rather than
     * ship inputs that discard what is typed into them, this points at
     * /contact, which is a real page.
     */
    cta: { label: "Open the contact page", href: routes.contact },
    emailLead: "Or email us directly at ",
  },
  closing: {
    heading: "See it with your own child's year level.",
    body: "Guest practice is free and needs no account or card. An account is what saves progress across sessions.",
    primaryCta: { label: "Start free", href: routes.startFree },
    secondaryCta: { label: "See plans", href: routes.pricing },
  },
} as const;

/* ---------- Learning Hub library (the /resources screen) ---------- */

/*
 * Screen 4 of the design handoff. Every entry here is a real, writable
 * article brief rather than a live piece of content: none of these guides
 * exist yet, so each one carries `status: "planned"` and the page says so
 * once, at the top, instead of nine times.
 *
 * That is the same convention the rest of this file already uses for
 * unverified material (see `evidence` and `tutorials`) — the alternative,
 * nine cards that look like published articles and 404 on click, is the
 * thing this codebase keeps deciding not to ship.
 */

export type HubCategory =
  | "Maths"
  | "English"
  | "Exam skills"
  | "Singapore Maths"
  | "For parents"
  | "Study habits";

/**
 * A photographed still life for a guide.
 *
 * `alt` is real alternative text, not a caption: it describes what is in the
 * frame for someone who cannot see it. Nothing the reader needs is carried
 * by the picture — the title, category, year range and reading time beside
 * it are all HTML — so the alt says what the scene shows and stops there.
 *
 * A guide with no `media` is not broken: HubMedia draws its category's own
 * plate instead, which is what the six unphotographed briefs render today.
 */
export interface HubMedia {
  readonly src: string;
  readonly alt: string;
  /**
   * `object-position` for the crop, when centring loses something. Every
   * asset is 4:3 and every slot is wider than that, so the crop is always
   * vertical — this decides which third of the frame survives it.
   */
  readonly position?: string;
}

export interface HubArticle {
  readonly id: string;
  readonly category: HubCategory;
  readonly title: string;
  readonly body: string;
  readonly audience: string;
  readonly length: string;
  /** Art direction for the thumbnail, from the design's `<image-slot>`. */
  readonly slot: string;
  readonly media?: HubMedia;
  /**
   * Where the written guide lives. Absent on every entry today — these are
   * commissioned briefs, and a card with nowhere to go must not render as a
   * link (see HubGuideCard). Setting this is the whole of publishing one.
   */
  readonly href?: string;
}

export const hub = {
  eyebrow: "Learning Hub",
  heading: "Explanations, worked examples and guides.",
  intro:
    "The Learning Hub is the reference library behind every lesson. Students use it to revisit a concept; parents use it to understand what a skill actually means before a report mentions it.",
  searchLabel: "Search the hub",
  searchPlaceholder: "Fractions, bar models, reading inference…",
  /** Shown once, above the grid. */
  statusNote:
    "These guides are commissioned and not yet published. Each card below is the brief it will be written to, so the library's shape is visible before its contents are.",
  categories: [
    "All",
    "Maths",
    "English",
    "Exam skills",
    "Singapore Maths",
    "For parents",
    "Study habits",
  ] as const,
  emptyState: {
    title: "Nothing in the hub matches that yet",
    body: "Try a different category, or clear the search to see everything planned so far.",
  },
  featured: {
    kicker: "Featured guide",
    title: "Reading a MindMosaic skill report without over-reading it",
    body: "What “developing” and “needs support” mean, why a single session rarely changes the picture, and which numbers are worth acting on. Written for parents.",
    meta: ["For parents", "8 min read", "Updated monthly"],
    cta: { label: "Read the parent guide", href: routes.parentGuide },
    slot: "Screenshot — parent skill report, annotated",
    media: {
      src: "/hub/skill-report.webp",
      alt: "Annotated student progress report with charts and highlighted learning insights",
    },
  },
  articles: [
    {
      id: "fractions-three-ways",
      category: "Maths",
      title: "Fractions as parts, positions and division",
      body: "Three ways to think about the same fraction, and when each one makes a problem easier.",
      audience: "Years 4–6",
      length: "6 min read",
      slot: "Article thumbnail — a fraction shown as a shape, a number line and a division",
    },
    {
      id: "bar-models",
      category: "Singapore Maths",
      title: "Bar models for word problems",
      body: "How to turn a sentence into a diagram, and why the diagram usually reveals the operation.",
      audience: "Years 3–7",
      length: "7 min read",
      slot: "Article thumbnail — a two-bar comparison model drawn from a word problem",
    },
    {
      id: "inference",
      category: "English",
      title: "Inference questions: what the text implies",
      body: "Separating what a passage says from what a reader assumes, with two worked examples.",
      audience: "Years 5–9",
      length: "5 min read",
      slot: "Article thumbnail — an annotated passage with implied meaning marked",
    },
    {
      id: "timed-pacing",
      category: "Exam skills",
      title: "Managing time in a timed paper",
      body: "A pacing method for multi-section papers, including when to flag and move on.",
      audience: "Years 5–12",
      length: "6 min read",
      slot: "Article thumbnail — a paper split into timed sections",
      media: {
        src: "/hub/exam-timing.webp",
        alt: "Exam timing plan with clock and staged question progress",
        /* Biased up: the clock sits high in the frame and a centred 16:10
           crop takes the top off it. */
        position: "50% 38%",
      },
    },
    {
      id: "ratio",
      category: "Maths",
      title: "Ratio and proportional reasoning",
      body: "Recognising proportional situations and the two reliable ways to scale them.",
      audience: "Years 6–9",
      length: "8 min read",
      slot: "Article thumbnail — a ratio table beside a scaled diagram",
    },
    {
      id: "multiple-choice",
      category: "Exam skills",
      title: "Reading a multiple-choice question properly",
      body: "Common distractor patterns and how to eliminate them without guessing.",
      audience: "Years 4–10",
      length: "4 min read",
      slot: "Article thumbnail — four options with two eliminated",
      media: {
        src: "/hub/multiple-choice.webp",
        alt: "Multiple-choice practice sheet showing answer elimination",
      },
    },
    {
      id: "supporting-practice",
      category: "For parents",
      title: "Supporting practice without teaching the answer",
      body: "Questions to ask when a child is stuck, and what to avoid saying.",
      audience: "For parents",
      length: "5 min read",
      slot: "Article thumbnail — a parent sitting beside a child, not over them",
    },
    {
      id: "spacing",
      category: "Study habits",
      title: "Short sessions beat long ones",
      body: "Why spacing practice across the week produces better retention than one long block.",
      audience: "All years",
      length: "4 min read",
      slot: "Article thumbnail — a week of short sessions against one long block",
    },
    {
      id: "paragraph-structure",
      category: "English",
      title: "Building a paragraph that answers the question",
      body: "Structure for short written responses, with a marking-style checklist.",
      audience: "Years 5–10",
      length: "6 min read",
      slot: "Article thumbnail — a short response with its structure marked up",
    },
  ] as readonly HubArticle[],
  help: {
    heading: "Help Centre and contact",
    intro:
      "Account, billing and technical questions are answered here first. If the answer is not in the Help Centre, a person replies to every message.",
    note: "Response time during Australian business hours is typically within one business day.",
    /*
     * Six cards, every one pointing at a page that exists. The design's
     * cards all pointed back at the Resources screen itself.
     */
    cards: [
      {
        title: "Getting started",
        body: "Create the account, add a student and choose a first programme.",
        href: routes.help,
      },
      {
        title: "Account and billing",
        body: "Plans, invoices, changing a plan and cancellation.",
        href: "/billing",
      },
      {
        title: "Using exam simulations",
        body: "Conditions, timing, flagging and when results are released.",
        href: routes.examPrep,
      },
      {
        title: "Parent view",
        body: "What is reported, how often it updates and how to read it.",
        href: routes.parentGuide,
      },
      {
        title: "Accessibility",
        body: "Screen readers, text size, contrast and keyboard navigation.",
        href: routes.accessibility,
      },
      {
        title: "Contact us",
        body: "Send a message and a person replies, usually within one business day.",
        href: routes.contact,
      },
    ],
  },
  closing: {
    /* The design promised "open during the free trial". There is no trial
       (see src/lib/billing/prices.ts), and the hub is not gated at all. */
    heading: "The hub is open to everyone, account or not.",
    body: "Read a few explanations alongside a first practice session and the progress reports make immediate sense.",
    cta: { label: "Start free", href: routes.startFree },
    secondaryCta: { label: "Practise as a guest", href: routes.guestPractice },
  },
} as const;

/* ---------- FAQ ---------- */

export const faq = {
  eyebrow: "Questions",
  heading: "Answers before you sign up.",
  introLead: "Still unsure about something? ",
  introLink: { label: "Get help", href: routes.help },
  introTail: " and a person will reply.",
  items: [
    {
      question: "Which year levels are supported?",
      answer:
        "The platform is built for Years 1 to 12, and each programme lists the year levels it currently covers. Where coverage is still being confirmed, the programme says so rather than implying availability.",
      link: null as { label: string; href: string } | null,
    },
    {
      question: "Which learning programmes are available?",
      answer:
        "Structured Australian Curriculum learning pathways, Singapore Maths, and the Learning Hub library of explanations, worked examples and skill lessons. Exam preparation covers NAPLAN-style, ICAS-style, AMC-style and selective school entry-style formats.",
      link: null as { label: string; href: string } | null,
    },
    {
      question: "What is the difference between learning, practice and exam simulation?",
      answer:
        "Learning teaches the concept with explanations and worked examples. Practice is flexible: submit an answer and the worked explanation follows, with retry and review available. An exam simulation runs under assessment conditions — realistic instructions, section navigation, flag for review, autosave and a review-before-submit screen — with results and explanations released after submission.",
      link: null as { label: string; href: string } | null,
    },
    {
      question: "What does “assessment-style” mean?",
      answer:
        "It describes the format, question types and conditions of an assessment — not the assessment itself. MindMosaic is an independent learning platform. Its assessment-style materials contain original questions and are not official examinations, past papers or endorsed preparation materials.",
      link: { label: "Assessment Disclaimer", href: routes.disclaimer } as { label: string; href: string } | null,
    },
    {
      question: "Do I need an account to practise?",
      answer:
        "No — you can use the practice engine as a guest, with no sign-in at all. Nothing about a guest session is stored on our servers; it exists only in your browser for that session.",
      link: null as { label: string; href: string } | null,
    },
    {
      question: "How is my child’s data handled?",
      answer:
        "A student account is created by a parent and holds a first name and year level. We do not sell personal information and there is no third-party advertising. Full details of storage, retention and deletion are set out in the Privacy Policy.",
      link: { label: "Privacy Policy", href: routes.privacy } as { label: string; href: string } | null,
    },
  ],
  footnoteLead: "Need more detail? See the ",
  footnoteLinks: [
    { label: "Help Centre", href: routes.help },
    { label: "Privacy Policy", href: routes.privacy },
    { label: "Terms and Conditions", href: routes.terms },
    { label: "Assessment Disclaimer", href: routes.disclaimer },
  ],
} as const;

/* ---------- Closing CTA ---------- */

export const closing = {
  heading: "Give every session a clear purpose.",
  body: "Learning, practice and exam preparation for Australian students across primary and secondary years.",
  primaryCta: { label: "Start free", href: routes.startFree },
  secondaryCta: { label: "Explore practice", href: routes.practice },
  tertiaryCta: { label: "Learn how it works", href: routes.methodology },
  image: {
    src: "/landing/hero/hero-girl-laptop-chips-wide.webp",
    width: 1456,
    height: 819,
    alt: "A student practising on a laptop",
  },
  tiles: [
    "brand",
    "quiet",
    "brand",
    "coral",
    "quiet",
    "lilac",
    "quiet",
    "brand",
    "quiet",
    "brand",
  ] as const,
} as const;

/* ---------- Footer ---------- */

export const footer = {
  tagline:
    "Learning, practice and exam preparation for Australian students across primary and secondary years.",
  columns: [
    {
      title: "Platform",
      links: [
        { label: "Learn", href: routes.learn },
        { label: "Practice", href: routes.practice },
        { label: "Exam Preparation", href: routes.examPrep },
        { label: "How It Works", href: routes.methodology },
        { label: "Plans", href: routes.pricing },
      ],
    },
    {
      title: "Programmes",
      links: [
        { label: "Australian Curriculum", href: routes.learn },
        { label: "Singapore Maths", href: routes.learn },
        { label: "NAPLAN-style", href: routes.examPrep },
        { label: "ICAS-style", href: routes.examPrep },
        { label: "AMC-style", href: routes.examPrep },
        { label: "Selective school entry-style", href: routes.examPrep },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Learning Hub", href: routes.resources },
        { label: "Help Centre", href: routes.help },
        { label: "Parent Guide", href: routes.parentGuide },
        { label: "Student Tips", href: routes.studentTips },
        { label: "Contact Us", href: routes.contact },
        { label: "Accessibility", href: routes.accessibility },
      ],
    },
    {
      title: "Company and legal",
      links: [
        { label: "About MindMosaic", href: routes.about },
        { label: "Privacy Policy", href: routes.privacy },
        { label: "Terms of Use", href: routes.terms },
        { label: "Assessment Disclaimer", href: routes.disclaimer },
      ],
    },
  ],
  /** The 16-tile mosaic rule above the legal block — decorative only. */
  tiles: [
    "brand",
    "quiet",
    "lilac",
    "quiet",
    "brand",
    "quiet",
    "coral",
    "quiet",
    "brand",
    "lilac",
    "quiet",
    "brand",
    "quiet",
    "lilac",
    "quiet",
    "brand",
  ] as const,
  disclaimer:
    "MindMosaic is an independent learning platform. Its assessment-style materials contain original questions and are not official examinations, past papers or endorsed preparation materials. NAPLAN, ICAS, AMC and selective school entry assessments are the property of their respective owners; those names are used only to describe the style of practice provided.",
  supportLine: `Questions? Email ${SUPPORT_EMAIL}.`,
  copyright: "© 2026 MindMosaic. Made in Australia.",
} as const;
