import type { Metadata } from "next";

import { StitchFrame } from "../StitchFrame";

export const metadata: Metadata = {
  title: "Prototype: Lesson",
};

export default function LessonPrototypePage() {
  return (
    <StitchFrame
      src="/prototype/stitch/lesson.html"
      title="Lesson: Equivalent Fractions - Learning Hub"
    />
  );
}
