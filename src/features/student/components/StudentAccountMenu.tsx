"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Users } from "lucide-react";

import { useAuth } from "@/features/auth/AuthProvider";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand focus-visible:ring-[6px] focus-visible:ring-mm-brand/15";

/**
 * The student's own account control (Claude Design student artboards: the initial tile in the top bar and the
 * "Name · Year N · account" row at the foot of the sidebar). Opens a menu with "Switch account" for a shared
 * computer and a real sign-out. `trigger` is the visible face; `placement` decides where the menu opens.
 */
export function StudentAccountMenu({
  label,
  trigger,
  placement = "below",
  className,
}: {
  label: string;
  trigger: ReactNode;
  placement?: "below" | "above";
  className?: string;
}) {
  const { signOut } = useAuth();
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

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/signed-out");
    router.refresh();
  }

  const item = `flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-[14.5px] font-medium text-mm-ink hover:bg-mm-tint-soft ${focus}`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className={`${className ?? ""} ${focus}`}
      >
        {trigger}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className={`absolute right-0 z-50 w-56 rounded-2xl border border-mm-line bg-white p-1.5 shadow-[0_24px_60px_rgba(24,21,31,0.16)] ${
            placement === "above" ? "bottom-[calc(100%+6px)] left-0" : "top-[calc(100%+6px)]"
          }`}
        >
          <Link role="menuitem" href="/switch-account" className={item} onClick={() => setOpen(false)}>
            <Users aria-hidden="true" className="h-4 w-4 text-mm-brand" />
            Switch account
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
