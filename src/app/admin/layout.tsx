import type { Metadata } from "next";
import type { ReactNode } from "react";

import { requireRole } from "@/features/auth/require-role";

/*
 * requireRole() only calls cookies() once Supabase is configured, so a build
 * without env vars would otherwise let Next statically prerender this layout
 * with the auth check baked out entirely — the exact bug this batch closes,
 * on the one route (/admin) that had no per-page dynamic export of its own.
 */
export const dynamic = "force-dynamic";

// Gated by requireRole above; robots.ts also disallows /admin, but this
// keeps a search engine from indexing it even if that rule is ever relaxed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole("admin", "/admin");
  return children;
}
