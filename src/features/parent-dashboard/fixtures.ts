/**
 * MindMosaic Parent Journey — Preview Fixtures & Mock Data
 *
 * Clearly isolated, type-safe preview fixtures for frontend rendering when backend
 * endpoints are deferred (per PR #105 trace and handoff instructions).
 *
 * NON-NEGOTIABLE BOUNDARY:
 * - Preview data is strictly isolated and labelled.
 * - These fixtures never mutate student attempt records or contaminate real accounts.
 * - Deletion timelines follow ADR-012 with zero unapproved time promises (Decision P11).
 */

import type { ChildSummary } from "./summary";

export interface PreviewChild {
  id: string;
  firstName: string;
  lastName?: string;
  yearLevel: number;
  curriculum: string;
  loginCode: string;
  pin: string;
  status: "active" | "paused";
  avatarColor: "purple" | "ember" | "teal" | "coral";
  finishedPapersCount: number;
  totalMarksEarned: number;
  totalMarksAvailable: number;
}

export interface PreviewPaperResult {
  id: string;
  childId: string;
  title: string;
  subject: "numeracy" | "reading" | "language" | "writing";
  date: string;
  timed: boolean;
  durationMinutes: number;
  allowedMinutes: number;
  marksEarned: number;
  marksAvailable: number;
  questionsAnswered?: number;
  totalQuestions?: number;
  pendingQuestions?: number;
  pendingMarks?: number;
  status: "finished" | "awaiting_person" | "awaiting_parent_marking";
  statusLabel?: string;
  strands: Array<{
    name: string;
    marksEarned: number;
    marksAvailable: number;
    papersCount?: number;
  }>;
}

export interface PreviewAnswerReviewItem {
  questionNumber: number;
  strand: string;
  questionText: string;
  studentAnswer: string;
  expectedAnswer: string;
  status: "correct" | "incorrect" | "unanswered" | "pending";
  marksEarned: number;
  marksAvailable: number;
  explanation?: string;
}

export interface SubjectMarksProgress {
  subject: string;
  label: string;
  marksEarned: number;
  marksAvailable: number;
  papersCount: number;
}

export interface StrandMarksProgress {
  strand: string;
  label: string;
  subject: string;
  marksEarned: number;
  marksAvailable: number;
  papersCount: number;
  belowFloor?: boolean;
}

export interface ProgressRecommendation {
  strandName: string;
  headline: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}

export interface ProgrammeAvailability {
  id: string;
  title: string;
  subject: string;
  status: "ready" | "not_written" | "could_not_check";
  questionCountEstimated?: number;
  setSizesDescription?: string;
  description?: string;
}

export interface PreviewSampleQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface PreviewHelpArticle {
  slug: string;
  title: string;
  category: string;
  lead: string;
  paragraphs: string[];
  note?: string;
  action?: {
    label: string;
    href: string;
  };
}

export const PREVIEW_CHILDREN: PreviewChild[] = [
  {
    id: "child-aisha",
    firstName: "Aisha",
    lastName: "Raman",
    yearLevel: 3,
    curriculum: "Victorian Curriculum v2.0",
    loginCode: "K7XJ-2P9R",
    pin: "482901",
    status: "active",
    avatarColor: "purple",
    finishedPapersCount: 4,
    totalMarksEarned: 41,
    totalMarksAvailable: 60,
  },
  {
    id: "child-kabir",
    firstName: "Kabir",
    lastName: "Raman",
    yearLevel: 5,
    curriculum: "Victorian Curriculum v2.0",
    loginCode: "M3TL-8R4Q",
    pin: "719304",
    status: "active",
    avatarColor: "ember",
    finishedPapersCount: 5,
    totalMarksEarned: 74,
    totalMarksAvailable: 95,
  },
  {
    id: "child-maya",
    firstName: "Maya",
    lastName: "Raman",
    yearLevel: 1,
    curriculum: "Victorian Curriculum v2.0",
    loginCode: "P4WZ-9X2L",
    pin: "194820",
    status: "paused",
    avatarColor: "teal",
    finishedPapersCount: 0,
    totalMarksEarned: 0,
    totalMarksAvailable: 0,
  },
];

export const PREVIEW_FAMILY_PLAN = {
  planName: "Family plan",
  maxPlaces: 3,
  activePlaces: 2,
  priceFormatted: "$24/month after 14-day trial",
  billingUrl: "/billing",
};

