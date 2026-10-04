/**
 * All landing-page copy, imagery references and structured content, typed
 * and centralised so the page's composition, copy, programme data, links
 * and image choices are a config edit — never a component edit. `sections`
 * controls both order and visibility; `src/app/page.tsx` renders whatever
 * it says.
 *
 * Home page: the October 2026 redesign (owner brief, "learn → practise →
 * prepare → understand progress"), with four supplied campaign
 * photographs in public/landing/campaign/. Every home-page claim is
 * checked against the product before it is written — see each block's
 * doc comment for the evidence. The earlier source, `Public/Home.dc.html`
 * in the claude.ai/design project "Phase 1 Home page review", still
 * governs the product-fact log (`handoff/FACT_LOG.md`) the copy keeps to.
 * Other marketing routes (/learn, /assessments, /exam-preparation,
 * /methodology, /pricing, /resources, /about) predate this rebuild and are
 * out of its scope; their components (Credibility, Programmes,
 * HowItWorks, Tutorials, Showcase, QuestionTypes, LearningHub, Quality,
 * Audiences, Plans, Resources) are unchanged and still render on those
 * pages, just no longer on the home page itself — see `sections` below.
 *
 * Deliberate deviations from the design file:
 *
 *  1. "Start free" points at /sign-up, as the design intends, now that
 *     public sign-up is open (src/features/auth/signup-policy.ts).
 *     `routes.guestPractice` is kept separate and is what every
 *     "Explore practice" secondary CTA uses, because practice genuinely
 *     needs no account and that promise is worth keeping distinct from
 *     "create one".
 *  2. The Family plan is not open for purchase. src/lib/billing/prices.ts
 *     sets FAMILY_PLAN_AVAILABILITY to "roadmap": its amounts are
 *     placeholders and the commercial and legal readiness work is not
 *     done. A working checkout code path does not make the plan
 *     commercially available. Every public surface — the Plans section
 *     on /pricing (see `plans` below) and the home page's FAQ — therefore
 *     says "price to be confirmed" and offers "Register interest", never
 *     a real figure or a Subscribe link.
 *  3. The October 2026 brief named a header of Practice → /assessments,
 *     How It Works → /methodology, Resources → /help, /login and /signup.
 *     The owner-approved header (public-pages Step 4) is kept instead:
 *     /methodology already redirects to /how-it-works, and /login and
 *     /signup are not routes here (/sign-in and /sign-up are).
 */

import { FAMILY_PLAN } from "@/lib/billing/prices";

/**
 * The one real support address — every page that mentions it (FAQ, footer,
 * the /contact page, legal pages) reads from here so it can't drift into
 * an invented or inconsistent address.
 */
export const SUPPORT_EMAIL = "hello@mindmosaic.app";

export type SectionKey =
  | "hero"
  | "learningDemo"
  | "productTour"
  | "programHighlights"
  | "respondsToStudent"
  | "forParents"
  | "qualityBand"
  | "trustAndCare"
  | "faqAndStart"
  | "footer";

/**
 * Page composition: order AND visibility in one place. The October 2026
 * redesign tells one story — learn → practise → prepare → understand
 * progress — in nine sections, top to bottom.
 */
