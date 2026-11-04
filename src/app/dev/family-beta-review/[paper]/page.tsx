import Link from "next/link";
import { notFound } from "next/navigation";

import { ReviewQuestionCard } from "@/features/family-beta/ReviewQuestionCard";
import { toCandidateQuestions } from "@/features/exam-engine/types";
import type { AuthoringQuestion, PresentationQuestion } from "@/features/exam-engine/types";
import {
  getFamilyBetaPaperConfig,
  loadFamilyBetaFixedPaperQuestions,
  type FamilyBetaPaperKind,
} from "@/server/family-beta-fixed-papers";
import { findingsForQuestion } from "@/server/family-beta-review-findings";

const PAPERS: readonly FamilyBetaPaperKind[] = ["year3", "year5"];

function isPaper(value: string): value is FamilyBetaPaperKind {
  return (PAPERS as readonly string[]).includes(value);
}

/** Human-readable expected answer, rendered server-side from the answer key. */
function describeAnswer(question: AuthoringQuestion): string {
  const q = question as unknown as {
    answerKey?: Record<string, unknown>;
    options?: { id: string; text: string }[];
    interaction?: Record<string, unknown>;
  };
  const key = q.answerKey;
  if (!key) return "(no answer key)";
  const optionText = (id: string): string =>
    q.options?.find((o) => o.id === id)?.text ?? id;

  switch (key.kind) {
    case "number": {
      const unit = key.unit ? ` ${String(key.unit)}` : "";
      return `${String(key.value)}${unit}`;
    }
    case "boolean":
      return key.value === true ? "True" : "False";
    case "single_option":
      return optionText(String(key.optionId));
    case "multiple_options":
      return (key.optionIds as string[]).map(optionText).join(", ");
    case "ordering": {
      const items = (q.interaction?.items ?? []) as { id: string; text: string }[];
      return (key.optionIds as string[])
        .map((id) => items.find((i) => i.id === id)?.text ?? id)
        .join(" → ");
    }
    case "fill_blank":
      return (key.blanks as { id: string; acceptedAnswers: string[] }[])
        .map((b) => `${b.id}: ${b.acceptedAnswers.join(" / ")}`)
        .join("; ");
    case "dropdown": {
      const fields = (q.interaction?.fields ?? []) as {
        id: string;
        options: { id: string; text: string }[];
      }[];
      return (key.fields as { id: string; correctOptionId: string }[])
        .map((f) => {
          const field = fields.find((x) => x.id === f.id);
          const text = field?.options.find((o) => o.id === f.correctOptionId)?.text;
          return `${f.id}: ${text ?? f.correctOptionId}`;
        })
        .join("; ");
    }
    case "matching": {
      const sources = (q.interaction?.sources ?? q.interaction?.labels ?? []) as {
        id: string;
        text: string;
      }[];
      const targets = (q.interaction?.targets ?? []) as {
        id: string;
        text?: string;
        label?: string;
      }[];
      return (key.pairs as { sourceId: string; targetId: string }[])
        .map((p) => {
          const s = sources.find((x) => x.id === p.sourceId);
          const t = targets.find((x) => x.id === p.targetId);
          return `${s?.text ?? p.sourceId} → ${t?.text ?? t?.label ?? p.targetId}`;
        })
        .join("; ");
    }
    default:
      return JSON.stringify(key);
  }
}

export default async function FamilyBetaReviewPaperPage({
  params,
}: {
  params: Promise<{ paper: string }>;
}) {
  const { paper } = await params;
  if (!isPaper(paper)) notFound();

  const config = getFamilyBetaPaperConfig(paper);
  // Throws if any pinned hash has drifted — a reviewer must never be shown
  // content that is not the pinned, hash-verified version.
  const authoring = loadFamilyBetaFixedPaperQuestions(paper);
  const candidates = toCandidateQuestions(authoring) as unknown as PresentationQuestion[];

  const totalMarks = config.pinnedQuestions.reduce((a, p) => a + p.marks, 0);
  const flagged = config.pinnedQuestions.filter(
    (_, i) => findingsForQuestion(authoring[i]).length > 0,
  ).length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <p className="mb-2 text-sm">
        <Link href="/dev/family-beta-review" className="underline">
          ← Both papers
        </Link>
      </p>
      <h1 className="text-2xl font-bold text-slate-900">{config.title}</h1>
      <p className="mt-2 rounded-lg border border-red-400 bg-red-50 p-3 text-sm font-semibold text-red-900">
        UNAPPROVED — agent-reviewed only. No human sign-off (`approvedBy`) is recorded for any item
        on this page. Nothing here grants approval, and these papers are not reachable by a family
        user.
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-700 sm:grid-cols-4">
        <div>
          <dt className="font-medium">Questions</dt>
          <dd>{config.questionCount}</dd>
        </div>
        <div>
          <dt className="font-medium">Marks</dt>
          <dd>{totalMarks}</dd>
        </div>
        <div>
          <dt className="font-medium">Time</dt>
          <dd>{config.timeMinutes} min</dd>
        </div>
        <div>
          <dt className="font-medium">Items with findings</dt>
          <dd>{flagged}</dd>
        </div>
      </dl>

      <ol className="mt-8 space-y-6">
        {config.pinnedQuestions.map((pin, index) => {
          const authored = authoring[index];
          const q = authored as unknown as { explanation?: string; metadata?: { skill?: string } };
          return (
            <ReviewQuestionCard
              key={pin.id}
              slot={pin.slot}
              question={candidates[index]}
              marks={pin.marks}
              skill={q.metadata?.skill ?? ""}
              answerSummary={describeAnswer(authored)}
              explanation={q.explanation ?? ""}
              findings={findingsForQuestion(authored)}
            />
          );
        })}
      </ol>
    </main>
  );
}