export const PREVIEW_RESULTS_AISHA: PreviewPaperResult[] = [
  {
    id: "res-numeracy-302",
    childId: "child-aisha",
    title: "NAPLAN-style Numeracy",
    subject: "numeracy",
    date: "4 Nov 2026",
    timed: true,
    durationMinutes: 32,
    allowedMinutes: 40,
    marksEarned: 14,
    marksAvailable: 20,
    questionsAnswered: 20,
    totalQuestions: 20,
    status: "finished",
    statusLabel: "Complete",
    strands: [
      { name: "Number and algebra", marksEarned: 8, marksAvailable: 12, papersCount: 1 },
      { name: "Statistics", marksEarned: 6, marksAvailable: 8, papersCount: 1 },
    ],
  },
  {
    id: "res-reading-301",
    childId: "child-aisha",
    title: "NAPLAN-style Reading",
    subject: "reading",
    date: "29 Oct 2026",
    timed: true,
    durationMinutes: 24,
    allowedMinutes: 30,
    marksEarned: 11,
    marksAvailable: 15,
    questionsAnswered: 14,
    totalQuestions: 15,
    pendingQuestions: 2,
    pendingMarks: 4,
    status: "awaiting_person",
    statusLabel: "2 awaiting a person",
    strands: [
      { name: "Finding information", marksEarned: 6, marksAvailable: 7, papersCount: 1 },
      { name: "Reading for meaning", marksEarned: 5, marksAvailable: 8, papersCount: 1 },
    ],
  },
  {
    id: "res-maths-303",
    childId: "child-aisha",
    title: "ICAS-style Mathematics",
    subject: "numeracy",
    date: "22 Oct 2026",
    timed: true,
    durationMinutes: 36,
    allowedMinutes: 40,
    marksEarned: 27,
    marksAvailable: 40,
    questionsAnswered: 40,
    totalQuestions: 40,
    status: "finished",
    statusLabel: "Complete",
    strands: [
      { name: "Number and algebra", marksEarned: 12, marksAvailable: 14, papersCount: 1 },
      { name: "Measurement and space", marksEarned: 4, marksAvailable: 10, papersCount: 1 },
      { name: "Statistics", marksEarned: 3, marksAvailable: 6, papersCount: 1 },
      { name: "Working mathematically", marksEarned: 8, marksAvailable: 10, papersCount: 1 },
    ],
  },
  {
    id: "res-reading-304",
    childId: "child-aisha",
    title: "Grade 3 Reading Practice",
    subject: "reading",
    date: "15 Oct 2026",
    timed: true,
    durationMinutes: 22,
    allowedMinutes: 30,
    marksEarned: 17,
    marksAvailable: 25,
    questionsAnswered: 25,
    totalQuestions: 25,
    status: "finished",
    statusLabel: "Complete",
    strands: [
      { name: "Reading for meaning", marksEarned: 11, marksAvailable: 15, papersCount: 1 },
      { name: "Finding information", marksEarned: 6, marksAvailable: 10, papersCount: 1 },
    ],
  },
];

export const PREVIEW_RESULTS_KABIR: PreviewPaperResult[] = [
  {
    id: "res-kabir-501",
    childId: "child-kabir",
    title: "Grade 5 Numeracy Paper 1",
    subject: "numeracy",
    date: "5 Nov 2026",
    timed: true,
    durationMinutes: 42,
    allowedMinutes: 50,
    marksEarned: 24,
    marksAvailable: 30,
    questionsAnswered: 30,
    totalQuestions: 30,
    status: "finished",
    statusLabel: "Complete",
    strands: [
      { name: "Number and algebra", marksEarned: 16, marksAvailable: 18, papersCount: 1 },
      { name: "Measurement and geometry", marksEarned: 8, marksAvailable: 12, papersCount: 1 },
    ],
  },
];

export const PREVIEW_RESULTS_MAYA: PreviewPaperResult[] = [];

export const PREVIEW_SUBJECTS_AISHA: SubjectMarksProgress[] = [
  {
    subject: "numeracy",
    label: "Numeracy",
    marksEarned: 41,
    marksAvailable: 60,
    papersCount: 3,
  },
  {
    subject: "reading",
    label: "Reading",
    marksEarned: 22,
    marksAvailable: 30,
    papersCount: 2,
  },
  {
    subject: "language_conventions",
    label: "Language conventions",
    marksEarned: 6,
    marksAvailable: 10,
    papersCount: 1,
  },
];

export const PREVIEW_STRANDS_AISHA: StrandMarksProgress[] = [
  {
    strand: "number_and_algebra",
    label: "Number and algebra",
    subject: "numeracy",
    marksEarned: 20,
    marksAvailable: 26,
    papersCount: 3,
  },
  {
    strand: "statistics",
    label: "Statistics",
    subject: "numeracy",
    marksEarned: 9,
    marksAvailable: 14,
    papersCount: 2,
  },
  {
    strand: "measurement_and_space",
    label: "Measurement and space",
    subject: "numeracy",
    marksEarned: 4,
    marksAvailable: 10,
    papersCount: 2,
  },
  {
    strand: "working_mathematically",
    label: "Working mathematically",
    subject: "numeracy",
    marksEarned: 4,
    marksAvailable: 4,
    papersCount: 1,
    belowFloor: true,
  },
];

