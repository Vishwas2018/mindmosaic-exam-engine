import type { Metadata } from "next";
import type { ReactNode } from "react";

import { requireActiveSubscription } from "@/features/billing/require-active-subscription";
import { requireRole } from "@/features/auth/require-role";
import { isStudentPreviewEnabled } from "@/features/student/preview-mode";

/*
 * requireRole() only calls cookies() once Supabase is configured, so a build
 * without env vars would otherwise let Next statically prerender this layout
 * with the auth check baked out entirely. Every /student page also forces
 * this itself today, but the gate belongs here so it holds regardless.
 */
export const dynamic = "force-dynamic";

// Gated by requireRole above; robots.ts also disallows /student, but this
// keeps a search engine from indexing it even if that rule is ever relaxed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function StudentLayout({ children }: { children: ReactNode }) {
  if (await isStudentPreviewEnabled()) {
    return (
      <div className="relative min-h-screen">
        <div
          role="status"
          className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs font-medium text-amber-900"
        >
          <strong className="font-bold">Student Workspace Preview:</strong> Showing sample student experience (Aisha Raman · Year 3) in local preview mode. No live student records or auth are accessed.
        </div>
        {children}
      </div>
    );
  }

  const gate = await requireRole("student", "/student");
  if (gate.configured) {
    await requireActiveSubscription(gate.userId, "student");
  }
  return children;
}
