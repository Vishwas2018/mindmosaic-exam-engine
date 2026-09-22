import type { Metadata } from "next";

import { StitchFrame } from "../StitchFrame";

export const metadata: Metadata = {
  title: "Prototype: My Progress",
};

export default function ProgressPrototypePage() {
  return (
    <StitchFrame
      src="/prototype/stitch/progress.html"
      title="My Progress & Attempt Review"
    />
  );
}
