import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Dev - Student canvas preview",
  robots: { index: false, follow: false },
};

/*
 * Evaluated per request, never frozen into a static build: a deployed build must answer 404 whatever the build-time
 * environment was. Same posture as /dev/routes (defect A-12, audit 2026-11-17).
 */
export const dynamic = "force-dynamic";

export default function StudentPreviewLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
