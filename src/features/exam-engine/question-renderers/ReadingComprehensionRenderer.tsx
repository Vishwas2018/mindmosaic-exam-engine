"use client";

import type { QuestionRendererProps } from "@/features/exam-engine/types";

import { MultipleChoiceRenderer } from "./MultipleChoiceRenderer";
import { MultipleSelectRenderer } from "./MultipleSelectRenderer";
import { ShortAnswerRenderer } from "./ShortAnswerRenderer";
import { TrueFalseRenderer } from "./TrueFalseRenderer";
import { toDomId } from "./renderer-utils";

function InnerControl(props: QuestionRendererProps) {
  switch (props.question.answerKey.kind) {
    case "single_option":
      return <MultipleChoiceRenderer {...props} />;
    case "multiple_options":
      return <MultipleSelectRenderer {...props} />;
    case "boolean":
      return <TrueFalseRenderer {...props} />;
    default:
      return <ShortAnswerRenderer {...props} />;
  }
}

export function ReadingComprehensionRenderer(props: QuestionRendererProps) {
  const { question } = props;
  const passageId = `${toDomId(question.id)}-passage`;
  const headingId = `${passageId}-heading`;

  return (
    <div className="space-y-6">
      {question.stimulus ? (
        <section
          aria-labelledby={headingId}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
        >
          <h3 id={headingId} className="text-base font-semibold text-slate-900">
            {question.stimulus.title ?? "Reading passage"}
          </h3>
          <p
            id={passageId}
            className="mt-3 whitespace-pre-wrap leading-7 text-slate-700"
          >
            {question.stimulus.body}
          </p>
          <p className="mt-3 text-xs font-medium text-slate-500">
            {question.stimulus.attribution}
          </p>
        </section>
      ) : null}
      <div aria-describedby={question.stimulus ? passageId : undefined}>
        <InnerControl {...props} />
      </div>
    </div>
  );
}