export const PREVIEW_RECOMMENDATION_AISHA: ProgressRecommendation = {
  strandName: "Measurement and space",
  headline: "Our suggestion, not Aisha’s result",
  description:
    "Measurement and space has the lowest marks of the strands with enough behind them — 4 of 10 across 2 papers. A short set on reading scales and comparing lengths would be a sensible next step.",
  actionLabel: "See Measurement practice",
  actionHref: "/parent/curriculum-explorer?strand=measurement_and_space",
};

export const PREVIEW_ANSWER_REVIEW_READING: PreviewAnswerReviewItem[] = [
  {
    questionNumber: 1,
    strand: "Finding information",
    questionText: "What time does the morning ferry depart from the wharf?",
    studentAnswer: "At 7:15 am",
    expectedAnswer: "At 7:15 am",
    status: "correct",
    marksEarned: 1,
    marksAvailable: 1,
  },
  {
    questionNumber: 2,
    strand: "Finding information",
    questionText: "Where did Uncle Toby keep the spare boat keys?",
    studentAnswer: "In the rusted metal tin by the winch",
    expectedAnswer: "In the rusted metal tin by the winch",
    status: "correct",
    marksEarned: 1,
    marksAvailable: 1,
  },
  {
    questionNumber: 3,
    strand: "Finding information",
    questionText: "What is the main thing the second paragraph tells you about the lighthouse?",
    studentAnswer: "That it was built to warn ships",
    expectedAnswer: "That it was built to warn ships",
    status: "correct",
    marksEarned: 1,
    marksAvailable: 1,
  },
  {
    questionNumber: 4,
    strand: "Finding information",
    questionText: "Which bird species was observed nesting near the headland?",
    studentAnswer: "Sooty oystercatchers",
    expectedAnswer: "Sooty oystercatchers",
    status: "correct",
    marksEarned: 1,
    marksAvailable: 1,
  },
  {
    questionNumber: 5,
    strand: "Finding information",
    questionText: "What was the weather like when the crew first saw the flare?",
    studentAnswer: "A heavy sea mist with choppy swell",
    expectedAnswer: "A heavy sea mist with choppy swell",
    status: "correct",
    marksEarned: 1,
    marksAvailable: 1,
  },
  {
    questionNumber: 6,
    strand: "Reading for meaning",
    questionText: "How did Captain Miller know the tide had begun to turn?",
    studentAnswer: "The waterline marked the black kelp on the outer pilings",
    expectedAnswer: "The waterline marked the black kelp on the outer pilings",
    status: "correct",
    marksEarned: 1,
    marksAvailable: 1,
  },
  {
    questionNumber: 7,
    strand: "Reading for meaning",
    questionText: "Which word in the last sentence means the same as “enormous”?",
    studentAnswer: "rocky",
    expectedAnswer: "vast",
    status: "incorrect",
    marksEarned: 0,
    marksAvailable: 1,
    explanation:
      "Both words describe the cliff, but “vast” is about size and “rocky” is about what it is made of.",
  },
  {
    questionNumber: 8,
    strand: "Reading for meaning",
    questionText: "Why did the author compare the harbor fog to a woollen blanket?",
    studentAnswer: "Because it was white",
    expectedAnswer: "To emphasize how thick and suffocating the low fog felt across the bay",
    status: "incorrect",
    marksEarned: 0,
    marksAvailable: 1,
    explanation:
      "The metaphor suggests sensory density rather than simply color.",
  },
  {
    questionNumber: 9,
    strand: "Reading for meaning",
    questionText: "What prompted the town bells to ring at sunset?",
    studentAnswer: "The annual return of the migratory shearwaters",
    expectedAnswer: "The safe return of the trawler fleet before the squall",
    status: "incorrect",
    marksEarned: 0,
    marksAvailable: 1,
    explanation:
      "The warning sirens were rung for the boats rather than the bird flock.",
  },
  {
    questionNumber: 10,
    strand: "Finding information",
    questionText: "Who called the coastguard station first?",
    studentAnswer: "The harbourmaster on channel 16",
    expectedAnswer: "The harbourmaster on channel 16",
    status: "correct",
    marksEarned: 1,
    marksAvailable: 1,
  },
  {
    questionNumber: 11,
    strand: "Reading for meaning",
    questionText: "Put the four events in the order they happened.",
    studentAnswer: "Nothing — this one was left blank",
    expectedAnswer: "Storm, rescue, repair, reopening",
    status: "unanswered",
    marksEarned: 0,
    marksAvailable: 1,
    explanation:
      "Not answered rather than answered wrongly. Worth asking whether she ran out of time: this was the second-last question.",
  },
  {
    questionNumber: 12,
    strand: "Finding information",
    questionText: "How many lanterns were lit each night during winter?",
    studentAnswer: "Four brass oil lanterns",
    expectedAnswer: "Four brass oil lanterns",
    status: "correct",
    marksEarned: 1,
    marksAvailable: 1,
  },
  {
    questionNumber: 13,
    strand: "Reading for meaning",
    questionText: "What gave the crew confidence that the beacon was functioning?",
    studentAnswer: "The sweeping flash every twelve seconds across the reef",
    expectedAnswer: "The sweeping flash every twelve seconds across the reef",
    status: "correct",
    marksEarned: 1,
    marksAvailable: 1,
  },
  {
    questionNumber: 14,
    strand: "Finding information",
    questionText: "In your own words, explain why the keeper stayed through the storm.",
    studentAnswer:
      "Because he knew the boats would not see the rocks without the light and he did not want anyone to crash",
    expectedAnswer: "Awaiting human teacher review against the rubric criteria.",
    status: "pending",
    marksEarned: 0,
    marksAvailable: 2,
    explanation:
      "A written answer. Someone reads this and gives it a mark — usually within two school days. Until then it is not counted as right or wrong.",
  },
  {
    questionNumber: 15,
    strand: "Reading for meaning",
    questionText: "How did the community show appreciation to the lighthouse keeper?",
    studentAnswer:
      "They signed a brass plaque and held a welcoming ceremony at the town hall.",
    expectedAnswer: "Awaiting human teacher review against the rubric criteria.",
    status: "pending",
    marksEarned: 0,
    marksAvailable: 2,
    explanation:
      "A written answer. Someone reads this and gives it a mark — usually within two school days. Until then it is not counted as right or wrong.",
  },
];

