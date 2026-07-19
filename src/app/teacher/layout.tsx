import type { ReactNode } from "react";

import { requireRole } from "@/features/auth/require-role";

/*
 * requireRole() only calls cookies() once Supabase is configured, so a build
 * without env vars would otherwise let Next statically prerender this layout
 * with the auth check baked out entirely. Every /teacher page also reads
 * searchParams today, which forces dynamic rendering on its own, but the
 * gate belongs here so it holds regardless of that.
 */
export const dynamic = "force-dynamic";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  await requireRole("teacher", "/teacher");
  return children;
}
