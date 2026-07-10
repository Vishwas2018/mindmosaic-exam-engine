"use client";

import { createElement } from "react";

import type { QuestionRendererProps } from "@/features/exam-engine/types";

import { questionRendererRegistry } from "./question-renderer-registry";

export function QuestionRenderer(props: QuestionRendererProps) {
  return createElement(
    questionRendererRegistry.resolve(props.question.type),
    props,
  );
}