export const PREVIEW_HELP_CATEGORIES = [
  {
    id: "getting-started",
    title: "Getting your child signed in",
    description: "Login codes, PINs, and what to do when one is lost.",
    countLabel: "6 answers",
    articles: [
      { slug: "forgotten-pin", title: "My child has forgotten their PIN" },
      { slug: "student-login-code", title: "Where to find your child's 8-character login code" },
      { slug: "sign-in-card", title: "Printing or saving a student sign-in card" },
      { slug: "multiple-devices", title: "Can a child sign in on multiple tablets or computers?" },
    ],
  },
  {
    id: "practice-papers",
    title: "Practice and papers",
    description: "What is recorded, what is not, and how long things take.",
    countLabel: "8 answers",
    articles: [
      { slug: "timed-practice", title: "How timed practice works and when to use it" },
      { slug: "pausing-papers", title: "Can a child pause a practice sitting halfway through?" },
      { slug: "question-types", title: "Multiple choice, short answer, and inline question types" },
    ],
  },
  {
    id: "understanding-results",
    title: "Understanding results",
    description: "Marks, strands, awaiting marking, and why there is no predicted band.",
    countLabel: "5 answers",
    articles: [
      { slug: "marks-not-bands", title: "Why MindMosaic reports marks rather than performance bands" },
      { slug: "predicted-band", title: "Why is there no predicted band?" },
      { slug: "evidence-floor", title: "What the 2-paper and 8-mark evidence floor means" },
      { slug: "awaiting-marking", title: "What does 'Awaiting marking' mean on written answers?" },
    ],
  },
  {
    id: "plan-payments",
    title: "Plan and payments",
    description: "Plans, places, invoices and cancelling.",
    countLabel: "7 answers",
    articles: [
      { slug: "family-places", title: "How paid places work on the Family plan" },
      { slug: "update-card", title: "Updating your payment card via the secure Stripe portal" },
      { slug: "invoices-receipts", title: "Where to view past invoices and VAT/GST receipts" },
    ],
  },
  {
    id: "privacy-family-data",
    title: "Privacy and your family’s data",
    description: "What we store, who can see it, and how to ask for a copy.",
    countLabel: "4 answers",
    articles: [
      { slug: "what-we-store", title: "What information does MindMosaic store about my children?" },
      { slug: "data-erasure", title: "Requesting verified account and child data deletion (ADR-012)" },
      { slug: "data-export", title: "Downloading a copy of your family's records" },
    ],
  },
  {
    id: "something-wrong",
    title: "Something is wrong",
    description: "A question that looks incorrect, a page that will not load.",
    countLabel: "3 answers",
    articles: [
      { slug: "something-wrong-question", title: "A question looks incorrect or has a typo" },
      { slug: "page-not-loading", title: "A page will not load or shows an error" },
    ],
  },
];

