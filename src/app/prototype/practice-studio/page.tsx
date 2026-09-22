import type { Metadata } from "next";

import { StitchFrame } from "../StitchFrame";

export const metadata: Metadata = {
  title: "Prototype: Practice Studio",
};

export default function PracticeStudioPrototypePage() {
  return (
    <StitchFrame
      src="/prototype/stitch/practice-studio.html"
      title="Practice Studio: Equivalent Fractions Runner"
    />
  );
}
