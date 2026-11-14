import type { AdminWorkspaceData } from "../types";
import {
  PREVIEW_ADMIN_METRICS,
  PREVIEW_ADMIN_QUESTIONS,
  PREVIEW_APPROVAL_ITEMS,
  PREVIEW_SUPPORT_TICKETS,
  PREVIEW_ACTIVITY_LOG,
} from "../fixtures/admin-preview-fixtures";

export function getPreviewAdminData(): AdminWorkspaceData {
  return {
    source: "preview",
    reviewer: {
      name: "Maya Chen",
      role: "Content reviewer (Standing Rule #8)",
      email: "maya.chen@example.internal",
    },
    metrics: PREVIEW_ADMIN_METRICS,
    questions: PREVIEW_ADMIN_QUESTIONS.map((q) => ({
      ...q,
      prompt: q.title,
    })),
    approvals: PREVIEW_APPROVAL_ITEMS.map((app) => ({
      ...app,
      isApproved: false,
    })),
    papers: [
      {
        code: "P-NUM-Y3-SET1",
        title: "Year 3 NAPLAN Numeracy Practice Set 1",
        items: 36,
        durationMinutes: 45,
        status: "ready",
        approvedItemsCount: 36,
      },
      {
        code: "P-RDG-Y3-SET1",
        title: "Year 3 NAPLAN Reading Practice Set 1",
        items: 38,
        durationMinutes: 45,
        status: "ready",
        approvedItemsCount: 38,
      },
      {
        code: "P-NUM-Y5-SET1",
        title: "Year 5 NAPLAN Numeracy Practice Set 1",
        items: 42,
        durationMinutes: 50,
        status: "staged",
        approvedItemsCount: 40,
      },
      {
        code: "P-RDG-Y5-SET1",
        title: "Year 5 NAPLAN Reading Practice Set 1",
        items: 40,
        durationMinutes: 50,
        status: "in_review",
        approvedItemsCount: 32,
      },
    ],
    writing: {
      items: [
        {
          id: "WR-2026-001",
          prompt: "The Hidden Key Under the Old Oak",
          yearLevel: "Year 3 Narrative",
          submissionDate: "2 days ago",
          status: "pending",
          snippet:
            "Once upon a time the explorer was walking through the botanic gardens when they saw a glint of gold under a giant oak tree...",
          anonymizedStudentId: "REDACTED-STU-042",
        },
      ],
      availability: {
        isAvailable: true,
      },
    },
    support: {
      items: PREVIEW_SUPPORT_TICKETS.map((t) => ({
        id: t.id,
        maskedContact: t.parentEmail,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        submittedAt: t.submittedAt,
        messageSnippet: t.messageSnippet,
      })),
      availability: {
        isAvailable: true,
      },
    },
    activity: PREVIEW_ACTIVITY_LOG.map((act) => ({
      ...act,
      hash: "sha256-4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
    })),
    manifest: {
      id: "2026.11-RELEASE-1",
      publishedAt: "2026-11-04T08:00:00Z",
      liveQuestionsCount: 142,
      rootHash: "sha256-4f53c988a82e9b0b4685a21856e729a8831862efaa918e93235ffb0284067ac1",
    },
  };
}