export const PREVIEW_HELP_ARTICLES: Record<string, PreviewHelpArticle> = {
  "forgotten-pin": {
    slug: "forgotten-pin",
    title: "My child has forgotten their PIN",
    category: "Getting your child signed in",
    lead: "You can generate a fresh 6-digit PIN at any time from your child's profile.",
    paragraphs: [
      "Reset it from their profile. Go to Children, choose the child, and press Reset PIN. You will see a new 6-digit PIN once, so write it down before you close the page.",
      "Resetting signs them out everywhere and nothing else changes — their login code stays the same and none of their work is affected.",
    ],
    note: "We only keep a scrambled copy of a PIN, which is why we cannot read the old one back to you.",
    action: {
      label: "Go to Children",
      href: "/parent/children",
    },
  },
  "student-login-code": {
    slug: "student-login-code",
    title: "Where to find your child's 8-character login code",
    category: "Getting your child signed in",
    lead: "Each child has a permanent student code that never changes.",
    paragraphs: [
      "Your child's 8-character login code (formatted like ABCD-1234) is displayed under Children on their card.",
      "Children enter this code followed by their 6-digit PIN to access their practice environment.",
    ],
    action: {
      label: "Go to Children",
      href: "/parent/children",
    },
  },
  "sign-in-card": {
    slug: "sign-in-card",
    title: "Printing or saving a student sign-in card",
    category: "Getting your child signed in",
    lead: "Printable cards make independent login easy for younger students.",
    paragraphs: [
      "From your child's profile, choose Print sign-in card to generate a wallet-sized sign-in card with their login code and instructions.",
      "The PIN is deliberately left blank on printed cards so you can write it in by hand for safety.",
    ],
    action: {
      label: "Go to Children",
      href: "/parent/children",
    },
  },
  "multiple-devices": {
    slug: "multiple-devices",
    title: "Can a child sign in on multiple tablets or computers?",
    category: "Getting your child signed in",
    lead: "Students can practice from any device with a modern browser.",
    paragraphs: [
      "Children can sign in on an iPad, laptop, desktop, or mobile phone. Their progress syncs automatically.",
      "Simultaneous active attempts on the exact same paper are prevented to maintain honest timing.",
    ],
    action: {
      label: "Go to Children",
      href: "/parent/children",
    },
  },
  "timed-practice": {
    slug: "timed-practice",
    title: "How timed practice works and when to use it",
    category: "Practice and papers",
    lead: "Realistic exam timing without unnecessary anxiety.",
    paragraphs: [
      "Practice papers provide timed and untimed modes. In timed mode, an unobtrusive countdown runs matching the official exam duration.",
      "We recommend beginning untimed so your child focuses on accuracy and reading technique, adding timed sessions once they are comfortable.",
    ],
    action: {
      label: "View Family Overview",
      href: "/parent",
    },
  },
  "pausing-papers": {
    slug: "pausing-papers",
    title: "Can a child pause a practice sitting halfway through?",
    category: "Practice and papers",
    lead: "Practice is designed to accommodate everyday interruptions.",
    paragraphs: [
      "If your child needs a break, they can pause their paper or simply close the browser window. Their responses and timer are saved.",
      "When they sign back in with their student code and PIN, they can resume directly.",
    ],
    action: {
      label: "View Family Overview",
      href: "/parent",
    },
  },
  "question-types": {
    slug: "question-types",
    title: "Multiple choice, short answer, and inline question types",
    category: "Practice and papers",
    lead: "MindMosaic mirrors authentic exam item formats.",
    paragraphs: [
      "Practice items include single-choice options, multi-select, short text entry, number entry, and drag/reorder questions.",
      "All objective item formats are marked automatically against the official scoring guide upon submission.",
    ],
  },
  "marks-not-bands": {
    slug: "marks-not-bands",
    title: "Why MindMosaic reports marks rather than performance bands",
    category: "Understanding results",
    lead: "Honest feedback means reporting what was scored, not speculative categories.",
    paragraphs: [
      "MindMosaic never displays evaluative performance bands (such as 'Exceeding', 'Strong', or 'Needs practice') on parent dashboards.",
      "Scores are reported strictly as marks earned out of marks available alongside the number of papers completed. Single papers do not carry enough statistical sample size to pigeonhole a child into arbitrary bands.",
    ],
    note: "Evaluative summaries require at least 2 finished papers and 8 scored marks before strand-level insights are shown.",
    action: {
      label: "View Family Overview",
      href: "/parent",
    },
  },
  "predicted-band": {
    slug: "predicted-band",
    title: "Why is there no predicted band?",
    category: "Understanding results",
    lead: "Official test bands require statewide cohort standardization.",
    paragraphs: [
      "We deliberately avoid inventing artificial 'predicted bands' or estimated percentiles. Official test bands depend on statewide cohort calibrations that cannot be duplicated from small practice samples.",
      "Instead, we give you precise strand marks, worked answers, and historical trends so you know exactly which question types your child has mastered.",
    ],
    action: {
      label: "View Family Overview",
      href: "/parent",
    },
  },
  "evidence-floor": {
    slug: "evidence-floor",
    title: "What the 2-paper and 8-mark evidence floor means",
    category: "Understanding results",
    lead: "Preventing early over-interpretation of minimal practice data.",
    paragraphs: [
      "Evaluative summaries are held back until a child completes at least 2 papers and 8 scored marks.",
      "Before that threshold is reached, the dashboard honestly displays 'Not enough yet' rather than pretending to detect trends from one single sitting.",
    ],
    action: {
      label: "View Family Overview",
      href: "/parent",
    },
  },
  "awaiting-marking": {
    slug: "awaiting-marking",
    title: "What does 'Awaiting marking' mean on written answers?",
    category: "Understanding results",
    lead: "Writing papers require human evaluation.",
    paragraphs: [
      "Objective multiple-choice and numeric questions are marked instantly. Written tasks remain in 'Awaiting marking' until marked using the official rubric.",
      "Awaiting marking items do not count as incorrect — they are excluded from earned marks until evaluated.",
    ],
    action: {
      label: "Go to Children",
      href: "/parent/children",
    },
  },
  "family-places": {
    slug: "family-places",
    title: "How paid places work on the Family plan",
    category: "Plan and payments",
    lead: "Manage multiple children under one plan.",
    paragraphs: [
      "A Family membership covers up to 3 active child profiles. Each child has their own independent login code, progress history, and practice recommendations.",
      "If you pause a child profile, that seat becomes available for another learner.",
    ],
    action: {
      label: "Go to Account",
      href: "/parent/account",
    },
  },
  "update-card": {
    slug: "update-card",
    title: "Updating your payment card via the secure Stripe portal",
    category: "Plan and payments",
    lead: "Payment details are stored securely by Stripe.",
    paragraphs: [
      "Go to Account → Plan & billing handoff, and click 'Payment methods'. This safely transfers you to the Stripe customer portal.",
      "Once updated, you are returned directly back to your Parent Account page.",
    ],
    action: {
      label: "Open Plan & billing",
      href: "/parent/account/billing",
    },
  },
  "invoices-receipts": {
    slug: "invoices-receipts",
    title: "Where to view past invoices and VAT/GST receipts",
    category: "Plan and payments",
    lead: "Download tax invoices and receipts at any time.",
    paragraphs: [
      "From Account → Plan & billing handoff, choose 'Invoices' to view and download past subscription receipts directly from the billing portal.",
    ],
    action: {
      label: "Open Plan & billing",
      href: "/parent/account/billing",
    },
  },
  "what-we-store": {
    slug: "what-we-store",
    title: "What information does MindMosaic store about my children?",
    category: "Privacy and your family’s data",
    lead: "We collect only what is strictly required to support learning.",
    paragraphs: [
      "We store first names (or nicknames), current year level, question attempts, and scored marks. We never collect dates of birth, street addresses, school names, or government student IDs.",
      "Child PINs are stored exclusively as one-way cryptographic hashes.",
    ],
    action: {
      label: "Go to Account",
      href: "/parent/account",
    },
  },
  "data-erasure": {
    slug: "data-erasure",
    title: "Requesting verified account and child data deletion (ADR-012)",
    category: "Privacy and your family’s data",
    lead: "MindMosaic supports verified guardian-authorized data erasure.",
    paragraphs: [
      "Under our data privacy architecture (ADR-012), data deletion is handled via a verified administrative request to hello@mindmosaic.app.",
      "Because educational records cannot be recovered once purged, deletion requires out-of-band email confirmation from the primary guardian account.",
    ],
    note: "If you simply want to pause practice without losing work, use the pause toggle on the child's profile instead.",
    action: {
      label: "Go to Account",
      href: "/parent/account",
    },
  },
  "data-export": {
    slug: "data-export",
    title: "Downloading a copy of your family's records",
    category: "Privacy and your family’s data",
    lead: "Download your family's complete learning history.",
    paragraphs: [
      "You can export a machine-readable JSON copy of all student profiles, sitting attempts, and scores directly from your Account settings.",
    ],
    action: {
      label: "Go to Account",
      href: "/parent/account",
    },
  },
  "something-wrong-question": {
    slug: "something-wrong-question",
    title: "A question looks incorrect or has a typo",
    category: "Something is wrong",
    lead: "Our curriculum editors review every flagged item.",
    paragraphs: [
      "If you notice an ambiguity, formatting glitch, or factual discrepancy in a question, send us a message selecting the relevant child and subject.",
      "Every question item in MindMosaic has a tamper-evident revision ID, allowing our educational team to trace the exact question version.",
    ],
  },
  "page-not-loading": {
    slug: "page-not-loading",
    title: "A page will not load or shows an error",
    category: "Something is wrong",
    lead: "Quick troubleshooting steps for browser and connectivity issues.",
    paragraphs: [
      "Try refreshing the page or checking your internet connection. MindMosaic caches active student question papers locally during sittings to guard against intermittent disconnects.",
      "If a screen consistently fails to load, send us a message or email hello@mindmosaic.app with details of your device and browser.",
    ],
  },
};

