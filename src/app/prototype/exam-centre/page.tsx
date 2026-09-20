import type { Metadata } from "next";

import { StitchFrame } from "../StitchFrame";

export const metadata: Metadata = {
  title: "Prototype: Exam Centre",
};

export default function ExamCentrePrototypePage() {
  return (
    <StitchFrame
      src="/prototype/stitch/exam-centre.html"
      title="Exam Centre: NAPLAN Sample Test & Catalogue"
    />
  );
}
