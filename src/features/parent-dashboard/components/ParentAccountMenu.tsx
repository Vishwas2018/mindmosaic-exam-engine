"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/features/auth/AuthProvider";

import { pFocus } from "./parent-ui";

/**
 * The avatar at the right of the parent header (Claude Design parent artboards): the parent's initial in a 36px
 * tinted tile. It opens a small menu with the account page and a real sign-out, so signing out stays one click
 * away even though the design shows only the initial.
 */
export function ParentAccountMenu() {
  const { status, displayName, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (status !== "authenticated") return null;
  const name = displayName?.trim() || "Your account";
  const initial = name.charAt(0).toUpperCase();

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/signed-out");
    router.refresh();
  }

  const item = twMerge(
    "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-[14.5px] font-medium text-mm-ink hover:bg-mm-tint-soft",
    pFocus,
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${name}: account menu`}
        onClick={() => setOpen((v) => !v)}
        className={twMerge(
          "grid h-11 w-11 place-items-center rounded-xl text-[15px] font-semibold text-mm-brand",
          pFocus,
        )}
      >
        <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-[10px] bg-mm-tint">
          {initial}
        </span>
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-60 rounded-2xl border border-mm-line bg-white p-1.5 shadow-[0_24px_60px_rgba(24,21,31,0.16)]"
        >
          <p className="truncate px-3 pt-2 pb-1.5 text-[13px] text-mm-muted">{name}</p>
          <Link role="menuitem" href="/parent/account" className={item} onClick={() => setOpen(false)}>
            <UserRound aria-hidden="true" className="h-4 w-4 text-mm-brand" />
            Account
          </Link>
          <button role="menuitem" type="button" className={item} onClick={() => void handleSignOut()}>
            <LogOut aria-hidden="true" className="h-4 w-4 text-mm-brand" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