export const PREVIEW_FAMILY_OVERVIEW_SUMMARIES: readonly ChildSummary[] = [
  {
    childId: "child-aisha",
    displayName: "Aisha",
    yearLevel: 3,
    attemptCount: 4,
    unreadableAttemptCount: 0,
    latestPercentage: 84,
    previousPercentage: 78,
    averagePercentage: 81,
    attemptsThisWeek: 3,
    timeThisWeekSeconds: 3960,
    streakDays: 3,
    weekActivity: [
      { label: "Mon", practised: true, isToday: false },
      { label: "Tue", practised: false, isToday: false },
      { label: "Wed", practised: true, isToday: false },
      { label: "Thu", practised: false, isToday: false },
      { label: "Fri", practised: true, isToday: false },
      { label: "Sat", practised: false, isToday: false },
      { label: "Sun", practised: false, isToday: true },
    ],
    subjects: [
      {
        subject: "reading",
        label: "Reading",
        percentage: 86,
        marksEarned: 32,
        marksAvailable: 37,
        questionCount: 37,
        paperCount: 2,
      },
      {
        subject: "numeracy",
        label: "Numeracy",
        percentage: 78,
        marksEarned: 35,
        marksAvailable: 45,
        questionCount: 45,
        paperCount: 2,
      },
      {
        subject: "language_conventions",
        label: "Language conventions",
        percentage: 75,
        marksEarned: 15,
        marksAvailable: 20,
        questionCount: 20,
        paperCount: 1,
      },
    ],
    recentAttempts: [
      {
        id: "res-reading-301",
        submittedAt: "2026-11-08T10:15:00Z",
        submittedAtLabel: "8 Nov 2026",
        label: "Grade 3 · Reading Practice Paper 2",
        percentage: 84,
        marksEarned: 16,
        marksAvailable: 19,
        totalQuestions: 19,
        attemptedQuestions: 19,
        pendingManualReview: false,
      },
      {
        id: "res-num-302",
        submittedAt: "2026-11-06T16:40:00Z",
        submittedAtLabel: "6 Nov 2026",
        label: "Grade 3 · Numeracy Practice Paper 2",
        percentage: 78,
        marksEarned: 18,
        marksAvailable: 23,
        totalQuestions: 23,
        attemptedQuestions: 23,
        pendingManualReview: false,
      },
    ],
    readinessScore: 81,
    topicsMasteredCount: 2,
    observations: [
      "Consistent marks across 2 Reading papers (32/37 marks).",
      "Multi-step measurement word problems in Numeracy offer room for practice.",
    ],
    recommendedActions: [
      {
        id: "act-aisha-num",
        title: "Review Numeracy Paper 2",
        description: "Check multi-step measurement questions together.",
      },
    ],
  },
  {
    childId: "child-kabir",
    displayName: "Kabir",
    yearLevel: 5,
    attemptCount: 1,
    unreadableAttemptCount: 0,
    latestPercentage: 80,
    previousPercentage: null,
    averagePercentage: 80,
    attemptsThisWeek: 1,
    timeThisWeekSeconds: 2520,
    streakDays: 1,
    weekActivity: [
      { label: "Mon", practised: false, isToday: false },
      { label: "Tue", practised: false, isToday: false },
      { label: "Wed", practised: false, isToday: false },
      { label: "Thu", practised: true, isToday: false },
      { label: "Fri", practised: false, isToday: false },
      { label: "Sat", practised: false, isToday: false },
      { label: "Sun", practised: false, isToday: true },
    ],
    subjects: [
      {
        subject: "numeracy",
        label: "Numeracy",
        percentage: 80,
        marksEarned: 24,
        marksAvailable: 30,
        questionCount: 30,
        paperCount: 1,
      },
    ],
    recentAttempts: [
      {
        id: "res-kabir-501",
        submittedAt: "2026-11-05T17:10:00Z",
        submittedAtLabel: "5 Nov 2026",
        label: "Grade 5 · Numeracy Non-Calculator Paper 1",
        percentage: 80,
        marksEarned: 24,
        marksAvailable: 30,
        totalQuestions: 30,
        attemptedQuestions: 30,
        pendingManualReview: false,
      },
    ],
    readinessScore: 80,
    topicsMasteredCount: 1,
    observations: [
      "1 finished paper recorded so far — complete one more paper to unlock strand-level comparisons.",
    ],
    recommendedActions: [
      {
        id: "act-kabir-next",
        title: "Complete a second Numeracy paper",
        description: "At least 2 papers and 8 marks are required before evaluative subject claims appear.",
      },
    ],
  },
];

