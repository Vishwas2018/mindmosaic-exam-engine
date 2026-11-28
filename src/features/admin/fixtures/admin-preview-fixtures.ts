export interface AdminMetric {
  label: string;
  count: number;
  change: string;
  trend: "up" | "down" | "neutral" | "warning";
  detail: string;
}

export interface AdminQuestionSummary {
  id: string;
  title: string;
  yearLevel: 3 | 5;
  subject: "Numeracy" | "Reading" | "Language Conventions" | "Writing";
  status: "draft" | "review" | "approved" | "published";
  author: string;
  lastUpdated: string;
  hasVisual: boolean;
}

export interface AdminApprovalItem {
  id: string;
  title: string;
  yearLevel: 3 | 5;
  subject: string;
  draftedBy: string;
  pedagogicalCheck: boolean;
  tamperEvidentHash: string;
  standingRuleCompliance: boolean;
}

export interface AdminSupportTicket {
  id: string;
  parentEmail: string;
  subject: string;
  status: "open" | "in_progress" | "resolved";
  priority: "high" | "medium" | "low";
  submittedAt: string;
  messageSnippet: string;
}

export interface AdminActivityItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  badgeTone: "success" | "info" | "warning" | "neutral";
}

export const PREVIEW_ADMIN_METRICS: AdminMetric[] = [
  {
    label: "Draft questions in review",
    count: 18,
    change: "+4 today",
    trend: "up",
    detail: "Awaiting editorial and taxonomy review",
  },
  {
    label: "Awaiting human approval",
    count: 6,
    change: "Human sign-off required",
    trend: "warning",
    detail: "Mandatory human gate before publication",
  },
  {
    label: "Staged exam papers",
    count: 4,
    change: "2 ready to lock",
    trend: "neutral",
    detail: "Year 3 & Year 5 practice sets",
  },
  {
    label: "Open parent inquiries",
    count: 3,
    change: "1 high priority",
    trend: "down",
    detail: "Response time avg: 24 mins",
  },
];

export const PREVIEW_ADMIN_QUESTIONS: AdminQuestionSummary[] = [
  {
    id: "Q-NUM-Y3-042",
    title: "Perimeter of Rectangular Garden",
    yearLevel: 3,
    subject: "Numeracy",
    status: "review",
    author: "Elena Rostova",
    lastUpdated: "Today, 10:14 am",
    hasVisual: true,
  },
  {
    id: "Q-NUM-Y3-043",
    title: "Fraction Shading on Grid",
    yearLevel: 3,
    subject: "Numeracy",
    status: "approved",
    author: "Marcus Vance",
    lastUpdated: "Yesterday, 3:45 pm",
    hasVisual: true,
  },
  {
    id: "Q-RDG-Y3-018",
    title: "The Brolga's Dance (Comprehension)",
    yearLevel: 3,
    subject: "Reading",
    status: "published",
    author: "Aria Thorne",
    lastUpdated: "2 Nov 2026",
    hasVisual: false,
  },
  {
    id: "Q-LNG-Y5-055",
    title: "Apostrophes of Contraction vs Possession",
    yearLevel: 5,
    subject: "Language Conventions",
    status: "draft",
    author: "Elena Rostova",
    lastUpdated: "Today, 9:30 am",
    hasVisual: false,
  },
  {
    id: "Q-NUM-Y5-089",
    title: "Multi-step Mass and Volume Bar Model",
    yearLevel: 5,
    subject: "Numeracy",
    status: "review",
    author: "David Kim",
    lastUpdated: "Yesterday, 5:20 pm",
    hasVisual: true,
  },
  {
    id: "Q-WRT-Y3-009",
    title: "Narrative: The Key Under the Old Oak",
    yearLevel: 3,
    subject: "Writing",
    status: "approved",
    author: "Aria Thorne",
    lastUpdated: "3 Nov 2026",
    hasVisual: false,
  },
];

export const PREVIEW_APPROVAL_ITEMS: AdminApprovalItem[] = [
  {
    id: "Q-NUM-Y3-042",
    title: "Perimeter of Rectangular Garden",
    yearLevel: 3,
    subject: "NAPLAN Numeracy",
    draftedBy: "Elena Rostova",
    pedagogicalCheck: true,
    tamperEvidentHash: "sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    standingRuleCompliance: true,
  },
  {
    id: "Q-NUM-Y5-089",
    title: "Multi-step Mass and Volume Bar Model",
    yearLevel: 5,
    subject: "Singapore Maths Problem Solving",
    draftedBy: "David Kim",
    pedagogicalCheck: true,
    tamperEvidentHash: "sha256-ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
    standingRuleCompliance: true,
  },
  {
    id: "Q-LNG-Y5-056",
    title: "Complex Clause Punctuation in Expository Text",
    yearLevel: 5,
    subject: "NAPLAN Language Conventions",
    draftedBy: "Elena Rostova",
    pedagogicalCheck: true,
    tamperEvidentHash: "sha256-4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
    standingRuleCompliance: true,
  },
];

export const PREVIEW_SUPPORT_TICKETS: AdminSupportTicket[] = [
  {
    id: "TICK-2026-881",
    parentEmail: "p***@masked.invalid (Redacted)",
    subject: "Question about Year 3 Numeracy question scoring",
    status: "open",
    priority: "medium",
    submittedAt: "24 mins ago",
    messageSnippet: "Hi team, regarding the Year 3 Geometry practice test and the bar model working on question 4...",
  },
  {
    id: "TICK-2026-879",
    parentEmail: "s***@masked.invalid (Redacted)",
    subject: "Updating family plan student place allocation",
    status: "in_progress",
    priority: "high",
    submittedAt: "2 hours ago",
    messageSnippet: "Confirming how to reallocate the active slot for our eldest child preparing for Year 5 NAPLAN...",
  },
  {
    id: "TICK-2026-874",
    parentEmail: "g***@masked.invalid (Redacted)",
    subject: "Clarification on ICAS sample questions availability",
    status: "resolved",
    priority: "low",
    submittedAt: "Yesterday",
    messageSnippet: "Clarification on ICAS sample questions schedule. Thank you.",
  },
];

export const PREVIEW_ACTIVITY_LOG: AdminActivityItem[] = [
  {
    id: "ACT-902",
    actor: "Maya Chen (Content Reviewer)",
    action: "Human sign-off approved",
    target: "Q-NUM-Y3-043 (Fraction Shading)",
    timestamp: "18 mins ago",
    badgeTone: "success",
  },
  {
    id: "ACT-901",
    actor: "System Ledger",
    action: "Tamper-evident manifest stamped",
    target: "Manifest Block #1480 (12 items)",
    timestamp: "45 mins ago",
    badgeTone: "info",
  },
  {
    id: "ACT-900",
    actor: "Marcus Vance",
    action: "Draft submitted for review",
    target: "Q-NUM-Y5-090 (Angles in Polygons)",
    timestamp: "1 hour ago",
    badgeTone: "neutral",
  },
  {
    id: "ACT-899",
    actor: "Maya Chen",
    action: "Revision requested",
    target: "Q-LNG-Y3-021 (Spelling: silent letters)",
    timestamp: "3 hours ago",
    badgeTone: "warning",
  },
];
