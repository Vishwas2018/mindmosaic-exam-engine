import type { ReactNode } from "react";

import { requireRole } from "@/features/auth/require-role";

/*
 * requireRole() only calls cookies() once Supabase is configured, so a build
 * without env vars would otherwise let Next statically prerender this layout
 * with the auth check baked out entirely. Every /student page also forces
 * this itself today, but the gate belongs here so it holds regardless.
 */
export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  await requireRole("student", "/student");
  return children;
}
