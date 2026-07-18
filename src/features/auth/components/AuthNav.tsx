"use client";

import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";

import { buttonClasses } from "@/components/ui";

import { useAuth } from "../AuthProvider";

/**
 * Auth entry point for site headers. Shows a "Sign in" link for guests and the
 * signed-in learner's name plus a sign-out control once authenticated.
 */
export function AuthNav() {
  const { status, displayName, signOut } = useAuth();

  if (status === "authenticated") {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 text-sm font-bold text-ink sm:inline-flex">
          <UserRound aria-hidden="true" className="h-4 w-4 text-royal" />
          {displayName}
        </span>
        <button
          type="button"
          onClick={() => void signOut()}
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
