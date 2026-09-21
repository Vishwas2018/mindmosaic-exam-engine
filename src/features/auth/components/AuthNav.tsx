"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, UserRound } from "lucide-react";

import { buttonClasses } from "@/components/ui";

import { useAuth } from "../AuthProvider";
import { roleHomeLabel, roleHomePath } from "../roles";

/**
 * Auth entry point for site headers. Shows a "Sign in" link for guests and the
 * signed-in learner's name, a link back to their own dashboard, and a
 * sign-out control once authenticated.
 *
 * `showRoleHome` exists for the role shells (StudentShell, ParentShell,
 * TeacherShell), whose own nav already carries a link to that dashboard —
 * they pass `false` so the header doesn't offer the same destination twice.
 * It defaults to true so every *other* header that mounts AuthNav (the
 * /practice catalogue, /practice/[program] and /billing, none of which have
 * a nav of their own) gets the way back without opting in: a signed-in
 * student who reached /practice from the marketing site previously had
 * "Sign out" as the only control on the page.
 */
export function AuthNav({ showRoleHome = true }: { showRoleHome?: boolean } = {}) {
  const { status, role, displayName, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    /*
     * signOut() only clears the browser Supabase client's session — it
     * doesn't touch whatever Server Component tree is already sitting in
     * the DOM. Protected pages (/parent, /student, etc.) are gated by a
     * server-side requireRole() check that redirects to /sign-in, but that
     * check only runs when the server re-renders the route. router.refresh()
     * forces exactly that re-render for the current URL, so a signed-out
     * user on a protected page is redirected to /sign-in — and the stale
     * "Parent"/role badge and dashboard content never linger in the DOM.
     */
    router.refresh();
  }

  if (status === "authenticated") {
    /*
     * `role` lands one query after `status`, so until it arrives there is no
     * honest destination — roleHomePath(null) is "/", a link to the marketing
     * site rather than to the dashboard the label promises.
     */
    const showDashboard = showRoleHome && Boolean(role);
    return (
      <div className="flex items-center gap-2">
        <span className="hidden min-w-0 items-center gap-1.5 text-sm font-bold text-ink sm:inline-flex">
          <UserRound aria-hidden="true" className="h-4 w-4 shrink-0 text-royal" />
          {/*
            Unbounded before: a long-but-plausible display name (seeded
            fixtures use "Parent Multi Children", "Student Completed
            Attempt") could push ParentShell/StudentShell's header past its
            available width at the 768-1024px range where the wide nav is
            shown — invisible on this host's font metrics, real on Linux
            CI's (e2e-auth a11y-parent-dashboard / a11y-student-dashboard
            "/student/assignments", 2026-09-21). Truncating removes the
            unbounded growth regardless of platform text-width rounding.
          */}
          <span className="max-w-[9rem] truncate" title={displayName ?? undefined}>
            {displayName}
          </span>
        </span>
        {showDashboard && (
          <Link
            href={roleHomePath(role)}
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            <LayoutDashboard aria-hidden="true" className="h-4 w-4" />
            {roleHomeLabel(role)}
          </Link>
        )}
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className={buttonClasses({ variant: "secondary", size: "sm" })}
        >
          <LogOut aria-hidden="true" className="h-4 w-4" />
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link href="/sign-in" className={buttonClasses({ variant: "secondary", size: "sm" })}>
      Sign in
    </Link>
  );
}