export const PREVIEW_PROGRAMMES_YEAR3: ProgrammeAvailability[] = [
  {
    id: "naplan-numeracy-y3",
    title: "NAPLAN-style Numeracy",
    subject: "numeracy",
    status: "ready",
    questionCountEstimated: 180,
    setSizesDescription: "sets of 10, 20 or a full paper",
  },
  {
    id: "naplan-reading-y3",
    title: "NAPLAN-style Reading",
    subject: "reading",
    status: "ready",
    questionCountEstimated: 95,
    setSizesDescription: "sets of 10 or 20",
  },
  {
    id: "naplan-conventions-y3",
    title: "NAPLAN-style Language conventions",
    subject: "language_conventions",
    status: "ready",
    questionCountEstimated: 82,
    setSizesDescription: "sets of 10 or 20",
  },
  {
    id: "icas-english-y3",
    title: "ICAS-style English",
    subject: "reading",
    status: "ready",
    questionCountEstimated: 140,
    setSizesDescription: "sets of 10 or 20",
  },
  {
    id: "icas-science-y3",
    title: "ICAS-style Science",
    subject: "science",
    status: "not_written",
    description: "There are no questions for this one at Year 3 yet. It is not hidden from you, and it is not coming this term.",
  },
  {
    id: "icas-digital-tech-y3",
    title: "ICAS-style Digital Technologies",
    subject: "digital_technologies",
    status: "could_not_check",
    description: "We could not work out what is available here just now. There may be plenty or there may be none — we are not going to guess. Try again shortly.",
  },
];

