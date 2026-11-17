"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, CircleHelp, LogOut, Settings, UserRound } from "lucide-react";

import { buttonClasses } from "@/components/ui";
import { useAuth } from "@/features/auth";

const ITEM_CLASS =
  "flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-bold text-ink transition hover:bg-royal/6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20";

/**
 * The account area of the parent header: the parent's name as a menu trigger
 * with the account-level options (help, sign out). Billing is deliberately not
 * repeated here: it is already a main nav destination. Replaces the loose
 * name + "Sign out" button pair, which left sign-out as the only account
 * option and had no place for anything else.
 *
 * Guests (a parent whose session lapsed on a cached page) get a Sign in link.
 */
export function ParentAccountMenu() {
  const { status, displayName, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  if (status !== "authenticated") {
    return (
      <Link href="/sign-in" className={buttonClasses({ variant: "secondary", size: "sm" })}>
        Sign in
      </Link>
    );
  }

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    // signOut() only clears the browser session; re-render so the server-side
    // role gate redirects away from the protected page.
    router.refresh();
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        data-testid="parent-account-trigger"
        className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2.5 text-sm font-bold text-ink transition hover:bg-royal/6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-royal/8 text-royal"
        >
          <UserRound className="h-4 w-4" />
        </span>
        <span className="hidden max-w-32 truncate sm:inline" title={displayName ?? undefined}>
          {displayName ?? "Account"}
        </span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 text-muted" />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-royal/10 bg-white p-1.5 shadow-[0_18px_44px_rgba(30,20,60,0.16)]"
        >
          <Link
            role="menuitem"
            href="/parent/settings"
            onClick={() => setOpen(false)}
            className={ITEM_CLASS}
          >
            <Settings aria-hidden="true" className="h-4 w-4 text-royal" />
            Account settings
          </Link>
          <Link role="menuitem" href="/help" onClick={() => setOpen(false)} className={ITEM_CLASS}>
            <CircleHelp aria-hidden="true" className="h-4 w-4 text-royal" />
            Help
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => void handleSignOut()}
            data-testid="parent-account-sign-out"
            className={ITEM_CLASS}
          >
            <LogOut aria-hidden="true" className="h-4 w-4 text-royal" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
