import "server-only";

import { publishedExamBank } from "@/content/questions/practice-bank";
import {
  PROGRAMME_PUBLICATION_MODES,
  programmeIdForQuestion,
  publicationGateMode,
} from "@/features/content-governance/gate-config";
import type { LibraryRow } from "@/features/admin/library-query";
import type { AdminOverviewData, AdminProgrammeGate } from "@/features/admin/types";
import type { Question } from "@/schemas/question.schema";
import { deployedGateFallback, getExamBank } from "@/server/exam-bank";
import { getPublicationEligibility } from "@/server/publication-evidence";

const PROGRAMME_LABEL: Record<string, string> = {
  naplan_style: "NAPLAN-style",
  icas_style: "ICAS-style",
  amc_style: "AMC-style",
  scholarship_style: "Scholarship-style",
};

const SUBJECT_LABEL: Record<string, string> = {
  numeracy: "Numeracy",
  reading: "Reading",
  language_conventions: "Language",
  spelling: "Spelling",
  science: "Science",
  digital_technologies: "Digital Technologies",
  amc_mathematics: "AMC Mathematics",
  verbal_reasoning: "Verbal reasoning",
  numerical_reasoning: "Numerical reasoning",
};

function subjectLabel(subject: string): string {
  return SUBJECT_LABEL[subject] ?? subject.replace(/_/g, " ");
}

function promptSnippet(question: Question): string {
  const text = question.prompt.replace(/\s+/g, " ").trim();
  return text.length > 110 ? `${text.slice(0, 107)}...` : text;
}

/** Every authored question, with its real approval and serving state. No answer key leaves this function. */
export function getAdminLibraryRows(): LibraryRow[] {
  const eligibility = getPublicationEligibility();
  const servedIds = new Set(getExamBank("practice").map((q) => q.id));
  return publishedExamBank.map((question) => {
    const approval = eligibility.approvals.get(question.id);
    return {
      id: question.id,
      prompt: promptSnippet(question),
      programme: question.examStyle,
      programmeLabel: PROGRAMME_LABEL[question.examStyle] ?? question.examStyle,
      yearLevel: question.yearLevel,
      subject: subjectLabel(question.metadata.subject),
      strand: question.metadata.strand,
      status: approval ? "approved" : "awaiting",
      served: servedIds.has(question.id),
      revision: approval && "revision" in approval ? approval.revision : undefined,
    };
  });
}

export interface AdminQuestionDetail {
  question: Question;
  row: LibraryRow;
  approval: { approvedBy: string; approvedAt: string; contentHash: string; revision: number } | null;
}

/** One question for the administrator's review page: the full record, answer key included. Admin-only callers. */
export function getAdminQuestionDetail(id: string): AdminQuestionDetail | null {
  const question = publishedExamBank.find((q) => q.id === id);
  if (!question) return null;
  const row = getAdminLibraryRows().find((r) => r.id === id);
  if (!row) return null;
  const record = getPublicationEligibility().approvals.get(id);
  const approval =
    record && "approvedBy" in record && "contentHash" in record
      ? {
          approvedBy: record.approvedBy,
          approvedAt: record.approvedAt,
          contentHash: record.contentHash,
          revision: "revision" in record ? record.revision : 0,
        }
      : null;
  return { question, row, approval };
}

const GROUPS: { label: string; styles: readonly string[] }[] = [
  { label: "NAPLAN & ICAS", styles: ["naplan_style", "icas_style"] },
  { label: "Scholarship & Edutest", styles: ["scholarship_style"] },
  { label: "AMC", styles: ["amc_style"] },
];

/** The Overview's figures. All read from the bank, the approval records and the gate; nothing is estimated. */
export function getAdminOverviewData(): AdminOverviewData {
  const rows = getAdminLibraryRows();
  const fallback = deployedGateFallback();
  const programmes: AdminProgrammeGate[] = [];
  for (const group of GROUPS) {
    const questions = publishedExamBank.filter((q) => group.styles.includes(q.examStyle));
    if (questions.length === 0) continue;
    const modes = new Set(
      questions.map((q) => publicationGateMode(programmeIdForQuestion(q), PROGRAMME_PUBLICATION_MODES, fallback)),
    );
    const ids = new Set(questions.map((q) => q.id));
    const inGroup = rows.filter((r) => ids.has(r.id));
    programmes.push({
      label: group.label,
      mode: modes.size > 1 ? "mixed" : modes.has("enforce") ? "enforce" : "report",
      authored: inGroup.length,
      approved: inGroup.filter((r) => r.status === "approved").length,
      served: inGroup.filter((r) => r.served).length,
    });
  }
  const approved = rows.filter((r) => r.status === "approved").length;
  return {
    authored: rows.length,
    approved,
    awaitingPerson: rows.length - approved,
    programmes,
    flagged: {
      isAvailable: false,
      reason: "The AI reviewer's findings are not stored anywhere yet, so nothing can be counted as flagged.",
      requiredDependency: "Needs: stored reviewer findings",
    },
    writing: {
      isAvailable: false,
      reason: "The marking queue needs a redacted read path so an administrator never sees a child's identity.",
      requiredDependency: "Awaiting migration: admin_redacted_writing_queue",
    },
    reports: {
      isAvailable: false,
      reason: "Family question reports are not collected yet. Child profiles stay out of reach for an administrator.",
      requiredDependency: "Awaiting migration: student_question_reports",
    },
  };
}
