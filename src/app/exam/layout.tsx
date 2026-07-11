import type { Metadata } from "next";

/*
 * /exam is a client component (it reads live session state), so it can't
 * export `metadata` itself — only Server Components can. This sibling
 * layout carries the route's title instead; it reveals nothing about the
 * in-progress session (no question content, no score).
 */
export const metadata: Metadata = {
  title: "Exam in progress",
};

export default function ExamLayout({ children }: { children: React.ReactNode }) {
  return children;
}
