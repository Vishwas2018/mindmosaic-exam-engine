import type { Metadata } from "next";
import type { ReactNode } from "react";

import { requireRole } from "@/features/auth/require-role";
import { requireActiveSubscription } from "@/features/billing/require-active-subscription";

/*
 * Same gate as src/app/parent/layout.tsx, repeated here for the reason given in
 * src/app/writing/sit/layout.tsx: this page calls notFound() and so cannot sit
 * under /parent, which has a loading.tsx.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function WritingMarkLayout({ children }: { children: ReactNode }) {
  const gate = await requireRole("parent", "/parent");
  if (gate.configured) {
    await requireActiveSubscription(gate.userId, "parent");
  }
  return children;
}
