"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

import { useAuth } from "../AuthProvider";
import { roleHomeLabel, roleHomePath } from "../roles";

/**
 * A link back to the signed-in user's own role home, for headers that are
 * shared across roles and so can't hard-code one destination — /billing is
 * the case that needs it: it is deliberately reachable by guests, students
 * and parents alike (see src/app/billing/layout.tsx), so its header cannot
 * be the parent shell, which left a parent who navigated to Billing with no
 * link back to /parent at all.
 *
 * Renders nothing for guests, and nothing while the session or the role is
 * still resolving — roleHomePath(null) is "/", which would be a link back
 * to the public site dressed up as a dashboard link.
 */
export function RoleHomeLink({ className }: { className?: string }) {
  const { status, role } = useAuth();
  if (status !== "authenticated" || !role) return null;

  return (
    <Link
      href={roleHomePath(role)}
      className={
        className ??
        "inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-royal transition hover:bg-royal/6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
      }
    >
      <LayoutDashboard aria-hidden="true" className="h-4 w-4" />
      {roleHomeLabel(role)}
    </Link>
  );
}
