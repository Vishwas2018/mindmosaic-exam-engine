import type { Metadata } from "next";
import type { ReactNode } from "react";

import { requireRole } from "@/features/auth/require-role";
import { requireActiveSubscription } from "@/features/billing/require-active-subscription";

/*
 * Same gate as src/app/student/layout.tsx. These pages live under /writing, not
 * /student, because /student has a loading.tsx and these pages call
 * notFound(): a Suspense boundary above a notFound() turns its 404 into a 200
 * (src/tests/unit/route-loading-boundaries.test.ts). An unapproved task id
 * must be a real 404, so the gate is repeated here rather than inherited.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function WritingSitLayout({ children }: { children: ReactNode }) {
  const gate = await requireRole("student", "/student");
  if (gate.configured) {
    await requireActiveSubscription(gate.userId, "student");
  }
  return children;
}
