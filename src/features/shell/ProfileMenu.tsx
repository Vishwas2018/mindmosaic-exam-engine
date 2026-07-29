"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LogOut, User } from "lucide-react";
import { twMerge } from "tailwind-merge";

import type { ShellUser } from "./types";

export interface ProfileMenuProps {
  user: ShellUser;
  onLogout: () => void;
  className?: string;
}

export function ProfileMenu({ user, onLogout, className }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={twMerge("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="true"
        aria-label={`Account menu for ${user.name}`}
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-royal/10 text-royal transition hover:bg-royal/15"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar source is caller-provided and may be any host
          <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <User aria-hidden="true" className="h-5 w-5" />
        )}
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-40 mt-2 w-56 rounded-2xl border border-royal/10 bg-white p-2 shadow-[0_18px_50px_rgba(49,32,86,0.15)]"
        >
          <div className="px-2 py-1.5">
            <p className="truncate text-sm font-extrabold text-ink">{user.name}</p>
            {user.email && <p className="truncate text-xs text-muted">{user.email}</p>}
          </div>
          <div className="my-1 h-px bg-royal/8" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-bold text-error transition hover:bg-error/8"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
