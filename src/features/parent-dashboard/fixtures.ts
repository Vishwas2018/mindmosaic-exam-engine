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
  status: "finished" | "awaiting_parent_marking";
  strands: Array<{
    name: string;
    marksEarned: number;
    marksAvailable: number;
  }>;
}

export interface PreviewAnswerReviewItem {
  questionNumber: number;
  strand: string;
  questionText: string;
  studentAnswer: string;
  expectedAnswer: string;
  isCorrect: boolean;
  explanation: string;
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
    id: "res-reading-301",
    childId: "child-aisha",
    title: "NAPLAN-style Reading",
    subject: "reading",
    date: "29 October 2026",
    timed: true,
    durationMinutes: 28,
    allowedMinutes: 40,
    marksEarned: 18,
    marksAvailable: 25,
    status: "finished",
    strands: [
      { name: "Informative texts", marksEarned: 7, marksAvailable: 10 },
      { name: "Narrative texts", marksEarned: 6, marksAvailable: 8 },
      { name: "Persuasive texts", marksEarned: 5, marksAvailable: 7 },
    ],
  },
  {
    id: "res-numeracy-302",
    childId: "child-aisha",
    title: "NAPLAN-style Numeracy",
    subject: "numeracy",
    date: "25 October 2026",
    timed: true,
    durationMinutes: 35,
    allowedMinutes: 45,
    marksEarned: 23,
    marksAvailable: 35,
    status: "finished",
    strands: [
      { name: "Number and algebra", marksEarned: 12, marksAvailable: 16 },
      { name: "Measurement and geometry", marksEarned: 7, marksAvailable: 11 },
      { name: "Statistics and probability", marksEarned: 4, marksAvailable: 8 },
    ],
  },
  {
    id: "res-writing-303",
    childId: "child-aisha",
    title: "Narrative Writing — The Hidden Door",
    subject: "writing",
    date: "22 October 2026",
    timed: true,
    durationMinutes: 30,
    allowedMinutes: 40,
    marksEarned: 0,
    marksAvailable: 30,
    status: "awaiting_parent_marking",
    strands: [
      { name: "Audience & Purpose", marksEarned: 0, marksAvailable: 6 },
      { name: "Text Structure & Ideas", marksEarned: 0, marksAvailable: 8 },
      { name: "Character & Setting", marksEarned: 0, marksAvailable: 6 },
      { name: "Vocabulary & Cohesion", marksEarned: 0, marksAvailable: 10 },
    ],
  },
];

export const PREVIEW_ANSWER_REVIEW_READING: PreviewAnswerReviewItem[] = [
  {
    questionNumber: 1,
    strand: "Informative texts",
    questionText: "What was the main purpose of the park ranger's morning patrol?",
    studentAnswer: "To inspect track conditions and log wildlife sightings",
    expectedAnswer: "To inspect track conditions and log wildlife sightings",
    isCorrect: true,
    explanation:
      "Paragraph 2 states that each patrol begins at dawn to assess track safety after overnight storms and record active wildlife.",
  },
  {
    questionNumber: 2,
    strand: "Informative texts",
    questionText: "Which instrument did Dr Aris use to test the salinity of the tidal creek?",
    studentAnswer: "A digital refractometer probe",
    expectedAnswer: "A digital refractometer probe",
    isCorrect: true,
    explanation:
      "Line 18 explicitly mentions the handheld digital refractometer calibrated for estuarine readings.",
  },
  {
    questionNumber: 3,
    strand: "Narrative texts",
    questionText: "Why did Maya hesitate before pushing through the gate?",
    studentAnswer: "Because it was raining heavily",
    expectedAnswer: "Because she recognized the warning crest from her grandfather's journal",
    isCorrect: false,
    explanation:
      "The text explains that the carved iron crest made her stop: 'The crest was unmistakable, precisely as drawn on page twelve of the weathered notebook.'",
  },
  {
    questionNumber: 4,
    strand: "Narrative texts",
    questionText: "What does the phrase 'the wind had teeth' suggest about the afternoon weather?",
    studentAnswer: "It was bitter, sharp and biting cold",
    expectedAnswer: "It was bitter, sharp and biting cold",
    isCorrect: true,
    explanation:
      "The figurative idiom personifies the gusty wind to evoke penetrating cold.",
  },
  {
    questionNumber: 5,
    strand: "Persuasive texts",
    questionText: "What evidence does the letter offer in support of dedicated community cycle lanes?",
    studentAnswer: "A 34% drop in traffic incidents along neighbouring suburban corridors",
    expectedAnswer: "A 34% drop in traffic incidents along neighbouring suburban corridors",
    isCorrect: true,
    explanation:
      "The third paragraph directly cites council traffic study data showing the safety benefits of separated infrastructure.",
  },
  {
    questionNumber: 6,
    strand: "Persuasive texts",
    questionText: "Which rhetorical technique is used in the phrase 'Not tomorrow, not next year, but today'?",
    studentAnswer: "A rhetorical question",
    expectedAnswer: "Tricolon repetition (rule of three) for urgency",
    isCorrect: false,
    explanation:
      "The phrase uses rhythmic three-part parallel phrasing rather than posing a question to the reader.",
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
