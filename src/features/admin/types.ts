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

export interface AdminApprovalItem {
  id: string;
  title: string;
  yearLevel: number | string;
  subject: string;
  draftedBy: string;
  pedagogicalCheck: boolean;
  tamperEvidentHash: string;
  standingRuleCompliance: boolean;
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

export interface AdminWorkspaceData {
  source: "dev" | "preview";
  reviewer: {
    name: string;
    role: string;
    email?: string;
  };
  metrics: AdminMetric[];
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
    publishedAt: string;
    liveQuestionsCount: number;
    rootHash: string;
  };
}
