import type { Metadata } from "next";

/* See src/app/exam/layout.tsx for why this lives in a layout rather than
   the (client) page itself. The title is generic — no score or answer
   content — since it's visible before the page's own content loads. */
export const metadata: Metadata = {
  title: "Your results",
  // Personal score/answer data — never worth indexing, robots.ts also
  // disallows /results outright.
  robots: { index: false, follow: false },
};

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
