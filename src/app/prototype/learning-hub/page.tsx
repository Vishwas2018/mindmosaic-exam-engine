import type { Metadata } from "next";

import { StitchFrame } from "../StitchFrame";

export const metadata: Metadata = {
  title: "Prototype: Learning Hub",
};

export default function LearningHubPrototypePage() {
  return (
    <StitchFrame
      src="/prototype/stitch/learning-hub.html"
      title="Learning Hub - Catalogue & Pathways"
    />
  );
}
