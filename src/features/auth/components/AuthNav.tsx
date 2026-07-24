"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";

import { buttonClasses } from "@/components/ui";

import { useAuth } from "../AuthProvider";

/**
 * Auth entry point for site headers. Shows a "Sign in" link for guests and the
 * signed-in learner's name plus a sign-out control once authenticated.
 */
export function AuthNav() {
  const { status, displayName, signOut } = useAuth();
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
    return (
      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 text-sm font-bold text-ink sm:inline-flex">
          <UserRound aria-hidden="true" className="h-4 w-4 text-royal" />
          {displayName}
        </span>
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
