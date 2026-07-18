/**
 * All landing-page copy and structured content in one place, so words can be
 * edited without touching layout. Testimonials, ratings and metrics are
 * placeholders and are rendered with a visible placeholder label — see
 * `socialProof.disclaimer`.
 */

export const nav = {
  links: [
    { label: "Product", href: "#product" },
    { label: "Subjects", href: "#subjects" },
    { label: "Question Formats", href: "#formats" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Progress", href: "#progress" },
    { label: "Pricing", href: "#pricing" },
    { label: "Resources", href: "#faq" },
  ],
  signIn: { label: "Sign in", href: "/" },
  cta: { label: "Try a free session", href: "/" },
} as const;

export const hero = {
  eyebrow: "Original NAPLAN-style and ICAS-style practice · Grades 3 & 5",
  headline: ["Know exactly what", "to practise next."],
  subheadline:
    "MindMosaic gives Grade 3 and Grade 5 children calm, on-screen practice in the styles of NAPLAN and ICAS — every question written from scratch — and shows parents the skill behind every score, so the next session always has a purpose.",
  primaryCta: { label: "Try a free session", href: "/" },
  secondaryCta: { label: "See how it works", href: "#how-it-works" },
  trustPoints: [
    "Every question original — nothing copied from real tests",
    "Timed and untimed modes",
    "Results broken down by skill, not just a score",
  ],
  disclaimer:
    "Independent practice platform. Not affiliated with or endorsed by ACARA (NAPLAN) or ICAS Assessments.",
} as const;

export const problems = {
  heading: "Does practice sometimes feel harder than the test itself?",
  intro:
    "Most families we talk to aren't short on effort. They're short on information — about what's actually going wrong and what to do about it.",
  items: [
    {
      who: "Child",
      title: "The same mistake keeps coming back",
      body: "She gets fraction questions wrong on Monday, again on Thursday, and nobody can say why — the worksheet only says “incorrect”.",
    },
    {
      who: "Parent",
      title: "A score without a story",
      body: "You see 68% and have no idea if that's a reading problem, a two-step-problem problem, or ten careless slips in a row.",
    },
    {
      who: "Child",
      title: "Unfamiliar formats rattle confidence",
      body: "The first time he meets a drag-to-order or select-all-that-apply question shouldn't be on test day. Guessing at the format steals marks from things he actually knows.",
    },
    {
      who: "Both",
      title: "Sessions drag, so practice stops",
      body: "A 90-minute paper on a school night ends in tears twice, and suddenly it's been three weeks since anyone opened the workbook.",
    },
    {
      who: "Child",
      title: "Rushing or coasting — nothing in between",
      body: "Always-timed practice teaches racing. Never-timed practice makes the real clock a shock. Children need both, at the right moments.",
    },
    {
      who: "Parent",
      title: "Paper worksheets aren't the real thing",
      body: "NAPLAN is on a screen, with charts to read, menus to choose from and numbers to type. A photocopied booklet can't rehearse any of that.",
    },
  ],
} as const;

export const productIntro = {
  heading: "Practice sessions that explain themselves",
  paragraphs: [
    "MindMosaic is an online practice platform for Grade 3 and Grade 5 children preparing for NAPLAN and ICAS-style assessments. A session is a short, focused set of questions in one subject — Numeracy, Reading, Conventions of Language, ICAS-style English or ICAS-style Mathematics — completed on screen, the way the real assessments work.",
    "Children choose timed or untimed, work through a mix of question formats, and get their marks straight away for anything that can be marked automatically. Short-answer and writing questions go to a guided review, with a marking guide a parent can follow in a couple of minutes.",
    "Parents see more than a score. Every question is tagged to a skill, so after each session you can see that “interpreting bar charts” is solid but “fractions of a quantity” needs another look — and pick the next session accordingly.",
  ],
  originality: {
    title: "Original questions, written for MindMosaic",
    body: "Every question on the platform is written from scratch in the style of the assessment it prepares for. Nothing is copied from official past papers, textbooks, other websites or commercial question banks — so children practise the thinking, not leaked answers.",
  },
} as const;

export const features = {
  heading: "Built around how children actually practise",
  intro:
    "No filler. Each of these exists because a real practice session needs it.",
  items: [
    {
      icon: "GraduationCap",
      title: "Grade-based practice paths",
      body: "Grade 3 and Grade 5 each get their own question bank, difficulty range and reading load — a Grade 3 child never trips over Grade 5 vocabulary.",
      example: "Switch a profile from Grade 3 to Grade 5 and every subject re-scopes itself.",
    },
    {
      icon: "BookOpenCheck",
      title: "Five subject areas",
      body: "NAPLAN-style Numeracy, Reading and Conventions of Language, plus ICAS-style English and Mathematics — each with its own question styles.",
      example: "A Conventions session mixes spelling, punctuation and grammar the way the real test does.",
    },
    {
      icon: "BarChart3",
      title: "Interactive visual questions",
      body: "Bar charts, line graphs, pie charts, tables, number lines, geometry and fraction diagrams rendered on screen — not photocopied and squinted at.",
      example: "“The number line shows the position of P. What number is P?” — read it, type the answer.",
    },
    {
      icon: "Timer",
      title: "Timed and untimed modes",
      body: "Untimed for learning a format, timed for rehearsing pace. Families choose per session, and the timer can always be turned off.",
      example: "First bar-chart session untimed; the following week, the same skill with the clock on.",
    },
    {
      icon: "Zap",
      title: "Instant marking",
      body: "Multiple choice, number entry, matching, ordering and other objective formats are marked the moment the session is submitted.",
      example: "Submit at 4:32pm, see the result at 4:32pm — while the questions are still fresh.",
    },
    {
      icon: "ClipboardCheck",
      title: "Guided review for written answers",
      body: "Short answers and writing tasks get a marking guide with the things a marker looks for, so a parent can review them fairly in minutes.",
      example: "“Does the answer name the character AND give a reason from the text?” — tick, tick, done.",
    },
    {
      icon: "Puzzle",
      title: "Skill-level breakdowns",
      body: "Every question is tagged to a skill. Results roll up from question, to skill, to subject — so a 68% always comes with its reasons.",
      example: "“Multiplication facts 9/10 · Two-step problems 3/6” tells you Monday's session should be two-step problems.",
    },
    {
      icon: "Users",
      title: "Parent and child profiles",
      body: "One family account, separate child profiles. Children see their own calm view; parents see every child's results side by side.",
      example: "A Grade 3 and a Grade 5 sibling share one account and never see each other's scores.",
    },
    {
      icon: "Smile",
      title: "Child-friendly progress view",
      body: "Children see skills they've grown and what to try next — never a red wall of failures or a class ranking.",
      example: "“You've moved Number Lines from 2 tiles to 4 tiles” lands very differently from “48%”.",
    },
    {
      icon: "TrendingUp",
      title: "Difficulty progression",
      body: "Sessions start approachable and step up as accuracy grows, so confidence and challenge rise together instead of colliding.",
      example: "Three strong fraction sessions in a row unlock the harder mixed-number set.",
    },
    {
      icon: "History",
      title: "Practice history",
      body: "Every completed session is kept — date, subject, mode, score and question-by-question review — so you can see consistency, not just peaks.",
      example: "“Four Reading sessions this month, scores climbing 55 → 60 → 70 → 75” is the trend that matters.",
    },
    {
      icon: "Accessibility",
      title: "Accessible and keyboard-friendly",
      body: "Full keyboard support, visible focus states, strong contrast and reduced-motion support — because practice should work for every child.",
      example: "A child who prefers the keyboard can answer an entire session without touching the mouse.",
    },
  ],
} as const;

export const audiences = {
  heading: "One platform, two very different jobs",
  child: {
    title: "For children",
    subtitle: "Calm screens, clear questions, visible progress.",
    points: [
      "A quiet, uncluttered question screen — one question at a time, nothing flashing",
      "The same session routine every time, so starting practice stops being a negotiation",
      "Every question format met in practice first, so nothing on test day looks new",
      "Feedback that explains, not just marks — see the why behind a wrong answer",
      "Progress shown as skills growing, never as rankings or red crosses",
      "Sessions sized for a school night — finish in 15–30 minutes, not 90",
      "Mistakes stay private to the family — practice is where it's safe to be wrong",
    ],
  },
  parent: {
    title: "For parents",
    subtitle: "See the skill behind the score, without hovering.",
    points: [
      "Know what your child is actually struggling with — by skill, not by vibe",
      "Read results the way a teacher would: subject, then skill, then question",
      "See practice consistency across weeks, not just the latest score",
      "Choose the next focus area from evidence instead of guesswork",
      "Follow a marking guide for written answers — no marking expertise needed",
      "Support steady progress without turning the kitchen table into an exam hall",
    ],
  },
} as const;

export const subjects = {
  heading: "Two grades, five subject areas",
  intro:
    "Every subject is available for both grades, scoped to what each grade is actually asked to do.",
  grades: [
    {
      grade: "Grade 3",
      blurb: "Shorter passages, friendlier numbers, formats introduced gently.",
      accent: "brand" as const,
    },
    {
      grade: "Grade 5",
      blurb: "Denser passages, multi-step problems, the full spread of formats.",
      accent: "accent" as const,
    },
  ],
  areas: [
    {
      name: "NAPLAN Numeracy",
      style: "NAPLAN-style",
      body: "Number, algebra, measurement, geometry, statistics and probability — heavy on charts, tables and number lines.",
    },
    {
      name: "NAPLAN Reading",
      style: "NAPLAN-style",
      body: "Original fiction and information passages with comprehension questions that ask for evidence, not just recall.",
    },
    {
      name: "NAPLAN Conventions of Language",
      style: "NAPLAN-style",
      body: "Spelling, grammar and punctuation in the mixed formats the on-screen test uses, including dropdowns and error-spotting.",
    },
    {
      name: "ICAS-style English",
      style: "ICAS-style",
      body: "Reasoning-rich reading and language questions in the trickier, inference-led ICAS register.",
    },
    {
      name: "ICAS-style Mathematics",
      style: "ICAS-style",
      body: "Problem solving that rewards thinking in steps — patterns, logic and applied number work.",
    },
  ],
} as const;

export const formats = {
  heading: "Every format they'll meet, met early",
  intro:
    "Marks are lost to unfamiliar formats as often as to unfamiliar content. MindMosaic covers the full spread, so the format is never the surprise.",
  interactionFormats: [
    { name: "Multiple choice", note: "Choose the best answer" },
    { name: "Multiple select", note: "More than one answer is right" },
    { name: "Number entry", note: "Type the number" },
    { name: "Fill in the blank", note: "Complete the sentence" },
    { name: "Dropdown", note: "Pick from a menu, mid-sentence" },
    { name: "True / false", note: "Judge each statement" },
    { name: "Matching", note: "Pair related items" },
    { name: "Ordering", note: "Put the steps in sequence" },
    { name: "Short answer", note: "A sentence of your own" },
    { name: "Reading comprehension", note: "Answer from the passage" },
  ],
  visuals: [
    "Bar charts",
    "Line graphs",
    "Pie charts",
    "Tables",
    "Number lines",
    "Geometry",
    "Fractions",
    "Diagrams",
  ],
  markingNote:
    "Objective formats are marked instantly. Short answers and writing get a guided review with a parent-friendly marking guide. Essay-style support is included where a subject calls for extended writing.",
} as const;

export const experience = {
  heading: "What a session looks like from the child's chair",
  intro:
    "The screen stays out of the way so the thinking can happen. Here's the anatomy of a question.",
  points: [
    {
      title: "One clean question at a time",
      body: "Generous type, clear spacing, no sidebars competing for attention.",
    },
    {
      title: "A timer that behaves",
      body: "In timed mode it sits quietly in the corner; in untimed mode it isn't there at all.",
    },
    {
      title: "Progress that's honest",
      body: "A simple “question 8 of 24” and a tile strip — no percentage anxiety mid-session.",
    },
    {
      title: "Flag and come back",
      body: "Unsure? Flag it, move on, and the review screen brings you back before submitting.",
    },
    {
      title: "Visuals built for screens",
      body: "Charts and number lines drawn crisply at any size, described for screen readers.",
    },
    {
      title: "Results while it's fresh",
      body: "Submit, and instantly-markable questions show right, wrong and why — straight away.",
    },
  ],
} as const;

export const progressSection = {
  heading: "After the session: a result you can act on",
  intro:
    "A score tells you how the session went. The skill breakdown tells you what to do next. Both take under a minute to read.",
  parentSees: [
    "Total score and subject result for the session",
    "Skill-by-skill breakdown — strongest to weakest, with question counts",
    "Strengths to celebrate out loud on the drive to school",
    "Areas to revisit, each linked to a suggested next session",
    "Question-level review: the question, their answer, the right answer, the why",
    "Practice history across weeks — consistency, trend and mode mix",
  ],
} as const;

export const howItWorks = {
  heading: "Four steps, repeated weekly",
  intro:
    "The routine is the product. A predictable loop families can actually keep.",
  steps: [
    {
      title: "Choose child, grade and subject",
      body: "Pick a child profile, confirm the grade, choose one of the five subject areas.",
    },
    {
      title: "Pick timed or untimed",
      body: "Learning a new format? Go untimed. Rehearsing pace? Put the clock on.",
    },
    {
      title: "Complete the session",
      body: "A 15–30 minute mix of interactive questions, with flag-and-review before submitting.",
    },
    {
      title: "Review and choose the next focus",
      body: "Read the skill breakdown together, celebrate a strength, pick one area to revisit.",
    },
  ],
} as const;

export const socialProof = {
  heading: "What families tell us",
  disclaimer:
    "Illustrative placeholders. MindMosaic is in early access — these quotes, ratings and numbers show how this section will work, and are not real reviews or usage figures.",
  testimonials: [
    {
      quote:
        "The breakdown finally told us it wasn't ‘maths’ — it was reading two-step problems too fast. We practised exactly that for a fortnight and watched it turn around.",
      name: "Placeholder — parent, Grade 5",
      stars: 5,
    },
    {
      quote:
        "My daughter used to freeze on the drag-and-order questions. Now she says ‘oh, it's one of those’ and just does it.",
      name: "Placeholder — parent, Grade 3",
      stars: 5,
    },
    {
      quote:
        "I like that it tells me why the answer was wrong and I can try another one like it.",
      name: "Placeholder — child, Grade 5",
      stars: 5,
    },
    {
      quote:
        "The skill tags map cleanly to what I'd assess in class. The guided marking notes for written answers are pitched just right for parents.",
      name: "Placeholder — primary teacher review",
      stars: 4,
    },
  ],
  metrics: [
    { value: "1,200+", label: "Original questions written", note: "placeholder" },
    { value: "10", label: "Question formats covered", note: "current" },
    { value: "5", label: "Subject areas × 2 grades", note: "current" },
    { value: "15–30 min", label: "Typical session length", note: "by design" },
  ],
} as const;

export const pricing = {
  heading: "Simple plans, sized for families",
  disclaimer:
    "Placeholder pricing. Plans and prices shown are illustrative while MindMosaic is in early access — billing is not live yet.",
  tiers: [
    {
      name: "Free",
      price: "$0",
      period: "",
      audience: "For trying MindMosaic properly, not a crippled demo.",
      features: [
        "1 child profile",
        "Sample sessions in every subject, both grades",
        "Timed and untimed modes",
        "Instant marking and question review",
        "Session history for the last 30 days",
      ],
      limits: "Rotating sample of the question bank; skill breakdown shows top-level skills only.",
      cta: "Start free",
      highlighted: false,
    },
    {
      name: "Family",
      price: "$12",
      period: "/month",
      audience: "For one or two children practising most weeks.",
      features: [
        "Up to 3 child profiles",
        "Full question bank, all subjects and formats",
        "Full skill-level breakdowns and trends",
        "Parent dashboard across children",
        "Guided review for written answers",
        "Unlimited practice history",
      ],
      limits: "Fair-use session limits apply.",
      cta: "Choose Family",
      highlighted: true,
    },
    {
      name: "Premium",
      price: "$19",
      period: "/month",
      audience: "For families who want the most guidance per session.",
      features: [
        "Everything in Family",
        "Up to 5 child profiles",
        "Priority access to new question sets",
        "Early access to personalised recommendations as they ship",
        "Early access to adaptive practice journeys",
      ],
      limits: "Roadmap features arrive here first; dates are indicative.",
      cta: "Choose Premium",
      highlighted: false,
    },
  ],
} as const;

export const faq = {
  heading: "Questions parents actually ask",
  items: [
    {
      q: "Is MindMosaic an official NAPLAN or ICAS product?",
      a: "No. MindMosaic is an independent practice platform and is not affiliated with, endorsed by or connected to ACARA (which runs NAPLAN) or ICAS Assessments. We write original questions in a similar style so children can practise the formats and thinking those assessments use.",
    },
    {
      q: "Are the questions copied from past tests?",
      a: "No. Every question is written from scratch for MindMosaic. Nothing is taken from official past papers, textbooks, other websites or commercial question banks.",
    },
    {
      q: "Which grades and subjects are supported?",
      a: "Grade 3 and Grade 5, each with five subject areas: NAPLAN-style Numeracy, Reading and Conventions of Language, plus ICAS-style English and Mathematics.",
    },
    {
      q: "Can my child practise without a timer?",
      a: "Yes. Every session can be run timed or untimed, and you can change mode per session. We suggest untimed while a format is new, then timed once it's familiar.",
    },
    {
      q: "How are answers marked?",
      a: "Objective formats — multiple choice, multiple select, number entry, dropdowns, true/false, matching, ordering and fill-in-the-blank — are marked instantly. Short answers and extended writing get a guided review with a marking guide a parent can follow.",
    },
    {
      q: "What happens with essay and short-answer questions?",
      a: "They're never auto-marked and never silently dropped. Each one comes with a parent-friendly marking guide listing what a good answer includes, so the review takes minutes and stays fair.",
    },
    {
      q: "Can parents see progress by skill?",
      a: "Yes — that's the heart of the product. Every question is tagged to a skill, and results roll up from question to skill to subject, across the whole practice history.",
    },
    {
      q: "Does it work on tablets and phones?",
      a: "Yes. MindMosaic runs in the browser and is designed mobile-first. Question interactions are touch-friendly, and the whole platform also works keyboard-only.",
    },
  ],
} as const;

export const finalCta = {
  heading: "One calm session this week beats a cramming weekend next term.",
  body: "Start with a free untimed session in any subject. See the skill breakdown, pick the next focus together, and let the routine do the work.",
  primaryCta: { label: "Try a free session", href: "/" },
  secondaryCta: { label: "Compare plans", href: "#pricing" },
} as const;

export const footer = {
  tagline: "Original practice, skill-level insight — for Grade 3 and Grade 5 families.",
  columns: [
    {
      title: "Product",
      links: [
        { label: "How it works", href: "#how-it-works" },
        { label: "Question formats", href: "#formats" },
        { label: "Progress & reporting", href: "#progress" },
        { label: "Pricing", href: "#pricing" },
      ],
    },
    {
      title: "Subjects",
      links: [
        { label: "NAPLAN Numeracy", href: "#subjects" },
        { label: "NAPLAN Reading", href: "#subjects" },
        { label: "Conventions of Language", href: "#subjects" },
        { label: "ICAS-style English", href: "#subjects" },
        { label: "ICAS-style Mathematics", href: "#subjects" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "FAQ", href: "#faq" },
        { label: "Practice portal", href: "/" },
        { label: "Contact", href: "mailto:hello@mindmosaic.app" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "#" },
        { label: "Terms", href: "#" },
        { label: "Accessibility", href: "#" },
        { label: "Sign in", href: "/" },
      ],
    },
  ],
  disclaimer:
    "MindMosaic is an independent practice platform. NAPLAN is administered by ACARA; ICAS is a trademark of its respective owner. MindMosaic is not affiliated with or endorsed by either. All practice questions are original.",
} as const;
