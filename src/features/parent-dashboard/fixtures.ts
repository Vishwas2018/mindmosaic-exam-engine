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
    description: "Student codes, 6-digit PINs, resetting credentials, and signing in across devices.",
    articles: [
      { slug: "forgotten-pin", title: "My child has forgotten their PIN" },
      { slug: "student-login-code", title: "Where to find your child's 8-character login code" },
      { slug: "sign-in-card", title: "Printing or saving a student sign-in card" },
    ],
  },
  {
    id: "practice-papers",
    title: "Practice and papers",
    description: "Timed and untimed modes, pausing mid-paper, and question formats.",
    articles: [
      { slug: "timed-practice", title: "How timed practice works and when to use it" },
      { slug: "pausing-papers", title: "Can a child pause a practice sitting halfway through?" },
      { slug: "question-types", title: "Multiple choice, short answer, and inline question types" },
    ],
  },
  {
    id: "results-marks",
    title: "Understanding results",
    description: "Objective marks, why we show marks not bands, and the evidence floor.",
    articles: [
      { slug: "marks-not-bands", title: "Why MindMosaic reports marks rather than performance bands" },
      { slug: "evidence-floor", title: "What the 2-paper and 8-mark evidence floor means" },
      { slug: "unreadable-rows", title: "What to do if some activity shows as unreadable" },
    ],
  },
  {
    id: "writing-marking",
    title: "Marking writing",
    description: "Parent marking rubrics, scoring criteria, and moderation notes.",
    articles: [
      { slug: "parent-rubric", title: "Step-by-step guide to marking your child's writing" },
      { slug: "narrative-criteria", title: "The 10 narrative writing assessment criteria explained" },
      { slug: "persuasive-criteria", title: "The 10 persuasive writing assessment criteria explained" },
    ],
  },
  {
    id: "membership-billing",
    title: "Membership and billing",
    description: "Family plan places, updating billing card, invoices, and cancelling.",
    articles: [
      { slug: "family-places", title: "How paid places work on the Family plan" },
      { slug: "pausing-vs-cancelling", title: "Pausing a child's access versus cancelling your subscription" },
      { slug: "update-card", title: "Updating your payment card via the secure Stripe portal" },
    ],
  },
  {
    id: "privacy-data",
    title: "Privacy and data",
    description: "Student security, encrypted PIN storage, data retention, and erasure requests.",
    articles: [
      { slug: "student-security", title: "How we protect child student data and privacy" },
      { slug: "data-erasure", title: "Requesting verified account and child data deletion (ADR-012)" },
      { slug: "data-export", title: "Requesting a copy of your family's records" },
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
      "Reset it from their profile. Go to Children, select your child, and press Reset PIN. You will see a new 6-digit PIN displayed once, so write it down before leaving the page.",
      "Resetting signs them out on all active devices and nothing else changes — their 8-character login code stays the same and none of their completed papers or marks are affected.",
    ],
    note: "We only keep a secure cryptographic hash of each PIN, which is why we cannot retrieve or read an existing PIN back to you.",
    action: {
      label: "Go to Children",
      href: "/parent/children",
    },
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
  "data-erasure": {
    slug: "data-erasure",
    title: "Requesting verified account and child data deletion (ADR-012)",
    category: "Privacy and data",
    lead: "MindMosaic supports verified guardian-authorized data erasure.",
    paragraphs: [
      "Under our data privacy architecture (ADR-012), data deletion is handled via a verified administrative request. Because educational and financial records require verification, deletion is protected against accidental or unauthorized single-click actions.",
      "Once requested and verified by guardian email confirmation, the processor systematically erases student profiles, sitting responses, and associated identifiers across our systems.",
    ],
    note: "If you simply want to pause practice without losing work, use the pause toggle on the child's profile instead.",
    action: {
      label: "Go to Account",
      href: "/parent/account",
    },
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


