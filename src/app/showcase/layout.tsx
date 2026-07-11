import type { Metadata } from "next";

/* See src/app/exam/layout.tsx for why this lives in a layout rather than
   the (client) page itself. */
export const metadata: Metadata = {
  title: "Renderer showcase",
  description:
    "Every MindMosaic question and visual renderer, interactive — a developer and QA reference, not a practice exam.",
};

export default function ShowcaseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
