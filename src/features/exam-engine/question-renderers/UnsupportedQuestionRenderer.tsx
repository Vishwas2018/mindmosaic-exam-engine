import type { QuestionRendererProps } from "@/features/exam-engine/types";
import { humaniseIdentifier } from "@/lib/utils";

export function UnsupportedQuestionRenderer({
  question,
}: QuestionRendererProps) {
  return (
    <section
      role="status"
      aria-live="polite"
      className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950"
    >
      <h2 className="font-semibold">Question renderer coming soon</h2>
      <p className="mt-1 text-sm">
        The {humaniseIdentifier(question.type)} question is available in the bank,
        but its interactive renderer will be added in the next phase.
      </p>
    </section>
  );
}
