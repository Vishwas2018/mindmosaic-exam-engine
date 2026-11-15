export type AdminView =
  | "overview"
  | "library"
  | "review"
  | "approval"
  | "paper"
  | "publication"
  | "writing"
  | "support"
  | "activity"
  | "governance"
  | "states";

export type AdminStateSubView =
  | "library_states"
  | "review_states"
  | "approve_states"
  | "paper_states"
  | "publish_states"
  | "writing_states"
  | "support_states"
  | "activity_states";

export interface AdminMetric {
  label: string;
  count: number | string;
  change: string;
  trend: "up" | "down" | "neutral" | "warning";
  detail: string;
}

export interface AdminQuestionSummary {
  id: string;
  title: string;
  yearLevel: number | string;
  subject: string;
  status: "draft" | "review" | "approved" | "published";
  author: string;
  lastUpdated: string;
  hasVisual: boolean;
  contentHash?: string;
  prompt?: string;
}

/* Year, subject, author and the two checks are optional because the approval table records none of them: the DEV
   adapter leaves them out rather than assume them. Preview fixtures still set them. */
export interface AdminApprovalItem {
  id: string;
  title: string;
  yearLevel?: number | string;
  subject?: string;
  draftedBy?: string;
  pedagogicalCheck?: boolean;
  tamperEvidentHash: string;
  standingRuleCompliance?: boolean;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export interface AdminPaperSummary {
  code: string;
  title: string;
  items: number;
  durationMinutes: number;
  status: "ready" | "staged" | "in_review" | "shortage";
  approvedItemsCount: number;
}

export interface AdminWritingQueueItem {
  id: string;
  prompt: string;
  yearLevel: string;
  submissionDate: string;
  status: "pending" | "marked";
  snippet: string;
  anonymizedStudentId: string;
}

export interface AdminSupportTicket {
  id: string;
  maskedContact: string;
  subject: string;
  status: "open" | "in_progress" | "resolved";
  priority: "high" | "medium" | "low";
  submittedAt: string;
  messageSnippet: string;
  questionId?: string;
}

export interface AdminActivityItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  badgeTone: "success" | "info" | "warning" | "neutral";
  hash?: string;
}

export interface AdminSectionAvailability {
  isAvailable: boolean;
  reason?: string;
  requiredDependency?: string;
}

/** One programme group's publication gate, as the running deployment resolves it. */
export interface AdminProgrammeGate {
  label: string;
  /** "mixed" when the group has some programmes enforced and some reporting. */
  mode: "report" | "enforce" | "mixed";
  /** Authored questions in the group. */
  authored: number;
  /** Questions with a verified human approval record. */
  approved: number;
  /** Questions a child can actually be served today. */
  served: number;
}

/** What the Overview shows. Every figure is read from the bank, the approval records or the gate; none is estimated. */
export interface AdminOverviewData {
  /** Authored questions with no verified human approval record. */
  awaitingPerson: number;
  authored: number;
  approved: number;
  programmes: AdminProgrammeGate[];
  /** Queues with no backing data yet say so, with what they are waiting for. */
  flagged: AdminSectionAvailability & { count?: number };
  writing: AdminSectionAvailability & { count?: number };
  reports: AdminSectionAvailability;
}

export interface AdminWorkspaceData {
  source: "dev" | "preview";
  reviewer: {
    name: string;
    role: string;
    email?: string;
  };
  metrics: AdminMetric[];
  overview: AdminOverviewData;
  questions: AdminQuestionSummary[];
  approvals: AdminApprovalItem[];
  papers: AdminPaperSummary[];
  writing: {
    items: AdminWritingQueueItem[];
    availability: AdminSectionAvailability;
  };
  support: {
    items: AdminSupportTicket[];
    availability: AdminSectionAvailability;
  };
  activity: AdminActivityItem[];
  manifest: {
    id: string;
    /** Absent when no publication time is recorded (the DEV adapter has none). */
    publishedAt?: string;
    liveQuestionsCount: number;
    /** Absent until a root hash is actually computed over the manifest. */
    rootHash?: string;
  };
}