export const sections: { key: SectionKey; enabled: boolean }[] = [
  { key: "hero", enabled: true },
  { key: "learningDemo", enabled: true },
  { key: "productTour", enabled: true },
  { key: "programHighlights", enabled: true },
  { key: "respondsToStudent", enabled: true },
  { key: "forParents", enabled: true },
  { key: "qualityBand", enabled: true },
  { key: "trustAndCare", enabled: true },
  { key: "faqAndStart", enabled: true },
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
  howItWorks: "/how-it-works",
  programs: "/programs",
  pricing: "/pricing",
  resources: "/resources",
  help: "/help",
  about: "/about",
  contact: "/help#contact",
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
  /** Components/Site Header.dc.html's five primary labels, verbatim. */
  links: [
    { label: "Programs", href: routes.programs },
    { label: "How It Works", href: routes.howItWorks },
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

/**
 * The hero: the two-line promise, one sentence of what MindMosaic is, the
 * CTA pair and a short credibility line — beside the campaign photograph.
 *
 * The photograph is photography only (docs/design.md §27 forbids fake app
 * UI and baked-in text): no interface, no logo, no readable text. It is one
 * of the page's two face-visible photos, hero and parent. §39.2 caps
 * face-visible photos at two, so every campaign image carries a `treatment`
 * and a test holds that line. All product UI beside the photo is real HTML
 * in `demo`, using the product's own terms. The sample question is
 * checked: 12 m x 8 m = 96 m2, and the selected option C is 96 m2. Alt
 * text describes the scene only.
 */
export const hero = {
  image: {
    treatment: "face-visible",
    src: "/landing/campaign/hero-students-notebook.webp",
    alt: "Two students work together at a sunlit desk, one writing in a notebook while both look at a tablet",
    width: 960,
    height: 941,
  },
  demo: {
    label: "Hero sample: maths question",
    subject: "Mathematics",
    progress: { current: 3, total: 10 },
    question: "A rectangular garden is 12 metres long and 8 metres wide. What is the area of the garden?",
    options: [
      { key: "A", label: "20 m²", selected: false },
      { key: "B", label: "48 m²", selected: false },
      { key: "C", label: "96 m²", selected: true },
      { key: "D", label: "40 m²", selected: false },
    ],
    explanation: {
      label: "Hero sample: worked explanation",
      title: "Worked explanation",
      steps: ["Area = length × width", "12 × 8 = 96", "The area of the garden is 96 m²."],
    },
  },
  heading: "Learn with purpose.",
  headingEmphasis: "Practise with confidence.",
  subheadline:
    "Learning, practice and exam preparation that helps students understand what they're learning, build confidence through practice and know what to work on next.",
  primaryCta: { label: "Start free", href: routes.startFree },
  secondaryCta: { label: "Explore programs", href: routes.programs },
  credibility: [
    "Australian learning pathways",
    "Original questions",
    "Worked explanations",
    "Parent progress view",
  ],
  availability: {
    text: "Available now: NAPLAN-style and ICAS-style practice for Years 3 and 5.",
    link: { label: "See what's open", href: routes.programs },
  },
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
   *
   * Classified by spec Phase 0 (ADR-001 §3) as **per-programme display data**,
   * not a year-range authority: it is what one marketing card may claim, varies
   * per programme, and is already checked against real coverage. It is left
   * as-is and is out of scope for year-constant consolidation. The product's
   * year range is `YEAR_LEVELS` in `src/features/taxonomy/year-registry.ts`.
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

/**
 * "Find the right program": four pathways, each with its real status from
 * the same facts the full catalogue uses (`programmes` above). Nothing is
 * shown as available until a learner can use it — the advanced pathways
 * are named because families ask about them, and labelled Planned.
 */
export const programHighlights = {
  eyebrow: "Programs",
  heading: "Find the right program.",
  intro:
    "Choose the pathway that matches what your child is learning, preparing for or ready to explore next.",
  image: {
    treatment: "hands-only",
    src: "/landing/campaign/programs-hands-laptop.webp",
    /* Decorative: it adds nothing the program list doesn't say. */
    alt: "",
    width: 585,
    height: 391,
  },
  rows: [
    {
      id: "naplan",
      icon: "naplan" as const,
      name: "NAPLAN-style practice",
      body: "Numeracy, Reading and Language Conventions, in the formats Years 3 and 5 will recognise.",
      meta: "Years 3 and 5",
      status: "Available",
      tone: "available" as const,
      href: `${routes.programs}/naplan-style`,
    },
    {
      id: "icas",
      icon: "icas" as const,
      name: "ICAS-style practice",
      body: "Mathematics, Reading and Language questions that reward close reading and unfamiliar problems.",
      meta: "Years 3 and 5",
      status: "Available",
      tone: "available" as const,
      href: `${routes.programs}/icas-style`,
    },
    {
      id: "curriculum",
      icon: "curriculum" as const,
      name: "Curriculum learning",
      body: "Learn concepts, practise skills and build understanding alongside school.",
      meta: "Maths and English lessons for signed-in students",
      status: "Limited",
      tone: "limited" as const,
      href: routes.learn,
    },
    {
      id: "advanced",
      icon: "advanced" as const,
      name: "Advanced & competition pathways",
      body: "AMC-style, Olympiad-style, selective-entry and scholarship preparation.",
      meta: "Being built — not open yet",
      status: "Planned",
      tone: "planned" as const,
      href: routes.programs,
    },
  ],
  primaryCta: { label: "Explore all programs", href: routes.programs },
} as const;

/* ---------- Learning that responds to the student ---------- */

/**
 * The personalisation story, told only as far as the product goes today:
 * scored answers are grouped by named skill, worked explanations follow
 * every practice answer, and when a test has eligible missed skills they
 * are ranked and a five-question drill targets them
 * (src/features/exam-engine/recommendation: DRILL_QUESTION_COUNT = 5; a
 * perfect result or no eligible misses produces no drill
 * — deterministic and rule-based, not a model). No adaptive questioning,
 * tutoring or "AI" claim is made, because none ships.
 */
export const respondsToStudent = {
  eyebrow: "Personalised practice",
  heading: "Learning that responds to the student.",
  intro:
    "MindMosaic uses each student's answers to show what's secure, where more practice would help and which skills to practise next.",
  steps: [
    {
      title: "Understand where they are",
      body: "Practice reveals strengths and areas that may need more attention, reported by named skill rather than one score.",
    },
    {
      title: "Get useful help",
      body: "Clear explanations help students understand mistakes instead of simply seeing the answer.",
    },
    {
      title: "Know what comes next",
      body: "When a test shows skills where marks were missed, MindMosaic ranks them and can create a focused five-question practice set.",
    },
  ],
  note: "These suggestions come from clear, fixed rules applied to your child's answers — the same answers always lead to the same suggestion.",
  sample: {
    label: "After a Year 3 Numeracy test",
    skills: [
      { name: "Fractions of a collection", state: "Practise next", value: 40 },
      { name: "Reading a timetable", state: "Getting there", value: 67 },
      { name: "Place value to 1000", state: "Secure", value: 100 },
    ],
    nextSet: "5 questions on fractions of a collection, each with a worked explanation.",
    badge: "Sample",
  },
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

/**
 * "See how learning works": the Learn / Practise / Prepare model, each
 * stage beside a working sample of the real component. The lesson,
 * practice question and test-sitting mock are the product's own
 * structures, using a Year 3 fractions sample.
 */
export const learningDemo = {
  eyebrow: "The learning model",
  heading: "See how learning works.",
  intro:
    "Every topic moves through the same three stages, so practice always builds on something the student has already understood.",
  tabs: [
    {
      id: "learn",
      label: "Learn",
      step: "01",
      summary: "Understand the idea",
      kicker: "Learn",
      title: "Understand it before practising it.",
      body: "Short lessons explain the idea clearly using worked examples and step-by-step reasoning.",
      points: ["Learning intention up front", "Worked example, step by step", "A common mix-up to avoid"],
    },
    {
      id: "practise",
      label: "Practise",
      step: "02",
      summary: "Apply it with feedback",
      kicker: "Practise",
      title: "Apply what you've learned.",
      body: "Practise with original questions and use clear explanations to understand the reasoning behind each answer.",
      points: ["Pick an answer, then check it", "Right or wrong, the steps are shown", "A summary at the end of the set"],
    },
    {
      id: "prepare",
      label: "Prepare",
      step: "03",
      summary: "Get ready for the real thing",
      kicker: "Prepare",
      title: "Build confidence for the real challenge.",
      body: "Move into mixed, timed and exam-style practice when you're ready.",
      points: ["Flag and return to questions", "Question map shows what's left", "Answers and explanations after submitting"],
    },
  ],
  learnDemo: {
    intention: "We are learning to name unit fractions and see how many make one whole.",
    explanation: "A unit fraction has 1 on top. ¼ means one of four equal parts.",
    workedExample: "Four quarters fill the bar, so ¼ + ¼ + ¼ + ¼ = 1 whole.",
    mixUp:
      "Common mix-up: a bigger bottom number does not mean a bigger fraction. ⅛ is smaller than ¼, because the whole is cut into more parts.",
  },
  practiseDemo: {
    meta: "Year 3 · Fractions practice",
    progress: "Question 3 of 5",
    question: "What fraction of the bar is shaded?",
    shadedOf: 8,
    shaded: 3,
    options: [
      { key: "A", label: "3/5", correct: false },
      { key: "B", label: "3/8", correct: true },
      { key: "C", label: "5/8", correct: false },
      { key: "D", label: "8/3", correct: false },
    ],
    correctFeedback: "Correct. 3 of the 8 equal parts are shaded.",
    incorrectFeedback: "Not quite. Let's look at the working.",
    explanationSteps: [
      "Count all the equal parts: there are 8, so each part is ⅛.",
      "Count the shaded parts: there are 3.",
      "3 of 8 equal parts are shaded, so the answer is ⅜.",
    ],
  },
  prepareDemo: {
    meta: "NAPLAN-style Numeracy · Year 3 · practice paper",
    progress: "Question 6 of 20",
    question: "Mia has 24 stickers. She shares them equally between 4 friends. How many stickers does each friend get?",
    options: ["4", "6", "8", "20"],
    selectedIndex: 1,
    flaggedCount: 2,
    questionCount: 20,
    currentQuestion: 6,
    flaggedQuestions: [2, 4],
  },
} as const;

/* ---------- Product tour ---------- */

/**
 * "See MindMosaic in action". The photo is photography only and hands-only
 * (a writing hand, a notebook, a laptop edge — no face; docs/design.md
 * §39.2 caps face-visible photos at two per page): no interface, no logo,
 * no readable text. The Learn → Practise → Progress flow beside it is real HTML in
 * `flow`, from product terms: the equivalent-fractions lesson, "Mixed
 * practice", and a results score. It claims no adaptive questions, goals
 * or tutoring. The live logo comes only from /brand/mark-*.webp. There is
 * no tour video yet (the previous
 * home page said so too), so the poster is labelled as a preview and
 * nothing pretends to play. The secondary link goes to /how-it-works,
 * which walks through the same journey in words today.
 */
export const productTour = {
  eyebrow: "Product tour",
  heading: "See MindMosaic in action.",
  body: "Follow a student from learning a concept to practising it, understanding mistakes and seeing what to work on next.",
  image: {
    treatment: "hands-only",
    src: "/landing/campaign/tour-hands-notebook.webp",
    alt: "A student's hand writes in an open notebook on a sunlit desk, with a laptop beside it",
    width: 782,
    height: 391,
  },
  flowLabel: "Sample screens",
  flow: [
    {
      id: "learn",
      label: "Learn",
      title: "Equivalent fractions",
      detail: "A short lesson with a worked example",
      action: "Continue learning",
    },
    {
      id: "practise",
      label: "Practise",
      title: "Mixed practice",
      detail: "Question 4 of 10, with a worked explanation after each answer",
    },
    {
      id: "progress",
      label: "Progress",
      title: "8 of 10 correct",
      detail: "Fractions · Equivalent fractions · Comparing fractions",
      score: { correct: 8, total: 10 },
    },
  ],
  videoLabel: "Watch the 90-second tour",
  videoStatus: "Video coming soon",
  videoNote: "The 90-second tour is being filmed. Until then, How It Works walks through the same journey.",
  link: { label: "Read how it works", href: routes.howItWorks },
  stops: ["Learn a concept", "Practise it", "Understand mistakes", "See what's next"],
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

/**
 * "Clearer support for parents". Every blurb maps to something a parent
 * account does today, free: finished sets and tests are saved per child and
 * viewable from the parent view; results are broken down by subject.
 * Parent view only: completed work, results by subject, and patterns across
 * them. The five-question missed-skill drill (PractiseMissedSkills) lives
 * on the student's own /results page after an eligible test; the parent
 * dashboard cannot launch it, so no parent copy or sample may offer it.
 * The weekly card is a labelled sample, not a real child.
 */
export const forParents = {
  eyebrow: "For parents",
  heading: "Clearer support for parents.",
  intro:
    "See what your child has worked on, where they're progressing and what may need attention — without turning progress into another spreadsheet to interpret.",
  image: {
    treatment: "face-visible",
    src: "/landing/campaign/parent-laptop-clean.webp",
    alt: "A parent sits at a laptop with a softly blurred screen while a child writes in a notebook at the desk nearby",
    width: 1672,
    height: 941,
  },
  summary: {
    name: "Aisha · Year 3",
    dateRange: "This week, Mon 28 Sep – Sun 4 Oct",
    badge: "Sample",
    week: [
      { day: "Mon", done: true },
      { day: "Tue", done: true },
      { day: "Wed", done: false },
      { day: "Thu", done: true },
      { day: "Fri", done: false },
      { day: "Sat", done: false },
      { day: "Sun", done: false },
    ],
    rows: [
      { label: "NAPLAN-style Numeracy · practice", count: 14, total: 20, when: "Mon" },
      { label: "Language conventions · timed test", count: 9, total: 15, when: "Tue" },
      { label: "ICAS-style Reading · practice", count: 8, total: 10, when: "Thu" },
    ],
    nextStepLabel: "Recent pattern:",
    nextStep:
      "Language conventions had the lowest result this week, 9 of 15 correct on Tuesday's test.",
  },
  blurbs: [
    {
      title: "See recent learning",
      body: "With a free parent account, see what your child has completed and practised, with each finished set and test saved.",
    },
    {
      title: "Understand progress",
      body: "See patterns across subjects and programs rather than just individual scores.",
    },
    {
      title: "Know what to do next",
      body: "See where results suggest your child may need more practice, then use their results with them to choose what to revisit.",
    },
  ],
  planNote:
    "Plain-language observations and suggested next steps inside the parent view will be part of the Family plan, which isn't open yet.",
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

/**
 * The deep-purple quality band. Four evidenced points — no testimonials,
 * stats or claims of educator review: the published pipeline has
 * automated checks and no human review step (see resourceArticles'
 * "how-we-check-questions"), so "automated" is the accurate word.
 */
export const qualityBand = {
  statement: "Every question is written for MindMosaic, and every practice answer comes with the working.",
  link: { label: "How we write and check questions", href: `${routes.resources}/how-we-check-questions` },
  points: [
    {
      title: "Original questions",
      body: "Written for MindMosaic — not copied from past papers or third-party test banks.",
    },
    {
      title: "Worked explanations",
      body: "Answers show the reasoning, right or wrong, so students can understand how to improve.",
    },
    {
      title: "Automated publication checks",
      body: "Answer keys, formatting and originality are checked automatically before a question goes live.",
    },
    {
      title: "Designed for Australian learners",
      body: "Australian English, familiar curriculum language and accessible learning experiences.",
    },
  ],
} as const;

/* ---------- Built carefully + designed for families ---------- */

/**
 * Evidence and trust, without numbers: question counts move daily and are
 * not a figure this page can keep honest, so the proof is qualitative.
 * `testimonials` is deliberately empty — none have been collected — and
 * the section renders a testimonial row only when real ones are added.
 *
 * Privacy points are lifted from the About page's "Privacy, in plain
 * terms" (`about.privacy`); no compliance or certification is claimed.
 */
export const trustAndCare = {
  evidence: {
    eyebrow: "How it's made",
    heading: "Built carefully. Not generated carelessly.",
    intro: "A question bank is easy to fill. We'd rather every item earn its place.",
    points: [
      {
        title: "Original content",
        body: "Questions are created specifically for MindMosaic, in the style of each assessment — never sourced from past papers.",
      },
      {
        title: "Worked reasoning",
        body: "Students can see how every practice answer is reached, step by step.",
      },
      {
        title: "Structured checks",
        body: "A question that fails a correctness, structure or originality check is never published.",
      },
    ],
    disclaimer: { label: "Assessment disclaimer", href: routes.disclaimer },
  },
  testimonials: [] as readonly { quote: string; name: string; role: string }[],
  care: {
    heading: "Designed with children and families in mind.",
    points: [
      {
        id: "privacy",
        title: "Privacy",
        body: "A parent creates each student profile, which holds a first name and year level. Students sign in with a code and PIN, never an email. No selling of personal information, and no third-party advertising.",
        link: { label: "Privacy", href: routes.privacy },
      },
      {
        id: "accessibility",
        title: "Accessible learning",
        body: "Readable layouts, keyboard support, visible focus, strong contrast, text alternatives for diagrams and reduced-motion support.",
        link: { label: "Accessibility", href: routes.accessibility },
      },
      {
        id: "responsible",
        title: "Responsible technology",
        body: "Technology supports learning rather than replacing good explanations. Suggestions follow fixed rules you can understand.",
        link: { label: "Terms", href: routes.terms },
      },
    ],
  },
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
 *  - The monthly and yearly cards show "Price to be confirmed", not a real
 *    figure: src/lib/billing/prices.ts's amounts are still placeholders
 *    (FAMILY_PLAN_AVAILABILITY === "roadmap"), and no public page may
 *    display them until that flips. Both cards' CTA is "Register
 *    interest" → /contact, never a "Subscribe" link to a checkout that
 *    cannot yet take a real payment.
 *
 * The Individual learner tier is genuinely unpriced. It is not a fourth
 * card (the design has three); it sits under the comparison table, where
 * "still being confirmed" reads as a fact rather than an offer.
 */

export const plans = {
  eyebrow: "Plans",
  heading: "Three ways to access MindMosaic.",
  intro:
    "Guest practice is free today and is never gated behind a subscription. The Family plan is still being finalised, so it can't be bought yet.",
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
      price: "Price to be confirmed" as string | null,
      cadence: null as string | null,
      note: "Billing and refund terms are being finalised before checkout opens.",
      pending: false,
      features: [
        "Everything in guest practice, kept",
        "Progress saved across sessions and devices",
        "Exam simulations with results and explanations",
        "Parent view with skill-by-skill reporting",
        `Up to ${FAMILY_PLAN.maxChildren} student profiles`,
        "Cancel any time",
      ],
      cta: { label: "Register interest", href: routes.contact },
      highlighted: true,
      tone: "default" as const,
    },
    {
      id: "family-annual",
      eyebrow: "Best value",
      name: "Family year",
      body: "The same Family access, paid twelve months at a time.",
      price: "Price to be confirmed" as string | null,
      cadence: null as string | null,
      note: "Billing and refund terms are being finalised before checkout opens.",
      pending: false,
      features: [
        "Everything in the monthly plan",
        "Twelve months of access",
        "One parent view across every child",
      ],
      cta: { label: "Register interest", href: routes.contact },
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
    "MindMosaic is an independent learning platform, not affiliated with or endorsed by ACARA, Janison or the Australian Maths Trust. We write every question ourselves, explain every answer, and report progress in language a family can act on.",
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

/* ---------- Resources index (Public/Resources.dc.html) ---------- */

export const resourcesPage = {
  eyebrow: "Resources",
  heading: "Resources",
  intro:
    "Short guides for parents and students, and the details behind how MindMosaic works. More guides are being written.",
  image: { assetId: "MM-HERO-03", alt: "A girl in a purple cardigan reads a purple book at a table" },
  published: [
    {
      kind: "For parents",
      title: "Parent guide",
      blurb: "Setting up your child, what the weekly view shows, and how to talk about results.",
      cta: "Read the guide",
      href: routes.parentGuide,
    },
    {
      kind: "For students",
      title: "Student tips",
      blurb: "Signing in with your code and PIN, using explanations, and sitting a timed paper.",
      cta: "Read the tips",
      href: routes.studentTips,
    },
    {
      kind: "About the content",
      title: "How we write and check questions",
      blurb: "Original questions, worked explanations and the automated checks before publication.",
      cta: "Read more",
      href: `${routes.resources}/how-we-check-questions`,
    },
    {
      kind: "About the content",
      title: "Assessment disclaimer",
      blurb: "What “-style” practice means and how MindMosaic relates to official assessments.",
      cta: "Read the disclaimer",
      href: routes.disclaimer,
    },
    {
      kind: "Support",
      title: "Help and contact",
      blurb: "Answers to common questions, and how to reach us.",
      cta: "Get help",
      href: routes.help,
    },
  ],
  /** Not from the repo — confirm this exact list before launch (handoff FACT_LOG). */
  beingWritten: [
    { title: "Before a first timed paper", blurb: "Getting ready without pressure." },
    { title: "Singapore Maths and bar models", blurb: "Will be published with the Singapore Maths programme." },
  ],
  policies: {
    heading: "Policies",
    intro: "Privacy, terms and accessibility statements are drafts and are not final legal text yet.",
    links: [
      { label: "Privacy (draft)", href: routes.privacy },
      { label: "Terms (draft)", href: routes.terms },
      { label: "Accessibility (draft)", href: routes.accessibility },
    ],
  },
} as const;

/* ---------- /resources/[slug] articles ---------- */

export const resourceArticles = {
  "how-we-check-questions": {
    title: "How we write and check questions",
    intro:
      "Every question on MindMosaic is original. Before it is ever shown to a student, it passes a chain of automated checks — there is no human educator review today, and the product never claims one.",
    sections: [
      {
        heading: "Written, not sourced",
        body: "No question is copied or adapted from a past paper, textbook or licensed bank. Each one is written for MindMosaic, in the style of the named assessment, and reviewed against that style's real format and difficulty.",
      },
      {
        heading: "Automated publication checks",
        body: "Before publication, a question passes structural validation (does it parse into a real question, with a real answer key and the right number of options), a correctness check, a semantic review and an originality check against the rest of the bank. A question that fails any gate is not published.",
      },
      {
        heading: "What this is not",
        body: "This is not a claim of “educator reviewed” or “teacher checked.” MindMosaic does not have a human review step in the published pipeline today, and says so rather than implying one.",
      },
      {
        heading: "If something looks wrong",
        body: "Tell us the programme, year and question number from the Help and contact page. We check it and correct the question if needed.",
      },
    ],
  },
} as const;

export type ResourceArticleSlug = keyof typeof resourceArticles;

/* ---------- Help and contact (Public/Help.dc.html) ---------- */

export const helpPage = {
  heading: "Help and contact",
  intro: "Quick answers to common questions. If yours isn’t here, send us a message.",
  faqs: [
    {
      question: "My child can’t sign in",
      answer:
        "Students sign in with a login code and a PIN that is exactly 6 digits. The code isn’t case sensitive. A parent can look up a child’s login details, including resetting the PIN, from Children in their account — there isn’t a self-service reset from the student sign-in screen itself.",
    },
    {
      question: "I forgot my parent password",
      answer: "Use “Forgot password” on the Log in page. We’ll email a link to set a new one.",
    },
    {
      question: "Why can’t I find Year 4 practice?",
      answer:
        "Only Years 3 and 5 are open now. Other year levels appear on Programs once there are enough checked questions for a full set.",
    },
    {
      question: "I think an answer is wrong",
      answer:
        "Tell us the programme, year and question number using the form below. We’ll check it and correct the question if needed.",
    },
    {
      question: "When can I buy the Family plan?",
      answer: "Not yet. The price is still to be confirmed. You can register interest on Plans.",
    },
    {
      question: "Can I reset my child’s practice history?",
      answer:
        "There isn’t a self-service “reset progress” button today — we’d rather say that plainly than imply a feature that isn’t built yet. Email us from the parent account’s address and we’ll action it directly.",
    },
  ],
  contact: {
    heading: "Still stuck?",
    /*
     * The design draws a three-field form with no real send endpoint
     * behind it (setTimeout fakes success/failure) — this product has a
     * deliberate "no contact form" policy instead (see /help's own prior
     * copy): one real email address that reaches a person, so nothing
     * here can claim to have been "sent" when it was not.
     */
    intro: "There’s no contact form on MindMosaic — just one real email address that reaches a person.",
    note: "Please don’t include your child’s login code or PIN in an email.",
  },
} as const;

/**
 * FAQ and the closing CTA. Every answer is a current product fact: what
 * is live (programmeStatus in content), guest practice without an
 * account, the Family plan's roadmap status (src/lib/billing/prices.ts),
 * the rule-based recommendations and the automated question checks.
 */
export const faqAndStart = {
  eyebrow: "Questions",
  heading: "Questions families ask.",
  items: [
    {
      question: "Which year levels and programs does MindMosaic support?",
      answer:
        "Today: NAPLAN-style Numeracy, Reading and Language Conventions, and ICAS-style Mathematics, Reading and Language, for Years 3 and 5. Curriculum lessons are limited and open to signed-in students. Wider year levels and the advanced pathways — AMC-style, selective-entry and scholarship preparation — are being built, and Programs shows the status of each.",
    },
    {
      question: "What is the difference between learning, practice and exam preparation?",
      answer:
        "Learning explains a concept with a worked example. Practice gives feedback and a worked explanation after each question. Exam preparation is sat like a paper: answer, flag and review, then submit to see your results and the explanations.",
    },
    {
      question: "Can parents see student progress?",
      answer:
        "Yes. With a free parent account you add each child, who signs in with a login code and PIN. Their finished sets and tests are saved, and you can see them, with results by subject, from the parent view.",
    },
    {
      question: "Are MindMosaic questions original?",
      answer:
        "Yes. Every question is written for MindMosaic. None is copied or adapted from past papers, textbooks or licensed banks, and each passes automated correctness, structure and originality checks before it is published.",
    },
    {
      question: "How does MindMosaic use AI or personalised technology?",
      answer:
        "The suggestions on a results page — such as which skills to practise after a test — come from fixed rules applied to the student's answers, not from a chatbot. Students are never chatting with an AI.",
    },
    {
      question: "Is MindMosaic aligned with Australian learning and assessment formats?",
      answer:
        "Practice is written in Australian English and follows the formats and year levels of NAPLAN and ICAS. MindMosaic is independent: it is not affiliated with or endorsed by ACARA, Janison or the Australian Maths Trust, and its materials are not official papers. Exact curriculum mapping for lessons is still being confirmed.",
    },
    {
      question: "Can I try MindMosaic before paying?",
      answer:
        "Yes. Guest practice is free and needs no account. A free parent account saves your child's progress. The Family plan, for up to three children, isn't open for purchase yet — its price is to be confirmed on Plans.",
    },
  ],
  card: {
    heading: "Start with one practice set.",
    body: "No complicated setup. Choose a program, answer a few questions and see how MindMosaic works.",
    primaryCta: { label: "Start free", href: routes.startFree },
    secondaryCta: { label: "Explore programs", href: routes.programs },
    helpLink: { label: "Help and contact", href: routes.help },
  },
} as const;

/* ---------- Closing CTA ---------- */

export const closing = {
  heading: "Give every session a clear purpose.",
  body: "Learning, practice and exam preparation for Australian students across primary and secondary years.",
  primaryCta: { label: "Start free", href: routes.startFree },
  secondaryCta: { label: "Explore practice", href: routes.practice },
  tertiaryCta: { label: "Learn how it works", href: routes.howItWorks },
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
  tagline: "Learning, practice and exam preparation for Australian students, written in Australian English.",
  /** Components/Site Footer.dc.html's three columns, verbatim. */
  columns: [
    {
      title: "Product",
      links: [
        { label: "How It Works", href: routes.howItWorks },
        { label: "Plans", href: routes.pricing },
        { label: "Log in", href: routes.signIn },
        { label: "Start free", href: routes.startFree },
      ],
    },
    {
      title: "Programs",
      links: [
        { label: "All programs", href: routes.programs },
        { label: "NAPLAN-style", href: `${routes.programs}/naplan-style` },
        { label: "ICAS-style", href: `${routes.programs}/icas-style` },
        { label: "Curriculum learning", href: routes.learn },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help and contact", href: routes.help },
        { label: "Resources", href: routes.resources },
        { label: "About", href: routes.about },
      ],
    },
  ],
  /** Bottom legal row — real pages, not the design's shared placeholder link. */
  legalLinks: [
    { label: "Privacy", href: routes.privacy },
    { label: "Terms", href: routes.terms },
    { label: "Accessibility", href: routes.accessibility },
    { label: "Assessment disclaimer", href: routes.disclaimer },
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
  copyright: "© 2026 MindMosaic. Made in Australia.",
} as const;
