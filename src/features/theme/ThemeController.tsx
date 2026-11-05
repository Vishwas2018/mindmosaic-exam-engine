"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

import {
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  effectiveTheme,
  parsePreference,
  type ThemePreference,
} from "./theme";

function readPreference(): ThemePreference {
  try {
    return parsePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "light";
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The stored preference, shared by every component that shows or changes it. Light on the server. */
export function useThemePreference(): [ThemePreference, (next: ThemePreference) => void] {
  const preference = useSyncExternalStore(subscribe, readPreference, () => "light" as ThemePreference);
  const setPreference = (next: ThemePreference) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* Storage can be unavailable (private windows); the choice then lasts only until reload. */
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };
  return [preference, setPreference];
}

/**
 * Keeps <html data-theme> in step with the preference and the current route: client navigation between a
 * dark-ready page and one that is not flips it, which the pre-paint script (first load only) cannot do.
 */
export function ThemeController() {
  const pathname = usePathname();
  const [preference] = useThemePreference();

  useEffect(() => {
    const theme = effectiveTheme(preference, pathname);
    const root = document.documentElement;
    if (theme === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
  }, [preference, pathname]);

  return null;
}