export const PREVIEW_PROGRAMMES_YEAR5: ProgrammeAvailability[] = [
  {
    id: "naplan-numeracy-y5",
    title: "NAPLAN-style Numeracy",
    subject: "numeracy",
    status: "ready",
    questionCountEstimated: 210,
    setSizesDescription: "sets of 10, 20 or a full paper",
  },
  {
    id: "naplan-reading-y5",
    title: "NAPLAN-style Reading",
    subject: "reading",
    status: "ready",
    questionCountEstimated: 120,
    setSizesDescription: "sets of 10 or 20",
  },
  {
    id: "naplan-conventions-y5",
    title: "NAPLAN-style Language conventions",
    subject: "language_conventions",
    status: "ready",
    questionCountEstimated: 95,
    setSizesDescription: "sets of 10 or 20",
  },
  {
    id: "icas-english-y5",
    title: "ICAS-style English",
    subject: "reading",
    status: "ready",
    questionCountEstimated: 160,
    setSizesDescription: "sets of 10 or 20",
  },
  {
    id: "icas-science-y5",
    title: "ICAS-style Science",
    subject: "science",
    status: "ready",
    questionCountEstimated: 110,
    setSizesDescription: "sets of 10 or 20",
  },
  {
    id: "icas-digital-tech-y5",
    title: "ICAS-style Digital Technologies",
    subject: "digital_technologies",
    status: "could_not_check",
    description: "We could not work out what is available here just now. There may be plenty or there may be none — we are not going to guess. Try again shortly.",
  },
];

export const PREVIEW_SAMPLE_QUESTIONS_NUMERACY: PreviewSampleQuestion[] = [
  {
    id: "sq-num-01",
    prompt: "A shop has 4 shelves. Each shelf holds 25 jars. How many jars are there altogether?",
    options: ["29 jars", "100 jars", "104 jars", "254 jars"],
    correctIndex: 1,
  },
  {
    id: "sq-num-02",
    prompt: "Liam has $12.50. He buys a notebook for $4.20 and a pen for $2.80. How much change does he get?",
    options: ["$5.50", "$6.00", "$6.50", "$7.00"],
    correctIndex: 0,
  },
  {
    id: "sq-num-03",
    prompt: "Which shape has exactly 5 vertices and 8 edges?",
    options: ["Square prism", "Square-based pyramid", "Triangular prism", "Pentagonal pyramid"],
    correctIndex: 1,
  },
];

export const PREVIEW_SAMPLE_QUESTIONS_READING: PreviewSampleQuestion[] = [
  {
    id: "sq-read-01",
    prompt: "What is the main thing the second paragraph tells you about the lighthouse?",
    options: [
      "That it was built to warn ships",
      "That it was painted white and red",
      "That the keeper lived there alone",
      "That the light broke in the storm",
    ],
    correctIndex: 0,
  },
  {
    id: "sq-read-02",
    prompt: "Which word in the last sentence means the same as “enormous”?",
    options: ["rocky", "vast", "ancient", "narrow"],
    correctIndex: 1,
  },
];

export interface PreviewParentAccount {
  name: string;
  email: string;
  passwordLastChanged: string;
  devicesCount: number;
  planName: string;
  planPrice: string;
  nextPaymentDate: string;
  placesUsed: number;
  placesTotal: number;
  cardBrand: string;
  cardLast4: string;
}

export const PREVIEW_PARENT_ACCOUNT: PreviewParentAccount = {
  name: "Priya Raman",
  email: "priya.raman@example.com",
  passwordLastChanged: "3 September 2026",
  devicesCount: 3,
  planName: "Family",
  planPrice: "A$19.90 a month",
  nextPaymentDate: "3 December 2026",
  placesUsed: 2,
  placesTotal: 3,
  cardBrand: "Visa",
  cardLast4: "4242",
};


