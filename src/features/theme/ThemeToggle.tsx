"use client";

import { Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

import { useThemePreference } from "./ThemeController";
import { isDarkReadyPath } from "./theme";

/**
 * The Night mode switch. Renders nothing on a route that does not honour it (see theme.ts), so there is never
 * a control that does nothing.
 *
 *  - `icon`: a 44px icon button for a header.
 *  - `row`: a full-width menu row with its label and state, for a mobile menu.
 */
export function ThemeToggle({ variant = "icon", className = "" }: { variant?: "icon" | "row"; className?: string }) {
  const pathname = usePathname();
  const [preference, setPreference] = useThemePreference();
  if (!isDarkReadyPath(pathname)) return null;

  const dark = preference === "dark";
  const toggle = () => setPreference(dark ? "light" : "dark");
  const Icon = dark ? Sun : Moon;

  if (variant === "row") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={dark}
        onClick={toggle}
        data-testid="theme-toggle"
        className={cn(
          "flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm font-bold text-ink transition hover:bg-royal/6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20",
          className,
        )}
      >
        <span className="inline-flex items-center gap-2.5">
          <Icon aria-hidden="true" className="h-4 w-4" />
          Night mode
        </span>
        <span className="text-xs font-semibold text-muted">{dark ? "On" : "Off"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Night mode"
      title={dark ? "Switch to light mode" : "Switch to night mode"}
      onClick={toggle}
      data-testid="theme-toggle"
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink transition hover:bg-royal/6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20",
        className,
      )}
    >
      <Icon aria-hidden="true" className="h-5 w-5" />
    </button>
  );
}
