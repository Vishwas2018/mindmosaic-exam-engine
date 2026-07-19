import type { ReactNode } from "react";

import { requireRole } from "@/features/auth/require-role";

/*
 * requireRole() only calls cookies() once Supabase is configured, so a build
 * without env vars would otherwise let Next statically prerender this layout
 * with the auth check baked out entirely. /parent also forces this itself
 * today, but the gate belongs here so it holds regardless.
 */
export const dynamic = "force-dynamic";

export default async function ParentLayout({ children }: { children: ReactNode }) {
  await requireRole("parent", "/parent");
  return children;
}
